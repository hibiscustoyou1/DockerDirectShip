<template>
  <span
    :class="cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      colors[variant],
      $attrs.class as string
    )"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
  import { cn } from '@/lib/utils'

  const props = withDefaults(defineProps<{
    variant?: 'default' | 'success' | 'warning' | 'error' | 'outline'
  }>(), {
    variant: 'default'
  })

  const colors = {
    default: 'bg-slate-100 text-slate-800',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border border-amber-100',
    error: 'bg-red-50 text-red-700 border border-red-100',
    outline: 'border border-slate-200 text-slate-600'
  }
</script>
