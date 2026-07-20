import type { Router } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

/**
 * ==================== 路由守卫 ====================
 *
 * 仅负责登录鉴权。路由加载（静态/动态）在 main.ts 应用启动时完成。
 */
export function setupRouterGuard(router: Router) {
  router.beforeEach((to, _from) => {
    const userStore = useUserStore()
    const token = userStore.getToken()

    if (token) {
      if (to.path === '/login') {
        return { path: '/', replace: true }
      }
      return
    }

    if (to.path !== '/login') {
      ElMessage.warning('请先登录')
      return { path: '/login', replace: true }
    }
  })
}
