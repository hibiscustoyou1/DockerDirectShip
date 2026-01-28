// apps/server/src/utils/crypto.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// 在生产环境中，这个密钥应该来自环境变量 (process.env.SECRET_KEY)
// 这里为了演示方便使用一个固定密钥 (32 bytes)
const SECRET_KEY = process.env.APP_SECRET || 'aeEqKkcepntfdUCgxYuu3T7nlMiIb26x';
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  if (!text) return '';
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
