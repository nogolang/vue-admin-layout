import type { RouteRecordRaw } from 'vue-router'
import type { MenuItem } from './menus'

/**
 * 视图组件映射表
 * key 对应 MenuItem.component，value 为懒加载的页面组件
 * 动态路由的页面都需要在此注册
 */
const componentMap: Record<string, () => Promise<any>> = {
  '/dashboard': () => import('@/views/dashboard/index.vue'),
  '/system/user': () => import('@/views/system/user.vue'),
  '/system/role': () => import('@/views/system/role.vue'),
  '/monitor/online': () => import('@/views/monitor/online.vue'),
  '/monitor/log': () => import('@/views/monitor/log.vue'),
  '/system/user-detail': () => import('@/views/system/user-detail.vue'),
}

/** 路径转路由 name： /system/user → system-user */
function pathToName(path: string): string {
  return path.replace(/^\//, '').replace(/\//g, '-')
}

/**
 * 将后端返回的菜单树转换为 vue-router 路由配置
 *
 * - 有 children 的节点生成 redirect 路由（指向第一个子节点）
 * - 带 component 的叶子节点生成实际路由记录
 * - 递归处理嵌套菜单
 */
export function menusToRoutes(menus: MenuItem[]): RouteRecordRaw[] {
  const result: RouteRecordRaw[] = []

  for (const menu of menus) {
    if (menu.children?.length) {
      // 父级菜单 —— 重定向到第一个子路由
      const firstChild = menu.children[0]!
      result.push({
        path: menu.path,
        name: pathToName(menu.path),
        redirect: firstChild.path,
      })
      // 递归处理子节点
      result.push(...menusToRoutes(menu.children))
    } else if (menu.component) {
      // 叶子节点 —— 挂载实际页面组件
      const comp = componentMap[menu.component]
      if (comp) {
        result.push({
          path: menu.path,
          name: pathToName(menu.path),
          component: comp,
          meta: { title: menu.name, icon: menu.icon },
        })
      }
    }
  }

  return result
}
