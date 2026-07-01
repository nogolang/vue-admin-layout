<script setup lang="ts">
defineOptions({ name: 'MonitorOnlineView' })

const columns = [
  { prop: 'user', label: '用户', width: 120 },
  { prop: 'ip', label: 'IP 地址', width: 140 },
  { prop: 'location', label: '登录地点', width: 140 },
  { prop: 'browser', label: '浏览器' },
  { prop: 'loginTime', label: '登录时间', width: 160 },
]

const data = [
  { user: 'Admin', ip: '192.168.1.100', location: '本地局域网', browser: 'Chrome 120', loginTime: '2025-06-30 09:00:00' },
  { user: '张三', ip: '10.0.0.15', location: '北京', browser: 'Edge 119', loginTime: '2025-06-30 10:15:22' },
]
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2>在线用户</h2>
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
