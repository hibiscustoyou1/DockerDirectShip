import { Request, Response } from 'express';
import { ApiCode, ApiResponse } from '@repo/shared';
import { RemoteService } from '@/services/remote.service';

export const getContainers = async (req: Request, res: Response<ApiResponse>) => {
  const { id } = req.params;
  try {
    const containers = await RemoteService.listContainers(Number(id));
    res.json({
      code: ApiCode.SUCCESS,
      data: containers
    });
  } catch (error: any) {
    console.error('Remote Error:', error);
    res.status(500).json({
      code: ApiCode.FAIL,
      msg: error.message || '无法获取远程容器列表'
    });
  }
};
