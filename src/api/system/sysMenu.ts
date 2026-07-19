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
  id: number
  parentId: number
  name: string
  path: string
  component?: string
  redirect?: string
  routeName?: string
  perm?: string
  icon?: string
  type: MenuType
  sort?: number
  status?: number
  keepAlive?: number
  hideInMenu?: number
  hideInTab?: number
  hideInBreadcrumb?: number
  hideChildrenInMenu?: number
  hideSidebar?: number
  affixTab?: number
  params?: string
  children?: SysMenu[]
  [key: string]: any
}

/** 菜单查询参数 */
export interface SysMenuQuery {
  queryStr?: string
}

/** 菜单创建/更新请求 */
export interface SysMenuRequest {
  parentId: number
  name: string
  path: string
  component?: string
  redirect?: string
  routeName?: string
  perm?: string
  icon?: string
  type: MenuType
  sort?: number
  status?: number
  keepAlive?: number
  hideInMenu?: number
  hideInTab?: number
  hideInBreadcrumb?: number
  hideChildrenInMenu?: number
  hideSidebar?: number
  affixTab?: number
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
