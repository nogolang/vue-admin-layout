<!--
  ==================== 基础布局（BasicLayout） ====================

  整个应用的页面骨架，登录后所有页面都嵌套在此布局内。

  布局结构（从上到下）：
    Header (48px) → Body (剩余高度)
      Body 内部（从左到右）：
        侧边栏 → 主内容区

  支持两种侧边栏模式：
    sidebar-nav        垂直单列侧边栏，可折叠 + 可拖拽调整宽度
    sidebar-mixed-nav  双列侧边栏，左侧图标导航 + 右侧菜单面板

  路由约定：
    - 所有需登录的页面注册在名为 "Root" 的路由 children 中
    - 本组件作为 Root 的 component，通过 <RouterView /> 渲染子页面
    - /login、/404 等独立页面与 Root 平级，不使用本布局
-->
<script setup lang="ts">
// ==================== 1. 依赖导入 ====================

import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLayoutStore } from '@/stores/layout'
import { usePermissionStore } from '@/stores/permission'
import { useUserStore } from '@/stores/user'
import { appConfig } from '@/app.config'
import { logout } from '@/api/system/sysUser'
import { iconMap } from '@/router/menus'
import type { MenuItem } from '@/router/menus'
import LayoutTabbar from './components/Tabbar.vue'
import MenuNode from './components/MenuNode.vue'
import LayNotice from './layNotice/index.vue'

// Element Plus 图标（仅 Layout 自身使用的，菜单图标走 iconMap）
import { Expand, Fold, ArrowDown } from '@element-plus/icons-vue'

defineOptions({ name: 'BasicLayout' })

// ==================== 2. Store & 路由实例 ====================

const route = useRoute()
const router = useRouter()
const layoutStore = useLayoutStore()
const permissionStore = usePermissionStore()
const userStore = useUserStore()

/** 退出登录：通知后端 + 清除前端状态 + 跳转登录页 */
async function handleLogout() {
  try { await logout() } catch { /* 后端不可达时仍要清理前端状态 */ }
  await userStore.clearUserState()
  router.push('/login')
}

/** 侧边栏菜单（过滤掉 meta.hidden 的页面，如登录页） */
const menuList = computed(() => permissionStore.allMenus.filter((m) => !m.meta?.hidden))

// ==================== 3. 侧边栏拖拽调整宽度 ====================
//
// 两种模式都支持拖拽：
//   sidebar-nav       → 直接从 viewport 左边缘计算宽度（sidebar 从 x=0 开始）
//   sidebar-mixed-nav → 减去第一列宽度（80px）得到第二列宽度

const isDragging = ref(false)
const dragOffset = ref(0)    // 拖拽目标元素距 viewport 左边缘的 px 数

function onDragStart(e: MouseEvent) {
  isDragging.value = true
  dragOffset.value = layoutStore.isSidebarMixedNav ? 80 : 0
  document.addEventListener('mousemove', onDragging)
  document.addEventListener('mouseup', onDragEnd)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  e.preventDefault()
}

function onDragging(e: MouseEvent) {
  if (!isDragging.value) return
  layoutStore.sidebarWidth = Math.min(480, Math.max(160, e.clientX - dragOffset.value))
}

