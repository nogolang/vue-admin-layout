<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Odometer,
  Setting,
  User,
  Avatar,
  Monitor,
  Connection,
  Document,
  Expand,
  Fold,
  ArrowDown,
} from '@element-plus/icons-vue'
import { useLayoutStore } from '@/stores/layout'
import { usePermissionStore } from '@/stores/permission'
import type { MenuItem } from '@/router/menus'

defineOptions({ name: 'BasicLayout' })

const route = useRoute()
const router = useRouter()
const layoutStore = useLayoutStore()
const permissionStore = usePermissionStore()

// 合并后的完整菜单（静态 + 动态），响应式
const menuList = computed(() => permissionStore.allMenus)

// icon 名称 → 组件映射
const iconMap: Record<string, any> = {
  Odometer,
  Setting,
  User,
  Avatar,
  Monitor,
  Connection,
  Document,
}

// ==================== 垂直侧边栏逻辑 ====================
const menuRef = ref<any>(null)

/** 根据当前路径自动展开所属的父级 sub-menu */
function openActiveSubmenus(path: string) {
  for (const menu of menuList.value) {
    if (menu.children?.some((c) => path.startsWith(c.path))) {
      menuRef.value?.open(menu.path)
    }
  }
}

// mounted 时补充打开（immediate watch 时 el-menu 尚未挂载）
onMounted(() => openActiveSubmenus(route.path))

// 路由变化时自动展开对应 sub-menu
watch(() => route.path, openActiveSubmenus)

// ==================== 双列侧边栏逻辑 ====================

// 当前激活的顶级菜单路径
const activeTopMenu = ref('')

/** 根据路径查找所属顶级菜单 */
function findTopMenu(path: string): string {
  for (const menu of menuList.value) {
    if (menu.path === path) return menu.path
    if (menu.children?.some((c) => path.startsWith(c.path))) return menu.path
  }
  return ''
}

// 第二列要显示的子菜单
const extraMenus = computed(() => {
  const menu = menuList.value.find((m) => m.path === activeTopMenu.value)
  return menu?.children || []
})

// 是否显示第二列（有子菜单才显示）
const showExtra = computed(() => extraMenus.value.length > 0)

// 第二列标题（当前激活的顶级菜单名）
const activeTopMenuName = computed(() => {
  const menu = menuList.value.find((m) => m.path === activeTopMenu.value)
  return menu?.name || ''
})

// 路由变化时同步顶级菜单激活状态
watch(
  () => route.path,
  (path) => {
    const top = findTopMenu(path)
    if (top) activeTopMenu.value = top
  },
  { immediate: true },
)

/** 点击第一列图标：
 *  - 无子菜单 → 直接导航
 *  - 有子菜单 → 展开第二列，并导航到第一个子项 */
function handleTopMenuClick(menu: MenuItem) {
  activeTopMenu.value = menu.path
  if (!menu.children?.length) {
    router.push(menu.path)
  } else {
    const firstChild = extraMenus.value[0]
    if (firstChild) {
      router.push(firstChild.path)
    }
  }
}
</script>

