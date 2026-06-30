import type { Router } from 'vue-router'
import { usePermissionStore } from '@/stores/permission'

/**
 * 路由守卫 —— 首次导航前自动加载动态路由
 *
 * 流程：
 * 1. 用户访问任意页面
 * 2. 守卫检查 isRoutesLoaded 是否已加载动态路由
 * 3. 未加载 → 调用 generateRoutes() 获取菜单并注入路由
 * 4. 已加载 → 直接放行
 *
 * next({ ...to, replace: true }) 的作用：
 * 路由注入后重新匹配，确保动态路径能被正确解析
 */
export function setupRouterGuard(router: Router) {
  router.beforeEach(async (to, _from, next) => {
    const store = usePermissionStore()

    if (!store.isRoutesLoaded) {
      // 首次进入 —— 拉取菜单、动态注册路由
      await store.generateRoutes()
      // 路由表已更新，重新触发当前导航以匹配动态路由
      next({ ...to, replace: true })
      return
    }

    next()
  })
}
