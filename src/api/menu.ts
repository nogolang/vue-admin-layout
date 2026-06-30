import type { MenuItem } from '@/router/menus'

/**
 * 模拟后端 API —— 获取用户菜单/路由数据
 * 替换为真实接口即可接入后端权限系统
 */
export async function fetchMenus(): Promise<MenuItem[]> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 100))
  return [
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
}
