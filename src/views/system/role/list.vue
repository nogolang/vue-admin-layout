<!--
  ==================== 角色管理 & 权限配置 ====================

  展示角色树形表格，支持新建/编辑/删除角色、设置权限。
  权限配置包含两个标签页：
    1. 菜单权限 — el-tree 勾选 + 默认首页下拉
    2. 接口权限 — 分组复选框列表 + 搜索筛选
-->
<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Lock } from '@element-plus/icons-vue'
import {
  getRoleTree,
  createRole,
  updateRole,
  deleteRole,
  assignMenuToRole,
  getMenusByRoleId,
  assignApiToRole,
  getApisByRoleId,
} from '@/api/system/sysRole'
import type { SysRole } from '@/api/system/sysRole'

defineOptions({ name: 'RoleList' })

// ==================== 角色列表 ====================

const tableData = ref<SysRole[]>([])
const loading = ref(false)

async function loadRoles() {
  loading.value = true
  try {
    const res: any = await getRoleTree()
    tableData.value = res?.data || []
  } finally {
    loading.value = false
  }
}

// ==================== 角色表单抽屉 ====================

const roleFormVisible = ref(false)
const roleFormTitle = ref('新建角色')
const roleForm = reactive({ id: 0, name: '', parentId: undefined as number | undefined, sort: 0, status: 1, remark: '' })

function openCreateRole(parentId?: number) {
  roleForm.id = 0
  roleForm.name = ''
  roleForm.parentId = parentId
  roleForm.sort = 0
  roleForm.status = 1
  roleForm.remark = ''
  roleFormTitle.value = parentId ? '新增下级角色' : '新建角色'
  roleFormVisible.value = true
}

function openEditRole(row: SysRole) {
  roleForm.id = row.id
  roleForm.name = row.name
  roleForm.parentId = row.parentId
  roleForm.sort = row.sort || 0
  roleForm.status = row.status ?? 1
  roleForm.remark = row.remark || ''
  roleFormTitle.value = `编辑角色 — ${row.name}`
  roleFormVisible.value = true
}

async function onSubmitRole() {
  const payload = {
    name: roleForm.name,
    parentId: roleForm.parentId || undefined,
    sort: roleForm.sort,
    status: roleForm.status,
    remark: roleForm.remark || undefined,
  }
  try {
    if (roleForm.id) {
      await updateRole(roleForm.id, payload)
      ElMessage.success('角色更新成功')
    } else {
      await createRole(payload)
      ElMessage.success('角色创建成功')
    }
    roleFormVisible.value = false
    loadRoles()
  } catch { /* 错误已在拦截器处理 */ }
}

async function delRole(row: SysRole) {
  if (row.children && row.children.length > 0) {
    ElMessage.warning('请先删除下级角色')
    return
  }
  try {
    await ElMessageBox.confirm(`确定删除角色 "${row.name}" 吗？`, '删除确认', { type: 'warning' })
    await deleteRole([row.id])
    ElMessage.success('删除成功')
    loadRoles()
  } catch { /* 取消 */ }
}

// ==================== 权限分配抽屉 ====================

const permVisible = ref(false)
const permRoleId = ref(0)
const permRoleName = ref('')
const activeTab = ref('menu')

// ---- 菜单权限 ----
const menuTreeData = ref<any[]>([])
const menuTreeRef = ref()
const checkedMenuIds = ref(new Set<number>())
const homePath = ref('')
const menuFilter = ref('')
const menuLoading = ref(false)

/** 从菜单树中收集所有有 path 的节点 */
const menuPathOptions = computed(() => {
  const opts: { label: string; value: string }[] = []
  function walk(nodes: any[]) {
    for (const n of nodes) {
      if (n.path) opts.push({ label: n.name, value: n.path })
      if (n.children) walk(n.children)
    }
  }
  walk(menuTreeData.value)
  return opts
})

/** 筛选后的菜单树 */
const filteredMenuTree = computed(() => {
  if (!menuFilter.value) return menuTreeData.value
  const kw = menuFilter.value.toLowerCase()
  function filter(nodes: any[]): any[] {
    const result: any[] = []
    for (const n of nodes) {
      const matches = (n.name || '').toLowerCase().includes(kw)
      const filteredChildren = n.children ? filter(n.children) : []
      if (matches || filteredChildren.length > 0) {
        result.push({ ...n, children: filteredChildren.length > 0 ? filteredChildren : n.children })
      }
    }
    return result
  }
  return filter(menuTreeData.value)
})

function onMenuCheckChange(_data: any, _checked: boolean) {
  // 使用 ElTree 的 getCheckedKeys 获取完整选中列表
  if (!menuTreeRef.value) return
  const keys = menuTreeRef.value.getCheckedKeys()
  const halfKeys = menuTreeRef.value.getHalfCheckedKeys()
  checkedMenuIds.value = new Set([...keys, ...halfKeys])
}

