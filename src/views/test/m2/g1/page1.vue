<template>
  <div class="test-page">
    <el-card>
      <template #header><span>页面 Delta</span></template>
      <p>菜单层级：测试菜单 → 模块二 → 分组丙 → <strong>页面 Delta</strong></p>
      <el-tag type="danger">第 4 级菜单</el-tag>
    </el-card>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'TestM2G1Page1' })
</script>

<style scoped>
.test-page { padding: 16px; }
</style>