function onDragEnd() {
  isDragging.value = false
  document.removeEventListener('mousemove', onDragging)
  document.removeEventListener('mouseup', onDragEnd)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// ==================== 4. 垂直侧边栏（sidebar-nav）逻辑 ====================

/** el-menu 实例引用，仅调用 open() 方法展开子菜单 */
const menuRef = ref<{ open: (index: string) => void } | null>(null)

/**
 * 在菜单树中递归查找 targetPath 的所有祖先路径
 * 返回从根到父的路径数组（不含 targetPath 自身），用于逐级展开嵌套子菜单
 */
function findAncestorPaths(menus: MenuItem[], targetPath: string): string[] | null {
  for (const item of menus) {
    if (item.path === targetPath) return []
    if (item.children?.length) {
      const ancestors = findAncestorPaths(item.children, targetPath)
      if (ancestors !== null) return [item.path, ...ancestors]
    }
  }
  return null
}

/**
 * 自动展开当前路由对应的所有祖先子菜单
 *
 * el-menu 的 default-active 只高亮当前项，不会自动展开祖先 sub-menu，
 * 因此需根据 route.path 查找所有祖先路径并逐级 open。
 */
function openActiveSubmenus() {
  const path = route.path
  const menus = menuList.value
  if (!menus.length) return

  nextTick(() => {
    const ancestors = findAncestorPaths(menus, path)
    if (ancestors) {
      for (const anc of ancestors) {
        menuRef.value?.open(anc)
      }
    }
  })
}

// 三种触发时机都要重新展开：
//   1. 组件首次挂载
//   2. 路由跳转
//   3. 动态路由加载完成（菜单数据从无到有）
onMounted(() => openActiveSubmenus())
watch(() => route.path, () => openActiveSubmenus())

// ==================== 5. 双列侧边栏（sidebar-mixed-nav）逻辑 ====================

/** 当前选中的顶级菜单路径（第一列高亮依据） */
const activeTopMenu = ref('')

/** 第二列展示的子菜单 = 当前顶级菜单的 children */
const extraMenus = computed(() => {
  const menu = menuList.value.find((m) => m.path === activeTopMenu.value)
  return menu?.children || []
})

const showExtra = computed(() => extraMenus.value.length > 0)
const activeTopMenuName = computed(() =>
  menuList.value.find((m) => m.path === activeTopMenu.value)?.name || ''
)

/** 第二列 el-menu 实例引用 */
const extraMenuRef = ref<{ open: (index: string) => void } | null>(null)

/** 在当前菜单树中查找 path 所属的顶级菜单路径（找不到返回空字符串） */
function findTopMenu(path: string): string {
  for (const menu of menuList.value) {
    if (menu.path === path) return menu.path
    if (menu.children?.some((c) => path.startsWith(c.path))) return menu.path
  }
  return ''
}

/** 根据当前路由同步第一列高亮状态 */
function syncActiveTopMenu() {
  const top = findTopMenu(route.path)
  if (top) activeTopMenu.value = top
}

/** 展开第二列中匹配当前路由的所有祖先子菜单 */
function openExtraSubmenus() {
  nextTick(() => {
    const ancestors = findAncestorPaths(extraMenus.value, route.path)
    if (ancestors) {
      for (const anc of ancestors) {
        extraMenuRef.value?.open(anc)
      }
    }
  })
}

onMounted(() => { syncActiveTopMenu(); openExtraSubmenus() })
watch(() => route.path, () => { syncActiveTopMenu(); openExtraSubmenus() })

/**
 * 点击第一列图标 → 激活该顶级菜单。
 * 有子级时自动跳转到第一个子页面，无子级时直接跳转自身。
 */
function handleTopMenuClick(menu: MenuItem) {
  activeTopMenu.value = menu.path
  if (!menu.children?.length) {
    router.push(menu.path)
  } else {
    const firstChild = extraMenus.value[0]
    if (firstChild) router.push(firstChild.path)
  }
}
</script>

<!-- ==================== 模板 ==================== -->
<template>
  <div class="admin-layout" :class="`layout-${layoutStore.layout}`">

    <!-- ===== Header：Logo + 留白 + 右侧操作 ===== -->
    <header class="admin-header">
      <div class="header-logo">
        <div class="logo-icon">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="hsl(var(--primary))" />
            <path d="M8 22V10l8 6-8 6zM16 22V10l8 6-8 6z" fill="white" opacity="0.9" />
          </svg>
        </div>
        <span class="logo-text">{{ appConfig.app.logoText }}</span>
      </div>

      <div class="header-center" />

      <div class="header-actions">
        <LayNotice v-if="appConfig.notice.enableSSE" />
        <el-dropdown class="header-user" trigger="click">
          <span class="user-info">
            <el-avatar :size="28" icon="UserFilled" />
            <span class="user-name">{{ userStore.userInfo.nickname || appConfig.app.logoText }}</span>
            <el-icon :size="14"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="router.push('/home')">{{ appConfig.app.logoText }}首页</el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <!-- ===== Body：侧边栏 + 主内容 ===== -->
    <div class="admin-body">

      <!--
        ===== 布局模式一：垂直侧边栏 =====
        单列，支持折叠（toggle）和拖拽（resize handle）调整宽度
      -->
      <aside
        v-if="layoutStore.isSidebarNav"
        class="sidebar-nav"
        :class="{
          collapsed: layoutStore.sidebarCollapsed,
          dragging: isDragging,
        }"
        :style="layoutStore.sidebarCollapsed ? {} : { width: layoutStore.sidebarWidth + 'px' }"
      >
        <!-- 菜单滚动区 -->
        <div class="sidebar-nav-inner">
          <el-menu
            ref="menuRef"
            :default-active="route.path"
            :collapse="layoutStore.sidebarCollapsed"
            router
            class="sidebar-el-menu menu-override"
            popper-class="menu-popup"
          >
            <MenuNode v-for="item in menuList" :key="item.path" :item="item" :depth="0" />
          </el-menu>
        </div>

        <!-- 底部折叠按钮 -->
        <div class="sidebar-collapse-trigger" @click="layoutStore.toggleSidebar()">
          <el-icon :size="16">
            <Fold v-if="!layoutStore.sidebarCollapsed" />
            <Expand v-else />
          </el-icon>
        </div>
      </aside>

      <!-- 拖拽手柄：夹在侧边栏和主内容之间，展开时才显示 -->
      <div
        v-if="layoutStore.isSidebarNav && !layoutStore.sidebarCollapsed"
        class="sidebar-resize-handle"
        @mousedown="onDragStart"
      />

      <!--
        ===== 布局模式二：双列侧边栏 =====
        第一列：窄图标列（顶级菜单）
        第二列：子菜单面板（点击第一列后展开）
      -->
      <template v-if="layoutStore.isSidebarMixedNav">
        <!-- 第一列 -->
        <aside class="sidebar-mixed">
          <div class="mixed-menu-list">
            <div
              v-for="item in menuList"
              :key="item.path"
              class="mixed-menu-item"
              :class="{ active: activeTopMenu === item.path }"
              @click="handleTopMenuClick(item)"
            >
              <el-icon :size="20"><component :is="iconMap[item.icon]" /></el-icon>
              <span class="mixed-menu-label">{{ item.name }}</span>
            </div>
          </div>
        </aside>

        <!-- 第二列（仅当选中菜单有子级时显示，宽度可拖拽） -->
        <aside v-if="showExtra" class="sidebar-extra" :style="{ width: layoutStore.sidebarWidth + 'px' }">
          <div class="extra-title-bar">{{ activeTopMenuName }}</div>
          <div class="extra-menu-wrap">
            <el-menu
              ref="extraMenuRef"
              :default-active="route.path"
              router
              class="extra-el-menu menu-override"
              popper-class="menu-popup"
            >
              <MenuNode v-for="child in extraMenus" :key="child.path" :item="child" :depth="0" />
            </el-menu>
          </div>
        </aside>

        <!-- 双列模式拖拽手柄：第二列右边缘 -->
        <div
          v-if="showExtra"
          class="sidebar-resize-handle extra-resize-handle"
          @mousedown="onDragStart"
        />
      </template>

      <!-- ===== 主内容区 ===== -->
      <main class="admin-main">
        <LayoutTabbar v-if="appConfig.tabbar.showTabbar" />
        <div class="admin-content">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>

