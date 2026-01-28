export enum ApiCode {
  SUCCESS = 200,
  FAIL = 500,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
}

export interface ApiResponse<T = any> {
  code: ApiCode;
  data?: T;
  msg?: string;
}

export interface HelloData {
  message: string;
  timestamp: number;
}

// --- Server Management Types ---

export type AuthType = 'password' | 'privateKey';

export interface Server {
  id: number;
  name: string;
  host: string;
  port: number;
  username: string;
  authType: AuthType;
  // 返回给前端时，敏感字段通常是 null 或脱敏后的字符串 '******'
  password?: string | null;
  privateKey?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateServerDto {
  name: string;
  host: string;
  port: number;
  username: string;
  authType: AuthType;
  password?: string;
  privateKey?: string;
}

// [FIX] 使用 type + 交叉类型，修复 interface extends Partial<T> 的语法错误
export type UpdateServerDto = Partial<CreateServerDto> & {
  id: number;
};

export interface ServerTestResult {
  success: boolean;
  latencyMs?: number;
  message: string;
}

export interface DockerImage {
  id: string;          // sha256:....
  repository: string;  // e.g. "nginx"
  tag: string;         // e.g. "latest"
  size: number;        // Bytes
  created: number;     // Timestamp
  virtualSize: number;
}

export type WsMessageType = 'DEPLOY_START' | 'LOG' | 'PROGRESS' | 'ERROR' | 'SUCCESS';

export interface DeployRequest {
  type: 'DEPLOY';
  imageId: string;   // Image ID
  serverId: number;  // Server Database ID
}

export interface WsMessage {
  type: WsMessageType;
  payload?: any;
}

export interface ProgressPayload {
  currentBytes: number;
  totalBytes: number;
  percent: number;
  rate?: string; // e.g. "2.5 MB/s"
}

export interface LogPayload {
  message: string;
}
