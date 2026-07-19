<!--
  ==================== 接口管理 ====================

  展示 API 分组树 + 接口列表。
  支持新建分组、新建接口、编辑、删除等操作。
  使用 el-table 的 tree-props 实现树形表格，el-drawer 承载表单。
-->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, FolderAdd } from '@element-plus/icons-vue'
import {
  getApiGroupList,
  createApi,
  updateApi,
  deleteApi,
  createApiGroup,
  updateApiGroup,
  deleteApiGroup,
} from '@/api/system/sysApi'
import type { SysApi, SysApiGroup } from '@/api/system/sysApi'

defineOptions({ name: 'SysApiList' })

// ==================== 数据 ====================

const tableData = ref<(SysApiGroup & { rowKey: string })[]>([])
const loading = ref(false)

// ==================== 表单抽屉 ====================

const drawerVisible = ref(false)
const drawerTitle = ref('')
const formRef = ref()
const formMode = ref<'create' | 'edit'>('create')
const formType = ref<'group' | 'api'>('api')

const formData = reactive({
  id: 0,
  name: '',
  path: '',
  method: 'GET',
  description: '',
  groupId: undefined as number | undefined,
})

const methodOptions = ['GET', 'POST', 'PUT', 'DELETE']

const methodColorMap: Record<string, string> = {
  GET: '#67c23a',
  POST: '#409eff',
  PUT: '#e6a23c',
  DELETE: '#f56c6c',
}

// ==================== 表格 ====================

/** 判断行是否为分组 */
function isGroupRow(row: any): boolean {
  return Array.isArray(row.children) || Array.isArray(row.apis)
}

/** 将后端分组数据转为表格 tree 格式 */
function transformData(groups: SysApiGroup[]): (SysApiGroup & { rowKey: string; children: any[] })[] {
  return (groups || []).map((group) => ({
    ...group,
    rowKey: `group-${group.id}`,
    children: (group.apis || []).map((api: SysApi) => ({
      ...api,
      rowKey: `api-${api.id}`,
      groupId: group.id,
    })),
  }))
}

async function loadData() {
  loading.value = true
  try {
    const res: any = await getApiGroupList()
    tableData.value = transformData(res?.data?.list || [])
  } finally {
    loading.value = false
  }
}

// ==================== 增删改 ====================

/** 打开新建分组抽屉 */
function openCreateGroup() {
  formMode.value = 'create'
  formType.value = 'group'
  drawerTitle.value = '新建分组'
  formData.id = 0
  formData.name = ''
  formData.path = ''
  formData.method = 'GET'
  formData.description = ''
  formData.groupId = undefined
  drawerVisible.value = true
}

/** 打开新建接口抽屉 */
function openCreateApi(groupId?: number) {
  formMode.value = 'create'
  formType.value = 'api'
  drawerTitle.value = '新建接口'
  formData.id = 0
  formData.name = ''
  formData.path = ''
  formData.method = 'GET'
  formData.description = ''
  formData.groupId = groupId
  drawerVisible.value = true
}

/** 编辑分组 */
function editGroup(row: SysApiGroup) {
  formMode.value = 'edit'
  formType.value = 'group'
  drawerTitle.value = `编辑分组 — ${row.name}`
  formData.id = row.id
  formData.name = row.name
  formData.description = row.description || ''
  drawerVisible.value = true
}

/** 编辑接口 */
function editApi(row: any) {
  formMode.value = 'edit'
  formType.value = 'api'
  drawerTitle.value = `编辑接口 — ${row.path}`
  formData.id = row.id
  formData.path = row.path
  formData.method = row.method
  formData.description = row.description || ''
  formData.groupId = row.groupId
  drawerVisible.value = true
}

/** 提交表单 */
async function onSubmit() {
  try {
    if (formType.value === 'group') {
      const payload = { name: formData.name, description: formData.description || undefined }
      if (formMode.value === 'create') {
        await createApiGroup(payload)
        ElMessage.success('分组创建成功')
      } else {
        await updateApiGroup(formData.id, payload)
        ElMessage.success('分组更新成功')
      }
    } else {
      const payload = {
        path: formData.path,
        method: formData.method,
        description: formData.description || undefined,
        groupId: formData.groupId,
      }
      if (formMode.value === 'create') {
        await createApi(payload)
        ElMessage.success('接口创建成功')
      } else {
        await updateApi(formData.id, payload)
        ElMessage.success('接口更新成功')
      }
    }
    drawerVisible.value = false
    loadData()
  } catch {
    // 错误已在拦截器中处理
  }
}

