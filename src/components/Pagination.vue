<script setup lang="ts">
// ==================== 分页组件 ====================
// 对 el-pagination 的轻量封装，统一默认配置，减少列表页重复代码

// ==================== Props ====================

const props = withDefaults(
  defineProps<{
    currentPage: number
    pageSize: number
    total: number
    pageSizes?: number[]
  }>(),
  {
    pageSizes: () => [10, 20, 50],
  },
)

// ==================== Emits ====================

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void
  (e: 'update:pageSize', size: number): void
  (e: 'size-change', size: number): void
  (e: 'current-change', page: number): void
}>()

// ==================== 事件处理 ====================

const handleSizeChange = (size: number) => {
  emit('update:pageSize', size)
  emit('size-change', size)
}

const handlePageChange = (page: number) => {
  emit('update:currentPage', page)
  emit('current-change', page)
}
</script>

<template>
  <el-pagination
    class="list-pagination"
    :current-page="props.currentPage"
    :page-size="props.pageSize"
    :page-sizes="props.pageSizes"
    layout="total, sizes, prev, pager, next"
    :total="props.total"
    @size-change="handleSizeChange"
    @current-change="handlePageChange"
  />
</template>

<style lang="scss" scoped>
.list-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
