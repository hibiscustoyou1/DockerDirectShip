// apps/server/src/routes/server.routes.ts
import { Router } from 'express';
import { listServers, createServer, deleteServer, testConnection } from '@/controllers/server.controller';

const router = Router();

router.get('/servers', listServers);
router.post('/servers', createServer);
router.delete('/servers/:id', deleteServer);
router.post('/servers/:id/test', testConnection);

export const serverRouter = router;
