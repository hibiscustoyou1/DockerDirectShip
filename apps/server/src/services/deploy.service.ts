import { WebSocket } from 'ws';
import Docker from 'dockerode';
import { Client } from 'ssh2';
import { PrismaClient } from '@prisma/client';
import { decrypt } from '@/utils/crypto';
import zlib from 'zlib';
import { WsMessage } from '@repo/shared';

const prisma = new PrismaClient();
const docker = new Docker();

interface DeployOptions {
  imageId: string;
  serverId: number;
  repository: string;
  tag: string;
  ws: WebSocket;
}

export class DeployService {
  private static send(ws: WebSocket, type: WsMessage['type'], payload?: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    }
  }
  
  // 执行远程命令辅助函数
  private static async execCommand(ssh: Client, command: string, ws: WebSocket): Promise<void> {
    return new Promise((resolve, reject) => {
      ssh.exec(command, (err, stream) => {
        if (err) return reject(err);
        
        stream.on('close', (code: number) => {
          if (code === 0) resolve();
          else reject(new Error(`远程命令执行失败 (Exit: ${code})`));
        }).on('data', (data: Buffer) => {
          this.send(ws, 'LOG', { message: `[Remote] ${data.toString().trim()}` });
        }).stderr.on('data', (data: Buffer) => {
          this.send(ws, 'LOG', { message: `[Remote] ${data.toString().trim()}` });
        });
      });
    });
  }
  
  public static async startDeploy({ imageId, serverId, repository, tag, ws }: DeployOptions) {
    let sshClient: Client | null = null;
    
    try {
      this.send(ws, 'LOG', { message: `🚀 开始部署任务: ${repository}:${tag}` });
      
      const server = await prisma.server.findUnique({ where: { id: serverId } });
      if (!server) throw new Error('服务器不存在');
      
      const image = docker.getImage(imageId);
      const inspect = await image.inspect();
      const totalSize = inspect.Size || inspect.VirtualSize || 0;
      this.send(ws, 'LOG', { message: `📦 镜像大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB` });
      
      this.send(ws, 'LOG', { message: `🔌 连接服务器 ${server.host}...` });
      
      sshClient = new Client();
      const sshConfig: any = {
        host: server.host,
        port: server.port,
        username: server.username,
        readyTimeout: 10000,
        keepaliveInterval: 5000, // [Fix] 核心修复：每5秒发送心跳，防止 load 期间连接断开
      };
      
      if (server.authType === 'password' && server.password) {
        sshConfig.password = decrypt(server.password);
      } else if (server.authType === 'privateKey' && server.privateKey) {
        sshConfig.privateKey = decrypt(server.privateKey);
      }
      
      await new Promise<void>((resolve, reject) => {
        sshClient!.on('ready', resolve).on('error', reject).connect(sshConfig);
      });
      
      this.send(ws, 'LOG', { message: `✅ SSH 连接成功` });
      this.send(ws, 'LOG', { message: `📤 正在上传并解压镜像...` });
      
      const dockerStream = await image.get();
      const gzip = zlib.createGzip();
      const loadCmd = 'gunzip | docker load';
      
      // 监听 Gzip 结束，提示用户上传已完成
      gzip.on('end', () => {
        this.send(ws, 'LOG', { message: `⏳ 数据传输完成，远程正在加载镜像 (磁盘I/O可能耗时较长，请勿关闭)...` });
      });
      
      await new Promise<void>((resolve, reject) => {
        sshClient!.exec(loadCmd, (err, sshStream) => {
          if (err) return reject(err);
          
          sshStream.on('close', (code: number) => {
            if (code === 0) resolve();
            else reject(new Error(`Docker load exited with code ${code}`));
          });
          
          // 转发远程输出
          sshStream.on('data', (data: Buffer) => this.send(ws, 'LOG', { message: `[Remote] ${data.toString().trim()}` }));
          sshStream.stderr.on('data', (data: Buffer) => this.send(ws, 'LOG', { message: `[Remote] ${data.toString().trim()}` }));
          
          // 进度计算
          let transferred = 0;
          let lastTime = Date.now();
          let lastTransferred = 0;
          
          dockerStream.on('data', (chunk: Buffer) => {
            transferred += chunk.length;
            const now = Date.now();
            if (now - lastTime >= 500) {
              const speed = (transferred - lastTransferred) / ((now - lastTime) / 1000);
              const speedStr = (speed / 1024 / 1024).toFixed(2) + ' MB/s';
              this.send(ws, 'PROGRESS', {
                currentBytes: transferred,
                totalBytes: totalSize,
                percent: Math.min(Math.round((transferred / totalSize) * 100), 99),
                rate: speedStr
              });
              lastTime = now;
              lastTransferred = transferred;
            }
          });
          
          dockerStream.pipe(gzip).pipe(sshStream);
        });
      });
      
      this.send(ws, 'LOG', { message: `✅ 镜像加载完成` });
      
      // [Fix] 远程重命名 (解决 <none> 问题)
      if (repository && repository !== '<none>' && tag && tag !== '<none>') {
        this.send(ws, 'LOG', { message: `🏷️ 正在应用标签: ${repository}:${tag}` });
        const tagCmd = `docker tag ${imageId} ${repository}:${tag}`;
        await this.execCommand(sshClient!, tagCmd, ws);
      }
      
      this.send(ws, 'SUCCESS', { message: '✨ 部署流程全部完成!' });
      
    } catch (error: any) {
      console.error('Deploy Error:', error);
      this.send(ws, 'ERROR', { message: error.message || '部署失败' });
    } finally {
      sshClient?.end();
    }
  }
}
