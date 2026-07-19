/**
 * ==================== 通用 HTTP 请求封装（axios 实例） ====================
 *
 * 基于 axios 封装的 HTTP 客户端，提供以下能力：
 *   1. 统一的请求/响应拦截器
 *   2. 自动注入认证 Token
 *   3. 统一错误处理（401 跳登录、网络异常提示等）
 *   4. 请求加载进度条（NProgress）
 *   5. 响应数据自动解包（直接返回 response.data）
 *   6. 完整的 TypeScript 类型支持
 *
 * 设计参考：
 *   仿照 xianyu-admin-ui 的 axios 架构，升级为 TypeScript 版本。
 *
 * ==================== 快速使用 ====================
 *
 * 在 API 模块中导入 request 实例：
 *   import request from '@/api/index'
 *
 *   // GET 请求
 *   const data = await request.get('/user/v1/list')
 *
 *   // POST 请求
 *   const result = await request.post('/user/v1/add', { name: 'test' })
 *
 *   // 带泛型的请求（获得类型提示）
 *   const res = await request.get<UserInfo[]>('/user/v1/list')
 *
 * ==================== 响应数据格式约定 ====================
 *
 * 默认后端返回格式：
 *   {
 *     code: "OK",         // 业务状态码
 *     message: "成功",    // 提示信息
 *     data: { ... }      // 实际数据
 *   }
 *
 * 响应拦截器会自动解包，调用方直接拿到 response.data（axios response → data 字段）
 */

import axios from 'axios'
import { ElMessage } from 'element-plus'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useUserStore } from '@/stores/user'
import { env } from '@/app.config'
import router from '@/router'

// ==================== Axios 实例创建 ====================

/**
 * 创建独立的 axios 实例
 *
 * 不直接使用全局 axios，而是创建一个实例，原因是：
 *   1. 可以为不同业务场景创建多个实例（如文件上传用不同 timeout）
 *   2. 避免与第三方库的全局 axios 配置冲突
 *   3. 更清晰的隔离和类型推导
 */
const request = axios.create({
  /**
   * 基础 URL —— 所有请求的相对路径都会拼接在此 URL 之后
   *
   * 来源：app.config.ts 中的 env.apiBaseUrl，内部读取 VITE_API_BASE_URL 环境变量。
   * 开发环境示例：http://localhost:8081
   * 生产环境示例：https://api.example.com
   *
   * 如果使用 Vite 代理（vite.config.ts → server.proxy），
   * 此处应设为空字符串 '' 或 '/api'，让代理转发请求避免跨域。
   */
  baseURL: env.apiBaseUrl,

  /**
   * 请求超时时间（毫秒）
   * 20秒：根据 xianyu-admin-ui 的设定，兼顾网络波动和后端处理时间
   */
  timeout: 20000,
})

// ==================== 请求拦截器 ====================

/**
 * 请求拦截 —— 在请求发出前统一处理
 *
 * 执行顺序：
 *   1. NProgress 进度条开始
 *   2. 检查是否为白名单路径（登录/注册等不需要 token）
 *   3. 检查是否为 OSS 上传请求
 *   4. 自动注入 Authorization 令牌
 *   5. 发送请求
 */
request.interceptors.request.use(
  (config) => {
    // 1. 启动加载进度条
    NProgress.start()

    // 2. 白名单路径检查 —— 登录和注册接口不需要 token
    const passUrl = ['/userInfo/login', '/userInfo/register']
    if (config.url && passUrl.includes(config.url)) {
      return config
    }

    // 3. OSS 上传请求检查 —— 阿里云 OSS 等对象存储使用自身鉴权机制
    //    通过在请求头中设置 type: 'oss' 跳过 token 注入
    if (config.headers?.type === 'oss') {
      return config
    }

    // 4. 自动注入认证令牌（从 userStore 中读取）
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = token
    }

    return config
  },
  (error) => {
    // 请求配置错误（极少发生）
    NProgress.done()
    return Promise.reject(error)
  },
)

// ==================== 响应拦截器 ====================

