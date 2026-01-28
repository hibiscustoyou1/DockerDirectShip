import { Client } from 'ssh2';
import { PrismaClient } from '@prisma/client';
import { decrypt } from '@/utils/crypto';
import type { RemoteContainer } from '@repo/shared';

const prisma = new PrismaClient();

export class RemoteService {
  /**
   * 获取远程容器列表
   */
  public static async listContainers(serverId: number): Promise<RemoteContainer[]> {
    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) throw new Error('服务器不存在');
    
    const conn = new Client();
    
    const config: any = {
      host: server.host,
      port: server.port,
      username: server.username,
      readyTimeout: 10000,
    };
    
    if (server.authType === 'password' && server.password) {
      config.password = decrypt(server.password);
    } else if (server.authType === 'privateKey' && server.privateKey) {
      config.privateKey = decrypt(server.privateKey);
    }
    
    return new Promise((resolve, reject) => {
      conn.on('ready', () => {
        // 使用 --format '{{json .}}' 获取易于解析的 JSON 格式
        // -a 显示所有容器 (包括已停止的)
        conn.exec('docker ps -a --format "{{json .}}"', (err, stream) => {
          if (err) {
            conn.end();
            return reject(err);
          }
          
          let output = '';
          stream.on('data', (data: Buffer) => {
            output += data.toString();
          }).on('close', (code: number) => {
            conn.end();
            if (code !== 0) {
              return reject(new Error(`Docker command failed with code ${code}`));
            }
            
            // 解析 NDJSON (Newline Delimited JSON)
            const containers: RemoteContainer[] = [];
            const lines = output.trim().split('\n');
            
            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                containers.push(JSON.parse(line));
              } catch (e) {
                console.warn('Failed to parse container line:', line);
              }
            }
            resolve(containers);
          }).stderr.on('data', (data: Buffer) => {
            console.error('Remote Docker Error:', data.toString());
          });
        });
      }).on('error', (err) => {
        reject(err);
      }).connect(config);
    });
  }
}
