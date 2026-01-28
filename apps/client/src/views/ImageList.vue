<template>
  <div class="max-w-6xl mx-auto space-y-8">

    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 tracking-tight">镜像仓库</h2>
        <p class="text-slate-500 mt-1">本地 Docker 镜像管理与分发中心</p>
      </div>
      <BaseButton variant="outline" @click="fetchImages" :loading="loading">
        <RefreshCw class="w-4 h-4 mr-2" :class="{'animate-spin': loading}" />
        刷新列表
      </BaseButton>
    </div>

    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-slate-500 font-medium">
        <tr>
          <th class="px-6 py-4">Repository</th>
          <th class="px-6 py-4">Tag</th>
          <th class="px-6 py-4">Image ID</th>
          <th class="px-6 py-4">Size</th>
          <th class="px-6 py-4 text-right">操作</th>
        </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
        <tr
          v-for="img in images"
          :key="img.id + img.repository + img.tag"
          class="group hover:bg-slate-50/80 transition-colors"
        >
          <td class="px-6 py-4 font-medium text-slate-900">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Container class="w-4 h-4" />
              </div>
              <span>{{ img.repository }}</span>
            </div>
          </td>
          <td class="px-6 py-4">
            <BaseBadge variant="outline" class="font-mono">{{ img.tag }}</BaseBadge>
          </td>
          <td class="px-6 py-4 text-slate-400 font-mono text-xs">
            {{ img.id.substring(7, 19) }}
          </td>
          <td class="px-6 py-4 text-slate-500">
            {{ formatBytes(img.size) }}
          </td>
          <td class="px-6 py-4 text-right">
            <BaseButton
              size="sm"
              class="opacity-0 group-hover:opacity-100 transition-opacity shadow-indigo-200"
              @click="openDeploy(img)"
            >
              <Rocket class="w-3.5 h-3.5 mr-2" />
              推送
            </BaseButton>
          </td>
        </tr>

        <tr v-if="images.length === 0 && !loading">
          <td colspan="5" class="px-6 py-12 text-center text-slate-400">
            <div class="flex flex-col items-center">
              <Container class="w-8 h-8 mb-3 text-slate-300" />
              <span>暂无本地镜像</span>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <BaseModal v-model="showDeployModal" :title="deployTitle">
      <div class="min-w-[480px]">

        <div v-if="!isDeploying && !deployFinished" class="space-y-6">
          <div class="rounded-lg bg-slate-50 p-4 border border-slate-100 flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-indigo-600">
              <Container class="w-5 h-5" />
            </div>
            <div>
              <div class="text-xs text-slate-500 uppercase tracking-wider font-bold">即将推送</div>
              <div class="font-mono text-sm font-bold text-slate-800">
                {{ selectedImage?.repository }}:{{ selectedImage?.tag }}
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <label class="block text-sm font-medium text-slate-700">选择目标服务器</label>
            <div class="grid grid-cols-1 gap-2 max-h-[240px] overflow-y-auto">
              <div
                v-for="s in servers"
                :key="s.id"
                @click="selectedServerId = s.id"
                class="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all"
                :class="selectedServerId === s.id
                  ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500'
                  : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'"
              >
                <div class="flex items-center gap-3">
                  <ServerIcon class="w-4 h-4 text-slate-400" />
                  <div>
                    <div class="font-medium text-sm text-slate-700">{{ s.name }}</div>
                    <div class="text-xs text-slate-400 font-mono">{{ s.host }}</div>
                  </div>
                </div>
                <div v-if="selectedServerId === s.id" class="text-indigo-600">
                  <CheckCircle2 class="w-5 h-5" />
                </div>
              </div>
              <div v-if="servers.length === 0" class="text-center py-4 text-sm text-slate-500 border border-dashed rounded-lg">
                暂无可用服务器，请先去添加。
              </div>
            </div>
          </div>
        </div>

        <div v-else class="space-y-4">
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
               <span class="relative flex h-2.5 w-2.5">
                  <span v-if="!deployFinished" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5" :class="statusColor"></span>
               </span>
              <span class="font-medium text-slate-700">{{ statusText }}</span>
            </div>
            <div class="font-mono text-xs text-slate-500">{{ progress.rate || 'Preparing...' }}</div>
          </div>

          <div class="rounded-lg bg-slate-900 p-4 h-[300px] overflow-y-auto font-mono text-xs text-slate-300 shadow-inner" ref="logContainer">
            <div v-for="(log, i) in logs" :key="i" class="mb-1 break-all whitespace-pre-wrap">
              <span class="text-slate-600 mr-2 select-none">[{{ log.time }}]</span>
              <span :class="getLogColor(log.message)">{{ log.message }}</span>
            </div>
            <div v-if="!deployFinished" class="animate-pulse text-indigo-400 mt-2">_</div>
          </div>

          <BaseProgress :percentage="progress.percent" />
        </div>
      </div>

      <template #footer>
        <div v-if="!isDeploying && !deployFinished" class="flex justify-end gap-3 w-full">
          <BaseButton variant="ghost" @click="closeDeploy">取消</BaseButton>
          <BaseButton @click="startDeploy" :disabled="!selectedServerId">
            开始推送
            <ArrowRight class="w-4 h-4 ml-2" />
          </BaseButton>
        </div>
        <div v-else-if="deployFinished" class="flex justify-end gap-3 w-full">
          <BaseButton variant="ghost" @click="closeDeploy">关闭</BaseButton>
          <BaseButton v-if="deploySuccess" variant="secondary" disabled title="即将上线">
            <Terminal class="w-4 h-4 mr-2" />
            打开远程终端
          </BaseButton>
        </div>
      </template>
    </BaseModal>

  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, nextTick } from 'vue'
  import { RefreshCw, Container, Rocket, Server as ServerIcon, CheckCircle2, ArrowRight, Terminal } from 'lucide-vue-next'
  import { getLocalImages } from '@/api/docker'
  import { getServers } from '@/api/server'
  import { formatBytes } from '@/utils/format'
  import { useToast } from '@/composables/useToast'
  import type { DockerImage, Server, WsMessage, ProgressPayload } from '@repo/shared'

  // Components
  import BaseButton from '@/components/ui/BaseButton.vue'
  import BaseBadge from '@/components/ui/BaseBadge.vue'
  import BaseModal from '@/components/ui/BaseModal.vue'
  import BaseProgress from '@/components/ui/BaseProgress.vue'

  const toast = useToast()

  // Data
  const images = ref<DockerImage[]>([])
  const servers = ref<Server[]>([])
  const loading = ref(false)

  // Deploy State
  const showDeployModal = ref(false)
  const selectedImage = ref<DockerImage | null>(null)
  const selectedServerId = ref<number | null>(null)

  const isDeploying = ref(false)
  const deployFinished = ref(false)
  const deploySuccess = ref(false)
  const progress = ref<ProgressPayload>({ currentBytes: 0, totalBytes: 0, percent: 0, rate: '' })
  const logs = ref<{ time: string, message: string }[]>([])
  const logContainer = ref<HTMLElement | null>(null)

  let ws: WebSocket | null = null

  // Computed
  const deployTitle = computed(() => {
    if (!isDeploying.value && !deployFinished.value) return '部署配置'
    if (deployFinished.value) return deploySuccess.value ? '部署完成' : '部署失败'
    return '正在传输镜像...'
  })

  const statusColor = computed(() => {
    if (deploySuccess.value) return 'bg-emerald-500'
    if (deployFinished.value && !deploySuccess.value) return 'bg-red-500'
    return 'bg-indigo-500'
  })

  const statusText = computed(() => {
    if (deploySuccess.value) return 'Success'
    if (deployFinished.value) return 'Failed'
    return 'Transmitting'
  })

  // Methods
  const fetchImages = async () => {
    loading.value = true
    try {
      const res = await getLocalImages()
      if (res.data.code === 200) images.value = res.data.data || []
    } catch (e) {
      toast.error('获取镜像列表失败')
    } finally {
      loading.value = false
    }
  }

  const openDeploy = async (img: DockerImage) => {
    selectedImage.value = img
    showDeployModal.value = true

    // Reset
    isDeploying.value = false
    deployFinished.value = false
    deploySuccess.value = false
    logs.value = []
    progress.value = { currentBytes: 0, totalBytes: 0, percent: 0, rate: '' }

    // Load Servers
    try {
      const res = await getServers()
      if (res.data.code === 200) {
        servers.value = res.data.data || []
        if (servers.value.length > 0) selectedServerId.value = servers.value[0].id
      }
    } catch(e) {
      toast.error('无法加载服务器列表')
    }
  }

  const startDeploy = () => {
    if (!selectedImage.value || !selectedServerId.value) return

    isDeploying.value = true
    appendLog('Initializing deployment sequence...')

    // Connect via Proxy (Vite config handles /ws -> backend:3030)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`

    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      appendLog('WebSocket Channel Connected.')
      ws?.send(JSON.stringify({
        type: 'DEPLOY',
        imageId: selectedImage.value?.id,
        serverId: selectedServerId.value
      }))
    }

    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data)
        if (msg.type === 'LOG') appendLog(msg.payload.message)
        else if (msg.type === 'PROGRESS') progress.value = msg.payload
        else if (msg.type === 'SUCCESS') {
          appendLog(msg.payload.message)
          finishDeploy(true)
        }
        else if (msg.type === 'ERROR') {
          appendLog(`ERROR: ${msg.payload.message}`)
          finishDeploy(false)
        }
      } catch (e) { console.error(e) }
    }

    ws.onerror = () => {
      appendLog('Connection Error.')
      finishDeploy(false)
    }

    ws.onclose = () => {
      if (!deployFinished.value) appendLog('Connection Closed.')
    }
  }

  const finishDeploy = (success: boolean) => {
    deployFinished.value = true
    deploySuccess.value = success
    if (success) toast.success('镜像部署成功')
    else toast.error('部署过程中断')

    if (ws) { ws.close(); ws = null }
  }

  const closeDeploy = () => {
    if (isDeploying.value && !deployFinished.value) {
      if(!confirm('正在传输中，确定要中断吗？')) return
    }
    showDeployModal.value = false
    if (ws) { ws.close(); ws = null }
  }

  const appendLog = (message: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false })
    logs.value.push({ time, message })
    nextTick(() => {
      if (logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight
      }
    })
  }

  const getLogColor = (msg: string) => {
    if (msg.toLowerCase().includes('error')) return 'text-red-400 font-bold'
    if (msg.toLowerCase().includes('success')) return 'text-emerald-400 font-bold'
    if (msg.includes('MB/s')) return 'text-indigo-300'
    return 'text-slate-300'
  }

  onMounted(fetchImages)
</script>