<!-- ==================== 样式（scoped） ==================== -->
<style scoped lang="scss">
/*
 * 设计变量说明（定义在 src/assets/css/variables.scss）：
 *   --header-height          Header 高度（48px）
 *   --sidebar-width          侧边栏展开宽度（224px，可被 JS 拖拽覆盖）
 *   --sidebar-collapse-width 侧边栏折叠宽度（60px）
 *   --sidebar-mixed-width    双列模式第一列宽（80px）
 *   --sidebar-extra-width    双列模式第二列宽（224px）
 *   --menu-item-height       菜单项高度
 *   --menu-font-size         菜单文字大小
 *   --menu-icon-size         菜单图标大小
 *   --menu-item-radius       菜单项圆角
 *   --menu-item-margin-x/y   菜单项外边距
 *
 * 颜色说明（HSL 通道值，可配合透明度）：
 *   --background      页面背景
 *   --background-deep 主内容区深色背景
 *   --foreground      文字色
 *   --header          Header 背景
 *   --sidebar         侧边栏背景
 *   --sidebar-deep    双列第一列背景（更深）
 *   --primary         主题色
 *   --accent          浅色 hover 背景
 *   --border          分割线颜色
 *   --muted-foreground 次要文字色
 */

// ================================================================
//  1. 布局壳
// ================================================================

