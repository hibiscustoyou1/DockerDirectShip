// apps/server/src/index.ts
import express from 'express';
import cors from 'cors';
import { initRoutes } from '@/routes';
import { getServerPaths, loadSecureEnv} from '@repo/shared/node';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { DeployService } from '@/services/deploy.service';
import { DeployRequest } from "@repo/shared";

const { PROJECT_ROOT } = getServerPaths(__dirname);
loadSecureEnv(PROJECT_ROOT);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

initRoutes(app);

// 创建 HTTP Server (为了共用端口)
const server = createServer(app);

// 创建 WebSocket Server
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  console.log('🔌 WebSocket Client Connected');
  
  ws.on('message', async (message: string) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'DEPLOY') {
        const payload = data as DeployRequest;
        await DeployService.startDeploy({
          imageId: payload.imageId,
          serverId: payload.serverId,
          // [New] 传递 repo 和 tag
          repository: payload.repository,
          tag: payload.tag,
          ws
        });
      }
    } catch (e) { /*...*/ }
  });
  
  ws.on('close', () => console.log('🔌 WebSocket Client Disconnected'));
});

// 使用 server.listen 而不是 app.listen
server.listen(PORT, () => {
  console.log(`🚀 服务已启动: http://localhost:${PORT} (HTTP + WS)`);
});
