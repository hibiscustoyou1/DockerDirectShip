// apps/server/src/controllers/server.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Client } from 'ssh2';
import { ApiCode, ApiResponse, CreateServerDto, UpdateServerDto, ServerTestResult } from '@repo/shared';
import { encrypt, decrypt } from '@/utils/crypto';

const prisma = new PrismaClient();

// 列表查询
export const listServers = async (_req: Request, res: Response<ApiResponse>) => {
  try {
    const servers = await prisma.server.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    // 脱敏返回
    const safeServers = servers.map(s => ({
      ...s,
      password: s.password ? '******' : null,
      privateKey: s.privateKey ? '******' : null,
    }));
    
    res.json({ code: ApiCode.SUCCESS, data: safeServers });
  } catch (error) {
    res.status(500).json({ code: ApiCode.FAIL, msg: '获取服务器列表失败' });
  }
};

export const getServer = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const server = await prisma.server.findUnique({ where: { id: Number(id) } });
    if (!server) {
      return res.status(404).json({ code: ApiCode.NOT_FOUND, msg: 'Server not found' });
    }
    // 脱敏
    const safeServer = {
      ...server,
      password: server.password ? '******' : null,
      privateKey: server.privateKey ? '******' : null,
    };
    res.json({ code: ApiCode.SUCCESS, data: safeServer });
  } catch (error) {
    res.status(500).json({ code: ApiCode.FAIL, msg: '获取服务器详情失败' });
  }
};

// 创建服务器
export const createServer = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const dto: CreateServerDto = req.body;
    
    // 加密敏感字段
    const password = dto.password ? encrypt(dto.password) : null;
    const privateKey = dto.privateKey ? encrypt(dto.privateKey) : null;
    
    const server = await prisma.server.create({
      data: {
        ...dto,
        password,
        privateKey
      }
    });
    
    res.json({ code: ApiCode.SUCCESS, data: server });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: ApiCode.FAIL, msg: '创建服务器失败' });
  }
};

// 删除服务器
export const deleteServer = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    await prisma.server.delete({ where: { id: Number(id) } });
    res.json({ code: ApiCode.SUCCESS, msg: '删除成功' });
  } catch (error) {
    res.status(500).json({ code: ApiCode.FAIL, msg: '删除失败' });
  }
};

// 测试连接
export const testConnection = async (req: Request, res: Response<ApiResponse<ServerTestResult>>) => {
  const { id } = req.params;
  
  try {
    const server = await prisma.server.findUnique({ where: { id: Number(id) } });
    if (!server) {
      return res.status(404).json({ code: ApiCode.NOT_FOUND, msg: '服务器不存在' });
    }
    
    const conn = new Client();
    const startTime = Date.now();
    
    const config: any = {
      host: server.host,
      port: server.port,
      username: server.username,
      readyTimeout: 5000, // 5s 超时
    };
    
    if (server.authType === 'password' && server.password) {
      config.password = decrypt(server.password);
    } else if (server.authType === 'privateKey' && server.privateKey) {
      config.privateKey = decrypt(server.privateKey);
    }
    
    conn.on('ready', () => {
      const latency = Date.now() - startTime;
      conn.end();
      res.json({
        code: ApiCode.SUCCESS,
        data: { success: true, latencyMs: latency, message: '连接成功' }
      });
    }).on('error', (err) => {
      res.json({
        code: ApiCode.SUCCESS, // 这里返回 200，但在 data 里标记 success: false，方便前端处理业务逻辑
        data: { success: false, message: `连接失败: ${err.message}` }
      });
    }).connect(config);
    
  } catch (error) {
    res.status(500).json({ code: ApiCode.FAIL, msg: '测试过程出错' });
  }
};
