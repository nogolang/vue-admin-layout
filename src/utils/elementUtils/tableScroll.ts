import type { Directive, DirectiveBinding } from 'vue'

/**
 * 表格横向滚动指令
 *
 * 用途：当 el-table 列数过多超出容器宽度时，鼠标滚轮（上下滚动）自动转为横向滚动。
 *
 * 使用方式：
 *   <el-table v-table-scroll :data="tableData"> ... </el-table>
 *
 * 原理：
 *   1. 找到 el-table 内部的横向滚动容器（.el-scrollbar__wrap）
 *   2. 监听 wheel 事件，当表格有横向溢出时，将纵向滚动量（deltaY）转为横向滚动（scrollLeft）
 *   3. 当表格没有横向溢出时，保持原生纵向滚动
 */

/** 绑定横向滚动逻辑 */
function bindScroll(el: HTMLElement) {
  // el-table 内部使用 el-scrollbar 做滚动，滚动容器是 .el-scrollbar__wrap
  const wrap = el.querySelector('.el-scrollbar__wrap') as HTMLElement | null
  if (!wrap) return

  const handler = (e: WheelEvent) => {
    // 判断是否有横向溢出
    const hasHorizontalOverflow = wrap.scrollWidth > wrap.clientWidth
    if (!hasHorizontalOverflow) return

    // 阻止默认纵向滚动，改为横向滚动
    e.preventDefault()
    wrap.scrollLeft += e.deltaY
  }

  // 保存引用，方便 unmounted 时移除
  ;(el as any).__tableScrollHandler = handler
  // passive: false 才能调用 preventDefault
  wrap.addEventListener('wheel', handler, { passive: false })
}

/** 解绑横向滚动逻辑 */
function unbindScroll(el: HTMLElement) {
  const wrap = el.querySelector('.el-scrollbar__wrap') as HTMLElement | null
  const handler = (el as any).__tableScrollHandler
  if (wrap && handler) {
    wrap.removeEventListener('wheel', handler)
    delete (el as any).__tableScrollHandler
  }
}

/**
 * 表格横向滚动指令
 *
 * 使用：在 el-table 上添加 v-table-scroll 即可
 * 效果：鼠标滚轮上下滚动时，如果表格有横向溢出，则转为横向滚动
 */
export const vTableScroll: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    // 需要等 el-table 渲染完成后再绑定，使用 nextTick
    // 但 mounted 时 el-table 的 DOM 通常已经就绪，直接绑定即可
    // 如果表格数据是异步加载的，可能需要用 updated 钩子
    bindScroll(el)
  },
  updated(el: HTMLElement) {
    // 数据更新后重新绑定（表格可能重新渲染）
    unbindScroll(el)
    bindScroll(el)
  },
  unmounted(el: HTMLElement) {
    unbindScroll(el)
  },
}

export default vTableScroll
