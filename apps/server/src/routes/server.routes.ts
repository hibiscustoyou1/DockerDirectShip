import { Router } from 'express';
import { listServers, createServer, deleteServer, testConnection, getServer } from '@/controllers/server.controller'; // Import getServer

const router = Router();

router.get('/servers', listServers);
router.post('/servers', createServer);
router.get('/servers/:id', getServer); // [New]
router.delete('/servers/:id', deleteServer);
router.post('/servers/:id/test', testConnection);

export const serverRouter = router;
