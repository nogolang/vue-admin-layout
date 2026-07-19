<!--
  ==================== 标签页组件（Tabbar） ====================

  位于主内容区顶部，展示当前打开的所有页面的标签页。

  功能特性：
    1. 自动管理标签页 —— 导航时自动添加、激活对应标签
    2. 固定标签（affix） —— 首页等标签不可关闭
    3. 右键菜单       —— 关闭当前/其他/左侧/右侧/全部标签
    4. 点击切换路由 —— 点击标签跳转到对应页面
    5. 关闭自动跳转 —— 关闭标签后自动激活相邻标签

  与 TabbarStore 的关系：
    - TabbarStore 维护标签页数据和状态
    - 本组件消费 store 的数据，渲染 el-tabs
    - 所有关闭/切换操作通过 store 的方法完成

  路由 meta 约定：
    - meta.hidden: true → 不在标签页中显示（如登录页、404）
    - meta.title: string → 标签页显示的文本
-->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTabbarStore } from '@/stores/tabbar'
import { appConfig } from '@/app.config'

defineOptions({ name: 'LayoutTabbar' })

const route = useRoute()
const router = useRouter()
const tabbarStore = useTabbarStore()

/**
 * 监听路由变更，自动将当前页面加入标签列表
 *
 * 过滤逻辑：meta.hidden 为 true 的路由不会加入标签页（如登录页、404页面）
 * immediate: true 确保首次进入时也能添加标签
 * oldFullPath 为空（首次进入）时也加入标签，确保护航
 */
watch(
  () => route.fullPath,
  (_fullPath, oldFullPath) => {
    // 非隐藏页面才加入标签
    if (!route.meta?.hidden) {
      tabbarStore.addTab(route)
    }
    // 首次导航（刷新页面），强制添加
    if (!oldFullPath) {
      tabbarStore.addTab(route)
    }
  },
  { immediate: true },
)

/**
 * 点击标签 → 跳转到对应页面的完整路径
 *
 * 为什么不直接用 route.path？
 *   fullPath 包含 query 和 hash，能保留搜索条件和锚点定位
 *
 * @param key  标签的唯一键（即 route.fullPath）
 */
function handleTabClick(key: string) {
  const tab = tabbarStore.tabs.find((t) => t.key === key)
  if (tab) router.push(tab.fullPath)
}

/**
 * 关闭标签（点击标签上的 × 按钮）
 *
 * 关闭规则：
 *   1. 固定标签（affix = true）不可关闭，直接忽略
 *   2. 关闭当前标签后，自动激活相邻的标签（优先激活右侧，否则激活左侧）
 *   3. 所有标签都关完了 → 不做跳转（理论上不会发生，因为固定标签不可关闭）
 *
 * @param key  要关闭的标签键
 */
function handleTabRemove(key: string) {
  const tab = tabbarStore.tabs.find((t) => t.key === key)
  // 固定标签不可关闭
  if (!tab || tab.affix) return

  const idx = tabbarStore.tabs.indexOf(tab)
  tabbarStore.closeTab(key)

  // 如果关闭的是当前激活的标签，需要激活相邻标签
  if (key === tabbarStore.activeKey) {
    const remaining = tabbarStore.tabs
    if (remaining.length === 0) return // 无标签，不跳转
    // 优先选右侧，否则选左侧
    const nextTab = remaining[Math.min(idx, remaining.length - 1)]!
    router.push(nextTab.fullPath)
  }
}

// ==================== 右键菜单逻辑 ====================

/** 右键菜单的状态（响应式） */
const contextMenu = reactive({
  visible: false, // 是否显示菜单
  x: 0,           // 菜单的水平位置（px）
  y: 0,           // 菜单的垂直位置（px）
  tabKey: '',     // 右键点击的标签键
})

/**
 * 右键点击标签 → 在鼠标位置弹出右键菜单
 *
 * @param e   鼠标事件对象
 * @param key 被点击标签的 key
 */
function handleContextMenu(e: MouseEvent, key: string) {
  e.preventDefault()       // 阻止浏览器默认右键菜单
  e.stopPropagation()      // 防止事件冒泡触发其他元素
  contextMenu.visible = true
  contextMenu.x = e.clientX
  contextMenu.y = e.clientY
  contextMenu.tabKey = key
}

/** 隐藏右键菜单 */
function hideContextMenu() {
  contextMenu.visible = false
}

/** 点击页面任意位置 → 关闭右键菜单 */
function onGlobalClick() {
  hideContextMenu()
}

// 注册/注销全局点击监听
onMounted(() => {
  document.addEventListener('click', onGlobalClick)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onGlobalClick)
})

/**
 * 右键菜单操作分发
 *
 * 支持的操作：
 *   close-current  —— 关闭当前标签
 *   close-others   —— 关闭其他标签（保留当前）
 *   close-left     —— 关闭左侧标签
 *   close-right    —— 关闭右侧标签
 *   close-all      —— 关闭全部（保留固定标签）
 *
 * @param action  操作类型字符串
 */
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
      // 关闭所有后默认跳转到首页
      router.push(appConfig.app.homePath)
      break
  }
  hideContextMenu()
}

