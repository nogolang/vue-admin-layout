<template>
  <div class="test-page">
    <el-card>
      <template #header><span>页面 Alpha</span></template>
      <p>菜单层级：测试菜单 → 模块一 → 分组甲 → <strong>页面 Alpha</strong></p>
      <el-tag type="primary">第 4 级菜单</el-tag>
    </el-card>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'TestM1G1Page1' })
</script>

<style scoped>
.test-page { padding: 16px; }
</style>
