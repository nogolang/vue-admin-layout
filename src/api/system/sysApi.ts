import request from '@/api/index'

/**
 * ==================== 接口管理 API ====================
 *
 * 管理后台所有 API 接口及其分组。
 * 接口按分组（SysApiGroup）组织，每个分组下包含若干接口（SysApi）。
 *
 * 后端端点示例：
 *   GET    /admin/edu/sysApiGroup/findAll          — 分组列表（含子接口）
 *   POST   /admin/edu/sysApiGroup/add              — 创建分组
 *   PUT    /admin/edu/sysApiGroup/updateById/:id   — 更新分组
 *   POST   /admin/edu/sysApiGroup/deleteByIds      — 删除分组
 *   POST   /admin/edu/sysApi/add                   — 创建接口
 *   PUT    /admin/edu/sysApi/updateById/:id        — 更新接口
 *   POST   /admin/edu/sysApi/deleteByIds           — 删除接口
 */

// ==================== 类型定义 ====================

/** API 接口实体 */
export interface SysApi {
  /** 接口 ID */
  id: number
  /** 请求路径（如 /user/v1/list） */
  path: string
  /** 请求方法（GET/POST/PUT/DELETE） */
  method: string
  /** 接口描述 */
  description?: string
  /** 所属分组 ID */
  groupId?: number
  [key: string]: any
}

/** API 接口创建/更新请求 */
export interface SysApiRequest {
  /** 请求路径 */
  path: string
  /** 请求方法 */
  method: string
  /** 接口描述 */
  description?: string
  /** 所属分组 ID */
  groupId?: number
}

/** API 分组实体（含子接口） */
export interface SysApiGroup {
  /** 分组 ID */
  id: number
  /** 分组名称 */
  name: string
  /** 分组描述 */
  description?: string
  /** 排序 */
  sort?: number
  /** 分组下的接口列表 */
  apis?: SysApi[]
  [key: string]: any
}

/** API 分组创建/更新请求 */
export interface SysApiGroupRequest {
  /** 分组名称 */
  name: string
  /** 分组描述 */
  description?: string
  /** 排序 */
  sort?: number
}

// ==================== API 接口 CRUD ====================

/** 获取接口列表（分页） */
export async function getApiList(params?: Record<string, any>) {
  return request.post('/admin/edu/sysApi/findAll', params || {})
}

/** 创建接口 */
export async function createApi(data: SysApiRequest) {
  return request.post('/admin/edu/sysApi/add', data)
}

/** 更新接口 */
export async function updateApi(id: number, data: Partial<SysApiRequest>) {
  return request.put(`/admin/edu/sysApi/updateById/${id}`, data)
}

/** 批量删除接口 */
export async function deleteApi(ids: number[]) {
  return request.post('/admin/edu/sysApi/deleteByIds', { ids })
}

// ==================== API 分组 CRUD ====================

/** 获取分组列表（分页，含子接口） */
export async function getApiGroupList(params?: Record<string, any>) {
  return request.post('/admin/edu/sysApiGroup/findAll', params || {})
}

/** 创建分组 */
export async function createApiGroup(data: SysApiGroupRequest) {
  return request.post('/admin/edu/sysApiGroup/add', data)
}

/** 更新分组 */
export async function updateApiGroup(id: number, data: Partial<SysApiGroupRequest>) {
  return request.put(`/admin/edu/sysApiGroup/updateById/${id}`, data)
}

/** 批量删除分组 */
export async function deleteApiGroup(ids: number[]) {
  return request.post('/admin/edu/sysApiGroup/deleteByIds', { ids })
}
