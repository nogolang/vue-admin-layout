import request from '@/api/index'

/**
 * ==================== 角色管理 API ====================
 *
 * 管理角色及其权限分配（菜单权限 + 接口权限）。
 *
 * 后端端点示例：
 *   POST   /admin/edu/sysRole/findTree            — 角色树
 *   POST   /admin/edu/sysRole/add                 — 创建角色
 *   PUT    /admin/edu/sysRole/updateById/:id      — 更新角色
 *   POST   /admin/edu/sysRole/deleteByIds          — 删除角色
 *   POST   /admin/edu/sysRole/assignMenu           — 分配菜单权限
 *   POST   /admin/edu/sysRole/findAllMenuByRoleId  — 查询角色菜单权限
 *   POST   /admin/edu/sysRole/assignApi            — 分配接口权限
 *   POST   /admin/edu/sysRole/findAllApiByRoleId   — 查询角色接口权限
 */

// ==================== 类型定义 ====================

/** 角色实体 */
export interface SysRole {
  /** 角色 ID */
  id: number
  /** 角色名称 */
  name: string
  /** 父角色 ID */
  parentId?: number
  /** 排序（越小越靠前） */
  sort?: number
  /** 状态：1=启用, 2=禁用 */
  status?: number
  /** 备注 */
  remark?: string
  /** 登录后默认首页路径 */
  homePath?: string
  /** 已分配的菜单 ID 列表 */
  menuIds?: number[]
  /** 已分配的接口 ID 列表 */
  apiIds?: number[]
  /** 子角色 */
  children?: SysRole[]
  [key: string]: any
}

/** 角色查询参数 */
export interface SysRoleQuery {
  queryStr?: string
  status?: number
}

/** 角色创建/更新请求 */
export interface SysRoleRequest {
  /** 角色名称 */
  name: string
  /** 父角色 ID */
  parentId?: number
  /** 排序 */
  sort?: number
  /** 状态 */
  status?: number
  /** 备注 */
  remark?: string
}

/** 角色分配菜单请求 */
export interface SysRoleMenuRequest {
  roleId: number
  menuIds: number[]
  homePath?: string
}

/** 角色分配接口请求 */
export interface SysRoleApiRequest {
  roleId: number
  apiIds: number[]
}

/** 角色分配用户请求 */
export interface SysRoleUserRequest {
  roleId: number
  userIds: number[]
}

/** 角色移除用户请求 */
export interface SysRoleRemoveUserRequest {
  roleId: number
  userIds: number[]
}

// ==================== 角色 CRUD ====================

/** 获取角色树 */
export async function getRoleTree() {
  return request.post('/admin/edu/sysRole/findTree')
}

/** 根据 ID 查询角色 */
export async function getRoleById(id: number) {
  return request.get(`/admin/edu/sysRole/getById/${id}`)
}

/** 分页查询角色列表 */
export async function getRoleList(params?: SysRoleQuery) {
  return request.post('/admin/edu/sysRole/find', params || {})
}

/** 无分页查询角色列表 */
export async function getRoleListNoPagination(params?: SysRoleQuery) {
  return request.post('/admin/edu/sysRole/find', { ...params, pagination: false })
}

/** 创建角色 */
export async function createRole(data: SysRoleRequest) {
  return request.post('/admin/edu/sysRole/add', data)
}

/** 更新角色 */
export async function updateRole(id: number, data: Partial<SysRoleRequest>) {
  return request.put(`/admin/edu/sysRole/updateById/${id}`, data)
}

/** 批量删除角色 */
export async function deleteRole(ids: number[]) {
  return request.post('/admin/edu/sysRole/deleteByIds', { ids })
}

// ==================== 用户分配 ====================

/** 分配用户到角色 */
export async function assignUsersToRole(data: SysRoleUserRequest) {
  return request.post('/admin/edu/sysRole/assignUser', data)
}

/** 从角色中移除用户 */
export async function removeUsersFromRole(data: SysRoleRemoveUserRequest) {
  return request.post('/admin/edu/sysRole/removeUser', data)
}

// ==================== 菜单权限 ====================

/** 分配菜单权限 */
export async function assignMenuToRole(data: SysRoleMenuRequest) {
  return request.post('/admin/edu/sysRole/assignMenu', data)
}

/** 查询角色的菜单权限（返回菜单树，含 isRel 标记） */
export async function getMenusByRoleId(params: { roleId: number }) {
  return request.post('/admin/edu/sysRole/findAllMenuByRoleId', params)
}

// ==================== 接口权限 ====================

/** 分配接口权限 */
export async function assignApiToRole(data: SysRoleApiRequest) {
  return request.post('/admin/edu/sysRole/assignApi', data)
}

/** 查询角色的接口权限（返回分组列表，含 isRel 标记） */
export async function getApisByRoleId(params: { roleId: number }) {
  return request.post('/admin/edu/sysRole/findAllApiByRoleId', params)
}
