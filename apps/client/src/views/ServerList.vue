<template>
  <div class="max-w-6xl mx-auto space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 tracking-tight">服务器资产</h2>
        <p class="text-slate-500 mt-1">管理远程 Docker 主机连接信息</p>
      </div>
      <BaseButton @click="openModal" size="lg" class="rounded-xl shadow-lg shadow-indigo-200/50">
        <Plus class="w-4 h-4 mr-2" />
        添加服务器
      </BaseButton>
    </div>

    <div v-if="servers.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <BaseCard
        v-for="server in servers"
        :key="server.id"
        class="group relative overflow-hidden hover:-translate-y-1 duration-300 cursor-pointer"
        @click="goToDetail(server.id)"
      >
        <div class="absolute top-0 left-0 w-full h-1 transition-colors duration-500"
             :class="getStatusLineClass(server.id)"></div>

        <div class="flex justify-between items-start mb-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
              <ServerIcon class="w-6 h-6" />
            </div>
            <div>
              <h3 class="font-bold text-slate-800">{{ server.name }}</h3>
              <div class="text-xs text-slate-400 font-mono mt-0.5">{{ server.host }}</div>
            </div>
          </div>

          <button @click="confirmDelete(server)" class="text-slate-300 hover:text-red-500 transition-colors p-1">
            <Trash2 class="w-4 h-4" />
          </button>
        </div>

        <div class="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
          <BaseBadge variant="outline" class="font-mono bg-slate-50">
            {{ server.authType === 'password' ? 'PWD' : 'KEY' }}
          </BaseBadge>

          <BaseButton
            size="sm"
            variant="ghost"
            :loading="testingId === server.id"
            @click="testConn(server.id)"
            :class="getTestBtnClass(server.id)"
          >
            {{ getTestBtnText(server.id) }}
          </BaseButton>
        </div>
      </BaseCard>
    </div>

    <div v-else-if="!loading" class="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
      <div class="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
        <ServerIcon class="w-8 h-8 text-slate-300" />
      </div>
      <h3 class="text-lg font-bold text-slate-700">暂无服务器</h3>
      <p class="text-slate-500 mb-6">添加您的第一台 Docker 主机</p>
      <BaseButton variant="secondary" @click="openModal">立即添加</BaseButton>
    </div>

    <BaseModal v-model="showModal" title="连接新主机">
      <form id="create-form" @submit.prevent="handleSubmit" class="space-y-4">
        <BaseInput v-model="form.name" label="名称 (Alias)" placeholder="e.g. Production" required />

        <div class="grid grid-cols-3 gap-4">
          <div class="col-span-2">
            <BaseInput v-model="form.host" label="主机 IP" placeholder="192.168.1.1" required class="font-mono" />
          </div>
          <div>
            <BaseInput v-model.number="form.port" label="端口" placeholder="22" type="number" class="font-mono" />
          </div>
        </div>

        <BaseInput v-model="form.username" label="用户名" placeholder="root" />

        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-700">认证方式</label>
          <div class="flex bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              class="flex-1 py-1.5 text-sm font-medium rounded-md transition-all"
              :class="form.authType === 'password' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'"
              @click="form.authType = 'password'"
            >密码</button>
            <button
              type="button"
              class="flex-1 py-1.5 text-sm font-medium rounded-md transition-all"
              :class="form.authType === 'privateKey' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'"
              @click="form.authType = 'privateKey'"
            >私钥</button>
          </div>
        </div>

        <div v-if="form.authType === 'password'">
          <BaseInput v-model="form.password" label="密码" type="password" placeholder="••••••" />
        </div>
        <div v-else>
          <label class="block text-sm font-medium text-slate-700 mb-1">私钥 (PEM)</label>
          <textarea
            v-model="form.privateKey"
            rows="4"
            class="w-full rounded-lg border border-slate-200 p-3 text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
          ></textarea>
        </div>
      </form>

      <template #footer>
        <BaseButton variant="ghost" type="button" @click="showModal = false">取消</BaseButton>
        <BaseButton type="submit" form="create-form" :loading="submitting">保存连接</BaseButton>
      </template>
    </BaseModal>

    <BaseModal v-model="showDeleteModal" title="确认删除?">
      <div class="text-slate-600">
        您确定要移除服务器 <span class="font-bold text-slate-800">{{ serverToDelete?.name }}</span> 吗？
        此操作不可恢复。
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="showDeleteModal = false">取消</BaseButton>
        <BaseButton variant="danger" @click="executeDelete" :loading="isDeleting">确认移除</BaseButton>
      </template>
    </BaseModal>

  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { Plus, Server as ServerIcon, Trash2 } from 'lucide-vue-next'
  import { getServers, createServer, deleteServer, testServerConnection } from '@/api/server'
  import type { Server, CreateServerDto } from '@repo/shared'
  import { useToast } from '@/composables/useToast'
  import { useRouter } from 'vue-router';
  const router = useRouter();

  // Components
  import BaseButton from '@/components/ui/BaseButton.vue'
  import BaseInput from '@/components/ui/BaseInput.vue'
  import BaseCard from '@/components/ui/BaseCard.vue'
  import BaseBadge from '@/components/ui/BaseBadge.vue'
  import BaseModal from '@/components/ui/BaseModal.vue'

  const toast = useToast()

  // State
  const servers = ref<Server[]>([])
  const loading = ref(false)
  const submitting = ref(false)
  const showModal = ref(false)

  // Test State
  const testingId = ref<number | null>(null)
  const testResults = reactive<Record<number, { success: boolean }>>({})

  // Delete State
  const showDeleteModal = ref(false)
  const serverToDelete = ref<Server | null>(null)
  const isDeleting = ref(false)

  const form = reactive<CreateServerDto>({
    name: '', host: '', port: 22, username: 'root',
    authType: 'password', password: '', privateKey: ''
  })

  // Methods
  const openModal = () => {
    Object.assign(form, {
      name: '', host: '', port: 22, username: 'root',
      authType: 'password', password: '', privateKey: ''
    })
    showModal.value = true
  }

  const fetchList = async () => {
    loading.value = true
    try {
      const res = await getServers()
      if (res.data.code === 200) servers.value = res.data.data || []
    } catch (e) {
      toast.error('无法加载服务器列表')
    } finally {
      loading.value = false
    }
  }

  const handleSubmit = async () => {
    submitting.value = true
    try {
      const res = await createServer(form)
      if (res.data.code === 200) {
        toast.success('服务器添加成功')
        showModal.value = false
        fetchList()
      } else {
        toast.error(res.data.msg || '添加失败')
      }
    } catch (e) {
      toast.error('请求失败')
    } finally {
      submitting.value = false
    }
  }

  const confirmDelete = (server: Server) => {
    serverToDelete.value = server
    showDeleteModal.value = true
  }

  const executeDelete = async () => {
    if (!serverToDelete.value) return
    isDeleting.value = true
    try {
      await deleteServer(serverToDelete.value.id)
      toast.success('服务器已移除')
      showDeleteModal.value = false
      fetchList()
    } catch (e) {
      toast.error('删除失败')
    } finally {
      isDeleting.value = false
    }
  }

  const testConn = async (id: number) => {
    testingId.value = id
    delete testResults[id]
    try {
      const res = await testServerConnection(id)
      const result = res.data.data
      if (result?.success) {
        testResults[id] = { success: true }
        toast.success(`连接成功 (${result.latencyMs}ms)`)
      } else {
        testResults[id] = { success: false }
        toast.error(`连接失败: ${result?.message}`)
      }
    } catch (e) {
      testResults[id] = { success: false }
      toast.error('网络请求异常')
    } finally {
      testingId.value = null
    }
  }

  // UI Helpers
  const getStatusLineClass = (id: number) => {
    if (testResults[id]?.success) return 'bg-emerald-500'
    if (testResults[id]?.success === false) return 'bg-red-500'
    return 'bg-transparent'
  }

  const getTestBtnClass = (id: number) => {
    if (testResults[id]?.success) return '!text-emerald-600 !bg-emerald-50'
    if (testResults[id]?.success === false) return '!text-red-600 !bg-red-50'
    return ''
  }

  const getTestBtnText = (id: number) => {
    if (testingId.value === id) return '测试中...'
    if (testResults[id]?.success) return '已连接'
    if (testResults[id]?.success === false) return '重试'
    return '测试连接'
  }

  const goToDetail = (id: number) => {
    router.push(`/servers/${id}`);
  };

  onMounted(fetchList)
</script>
