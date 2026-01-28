// apps/client/src/api/docker.ts
import api from './index';
import type { ApiResponse, DockerImage } from '@repo/shared';

export const getLocalImages = () => {
  return api.get<ApiResponse<DockerImage[]>>('/images');
};