.admin-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;     // Header 在上，Body 在下
  overflow: hidden;            // 防止双重滚动条
  background: hsl(var(--background));
}

// ================================================================
//  2. Header（顶部导航栏）
// ================================================================

.admin-header {
  height: var(--header-height);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: hsl(var(--header));
  border-bottom: 1px solid hsl(var(--border));
  box-shadow: var(--shadow-header);
  z-index: var(--z-header);
}

// 2a. Logo 区域
// 宽度与侧边栏对齐，保持视觉一致性
.header-logo {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: var(--sidebar-width);
  padding-left: 8px;
  transition: min-width 0.2s ease;
}

// 双列模式下 Logo 区域缩窄为第一列宽度
.layout-sidebar-mixed-nav .header-logo {
  min-width: var(--sidebar-mixed-width);
  justify-content: center;
  padding-left: 0;
}

.logo-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: hsl(var(--foreground));
  white-space: nowrap;
  letter-spacing: -0.3px;
}

// 2b. Header 中部占位（可放面包屑、搜索框等）
.header-center {
  flex: 1;
}

// 2c. Header 右侧操作区
.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.header-user {
  margin-left: 4px;
}

// 用户信息胶囊按钮
.user-info {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 2px 8px 2px 2px;
  border-radius: 999px;
  transition: background 0.2s;

  &:hover {
    background: hsl(var(--accent));
  }
}

.user-name {
  font-size: 14px;
  color: hsl(var(--foreground));
  user-select: none;
}

// ================================================================
//  3. Body（侧边栏 + 主内容容器）
// ================================================================

.admin-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

// ================================================================
//  4. 垂直侧边栏（sidebar-nav）
// ================================================================

.sidebar-nav {
  position: relative;           // 预留，子元素绝对定位时需要
  flex-shrink: 0;
  width: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  background: hsl(var(--sidebar));
  border-right: 1px solid hsl(var(--border));
  // 折叠/展开动画过渡（拖拽时通过 .dragging 关闭）
  transition: width 0.25s ease;
  overflow: hidden;

  &.collapsed {
    width: var(--sidebar-collapse-width);
  }

  &.dragging {
    transition: none;           // 拖拽时禁用过渡，跟手
  }
}

// 4a. 菜单滚动区
.sidebar-nav-inner {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0;
}

// 4b. 底部折叠按钮
.sidebar-collapse-trigger {
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: hsl(var(--muted-foreground));
  border-top: 1px solid hsl(var(--border));
  transition: color 0.2s, background 0.2s;
  flex-shrink: 0;

  &:hover {
    color: hsl(var(--primary));
    background: hsl(var(--accent));
  }
}

// ================================================================
//  5. 侧边栏拖拽手柄
//  独立于侧边栏之外，夹在 sidebar 和 main 之间
// ================================================================

.sidebar-resize-handle {
  flex-shrink: 0;
  width: 6px;
  margin-left: -3px;   // 一半宽度，居中于侧边栏右边缘
  cursor: col-resize;
  background: transparent;
  transition: background 0.2s;
  position: relative;
  z-index: 2;

  // 鼠标悬停或拖拽时显示蓝色指示线
  &:hover,
  &:active {
    background: hsl(var(--primary) /0.5);
  }
}

