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
import { useUserStore } from '@/stores/user'
import { markNoticeRead, createNoticeSSE } from '@/api/user/notice'
import type { NoticeItem } from '@/api/user/notice'
import { createEmptyTabs } from './data'
import type { ListItem, TabItem } from './data'
import NoticeList from './NoticeList.vue'

defineOptions({ name: 'LayNotice' })

// ==================== SSE 连接 ====================

let sse: ReturnType<typeof createNoticeSSE> | null = null

function connectSSE() {
  if (!useUserStore().getToken()) return
  disconnectSSE()
  sse = createNoticeSSE(() => useUserStore().getToken(), pushNotice)
}

function disconnectSSE() {
  sse?.disconnect()
  sse = null
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
function pushNotice(item: NoticeItem) {
  const tab = notices.value.find((t) => t.key === item.type)
  if (tab) {
    tab.list.unshift(item as ListItem)
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
