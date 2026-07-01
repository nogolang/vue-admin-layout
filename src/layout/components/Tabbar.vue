<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTabbarStore } from '@/stores/tabbar'

defineOptions({ name: 'LayoutTabbar' })

const route = useRoute()
const router = useRouter()
const tabbarStore = useTabbarStore()

watch(
  () => route.fullPath,
  (_fullPath, oldFullPath) => {
    if (!route.meta?.hidden) {
      tabbarStore.addTab(route)
    }
    if (!oldFullPath) {
      tabbarStore.addTab(route)
    }
  },
  { immediate: true },
)

function handleTabClick(key: string) {
  const tab = tabbarStore.tabs.find((t) => t.key === key)
  if (tab) router.push(tab.fullPath)
}

function handleTabRemove(key: string) {
  const tab = tabbarStore.tabs.find((t) => t.key === key)
  if (!tab || tab.affix) return
  const idx = tabbarStore.tabs.indexOf(tab)
  tabbarStore.closeTab(key)
  if (key === tabbarStore.activeKey) {
    const remaining = tabbarStore.tabs
    if (remaining.length === 0) return
    const nextTab = remaining[Math.min(idx, remaining.length - 1)]!
    router.push(nextTab.fullPath)
  }
}

// ==================== 右键菜单 ====================
const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  tabKey: '',
})

function handleContextMenu(e: MouseEvent, key: string) {
  e.preventDefault()
  e.stopPropagation()
  contextMenu.visible = true
  contextMenu.x = e.clientX
  contextMenu.y = e.clientY
  contextMenu.tabKey = key
}

function hideContextMenu() {
  contextMenu.visible = false
}

function onGlobalClick() {
  hideContextMenu()
}

onMounted(() => {
  document.addEventListener('click', onGlobalClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onGlobalClick)
})

function onContextAction(action: string) {
  const key = contextMenu.tabKey
  switch (action) {
    case 'close-current':
      handleTabRemove(key)
      break
    case 'close-others':
      tabbarStore.closeOtherTabs(key)
      break
    case 'close-left':
      tabbarStore.closeLeftTabs(key)
      break
    case 'close-right':
      tabbarStore.closeRightTabs(key)
      break
    case 'close-all':
      tabbarStore.closeAllTabs()
      router.push('/dashboard')
      break
  }
  hideContextMenu()
}

const currentAffix = () => {
  const tab = tabbarStore.tabs.find((t) => t.key === contextMenu.tabKey)
  return tab?.affix ?? true
}
</script>

<template>
  <div class="tabbar-wrap">
    <el-tabs
      :model-value="route.fullPath"
      type="card"
      closable
      class="tabbar-tabs"
      @tab-click="(tab: any) => handleTabClick(tab.props.name as string)"
      @tab-remove="handleTabRemove"
    >
      <el-tab-pane
        v-for="tab in tabbarStore.sortedTabs"
        :key="tab.key"
        :name="tab.key"
        :closable="!tab.affix"
      >
        <template #label>
          <span
            class="tab-label"
            @contextmenu="handleContextMenu($event, tab.key)"
          >
            {{ tab.title }}
          </span>
        </template>
      </el-tab-pane>
    </el-tabs>

    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        class="tab-context-menu"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      >
        <div
          v-if="!currentAffix()"
          class="context-item"
          @click="onContextAction('close-current')"
        >
          关闭当前
        </div>
        <div class="context-item" @click="onContextAction('close-others')">
          关闭其他
        </div>
        <div class="context-item" @click="onContextAction('close-left')">
          关闭左侧
        </div>
        <div class="context-item" @click="onContextAction('close-right')">
          关闭右侧
        </div>
        <div class="context-item divider" @click="onContextAction('close-all')">
          关闭全部
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.tabbar-wrap {
  flex-shrink: 0;
  background: hsl(0 0% 100%);
  padding: 0 8px;
}

.tabbar-tabs {
  --el-tabs-header-height: 36px;

  :deep(.el-tabs__header) {
    margin: 0;
    border-bottom: 1px solid hsl(var(--border));
    background: transparent;
  }

  :deep(.el-tabs__nav-wrap) {
    &::after {
      display: none;
    }
  }

  :deep(.el-tabs__nav) {
    border: none;
  }

  :deep(.el-tabs__nav-next),
  :deep(.el-tabs__nav-prev) {
    height: 36px;
    line-height: 36px;
    font-size: 12px;
  }

  :deep(.el-tabs__item) {
    height: 36px;
    line-height: 36px;
    font-size: 13px;
    padding: 0 12px;
    margin: 0 2px;
    border: none !important;
    border-radius: var(--radius) var(--radius) 0 0;
    color: hsl(var(--muted-foreground));
    background: transparent;
    transition: all 0.2s ease;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 12px;
      right: 12px;
      height: 2px;
      background: transparent;
      border-radius: 1px 1px 0 0;
      transition: background 0.2s ease;
    }

    &:hover {
      color: hsl(var(--foreground));
      background: hsl(var(--accent) / 0.5);

      .el-tabs__close {
        opacity: 0.7;
      }
    }

    &.is-active {
      color: hsl(var(--primary));
      background: transparent;
      font-weight: 500;

      &::after {
        background: hsl(var(--primary));
      }
    }
  }

  // 关闭按钮
  :deep(.el-tabs__close) {
    width: 16px;
    height: 16px;
    font-size: 10px;
    color: hsl(var(--muted-foreground));
    opacity: 0;
    transition: opacity 0.15s, color 0.15s;
    border-radius: 3px;
    margin-left: 4px;

    &:hover {
      color: hsl(var(--foreground));
      background: hsl(var(--accent));
    }
  }

  :deep(.el-tabs__item:hover .el-tabs__close) {
    opacity: 0.7;
  }
  :deep(.el-tabs__item.is-active .el-tabs__close) {
    opacity: 0.7;
  }

  // 新标签按钮
  :deep(.el-tabs__new-tab) {
    margin: 0 4px;
    height: 36px;
    line-height: 36px;
    color: hsl(var(--muted-foreground));
    transition: color 0.15s;

    &:hover {
      color: hsl(var(--primary));
    }
  }
}

.tab-label {
  display: inline-block;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  user-select: none;
}

// 右键菜单
.tab-context-menu {
  position: fixed;
  z-index: var(--z-popup);
  min-width: 120px;
  background: hsl(var(--popover));
  border-radius: var(--radius);
  box-shadow: var(--shadow-popover);
  border: 1px solid hsl(var(--border));
  padding: 4px 0;
}

.context-item {
  padding: 8px 16px;
  font-size: 13px;
  color: hsl(var(--foreground));
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: hsl(var(--accent));
    color: hsl(var(--primary));
  }

  &.divider {
    border-top: 1px solid hsl(var(--border));
    margin-top: 4px;
    padding-top: 12px;
  }
}
</style>
