import type { Router } from 'vue-router'
import { ElMessage } from 'element-plus'
import { usePermissionStore } from '@/stores/permission'
import { useUserStore } from '@/stores/user'

/**
 * ==================== 路由守卫 ====================
 *
 * 在应用启动时（main.ts）注册，拦截所有路由导航。
 *
 * 核心职责：
 *   1. 登录鉴权 —— 非登录页需要 token，未登录跳转到 /login
 *   2. 动态路由 —— 首次进入应用时自动加载动态路由
 *
 * 执行流程：
 *   1. 用户访问任意页面
 *   2. 检查是否为登录页
 *      - 是登录页 → 直接放行
 *      - 不是登录页且无 token → 跳转 /login
 *   3. 检查 isRoutesLoaded 状态
 *      - 未加载 → 调用 generateRoutes() 获取菜单并注入路由表
 *      - 已加载 → 放行
 *
 * 注意事项（Vue Router 5.x 重要变更）：
 *   - 不再使用 next() 回调函数，改用 return 控制导航
 *   - return undefined 或什么都不返回 → 放行（确认导航）
 *   - return 路由地址（字符串/对象） → 重定向到目标路由
 *   - 刷新页面时 to.name 可能是 'NotFound'（动态路由还未注入），因此重试时只传 path 不传 name
 *
 * 扩展建议：
 *   - 如需页面标题自动设置，在此添加 document.title 逻辑
 *   - 如需进度条，已在 axios 拦截器中集成了 NProgress，此处无需重复添加
 */
export function setupRouterGuard(router: Router) {
  router.beforeEach(async (to, _from) => {
    const userStore = useUserStore()
    const permissionStore = usePermissionStore()

    // ==================== 1. 登录鉴权 ====================

    // 白名单路由 —— 无需登录即可访问
    const whiteList = ['/login']

    // 获取当前 token（从 Pinia userStore 中读取）
    const token = userStore.getToken()

    if (token) {
      // 已登录 → 如果访问登录页，自动跳转到首页（避免重复登录）
      if (to.path === '/login') {
        return { path: '/', replace: true }
      }
    } else {
      // 未登录 → 白名单之外的路由全部跳转到登录页
      if (!whiteList.includes(to.path)) {
        ElMessage.warning('请先登录')
        return { path: '/login', replace: true }
      }
      // 未登录 + 访问白名单页面 → 跳过动态路由加载，直接放行
      return
    }

    // ==================== 2. 动态路由加载 ====================

    // 动态路由未加载 → 拉取菜单、注册路由
    if (!permissionStore.isRoutesLoaded) {
      await permissionStore.generateRoutes()

      // 路由表已更新，用当前 path 重新触发导航
      // 注意：不要 spread { ...to }，因为刷新时 to.name 可能是 'NotFound'
      // replace: true → 不产生新的历史记录
      return { path: to.path, query: to.query, params: to.params, replace: true }
    }

    // 动态路由已加载 → 正常放行
    // 不需要 return 任何值（等价于 return undefined）
  })
}
