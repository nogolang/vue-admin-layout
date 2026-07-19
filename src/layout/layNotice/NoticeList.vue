<!--
  ==================== 通知列表容器（NoticeList） ====================

  渲染某个标签页下的所有通知项。
  有数据时 → 渲染 NoticeItem 列表
  无数据时 → 渲染 el-empty 空状态
-->
<script setup lang="ts">
import type { PropType } from 'vue'
import type { ListItem } from './data'
import NoticeItem from './NoticeItem.vue'

/** 组件 Props */
defineProps({
  /** 当前标签页的通知列表 */
  list: {
    type: Array as PropType<ListItem[]>,
    default: () => [],
  },
  /** 空数据时的提示文本 */
  emptyText: {
    type: String,
    default: '暂无数据',
  },
})
</script>

<template>
  <!-- 有数据 → 渲染列表 -->
  <div v-if="list.length">
    <NoticeItem
      v-for="(item, index) in list"
      :key="index"
      :notice-item="item"
      :is-last="index === list.length - 1"
    />
  </div>
  <!-- 无数据 → 空状态 -->
  <el-empty v-else :description="emptyText" :image-size="60" />
</template>
