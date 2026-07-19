<!--
  ==================== 登录页 ====================

  独立于 BasicLayout 的登录页面（meta.hidden = true）。
  接入真实认证系统后请替换为实际的登录逻辑。

  页面结构：
    - 左侧品牌展示区（渐变背景 + 品牌信息）
    - 右侧登录表单区（用户名 + 密码 + 登录按钮）

  接入步骤：
    1. 将表单提交事件替换为真实的登录 API 调用
    2. 登录成功后保存 token（localStorage / cookie）
    3. 跳转到首页或重定向地址
    4. 在路由守卫中增加 token 检查逻辑
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { appConfig, APP_TITLE } from '@/app.config'

defineOptions({ name: 'LoginPage' })

const router = useRouter()

/** 登录表单数据 */
const loginForm = ref({
  username: 'admin',
  password: '',
})

/**
 * 登录处理
 *
 * TODO: 接入真实登录 API
 *   1. 调用登录接口获取 token
 *   2. 存储 token（例如：localStorage.setItem('token', token)）
 *   3. 跳转到首页：router.push(appConfig.app.homePath)
 *   4. 如需要，重新拉取动态路由
 */
function handleLogin() {
  // 模拟登录（项目开发阶段使用）
  if (loginForm.value.username) {
    router.push(appConfig.app.homePath)
  }
}
</script>

<template>
  <div class="login-page">
    <!-- 左侧品牌区 -->
    <div class="login-brand">
      <div class="brand-content">
        <div class="brand-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="white" fill-opacity="0.2" />
            <path d="M12 33V15l12 9-12 9zM24 33V15l12 9-12 9z" fill="white" />
          </svg>
        </div>
        <h1 class="brand-title">{{ APP_TITLE }}</h1>
        <p class="brand-subtitle">基于 Vue 3 + Element Plus + TypeScript 的后台管理解决方案</p>
        <div class="brand-features">
          <div class="feature-item">
            <span class="feature-dot" />
            多种布局模式
          </div>
          <div class="feature-item">
            <span class="feature-dot" />
            动态路由权限
          </div>
          <div class="feature-item">
            <span class="feature-dot" />
            标签页管理
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧登录表单区 -->
    <div class="login-form-area">
      <div class="login-form-card">
        <h2 class="form-title">欢迎回来</h2>
        <p class="form-subtitle">请输入您的账号信息</p>

        <el-form @submit.prevent="handleLogin">
          <el-form-item>
            <el-input
              v-model="loginForm.username"
              placeholder="用户名"
              size="large"
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="密码"
              size="large"
              show-password
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="login-btn"
              @click="handleLogin"
            >
              登 录
            </el-button>
          </el-form-item>
        </el-form>

        <p class="form-tip">提示：当前为演示模式，输入任意用户名即可登录</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* ==================== 页面布局 ==================== */
.login-page {
  height: 100vh;
  display: flex;
  overflow: hidden;
}

/* ==================== 左侧品牌区 ==================== */
.login-brand {
  width: 45%;
  background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(220 80% 50%) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.brand-content {
  text-align: center;
  color: white;
}

.brand-icon {
  margin-bottom: 24px;
}

.brand-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 12px;
  letter-spacing: -1px;
}

.brand-subtitle {
  font-size: 16px;
  opacity: 0.8;
  margin-bottom: 32px;
  line-height: 1.6;
}

.brand-features {
  display: inline-flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  opacity: 0.9;
}

.feature-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: white;
  opacity: 0.7;
}

/* ==================== 右侧表单区 ==================== */
.login-form-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--background));
}

.login-form-card {
  width: 380px;
  padding: 40px;
}

.form-title {
  font-size: 28px;
  font-weight: 700;
  color: hsl(var(--foreground));
  margin-bottom: 8px;
}

.form-subtitle {
  font-size: 14px;
  color: hsl(var(--muted-foreground));
  margin-bottom: 32px;
}

.login-btn {
  width: 100%;
}

.form-tip {
  margin-top: 24px;
  font-size: 13px;
  color: hsl(var(--muted-foreground));
  text-align: center;
}
</style>
