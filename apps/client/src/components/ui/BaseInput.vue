<template>
  <div class="space-y-1.5">
    <label v-if="label" class="block text-sm font-medium text-slate-700">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </label>
    <div class="relative">
      <input
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        v-bind="$attrs"
        :class="cn(
          'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:cursor-not-allowed disabled:bg-slate-50',
          $attrs.class as string
        )"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { cn } from '@/lib/utils'

  defineProps<{
    label?: string
    modelValue?: string | number
    required?: boolean
  }>()
  defineEmits(['update:modelValue'])
</script>
