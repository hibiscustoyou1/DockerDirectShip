<template>
  <div class="h-2 w-full overflow-hidden rounded-full bg-slate-100">
    <div
      class="h-full bg-indigo-600 transition-all duration-300 ease-out"
      :style="{ width: `${percentage}%` }"
    ></div>
  </div>
</template>

<script setup lang="ts">
  withDefaults(defineProps<{
    percentage?: number
  }>(), {
    percentage: 0
  })
</script>
