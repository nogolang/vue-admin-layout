<script setup lang="ts">
defineOptions({ name: 'LoginView' })
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="hsl(var(--primary))" />
          <path d="M8 22V10l8 6-8 6zM16 22V10l8 6-8 6z" fill="white" opacity="0.9" />
        </svg>
        <h2>Vue Admin</h2>
        <p>基于 Vue 3 + Element Plus 的管理系统</p>
      </div>
      <el-button type="primary" size="large" class="login-btn" @click="$router.push('/dashboard')">
        进入系统
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: hsl(var(--background-deep));
}

.login-card {
  width: 400px;
  padding: 48px 40px;
  background: hsl(var(--card));
  border-radius: var(--radius);
  box-shadow: var(--shadow-float);
  text-align: center;
}

.login-header {
  margin-bottom: 32px;

  h2 {
    font-size: 24px;
    font-weight: 700;
    color: hsl(var(--foreground));
    margin: 16px 0 8px;
  }

  p {
    font-size: 14px;
    color: hsl(var(--muted-foreground));
  }
}

.login-btn {
  width: 100%;
}
</style>
