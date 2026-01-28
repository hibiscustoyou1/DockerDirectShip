<template>
  <div class="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
    <TransitionGroup name="list">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto min-w-[300px] max-w-sm rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all flex items-start gap-3"
        :class="getTypeClass(toast.type)"
      >
        <component :is="getIcon(toast.type)" class="w-5 h-5 mt-0.5 shrink-0" />

        <div class="flex-1 text-sm font-medium leading-relaxed">
          {{ toast.message }}
        </div>

        <button @click="remove(toast.id)" class="opacity-50 hover:opacity-100 transition-opacity">
          <X class="w-4 h-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
  import { useToast, type ToastType } from '@/composables/useToast'
  import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-vue-next'

  const { toasts, remove } = useToast()

  const getTypeClass = (type: ToastType) => {
    switch (type) {
      case 'success': return 'bg-white border-emerald-100 text-emerald-800'
      case 'error': return 'bg-white border-red-100 text-red-800'
      case 'warning': return 'bg-white border-amber-100 text-amber-800'
      default: return 'bg-white border-slate-100 text-slate-800'
    }
  }

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return CheckCircle2
      case 'error': return AlertCircle
      case 'warning': return AlertTriangle
      default: return Info
    }
  }
</script>
