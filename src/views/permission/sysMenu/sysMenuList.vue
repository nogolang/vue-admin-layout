<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { getMenuTree, deleteMenu } from '@/api/permission/sysMenu'
import type { SysMenu } from '@/api/permission/sysMenu'
import SysMenuEdit from './sysMenuEdit.vue'

// ==================== 菜单列表数据 ====================

const tableData = ref<SysMenu[]>([])
const loading = ref(false)
const editRef = ref<InstanceType<typeof SysMenuEdit> | null>(null)

// ==================== 类型标签颜色映射 ====================

// button 类型不设颜色，走 el-tag 默认样式
const typeTagMap: Record<string, string> = {
  group: 'warning',
  page: 'success',
  button: '',
}

// ==================== 数据转换 ====================

// 拍平菜单树为列表（el-table tree 模式需要 children 字段）
const transformTree = (menus: SysMenu[]): SysMenu[] => {
  return (menus || []).map((m) => ({
    ...m,
    children: m.children?.length ? transformTree(m.children) : undefined,
  }))
}

// ==================== 加载菜单树 ====================

const findAll = async () => {
  loading.value = true
  try {
    const res: any = await getMenuTree()
    const tree = transformTree(res?.data || [])
    tableData.value = tree
  } finally {
    loading.value = false
  }
}

// ==================== 新增 / 编辑 / 删除 ====================

// 新增菜单
const add = (parentId = 0) => {
  editRef.value?.open(0, parentId)
}

// 添加子级菜单
const addChild = (parentId: number) => {
  editRef.value?.open(0, parentId)
}

// 修改菜单
const updateById = (row: SysMenu) => {
  editRef.value?.open(row.id)
}

// 删除菜单（子菜单一并删除）
const deleteById = async (row: SysMenu) => {
  try {
    await ElMessageBox.confirm(
      `确定删除菜单 "${row.name}" 吗？子菜单也会一并删除。`,
      '删除确认',
      { type: 'warning' },
    )
    await deleteMenu([row.id])
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
      <el-button type="primary" :icon="Plus" @click="add(0)">新建菜单</el-button>
    </div>

    <!-- 菜单树表格 -->
    <el-table
      v-loading="loading"
      :data="tableData"
      row-key="id"
      :tree-props="{ children: 'children' }"
      default-expand-all
      border
      stripe
    >
      <el-table-column label="菜单名称" prop="name" min-width="200">
      </el-table-column>
      <el-table-column label="路由路径" prop="path" min-width="180" show-overflow-tooltip>
      </el-table-column>
      <el-table-column label="组件路径" prop="component" min-width="180" show-overflow-tooltip>
      </el-table-column>
      <el-table-column label="图标" prop="icon" width="100" align="center">
      </el-table-column>
      <el-table-column label="类型" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="typeTagMap[row.type] || 'info'" size="small">{{ row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="排序" prop="sort" width="70" align="center">
      </el-table-column>
      <el-table-column label="操作" width="240" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="success" link size="small" :icon="Plus" @click="addChild(row.id)">添加子级</el-button>
          <el-button type="primary" link size="small" :icon="Edit" @click="updateById(row)">编辑</el-button>
          <el-button type="danger" link size="small" :icon="Delete" @click="deleteById(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 菜单表单编辑弹窗（子组件） -->
    <SysMenuEdit ref="editRef" @afterSave="afterSave" />
  </div>
</template>

