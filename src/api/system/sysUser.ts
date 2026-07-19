import type { MenuItem } from '@/router/menus'
import request from '@/api/index'

/**
 * ==================== /userInfo/info 返回值类型 ====================
 *
 * 登录后调用此接口获取当前用户的完整信息：
 *   - menus: 该用户的菜单树（用于动态路由注册 + 侧边栏渲染）
 *   - home:  该用户/角色的默认首页路径
 */
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
  // ==================== 动态权限模式（useDynamicRoutes = true） ====================
  // 替换为真实的后端请求：
  //
  // import type { ApiResponse } from '@/api/index'
  // const res = await request.get<ApiResponse<UserInfoResult>>('/userInfo/info')
  // return res.data
  //
  // 注意：request 响应拦截器已解包 response → response.data，
  //       所以这里直接拿到的是 { menus: [...], home: "..." }

  // ==================== 静态路由模式（useDynamicRoutes = false） ====================
  // 静态模式下不会调用此函数。
  // 保留此函数作为接口定义，方便后续切换为动态模式。

  return { menus: [], home: '/home' }
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
  // 替换为真实请求：
  // await request.post('/userInfo/notice/read', { type })
  // 或：
  // import type { ApiResponse } from '@/api/index'
  // await request.post<ApiResponse<null>>('/userInfo/notice/read', { type })

  await request.post('/userInfo/notice/read', { type })
}
