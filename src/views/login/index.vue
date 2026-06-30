<script setup lang="ts">
defineOptions({ name: 'LoginView' })
</script>

<template>
  <div class="login-page">
    <h2>Login</h2>
    <p>Login page placeholder</p>
    <el-button type="primary" @click="$router.push('/dashboard')">
      Enter Dashboard
    </el-button>
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #f0f2f5;
}
.login-page h2 {
  margin-bottom: 8px;
}
.login-page p {
  margin-bottom: 24px;
  color: #909399;
}
</style>