/** 删除分组 */
async function delGroup(row: SysApiGroup) {
  try {
    await ElMessageBox.confirm(`确定删除分组 "${row.name}" 吗？`, '删除确认', { type: 'warning' })
    await deleteApiGroup([row.id])
    ElMessage.success('删除成功')
    loadData()
  } catch { /* 取消 */ }
}

/** 删除接口 */
async function delApi(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除接口 "${row.path}" 吗？`, '删除确认', { type: 'warning' })
    await deleteApi([row.id])
    ElMessage.success('删除成功')
    loadData()
  } catch { /* 取消 */ }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="sys-api-page">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <el-button type="primary" :icon="FolderAdd" @click="openCreateGroup">新建分组</el-button>
    </div>

    <!-- 树形表格 -->
    <el-table
      v-loading="loading"
      :data="tableData"
      row-key="rowKey"
      :tree-props="{ children: 'children' }"
      default-expand-all
      border
      stripe
    >
      <el-table-column label="名称 / 路径" min-width="240">
        <template #default="{ row }">
          <template v-if="isGroupRow(row)">
            <span style="color: #e6a23c; font-weight: 500">📁 {{ row.name }}</span>
            <span v-if="row.description" style="color: #999; margin-left: 8px; font-size: 12px">
              {{ row.description }}
            </span>
          </template>
          <template v-else>
            <span style="color: #606266">{{ row.path }}</span>
            <span v-if="row.description" style="color: #999; margin-left: 8px; font-size: 12px">
              {{ row.description }}
            </span>
          </template>
        </template>
      </el-table-column>

      <el-table-column label="请求方法" width="120" align="center">
        <template #default="{ row }">
          <el-tag
            v-if="!isGroupRow(row) && row.method"
            :color="methodColorMap[row.method] || '#909399'"
            effect="dark"
            size="small"
            style="color: #fff; border: none"
          >
            {{ row.method }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="280" align="center" fixed="right">
        <template #default="{ row }">
          <template v-if="isGroupRow(row)">
            <el-button type="primary" link size="small" :icon="Plus" @click="openCreateApi(row.id)">
              新建接口
            </el-button>
            <el-button type="primary" link size="small" :icon="Edit" @click="editGroup(row)">
              编辑
            </el-button>
            <el-button type="danger" link size="small" :icon="Delete" @click="delGroup(row)">
              删除
            </el-button>
          </template>
          <template v-else>
            <el-button type="primary" link size="small" :icon="Edit" @click="editApi(row)">
              编辑
            </el-button>
            <el-button type="danger" link size="small" :icon="Delete" @click="delApi(row)">
              删除
            </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- 表单抽屉 -->
    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="480px">
      <el-form ref="formRef" :model="formData" label-width="80px">
        <!-- 分组表单 -->
        <template v-if="formType === 'group'">
          <el-form-item label="分组名称" required>
            <el-input v-model="formData.name" placeholder="请输入分组名称" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="formData.description" type="textarea" placeholder="分组描述（选填）" />
          </el-form-item>
        </template>

        <!-- 接口表单 -->
        <template v-else>
          <el-form-item label="接口路径" required>
            <el-input v-model="formData.path" placeholder="如 /user/v1/list" />
          </el-form-item>
          <el-form-item label="请求方法" required>
            <el-radio-group v-model="formData.method">
              <el-radio-button v-for="m in methodOptions" :key="m" :value="m">
                {{ m }}
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="formData.description" type="textarea" placeholder="接口描述（选填）" />
          </el-form-item>
        </template>

        <el-form-item>
          <el-button type="primary" @click="onSubmit">保存</el-button>
          <el-button @click="drawerVisible = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-drawer>
  </div>
</template>

<style lang="scss" scoped>
.sys-api-page {
  padding: 16px;
}

.toolbar {
  margin-bottom: 16px;
}
</style>
