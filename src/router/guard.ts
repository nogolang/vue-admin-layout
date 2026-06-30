import type { Router } from 'vue-router'
import { usePermissionStore } from '@/stores/permission'

/**
 * 路由守卫 —— 首次导航前自动加载动态路由
 *
 * Vue Router 5 不再使用 next()，改用 return：
 * - 返回 undefined → 放行
 * - 返回路由地址   → 重定向
 *
 * 流程：
 * 1. 用户访问任意页面（含刷新）
 * 2. 守卫检查 isRoutesLoaded 是否已加载动态路由
 * 3. 未加载 → 调用 generateRoutes() 获取菜单并注入路由
 * 4. 返回 { path: to.path } 重新匹配，此时动态路由已生效
 * 5. 已加载 → 直接放行
 */
export function setupRouterGuard(router: Router) {
  router.beforeEach(async (to, _from) => {
    const store = usePermissionStore()

    if (!store.isRoutesLoaded) {
      // 首次进入 —— 拉取菜单、动态注册路由
      await store.generateRoutes()
      // 路由表已更新，用 path 重新导航
      // 注意：不用 { ...to }，刷新时 to.name 可能是 'NotFound'，spread 会带到重试里
      return { path: to.path, query: to.query, params: to.params, replace: true }
    }
  })
}
