<script setup lang="ts">
defineOptions({ name: 'MonitorLogView' })

const columns = [
  { prop: 'operator', label: '操作人', width: 100 },
  { prop: 'action', label: '操作', width: 120 },
  { prop: 'target', label: '操作对象' },
  { prop: 'ip', label: 'IP 地址', width: 140 },
  { prop: 'createdAt', label: '操作时间', width: 160 },
]

const data = [
  { operator: 'Admin', action: '登录', target: '系统', ip: '192.168.1.100', createdAt: '2025-06-30 09:00:00' },
  { operator: '张三', action: '编辑', target: '用户管理', ip: '192.168.1.101', createdAt: '2025-06-30 10:15:22' },
  { operator: 'Admin', action: '删除', target: '角色管理', ip: '192.168.1.100', createdAt: '2025-06-30 11:30:45' },
]
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2>操作日志</h2>
    </div>
    <el-card shadow="never">
      <el-table :data="data" stripe style="width: 100%">
        <el-table-column v-for="col in columns" :key="col.prop" v-bind="col" />
      </el-table>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.page-container {
  max-width: 1200px;
}

.page-header {
  margin-bottom: 16px;

  h2 {
    font-size: 18px;
    font-weight: 600;
    color: hsl(var(--foreground));
  }
}
</style>