// ================================================================
//  6. 菜单样式覆盖（两种布局共用）
//  覆盖 Element Plus el-menu 默认样式，统一设计语言
// ================================================================

.menu-override {
  border-right: none !important;
  background: transparent !important;

  // ----- 6a. 菜单项 -----
  :deep(.el-menu-item) {
    height: var(--menu-item-height);
    line-height: var(--menu-item-height);
    margin: var(--menu-item-margin-y) var(--menu-item-margin-x);
    padding: 0 12px 0 var(--ml) !important;
    font-size: var(--menu-font-size);
    color: hsl(var(--foreground) /0.75);
    border-radius: var(--menu-item-radius);
    transition: all 0.2s ease;

    &:hover {
      color: hsl(var(--foreground));
      background: hsl(var(--accent)) !important;
    }

    // 激活态：主题色文字 + 浅色背景 + 左侧 3px 指示条
    &.is-active {
      color: hsl(var(--primary));
      background: hsl(var(--primary) /0.1) !important;
      font-weight: 500;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 16px;
        background: hsl(var(--primary));
        border-radius: 0 3px 3px 0;
      }
    }
  }

  // ----- 6b. 子菜单标题（可展开的父级） -----
  // 左侧缩进同样由 MenuNode 的 --ml 变量控制
  :deep(.el-sub-menu__title) {
    height: var(--menu-item-height);
    line-height: var(--menu-item-height);
    margin: var(--menu-item-margin-y) var(--menu-item-margin-x);
    padding: 0 12px 0 var(--ml) !important;
    font-size: var(--menu-font-size);
    color: hsl(var(--foreground) /0.75);
    border-radius: var(--menu-item-radius);
    transition: all 0.2s ease;

    &:hover {
      color: hsl(var(--foreground));
      background: hsl(var(--accent)) !important;
    }
  }

  // 展开/激活的父级标题用主题色
  :deep(.el-sub-menu.is-active > .el-sub-menu__title),
  :deep(.el-sub-menu.is-opened > .el-sub-menu__title) {
    color: hsl(var(--primary));
  }

  // ----- 6c. 嵌套层级缩进 -----
  // 已改为由 MenuNode 组件通过 CSS 变量 --ml 控制（depth * 16px + 12px）
  // 无需再写 .el-sub-menu .el-sub-menu ... 等深层选择器

  // ----- 6d. 展开箭头 -----
  :deep(.el-sub-menu__icon-arrow) {
    color: hsl(var(--muted-foreground));
    transition: transform 0.25s;
  }

  // ----- 6e. 图标 -----
  :deep(.el-menu-item .el-icon),
  :deep(.el-sub-menu__title .el-icon) {
    font-size: var(--menu-icon-size);
    transition: transform 0.25s;
    flex-shrink: 0;
    opacity: 0.7;
  }

  // 激活/展开时图标不透明
  :deep(.el-menu-item.is-active .el-icon),
  :deep(.el-sub-menu.is-opened > .el-sub-menu__title .el-icon) {
    opacity: 1;
  }

  // hover 时图标微放大
  :deep(.el-menu-item:hover .el-icon),
  :deep(.el-sub-menu__title:hover .el-icon) {
    transform: scale(1.15);
    opacity: 1;
  }
}

// 折叠模式下的 el-menu 样式修正：居中对齐、隐藏左侧激活指示条
.sidebar-el-menu {
  :deep(.el-menu--collapse) {
    .el-menu-item,
    .el-sub-menu__title {
      justify-content: center;
      padding: 0 !important;
    }
    .el-menu-item.is-active::before {
      display: none;
    }
  }
}


// ================================================================
//  7. 双列布局 —— 第一列（图标导航）
// ================================================================

