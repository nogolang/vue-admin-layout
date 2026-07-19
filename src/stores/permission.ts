import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import router from '@/router'
import type { MenuItem } from '@/router/menus'
import { dynamicMenuList, staticMenus } from '@/router/menus'
import { menusToRoutes } from '@/router/routes'
import { fetchUserInfo } from '@/api/system/sysUser'
import { appConfig, setHomePath } from '@/app.config'

/**
 * ==================== 权限 & 动态路由状态管理 ====================
 *
 * 核心职责：
 *   1. 获取用户菜单数据（静态模式读前端数据，动态模式调后端 API）
 *   2. 将菜单数据转换为 vue-router 路由配置
 *   3. 将动态路由注入到 Root 布局路由下
 *   4. 合并静态菜单 + 动态菜单，供 BasicLayout 渲染侧边栏
 *   5. 提供 resetRoutes() 用于退出登录时清除所有动态路由
 *
 * 两种模式说明：
 *   【静态路由模式】appConfig.route.useDynamicRoutes === false
 *     菜单数据来自 menus.ts 中的 dynamicMenuList 数组。
 *     所有用户看到的菜单一样，无需后端接口。
 *     适合：单角色后台、无权限需求、或纯前端项目。
 *
 *   【动态权限模式】appConfig.route.useDynamicRoutes === true
 *     菜单数据来自后端 API（fetchUserInfo() → /userInfo/info），后端根据角色返回菜单树和首页路径。
 *     适合：多角色后台系统，不同用户看到不同菜单。
 *
 * 切换方式：
 *   修改 src/config/app.ts 中的 appConfig.route.useDynamicRoutes 即可。
 *
 * 关键状态：
 *   isRoutesLoaded   —— 防止重复请求（页面刷新时会重置为 false）
 *   dynamicMenus      —— 菜单原始数据
 *   addedRouteNames   —— 已注册的路由名称列表（用于 removeRoute）
 *   allMenus          —— 静态菜单 + 动态菜单（computed，自动响应变化）
 *
 * 调用时机：
 *   - 首次进入应用 → 路由守卫自动调用 generateRoutes()
 *   - 退出登录     → 手动调用 resetRoutes() 清除路由
 */
export const usePermissionStore = defineStore('permission', () => {
  /** 后端返回（或前端定义）的动态菜单原始数据 */
  const dynamicMenus = ref<MenuItem[]>([])

  /** 是否已完成动态路由加载（幂等保护，防止重复请求） */
  const isRoutesLoaded = ref(false)

  /** 已通过 router.addRoute 注册的路由名称，用于 reset 时逐个移除 */
  const addedRouteNames = ref<string[]>([])

  /**
   * 完整菜单列表（computed，自动合并静态 + 动态）
   * BasicLayout 和侧边栏组件直接消费此数据
   */
  const allMenus = computed(() => [...staticMenus, ...dynamicMenus.value])

  /**
   * 加载动态路由的入口（幂等操作）
   *
   * 根据 appConfig.route.useDynamicRoutes 决定数据来源：
   *   - 静态模式 → 读取 menus.ts 中的 dynamicMenuList
   *   - 动态模式 → 调用 fetchMenus() 从后端获取
   *
   * 执行流程：
   *   1. 检查 isRoutesLoaded，已加载则直接返回（避免重复请求）
   *   2. 获取菜单数据（静态或动态）
   *   3. 调用 menusToRoutes() 将菜单转为路由配置
   *   4. 调用 addRoute() 递归注册到 Root 路由节点
   *   5. 标记 isRoutesLoaded = true
   */
  async function generateRoutes() {
    // 幂等保护：已加载则跳过
    if (isRoutesLoaded.value) return

    /**
     * 根据配置选择菜单数据来源：
     *   useDynamicRoutes = true  → 调用后端 API
     *   useDynamicRoutes = false → 使用前端硬编码数据
     */
    let menus: MenuItem[]

    if (appConfig.route.useDynamicRoutes) {
      // 【动态权限模式】从后端 API 获取菜单 + 角色首页
      const result = await fetchUserInfo()
      menus = result.menus

      // 用后端返回的 home 字段更新运行时首页路径
      setHomePath(result.home)
    } else {
      // 【静态路由模式】使用前端定义的菜单数据
      // staticMenus 也需要转路由（如 /system/role、/system/user），
      // 仅 /home 已在 router/index.ts 中静态注册，由 pathToName 产生的
      // 路由名 'home'（小写）与静态注册的 'Home'（大写）不冲突
      menus = dynamicMenuList
    }

    // 存储动态菜单数据
    dynamicMenus.value = menus

    // 静态菜单 + 动态菜单 → 路由配置 → 逐个注册到 'Root' 布局路由下
    const routes = menusToRoutes([...staticMenus, ...menus])
    for (const route of routes) {
      addRoute(route)
    }

    // 标记加载完成
    isRoutesLoaded.value = true
  }

  /**
   * 递归注册单条路由及其所有子孙路由
   *
   * 使用 router.addRoute('Root', route) 将动态路由挂载到 BasicLayout 的 children 中。
   * 同时记录 route.name 到 addedRouteNames，以便后续 removeRoute 精确移除。
   *
   * 注意：
   *   - 如果 route.name 重复，Vue Router 会发出警告，请确保菜单中的 path 全局唯一
   *   - 嵌套 children 会递归处理
   *
   * @param route  待注册的路由配置
   */
  function addRoute(route: RouteRecordRaw) {
    router.addRoute('Root', route)

    // 记录路由名称，供 resetRoutes 使用
    if (route.name) {
      addedRouteNames.value.push(route.name as string)
    }

    // 递归注册子路由
    if (route.children) {
      for (const child of route.children) {
        addRoute(child)
      }
    }
  }

  /**
   * 清除所有动态路由（退出登录时调用）
   *
   * 执行操作：
   *   1. 逐个移除已注册的动态路由
   *   2. 清空菜单数据和路由名称记录
   *   3. 重置加载状态（下次进入时会重新拉取）
   *
   * 注意：不清除 constantRoutes 中的静态路由（/home、/login、404）
   *
   * 使用示例：
   *   function logout() {
   *     usePermissionStore().resetRoutes()
   *     router.push('/login')
   *   }
   */
  function resetRoutes() {
    // 按名称逐个移除动态路由
    for (const name of addedRouteNames.value) {
      router.removeRoute(name)
    }

    // 重置所有状态
    dynamicMenus.value = []
    addedRouteNames.value = []
    isRoutesLoaded.value = false
  }

  return {
    allMenus,
    dynamicMenus,
    isRoutesLoaded,
    generateRoutes,
    resetRoutes,
  }
})
