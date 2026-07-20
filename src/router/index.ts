import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import BasicLayout from '@/layout/BasicLayout.vue'
import { appConfig } from '@/app.config'
import { staticMenus } from './menus'

/** 从 staticMenus 中按 path 取组件的辅助函数 */
function staticComp(path: string) {
  const menu = staticMenus.find((m) => m.path === path)
  return typeof menu?.component === 'function' ? menu.component : undefined
}

/**
 * ==================== 静态路由（常量路由） ====================
 *
 * 不依赖后端权限，始终存在于路由表中。
 * 所有动态路由通过 router.addRoute('Root', ...) 注入到 Root 节点的 children 中。
 *
 * 路由结构：
 *   /                    Root 布局壳（BasicLayout）→ 重定向到 appConfig.app.homePath
 *   /home                兜底首页（始终可访问，不受 homePath 配置影响）
 *   /:pathMatch(.*)*     404 通配符
 *
 * 静态页面（含登录页）统一在 staticMenus 中定义，由 menusToRoutes 生成路由。
 * 仅 Root 布局壳、/home 兜底、404 在此常量路由中定义。
 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Root',
    component: BasicLayout,
    redirect: appConfig.app.homePath,
    children: [
      {
        path: '/home',
        name: 'Home',
        component: staticComp('/home')!,
        meta: { title: '首页', icon: 'HomeFilled' },
      },
    ],
  },
  {
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
