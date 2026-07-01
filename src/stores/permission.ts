import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import router from '@/router'
import type { MenuItem } from '@/router/menus'
import { dynamicMenuList, staticMenus } from '@/router/menus'
import { menusToRoutes } from '@/router/routes'

/**
 * 权限 / 动态路由状态管理
 *
 * 核心职责：
 * - 调用后端 API 获取用户菜单
 * - 将菜单数据转为路由配置并注入 router
 * - 合并静态菜单 + 动态菜单供 BasicLayout 渲染
 * - 提供 resetRoutes 用于退出登录时清除动态路由
 */
export const usePermissionStore = defineStore('permission', () => {
  // 后端返回的动态菜单
  const dynamicMenus = ref<MenuItem[]>([])
  // 动态路由是否已加载（防止重复请求）
  const isRoutesLoaded = ref(false)
  // 已添加的路由名称，用于 reset 时逐个移除
  const addedRouteNames = ref<string[]>([])

  // 完整菜单 = 静态菜单 + 动态菜单
  const allMenus = computed(() => [...staticMenus, ...dynamicMenus.value])

  /**
   * 获取菜单 → 生成路由 → 注入 router
   * 幂等操作：isRoutesLoaded 为 true 时直接跳过
   */
  async function generateRoutes() {
    if (isRoutesLoaded.value) return

    // 当前使用前端硬编码菜单，接入后端后替换为: const menus = await fetchMenus()
    const menus = dynamicMenuList
    dynamicMenus.value = menus

    // 菜单 → 路由配置 → 注册到 Root 路由下
    const routes = menusToRoutes(menus)
    for (const route of routes) {
      addRoute(route)
    }

    isRoutesLoaded.value = true
  }

  /**
   * 递归注册路由及其子路由到 Root 节点
   * 同时记录 route name 以便后续移除
   */
  function addRoute(route: RouteRecordRaw) {
    router.addRoute('Root', route)
    if (route.name) {
      addedRouteNames.value.push(route.name as string)
    }
    if (route.children) {
      for (const child of route.children) {
        addRoute(child)
      }
    }
  }

  /** 清除所有动态路由（退出登录时调用） */
  function resetRoutes() {
    for (const name of addedRouteNames.value) {
      router.removeRoute(name)
    }
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
