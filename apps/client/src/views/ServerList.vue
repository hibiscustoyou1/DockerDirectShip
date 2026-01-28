<template>
  <div class="min-h-screen bg-slate-50 p-6">
    <div class="max-w-5xl mx-auto">

      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">服务器资产</h1>
          <p class="text-slate-500 text-sm mt-1">管理您的 Docker 宿主机资源</p>
        </div>
        <button
          @click="openModal"
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2">
          <span>+ 添加服务器</span>
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="server in servers" :key="server.id" class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
          <div class="p-5">
            <div class="flex justify-between items-start mb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold text-slate-800">{{ server.name }}</h3>
                  <div class="text-xs text-slate-500 font-mono">{{ server.username }}@{{ server.host }}:{{ server.port }}</div>
                </div>
              </div>

              <div class="flex gap-2">
                <button @click="testConn(server.id)" class="text-xs px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-600" :disabled="testingId === server.id">
                  {{ testingId === server.id ? 'Testing...' : 'Test' }}
                </button>
                <button @click="handleDelete(server.id)" class="text-red-400 hover:text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="flex items-center gap-2 text-xs text-slate-400 mt-4 pt-4 border-t border-slate-50">
              <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{{ server.authType }}</span>
              <span class="ml-auto">ID: {{ server.id }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="servers.length === 0" class="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
        <p class="text-slate-400">暂无服务器，请添加一台 Docker 主机</p>
      </div>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <h2 class="text-xl font-bold mb-4">添加服务器</h2>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">名称 (Alias)</label>
            <input v-model="form.name" required class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Aliyun HK Production" />
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div class="col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1">Host / IP</label>
              <input v-model="form.host" required class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="192.168.1.1" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Port</label>
              <input v-model.number="form.port" type="number" class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="22" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input v-model="form.username" class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="root" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">认证方式</label>
            <select v-model="form.authType" class="w-full px-3 py-2 border rounded-lg outline-none bg-white">
              <option value="password">Password</option>
              <option value="privateKey">SSH Private Key</option>
            </select>
          </div>

          <div v-if="form.authType === 'password'">
            <label class="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input v-model="form.password" type="password" class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div v-else>
            <label class="block text-sm font-medium text-slate-700 mb-1">Private Key (PEM)</label>
            <textarea v-model="form.privateKey" rows="3" class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs" placeholder="-----BEGIN OPENSSH PRIVATE KEY..."></textarea>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button type="button" @click="showModal = false" class="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">取消</button>
            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">保存</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue';
  import { getServers, createServer, deleteServer, testServerConnection } from '@/api/server';
  import type { Server, CreateServerDto } from '@repo/shared';

  const servers = ref<Server[]>([]);
  const showModal = ref(false);
  const testingId = ref<number | null>(null);

  const form = reactive<CreateServerDto>({
    name: '',
    host: '',
    port: 22,
    username: 'root',
    authType: 'password',
    password: '',
    privateKey: ''
  });

  // [FIX] 补充 openModal 函数
  const openModal = () => {
    showModal.value = true;
  };

  const fetchList = async () => {
    try {
      const res = await getServers();
      if (res.data.code === 200 && res.data.data) {
        servers.value = res.data.data;
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await createServer(form);
      if (res.data.code === 200) {
        showModal.value = false;
        fetchList();
        // Reset form
        form.name = '';
        form.host = '';
        form.password = '';
        form.privateKey = '';
        form.username = 'root';
        form.port = 22;
      } else {
        alert(res.data.msg);
      }
    } catch (e) {
      alert('Failed to create server');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除此服务器配置？')) return;
    await deleteServer(id);
    fetchList();
  };

  const testConn = async (id: number) => {
    testingId.value = id;
    try {
      const res = await testServerConnection(id);
      const result = res.data.data;
      if (result?.success) {
        alert(`✅ 连接成功! 延迟: ${result.latencyMs}ms`);
      } else {
        alert(`❌ 连接失败: ${result?.message}`);
      }
    } catch (e) {
      alert('请求失败');
    } finally {
      testingId.value = null;
    }
  };

  onMounted(() => {
    fetchList();
  });
</script>
