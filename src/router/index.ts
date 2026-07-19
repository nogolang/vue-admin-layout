import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import BasicLayout from '@/layout/BasicLayout.vue'
import { appConfig } from '@/app.config'

/**
 * ==================== 静态路由（常量路由） ====================
 *
 * 不依赖后端权限，始终存在于路由表中。
 * 所有动态路由通过 router.addRoute('Root', ...) 注入到 Root 节点的 children 中。
 *
 * 路由结构说明：
 *   /                    Root 布局壳（BasicLayout）→ 重定向到 appConfig.app.homePath
 *   /home                兜底首页（始终存在，不受 homePath 配置影响）
 *   /login               登录页（独立于布局之外，meta.hidden 表示不显示在标签页）
 *   /:pathMatch(.*)*     404 页面（通配符，匹配所有未定义路径）
 *
 * @important
 *   redirect 使用 appConfig.app.homePath（可配置，将来可被后端返回值覆盖）。
 *   但 /home 路由始终注册在路由表中，确保兜底首页不丢失。
 *   例如：homePath 配置为 '/dashboard' → 访问 / 跳转到 /dashboard，但 /home 依然可访问。
 *
 * 添加静态页面的步骤：
 *   1. 在 constantRoutes 的 Root.children 中添加路由配置
 *   2. 在 menus.ts 的 staticMenus 中添加对应的菜单项
 *   3. 在 routes.ts 的 componentMap 中添加组件映射
 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Root',
    component: BasicLayout,
    redirect: appConfig.app.homePath, // 默认跳转（可配置，见 app.config.ts）
    children: [
      // 兜底首页 —— 始终存在，即使 homePath 被配置为其他值
      {
        path: '/home',
        name: 'Home',
        component: () => import('@/views/home/index.vue'),
        meta: { title: '首页', icon: 'HomeFilled' },
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { hidden: true }, // hidden: true → 不在标签页中显示
  },
  {
    // 通配符路由 —— 必须放在最后，匹配所有未定义的路径
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { hidden: true },
  },
]

/**
 * ==================== 创建路由实例 ====================
 *
 * createWebHistory: 使用 HTML5 History 模式（需要服务端配置 fallback）
 * 如果需要 Hash 模式（兼容性更好，无需服务端配置），改用 createWebHashHistory()
 *
 * BASE_URL: 来自 vite.config.ts 的 base 配置，默认为 '/'
 * 部署到子路径时需修改 vite.config.ts 中的 base 字段
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: constantRoutes,
})

export default router
