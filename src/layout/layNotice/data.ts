/**
 * ==================== 通知/消息 数据模型 ====================
 *
 * 定义了通知中心三个标签页的数据结构：
 *   1. 通知（Notify）  —— 系统级通知
 *   2. 消息（Message） —— 用户互动消息（评论、回复等）
 *   3. 待办（Todo）    —— 待处理的任务
 *
 * 数据来源：SSE 实时推送（/userInfo/notice/sse）
 */

// ==================== 类型定义 ====================

/** 通知类型（对应后端 SSE 推送的分类） */
export type NoticeType = '1' | '2' | '3'

/** 单条通知/消息/待办项 */
export interface ListItem {
  /** 头像 URL（可选） */
  avatar?: string
  /** 标题 */
  title: string
  /** 时间文本 */
  datetime?: string
  /** 类型：1=通知, 2=消息, 3=待办 */
  type: NoticeType
  /** 描述文本 */
  description?: string
  /** 状态标签颜色（Element Plus tag type） */
  status?: 'primary' | 'success' | 'warning' | 'info' | 'danger'
  /** 附加标签文本（如"马上到期"、"进行中"） */
  extra?: string
}

/** 单个标签页的数据结构 */
export interface TabItem {
  /** 标签 key（唯一标识） */
  key: NoticeType
  /** 标签名称 */
  name: string
  /** 该标签下的数据列表 */
  list: ListItem[]
  /** 空数据时的提示文本 */
  emptyText: string
}

// ==================== 标签页初始化模板 ====================

/** 创建三个标签页的初始空状态 */
export function createEmptyTabs(): TabItem[] {
  return [
    { key: '1', name: '通知', list: [], emptyText: '暂无通知' },
    { key: '2', name: '消息', list: [], emptyText: '暂无消息' },
    { key: '3', name: '待办', list: [], emptyText: '暂无待办' },
  ]
}
