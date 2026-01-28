import { Router } from 'express';
import { getContainers } from '@/controllers/remote.controller';

const router = Router();

// 远程操作相关的路由前缀建议区分，比如 /api/remote/servers/:id/...
// 或者直接挂在 /api/servers/:id/containers
router.get('/servers/:id/containers', getContainers);

export const remoteRouter = router;
