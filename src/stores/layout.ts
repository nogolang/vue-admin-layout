import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { appConfig } from '@/app.config'

/**
 * ==================== 布局类型定义 ====================
 *
 * sidebar-nav       → 垂直侧边栏模式（单列，可折叠）
 * sidebar-mixed-nav → 双列侧边栏模式（左侧图标列 + 右侧展开列）
 *
 * 扩展建议：
 *   如需添加顶部导航（header-nav）或混合模式，直接在此联合类型中追加即可。
 *   同时需要在 BasicLayout.vue 中添加对应布局的模板和样式。
 */
export type LayoutType = 'sidebar-nav' | 'sidebar-mixed-nav'

/**
 * ==================== 布局状态管理 ====================
 *
 * 管理应用的整体布局状态，包括：
 *   1. layout            —— 当前布局模式（静态配置，来源于 appConfig.layout.mode）
 *   2. sidebarCollapsed  —— 垂直布局下的侧边栏折叠状态（仅 sidebar-nav 模式生效）
 *
 * 配置关联：
 *   - 布局模式 → appConfig.layout.mode（src/app.config.ts）
 *   - 布局模式在配置文件中设定，运行时不可动态切换
 *
 * 使用方式：
 *   const layoutStore = useLayoutStore()
 *   layoutStore.layout               // 读取当前布局
 *   layoutStore.isSidebarNav         // 是否为垂直侧边栏
 *   layoutStore.isSidebarMixedNav    // 是否为双列侧边栏
 *   layoutStore.toggleSidebar()      // 切换折叠
 *
 * 持久化建议：
 *   如需记住用户的折叠偏好（刷新不丢失），可配合 pinia-plugin-persistedstate
 *   将 sidebarCollapsed 持久化到 localStorage。
 */
export const useLayoutStore = defineStore('layout', () => {
  /**
   * 当前布局模式（静态值，来源于配置文件，运行时不可更改）
   *
   * 使用 computed 从配置读取，确保配置修改后（刷新页面）立即生效。
   * 如果需要在运行时动态切换，将 ref 改回并添加 setLayout 方法即可。
   */
  const layout = ref<LayoutType>(appConfig.layout.mode)

  /**
   * 侧边栏折叠状态
   * true  → 折叠（仅显示图标）
   * false → 展开（显示图标 + 文字）
   * 仅对 sidebar-nav 模式生效
   */
  const sidebarCollapsed = ref(false)

  /** 侧边栏拖拽宽度（px），默认 224，范围 160~480 */
  const sidebarWidth = ref(224)

  // ==================== 计算属性（模板中使用） ====================

  /** 当前是否为垂直侧边栏模式 */
  const isSidebarNav = computed(() => layout.value === 'sidebar-nav')

  /** 当前是否为双列侧边栏模式 */
  const isSidebarMixedNav = computed(() => layout.value === 'sidebar-mixed-nav')

  // ==================== 操作方法 ====================

  /**
   * 切换侧边栏折叠/展开（仅对 sidebar-nav 模式生效）
   *
   * 使用场景：
   *   - 点击侧边栏底部的折叠按钮
   *   - 快捷键切换（可扩展）
   */
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return {
    layout,
    sidebarCollapsed,
    sidebarWidth,
    isSidebarNav,
    isSidebarMixedNav,
    toggleSidebar,
  }
})
