import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  message: string
  type: ToastType
  duration?: number
}

// 全局状态
const toasts = ref<Toast[]>([])
let counter = 0

export function useToast() {
  const add = (message: string, type: ToastType = 'info', duration = 3000) => {
    const id = counter++
    const toast: Toast = { id, message, type, duration }
    toasts.value.push(toast)
    
    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }
  }
  
  const remove = (id: number) => {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  return {
    toasts,
    add,
    remove,
    success: (msg: string, d?: number) => add(msg, 'success', d),
    error: (msg: string, d?: number) => add(msg, 'error', d),
    info: (msg: string, d?: number) => add(msg, 'info', d),
    warning: (msg: string, d?: number) => add(msg, 'warning', d),
  }
}
