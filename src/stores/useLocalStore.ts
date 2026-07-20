// ==================== 通用 localStorage 持久化工具 ====================
// 表单草稿自动写入本地，刷新后依然可见，适用于开发调试场景
//
// 草稿流程：
//   - 取消/关闭弹框时 → store.save(form) 保存草稿
//   - 新增成功后 → store.remove() 删除草稿
//   - 打开弹框时 → id > 0 从接口加载，id <= 0 从草稿加载
//
// 使用方式：
//   const store = useLocalStore<SysUser>('sysUser')
//   store.save(formData)  // 保存草稿
//   store.load()           // 读取草稿，无草稿返回 null
//   store.remove()         // 删除草稿

export function useLocalStore<T>(key: string) {
  /** 读取草稿，无草稿返回 null */
  const load = (): T | null => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  /** 保存草稿（覆盖写入） */
  const save = (item: T) => {
    localStorage.setItem(key, JSON.stringify(item))
  }

  /** 删除草稿 */
  const remove = () => {
    localStorage.removeItem(key)
  }

  return { load, save, remove }
}