/**
 * 判断当前右键选中的标签是否是固定标签
 * 固定标签不显示"关闭当前"菜单项
 */
const currentAffix = () => {
  const tab = tabbarStore.tabs.find((t) => t.key === contextMenu.tabKey)
  return tab?.affix ?? true
}
</script>

<template>
  <!-- 标签页容器 -->
  <div class="tabbar-wrap">
    <!--
      el-tabs 的 card 模式：
        - model-value 绑定当前路由的 fullPath，实现路由 ↔ 标签联动
        - @tab-click  点击标签时跳转
        - @tab-remove 点击 × 按钮时关闭标签
    -->
    <el-tabs
      :model-value="route.fullPath"
      type="card"
      closable
      class="tabbar-tabs"
      @tab-click="(tab: any) => handleTabClick(tab.props.name as string)"
      @tab-remove="handleTabRemove"
    >
      <!--
        遍历 store 中的标签数据。
        sortedTabs 会自动将固定标签排在前面、非固定标签排在后面。
        closable: !tab.affix → 固定标签不显示关闭按钮。
      -->
      <el-tab-pane
        v-for="tab in tabbarStore.sortedTabs"
        :key="tab.key"
        :name="tab.key"
        :closable="!tab.affix"
      >
        <template #label>
          <!-- label 内嵌 span 以支持右键菜单事件 -->
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
      右键菜单 —— 通过 Teleport 渲染到 body，避免被父容器 overflow 裁剪
      定位使用 fixed + clientX/clientY，相对于视口
    -->
    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        class="tab-context-menu"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      >
        <!-- 固定标签不显示"关闭当前"选项 -->
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
        <!-- divider 类添加顶部分隔线，视觉上与上方操作区分 -->
        <div class="context-item divider" @click="onContextAction('close-all')">
          关闭全部
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
/* ==================== 标签页容器 ==================== */
.tabbar-wrap {
  flex-shrink: 0;               /* 不参与 flex 伸缩，保持固定高度 */
  background: hsl(0 0% 100%);
  padding: 0 8px;
}

/* ==================== el-tabs 样式覆盖 ==================== */
.tabbar-tabs {
  --el-tabs-header-height: 36px; /* 标签栏高度 */

  /* 标签头部容器 */
  :deep(.el-tabs__header) {
    margin: 0;
    border-bottom: 1px solid hsl(var(--border));
    background: transparent;
  }

  /* 隐藏 el-tabs 默认底部短线 */
  :deep(.el-tabs__nav-wrap) {
    &::after {
      display: none;
    }
  }

  :deep(.el-tabs__nav) {
    border: none;
  }

  /* 左右滚动按钮 */
  :deep(.el-tabs__nav-next),
  :deep(.el-tabs__nav-prev) {
    height: 36px;
    line-height: 36px;
    font-size: 12px;
  }

  /* 单个标签项 */
  :deep(.el-tabs__item) {
    height: 36px;
    line-height: 36px;
    font-size: 13px;
    padding: 0 12px;
    margin: 0 2px;
    border: none !important;           /* 去掉 el-tabs 默认边框 */
    border-radius: var(--radius) var(--radius) 0 0;
    color: hsl(var(--muted-foreground));
    background: transparent;
    transition: all 0.2s ease;
    position: relative;

    /* 激活态底部指示条 */
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

    /* hover 态 */
    &:hover {
      color: hsl(var(--foreground));
      background: hsl(var(--accent) / 0.5);

      .el-tabs__close {
        opacity: 0.7;
      }
    }

    /* 激活态 */
    &.is-active {
      color: hsl(var(--primary));
      background: transparent;
      font-weight: 500;

      &::after {
        background: hsl(var(--primary)); /* 底部蓝色指示条 */
      }
    }
  }

  /* 关闭按钮 */
  :deep(.el-tabs__close) {
    width: 16px;
    height: 16px;
    font-size: 10px;
    color: hsl(var(--muted-foreground));
    opacity: 0;                        /* 默认隐藏，hover 时显示 */
    transition: opacity 0.15s, color 0.15s;
    border-radius: 3px;
    margin-left: 4px;

    &:hover {
      color: hsl(var(--foreground));
      background: hsl(var(--accent));
    }
  }

  /* 当前标签和 hover 标签显示关闭按钮 */
  :deep(.el-tabs__item:hover .el-tabs__close) {
    opacity: 0.7;
  }
  :deep(.el-tabs__item.is-active .el-tabs__close) {
    opacity: 0.7;
  }

  /* 新建标签按钮（+ 号） */
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

/* 标签文本（限制最大宽度，超出省略） */
.tab-label {
  display: inline-block;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  user-select: none; /* 防止双击选中文字 */
}

/* ==================== 右键菜单样式 ==================== */
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

/* 单个菜单项 */
.context-item {
  padding: 8px 16px;
  font-size: 13px;
  color: hsl(var(--foreground));
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: hsl(var(--accent));
    color: hsl(var(--primary)); /* hover 时高亮为主色 */
  }

  /* 顶部分隔线（"关闭全部"的视觉分隔） */
  &.divider {
    border-top: 1px solid hsl(var(--border));
    margin-top: 4px;
    padding-top: 12px;
  }
}
</style>