<template>
  <!--
    外层容器 CSS 类：
    layout-sidebar-nav         → 垂直侧边栏模式
    layout-sidebar-mixed-nav   → 双列侧边栏模式
  -->
  <div class="admin-layout" :class="`layout-${layoutStore.layout}`">
    <!-- ==================== 顶部 Header ==================== -->
    <header class="admin-header">
      <!-- Logo 区域 —— 宽度随布局模式变化 -->
      <div class="header-logo">
        <span class="logo-text">Vue Admin</span>
      </div>

      <!-- 中间占位 -->
      <div class="header-center" />

      <!-- 右侧操作区：布局切换 + 用户下拉 -->
      <div class="header-actions">
        <el-radio-group
          v-model="layoutStore.layout"
          size="small"
        >
          <el-radio-button value="sidebar-nav">Vertical</el-radio-button>
          <el-radio-button value="sidebar-mixed-nav">Two-Column</el-radio-button>
        </el-radio-group>
        <el-dropdown class="header-user" trigger="click">
          <span class="user-info">
            Admin
            <el-icon :size="14"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>Profile</el-dropdown-item>
              <el-dropdown-item>Logout</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <div class="admin-body">
      <!-- ==================== 垂直侧边栏 ==================== -->
      <aside
        v-if="layoutStore.isSidebarNav"
        class="sidebar-nav"
        :class="{ collapsed: layoutStore.sidebarCollapsed }"
      >
        <!-- 菜单滚动区 -->
        <div class="sidebar-nav-inner">
          <!--
            el-menu 配置说明：
            router            点击 menu-item 自动调用 router.push(index)
            default-active    根据当前路径高亮对应菜单项
            collapse          折叠模式（仅显示图标）
          -->
          <el-menu
            ref="menuRef"
            :default-active="route.path"
            :collapse="layoutStore.sidebarCollapsed"
            router
            class="sidebar-el-menu"
          >
            <template v-for="item in menuList" :key="item.path">
              <!-- 有子菜单 → el-sub-menu -->
              <el-sub-menu
                v-if="item.children?.length"
                :index="item.path"
                class="sidebar-submenu"
              >
                <template #title>
                  <div class="menu-title-wrap">
                    <el-icon><component :is="iconMap[item.icon]" /></el-icon>
                    <span>{{ item.name }}</span>
                  </div>
                </template>
                <el-menu-item
                  v-for="child in item.children"
                  :key="child.path"
                  :index="child.path"
                >
                  <div class="menu-title-wrap">
                    <el-icon><component :is="iconMap[child.icon]" /></el-icon>
                    <span>{{ child.name }}</span>
                  </div>
                </el-menu-item>
              </el-sub-menu>
              <!-- 无子菜单 → 直接渲染为 menu-item -->
              <el-menu-item v-else :index="item.path">
                <div class="menu-title-wrap">
                  <el-icon><component :is="iconMap[item.icon]" /></el-icon>
                  <span>{{ item.name }}</span>
                </div>
              </el-menu-item>
            </template>
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

      <!-- ==================== 双列侧边栏 ==================== -->
      <template v-if="layoutStore.isSidebarMixedNav">
        <!-- 第一列：顶级菜单图标（80px 窄列） -->
        <aside class="sidebar-mixed">
          <div class="mixed-menu-list">
            <div
              v-for="item in menuList"
              :key="item.path"
              class="mixed-menu-item"
              :class="{ active: activeTopMenu === item.path }"
              @click="handleTopMenuClick(item)"
            >
              <el-icon :size="20">
                <component :is="iconMap[item.icon]" />
              </el-icon>
              <span class="mixed-menu-label">{{ item.name }}</span>
            </div>
          </div>
        </aside>
        <!-- 第二列：当前顶级菜单的子菜单（224px） -->
        <aside v-if="showExtra" class="sidebar-extra">
          <div class="extra-title-bar">{{ activeTopMenuName }}</div>
          <div class="extra-menu-wrap">
            <el-menu
              :default-active="route.path"
              router
              class="extra-el-menu"
            >
              <template v-for="child in extraMenus" :key="child.path">
                <el-sub-menu
                  v-if="child.children?.length"
                  :index="child.path"
                >
                  <template #title>
                    <div class="menu-title-wrap">
                      <el-icon><component :is="iconMap[child.icon]" /></el-icon>
                      <span>{{ child.name }}</span>
                    </div>
                  </template>
                  <el-menu-item
                    v-for="grandchild in child.children"
                    :key="grandchild.path"
                    :index="grandchild.path"
                  >
                    <div class="menu-title-wrap">
                      <el-icon><component :is="iconMap[grandchild.icon]" /></el-icon>
                      <span>{{ grandchild.name }}</span>
                    </div>
                  </el-menu-item>
                </el-sub-menu>
                <el-menu-item v-else :index="child.path">
                  <div class="menu-title-wrap">
                    <el-icon><component :is="iconMap[child.icon]" /></el-icon>
                    <span>{{ child.name }}</span>
                  </div>
                </el-menu-item>
              </template>
            </el-menu>
          </div>
        </aside>
      </template>

      <!-- ==================== 主内容区 ==================== -->
      <main class="admin-main">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* ==================== CSS 变量（对齐 vben 设计规范） ==================== */
