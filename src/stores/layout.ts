import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

/** 布局类型 */
export type LayoutType = 'sidebar-nav' | 'sidebar-mixed-nav'

/**
 * 布局状态管理
 *
 * layout           当前布局模式（垂直侧边栏 / 双列侧边栏）
 * sidebarCollapsed  垂直布局下侧边栏是否折叠
 */
export const useLayoutStore = defineStore('layout', () => {
  // 当前布局模式，默认垂直侧边栏
  const layout = ref<LayoutType>('sidebar-nav')
  // 侧边栏折叠状态（仅 sidebar-nav 模式生效）
  const sidebarCollapsed = ref(false)

  // 布局类型判断（模板中使用）
  const isSidebarNav = computed(() => layout.value === 'sidebar-nav')
  const isSidebarMixedNav = computed(() => layout.value === 'sidebar-mixed-nav')

  function setLayout(type: LayoutType) {
    layout.value = type
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return {
    layout,
    sidebarCollapsed,
    isSidebarNav,
    isSidebarMixedNav,
    setLayout,
    toggleSidebar,
  }
})
