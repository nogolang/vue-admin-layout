/**
 * ==================== 应用入口（main.ts） ====================
 *
 * Vue 应用的启动入口，负责：
 *   1. 注册全局样式（Element Plus + 自定义）
 *   2. 注册全局插件（Element Plus、Pinia、Vue Router）
 *   3. 注册路由守卫（动态路由加载）
 *   4. 挂载到 DOM
 *
 * 插件注册顺序说明：
 *   Element Plus  → 先注册 UI 框架（Pinia 的 devtools 不依赖 Element Plus）
 *   Pinia         → 后于 Element Plus，但在 Router 之前（路由守卫中要用 store）
 *   Router        → 最后注册（setupRouterGuard 中会调用 store 的方法）
 *
 * 为什么 Pinia 必须在 Router 之前？
 *   guard.ts 中的 beforeEach 守卫会调用 usePermissionStore().generateRoutes()
 *   而 usePermissionStore 依赖 Pinia 已注册，否则会报错 "Pinia not installed"。
 */

// ==================== 全局样式引入 ====================
import 'element-plus/dist/index.css'  // Element Plus 组件库样式
import './assets/main.css'             // 自定义设计令牌 & 全局基础样式

// ==================== Vue 核心 ====================
import { createApp } from 'vue'
import App from './App.vue'

// ==================== 插件 ====================
import { createPinia } from 'pinia'         // 状态管理
import ElementPlus from 'element-plus'      // UI 组件库

// ==================== 路由 ====================
import router from './router'
import { setupRouterGuard } from './router/guard'

// 创建应用实例
const app = createApp(App)

// 1. 注册 Element Plus（全局 UI 组件 & 指令）
//    zIndex: 3000 → 确保弹出层在最上层（el-dialog、el-popover、el-message 等）
app.use(ElementPlus, { zIndex: 3000 })

// 2. 注册 Pinia（必须在 Router 之前注册！）
app.use(createPinia())

// 3. 注册路由
app.use(router)

// 4. 安装路由守卫 —— 首次导航前自动加载动态路由
//    必须在 app.use(router) 之后、app.mount() 之前注册
setupRouterGuard(router)

// 5. 挂载到 #app（index.html 中的根元素）
app.mount('#app')
