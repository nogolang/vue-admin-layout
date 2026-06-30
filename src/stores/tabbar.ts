import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

export interface TabDefinition {
  key: string
  path: string
  fullPath: string
  name: string
  title: string
  affix: boolean
}

export const useTabbarStore = defineStore('tabbar', () => {
  const tabs = ref<TabDefinition[]>([])
  const activeKey = ref('')

  /** 所有非固定标签 */
  const normalTabs = computed(() => tabs.value.filter((t) => !t.affix))

  /** 按固定在前、非固定在后的顺序排列 */
  const sortedTabs = computed(() => {
    const affixTabs = tabs.value.filter((t) => t.affix)
    return [...affixTabs, ...normalTabs.value]
  })

  /** 添加标签 */
  function addTab(route: RouteLocationNormalized) {
    const title = (route.meta?.title as string) || route.name?.toString() || route.path
    const key = route.fullPath
    const affix = route.path === '/dashboard'
    const existing = tabs.value.find((t) => t.key === key)

    if (existing) {
      // 已存在则更新 title（可能在路由 meta 中动态变化）
      existing.title = title
    } else {
      tabs.value.push({
        key,
        path: route.path,
        fullPath: route.fullPath,
        name: route.name?.toString() || route.path,
        title,
        affix,
      })
    }

    activeKey.value = key
  }

  /** 关闭单个标签 */
  function closeTab(key: string) {
    const idx = tabs.value.findIndex((t) => t.key === key)
    const tab = tabs.value[idx]
    if (!tab || tab.affix) return
    tabs.value.splice(idx, 1)
  }

  /** 关闭左侧标签 */
  function closeLeftTabs(key: string) {
    const idx = tabs.value.findIndex((t) => t.key === key)
    tabs.value = tabs.value.filter((t, i) => t.affix || i >= idx)
  }

  /** 关闭右侧标签 */
  function closeRightTabs(key: string) {
    const idx = tabs.value.findIndex((t) => t.key === key)
    tabs.value = tabs.value.filter((t, i) => t.affix || i <= idx)
  }

  /** 关闭其他标签 */
  function closeOtherTabs(key: string) {
    tabs.value = tabs.value.filter((t) => t.affix || t.key === key)
  }

  /** 关闭所有非固定标签 */
  function closeAllTabs() {
    tabs.value = tabs.value.filter((t) => t.affix)
  }

  return {
    tabs,
    activeKey,
    sortedTabs,
    normalTabs,
    addTab,
    closeTab,
    closeLeftTabs,
    closeRightTabs,
    closeOtherTabs,
    closeAllTabs,
  }
})
