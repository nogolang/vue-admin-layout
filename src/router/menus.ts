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

/** 动态菜单（前端硬编码，接入后端后替换为 fetchMenus()） */
export const dynamicMenuList: MenuItem[] = [
  {
    path: '/system',
    name: 'System',
    icon: 'Setting',
    children: [
      {
        path: '/system/user',
        name: 'User',
        icon: 'User',
        component: '/system/user',
        children: [
          { path: '/system/user/list', name: 'UserList', icon: 'User', component: '/system/user' },
          { path: '/system/user/detail', name: 'UserDetail', icon: 'Document', component: '/system/user-detail' },
        ],
      },
      { path: '/system/role', name: 'Role', icon: 'Avatar', component: '/system/role' },
    ],
  },
  {
    path: '/monitor',
    name: 'Monitor',
    icon: 'Monitor',
    children: [
      { path: '/monitor/online', name: 'Online', icon: 'Connection', component: '/monitor/online' },
      { path: '/monitor/log', name: 'Log', icon: 'Document', component: '/monitor/log' },
    ],
  },
]
