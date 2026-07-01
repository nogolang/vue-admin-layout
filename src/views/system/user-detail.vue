<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'

defineOptions({ name: 'UserDetailView' })
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <el-button :icon="ArrowLeft" text @click="$router.back()">返回</el-button>
      <h2>用户详情</h2>
    </div>
    <el-card shadow="never">
      <el-descriptions :column="2" border title="基本信息">
        <el-descriptions-item label="用户名">Admin</el-descriptions-item>
        <el-descriptions-item label="邮箱">admin@example.com</el-descriptions-item>
        <el-descriptions-item label="角色">管理员</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag type="success" size="small">启用</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">2025-01-15 10:30:00</el-descriptions-item>
        <el-descriptions-item label="备注">系统默认管理员账户</el-descriptions-item>
      </el-descriptions>
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
  gap: 12px;
  margin-bottom: 16px;

  h2 {
    font-size: 18px;
    font-weight: 600;
    color: hsl(var(--foreground));
  }
}
</style>
