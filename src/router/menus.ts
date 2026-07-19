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
  component?: string
  children?: MenuItem[]
  // 扩展字段：可按需添加，配合后端权限系统使用
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
    component: '/home',
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
export const dynamicMenuList: MenuItem[] = []
