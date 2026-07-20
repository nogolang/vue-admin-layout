import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { MenuItem } from './menus'

/**
 * ==================== 动态菜单组件映射表 ====================
 *
 * 仅用于从后端获取的动态菜单（component 为字符串路径时）。
 * 静态菜单已在 menus.ts 中直接使用 () => import(...)，无需此映射。
 */
const componentMap: Record<string, () => Promise<Component>> = {
  '/test/m1/g1/page1': () => import('@/views/test/m1/g1/page1.vue'),
  '/test/m1/g1/page2': () => import('@/views/test/m1/g1/page2.vue'),
  '/test/m1/g2/page1': () => import('@/views/test/m1/g2/page1.vue'),
  '/test/m2/g1/page1': () => import('@/views/test/m2/g1/page1.vue'),
  '/test/m1/g1/sg1/page1': () => import('@/views/test/m1/g1/sg1/page1.vue'),
  '/test/m1/g1/sg1/page2': () => import('@/views/test/m1/g1/sg1/page2.vue'),
}

/**
 * 解析菜单项的 component 字段
 * 静态菜单直接返回导入函数，动态菜单（字符串）从 componentMap 查找
 */
function resolveComponent(c: string | (() => Promise<Component>)): (() => Promise<Component>) | null {
  if (typeof c === 'function') return c
  return componentMap[c] || null
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
        meta: { title: menu.name, icon: menu.icon, ...menu.meta },
      })

      // 如果父菜单自身也有 component → 额外生成一个 index 路由
      if (menu.component) {
        const comp = resolveComponent(menu.component)
        if (comp) {
          result.push({
            path: menu.path + '/index',
            name: pathToName(menu.path) + '-index',
            component: comp,
            meta: { title: menu.name + '概览', icon: menu.icon, ...menu.meta },
          })
        }
      }

      // 递归处理子菜单
      result.push(...menusToRoutes(menu.children))
    } else if (menu.component) {
      const comp = resolveComponent(menu.component)
      if (comp) {
        result.push({
          path: menu.path,
          name: pathToName(menu.path),
          component: comp,
          meta: { title: menu.name, icon: menu.icon, ...menu.meta },
        })
      } else {
        console.warn(`[routes] component "${String(menu.component)}" 未注册，已跳过`)
      }
    }
    // 没有 component 也没有 children 的菜单项 → 忽略
  }

  return result
}
