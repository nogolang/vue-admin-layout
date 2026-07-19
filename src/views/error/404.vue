<!--
  ==================== 404 页面 ====================

  捕获所有未匹配路由的通配符页面（path: '/:pathMatch(.*)*'）。
  独立于 BasicLayout，不使用布局壳。

  使用场景：
    - 用户访问了不存在的路径
    - 动态路由未覆盖的路径（正常情况下不应出现）
-->
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { appConfig } from '@/app.config'

defineOptions({ name: 'NotFoundPage' })

const router = useRouter()

/** 返回上一页（如果有历史记录）或跳转到首页 */
function goBack() {
  // window.history.length > 1 说明有可返回的页面
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push(appConfig.app.homePath)
  }
}
</script>

<template>
  <div class="not-found-page">
    <div class="not-found-content">
      <!-- 404 大数字（半透明装饰效果） -->
      <div class="error-code">404</div>
      <h1 class="error-title">页面未找到</h1>
      <p class="error-desc">
        您访问的页面不存在或已被移除。
        <br />请检查 URL 是否正确，或返回首页。
      </p>
      <!-- 操作按钮 -->
      <div class="error-actions">
        <el-button type="primary" @click="router.push(appConfig.app.homePath)">
          返回首页
        </el-button>
        <el-button @click="goBack">
          返回上页
        </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 居中布局 */
.not-found-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--background));
}

.not-found-content {
  text-align: center;
  padding: 40px;
}

/* 大号错误码（半透明装饰） */
.error-code {
  font-size: 120px;
  font-weight: 800;
  line-height: 1;
  color: hsl(var(--primary) / 0.3);
  margin-bottom: 16px;
  letter-spacing: -4px;
  user-select: none; /* 不可选中，纯装饰 */
}

.error-title {
  font-size: 24px;
  font-weight: 600;
  color: hsl(var(--foreground));
  margin-bottom: 12px;
}

.error-desc {
  font-size: 14px;
  color: hsl(var(--muted-foreground));
  line-height: 1.8;
  margin-bottom: 28px;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
