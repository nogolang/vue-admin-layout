/**
 * 菜单项类型 —— 同时用于路由生成和侧边栏渲染
 *
 * path      路由路径，el-menu 的 index 值
 * name      菜单名称（显示文本 + 路由 name）
 * icon      Element Plus 图标名称，映射到 iconMap
 * component 视图文件路径，对应 componentMap 中的 key
 * children  子菜单/子路由
 */
export interface MenuItem {
  path: string
  name: string
  icon: string
  component?: string
  children?: MenuItem[]
}

/**
 * 静态菜单 —— 无需权限，始终显示
 * Dashboard 作为默认首页挂载在 Root 路由下
 */
export const staticMenus: MenuItem[] = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    icon: 'Odometer',
    component: '/dashboard',
  },
]
