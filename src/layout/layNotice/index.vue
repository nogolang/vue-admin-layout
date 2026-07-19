<!--
  ==================== 通知中心（LayNotice） ====================

  Header 中的消息通知铃铛组件。

  功能特性：
    1. 铃铛图标 + 红点（有未读数据时显示）
    2. 鼠标悬停铃铛 → 铃铛摇晃动画
    3. 点击铃铛 → el-dropdown 下拉面板
    4. 下拉面板内三个标签页：通知 / 消息 / 待办
    5. 通过 SSE 实时接收后端推送的通知数据
    6. 底部操作栏：查看更多 / 标为已读

  SSE 连接：
    端点：/userInfo/notice/sse
    事件格式：event: notice, data: { type, title, description, ... }
    组件挂载时自动连接，卸载时断开。
-->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Bell } from '@element-plus/icons-vue'
import { ArrowRight } from '@element-plus/icons-vue'
import { env } from '@/app.config'
import { useUserStore } from '@/stores/user'
import { markNoticeRead } from '@/api/system/sysUser'
import { createEmptyTabs } from './data'
import type { ListItem, TabItem } from './data'
import NoticeList from './NoticeList.vue'

defineOptions({ name: 'LayNotice' })

// ==================== SSE 连接 ====================

/**
 * 连接时机：
 *
 *   登录 → token 存入 userStore → 路由守卫放行 → BasicLayout 渲染 → <LayNotice /> 挂载
 *   → onMounted() → connectSSE()  ← 此时 token 已就绪，Authorization header 有效
 *
 * 为什么不用 EventSource 或 axios？
 *
 *   EventSource  → 不支持自定义请求头，token 只能放 URL 上，不安全
 *   axios        → 浏览器端基于 XHR，会缓冲完整响应才返回，无法流式逐帧读取
 *
 * 因此使用 fetch + ReadableStream 手动实现 SSE：
 *   1. fetch 发起 GET，Authorization header 携带 token
 *   2. response.body.getReader() 获取可读流
 *   3. TextDecoder 逐块解码 → 拼入 buffer
 *   4. 以 \n\n 分隔 SSE 帧 → 逐帧解析 event / data 字段
 */

/** AbortController — 组件卸载时 abort 掉 fetch，避免内存泄漏 */
let abortController: AbortController | null = null

/**
 * 建立 SSE 连接
 *
 * 执行流程：
 *   1. 从 userStore 取 token → 放 Authorization header
 *   2. fetch 发起 GET /userInfo/notice/sse
 *   3. 获取 ReadableStream reader → 循环 read()
 *   4. TextDecoder 解码字节 → 拼入 buffer 字符串
 *   5. \n\n 作为帧分隔符（SSE 标准格式）
 *   6. 解析每帧的 event / data 字段
 *   7. event === 'notice' → JSON.parse(data) → pushNotice()
 *
 * 错误处理：
 *   - 响应非 2xx / 无 body → 3 秒后重连
 *   - 流中断（done=true）→ 循环结束
 *   - AbortError（组件卸载）→ 静默退出，不重连
 *   - 其他网络错误 → 3 秒后重连
 */
async function connectSSE() {
  const token = useUserStore().getToken()
  if (!token) return

  // 每次连接前新建 AbortController（旧的已 abort 无法复用）
  abortController = new AbortController()

  try {
    const response = await fetch(`${env.apiBaseUrl}/userInfo/notice/sse`, {
      headers: { Authorization: token },
      signal: abortController.signal,
    })

    // 非 2xx 或无响应体 → 等待重连
    if (!response.ok || !response.body) {
      scheduleReconnect()
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    // 循环读取流数据，直到 done 或出错
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      // 解码当前 chunk，拼入 buffer（stream: true 保留多字节字符的完整性）
      buffer += decoder.decode(value, { stream: true })

      // SSE 帧以隔一个空行分隔 → 按 \n\n 切分
      const parts = buffer.split('\n\n')
      // 最后一段可能不完整，留在 buffer 等下一次拼接
      buffer = parts.pop() || ''

      for (const part of parts) {
        const parsed = parseSSEFrame(part)
        if (parsed.event === 'notice' && parsed.data) {
          try {
            pushNotice(JSON.parse(parsed.data))
          } catch {
            console.warn('[LayNotice] SSE 数据解析失败', parsed.data)
          }
        }
      }
    }
  } catch (err: any) {
    // AbortError = 主动断开（disconnectSSE）→ 不重连
    if (err.name !== 'AbortError') {
      scheduleReconnect()
    }
  }
}

/**
 * 解析单个 SSE 帧
 *
 * SSE 标准帧格式（每行一个字段）：
 *   event: notice
 *   data: {"type":"1","title":"系统维护通知","description":"..."}
 *
 * 两个字段之间用 \n 分隔，帧之间用 \n\n 分隔。
 *
 * @param frame  原始帧字符串（不含末尾的 \n\n）
 * @returns      提取出的 { event, data }
 */
function parseSSEFrame(frame: string): { event?: string; data?: string } {
  const result: { event?: string; data?: string } = {}
  for (const line of frame.split('\n')) {
    if (line.startsWith('event: ')) {
      result.event = line.slice(7) // 去掉 "event: " 前缀
    } else if (line.startsWith('data: ')) {
      result.data = line.slice(6) // 去掉 "data: " 前缀
    }
  }
  return result
}

/**
 * 断开后延迟重连
 *
 * 等待 3 秒后重试，避免网络抖动时频繁请求。
 * 重试前检查 AbortController 是否已被 abort（组件可能已卸载）。
 */
function scheduleReconnect() {
  setTimeout(() => {
    if (abortController && !abortController.signal.aborted) {
      connectSSE()
    }
  }, 3000)
}

