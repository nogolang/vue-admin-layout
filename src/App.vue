<!--
  ==================== 根组件（App.vue） ====================

  整个应用的入口组件，只做一件事：渲染当前路由对应的顶层组件。

  组件树结构：
    App.vue
    └── <RouterView />
        ├── BasicLayout.vue         ← "/" (Root) 路由，所有布局内页面共用
        │   └── <RouterView />
        │       ├── Home (首页)
        │       └── ... (动态路由页面)
        ├── Login.vue               ← "/login" 路由，独立于布局
        └── NotFound (404)           ← "*" 通配符路由，独立于布局

  为什么不在这里放全局 Loading / Toast？
    这些由 Element Plus 的 el-message / el-loading 等全局服务处理，
    它们通过方法调用直接挂载到 body，不需要在这里声明。
-->
<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>
