// ==================== 通用 localStorage 持久化工具 ====================
// 新增数据自动写入本地，刷新后依然可见，适用于开发调试场景
//
// 使用方式：
//   const store = useLocalStore<SysUser>('sysUser')
//   store.add({ ...formData, id: 0 })  // 新增（自动分配负 ID）
//   store.load()                        // 读取所有本地记录

export function useLocalStore<T extends { id: number }>(key: string) {
  /** 读取所有本地记录 */
  const load = (): T[] => {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]')
    } catch {
      return []
    }
  }

  /** 新增一条记录，自动分配负 ID 避免与服务端 ID 冲突 */
  const add = (item: T) => {
    const items = load()
    const ids = items.map((i) => i.id)
    const nextId = ids.length ? Math.min(...ids, 0) - 1 : -1
    items.push({ ...item, id: nextId })
    localStorage.setItem(key, JSON.stringify(items))
  }

  return { load, add }
}
