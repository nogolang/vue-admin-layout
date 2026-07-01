<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'

defineOptions({ name: 'SystemRoleView' })

const columns = [
  { prop: 'name', label: '角色名称', width: 160 },
  { prop: 'code', label: '角色编码', width: 160 },
  { prop: 'description', label: '描述' },
  { prop: 'createdAt', label: '创建时间', width: 160 },
]

const data = [
  { name: '管理员', code: 'admin', description: '系统管理员，拥有所有权限', createdAt: '2025-01-01 00:00' },
  { name: '编辑', code: 'editor', description: '内容编辑角色', createdAt: '2025-02-15 10:00' },
  { name: '访客', code: 'guest', description: '只读访问权限', createdAt: '2025-03-01 08:00' },
]
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2>角色管理</h2>
      <el-button type="primary" :icon="Plus">新增角色</el-button>
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
