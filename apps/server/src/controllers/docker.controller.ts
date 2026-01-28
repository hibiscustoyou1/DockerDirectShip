import { Request, Response } from 'express';
import Docker from 'dockerode';
import { ApiCode, ApiResponse, DockerImage } from '@repo/shared';

// 默认连接 /var/run/docker.sock (Linux/Mac) 或 //./pipe/docker_engine (Windows)
const docker = new Docker();

export const listImages = async (_req: Request, res: Response<ApiResponse<DockerImage[]>>) => {
  try {
    const images = await docker.listImages();
    
    // 数据清洗与扁平化
    const flatImages: DockerImage[] = [];
    
    images.forEach((img) => {
      // 一个镜像可能有多个 Tag (RepoTags)，需要展开显示
      // 如果是悬空镜像 (dangling), RepoTags 可能为 null
      const repoTags = img.RepoTags || ['<none>:<none>'];
      
      repoTags.forEach((tagStr) => {
        // [FIX] 使用 lastIndexOf 处理带有端口号的镜像名 (e.g. localhost:5000/image:tag)
        const lastColonIndex = tagStr.lastIndexOf(':');
        
        let repo = '<none>';
        let tag = '<none>';
        
        if (lastColonIndex > -1) {
          repo = tagStr.substring(0, lastColonIndex);
          tag = tagStr.substring(lastColonIndex + 1);
        } else {
          repo = tagStr; // 只有名没有 tag 的情况（罕见）
        }
        
        flatImages.push({
          id: img.Id, // 通常是 "sha256:..."
          repository: repo,
          tag: tag,
          size: img.Size,
          created: img.Created,
          virtualSize: img.VirtualSize
        });
      });
    });
    
    console.log(`[Docker] Fetched ${flatImages.length} images.`);
    
    res.json({
      code: ApiCode.SUCCESS,
      data: flatImages
    });
  } catch (error: any) {
    console.error('Docker Error:', error);
    res.status(500).json({
      code: ApiCode.FAIL,
      msg: error.message || '无法获取本地镜像，请检查 Docker 是否运行'
    });
  }
};
