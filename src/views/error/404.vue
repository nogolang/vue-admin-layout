<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'

defineOptions({ name: 'NotFoundView' })
</script>

<template>
  <div class="error-page">
    <div class="error-content">
      <h1>404</h1>
      <p class="error-desc">抱歉，您访问的页面不存在</p>
      <el-button type="primary" :icon="ArrowLeft" @click="$router.push('/dashboard')">
        返回首页
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.error-content {
  text-align: center;

  h1 {
    font-size: 96px;
    font-weight: 800;
    color: hsl(var(--primary) / 0.3);
    line-height: 1;
    margin-bottom: 16px;
    letter-spacing: -2px;
  }

  .error-desc {
    font-size: 15px;
    color: hsl(var(--muted-foreground));
    margin-bottom: 24px;
  }
}
</style>