/** 加载角色菜单权限 */
async function loadMenuPerm() {
  menuLoading.value = true
  try {
    const tree: any = await getMenusByRoleId({ roleId: permRoleId.value })
    menuTreeData.value = tree?.data || tree || []

    // 收集已分配的菜单 ID
    const ids: number[] = []
    function collect(nodes: any[]) {
      for (const n of nodes) {
        if (n.isRel === 1 && n.id) ids.push(n.id)
        if (n.children) collect(n.children)
      }
    }
    collect(menuTreeData.value)

    // 设置默认首页
    const role = findRoleById(permRoleId.value)
    homePath.value = role?.homePath || ''
    if (!homePath.value) {
      // 自动选第一个有 path 的节点
      function findFirst(nodes: any[]): string | null {
        for (const n of nodes) {
          if (n.path) return n.path
          if (n.children) { const f = findFirst(n.children); if (f) return f }
        }
        return null
      }
      homePath.value = findFirst(menuTreeData.value) || ''
    }

    // ElTree 通过 setCheckedKeys 初始化
    await nextTick()
    checkedMenuIds.value = new Set(ids)
    menuTreeRef.value?.setCheckedKeys(ids)
  } finally {
    menuLoading.value = false
  }
}

function findRoleById(id: number, nodes: SysRole[] = tableData.value): SysRole | null {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children) { const f = findRoleById(id, n.children); if (f) return f }
  }
  return null
}

/** 保存菜单权限 */
async function saveMenuPerm() {
  const allChecked = menuTreeRef.value
    ? [...menuTreeRef.value.getCheckedKeys(), ...menuTreeRef.value.getHalfCheckedKeys()]
    : []
  try {
    await assignMenuToRole({ roleId: permRoleId.value, menuIds: allChecked, homePath: homePath.value || undefined })
    ElMessage.success('菜单权限设置成功')
  } catch { /* 错误已在拦截器处理 */ }
}

// ---- 接口权限 ----
const apiGroupData = ref<any[]>([])
const checkedApiIds = ref<number[]>([])
const apiFilter = ref('')
const apiLoading = ref(false)

const methodTagMap: Record<string, string> = {
  GET: 'success', POST: '', PUT: 'warning', DELETE: 'danger',
}

const filteredApiGroups = computed(() => {
  const kw = apiFilter.value.toLowerCase()
  if (!kw) return apiGroupData.value
  return apiGroupData.value.map((g: any) => {
    const children = (g.items || []).filter((api: any) =>
      (api.name || '').toLowerCase().includes(kw) ||
      (api.path || '').toLowerCase().includes(kw) ||
      (api.method || '').toLowerCase().includes(kw),
    )
    return children.length > 0 ? { ...g, items: children } : null
  }).filter(Boolean)
})

function isGroupAllChecked(group: any): boolean {
  const children = group.items || []
  if (children.length === 0) return false
  return children.every((api: any) => checkedApiIds.value.includes(api.id))
}

function isGroupIndeterminate(group: any): boolean {
  const children = group.items || []
  const checked = children.filter((api: any) => checkedApiIds.value.includes(api.id)).length
  return checked > 0 && checked < children.length
}

function toggleGroupCheck(group: any, checked: boolean) {
  const childIds = (group.items || []).map((api: any) => api.id)
  if (checked) {
    const add = childIds.filter((id: number) => !checkedApiIds.value.includes(id))
    checkedApiIds.value = [...checkedApiIds.value, ...add]
  } else {
    const set = new Set(childIds)
    checkedApiIds.value = checkedApiIds.value.filter((id) => !set.has(id))
  }
}

/** 加载角色接口权限 */
async function loadApiPerm() {
  apiLoading.value = true
  try {
    const groups: any = await getApisByRoleId({ roleId: permRoleId.value })
    const data = groups?.data || groups || []
    apiGroupData.value = data
    const allIds = data.flatMap((g: any) => (g.items || []).filter((api: any) => api.isRel === 1).map((api: any) => api.id))
    checkedApiIds.value = allIds
  } finally {
    apiLoading.value = false
  }
}

/** 保存接口权限 */
async function saveApiPerm() {
  try {
    await assignApiToRole({ roleId: permRoleId.value, apiIds: checkedApiIds.value })
    ElMessage.success('接口权限设置成功')
  } catch { /* 错误已在拦截器处理 */ }
}

// 切换 tab 时懒加载
watch(activeTab, (tab) => {
  if (tab === 'menu') loadMenuPerm()
  else if (tab === 'api') loadApiPerm()
})

/** 打开权限抽屉 */
function openPermission(row: SysRole) {
  permRoleId.value = row.id
  permRoleName.value = row.name
  menuFilter.value = ''
  apiFilter.value = ''
  menuTreeData.value = []
  apiGroupData.value = []
  permVisible.value = true
  // 强制切到菜单权限 tab 并加载数据；即使当前已是 menu，watch 不会触发，手动加载
  activeTab.value = 'menu'
  loadMenuPerm()
}

/** 保存权限 */
async function onSavePerm() {
  if (activeTab.value === 'menu') await saveMenuPerm()
  else await saveApiPerm()
}

