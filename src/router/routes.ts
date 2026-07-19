import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { MenuItem } from './menus'

/**
 * ==================== 视图组件映射表 ====================
 *
 * 将 MenuItem.component 的字符串路径映射到实际的 Vue 组件（懒加载）。
 * 所有需要动态注册的页面都必须在此添加映射关系。
 *
 * 添加新页面的步骤：
 *   1. 在 src/views/ 下创建 .vue 文件
 *   2. 在此添加一条映射：'/your/path': () => import('@/views/your-path/xxxList.vue')
 *   3. 在 menus.ts 的菜单数据中引用 component: '/your/path'
 *
 * 找不到对应 component 的菜单项会被静默跳过（不会注入路由）。
 */
const componentMap: Record<string, () => Promise<Component>> = {
  '/home': () => import('@/views/home/index.vue'),
  '/system/role': () => import('@/views/system/sysRole/sysRoleList.vue'),
  '/system/user': () => import('@/views/system/sysUser/sysUserList.vue'),
  '/system/menu': () => import('@/views/system/sysMenu/sysMenuList.vue'),
  '/system/api': () => import('@/views/system/sysApi/sysApiList.vue'),
  '/test/m1/g1/page1': () => import('@/views/test/m1/g1/page1.vue'),
  '/test/m1/g1/page2': () => import('@/views/test/m1/g1/page2.vue'),
  '/test/m1/g2/page1': () => import('@/views/test/m1/g2/page1.vue'),
  '/test/m2/g1/page1': () => import('@/views/test/m2/g1/page1.vue'),
  '/test/m1/g1/sg1/page1': () => import('@/views/test/m1/g1/sg1/page1.vue'),
  '/test/m1/g1/sg1/page2': () => import('@/views/test/m1/g1/sg1/page2.vue'),
}

/**
 * ==================== 路径 → 路由名称转换 ====================
 *
 * 规则：去掉开头的 "/"，将剩余 "/" 替换为 "-"
 * 示例：
 *   /system/user       → system-user
 *   /system/user/detail → system-user-detail
 *
 * 此名称用作 router.addRoute 的 name 参数，必须是唯一的。
 */
function pathToName(path: string): string {
  return path.replace(/^\//, '').replace(/\//g, '-')
}

/**
 * ==================== 菜单树 → 路由配置 ====================
 *
 * 将后端返回（或前端定义）的菜单树递归转换为 vue-router 可用的 RouteRecordRaw[]。
 *
 * 转换规则：
 *   1. 有 children 但不含 component 的节点 → 生成 redirect 路由（指向第一个子路由）
 *      ── 作为分组父级，不渲染页面，只负责跳转
 *   2. 有 children 且含 component 的节点 → 先生成 redirect，再递归处理 children
 *   3. 叶子节点（有 component）→ 生成实际路由记录，挂载页面组件
 *   4. component 不在 componentMap 中的节点 → 跳过（不注入）
 *
 * @param menus  菜单树，通常来自后端 API 或静态定义
 * @returns      可直接用于 router.addRoute 的路由配置数组
 */
export function menusToRoutes(menus: MenuItem[]): RouteRecordRaw[] {
  const result: RouteRecordRaw[] = []

  for (const menu of menus) {
    // 处理父子节点的情况
    if (menu.children?.length) {
      // 父级菜单（有子节点）→ 创建 redirect 路由指向第一个子路由
      // 用户点击父菜单时自动跳转到第一个子页面
      const firstChild = menu.children[0]!
      result.push({
        path: menu.path,
        name: pathToName(menu.path),
        redirect: firstChild.path,
        meta: { title: menu.name, icon: menu.icon },
      })

      // 如果父菜单自身也有 component → 额外生成一个 index 路由
      if (menu.component) {
        const comp = componentMap[menu.component]
        if (comp) {
          result.push({
            path: menu.path + '/index', // 避免与 redirect 路由 path 冲突
            name: pathToName(menu.path) + '-index',
            component: comp,
            meta: { title: menu.name + '概览', icon: menu.icon },
          })
        }
      }

      // 递归处理子菜单
      result.push(...menusToRoutes(menu.children))
    } else if (menu.component) {
      // 叶子节点 → 挂载实际的页面组件
      const comp = componentMap[menu.component]
      if (comp) {
        result.push({
          path: menu.path,
          name: pathToName(menu.path),
          component: comp,
          meta: { title: menu.name, icon: menu.icon },
        })
      } else {
        // 组件未注册，跳过该路由（生产环境应记录日志）
        console.warn(`[routes] component "${menu.component}" 未在 componentMap 中注册，已跳过`)
      }
    }
    // 没有 component 也没有 children 的菜单项 → 忽略
  }

  return result
}
