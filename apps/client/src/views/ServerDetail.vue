<template>
  <div class="max-w-6xl mx-auto space-y-8">

    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <BaseButton variant="ghost" size="icon" @click="$router.push('/servers')">
          <ArrowLeft class="w-5 h-5 text-slate-500" />
        </BaseButton>
        <div>
          <h2 class="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {{ server?.name || 'Loading...' }}
            <span v-if="server" class="text-sm font-normal text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
              {{ server.host }}
            </span>
          </h2>
          <p class="text-slate-500 mt-1">远程容器列表与状态监控</p>
        </div>
      </div>

      <BaseButton variant="outline" @click="fetchContainers">
        <RefreshCw class="w-4 h-4 mr-2" :class="{'animate-spin': loading}" />
        刷新
      </BaseButton>
    </div>

    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-slate-500 font-medium">
        <tr>
          <th class="px-6 py-4">State</th>
          <th class="px-6 py-4">Name</th>
          <th class="px-6 py-4">Image</th>
          <th class="px-6 py-4">Ports</th>
          <th class="px-6 py-4">Status</th>
          <th class="px-6 py-4">Created</th>
        </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
        <tr v-for="c in containers" :key="c.ID" class="group hover:bg-slate-50/80 transition-colors">
          <td class="px-6 py-4">
            <div class="flex items-center gap-2">
              <div class="w-2.5 h-2.5 rounded-full" :class="getStateColor(c.State)"></div>
              <span class="capitalize font-medium" :class="getStateTextColor(c.State)">{{ c.State }}</span>
            </div>
          </td>
          <td class="px-6 py-4 font-medium text-slate-900">
            {{ c.Names }}
          </td>
          <td class="px-6 py-4">
            <div class="flex items-center gap-2 text-slate-600">
              <Box class="w-4 h-4 text-slate-400" />
              <span class="font-mono text-xs">{{ c.Image }}</span>
            </div>
          </td>
          <td class="px-6 py-4 text-xs text-slate-500 font-mono max-w-[200px] truncate" :title="c.Ports">
            {{ c.Ports || '-' }}
          </td>
          <td class="px-6 py-4 text-slate-500 text-xs">
            {{ c.Status }}
          </td>
          <td class="px-6 py-4 text-slate-400 text-xs">
            {{ c.CreatedAt.split(' ')[0] }}
          </td>
        </tr>

        <tr v-if="containers.length === 0 && !loading">
          <td colspan="6" class="px-6 py-12 text-center text-slate-400">
            暂无容器或无法连接到 Docker Daemon
          </td>
        </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { getServer, getRemoteContainers } from '@/api/server';
  import { useToast } from '@/composables/useToast';
  import type { Server, RemoteContainer } from '@repo/shared';
  import { ArrowLeft, RefreshCw, Box } from 'lucide-vue-next';

  // Components
  import BaseButton from '@/components/ui/BaseButton.vue';

  const route = useRoute();
  const router = useRouter();
  const toast = useToast();

  const serverId = Number(route.params.id);
  const server = ref<Server | null>(null);
  const containers = ref<RemoteContainer[]>([]);
  const loading = ref(false);

  const fetchServerInfo = async () => {
    try {
      const res = await getServer(serverId);
      if (res.data.code === 200) {
        server.value = res.data.data!;
      } else {
        toast.error('服务器不存在');
        router.push('/servers');
      }
    } catch (e) {
      toast.error('获取服务器信息失败');
    }
  };

  const fetchContainers = async () => {
    loading.value = true;
    try {
      const res = await getRemoteContainers(serverId);
      if (res.data.code === 200) {
        containers.value = res.data.data || [];
      }
    } catch (e) {
      toast.error('无法连接到远程 Docker');
      console.error(e);
    } finally {
      loading.value = false;
    }
  };

  // UI Helpers
  const getStateColor = (state: string) => {
    if (state.startsWith('running')) return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
    if (state.startsWith('exited')) return 'bg-slate-400';
    if (state.startsWith('restarting')) return 'bg-amber-500 animate-pulse';
    return 'bg-red-500';
  };

  const getStateTextColor = (state: string) => {
    if (state.startsWith('running')) return 'text-emerald-700';
    return 'text-slate-500';
  };

  onMounted(async () => {
    await fetchServerInfo();
    if (server.value) {
      fetchContainers();
    }
  });
</script>
