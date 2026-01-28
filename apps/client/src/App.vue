<template>
  <div class="flex h-screen w-full overflow-hidden bg-[var(--bg-page)] text-[var(--text-main)]">

    <aside class="w-64 flex-shrink-0 flex flex-col border-r border-[var(--border-color)] bg-white/80 backdrop-blur-sm z-10">
      <div class="h-16 flex items-center px-6 border-b border-slate-100/50">
        <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
          <Ship class="w-5 h-5" />
        </div>
        <span class="ml-3 font-bold text-lg tracking-tight text-slate-800">DockerOps</span>
      </div>

      <nav class="flex-1 p-4 space-y-1">
        <router-link to="/" custom v-slot="{ navigate, isActive }">
          <a @click="navigate" :class="navClass(isActive)">
            <LayoutDashboard class="w-4 h-4" />
            <span>仪表盘</span>
          </a>
        </router-link>

        <div class="pt-4 pb-2 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">资源管理</div>

        <router-link to="/servers" custom v-slot="{ navigate, isActive }">
          <a @click="navigate" :class="navClass(isActive)">
            <Server class="w-4 h-4" />
            <span>服务器资产</span>
          </a>
        </router-link>

        <router-link to="/images" custom v-slot="{ navigate, isActive }">
          <a @click="navigate" :class="navClass(isActive)">
            <Container class="w-4 h-4" />
            <span>镜像仓库</span>
          </a>
        </router-link>
      </nav>

      <div class="p-4 border-t border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">
            A
          </div>
          <div class="flex-1 overflow-hidden">
            <div class="text-sm font-bold text-slate-700 truncate">Administrator</div>
            <div class="text-xs text-slate-400 truncate">Local Environment</div>
          </div>
        </div>
      </div>
    </aside>

    <main class="flex-1 flex flex-col overflow-hidden relative">
      <header class="h-16 flex-shrink-0 flex items-center justify-between px-8 border-b border-slate-200/60 bg-white/50 backdrop-blur-sm">
        <h1 class="text-xl font-bold text-slate-800">{{ $route.name }}</h1>
        <div class="flex items-center gap-2">
        </div>
      </header>

      <div class="flex-1 overflow-auto p-8">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <GlobalToast />
  </div>
</template>

<script setup lang="ts">
  import { Ship, LayoutDashboard, Server, Container } from 'lucide-vue-next'
  import GlobalToast from '@/components/GlobalToast.vue'
  import { cn } from '@/lib/utils'

  const navClass = (active: boolean) => cn(
    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
    active
      ? "bg-indigo-50 text-indigo-600 shadow-sm"
      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
  )
</script>
