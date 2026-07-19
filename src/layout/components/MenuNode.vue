<!--
  递归菜单节点，支持任意层级嵌套。
  通过 depth prop + CSS 自定义属性 --ml 控制每级缩进，每级 +16px。
-->
<template>
  <el-sub-menu
    v-if="item.children?.length"
    :index="item.path"
    :style="{ '--ml': pad + 'px' }"
  >
    <template #title>
      <div class="menu-title-wrap">
        <el-icon><component :is="iconMap[item.icon]" /></el-icon>
        <span>{{ item.name }}</span>
      </div>
    </template>
    <MenuNode
      v-for="child in item.children"
      :key="child.path"
      :item="child"
      :depth="depth + 1"
    />
  </el-sub-menu>
  <el-menu-item v-else :index="item.path" :style="{ '--ml': pad + 'px' }">
    <div class="menu-title-wrap">
      <el-icon><component :is="iconMap[item.icon]" /></el-icon>
      <span>{{ item.name }}</span>
    </div>
  </el-menu-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { iconMap } from '@/router/menus'
import type { MenuItem } from '@/router/menus'

defineOptions({ name: 'MenuNode' })

const props = withDefaults(defineProps<{
  item: MenuItem
  depth?: number
}>(), {
  depth: 0,
})

/** 每级缩进 16px，起点 12px */
const pad = computed(() => 12 + props.depth * 16)
</script>