.admin-layout {
  --header-height: 50px;
  --sidebar-width: 224px;
  --sidebar-collapse-width: 60px;
  --sidebar-mixed-width: 80px;         /* 双列模式第一列宽度 */
  --sidebar-extra-width: 224px;        /* 双列模式第二列宽度 */
  --sidebar-bg: #fff;
  --sidebar-deep-bg: #f5f6f8;
  --sidebar-text: hsl(240 6% 10% / 75%);
  --sidebar-text-hover: hsl(240 6% 10%);
  --sidebar-text-muted: hsl(240 4% 46%);
  --sidebar-active-bg: hsl(212 100% 45% / 12%);
  --sidebar-active-text: hsl(212 100% 45%);
  --sidebar-hover-bg: hsl(240 5% 96%);
  --sidebar-border: hsl(240 5.9% 90%);
  --sidebar-arrow: hsl(240 4% 46%);
  --sidebar-collapse-text: hsl(240 4% 46%);
  --header-bg: #fff;
  --header-border: hsl(240 5.9% 90%);
  --content-bg: hsl(216 20.11% 95.47%);
  --menu-item-height: 38px;
  --menu-item-margin-y: 2px;
  --menu-item-margin-x: 8px;
  --menu-item-radius: 8px;
  --menu-font-size: 14px;
  --menu-icon-size: 16px;

  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}



/* ==================== Header ==================== */
.admin-header {
  height: var(--header-height);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: var(--header-bg);
  border-bottom: 1px solid var(--header-border);
  z-index: 200;
}

/* Logo 区宽度跟随侧边栏宽度 */
.header-logo {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  min-width: var(--sidebar-width);
  padding-left: 8px;
  transition: min-width 0.15s;
}

/* 双列模式时 Logo 区收窄 */
.layout-sidebar-mixed-nav .header-logo {
  min-width: var(--sidebar-mixed-width);
  justify-content: center;
  padding-left: 0;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  letter-spacing: -0.3px;
}

.header-center {
  flex: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.header-user {
  margin-left: 8px;
}

.user-info {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: hsl(240 6% 10%);
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.15s;
}

.user-info:hover {
  background: hsl(240 5% 96%);
}

/* ==================== Body ==================== */
.admin-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ==================== 垂直侧边栏 ==================== */
.sidebar-nav {
  flex-shrink: 0;
  width: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  background: var(--sidebar-bg);
  transition: width 0.2s;
  overflow: hidden;
}

.sidebar-nav.collapsed {
  width: var(--sidebar-collapse-width);
}

.sidebar-nav-inner {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0;
}

/* 底部折叠按钮 —— 固定高度 42px */
.sidebar-collapse-trigger {
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--sidebar-collapse-text);
  border-top: 1px solid var(--sidebar-border);
  transition: color 0.15s;
  flex-shrink: 0;
}

.sidebar-collapse-trigger:hover {
  color: var(--sidebar-text-hover);
}

/* ==================== 覆盖 Element Plus Menu 样式 ==================== */
.sidebar-el-menu,
.extra-el-menu {
  border-right: none !important;
  background: transparent !important;
}

/* 菜单项基础样式 */
.sidebar-el-menu :deep(.el-menu-item),
.extra-el-menu :deep(.el-menu-item) {
  height: var(--menu-item-height);
  line-height: var(--menu-item-height);
  margin: var(--menu-item-margin-y) var(--menu-item-margin-x);
  padding: 0 12px !important;
  font-size: var(--menu-font-size);
  color: var(--sidebar-text);
  border-radius: var(--menu-item-radius);
  transition: background 0.15s, color 0.15s;
}

/* hover 状态 */
.sidebar-el-menu :deep(.el-menu-item:hover),
.extra-el-menu :deep(.el-menu-item:hover) {
  color: var(--sidebar-text-hover);
  background: var(--sidebar-hover-bg) !important;
}

/* 激活状态 */
.sidebar-el-menu :deep(.el-menu-item.is-active),
.extra-el-menu :deep(.el-menu-item.is-active) {
  color: var(--sidebar-active-text);
  background: var(--sidebar-active-bg) !important;
}

/* sub-menu 标题 */
.sidebar-el-menu :deep(.el-sub-menu__title),
.extra-el-menu :deep(.el-sub-menu__title) {
  height: var(--menu-item-height);
  line-height: var(--menu-item-height);
  margin: var(--menu-item-margin-y) var(--menu-item-margin-x);
  padding: 0 12px !important;
  font-size: var(--menu-font-size);
  color: var(--sidebar-text);
  border-radius: var(--menu-item-radius);
  transition: background 0.15s, color 0.15s;
}

