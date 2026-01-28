import { WebSocket } from 'ws';
import Docker from 'dockerode';
import { Client } from 'ssh2';
import { PrismaClient } from '@prisma/client';
import { decrypt } from '@/utils/crypto';
import zlib from 'zlib';
import { WsMessage, ProgressPayload } from '@repo/shared';

const prisma = new PrismaClient();
const docker = new Docker();

interface DeployOptions {
  imageId: string;
  serverId: number;
  ws: WebSocket;
}

export class DeployService {
  /**
   * 发送 WS 消息的辅助函数
   */
  private static send(ws: WebSocket, type: WsMessage['type'], payload?: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    }
  }
  
  /**
   * 执行部署任务
   */
  public static async startDeploy({ imageId, serverId, ws }: DeployOptions) {
    let sshClient: Client | null = null;
    
    try {
      this.send(ws, 'LOG', { message: `🚀 开始部署任务 [Image: ${imageId.substring(0, 12)}]` });
      
      // 1. 获取服务器信息
      const server = await prisma.server.findUnique({ where: { id: serverId } });
      if (!server) throw new Error('服务器不存在');
      
      // 2. 获取镜像信息 (为了计算进度)
      const image = docker.getImage(imageId);
      const inspect = await image.inspect();
      const totalSize = inspect.Size || inspect.VirtualSize || 0;
      this.send(ws, 'LOG', { message: `📦 镜像大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB` });
      
      // 3. 建立 SSH 连接
      this.send(ws, 'LOG', { message: `🔌 连接服务器 ${server.host}...` });
      
      sshClient = new Client();
      
      const sshConfig: any = {
        host: server.host,
        port: server.port,
        username: server.username,
        readyTimeout: 10000,
      };
      
      if (server.authType === 'password' && server.password) {
        sshConfig.password = decrypt(server.password);
      } else if (server.authType === 'privateKey' && server.privateKey) {
        sshConfig.privateKey = decrypt(server.privateKey);
      }
      
      await new Promise<void>((resolve, reject) => {
        sshClient!
        .on('ready', resolve)
        .on('error', reject)
        .connect(sshConfig);
      });
      
      this.send(ws, 'LOG', { message: `✅ SSH 连接成功` });
      
      // 4. 准备流式传输
      // Pipeline: Docker Read Stream -> Gzip -> SSH Exec (gunzip | docker load)
      
      this.send(ws, 'LOG', { message: `📤 导出镜像并启用 Gzip 压缩...` });
      const dockerStream = await image.get();
      const gzip = zlib.createGzip();
      
      // 在远程执行命令: 解压并加载
      // 注意：确保远程机器安装了 docker 和 gunzip (通常 Linux 都有)
      const remoteCmd = 'gunzip | docker load';
      
      this.send(ws, 'LOG', { message: `execute: ${remoteCmd}` });
      
      sshClient.exec(remoteCmd, (err, sshStream) => {
        if (err) throw err;
        
        // 监听远程输出 (stdout/stderr)
        sshStream.on('data', (data: Buffer) => {
          this.send(ws, 'LOG', { message: `[Remote] ${data.toString().trim()}` });
        });
        sshStream.stderr.on('data', (data: Buffer) => {
          this.send(ws, 'LOG', { message: `[Remote] ${data.toString().trim()}` });
        });
        
        sshStream.on('close', (code: number, signal: any) => {
          if (code === 0) {
            this.send(ws, 'SUCCESS', { message: '镜像部署成功!' });
          } else {
            this.send(ws, 'ERROR', { message: `远程命令退出，代码: ${code}` });
          }
          sshClient?.end();
        });
        
        // --- 核心传输逻辑 ---
        let transferred = 0;
        let lastTime = Date.now();
        let lastTransferred = 0;
        
        // 监听 Docker 读取流的数据块来计算进度
        dockerStream.on('data', (chunk: Buffer) => {
          transferred += chunk.length;
          
          const now = Date.now();
          if (now - lastTime >= 500) { // 每 500ms 发送一次进度
            const deltaBytes = transferred - lastTransferred;
            const dt = (now - lastTime) / 1000;
            const speed = deltaBytes / dt; // bytes per second
            
            // 格式化速度
            const speedStr = (speed / 1024 / 1024).toFixed(2) + ' MB/s';
            
            const progress: ProgressPayload = {
              currentBytes: transferred,
              totalBytes: totalSize, // 注意：Docker save 的流大小可能略大于 image inspect size，这里仅做估算
              percent: Math.min(Math.round((transferred / totalSize) * 100), 99), // 留 1% 给远程加载
              rate: speedStr
            };
            
            this.send(ws, 'PROGRESS', progress);
            
            lastTime = now;
            lastTransferred = transferred;
          }
        });
        
        // 管道连接
        // Local Docker -> Monitor -> Gzip -> SSH
        dockerStream.pipe(gzip).pipe(sshStream);
      });
      
    } catch (error: any) {
      console.error('Deploy Error:', error);
      this.send(ws, 'ERROR', { message: error.message || '部署过程发生未知错误' });
      sshClient?.end();
    }
  }
}