/**
 * 断开 SSE 连接（组件卸载时调用）
 *
 * abort() 会触发 fetch 抛出 AbortError，connectSSE 捕获后静默退出。
 */
function disconnectSSE() {
  abortController?.abort()
  abortController = null
}

// ==================== 通知数据管理 ====================

/** 通知数据（响应式，SSE 推送会直接写入） */
const notices = ref<TabItem[]>(createEmptyTabs())

/** 当前激活的标签页 key（Tab v-model） */
const activeKey = ref<string>(notices.value[0]!.key)

/** el-dropdown 组件引用（调用 handleClose 关闭下拉面板） */
const dropdownRef = ref<{ handleClose: () => void } | null>(null)

/**
 * 将 SSE 推送的通知分发到对应标签页
 *
 * @param item  SSE 推送的单条通知数据
 */
function pushNotice(item: ListItem) {
  const tab = notices.value.find((t) => t.key === item.type)
  if (tab) {
    tab.list.unshift(item)
  }
}

/**
 * 计算标签页显示文本
 * 格式：标签名(数量)，如 "消息(3)"
 */
const getLabel = computed(() => {
  return (item: TabItem) =>
    item.name + (item.list.length > 0 ? `(${item.list.length})` : '')
})

/** 当前激活的标签页是否有数据 */
const currentNoticeHasData = computed(() => {
  const current = notices.value.find((item) => item.key === activeKey.value)
  return current && current.list.length > 0
})

/** 是否有任何标签页包含数据（控制铃铛红点） */
const hasAnyNoticeData = computed(() => {
  return notices.value.some((item) => item.list.length > 0)
})

// ==================== 操作 ====================

/** 查看更多 → 关闭下拉面板（下游项目可改为 router.push 跳转到通知详情页） */
const onWatchMore = () => {
  dropdownRef.value?.handleClose()
}

/**
 * 标为已读 → 清空当前标签页数据 + 通知后端
 *
 * 调用 POST /userInfo/notice/read 告知后端已读，
 * 同时清空本地列表。
 */
async function onMarkAsRead() {
  // 通知后端（走 axios 拦截器，自动注入 token）
  try {
    await markNoticeRead(activeKey.value)
  } catch {
    // 静默失败，本地仍清空
  }

  // 清空本地数据
  const current = notices.value.find((item) => item.key === activeKey.value)
  if (current) {
    current.list = []
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  connectSSE()
})

onUnmounted(() => {
  disconnectSSE()
})
</script>

<template>
  <el-dropdown ref="dropdownRef" trigger="click" placement="bottom-end">
    <!-- 铃铛触发器 -->
    <span class="notice-trigger">
      <el-badge is-dot :hidden="!hasAnyNoticeData">
        <span class="notice-bell-icon">
          <el-icon :size="18"><Bell /></el-icon>
        </span>
      </el-badge>
    </span>

    <!-- 下拉面板 -->
    <template #dropdown>
      <el-dropdown-menu>
        <el-tabs
          v-model="activeKey"
          :stretch="true"
          class="notice-tabs"
          :style="{ width: notices.length === 0 ? '200px' : '330px' }"
        >
          <el-empty
            v-if="notices.length === 0"
            description="暂无消息"
            :image-size="60"
          />
          <span v-else>
            <template v-for="item in notices" :key="item.key">
              <el-tab-pane :label="getLabel(item)" :name="item.key">
                <el-scrollbar max-height="345px">
                  <div class="notice-list-container">
                    <NoticeList :list="item.list" :empty-text="item.emptyText" />
                  </div>
                </el-scrollbar>
              </el-tab-pane>
            </template>
          </span>
        </el-tabs>

        <!-- 底部操作栏 -->
        <div
          v-if="currentNoticeHasData"
          class="notice-footer"
        >
          <div class="notice-footer-inner">
            <el-button type="primary" size="small" text @click="onWatchMore">
              查看更多
              <el-icon><ArrowRight /></el-icon>
            </el-button>
            <el-button type="primary" size="small" text @click="onMarkAsRead">
              标为已读
            </el-button>
          </div>
        </div>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style lang="scss" scoped>
/**
 * ==================== 铃铛摇晃动画 ====================
 * 鼠标悬停时触发，模拟铃铛被敲击的效果
 */
@keyframes notice-bell-ring {
  0%,
  100% {
    transform-origin: top;
  }

  15% {
    transform: rotateZ(10deg);
  }

  30% {
    transform: rotateZ(-10deg);
  }

  45% {
    transform: rotateZ(5deg);
  }

  60% {
    transform: rotateZ(-5deg);
  }

  75% {
    transform: rotateZ(2deg);
  }
}

/* ==================== 铃铛触发器 ==================== */
.notice-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 48px;
  cursor: pointer;

  .notice-bell-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: hsl(var(--muted-foreground));
    transition: color 0.2s;
  }

  &:hover {
    .notice-bell-icon {
      color: hsl(var(--foreground));
      animation: notice-bell-ring 1s both;
    }
  }
}

/* ==================== 下拉面板内标签页 ==================== */
.notice-tabs {
  .notice-list-container {
    padding: 15px 24px 0;
  }

  :deep(.el-tabs__header) {
    margin: 0;
  }

  :deep(.el-tabs__nav-wrap)::after {
    height: 1px;
  }

  :deep(.el-tabs__nav-wrap) {
    padding: 0 36px;
  }
}

/* ==================== 底部操作栏 ==================== */
.notice-footer {
  border-top: 1px solid hsl(var(--border));
  font-size: 13px;
}

.notice-footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 4px;
}
</style>
