import request from '@/api/index'
import { env } from '@/app.config'

// ==================== 通知已读 ====================

/**
 * 标记通知已读
 *
 * 用户点击"标为已读"后调用，告知后端当前标签页类型的通知已读。
 * 对应后端接口：POST /admin/shop/adminInfo/notice/read
 *
 * @param type  通知类型：'1'=通知, '2'=消息, '3'=待办
 */
export async function markNoticeRead(type: string): Promise<void> {
  await request.post('/admin/shop/adminInfo/notice/read', { type })
}

// ==================== SSE 通知连接 ====================

/**
 * 通知项
 *
 * SSE 推送的单条通知数据结构，对应后端 SSE 事件中的 data JSON。
 */
export interface NoticeItem {
  type: string
  title: string
  description: string
  [key: string]: any
}

/** SSE 连接句柄 */
export interface NoticeSSE {
  disconnect: () => void
}

/**
 * 创建 SSE 通知连接
 *
 * 为什么不用 EventSource 或 axios？
 *
 *   EventSource  → 不支持自定义请求头，token 只能放 URL 上，不安全
 *   axios        → 浏览器端基于 XHR，会缓冲完整响应才返回，无法流式逐帧读取
 *
 * 因此使用 fetch + ReadableStream 手动实现 SSE：
 *   1. fetch 发起 GET，Authorization header 携带 token
 *   2. response.body.getReader() 获取可读流
 *   3. TextDecoder 逐块解码 → 拼入 buffer
 *   4. 以 \n\n 分隔 SSE 帧 → 逐帧解析 event / data 字段
 *
 * 错误处理：
 *   - 响应非 2xx / 无 body → 3 秒后重连
 *   - 流中断（done=true）→ 循环结束
 *   - AbortError（主动 disconnect）→ 静默退出，不重连
 *   - 其他网络错误 → 3 秒后重连
 *
 * @param getToken  获取认证令牌的函数，每次请求时调用，确保始终拿到最新 token
 * @param onNotice  收到通知时的回调，传入解析后的 NoticeItem
 * @returns         连接句柄 { disconnect }
 */
export function createNoticeSSE(
  getToken: () => string,
  onNotice: (item: NoticeItem) => void,
): NoticeSSE {
  /** AbortController — disconnect 时 abort 掉 fetch，避免内存泄漏 */
  let abortController: AbortController | null = null
  /** 重连定时器 */
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * 解析单个 SSE 帧
   *
   * SSE 标准帧格式（每行一个字段）：
   *   event: notice
   *   data: {"type":"1","title":"系统维护通知","description":"..."}
   *
   * 两个字段之间用 \n 分隔，帧之间用 \n\n 分隔。
   */
  function parseSSEFrame(frame: string): { event?: string; data?: string } {
    const result: { event?: string; data?: string } = {}
    for (const line of frame.split('\n')) {
      if (line.startsWith('event: ')) result.event = line.slice(7)
      else if (line.startsWith('data: ')) result.data = line.slice(6)
    }
    return result
  }

  /**
   * 断开后延迟重连
   *
   * 等待 3 秒后重试，避免网络抖动时频繁请求。
   * 重试前检查 AbortController 是否已被 abort（组件可能已卸载）。
   */
  function scheduleReconnect() {
    reconnectTimer = setTimeout(() => {
      if (abortController && !abortController.signal.aborted) {
        connect()
      }
    }, 3000)
  }

  /** 建立 SSE 连接 */
  async function connect() {
    // 每次连接前新建 AbortController（旧的已 abort 无法复用）
    abortController = new AbortController()

    try {
      const response = await fetch(`${env.apiBaseUrl}/adminInfo/notice/sse`, {
        headers: { Authorization: getToken() },
        signal: abortController.signal,
      })

      // 非 2xx 或无响应体 → 等待重连
      if (!response.ok || !response.body) {
        scheduleReconnect()
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      // 循环读取流数据，直到 done 或出错
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // 解码当前 chunk，拼入 buffer（stream: true 保留多字节字符的完整性）
        buffer += decoder.decode(value, { stream: true })

        // SSE 帧以空行分隔 → 按 \n\n 切分
        const parts = buffer.split('\n\n')
        // 最后一段可能不完整，留在 buffer 等下一次拼接
        buffer = parts.pop() || ''

        for (const part of parts) {
          const parsed = parseSSEFrame(part)
          if (parsed.event === 'notice' && parsed.data) {
            try {
              onNotice(JSON.parse(parsed.data))
            } catch {
              console.warn('[NoticeSSE] SSE 数据解析失败', parsed.data)
            }
          }
        }
      }
    } catch (err: any) {
      // AbortError = 主动断开（disconnectSSE）→ 不重连
      if (err.name !== 'AbortError') {
        scheduleReconnect()
      }
    }
  }

  /**
   * 断开 SSE 连接（组件卸载时调用）
   *
   * abort() 会触发 fetch 抛出 AbortError，connect 捕获后静默退出。
   */
  function disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    abortController?.abort()
    abortController = null
  }

  // 创建即连接
  connect()
  return { disconnect }
}
