<!--
  ==================== 基本布局（BasicLayout） ====================

  整个应用的主布局壳，包含：
    1. 顶部 Header    —— Logo、布局切换、用户信息
    2. 侧边栏          —— 支持两种布局模式：
       a) 垂直侧边栏（sidebar-nav）        —— 单列，可折叠
       b) 双列侧边栏（sidebar-mixed-nav） —— 左侧图标列 + 右侧展开列
    3. 主内容区        —— 标签页 + 路由视图

  依赖的 Store：
    - useLayoutStore     → 布局模式、侧边栏折叠状态
    - usePermissionStore → 菜单数据（静态菜单 + 动态菜单）

  依赖的组件：
    - LayoutTabbar       → 标签页组件

  路由约定：
    - 所有需要展示在布局内的页面必须注册在 Root 路由的 children 中
    - BasicLayout 自身作为 Root 的 component
    - 登录页、404 等独立页面与 Root 平级，不使用本布局
-->
<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  HomeFilled,
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
import { appConfig } from '@/app.config'
import LayoutTabbar from './components/Tabbar.vue'
import LayNotice from './layNotice/index.vue'
import type { MenuItem } from '@/router/menus'

defineOptions({ name: 'BasicLayout' })

const route = useRoute()
const router = useRouter()
const layoutStore = useLayoutStore()
const permissionStore = usePermissionStore()

/**
 * 完整菜单列表（静态菜单 + 动态菜单）
 * permissionStore.allMenus 是 computed 属性，自动响应变化
 */
const menuList = computed(() => permissionStore.allMenus)

/**
 * ==================== 图标映射表 ====================
 *
 * MenuItem.icon 字符串 → Element Plus 图标组件 的映射。
 * 添加新图标步骤：
 *   1. 在顶部的 import 中引入图标组件
 *   2. 在此对象中添加一条映射
 *   3. 在菜单数据中使用对应的字符串名称
 *
 * 为什么用映射表而不直接用动态组件？
 *   动态 import 图标会增加构建复杂度，显式映射在打包时有更好的 Tree Shaking 效果。
 */
const iconMap: Record<string, any> = {
  HomeFilled,
  Odometer,
  Setting,
  User,
  Avatar,
  Monitor,
  Connection,
  Document,
}

// ==================== 垂直侧边栏逻辑 ====================

/** el-menu 组件引用，用于调用 open/close 方法 */
const menuRef = ref<any>(null)

/**
 * 根据当前路由路径，自动展开对应的子菜单
 *
 * 展开规则：遍历所有顶级菜单，如果当前路径匹配某个子菜单的路径前缀，
 * 则展开该父级菜单。
 *
 * 调用时机：
 *   - 组件挂载时（onMounted）
 *   - 路由变化时（watch route.path）
 *   - 动态路由加载完成时（watch isRoutesLoaded）
 */
