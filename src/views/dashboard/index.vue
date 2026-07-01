<script setup lang="ts">
import { Odometer, User, Monitor, Document } from '@element-plus/icons-vue'

defineOptions({ name: 'DashboardView' })

const stats = [
  { label: '用户数', value: '12,846', icon: User, color: 'hsl(212 100% 45%)' },
  { label: '访问量', value: '38,291', icon: Odometer, color: 'hsl(144 57% 58%)' },
  { label: '任务数', value: '1,245', icon: Monitor, color: 'hsl(42 84% 61%)' },
  { label: '文档数', value: '892', icon: Document, color: 'hsl(359.33 100% 65.1%)' },
]
</script>

<template>
  <div class="page-dashboard">
    <div class="page-header">
      <h2>Dashboard</h2>
      <p class="page-desc">欢迎回来，这是您的管理后台概览</p>
    </div>

    <div class="stats-grid">
      <el-card v-for="stat in stats" :key="stat.label" class="stat-card" shadow="never">
        <div class="stat-body">
          <div class="stat-info">
            <span class="stat-label">{{ stat.label }}</span>
            <span class="stat-value">{{ stat.value }}</span>
          </div>
          <div class="stat-icon" :style="{ background: stat.color }">
            <el-icon :size="22"><component :is="stat.icon" /></el-icon>
          </div>
        </div>
      </el-card>
    </div>

    <el-card class="content-card" shadow="never">
      <template #header>
        <span class="card-title">项目介绍</span>
      </template>
      <p>这是一个基于 Vue 3 + Element Plus 构建的后台管理系统模板，支持动态菜单、多标签页、侧边栏布局等功能。</p>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.page-dashboard {
  max-width: 1200px;
}

.page-header {
  margin-bottom: 20px;

  h2 {
    font-size: 22px;
    font-weight: 600;
    color: hsl(var(--foreground));
    margin: 0 0 4px;
  }

  .page-desc {
    font-size: 14px;
    color: hsl(var(--muted-foreground));
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-card {
  :deep(.el-card__body) {
    padding: 20px;
  }
}

.stat-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label {
  font-size: 13px;
  color: hsl(var(--muted-foreground));
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: hsl(var(--foreground));
  line-height: 1;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.content-card {
  .card-title {
    font-size: 15px;
    font-weight: 600;
  }

  p {
    color: hsl(var(--muted-foreground));
    line-height: 1.8;
  }
}
</style>
