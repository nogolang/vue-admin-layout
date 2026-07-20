import type { Component } from 'vue'
import {
  HomeFilled,
  Setting,
  User,
  Document,
  SetUp,
  Menu,
  FolderOpened,
} from '@element-plus/icons-vue'

/**
 * ==================== 图标映射表 ====================
 *
 * MenuItem.icon 字符串 → Element Plus 图标组件的映射。
 * 此处仅注册当前菜单实际使用的图标。
 * 下游项目如需扩展图标，直接在此 Map 追加即可。
 */
export const iconMap: Record<string, Component> = {
  HomeFilled,
  Setting,
  User,
  Document,
  SetUp,
  Menu,
  FolderOpened,
}

/**
 * ==================== 菜单项类型定义 ====================
 *
 * MenuItem 是整个框架的核心数据结构，同时用于：
 *   1. 路由生成（menusToRoutes）
 *   2. 侧边栏渲染（BasicLayout 中的 el-menu）
 *   3. 权限控制（后端返回的菜单树 → 前端动态注册路由）
 *
 * 字段说明：
 *   path      - 路由路径，也是 el-menu 的 index（唯一标识）
 *   name      - 菜单显示名称 & 路由 name（建议英文，中文可配合 i18n）
 *   icon      - Element Plus 图标名称，映射到 iconMap 对象
 *   component - 视图文件路径，对应 componentMap 中的 key（叶子节点必填）
 *   children  - 子菜单/子路由（支持无限嵌套，但建议不超过 3 层）
 *   meta      - 附加元数据（可选），可存放权限码、打开方式等
 *
 * 使用示例：
 *   const menu: MenuItem = {
 *     path: '/system',
 *     name: '系统管理',
 *     icon: 'Setting',
 *     children: [
 *       {
 *         path: '/system/user',
 *         name: '用户管理',
 *         icon: 'User',
 *         component: '/system/user',
 *       },
 *     ],
 *   }
 */
export interface MenuItem {
  path: string
  name: string
  icon: string
  /** 静态菜单传 () => import(...)，动态菜单（后端）传字符串路径 */
  component?: string | (() => Promise<Component>)
  children?: MenuItem[]
  meta?: Record<string, any>
}

/**
 * ==================== 静态菜单 ====================
 *
 * 始终显示在侧边栏，不依赖后端权限接口。
 * 通常用于"首页"、"工作台"等公共入口。
 *
 * 注意：staticMenus 中的路由必须在 router/index.ts 中作为静态路由注册，
 *       否则页面无法访问。
 */
export const staticMenus: MenuItem[] = [
  {
    path: '/home',
    name: '首页',
    icon: 'HomeFilled',
    component: () => import('@/views/home/index.vue'),
  },
  {
    path: '/login',
    name: '登录',
    icon: 'HomeFilled',
    component: () => import('@/views/login/index.vue'),
    meta: { hidden: true },
  },
  {
    path: '/system',
    name: '系统管理',
    icon: 'Setting',
    children: [
      {
        path: '/system/role',
        name: '角色管理',
        icon: 'User',
        component: () => import('@/views/system/sysRole/sysRoleList.vue'),
      },
      {
        path: '/system/user',
        name: '用户管理',
        icon: 'User',
        component: () => import('@/views/system/sysUser/sysUserList.vue'),
      },
      {
        path: '/system/menu',
        name: '菜单管理',
        icon: 'Menu',
        component: () => import('@/views/system/sysMenu/sysMenuList.vue'),
      },
      {
        path: '/system/api',
        name: '接口管理',
        icon: 'SetUp',
        component: () => import('@/views/system/sysApi/sysApiList.vue'),
      },
    ],
  },
]

/**
 * ==================== 动态菜单（示例/占位） ====================
 *
 * 实际使用时可以：
 *   方案一：前端硬编码（适合纯前端项目）—— 直接把菜单数据写在这里
 *   方案二：后端返回   （适合带权限系统）—— 删除 dynamicMenuList，改用 fetchMenus() API
 *
 * 当前 dynamicMenuList 为空数组，请根据项目需求填充。
 */
export const dynamicMenuList: MenuItem[] = [
  {
    path: '/test',
    name: '测试菜单',
    icon: 'SetUp',
    children: [
      {
        path: '/test/m1',
        name: '模块一',
        icon: 'Menu',
        children: [
          {
            path: '/test/m1/g1',
            name: '分组甲',
            icon: 'FolderOpened',
            children: [
              {
                path: '/test/m1/g1/sg1',
                name: '子分组',
                icon: 'FolderOpened',
                children: [
                  {
                    path: '/test/m1/g1/sg1/page1',
                    name: '页面 Epsilon',
                    icon: 'Document',
                    component: '/test/m1/g1/sg1/page1',
                  },
                  {
                    path: '/test/m1/g1/sg1/page2',
                    name: '页面 Zeta',
                    icon: 'Document',
                    component: '/test/m1/g1/sg1/page2',
                  },
                ],
              },
              {
                path: '/test/m1/g1/page1',
                name: '页面 Alpha',
                icon: 'Document',
                component: '/test/m1/g1/page1',
              },
              {
                path: '/test/m1/g1/page2',
                name: '页面 Beta',
                icon: 'Document',
                component: '/test/m1/g1/page2',
              },
            ],
          },
          {
            path: '/test/m1/g2',
            name: '分组乙',
            icon: 'FolderOpened',
            children: [
              {
                path: '/test/m1/g2/page1',
                name: '页面 Gamma',
                icon: 'Document',
                component: '/test/m1/g2/page1',
              },
            ],
          },
        ],
      },
      {
        path: '/test/m2',
        name: '模块二',
        icon: 'Menu',
        children: [
          {
            path: '/test/m2/g1',
            name: '分组丙',
            icon: 'FolderOpened',
            children: [
              {
                path: '/test/m2/g1/page1',
                name: '页面 Delta',
                icon: 'Document',
                component: '/test/m2/g1/page1',
              },
            ],
          },
        ],
      },
    ],
  },
]
