// apps/client/src/api/server.ts
import api from './index';
import type { ApiResponse, Server, CreateServerDto, ServerTestResult } from '@repo/shared';

export const getServers = () => {
  return api.get<ApiResponse<Server[]>>('/servers');
};

export const createServer = (data: CreateServerDto) => {
  return api.post<ApiResponse<Server>>('/servers', data);
};

export const deleteServer = (id: number) => {
  return api.delete<ApiResponse<null>>(`/servers/${id}`);
};

export const testServerConnection = (id: number) => {
  return api.post<ApiResponse<ServerTestResult>>(`/servers/${id}/test`);
};
