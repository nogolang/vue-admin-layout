import request from '@/api/index'

/**
 * ==================== 菜单管理 API ====================
 *
 * 管理系统菜单（页面/按钮/分组），支持菜单树及权限码查询。
 *
 * 后端端点示例：
 *   POST   /admin/edu/sysMenu/findTree            — 菜单树（管理端）
 *   POST   /admin/edu/sysMenu/add                 — 创建菜单
 *   PUT    /admin/edu/sysMenu/updateById/:id      — 更新菜单
 *   POST   /admin/edu/sysMenu/deleteByIds          — 删除菜单
 *   POST   /admin/edu/sysMenu/findCurrentUserMenuTree — 当前用户菜单树（用于动态路由）
 *   POST   /admin/edu/sysMenu/permissionCodes      — 当前用户权限码列表
 */

// ==================== 类型定义 ====================

/** 菜单类型 */
export type MenuType = 'button' | 'group' | 'page'

/** 菜单实体 */
export interface SysMenu {
  /** 菜单 ID */
  id: number
  /** 父菜单 ID（0 表示根级） */
  parentId: number
  /** 菜单名称 */
  name: string
  /** 路由路径 */
  path: string
  /** 视图组件路径（对应 views 目录，仅 page 类型有效） */
  component?: string
  /** 重定向路径 */
  redirect?: string
  /** 路由 name */
  routeName?: string
  /** 权限标识（仅 button 类型有效） */
  perm?: string
  /** Element Plus 图标名 */
  icon?: string
  /** 菜单类型：group=分组, page=页面, button=按钮 */
  type: MenuType
  /** 排序（越小越靠前） */
  sort?: number
  /** 状态：1=启用, 2=禁用 */
  status?: number
  /** 是否缓存页面：1=是, 0=否 */
  keepAlive?: number
  /** 菜单中隐藏：1=是, 0=否 */
  hideInMenu?: number
  /** 标签页中隐藏：1=是, 0=否 */
  hideInTab?: number
  /** 面包屑中隐藏：1=是, 0=否 */
  hideInBreadcrumb?: number
  /** 隐藏子菜单：1=是, 0=否 */
  hideChildrenInMenu?: number
  /** 不展示侧边栏：1=是, 0=否 */
  hideSidebar?: number
  /** 固定标签页：1=是, 0=否 */
  affixTab?: number
  /** 路由参数 */
  params?: string
  /** 子菜单 */
  children?: SysMenu[]
  [key: string]: any
}

/** 菜单查询参数 */
export interface SysMenuQuery {
  queryStr?: string
}

/** 菜单创建/更新请求 */
export interface SysMenuRequest {
  /** 父菜单 ID */
  parentId: number
  /** 菜单名称 */
  name: string
  /** 路由路径 */
  path: string
  /** 视图组件路径 */
  component?: string
  /** 重定向路径 */
  redirect?: string
  /** 路由 name */
  routeName?: string
  /** 权限标识 */
  perm?: string
  /** 图标名 */
  icon?: string
  /** 菜单类型 */
  type: MenuType
  /** 排序 */
  sort?: number
  /** 状态 */
  status?: number
  /** 是否缓存 */
  keepAlive?: number
  /** 菜单中隐藏 */
  hideInMenu?: number
  /** 标签页中隐藏 */
  hideInTab?: number
  /** 面包屑中隐藏 */
  hideInBreadcrumb?: number
  /** 隐藏子菜单 */
  hideChildrenInMenu?: number
  /** 不展示侧边栏 */
  hideSidebar?: number
  /** 固定标签页 */
  affixTab?: number
  /** 路由参数 */
  params?: string
}

// ==================== 菜单 CRUD ====================

/** 获取菜单树（管理端） */
export async function getMenuTree() {
  return request.post('/admin/edu/sysMenu/findTree')
}

/** 创建菜单 */
export async function createMenu(data: SysMenuRequest) {
  return request.post('/admin/edu/sysMenu/add', data)
}

/** 更新菜单 */
export async function updateMenu(id: number, data: Partial<SysMenuRequest>) {
  return request.put(`/admin/edu/sysMenu/updateById/${id}`, data)
}

/** 批量删除菜单 */
export async function deleteMenu(ids: number[]) {
  return request.post('/admin/edu/sysMenu/deleteByIds', { ids })
}

/** 根据 ID 查询菜单 */
export async function getMenuById(id: number) {
  return request.get(`/admin/edu/sysMenu/getById/${id}`)
}

/** 分页查询菜单列表 */
export async function getMenuList(params?: SysMenuQuery) {
  return request.post('/admin/edu/sysMenu/find', params || {})
}

/** 无分页查询菜单列表 */
export async function getMenuListNoPagination(params?: SysMenuQuery) {
  return request.post('/admin/edu/sysMenu/find', { ...params, pagination: false })
}

// ==================== 动态路由相关 ====================

/** 获取当前用户的菜单树（用于动态路由生成） */
export async function getCurrentUserMenuTree() {
  return request.post('/admin/edu/sysMenu/findCurrentUserMenuTree')
}

/** 获取当前用户的权限码列表（返回 string[]） */
export async function getPermissionCodes() {
  return request.post('/admin/edu/sysMenu/permissionCodes')
}