/**
 * 响应拦截 —— 统一处理响应数据和错误
 *
 * 成功处理：
 *   - 停止 NProgress
 *   - 自动解包 response.data（调用方直接拿到业务数据）
 *
 * 错误处理：
 *   - 业务 code ≠ "OK" → 弹窗提示 message，reject
 *   - 网络异常/超时 → 弹窗提示
 *   - HTTP 401 → 清除 token，跳转登录页
 *   - HTTP 404 → 弹窗提示"接口不存在"
 *   - 其他错误（400/403/500） → 弹窗显示后端返回的错误信息
 */
request.interceptors.response.use(
  // ==================== 成功响应 ====================
  (response) => {
    NProgress.done()

    // 非 200 的 2xx 状态码（理论上不会发生，但做兜底）
    if (response.status !== 200) {
      return Promise.reject(response)
    }

    const body = response.data as ApiResponse

    // 业务状态码 "OK" 表示成功 → 解包返回 response.data
    if (body.code === 'OK') {
      return response.data
    }

    // 业务状态码非 "OK" → 弹窗提示错误信息并 reject
    ElMessage.error(body.message || '请求失败')
    return Promise.reject(response.data)
  },

  // ==================== 错误响应 ====================
  (error) => {
    NProgress.done()

    // ---- 情况 1：网络异常 / 超时 ----
    // 特征：error.response 不存在（请求根本没到达服务器）
    if (!Object.prototype.hasOwnProperty.call(error, 'response')) {
      ElMessage.error(error.message || '网络连接异常，请检查网络')
      return Promise.reject(error)
    }

    // ---- 情况 2：HTTP 401 —— 认证失败 / Token 过期 ----
    if (error.response.status === 401) {
      console.warn('[API] 401 认证失败', error)

      // 清除本地 token → 跳转登录页
      const userStore = useUserStore()
      userStore.clearToken()

      ElMessage.error(error.response.data?.message || '登录已过期，请重新登录')

      // 跳转到登录页（使用 replace 避免返回键回到需要鉴权的页面）
      router.push({ path: '/login', replace: true })
      return Promise.reject(error)
    }

    // ---- 情况 3：HTTP 404 —— 接口不存在 ----
    if (error.response.status === 404) {
      ElMessage.error(error.response.data?.message || '请求的接口不存在')
      return Promise.reject(error)
    }

    // ---- 情况 4：其他错误（400/403/500 等） ----
    // 优先显示后端返回的 message，兜底显示通用提示
    ElMessage.error(
      error.response.data?.message ||
      error.response.statusText ||
      '未知错误，请稍后重试',
    )
    return Promise.reject(error)
  },
)

// ==================== 辅助函数 ====================

/**
 * 获取当前用户的认证 Token
 *
 * 从 Pinia userStore 中读取 token（内存中的 ref 值）。
 * 注意：token 存储在内存中，刷新页面后会丢失（除非配置持久化插件）。
 *
 * @returns  token 字符串，未登录时返回空字符串
 */
function getAuthToken(): string {
  const userStore = useUserStore()
  return userStore.getToken()
}

// ==================== 导出 ====================

/**
 * 导出租户的 axios 实例
 *
 * 所有 API 模块都应 import 此实例，而不是直接用 axios：
 *   import request from '@/api/index'
 *
 * 类型说明：
 *   request.get<T>(url)     → 返回 Promise<T>（自动解包后的数据类型）
 *   request.post<T>(url, d) → 返回 Promise<T>
 */
export default request

// ==================== 扩展类型定义 ====================

/**
 * 通用后端响应包装类型
 *
 * 适用于标准后端返回格式 { code, message, data } 的场景。
 * 如果你需要访问 code 或 message，可以在 API 调用时不依赖自动解包，
 * 或者扩展响应拦截器，让它在返回前保留更多字段。
 *
 * 使用示例：
 *   import type { ApiResponse } from '@/api/index'
 *   const res = await request.get<ApiResponse<User[]>>('/user/list')
 */
export interface ApiResponse<T = unknown> {
  /** 业务状态码（"OK" 表示成功） */
  code: string
  /** 提示信息 */
  message: string
  /** 实际数据 */
  data: T
}
