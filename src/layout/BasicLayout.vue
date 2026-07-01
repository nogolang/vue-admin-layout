<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
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
import LayoutTabbar from './components/Tabbar.vue'
import type { MenuItem } from '@/router/menus'

defineOptions({ name: 'BasicLayout' })

const route = useRoute()
const router = useRouter()
const layoutStore = useLayoutStore()
const permissionStore = usePermissionStore()

const menuList = computed(() => permissionStore.allMenus)

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

function openActiveSubmenus() {
  const path = route.path
  const menus = menuList.value
  if (!menus.length) return
  nextTick(() => {
    for (const menu of menus) {
      if (menu.children?.some((c) => path.startsWith(c.path))) {
        menuRef.value?.open(menu.path)
      }
    }
  })
}

onMounted(() => openActiveSubmenus())
watch(() => route.path, () => openActiveSubmenus())
watch(() => permissionStore.isRoutesLoaded, (loaded) => {
  if (loaded) openActiveSubmenus()
})

// ==================== 双列侧边栏逻辑 ====================
const activeTopMenu = ref('')

function findTopMenu(path: string): string {
  for (const menu of menuList.value) {
    if (menu.path === path) return menu.path
    if (menu.children?.some((c) => path.startsWith(c.path))) return menu.path
  }
  return ''
}

const extraMenus = computed(() => {
  const menu = menuList.value.find((m) => m.path === activeTopMenu.value)
  return menu?.children || []
})

const showExtra = computed(() => extraMenus.value.length > 0)

const activeTopMenuName = computed(() => {
  const menu = menuList.value.find((m) => m.path === activeTopMenu.value)
  return menu?.name || ''
})

function syncActiveTopMenu() {
  const top = findTopMenu(route.path)
  if (top) activeTopMenu.value = top
}

watch(() => permissionStore.isRoutesLoaded, (loaded) => {
  if (loaded) syncActiveTopMenu()
})
watch(() => route.path, () => syncActiveTopMenu())

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

<template>
  <div class="admin-layout" :class="`layout-${layoutStore.layout}`">
    <!-- ==================== 顶部 Header ==================== -->
    <header class="admin-header">
      <div class="header-logo">
        <div class="logo-icon">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="hsl(var(--primary))" />
            <path d="M8 22V10l8 6-8 6zM16 22V10l8 6-8 6z" fill="white" opacity="0.9" />
          </svg>
        </div>
        <span class="logo-text">Vue Admin</span>
      </div>

      <div class="header-center" />

      <div class="header-actions">
        <el-radio-group v-model="layoutStore.layout" size="small" class="layout-switch">
          <el-radio-button value="sidebar-nav">侧边栏</el-radio-button>
          <el-radio-button value="sidebar-mixed-nav">双列</el-radio-button>
        </el-radio-group>

        <el-dropdown class="header-user" trigger="click">
          <span class="user-info">
            <el-avatar :size="28" icon="UserFilled" />
            <span class="user-name">Admin</span>
            <el-icon :size="14"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>个人中心</el-dropdown-item>
              <el-dropdown-item divided>退出登录</el-dropdown-item>
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
        <div class="sidebar-nav-inner">
          <el-menu
            ref="menuRef"
            :default-active="route.path"
            :collapse="layoutStore.sidebarCollapsed"
            router
            class="sidebar-el-menu menu-override"
            popper-class="menu-popup"
          >
            <template v-for="item in menuList" :key="item.path">
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
              <el-menu-item v-else :index="item.path">
                <div class="menu-title-wrap">
                  <el-icon><component :is="iconMap[item.icon]" /></el-icon>
                  <span>{{ item.name }}</span>
                </div>
              </el-menu-item>
            </template>
          </el-menu>
        </div>
        <div class="sidebar-collapse-trigger" @click="layoutStore.toggleSidebar()">
          <el-icon :size="16">
            <Fold v-if="!layoutStore.sidebarCollapsed" />
            <Expand v-else />
          </el-icon>
        </div>
      </aside>

      <!-- ==================== 双列侧边栏 ==================== -->
      <template v-if="layoutStore.isSidebarMixedNav">
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
        <aside v-if="showExtra" class="sidebar-extra">
          <div class="extra-title-bar">{{ activeTopMenuName }}</div>
          <div class="extra-menu-wrap">
            <el-menu
              :default-active="route.path"
              router
              class="extra-el-menu menu-override"
              popper-class="menu-popup"
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
        <LayoutTabbar />
        <div class="admin-content">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ==================== 布局壳 ==================== */
