<!--
  ==================== 单条通知项（NoticeItem） ====================

  渲染通知中心下拉列表中的单条消息/通知/待办卡片。

  布局结构（左 → 右）：
    1. 头像（el-avatar，可选）→ 有 avatar URL 时才显示
    2. 文本区（弹性容器，垂直排列）：
       - 第一行：标题（单行省略） + 可选状态标签（el-tag）
       - 第二行：描述文本（最多两行，超出省略）
       - 第三行：时间文本

  智能 Tooltip：
    - 标题超过容器宽度时自动显示 tooltip（通过 mouseover 事件检测）
    - 描述超过两行时自动显示 tooltip（通过对比文本实际宽度与容器宽度检测）
-->
<script setup lang="ts">
import type { PropType } from 'vue'
import { ref, nextTick } from 'vue'
import type { ListItem } from './data'

/** 组件 Props */
defineProps({
  /** 单条通知数据 */
  noticeItem: {
    type: Object as PropType<ListItem>,
    default: () => ({}),
  },
  /** 是否为列表最后一项（最后一项不显示底部分隔线） */
  isLast: {
    type: Boolean,
    default: false,
  },
})

// ==================== 智能 Tooltip 检测 ====================

/** 标题 DOM 引用 */
const titleRef = ref<HTMLElement | null>(null)
/** 是否需要显示标题 tooltip（文本溢出时自动设为 true） */
const titleTooltip = ref(false)
/** 描述 DOM 引用 */
const descriptionRef = ref<HTMLElement | null>(null)
/** 是否需要显示描述 tooltip（超过两行时自动设为 true） */
const descriptionTooltip = ref(false)

/**
 * 鼠标悬停标题时检测文本是否溢出
 *
 * 检测原理：比较元素的 scrollWidth（完整文本宽度）与 clientWidth（可见容器宽度）
 * scrollWidth > clientWidth → 文本被截断 → 需要 tooltip
 */
function hoverTitle() {
  nextTick(() => {
    if (titleRef.value) {
      titleTooltip.value = titleRef.value.scrollWidth > titleRef.value.clientWidth
    } else {
      titleTooltip.value = false
    }
  })
}

/**
 * 鼠标悬停描述时检测文本是否超过两行
 *
 * 检测原理：
 *   1. 创建一个临时的 span 元素，设置与描述相同的文本内容
 *   2. 获取临时元素的 offsetWidth（文本在不受限制的情况下占用的实际宽度）
 *   3. 与容器宽度比较：文本宽度 > 2 × 容器宽度 → 文本超过两行 → 需要 tooltip
 *
 * @param event       鼠标事件对象
 * @param description 描述文本内容
 */
function hoverDescription(event: MouseEvent, description: string) {
  // 创建临时 span 元素测量文本实际宽度
  const tempTag = document.createElement('span')
  tempTag.innerText = description
  tempTag.className = 'getDescriptionWidth'
  document.querySelector('body')?.appendChild(tempTag)
  const currentWidth = (document.querySelector('.getDescriptionWidth') as HTMLSpanElement)?.offsetWidth || 0
  document.querySelector('.getDescriptionWidth')?.remove()

  // 容器宽度
  const cellWidth = (event.target as HTMLElement)?.offsetWidth || 0

  // 文本宽度 > 2 倍容器宽度 → 超过两行
  descriptionTooltip.value = currentWidth > 2 * cellWidth
}
</script>

<template>
  <div
    class="notice-container"
    :class="{ 'notice-container--last': isLast }"
  >
    <!-- 头像（仅在有 avatar URL 时显示） -->
    <el-avatar
      v-if="noticeItem.avatar"
      :size="30"
      :src="noticeItem.avatar"
      class="notice-avatar"
    />

    <!-- 文本区域 -->
    <div class="notice-text">
      <!-- 第一行：标题 + 可选标签 -->
      <div class="notice-title-row">
        <el-tooltip
          :disabled="!titleTooltip"
          :content="noticeItem.title"
          placement="top-start"
          effect="dark"
          popper-class="notice-tooltip"
        >
          <div
            ref="titleRef"
            class="notice-title"
            @mouseover="hoverTitle"
          >
            {{ noticeItem.title }}
          </div>
        </el-tooltip>
        <!-- 附加标签（如"进行中"、"马上到期"） -->
        <el-tag
          v-if="noticeItem?.extra"
          :type="noticeItem?.status || 'info'"
          size="small"
          class="notice-extra-tag"
        >
          {{ noticeItem?.extra }}
        </el-tag>
      </div>

      <!-- 第二行：描述文本（最多两行） -->
      <el-tooltip
        :disabled="!descriptionTooltip"
        :content="noticeItem.description"
        placement="top-start"
        effect="dark"
        popper-class="notice-tooltip"
      >
        <div
          ref="descriptionRef"
          class="notice-desc"
          @mouseover="hoverDescription($event, noticeItem.description)"
        >
          {{ noticeItem.description }}
        </div>
      </el-tooltip>

      <!-- 第三行：时间文本 -->
      <div v-if="noticeItem.datetime" class="notice-datetime">
        {{ noticeItem.datetime }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* ==================== 容器 ==================== */
.notice-container {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0; /* 底部分隔线 */

  /* 最后一项不显示分隔线 */
  &.notice-container--last {
    border-bottom: none;
  }
}

/* ==================== 头像 ==================== */
.notice-avatar {
  margin-right: 16px;
  background: #fff;
  flex-shrink: 0;
}

/* ==================== 文本区域 ==================== */
.notice-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0; /* 兼容 flex 子元素省略 */
}

/* ---- 标题行 ---- */
.notice-title-row {
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5715;

  .notice-title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap; /* 单行，超出省略 */
    cursor: pointer;
    color: hsl(var(--foreground));
  }

  .notice-extra-tag {
    float: right;
    margin-top: -1.5px;
    font-weight: 400;
    flex-shrink: 0;
  }
}

/* ---- 描述文本 ---- */
.notice-desc {
  font-size: 12px;
  line-height: 1.5715;
  color: hsl(var(--muted-foreground));

  /* 多行文本省略（最多两行） */
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* ---- 时间文本 ---- */
.notice-datetime {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5715;
  color: hsl(var(--muted-foreground) /0.7);
}
</style>

<!-- Tooltip 样式（非 scoped，el-tooltip 的 popper 渲染在 body） -->
<style lang="scss">
.notice-tooltip {
  max-width: 238px !important;
}
</style>