function openActiveSubmenus() {
  const path = route.path
  const menus = menuList.value
  if (!menus.length) return

  // nextTick 确保 el-menu DOM 渲染完成后再操作
  nextTick(() => {
    for (const menu of menus) {
      // 检查当前路径是否匹配该菜单或其子菜单
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

/** 双列模式下，当前激活的顶级菜单路径 */
const activeTopMenu = ref('')

/**
 * 根据当前路由路径查找所属的顶级菜单
 *
 * 查找逻辑：
 *   1. 如果路径直接匹配某个顶级菜单 → 返回该菜单
 *   2. 如果路径前缀匹配某个子菜单 → 返回该子菜单所属的顶级菜单
 *   3. 都没有 → 返回空字符串
 *
 * @param path  当前路由路径
 * @returns     顶级菜单的 path，或空字符串
 */
function findTopMenu(path: string): string {
  for (const menu of menuList.value) {
    // 直接命中顶级菜单
    if (menu.path === path) return menu.path
    // 命中子菜单
    if (menu.children?.some((c) => path.startsWith(c.path))) return menu.path
  }
  return ''
}

/**
 * 双列模式第二列的子菜单列表
 * 即：当前激活的顶级菜单下的 children
 */
const extraMenus = computed(() => {
  const menu = menuList.value.find((m) => m.path === activeTopMenu.value)
  return menu?.children || []
})

/** 是否显示第二列（有子菜单时才显示） */
const showExtra = computed(() => extraMenus.value.length > 0)

/** 第二列顶部标题（当前激活的顶级菜单名称） */
const activeTopMenuName = computed(() => {
  const menu = menuList.value.find((m) => m.path === activeTopMenu.value)
  return menu?.name || ''
})

/** 第二列 el-menu 组件引用 */
const extraMenuRef = ref<any>(null)

/** 同步当前路由到顶级菜单激活状态 */
function syncActiveTopMenu() {
  const top = findTopMenu(route.path)
  if (top) activeTopMenu.value = top
}

/**
 * 展开第二列中匹配当前路由的子菜单
 * 逻辑同 openActiveSubmenus，但作用于第二列的菜单
 */
function openExtraSubmenus() {
  nextTick(() => {
    for (const child of extraMenus.value) {
      if (child.children?.some((gc) => route.path.startsWith(gc.path))) {
        extraMenuRef.value?.open(child.path)
      }
    }
  })
}

// 初始化和路由变化时同步顶级菜单
onMounted(() => {
  syncActiveTopMenu()
  openExtraSubmenus()
})
watch(() => permissionStore.isRoutesLoaded, (loaded) => {
  if (loaded) {
    syncActiveTopMenu()
    openExtraSubmenus()
  }
})
watch(() => route.path, () => {
  syncActiveTopMenu()
  openExtraSubmenus()
})

/**
 * 双列模式 —— 点击第一列图标
 *
 * 行为：
 *   1. 设置当前激活的顶级菜单
 *   2. 如果该菜单没有 children → 直接跳转到该路由
 *   3. 如果有 children → 自动跳转到第一个子页面
 *
 * @param menu  被点击的顶级菜单项
 */
function handleTopMenuClick(menu: MenuItem) {
  activeTopMenu.value = menu.path
  if (!menu.children?.length) {
    // 无子菜单 → 直接跳转
    router.push(menu.path)
  } else {
    // 有子菜单 → 跳转到第一个子路由
    const firstChild = extraMenus.value[0]
    if (firstChild) router.push(firstChild.path)
  }
}
</script>

<template>
  <!--
    最外层容器：
      class="admin-layout"  → 固定类名
      :class="`layout-${layoutStore.layout}`" → 动态类名，用于 CSS 选择器控制不同布局
      例如：layout-sidebar-nav、layout-sidebar-mixed-nav
  -->
  <div class="admin-layout" :class="`layout-${layoutStore.layout}`">
    <!-- ==================== 顶部 Header ==================== -->
    <header class="admin-header">
      <!-- Logo 区域 -->
      <div class="header-logo">
        <div class="logo-icon">
          <!-- 品牌图标（可替换为项目 Logo） -->
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="hsl(var(--primary))" />
            <path d="M8 22V10l8 6-8 6zM16 22V10l8 6-8 6z" fill="white" opacity="0.9" />
          </svg>
        </div>
        <span class="logo-text">{{ appConfig.app.logoText }}</span>
      </div>

      <!-- Header 中部留空（可用于放置搜索框、面包屑等） -->
      <div class="header-center" />

      <!-- 右侧操作区 -->
      <div class="header-actions">
        <!-- 通知中心（铃铛图标 + 下拉面板，appConfig.notice.enableSSE 控制显隐） -->
        <LayNotice v-if="appConfig.notice.enableSSE" />

        <!-- 用户下拉菜单 -->
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

    <!-- ==================== Body 区域（侧边栏 + 主内容） ==================== -->
    <div class="admin-body">
      <!--
        ========== 布局模式一：垂直侧边栏 ==========
        v-if="layoutStore.isSidebarNav" 控制显示/隐藏
      -->
      <aside
        v-if="layoutStore.isSidebarNav"
        class="sidebar-nav"
        :class="{ collapsed: layoutStore.sidebarCollapsed }"
      >
        <!-- 菜单区域（可滚动） -->
        <div class="sidebar-nav-inner">
          <!--
            el-menu 配置说明：
              :default-active="route.path" → 高亮当前路由对应的菜单项
              :collapse → 折叠模式（仅显示图标）
              router → 启用路由模式（index 即路由 path，点击自动导航）
              class="menu-override" → 自定义样式覆盖
              popper-class="menu-popup" → 折叠时的弹出菜单样式
          -->
          <el-menu
            ref="menuRef"
            :default-active="route.path"
            :collapse="layoutStore.sidebarCollapsed"
            router
            class="sidebar-el-menu menu-override"
            popper-class="menu-popup"
          >
            <!--
              遍历菜单树，渲染两种节点：
                1. el-sub-menu  —— 有 children → 可展开的子菜单组
                2. el-menu-item  —— 无 children → 直接跳转的叶子菜单
            -->
            <template v-for="item in menuList" :key="item.path">
              <el-sub-menu
                v-if="item.children?.length"
                :index="item.path"
                class="sidebar-submenu"
              >
                <template #title>
                  <div class="menu-title-wrap">
                    <!-- 图标（通过 iconMap 将字符串映射到组件） -->
                    <el-icon><component :is="iconMap[item.icon]" /></el-icon>
                    <span>{{ item.name }}</span>
                  </div>
                </template>
                <!-- 递归渲染子菜单项（el-menu router 模式下点击自动导航） -->
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
              <!-- 无子菜单 → 直接渲染菜单项 -->
              <el-menu-item v-else :index="item.path">
                <div class="menu-title-wrap">
                  <el-icon><component :is="iconMap[item.icon]" /></el-icon>
                  <span>{{ item.name }}</span>
                </div>
              </el-menu-item>
            </template>
          </el-menu>
        </div>

        <!-- 折叠/展开触发器（底部） -->
        <div class="sidebar-collapse-trigger" @click="layoutStore.toggleSidebar()">
          <el-icon :size="16">
            <Fold v-if="!layoutStore.sidebarCollapsed" />
            <Expand v-else />
          </el-icon>
        </div>
      </aside>

      <!--
        ========== 布局模式二：双列侧边栏 ==========
        第一列：图标导航（窄列）
        第二列：展开的菜单（仅当选中顶级菜单有子菜单时显示）
      -->
      <template v-if="layoutStore.isSidebarMixedNav">
        <!-- 第一列 —— 顶级菜单图标 -->
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

        <!-- 第二列 —— 子菜单展开区（有子菜单时才显示） -->
        <aside v-if="showExtra" class="sidebar-extra">
          <!-- 顶部标题栏（显示当前顶级菜单名称） -->
          <div class="extra-title-bar">{{ activeTopMenuName }}</div>
          <!-- 子菜单列表 -->
          <div class="extra-menu-wrap">
            <el-menu
              ref="extraMenuRef"
              :default-active="route.path"
              router
              class="extra-el-menu menu-override"
              popper-class="menu-popup"
            >
              <template v-for="child in extraMenus" :key="child.path">
                <!-- 支持三级菜单嵌套 -->
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
                <!-- 无子菜单 → 直接渲染叶子节点 -->
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
        <!-- 标签页栏（是否显示取决于 appConfig.tabbar.showTabbar） -->
        <LayoutTabbar v-if="appConfig.tabbar.showTabbar" />
        <!-- 页面内容（RouterView 渲染当前路由对应的组件） -->
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
  height: 100vh;                 /* 占满视口高度 */
  display: flex;
  flex-direction: column;        /* Header → Body 垂直排列 */
  overflow: hidden;              /* 防止整体出现滚动条，各区域独立滚动 */
  background: hsl(var(--background));
}

/* ==================== Header ==================== */
.admin-header {
  height: var(--header-height);
  flex-shrink: 0;                /* 不参与收缩 */
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: hsl(var(--header));
  border-bottom: 1px solid hsl(var(--border));
  box-shadow: var(--shadow-header);
  z-index: var(--z-header);      /* 确保在侧边栏之上 */
}

/* ---- Logo 区域 ---- */
.header-logo {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: var(--sidebar-width); /* 与侧边栏宽度对齐 */
  padding-left: 8px;
  transition: min-width 0.2s ease;
}

/* 双列模式下 Logo 区域宽度适配 */
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

/* Header 中部（flex 占位，用于放置面包屑、搜索等） */
.header-center {
  flex: 1;
}

/* Header 右侧操作区 */
.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.header-user {
  margin-left: 4px;
}

/* 用户信息区域 */
.user-info {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 2px 8px 2px 2px;
  border-radius: 999px;          /* 胶囊形 */
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
  flex: 1;                       /* 占满 header 下方全部空间 */
  display: flex;
  overflow: hidden;              /* 子元素各自处理 overflow */
}

/* ==================== 垂直侧边栏 ==================== */
.sidebar-nav {
  flex-shrink: 0;
  width: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  background: hsl(var(--sidebar));
  border-right: 1px solid hsl(var(--border));
  transition: width 0.25s ease;  /* 折叠/展开动画 */
  overflow: hidden;
}

/* 折叠状态宽度 */
.sidebar-nav.collapsed {
  width: var(--sidebar-collapse-width);
}

/* 菜单滚动区 */
.sidebar-nav-inner {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0;
}

/* 底部折叠触发器 */
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

/* ==================== 菜单项统一样式覆盖 ==================== */
.menu-override {
  border-right: none !important;
  background: transparent !important;

  /* 菜单项 */
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

    /* 激活态样式：蓝色文字 + 浅蓝背景 + 左侧指示条 */
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

  /* 子菜单标题 */
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

  /* 子菜单激活/展开态 */
  :deep(.el-sub-menu.is-active > .el-sub-menu__title),
  :deep(.el-sub-menu.is-opened > .el-sub-menu__title) {
    color: hsl(var(--primary));
  }

  /* 子菜单缩进 */
  :deep(.el-sub-menu .el-menu-item) {
    padding-left: 44px !important;
  }
  :deep(.el-sub-menu .el-sub-menu .el-menu-item) {
    padding-left: 60px !important;
  }

  /* 展开箭头颜色 */
  :deep(.el-sub-menu__icon-arrow) {
    color: hsl(var(--muted-foreground));
    transition: transform 0.25s;
  }

  /* 图标样式 */
  :deep(.el-menu-item .el-icon),
  :deep(.el-sub-menu__title .el-icon) {
    font-size: var(--menu-icon-size);
    transition: transform 0.25s;
    flex-shrink: 0;
    opacity: 0.7;
  }

  /* 激活/展开时图标完全不透明 */
  :deep(.el-menu-item.is-active .el-icon),
  :deep(.el-sub-menu.is-opened > .el-sub-menu__title .el-icon) {
    opacity: 1;
  }

  /* hover 时图标略微放大 */
  :deep(.el-menu-item:hover .el-icon),
  :deep(.el-sub-menu__title:hover .el-icon) {
    transform: scale(1.15);
    opacity: 1;
  }
}

/* 折叠模式下隐藏左侧激活指示条 */
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

/* 菜单标题容器（图标 + 文字并排） */
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

/* 第一列菜单项（竖排图标 + 文字） */
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

  /* 激活态 */
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

/* 第二列顶部标题（当前模块名称） */
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
  flex-direction: column;       /* 标签页在上，内容在下 */
  overflow: hidden;
  background: hsl(var(--background-deep));
}

/* 页面内容区（可滚动） */
.admin-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
</style>

<!--
  非 scoped 样式 —— 用于 el-menu 的弹出层（Teleport 到 body，scoped 样式无法穿透）
  折叠模式下鼠标悬停时弹出的子菜单就是这个 popup
-->
<style lang="scss">
.menu-popup {
  border-radius: var(--radius) !important;
  overflow: hidden;
  box-shadow: var(--shadow-popover) !important;

  .el-menu--popup {
    background: hsl(var(--sidebar)) !important;
    padding: 4px 0;
  }

  /* 弹出动画速度 */
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

/* 修复 el-popper 白色背景穿透问题 */
.el-popper.is-light.menu-popup {
  background: transparent !important;
}
</style>
