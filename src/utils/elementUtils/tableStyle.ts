/**
 * Element Plus 表格样式 —— 参考 Vben Admin 设计令牌
 * 颜色统一走 CSS 变量，与 main.css 主题保持一致
 */

/** 表格表头单元格样式 */
export const SetTableHeaderCellStyle = (_data?: unknown): Record<string, string> => {
  return {
    background: 'var(--table-header-bg)',
    'text-align': 'center',
    color: 'var(--table-header-text)',
    'font-weight': '600',
    'font-size': 'var(--font-size-sm)',
    'border-bottom': '1px solid var(--table-border)',
  }
}

/** 表格表体单元格样式 */
export const SetTableBodyCellStyle = (_data?: unknown): Record<string, string> => {
  return {
    'text-align': 'center',
    color: 'var(--table-body-text)',
    'font-size': 'var(--font-size-sm)',
  }
}
