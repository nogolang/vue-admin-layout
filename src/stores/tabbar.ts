import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'
import { appConfig } from '@/app.config'

/**
 * ==================== 标签页数据模型 ====================
 *
 * 每个 TabDefinition 对应一个打开的页面标签。
 *
 * 字段说明：
 *   key      - 标签唯一标识（使用 route.fullPath，包含 query 和 hash）
 *   path     - 路由路径（不含 query）
 *   fullPath - 完整路径（含 query 和 hash），用于导航跳转
 *   name     - 路由名称
 *   title    - 标签显示文本（来源于 route.meta.title 或 route.name）
 *   affix    - 是否为固定标签（true → 不可关闭，始终显示）
 */
export interface TabDefinition {
  key: string
  path: string
  fullPath: string
  name: string
  title: string
  affix: boolean
}

/**
 * ==================== 标签页状态管理 ====================
 *
 * 管理主内容区顶部的多标签页状态，包括：
 *   1. 标签列表维护（添加、关闭）
 *   2. 固定标签（affix）保护（固定路径列表来源于 appConfig）
 *   3. 右键菜单操作（关闭左侧/右侧/其他/全部）
 *   4. 标签排序（固定标签始终在前）
 *
 * 配置关联：
 *   - 固定标签路径 → appConfig.tabbar.affixPaths（src/config/app.ts）
 *   - 是否显示标签栏 → appConfig.tabbar.showTabbar
 *
 * 使用方式：
 *   const tabbarStore = useTabbarStore()
 *   tabbarStore.addTab(route)         // 添加标签
 *   tabbarStore.closeTab(key)         // 关闭标签
 *   tabbarStore.closeAllTabs()        // 关闭所有非固定标签
 *
 * 持久化建议：
 *   如需持久化标签页状态（刷新恢复），可配合 pinia-plugin-persistedstate 使用。
 */
export const useTabbarStore = defineStore('tabbar', () => {
  /** 所有标签页列表 */
  const tabs = ref<TabDefinition[]>([])

  /** 当前激活的标签 key */
  const activeKey = ref('')

  // ==================== 计算属性 ====================

  /** 所有非固定标签（可关闭的标签） */
  const normalTabs = computed(() => tabs.value.filter((t) => !t.affix))

  /**
   * 排序后的标签列表
   * 固定标签在前 + 非固定标签在后
   *
   * 为什么排序？
   *   固定标签（如首页）应该始终在最左边，不受新增标签的影响。
   */
  const sortedTabs = computed(() => {
    const affixTabs = tabs.value.filter((t) => t.affix)
    return [...affixTabs, ...normalTabs.value]
  })

  // ==================== 操作方法 ====================

  /**
   * 添加标签到标签列表
   *
   * 逻辑：
   *   1. 从 route.meta.title 或 route.name 获取标签标题
   *   2. 根据 appConfig.tabbar.affixPaths 判断是否为固定标签
   *   3. 已存在的标签 → 更新 title（meta 可能动态变化）
   *   4. 新标签 → push 到列表
   *   5. 更新 activeKey
   *
   * @param route  当前路由对象
   */
  function addTab(route: RouteLocationNormalized) {
    // 标题优先级：meta.title > route.name > path（兜底）
    const title = (route.meta?.title as string) || route.name?.toString() || route.path
    // 使用 fullPath 作为唯一键（保留 query 和 hash）
    const key = route.fullPath

    // 从配置中判断是否固定标签（断言为 string[] 以兼容 TypeScript 的 as const 只读元组类型）
    const affix = (appConfig.tabbar.affixPaths as readonly string[]).includes(route.path)

    // 检查是否已存在
    const existing = tabs.value.find((t) => t.key === key)

    if (existing) {
      // 已存在 → 更新 title（可能在路由 meta 中动态变化）
      existing.title = title
    } else {
      // 新标签 → 添加到列表
      tabs.value.push({
        key,
        path: route.path,
        fullPath: route.fullPath,
        name: route.name?.toString() || route.path,
        title,
        affix,
      })
    }

    // 更新当前激活标签
    activeKey.value = key
  }

  /**
   * 关闭单个标签
   *
   * 固定标签（affix = true）不可关闭，会被静默忽略。
   *
   * @param key  要关闭的标签 key
   */
  function closeTab(key: string) {
    const idx = tabs.value.findIndex((t) => t.key === key)
    const tab = tabs.value[idx]
    // 固定标签保护
    if (!tab || tab.affix) return
    tabs.value.splice(idx, 1)
  }

  /**
   * 关闭指定标签左侧的所有非固定标签
   *
   * 保留规则：
   *   - 固定标签（affix）→ 始终保留
   *   - index >= idx 的标签 → 保留（即当前及右侧的标签）
   *
   * @param key  参考标签的 key
   */
  function closeLeftTabs(key: string) {
    const idx = tabs.value.findIndex((t) => t.key === key)
    tabs.value = tabs.value.filter((t, i) => t.affix || i >= idx)
  }

  /**
   * 关闭指定标签右侧的所有非固定标签
   *
   * 保留规则：
   *   - 固定标签（affix）→ 始终保留
   *   - index <= idx 的标签 → 保留（即当前及左侧的标签）
   *
   * @param key  参考标签的 key
   */
  function closeRightTabs(key: string) {
    const idx = tabs.value.findIndex((t) => t.key === key)
    tabs.value = tabs.value.filter((t, i) => t.affix || i <= idx)
  }

  /**
   * 关闭除指定标签和固定标签外的所有其他标签
   *
   * @param key  要保留的标签 key
   */
  function closeOtherTabs(key: string) {
    tabs.value = tabs.value.filter((t) => t.affix || t.key === key)
  }

  /**
   * 关闭所有非固定标签
   * 通常与跳转到首页配合使用
   */
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
