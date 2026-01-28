<template>
  <div class="min-h-screen bg-slate-50 p-6">
    <div class="max-w-6xl mx-auto">

      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">本地镜像仓库</h1>
          <p class="text-slate-500 text-sm mt-1">Local Docker Images</p>
        </div>
        <button
          @click="fetchImages"
          class="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          刷新列表
        </button>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Repository</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tag</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Image ID</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Size</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
            </tr>
            </thead>
            <tbody class="bg-white divide-y divide-slate-200">
            <tr v-for="img in images" :key="img.id + img.repository + img.tag" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-slate-900">
                  {{ img.repository || '&lt;none&gt;' }}
                </div>
              </td>

              <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {{ img.tag || 'latest' }}
                  </span>
              </td>

              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono" :title="img.id">
                {{ img.id ? img.id.substring(7, 19) : 'unknown' }}
              </td>

              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {{ formatBytes(img.size) }}
              </td>

              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {{ formatTime(img.created) }}
              </td>

              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  class="text-indigo-600 hover:text-indigo-900 font-bold"
                  @click="openDeployModal(img)">
                  推送到云
                </button>
              </td>
            </tr>

            <tr v-if="images.length === 0">
              <td colspan="6" class="px-6 py-10 text-center text-slate-400 text-sm">
                {{ loading ? '正在加载镜像...' : '没有找到本地镜像' }}
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <div v-if="showDeployModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 class="font-bold text-slate-800 text-lg">
            {{ isDeploying ? '正在部署...' : '部署配置' }}
          </h3>
          <button @click="closeModal" class="text-slate-400 hover:text-slate-600" :disabled="isDeploying">
            ✕
          </button>
        </div>

        <div class="p-6 flex-1 overflow-auto">

          <div v-if="!isDeploying && !deployFinished">
            <div class="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div class="text-sm text-blue-800 font-medium">即将推送镜像:</div>
              <div class="text-lg font-bold text-blue-900 mt-1">{{ selectedImage?.repository }}:{{ selectedImage?.tag }}</div>
              <div class="text-xs text-blue-600 font-mono mt-1">{{ selectedImage?.id.substring(0, 12) }}</div>
            </div>

            <div class="space-y-4">
              <label class="block text-sm font-medium text-slate-700">选择目标服务器</label>
              <select v-model="selectedServerId" class="w-full px-3 py-3 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                <option v-for="s in servers" :key="s.id" :value="s.id">
                  {{ s.name }} ({{ s.host }})
                </option>
              </select>
              <div v-if="servers.length === 0" class="text-xs text-red-500">
                暂无可用服务器，请先去服务器管理页面添加。
              </div>
            </div>
          </div>

          <div v-else class="flex flex-col h-full">

            <div class="mb-4">
              <div class="flex justify-between text-xs text-slate-500 mb-1">
                <span>{{ progress.rate || 'Preparing...' }}</span>
                <span>{{ progress.percent }}%</span>
              </div>
              <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-indigo-500 transition-all duration-300 ease-out"
                  :style="{ width: `${progress.percent}%` }"
                ></div>
              </div>
            </div>

            <div ref="logContainer" class="flex-1 bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-y-auto min-h-[300px] max-h-[400px]">
              <div v-for="(log, idx) in logs" :key="idx" class="whitespace-pre-wrap mb-1 font-mono">
                <span class="text-slate-500">[{{ log.time }}]</span> {{ log.message }}
              </div>
              <div v-if="deployFinished && deploySuccess" class="text-green-400 font-bold mt-2">
                ✨ 部署完成
              </div>
              <div v-if="deployFinished && !deploySuccess" class="text-red-400 font-bold mt-2">
                ❌ 部署失败
              </div>
            </div>
          </div>

        </div>

        <div class="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <div v-if="!isDeploying && !deployFinished">
            <button
              @click="closeModal"
              class="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg mr-2 transition-colors">
              取消
            </button>
            <button
              @click="startDeploy"
              :disabled="!selectedServerId"
              class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors">
              开始推送
            </button>
          </div>
          <div v-else>
            <button
              @click="closeModal"
              class="px-6 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              :class="{'bg-indigo-600 text-white border-transparent hover:bg-indigo-700': deployFinished}">
              {{ deployFinished ? '关闭' : '后台运行' }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, nextTick } from 'vue';
  import { getLocalImages } from '@/api/docker';
  import { getServers } from '@/api/server';
  import { formatBytes, formatTime } from '@/utils/format';
  import type { DockerImage, Server, WsMessage, ProgressPayload } from '@repo/shared';

  // Data
  const images = ref<DockerImage[]>([]);
  const servers = ref<Server[]>([]);
  const loading = ref(false);

  // Modal State
  const showDeployModal = ref(false);
  const selectedImage = ref<DockerImage | null>(null);
  const selectedServerId = ref<number | null>(null);

  // Deploy State
  const isDeploying = ref(false);
  const deployFinished = ref(false);
  const deploySuccess = ref(false);
  const progress = ref<ProgressPayload>({ currentBytes: 0, totalBytes: 0, percent: 0, rate: '' });
  const logs = ref<{ time: string, message: string }[]>([]);
  const logContainer = ref<HTMLElement | null>(null);

  let ws: WebSocket | null = null;

  // --- Methods ---

  const fetchImages = async () => {
    loading.value = true;
    try {
      const res = await getLocalImages();
      if (res.data.code === 200 && res.data.data) {
        console.log('Images loaded:', res.data.data); // Debug Log
        images.value = res.data.data;
      }
    } catch (e) { console.error(e); }
    finally { loading.value = false; }
  };

  const openDeployModal = async (img: DockerImage) => {
    selectedImage.value = img;
    showDeployModal.value = true;
    isDeploying.value = false;
    deployFinished.value = false;
    logs.value = [];
    progress.value = { currentBytes: 0, totalBytes: 0, percent: 0, rate: '' };

    const res = await getServers();
    if (res.data.code === 200 && res.data.data) {
      servers.value = res.data.data;
      if (servers.value.length > 0) selectedServerId.value = servers.value[0].id;
    }
  };

  const closeModal = () => {
    if (isDeploying.value && !deployFinished.value) {
      if (!confirm('部署正在进行中，关闭窗口不会停止后台任务，但你会失去进度显示。确定关闭吗？')) {
        return;
      }
    }
    showDeployModal.value = false;
    if (ws) {
      ws.close();
      ws = null;
    }
  };

  const appendLog = (message: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    logs.value.push({ time, message });
    nextTick(() => {
      if (logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight;
      }
    });
  };

  const startDeploy = () => {
    if (!selectedImage.value || !selectedServerId.value) return;

    isDeploying.value = true;

    // Connect via relative path to support both dev and prod
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    console.log('Connecting to WS:', wsUrl);

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      appendLog('WebSocket Connected.');
      ws?.send(JSON.stringify({
        type: 'DEPLOY',
        imageId: selectedImage.value?.id,
        serverId: selectedServerId.value
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        switch (msg.type) {
          case 'LOG':
            appendLog(msg.payload.message);
            break;
          case 'PROGRESS':
            progress.value = msg.payload;
            break;
          case 'SUCCESS':
            appendLog(msg.payload.message);
            isDeploying.value = false;
            deployFinished.value = true;
            deploySuccess.value = true;
            break;
          case 'ERROR':
            appendLog(`ERROR: ${msg.payload.message}`);
            isDeploying.value = false;
            deployFinished.value = true;
            deploySuccess.value = false;
            break;
        }
      } catch (e) {
        console.error(e);
      }
    };

    ws.onclose = () => {
      if (!deployFinished.value) {
        appendLog('Connection closed.');
      }
    };

    ws.onerror = (err) => {
      console.error(err);
      appendLog('Connection error.');
      isDeploying.value = false;
    };
  };

  onMounted(() => {
    fetchImages();
  });
</script>
