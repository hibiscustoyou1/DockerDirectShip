// apps/server/src/routes/index.ts
import { Router, Express } from 'express';
import { helloRouter } from './hello.routes';
import { serverRouter } from './server.routes';
import { dockerRouter } from './docker.routes'; // Import

const routes = Router();

routes.use('/api', helloRouter);
routes.use('/api', serverRouter);
routes.use('/api', dockerRouter); // Register

export const initRoutes = (app: Express) => {
  app.use(routes);
  app.all(/^\/api\/.*$/, (req, res) => {
    console.warn(`⚠️ API 404: ${req.path}`);
    res.status(404).json({ success: false, error: '未找到API端点' });
  });
};
