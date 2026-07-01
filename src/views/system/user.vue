<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'

defineOptions({ name: 'SystemUserView' })

const columns = [
  { prop: 'name', label: '姓名', width: 120 },
  { prop: 'email', label: '邮箱' },
  { prop: 'role', label: '角色', width: 100 },
  { prop: 'status', label: '状态', width: 80 },
  { prop: 'createdAt', label: '创建时间', width: 160 },
]

const data = [
  { name: 'Admin', email: 'admin@example.com', role: '管理员', status: '启用', createdAt: '2025-01-15 10:30' },
  { name: '张三', email: 'zhangsan@example.com', role: '编辑', status: '启用', createdAt: '2025-02-20 14:22' },
  { name: '李四', email: 'lisi@example.com', role: '访客', status: '禁用', createdAt: '2025-03-10 09:15' },
]
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2>用户管理</h2>
      <el-button type="primary" :icon="Plus">新增用户</el-button>
    </div>
    <el-card shadow="never">
      <el-table :data="data" stripe style="width: 100%">
        <el-table-column v-for="col in columns" :key="col.prop" v-bind="col" />
        <el-table-column label="操作" width="160">
          <template #default>
            <el-button type="primary" link size="small">编辑</el-button>
            <el-button type="danger" link size="small">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.page-container {
  max-width: 1200px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  h2 {
    font-size: 18px;
    font-weight: 600;
    color: hsl(var(--foreground));
  }
}
</style>
