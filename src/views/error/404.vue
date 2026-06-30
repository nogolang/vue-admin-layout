<script setup lang="ts">
defineOptions({ name: 'NotFoundView' })
</script>

<template>
  <div class="error-page">
    <h1>404</h1>
    <p>Page not found</p>
    <el-button type="primary" @click="$router.push('/dashboard')">
      Back to Dashboard
    </el-button>
  </div>
</template>

<style scoped>
.error-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #606266;
}
.error-page h1 {
  font-size: 72px;
  font-weight: 700;
  color: #c0c4cc;
  margin-bottom: 8px;
}
.error-page p {
  font-size: 16px;
  margin-bottom: 24px;
}
</style>
