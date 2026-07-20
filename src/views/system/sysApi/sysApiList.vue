<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, FolderAdd } from '@element-plus/icons-vue'
import { getApiGroupList, deleteApi, deleteApiGroup } from '@/api/system/sysApi'
import type { SysApi, SysApiGroup } from '@/api/system/sysApi'
import SysApiEdit from './sysApiEdit.vue'
import { useLocalStore } from '@/stores/useLocalStore'

const localStore = useLocalStore<SysApi>('local_sysApi')

// ==================== 类型定义 ====================

// 表格中的接口行（SysApi + rowKey + 所属分组 ID）
interface ApiTableRow extends SysApi {
  rowKey: string
  groupId: number
}

// 表格中的分组行（SysApiGroup + rowKey + 子接口列表）
interface GroupTableRow extends SysApiGroup {
  rowKey: string
  children: ApiTableRow[]
}

// 表格行联合类型
type TableRow = GroupTableRow | ApiTableRow

// ==================== 接口列表数据 ====================

const tableData = ref<GroupTableRow[]>([])
const loading = ref(false)
const editRef = ref<InstanceType<typeof SysApiEdit> | null>(null)

// ==================== 工具方法 ====================

// 判断行是否为分组（有 children 即为分组）
const isGroupRow = (row: TableRow): row is GroupTableRow => {
  return Array.isArray(row.children)
}

// 将后端分组数据转为表格 tree 格式
const transformData = (groups: SysApiGroup[]): GroupTableRow[] => {
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

// ==================== HTTP 方法颜色映射 ====================

const methodColorMap: Record<string, string> = {
  GET: '#67c23a',
  POST: '#409eff',
  PUT: '#e6a23c',
  DELETE: '#f56c6c',
}

// ==================== 加载数据 ====================

const findAll = async () => {
  loading.value = true
  try {
    const res: any = await getApiGroupList()
    const groups = transformData(res?.data?.list || [])
    // 本地新增的接口直接追加到第一个分组
    const draft = localStore.load()
    const firstGroup = groups[0]
    if (draft && firstGroup) {
      firstGroup.children.push({
        ...draft,
        rowKey: `api-${draft.id}`,
        groupId: draft.groupId || firstGroup.id,
      } as ApiTableRow)
    }
    tableData.value = groups
  } finally {
    loading.value = false
  }
}

// ==================== 新增 / 编辑 / 删除 ====================

// 新建分组
const addGroup = () => {
  editRef.value?.openGroup(0)
}

// 新建接口
const addApi = (groupId?: number) => {
  editRef.value?.open(0, groupId)
}

// 编辑分组
const updateGroupById = (row: SysApiGroup) => {
  editRef.value?.openGroup(row.id)
}

// 编辑接口
const updateApiById = (row: ApiTableRow) => {
  editRef.value?.open(row.id)
}

// 删除分组
const deleteGroupById = async (row: SysApiGroup) => {
  try {
    await ElMessageBox.confirm(
      `确定删除分组 "${row.name}" 吗？`,
      '删除确认',
      { type: 'warning' },
    )
    await deleteApiGroup([row.id])
    ElMessage.success('删除成功')
    await findAll()
  } catch {
    // 取消删除
  }
}

// 删除接口
const deleteApiById = async (row: ApiTableRow) => {
  try {
    await ElMessageBox.confirm(
      `确定删除接口 "${row.path}" 吗？`,
      '删除确认',
      { type: 'warning' },
    )
    await deleteApi([row.id])
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

onMounted(() => {
  findAll()
})
</script>

<template>
  <div class="sys-page">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <el-button type="primary" :icon="FolderAdd" @click="addGroup">新建分组</el-button>
    </div>

    <!-- 接口树形表格 -->
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
            <span style="color: #e6a23c; font-weight: 500">{{ row.name }}</span>
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
            <el-button type="primary" link size="small" :icon="Plus" @click="addApi(row.id)">新建接口</el-button>
            <el-button type="primary" link size="small" :icon="Edit" @click="updateGroupById(row)">编辑</el-button>
            <el-button type="danger" link size="small" :icon="Delete" @click="deleteGroupById(row)">删除</el-button>
          </template>
          <template v-else>
            <el-button type="primary" link size="small" :icon="Edit" @click="updateApiById(row)">编辑</el-button>
            <el-button type="danger" link size="small" :icon="Delete" @click="deleteApiById(row)">删除</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- 接口表单编辑弹窗（子组件） -->
    <SysApiEdit ref="editRef" @afterSave="afterSave" />
  </div>
</template>

