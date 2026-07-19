import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * ==================== 用户状态管理 ====================
 *
 * 管理用户登录状态和认证令牌。
 *
 * 核心职责：
 *   1. 存储/读取 token（用于 API 请求认证）
 *   2. 存储用户基本信息
 *   3. 提供登录/退出方法
 *
 * token 通过 watch 自动持久化到 localStorage，刷新不丢失。
 *
 * 使用示例：
 *   const userStore = useUserStore()
 *   userStore.setToken('xxx')     // 登录时设置 token
 *   userStore.getToken()          // 获取 token（axios 拦截器中使用）
 *   userStore.clearToken()        // 退出登录时清除
 */
export const useUserStore = defineStore('user', () => {
  /** 认证令牌（由 pinia-plugin-persistedstate 持久化到 localStorage） */
  const token = ref<string>('')

  /** 当前登录用户信息（可根据项目需求扩展字段） */
  const userInfo = ref<{
    id?: number
    username?: string
    nickname?: string
    avatar?: string
  }>({})

  // ==================== Token 操作 ====================

  /**
   * 设置认证令牌
   *
   * @param t  token 字符串（通常来自登录接口返回值）
   */
  function setToken(t: string) {
    token.value = t
  }

  /**
   * 获取当前认证令牌
   *
   * 用于 axios 请求拦截器，自动注入请求头。
   *
   * @returns  token 字符串，未登录时返回空字符串
   */
  function getToken(): string {
    return token.value
  }

  /** 清除认证令牌（退出登录时调用） */
  function clearToken() {
    token.value = ''
  }

  // ==================== 用户信息操作 ====================

  /**
   * 设置用户信息
   *
   * @param info  用户信息对象
   */
  function setUserInfo(info: typeof userInfo.value) {
    userInfo.value = info
  }

  /** 清除用户信息 */
  function clearUserInfo() {
    userInfo.value = {}
  }

  /**
   * 退出登录 —— 清除所有用户状态
   *
   * 同时清除 permission store 中的动态路由。
   *
   * 使用示例：
   *   function logout() {
   *     userStore.clearUserState()
   *     router.push('/login')
   *   }
   */
  async function clearUserState() {
    // 先清除动态路由（需要 import permission store）
    const { usePermissionStore } = await import('./permission')
    usePermissionStore().resetRoutes()

    clearToken()
    clearUserInfo()
  }

  return {
    token,
    userInfo,
    setToken,
    getToken,
    clearToken,
    setUserInfo,
    clearUserInfo,
    clearUserState,
  }
}, {
  persist: {
    key: 'admin-user',
    pick: ['token'],
  },
})
