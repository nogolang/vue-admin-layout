<!--
  ==================== 首页（Welcome / Home） ====================

  框架默认首页，对应路径 /home。
  这是一个占位页面，请根据项目需求替换为实际内容。

  用途：
    - 作为用户登录后的默认展示页面
    - 可展示仪表盘、统计图表、工作概览等内容

  编辑建议：
    - 替换为你的仪表盘/工作台组件
    - 保留 el-card 结构可以保持视觉一致性
-->
<script setup lang="ts">
import { APP_TITLE } from '@/app.config'

defineOptions({ name: 'HomePage' })
</script>

<template>
  <div class="home-page">
    <el-card class="welcome-card">
      <div class="welcome-content">
        <!-- 欢迎图标 -->
        <div class="welcome-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="hsl(var(--primary) / 0.1)" />
            <path
              d="M24 14c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
              fill="hsl(var(--primary))"
            />
            <path d="M24 18v6l4 4" stroke="hsl(var(--primary))" stroke-width="2" stroke-linecap="round" />
          </svg>
        </div>

        <!-- 欢迎文本 -->
        <h1 class="welcome-title">欢迎使用{{ APP_TITLE }}</h1>
        <p class="welcome-desc">
          这是一个基于 Vue 3 + Element Plus + TypeScript 的通用后台管理框架。
          <br />提供布局系统、动态路由、权限控制、标签页等基础设施。
        </p>

        <!-- 快速指引 -->
        <div class="quick-start">
          <h3 class="quick-start-title">快速开始</h3>
          <el-row :gutter="16">
            <el-col :span="8">
              <div class="step-card">
                <span class="step-number">1</span>
                <span class="step-text">在 <code>src/views/</code> 创建页面组件</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="step-card">
                <span class="step-number">2</span>
                <span class="step-text">在 <code>menus.ts</code> 中添加菜单数据</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="step-card">
                <span class="step-number">3</span>
                <span class="step-text">在 <code>routes.ts</code> 中注册组件映射</span>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 技术栈 -->
        <div class="tech-stack">
          <el-tag type="primary" effect="plain">Vue 3</el-tag>
          <el-tag type="success" effect="plain">Element Plus</el-tag>
          <el-tag effect="plain">TypeScript</el-tag>
          <el-tag type="warning" effect="plain">Pinia</el-tag>
          <el-tag type="danger" effect="plain">Vue Router</el-tag>
          <el-tag effect="plain">Vite</el-tag>
          <el-tag type="info" effect="plain">SCSS</el-tag>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.home-page {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-card {
  max-width: 720px;
  width: 100%;
  border-radius: var(--radius);
  box-shadow: var(--shadow-float);
}

.welcome-content {
  text-align: center;
  padding: 24px 16px;
}

.welcome-icon {
  margin-bottom: 16px;
}

.welcome-title {
  font-size: 24px;
  font-weight: 700;
  color: hsl(var(--foreground));
  margin-bottom: 12px;
}

.welcome-desc {
  font-size: 14px;
  color: hsl(var(--muted-foreground));
  line-height: 1.8;
  margin-bottom: 32px;
}

.quick-start {
  text-align: left;
  margin-bottom: 28px;
}

.quick-start-title {
  font-size: 16px;
  font-weight: 600;
  color: hsl(var(--foreground));
  margin-bottom: 12px;
  text-align: center;
}

.step-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 14px;
  background: hsl(var(--accent));
  border-radius: var(--radius);
  border: 1px solid hsl(var(--border));
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: hsl(var(--primary));
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-text {
  font-size: 13px;
  color: hsl(var(--foreground));
  line-height: 1.5;

  code {
    background: hsl(var(--primary) / 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    color: hsl(var(--primary));
  }
}

.tech-stack {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}
</style>
