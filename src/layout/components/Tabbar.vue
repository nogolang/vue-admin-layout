<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTabbarStore } from '@/stores/tabbar'

defineOptions({ name: 'LayoutTabbar' })

const route = useRoute()
const router = useRouter()
const tabbarStore = useTabbarStore()

/**
 * 监听路由变化，自动添加标签页
 * hidden 页面（404 / login）不添加到标签栏
 * oldFullPath 为 undefined 表示首次加载（含刷新），补加当前路由
 */
watch(
  () => route.fullPath,
  (_fullPath, oldFullPath) => {
    if (!route.meta?.hidden) {
      tabbarStore.addTab(route)
    }
    // 刷新页面时首次触发，oldFullPath 为 undefined，此时补一条
    if (!oldFullPath) {
      tabbarStore.addTab(route)
    }
  },
  { immediate: true },
)

/** 点击标签 → 导航到对应页面 */
function handleTabClick(key: string) {
  const tab = tabbarStore.tabs.find((t) => t.key === key)
  if (tab) {
    router.push(tab.fullPath)
  }
}

/**
 * 关闭标签
 * - affix（固定标签，如 Dashboard）不允许关闭
 * - 若关闭的是当前标签，跳转到相邻标签
 */
function handleTabRemove(key: string) {
  const tab = tabbarStore.tabs.find((t) => t.key === key)
  if (!tab || tab.affix) return

  const idx = tabbarStore.tabs.indexOf(tab)
  tabbarStore.closeTab(key)

  // 关闭的是当前标签 → 跳转到最近的标签
  if (key === tabbarStore.activeKey) {
    const remaining = tabbarStore.tabs
    if (remaining.length === 0) return
    const nextTab = remaining[Math.min(idx, remaining.length - 1)]!
    router.push(nextTab.fullPath)
  }
}

// ==================== 右键菜单 ====================

/** 右键菜单状态 */
const contextMenu = reactive({
  visible: false, // 是否显示
  x: 0,           // 鼠标 clientX
  y: 0,           // 鼠标 clientY
  tabKey: '',     // 右键点击的标签 key
})

/** 右键打开菜单 */
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

/** 点击页面其他地方自动关闭右键菜单 */
function onGlobalClick() {
  hideContextMenu()
}

onMounted(() => {
  document.addEventListener('click', onGlobalClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onGlobalClick)
})

/** 处理右键菜单操作 */
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

/** 右键的标签是否是固定标签（affix 标签不显示"关闭当前"） */
const currentAffix = () => {
  const tab = tabbarStore.tabs.find((t) => t.key === contextMenu.tabKey)
  return tab?.affix ?? true
}
</script>

<template>
  <!--
    标签栏容器
    el-tabs type="card" → 卡片风格标签
    closable → 显示关闭按钮
    model-value 绑定当前路由 fullPath → 激活对应标签
  -->
  <div class="tabbar-wrap">
    <el-tabs
      :model-value="route.fullPath"
      type="card"
      closable
      class="tabbar-tabs"
      @tab-click="(tab: any) => handleTabClick(tab.props.name as string)"
      @tab-remove="handleTabRemove"
    >
      <!--
        遍历 sortedTabs：固定标签（Dashboard）始终在前
        affix 标签不可关闭（closable 为 false）
      -->
      <el-tab-pane
        v-for="tab in tabbarStore.sortedTabs"
        :key="tab.key"
        :name="tab.key"
        :closable="!tab.affix"
      >
        <template #label>
          <!-- 标签文字区域 —— 绑定右键事件 -->
          <span
            class="tab-label"
            @contextmenu="handleContextMenu($event, tab.key)"
          >
            {{ tab.title }}
          </span>
        </template>
      </el-tab-pane>
    </el-tabs>

    <!--
      右键菜单 —— Teleport 到 body 防止被 overflow: hidden 裁剪
      菜单位置跟随鼠标 clientX / clientY
    -->
    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        class="tab-context-menu"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      >
        <!-- affix 标签（Dashboard）不显示"关闭当前" -->
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
        <div class="context-item" @click="onContextAction('close-all')">
          关闭全部
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
// 标签栏外层（flex-shrink: 0 → 不参与滚动，始终固定在内容区顶部）
.tabbar-wrap {
  flex-shrink: 0;
  background: var(--header-bg, #fff);
}

// el-tabs 高度变量，改这个值 → 整体标签高度同步变化
.tabbar-tabs {
  --el-tabs-header-height: 34px;

  :deep(.el-tabs__header) {
    margin: 0;
    border-bottom: 1px solid var(--header-border, hsl(240 5.9% 90%));
    background: var(--header-bg, #fff);
  }

  :deep(.el-tabs__nav) {
    border: none;
  }

  // 单个标签：未激活浅灰，激活白底深字
  :deep(.el-tabs__item) {
    height: 34px;
    line-height: 34px;
    font-size: 12px;
    padding: 0 12px;
    border: none;
    border-right: 1px solid var(--header-border, hsl(240 5.9% 90%));
    color: $color-text-muted;
    background: $color-bg-hover;

    &.is-active {
      color: $color-text-primary;
      background: #fff;
    }
  }
}

// 标签文字：超长截断 + 禁止选中
.tab-label {
  display: inline-block;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  user-select: none;
}

// 右键菜单：fixed 定位，z-index 3000 确保最上层
.tab-context-menu {
  position: fixed;
  z-index: 3000;
  min-width: 100px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  padding: 4px 0;
}

// 菜单项
.context-item {
  padding: 6px 16px;
  font-size: 13px;
  color: $color-text-primary;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: $color-bg-hover;
  }
}
</style>
