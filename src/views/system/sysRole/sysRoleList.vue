<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Lock } from '@element-plus/icons-vue'
import {
  getRoleTree,
  deleteRole,
  assignMenuToRole,
  getMenusByRoleId,
  assignApiToRole,
  getApisByRoleId,
} from '@/api/system/sysRole'
import type { SysRole } from '@/api/system/sysRole'
import SysRoleEdit from './sysRoleEdit.vue'

// ==================== 角色列表数据 ====================

const tableData = ref<SysRole[]>([])
const loading = ref(false)
const editRef = ref<InstanceType<typeof SysRoleEdit> | null>(null)

// ==================== 加载角色树 ====================

const findAll = async () => {
  loading.value = true
  try {
    const res: any = await getRoleTree()
    tableData.value = res?.data || []
  } finally {
    loading.value = false
  }
}

// ==================== 新增 / 编辑 / 删除 ====================

// 新增根级角色
const add = () => {
  editRef.value?.open(0)
}

// 新增下级角色
const addChild = (parentId: number) => {
  editRef.value?.open(0, parentId)
}

// 修改角色
const updateById = (row: SysRole) => {
  editRef.value?.open(row.id)
}

// 删除角色（有子级时禁止删除）
const deleteById = async (row: SysRole) => {
  if (row.children?.length) {
    ElMessage.warning('请先删除下级角色')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定删除角色 "${row.name}" 吗？`,
      '删除确认',
      { type: 'warning' },
    )
    await deleteRole([row.id])
    ElMessage.success('删除成功')
    await findAll()
  } catch {
    // 取消删除
  }
}

// 成功保存后的回调
const afterSave = () => {
  findAll()
}

// ==================== 权限分配 ====================

const permVisible = ref(false)
const permRoleId = ref(0)
const permRoleName = ref('')
const activeTab = ref('menu')

// ---- 菜单权限 ----

// 权限分配中的菜单节点（el-tree 节点结构）
interface PermMenuNode {
  id: number
  name: string
  path?: string
  isRel?: number
  children?: PermMenuNode[]
}

const menuTreeData = ref<PermMenuNode[]>([])
const menuTreeRef = ref()
const homePath = ref('')
const menuFilter = ref('')

// 从菜单树中收集所有可选路径作为默认首页选项
const menuPathOptions = computed(() => {
  const opts: { label: string; value: string }[] = []
  ;(function walk(nodes: PermMenuNode[]) {
    for (const n of nodes) {
      if (n.path) opts.push({ label: n.name, value: n.path })
      if (n.children) walk(n.children)
    }
  })(menuTreeData.value)
  return opts
})

// 根据筛选关键字过滤菜单树
const filteredMenuTree = computed(() => {
  if (!menuFilter.value) return menuTreeData.value
  const kw = menuFilter.value.toLowerCase()
  return (function filter(nodes: PermMenuNode[]): PermMenuNode[] {
    const result: PermMenuNode[] = []
    for (const n of nodes) {
      const match = (n.name || '').toLowerCase().includes(kw)
      const fc = n.children ? filter(n.children) : []
      if (match || fc.length) {
        result.push({ ...n, children: fc.length ? fc : n.children })
      }
    }
    return result
  })(menuTreeData.value)
})

// 加载角色已分配的菜单权限
const loadMenuPerm = async () => {
  try {
    const tree = await getMenusByRoleId({ roleId: permRoleId.value }) as any
    menuTreeData.value = (tree?.data || tree || []) as PermMenuNode[]

    // 收集已分配的菜单 ID
    const ids: number[] = []
    ;(function collect(nodes: PermMenuNode[]) {
      for (const n of nodes) {
        if (n.isRel === 1 && n.id) ids.push(n.id)
        if (n.children) collect(n.children)
      }
    })(menuTreeData.value)

    // 自动选第一个有路径的节点作为默认首页
    homePath.value = (function findFirst(nodes: PermMenuNode[]): string {
      for (const n of nodes) {
        if (n.path) return n.path
        if (n.children) {
          const f = findFirst(n.children)
          if (f) return f
        }
      }
      return ''
    })(menuTreeData.value)

    await nextTick()
    menuTreeRef.value?.setCheckedKeys(ids)
  } catch {
    // 忽略加载错误
  }
}

// ---- 接口权限 ----

// 权限分配中的接口项
interface PermApiItem {
  id: number
  method?: string
  name?: string
  path?: string
  description?: string
  isRel?: number
}

// 权限分配中的接口分组
interface PermApiGroup {
  id: number
  name: string
  items: PermApiItem[]
}

const apiGroupData = ref<PermApiGroup[]>([])
const checkedApiIds = ref<number[]>([])
const apiFilter = ref('')

const methodTagMap: Record<string, string> = {
  GET: 'success',
  POST: '',
  PUT: 'warning',
  DELETE: 'danger',
}

// 根据筛选关键字过滤接口分组
const filteredApiGroups = computed(() => {
  const kw = apiFilter.value.toLowerCase()
  if (!kw) return apiGroupData.value
  return apiGroupData.value
    .map((g) => {
      const children = (g.items || []).filter(
        (api) =>
          (api.name || '').toLowerCase().includes(kw) ||
          (api.path || '').toLowerCase().includes(kw) ||
          (api.method || '').toLowerCase().includes(kw),
      )
      return children.length ? { ...g, items: children } : null
    })
    .filter((g): g is PermApiGroup => g !== null)
})

// 判断分组是否全选
const isGroupAllChecked = (group: PermApiGroup) => {
  return (
    group.items?.length &&
    group.items.every((api) => checkedApiIds.value.includes(api.id))
  )
}

// 判断分组是否半选
const isGroupIndeterminate = (group: PermApiGroup) => {
  const checked = (group.items || []).filter((api) =>
    checkedApiIds.value.includes(api.id),
  ).length
  return checked > 0 && checked < group.items.length
}

// 切换分组全选 / 取消
const toggleGroupCheck = (group: PermApiGroup, val: boolean) => {
  const ids = (group.items || []).map((api) => api.id)
  if (val) {
    checkedApiIds.value = [...new Set([...checkedApiIds.value, ...ids])]
  } else {
    checkedApiIds.value = checkedApiIds.value.filter(
      (id) => !ids.includes(id),
    )
  }
}

// 加载角色已分配的接口权限
const loadApiPerm = async () => {
  try {
    const groups = await getApisByRoleId({ roleId: permRoleId.value }) as any
    const data = (groups?.data || groups || []) as PermApiGroup[]
    apiGroupData.value = data
    checkedApiIds.value = data.flatMap((g) =>
      (g.items || [])
        .filter((api) => api.isRel === 1)
        .map((api) => api.id),
    )
  } catch {
    // 忽略加载错误
  }
}

// 切换 tab 时懒加载权限数据
watch(activeTab, (tab) => {
  if (tab === 'menu') loadMenuPerm()
  else loadApiPerm()
})

// 打开权限分配抽屉
const openPermission = (row: SysRole) => {
  permRoleId.value = row.id
  permRoleName.value = row.name
  menuFilter.value = ''
  apiFilter.value = ''
  menuTreeData.value = []
  apiGroupData.value = []
  permVisible.value = true
  activeTab.value = 'menu'
  loadMenuPerm()
}

// 保存菜单权限
// getHalfCheckedKeys：父节点有部分子节点被选中时，父节点处于半选状态
// 半选节点一并提交，确保后端拿到完整祖先链以正确还原树结构
const saveMenuPerm = async () => {
  const keys = menuTreeRef.value
    ? [
        ...menuTreeRef.value.getCheckedKeys(),
        ...menuTreeRef.value.getHalfCheckedKeys(),
      ]
    : []
  await assignMenuToRole({
    roleId: permRoleId.value,
    menuIds: keys,
    homePath: homePath.value || undefined,
  })
  ElMessage.success('菜单权限设置成功')
}

// 保存接口权限
const saveApiPerm = async () => {
  await assignApiToRole({
    roleId: permRoleId.value,
    apiIds: checkedApiIds.value,
  })
  ElMessage.success('接口权限设置成功')
}

// 保存权限（根据当前 tab 调用对应保存方法）
const onSavePerm = async () => {
  try {
    if (activeTab.value === 'menu') {
      await saveMenuPerm()
    } else {
      await saveApiPerm()
    }
  } catch {
    // 错误已在拦截器处理
  }
}

onMounted(() => {
  findAll()
})
</script>

<template>
  <div class="sys-page">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="add">新建角色</el-button>
    </div>

    <!-- 角色树表格 -->
    <el-table
      v-loading="loading"
      :data="tableData"
      row-key="id"
      :tree-props="{ children: 'children' }"
      default-expand-all
      border
      stripe
    >
      <el-table-column label="角色名称" min-width="200">
        <template #default="{ row }">
          <span style="font-weight: 500">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="排序" width="80" align="center" prop="sort">
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="备注" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.remark || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="340" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" :icon="Plus" @click="addChild(row.id)">新增下级</el-button>
          <el-button type="warning" link size="small" :icon="Lock" @click="openPermission(row)">设置权限</el-button>
          <el-button type="primary" link size="small" :icon="Edit" @click="updateById(row)">编辑</el-button>
          <el-button type="danger" link size="small" :icon="Delete" :disabled="!!(row.children?.length)" @click="deleteById(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 角色表单编辑弹窗（子组件） -->
    <SysRoleEdit ref="editRef" @afterSave="afterSave" />

    <!-- 权限分配抽屉 -->
    <el-drawer v-model="permVisible" :title="`设置权限 — ${permRoleName}`" size="600px">
      <el-tabs v-model="activeTab">
        <!-- 菜单权限 tab -->
        <el-tab-pane label="菜单权限" name="menu">
          <!-- 默认首页选择 -->
          <div class="perm-section">
            <span class="perm-label">默认首页</span>
            <el-select v-model="homePath" placeholder="请选择默认首页" style="width: 260px">
              <el-option v-for="opt in menuPathOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
            <div class="perm-hint">成员登录该角色后默认进入的页面</div>
          </div>

          <!-- 菜单筛选 -->
          <el-input v-model="menuFilter" placeholder="筛选菜单名称" clearable style="margin-bottom: 12px" />

          <!-- 菜单树 -->
          <div class="perm-tree-box">
            <el-tree
              v-if="filteredMenuTree.length"
              ref="menuTreeRef"
              :data="filteredMenuTree"
              node-key="id"
              show-checkbox
              default-expand-all
              :props="{ label: 'name', children: 'children' }"
            />
            <el-empty v-else description="暂无菜单数据" />
          </div>
        </el-tab-pane>

        <!-- 接口权限 tab -->
        <el-tab-pane label="接口权限" name="api">
          <!-- 接口筛选 -->
          <el-input v-model="apiFilter" placeholder="搜索接口名称、路径或方法" clearable style="margin-bottom: 12px" />

          <!-- 接口分组列表 -->
          <div class="perm-tree-box">
            <template v-if="filteredApiGroups.length">
              <div v-for="group in filteredApiGroups" :key="group.id" class="api-group-card">
                <!-- 分组头（含全选复选框） -->
                <div class="api-group-header">
                  <el-checkbox
                    :model-value="isGroupAllChecked(group)"
                    :indeterminate="isGroupIndeterminate(group)"
                    @change="(val: boolean) => toggleGroupCheck(group, val)"
                  />
                  <span class="api-group-name">{{ group.name }}</span>
                  <el-tag size="small" round>{{ group.items.length }}</el-tag>
                </div>

                <!-- 分组下的接口列表 -->
                <div class="api-list">
                  <div v-for="api in group.items" :key="api.id" class="api-row">
                    <el-checkbox
                      :model-value="checkedApiIds.includes(api.id)"
                      @change="(val: boolean) => {
                        if (val) { if (!checkedApiIds.includes(api.id)) checkedApiIds.push(api.id) }
                        else { checkedApiIds = checkedApiIds.filter((id: number) => id !== api.id) }
                      }"
                    />
                    <el-tag v-if="api.method" size="small" :type="methodTagMap[api.method] || 'info'">{{ api.method }}</el-tag>
                    <span class="api-item-text">{{ api.description || api.name || api.path }}</span>
                  </div>
                </div>
              </div>
            </template>
            <el-empty v-else description="暂无接口数据" />
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- 权限保存按钮 -->
      <div class="perm-footer">
        <el-button type="primary" @click="onSavePerm">保存权限</el-button>
        <el-button @click="permVisible = false">关闭</el-button>
      </div>
    </el-drawer>
  </div>
</template>

<style lang="scss" scoped>
/* 权限分配 section */
.perm-section {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.perm-label {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  display: block;
  margin-bottom: 6px;
}

.perm-hint {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}

/* 权限树容器 */
.perm-tree-box {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 8px;
  max-height: 420px;
  overflow: auto;
}

/* 权限抽屉底部按钮 */
.perm-footer {
  margin-top: 16px;
  text-align: right;
}

/* 接口分组卡片 */
.api-group-card {
  margin-bottom: 8px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafafa;
}

/* 接口分组头部 */
.api-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid #ebeef5;
}

.api-group-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

/* 接口列表 */
.api-list {
  padding: 4px 12px;
}

/* 单个接口行 */
.api-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
}

/* 接口文本 */
.api-item-text {
  font-size: 13px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
</style>
