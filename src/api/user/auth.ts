import type { MenuItem } from '@/router/menus'
import request from '@/api/index'
import { appConfig } from '@/app.config'

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
 * POST /admin/shop/adminInfo/login，在请求拦截器白名单中，无需预先携带 token。
 * 响应拦截器已解包 response.data，调用方直接拿到 { token: '...' }。
 */
export async function login(data: LoginRequest): Promise<LoginResult> {
  return request.post('/admin/shop/adminInfo/login', data)
}

/**
 * 退出登录
 *
 * POST /admin/shop/adminInfo/logout
 * 通知后端清除服务端会话/令牌，前端同时清除本地状态。
 */
export async function logout(): Promise<void> {
  return request.post('/admin/shop/adminInfo/logout')
}

// ==================== 用户信息 ====================

/** 登录后调用 /admin/shop/adminInfo/info 返回：menus（菜单树）、home（默认首页路径） */
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
 * 获取当前登录用户的菜单和首页信息
 *
 * 由 appConfig.login.useBackendLogin 控制：
 *   true  → 调用 POST /admin/shop/adminInfo/info 真实请求后端
 *   false → 返回空数据，走前端静态菜单（dynamicMenuList）
 *
 * 调用时机：路由守卫 → generateRoutes()（动态权限模式下）
 */
export async function fetchUserInfo(): Promise<UserInfoResult> {
  if (appConfig.login.useBackendLogin) {
    return request.post('/admin/shop/adminInfo/info')
  }
  return { menus: [], home: '/home' }
}