.sidebar-el-menu :deep(.el-sub-menu__title:hover),
.extra-el-menu :deep(.el-sub-menu__title:hover) {
  color: var(--sidebar-text-hover);
  background: var(--sidebar-hover-bg) !important;
}

/* 子菜单激活/展开时标题高亮 */
.sidebar-el-menu :deep(.el-sub-menu.is-active > .el-sub-menu__title),
.sidebar-el-menu :deep(.el-sub-menu.is-opened > .el-sub-menu__title),
.extra-el-menu :deep(.el-sub-menu.is-active > .el-sub-menu__title),
.extra-el-menu :deep(.el-sub-menu.is-opened > .el-sub-menu__title) {
  color: var(--sidebar-active-text);
}

/* 子菜单项缩进 —— 体现层级关系 */
.sidebar-el-menu :deep(.el-sub-menu .el-menu-item),
.extra-el-menu :deep(.el-sub-menu .el-menu-item) {
  padding-left: 44px !important;
}
/* 三级菜单进一步缩进 */
.sidebar-el-menu :deep(.el-sub-menu .el-sub-menu .el-menu-item),
.extra-el-menu :deep(.el-sub-menu .el-sub-menu .el-menu-item) {
  padding-left: 60px !important;
}

/* 展开箭头 */
.sidebar-el-menu :deep(.el-sub-menu__icon-arrow),
.extra-el-menu :deep(.el-sub-menu__icon-arrow) {
  color: var(--sidebar-arrow);
  transition: transform 0.25s;
}

/* 折叠模式下内容居中 */
.sidebar-el-menu :deep(.el-menu--collapse) .el-menu-item,
.sidebar-el-menu :deep(.el-menu--collapse) .el-sub-menu__title {
  justify-content: center;
  padding: 0 !important;
}

/* 图标基础样式 */
.sidebar-el-menu :deep(.el-menu-item .el-icon),
.extra-el-menu :deep(.el-menu-item .el-icon),
.sidebar-el-menu :deep(.el-sub-menu__title .el-icon),
.extra-el-menu :deep(.el-sub-menu__title .el-icon) {
  font-size: var(--menu-icon-size);
  transition: transform 0.25s;
  flex-shrink: 0;
}

/* hover 时图标放大 */
.sidebar-el-menu :deep(.el-menu-item:hover .el-icon),
.extra-el-menu :deep(.el-menu-item:hover .el-icon),
.sidebar-el-menu :deep(.el-sub-menu__title:hover .el-icon),
.extra-el-menu :deep(.el-sub-menu__title:hover .el-icon) {
  transform: scale(1.2);
}

.menu-title-wrap {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
  white-space: nowrap;
}

/* ==================== 双列布局第一列 ==================== */
.sidebar-mixed {
  flex-shrink: 0;
  width: var(--sidebar-mixed-width);
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--sidebar-deep-bg);
  border-right: 1px solid var(--sidebar-border);
}

.mixed-menu-list {
  padding: 8px 0;
}

/* 图标项：图标在上、文字在下，垂直居中 */
.mixed-menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 52px;
  margin: 4px 0;
  color: var(--sidebar-text-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.mixed-menu-item:hover {
  color: var(--sidebar-text-hover);
  background: var(--sidebar-hover-bg);
}

.mixed-menu-item:hover :deep(.el-icon) {
  transform: scale(1.2);
}

.mixed-menu-item.active {
  color: var(--sidebar-active-text);
  background: var(--sidebar-active-bg);
}

.mixed-menu-item :deep(.el-icon) {
  transition: transform 0.25s;
}

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

/* ==================== 双列布局第二列 ==================== */
.sidebar-extra {
  flex-shrink: 0;
  width: var(--sidebar-extra-width);
  display: flex;
  flex-direction: column;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
}

/* 标题栏：49px = header-height - 1 */
.extra-title-bar {
  height: 49px;
  line-height: 49px;
  padding: 0 16px;
  font-size: 15px;
  font-weight: 600;
  color: var(--sidebar-text-hover);
  border-bottom: 1px solid var(--sidebar-border);
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.extra-menu-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

/* ==================== 主内容区 ==================== */
.admin-main {
  flex: 1;
  overflow-y: auto;
  background: var(--content-bg);
  padding: 16px;
}
</style>
