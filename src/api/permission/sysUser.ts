import request from '@/api/index'

// ==================== 用户管理 CRUD ====================

/** 用户实体 */
export interface SysUser {
  /** 用户 ID */
  id: number
  /** 用户名（登录账号） */
  username: string
  /** 昵称 */
  nickName?: string
  /** 邮箱 */
  email?: string
  /** 手机号 */
  phone?: string
  /** 头像 URL */
  avatar?: string
  /** 性别：1=男, 2=女 */
  gender?: number
  /** 所属部门 ID */
  deptId?: number
  /** 状态：1=启用, 2=禁用 */
  status?: number
  /** 个人简介 */
  introduction?: string
  /** 所属角色列表 */
  roles?: { id: number; name: string }[]
  [key: string]: any
}

/** 用户查询参数 */
export interface SysUserQuery {
  /** 绑定类型 */
  bindType?: number
  /** 部门 ID 筛选 */
  deptId?: number
  /** 搜索关键字（模糊匹配用户名） */
  queryStr?: string
  /** 角色 ID 筛选 */
  roleId?: number
  /** 状态筛选：1=启用, 2=禁用 */
  status?: number
  /** 页码 */
  page?: number
  /** 每页条数 */
  pageSize?: number
}

/** 用户创建请求 */
export interface SysUserRequest {
  /** 用户名 */
  username: string
  /** 密码 */
  password: string
  /** 邮箱 */
  email?: string
  /** 手机号 */
  phone?: string
  /** 昵称 */
  nickName?: string
  /** 部门 ID */
  deptId?: number
  /** 头像 URL */
  avatar?: string
  /** 性别 */
  gender?: number
  /** 状态 */
  status?: number
  /** 个人简介 */
  introduction?: string
}

/** 用户更新请求 */
export interface SysUserUpdate {
  /** 邮箱 */
  email?: string
  /** 手机号 */
  phone?: string
  /** 昵称 */
  nickName?: string
  /** 部门 ID */
  deptId?: number
  /** 头像 URL */
  avatar?: string
  /** 性别 */
  gender?: number
  /** 状态 */
  status?: number
  /** 个人简介 */
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