.admin-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: hsl(var(--background));
}

/* ==================== Header ==================== */
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

/* Logo 区 */
.header-logo {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: var(--sidebar-width);
  padding-left: 8px;
  transition: min-width 0.2s ease;
}

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

.header-center {
  flex: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.layout-switch {
  :deep(.el-radio-button__inner) {
    font-size: 12px;
    padding: 4px 12px;
  }
}

.header-user {
  margin-left: 4px;
}

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
  background: hsl(var(--sidebar));
  border-right: 1px solid hsl(var(--border));
  transition: width 0.25s ease;
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

/* ========== 菜单覆盖 ========== */
.menu-override {
  border-right: none !important;
  background: transparent !important;

  :deep(.el-menu-item) {
    height: var(--menu-item-height);
    line-height: var(--menu-item-height);
    margin: var(--menu-item-margin-y) var(--menu-item-margin-x);
    padding: 0 12px !important;
    font-size: var(--menu-font-size);
    color: hsl(var(--foreground) / 0.75);
    border-radius: var(--menu-item-radius);
    transition: all 0.2s ease;

    &:hover {
      color: hsl(var(--foreground));
      background: hsl(var(--accent)) !important;
    }
    &.is-active {
      color: hsl(var(--primary));
      background: hsl(var(--primary) / 0.1) !important;
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

  :deep(.el-sub-menu__title) {
    height: var(--menu-item-height);
    line-height: var(--menu-item-height);
    margin: var(--menu-item-margin-y) var(--menu-item-margin-x);
    padding: 0 12px !important;
    font-size: var(--menu-font-size);
    color: hsl(var(--foreground) / 0.75);
    border-radius: var(--menu-item-radius);
    transition: all 0.2s ease;

    &:hover {
      color: hsl(var(--foreground));
      background: hsl(var(--accent)) !important;
    }
  }
  :deep(.el-sub-menu.is-active > .el-sub-menu__title),
  :deep(.el-sub-menu.is-opened > .el-sub-menu__title) {
    color: hsl(var(--primary));
  }

  :deep(.el-sub-menu .el-menu-item) {
    padding-left: 44px !important;
  }
  :deep(.el-sub-menu .el-sub-menu .el-menu-item) {
    padding-left: 60px !important;
  }

  :deep(.el-sub-menu__icon-arrow) {
    color: hsl(var(--muted-foreground));
    transition: transform 0.25s;
  }

  :deep(.el-menu-item .el-icon),
  :deep(.el-sub-menu__title .el-icon) {
    font-size: var(--menu-icon-size);
    transition: transform 0.25s;
    flex-shrink: 0;
    opacity: 0.7;
  }
  :deep(.el-menu-item.is-active .el-icon),
  :deep(.el-sub-menu.is-opened > .el-sub-menu__title .el-icon) {
    opacity: 1;
  }
  :deep(.el-menu-item:hover .el-icon),
  :deep(.el-sub-menu__title:hover .el-icon) {
    transform: scale(1.15);
    opacity: 1;
  }
}

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
  background: hsl(var(--sidebar-deep));
  border-right: 1px solid hsl(var(--border));
}

.mixed-menu-list {
  padding: 8px 0;
}

.mixed-menu-item {
  display: flex;
  flex-direction: column;
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
    background: hsl(var(--primary) / 0.1);

    :deep(.el-icon) {
      opacity: 1;
    }

    .mixed-menu-label {
      font-weight: 500;
    }
  }
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

.extra-menu-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

/* ==================== 主内容区 ==================== */
.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: hsl(var(--background-deep));
}

.admin-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
</style>

<style lang="scss">
/* el-menu 折叠弹出菜单（不能 scoped —— el-popper 被 Teleport 到 body） */
.menu-popup {
  border-radius: var(--radius) !important;
  overflow: hidden;
  box-shadow: var(--shadow-popover) !important;

  .el-menu--popup {
    background: hsl(var(--sidebar)) !important;
    padding: 4px 0;
  }

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
    color: hsl(var(--foreground) / 0.75);
    border-radius: 6px;
    transition: all 0.15s ease;

    &:hover {
      color: hsl(var(--foreground));
      background: hsl(var(--accent));
    }
    &.is-active {
      color: hsl(var(--primary));
      background: hsl(var(--primary) / 0.1);
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

.el-popper.is-light.menu-popup {
  background: transparent !important;
}
</style>
