import type { Router } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'
import { appConfig } from '@/app.config'

/**
 * ==================== 路由守卫 ====================
 *
 * 双重校验：
 *   1. 鉴权：无 token 时跳转登录页
 *   2. 路由就绪：如果配置为登录后加载路由（loadRoutesOn === 'login'），
 *      已登录但路由尚未加载时也跳转登录页触发 generateRoutes()
 */
export function setupRouterGuard(router: Router) {
  router.beforeEach((to, _from) => {
    const userStore = useUserStore()
    const token = userStore.getToken()

    // 未登录 → 跳转登录页
    if (!token) {
      if (to.path !== '/login') {
        ElMessage.warning('请先登录')
        return { path: '/login', replace: true }
      }
      return
    }

    // 已登录访问登录页 → 跳转首页
    if (to.path === '/login') {
      return { path: '/', replace: true }
    }

    // 登录后加载模式：路由未就绪时跳转登录页触发 generateRoutes()
    // 登录页会检测到已有 token 并自动完成路由加载
    if (appConfig.route.loadRoutesOn === 'login' && !usePermissionStore().isRoutesLoaded) {
      return { path: '/login', replace: true }
    }
  })
}
