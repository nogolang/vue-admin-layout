import type { MenuItem } from '@/router/menus'
import request from '@/api/index'

// ==================== 登录 API ====================

/** 登录请求参数 */
export interface LoginRequest {
  username: string
  password: string
}

/** 登录响应数据 */
export interface LoginResult {
  token: string
}

/**
 * 登录
 *
 * POST /userInfo/login，在请求拦截器白名单中，无需预先携带 token。
 * 响应拦截器已解包 response.data，调用方直接拿到 { token: '...' }。
 */
export async function login(data: LoginRequest): Promise<LoginResult> {
  return request.post('/userInfo/login', data)
}

// ==================== 用户信息 ====================

/** 登录后调用 /userInfo/info 返回：menus（菜单树）、home（默认首页路径） */
export interface UserInfoResult {
  /** 菜单树 */
  menus: MenuItem[]
  /**
   * 当前角色的首页路径
   *
   * 后端根据角色返回不同的首页，如管理员 → '/dashboard'，普通用户 → '/home'。
   * generateRoutes() 会自动用此值更新 appConfig.app.homePath。
   */
  home: string
}

/**
 * ==================== 用户信息 API ====================
 *
 * 获取当前登录用户的菜单和首页信息。
 * 对应后端接口：GET /userInfo/info
 *
 * 调用时机：路由守卫 → generateRoutes()（动态权限模式下）
 *
 * 接入后端步骤：
 *   1. 取消下方注释，使用 request.get() 发送真实 HTTP 请求
 *   2. 后端返回格式：{ code: "OK", message: "成功", data: { menus: [...], home: "/dashboard" } }
 *
 * 静态路由模式下（useDynamicRoutes = false）不会调用此函数，
 * 直接使用 menus.ts 中的 dynamicMenuList 数组。
 */
export async function fetchUserInfo(): Promise<UserInfoResult> {
  return { menus: [], home: '/home' }
}

// ==================== 用户管理 CRUD ====================

/** 用户实体 */
export interface SysUser {
  id: number
  username: string
  nickName?: string
  email?: string
  phone?: string
  avatar?: string
  gender?: number
  deptId?: number
  status?: number
  introduction?: string
  roles?: { id: number; name: string }[]
  [key: string]: any
}

/** 用户查询参数 */
export interface SysUserQuery {
  bindType?: number
  deptId?: number
  queryStr?: string
  roleId?: number
  status?: number
  page?: number
  pageSize?: number
}

/** 用户创建请求 */
export interface SysUserRequest {
  username: string
  password: string
  email?: string
  phone?: string
  nickName?: string
  deptId?: number
  avatar?: string
  gender?: number
  status?: number
  introduction?: string
}

/** 用户更新请求 */
export interface SysUserUpdate {
  email?: string
  phone?: string
  nickName?: string
  deptId?: number
  avatar?: string
  gender?: number
  status?: number
  introduction?: string
}

/** 重置密码请求 */
export interface ResetPasswordRequest {
  userId: number
  newPassword: string
}

/** 创建用户 */
export async function createUser(data: SysUserRequest) {
  return request.post('/admin/edu/sysUser/add', data)
}

/** 更新用户 */
export async function updateUser(id: number, data: SysUserUpdate) {
  return request.put(`/admin/edu/sysUser/updateById/${id}`, data)
}

/** 批量删除用户 */
export async function deleteUser(ids: number[]) {
  return request.post('/admin/edu/sysUser/deleteByIds', { ids })
}

/** 根据 ID 查询用户 */
export async function getUserById(id: number) {
  return request.get(`/admin/edu/sysUser/getById/${id}`)
}

/** 分页查询用户列表 */
export async function getUserList(params?: SysUserQuery) {
  return request.post('/admin/edu/sysUser/find', params || {})
}

/** 无分页查询用户列表（用于下拉选择等场景） */
export async function getUserListNoPagination(params?: Partial<SysUserQuery>) {
  return request.post('/admin/edu/sysUser/find', { ...params, pagination: false })
}

/** 重置用户密码 */
export async function resetPassword(data: ResetPasswordRequest) {
  return request.put('/admin/edu/sysUser/resetPassword', data)
}

// ==================== 通知 API ====================

/**
 * 标记通知已读
 *
 * 用户点击"标为已读"后调用，告知后端当前标签页类型的通知已读。
 * 对应后端接口：POST /userInfo/notice/read
 *
 * @param type  通知类型：'1'=通知, '2'=消息, '3'=待办
 */
export async function markNoticeRead(type: string): Promise<void> {
  await request.post('/userInfo/notice/read', { type })
}
