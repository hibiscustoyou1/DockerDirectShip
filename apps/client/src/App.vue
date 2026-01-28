<template>
  <div class="flex min-h-screen w-full">

    <aside class="w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col">
      <div class="h-16 flex items-center px-6 font-bold text-white text-xl tracking-wider border-b border-slate-800">
        DOCKER OPS
      </div>

      <nav class="flex-1 p-4 space-y-2">
        <router-link
          to="/"
          class="block px-4 py-2 rounded hover:bg-slate-800 transition-colors"
          active-class="bg-indigo-600 text-white">
          首页 (Demo)
        </router-link>
        <router-link
          to="/servers"
          class="block px-4 py-2 rounded hover:bg-slate-800 transition-colors"
          active-class="bg-indigo-600 text-white">
          服务器管理
        </router-link>
        <router-link
          to="/images"
          class="block px-4 py-2 rounded hover:bg-slate-800 transition-colors"
          active-class="bg-indigo-600 text-white">
          本地镜像
        </router-link>
      </nav>

      <div class="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        v1.0.0 Alpha
      </div>
    </aside>

    <main class="flex-1 overflow-auto bg-slate-50">
      <router-view />
    </main>

  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
  /* 移除之前的样式，使用 Tailwind */
</style>
