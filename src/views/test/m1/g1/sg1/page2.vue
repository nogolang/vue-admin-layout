<template>
  <div class="test-page">
    <el-card>
      <template #header><span>页面 Zeta</span></template>
      <p>菜单层级：测试菜单 → 模块一 → 分组甲 → 子分组 → <strong>页面 Zeta</strong></p>
      <el-tag type="info">第 5 级菜单</el-tag>
    </el-card>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'TestM1G1Sg1Page2' })
</script>

<style scoped>
.test-page { padding: 16px; }
</style>
