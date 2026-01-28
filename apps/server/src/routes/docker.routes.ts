// apps/server/src/routes/docker.routes.ts
import { Router } from 'express';
import { listImages } from '@/controllers/docker.controller';

const router = Router();

router.get('/images', listImages);

export const dockerRouter = router;
