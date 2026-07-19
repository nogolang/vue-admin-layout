<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { getUserList, deleteUser } from '@/api/system/sysUser'
import type { SysUser } from '@/api/system/sysUser'
import SysUserEdit from './sysUserEdit.vue'
import Pagination from '@/components/Pagination.vue'

// ==================== 用户列表数据 ====================

const tableData = ref<SysUser[]>([])
const loading = ref(false)
const total = ref(0)
const editRef = ref<InstanceType<typeof SysUserEdit> | null>(null)

// ==================== 查询参数 ====================

const query = ref({
  pageNo: 1,
  pageSize: 10,
  queryStr: '',
})

// ==================== 加载用户列表 ====================

const findAll = async () => {
  loading.value = true
  try {
    const res: any = await getUserList({
      page: query.value.pageNo,
      pageSize: query.value.pageSize,
      queryStr: query.value.queryStr || undefined,
    })
    tableData.value = res?.data?.records || []
    total.value = Number.parseInt(res?.data?.total) || 0
  } finally {
    loading.value = false
  }
}

// ==================== 搜索 ====================

const onSearch = () => {
  query.value.pageNo = 1
  findAll()
}

// ==================== 新增 / 编辑 / 删除 ====================

// 新增用户
const add = () => {
  editRef.value?.open(0)
}

// 修改用户
const updateById = (row: SysUser) => {
  editRef.value?.open(row.id)
}

// 删除用户
const deleteById = async (row: SysUser) => {
  try {
    await ElMessageBox.confirm(
      `确定删除用户 "${row.username}" 吗？`,
      '删除确认',
      { type: 'warning' },
    )
    await deleteUser([row.id])
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
    <!-- 顶部搜索 & 操作栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="add">新增用户</el-button>
      </div>
      <div class="toolbar-right">
        <!-- 搜索输入框 -->
        <el-input style="width: 250px" v-model="query.queryStr"
                  clearable
                  @clear="findAll"
                  @keyup.enter="onSearch" placeholder="搜索用户名"></el-input>
        <el-button type="primary" :icon="Search" @click="onSearch">搜索</el-button>
      </div>
    </div>

    <!-- 用户表格 -->
    <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
    >
      <el-table-column label="ID" prop="id" width="80" align="center">
      </el-table-column>
      <el-table-column label="用户名" prop="username" min-width="120">
      </el-table-column>
      <el-table-column label="昵称" prop="nickName" min-width="120">
      </el-table-column>
      <el-table-column label="邮箱" prop="email" min-width="180" show-overflow-tooltip>
      </el-table-column>
      <el-table-column label="手机号" prop="phone" width="140">
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" align="center" fixed="right">
        <template #default="{ row }">
          <el-text type="primary" @click="updateById(row)">修改</el-text>
          <el-text type="danger" @click="deleteById(row)">删除</el-text>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <Pagination
      v-model:current-page="query.pageNo"
      v-model:page-size="query.pageSize"
      :total="total"
      @size-change="findAll"
      @current-change="findAll"
    />

    <!-- 用户表单编辑弹窗（子组件） -->
    <SysUserEdit ref="editRef" @afterSave="afterSave" />
  </div>
</template>