onMounted(() => {
  loadRoles()
})
</script>

<template>
  <div class="role-page">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="openCreateRole()">新建角色</el-button>
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
      <el-table-column label="排序" width="80" align="center">
        <template #default="{ row }">{{ row.sort }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="备注" min-width="160">
        <template #default="{ row }">{{ row.remark || '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="340" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" :icon="Plus" @click="openCreateRole(row.id)">
            新增下级
          </el-button>
          <el-button type="warning" link size="small" :icon="Lock" @click="openPermission(row)">
            设置权限
          </el-button>
          <el-button type="primary" link size="small" :icon="Edit" @click="openEditRole(row)">
            编辑
          </el-button>
          <el-button
            type="danger" link size="small" :icon="Delete"
            :disabled="!!(row.children && row.children.length > 0)"
            @click="delRole(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 角色表单抽屉 -->
    <el-drawer v-model="roleFormVisible" :title="roleFormTitle" size="480px">
      <el-form :model="roleForm" label-width="80px">
        <el-form-item label="角色名称" required>
          <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="roleForm.sort" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="roleForm.status">
            <el-radio-button :value="1">启用</el-radio-button>
            <el-radio-button :value="2">禁用</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="roleForm.remark" type="textarea" placeholder="备注（选填）" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSubmitRole">保存</el-button>
          <el-button @click="roleFormVisible = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-drawer>

    <!-- 权限分配抽屉 -->
    <el-drawer v-model="permVisible" :title="`设置权限 — ${permRoleName}`" size="600px">
      <el-tabs v-model="activeTab">
        <!-- 菜单权限 -->
        <el-tab-pane label="菜单权限" name="menu">
          <div v-loading="menuLoading">
            <!-- 默认首页选择 -->
            <div class="perm-section">
              <span class="perm-label">默认首页</span>
              <el-select v-model="homePath" placeholder="请选择默认首页" style="width: 260px">
                <el-option v-for="opt in menuPathOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
              <div style="color: #999; font-size: 12px; margin-top: 4px">成员登录该角色后默认进入的页面</div>
            </div>

            <!-- 菜单搜索 -->
            <el-input v-model="menuFilter" placeholder="筛选菜单名称" clearable style="margin-bottom: 12px" />

            <!-- 菜单树 -->
            <div class="perm-tree-box">
              <el-tree
                v-if="filteredMenuTree.length > 0"
                ref="menuTreeRef"
                :data="filteredMenuTree"
                node-key="id"
                show-checkbox
                default-expand-all
                :props="{ label: 'name', children: 'children' }"
                @check="onMenuCheckChange"
              />
              <el-empty v-else description="暂无菜单数据" />
            </div>
          </div>
        </el-tab-pane>

        <!-- 接口权限 -->
        <el-tab-pane label="接口权限" name="api">
          <div v-loading="apiLoading">
            <el-input v-model="apiFilter" placeholder="搜索接口名称、路径或方法" clearable style="margin-bottom: 12px" />

            <div class="perm-tree-box">
              <template v-if="filteredApiGroups.length > 0">
                <div v-for="group in filteredApiGroups" :key="group.id" class="api-group-card">
                  <div class="api-group-header">
                    <el-checkbox
                      :model-value="isGroupAllChecked(group)"
                      :indeterminate="isGroupIndeterminate(group)"
                      @change="(val: any) => toggleGroupCheck(group, val)"
                    />
                    <span class="api-group-name">{{ group.name }}</span>
                    <el-tag size="small" round>{{ group.items.length }}</el-tag>
                  </div>
                  <div class="api-list">
                    <div v-for="api in group.items" :key="api.id" class="api-row">
                      <el-checkbox
                        :model-value="checkedApiIds.includes(api.id)"
                        @change="(val: any) => {
                          if (val) { if (!checkedApiIds.includes(api.id)) checkedApiIds.push(api.id) }
                          else checkedApiIds = checkedApiIds.filter((id: number) => id !== api.id)
                        }"
                      />
                      <el-tag v-if="api.method" size="small" :type="methodTagMap[api.method] || 'info'">
                        {{ api.method }}
                      </el-tag>
                      <span class="api-item-text">{{ api.description || api.name || api.path }}</span>
                    </div>
                  </div>
                </div>
              </template>
              <el-empty v-else description="暂无接口数据" />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <div style="margin-top: 16px; text-align: right">
        <el-button type="primary" @click="onSavePerm">保存权限</el-button>
        <el-button @click="permVisible = false">关闭</el-button>
      </div>
    </el-drawer>
  </div>
</template>

<style lang="scss" scoped>
.role-page {
  padding: 16px;
}

.toolbar {
  margin-bottom: 16px;
}

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

.perm-tree-box {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 8px;
  max-height: 420px;
  overflow: auto;
}

.api-group-card {
  margin-bottom: 8px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafafa;
}

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

.api-list {
  padding: 4px 12px;
}

.api-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
}

.api-item-text {
  font-size: 13px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
</style>
