<script setup lang="ts">
/**
 * 通用搜索栏组件
 * 搜索区域独占一行，内部用 flex-wrap 自然换行
 * 适用于搜索条件较多、一行装不下的列表页面
 *
 * 用法：在 toolbar 下方使用，用 slot 放入搜索控件
 *
 * @example
 * <SearchBar>
 *   <span class="toolbar-label">用户名:</span>
 *   <el-input v-model="query.username" style="width: 180px" />
 *   <el-button type="primary" @click="findAll">搜索</el-button>
 * </SearchBar>
 */
defineOptions({ name: 'SearchBar' })
</script>

<template>
  <div class="search-bar">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.search-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
</style>
