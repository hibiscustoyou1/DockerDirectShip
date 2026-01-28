import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// cn: Class Name 合并工具，解决 tailwind 类名冲突
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