.sidebar-mixed {
  flex-shrink: 0;
  width: var(--sidebar-mixed-width);
  overflow-y: auto;
  overflow-x: hidden;
  background: hsl(var(--sidebar-deep));     // 稍深，区分层级
  border-right: 1px solid hsl(var(--border));
}

/* 第一列图标项列表 */
.mixed-menu-list {
  padding: 8px 0;
}

.mixed-menu-item {
  display: flex;
  flex-direction: column;        // 图标在上，文字在下
  align-items: center;
  justify-content: center;
  height: 56px;
  margin: 4px 8px;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  border-radius: var(--menu-item-radius);
  transition: all 0.2s ease;
  position: relative;

  :deep(.el-icon) {
    transition: transform 0.25s, opacity 0.2s;
    opacity: 0.65;
  }

  &:hover {
    color: hsl(var(--foreground));
    background: hsl(var(--accent));

    :deep(.el-icon) {
      transform: scale(1.15);
      opacity: 1;
    }
  }

  &.active {
    color: hsl(var(--primary));
    background: hsl(var(--primary) /0.1);

    :deep(.el-icon) { opacity: 1; }
  }
}

/* 图标下方的文字标签 */
.mixed-menu-label {
  font-size: 12px;
  margin-top: 4px;
  text-align: center;
  line-height: 1.2;
  max-width: 72px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// ================================================================
//  8. 双列布局 —— 第二列（子菜单面板）
// ================================================================

.sidebar-extra {
  flex-shrink: 0;
  width: var(--sidebar-extra-width);
  display: flex;
  flex-direction: column;
  background: hsl(var(--sidebar));
  border-right: 1px solid hsl(var(--border));
}

.extra-title-bar {
  height: 49px;
  line-height: 49px;
  padding: 0 16px;
  font-size: 15px;
  font-weight: 600;
  color: hsl(var(--foreground));
  border-bottom: 1px solid hsl(var(--border));
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 第二列菜单滚动区 */
.extra-menu-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

// ================================================================
//  9. 主内容区
// ================================================================

.admin-main {
  flex: 1;                       // 占满剩余宽度
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: hsl(var(--background-deep));
}

.admin-content {
  flex: 1;
  overflow-y: auto;              // 内容超出时在内部滚动，标签页始终可见
  padding: 16px;
}
</style>

<!-- ==================== 全局样式（非 scoped） ====================
  - 折叠弹出菜单通过 Teleport 挂到 body，scoped 无法穿透
  - .menu-title-wrap 被 BasicLayout 和 MenuNode 共用，放全局避免重复
-->
<style lang="scss">
/* 菜单项图标+文字容器（BasicLayout & MenuNode 共用） */
.menu-title-wrap {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
  white-space: nowrap;
}

.menu-popup {
  border-radius: var(--radius) !important;
  overflow: hidden;
  box-shadow: var(--shadow-popover) !important;

  .el-menu--popup {
    background: hsl(var(--sidebar)) !important;
    padding: 4px 0;
  }

  // 弹出动画加速
  &.el-zoom-in-left-enter-active,
  &.el-zoom-in-left-leave-active {
    transition-duration: 0.2s !important;
  }

  .el-menu-item {
    height: 38px;
    line-height: 38px;
    margin: 2px 8px;
    padding: 0 12px !important;
    font-size: 14px;
    color: hsl(var(--foreground) /0.75);
    border-radius: 6px;
    transition: all 0.15s ease;

    &:hover {
      color: hsl(var(--foreground));
      background: hsl(var(--accent));
    }

    &.is-active {
      color: hsl(var(--primary));
      background: hsl(var(--primary) /0.1);
      font-weight: 500;
    }
  }

  .el-icon {
    font-size: 16px;
    transition: transform 0.25s;
    opacity: 0.7;
  }

  .el-menu-item:hover .el-icon,
  .el-menu-item.is-active .el-icon {
    transform: scale(1.15);
    opacity: 1;
  }
}

// 修复 el-popper 白色背景穿透（Element Plus 默认 popover 背景为白色）
.el-popper.is-light.menu-popup {
  background: transparent !important;
}
</style>
