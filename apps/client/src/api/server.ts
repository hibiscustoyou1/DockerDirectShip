import api from './index';
import type { ApiResponse, Server, CreateServerDto, ServerTestResult, RemoteContainer } from '@repo/shared';

export const getServers = () => {
  return api.get<ApiResponse<Server[]>>('/servers');
};

// [New]
export const getServer = (id: number) => {
  return api.get<ApiResponse<Server>>(`/servers/${id}`);
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

// [New] 获取远程容器
export const getRemoteContainers = (serverId: number) => {
  return api.get<ApiResponse<RemoteContainer[]>>(`/servers/${serverId}/containers`);
};
