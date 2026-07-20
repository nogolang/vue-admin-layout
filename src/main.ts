/**
 * ==================== 应用入口（main.ts） ====================
 *
 * 启动流程：
 *   1. 注册全局样式
 *   2. 注册插件（Element Plus → Pinia → Router）
 *   3. 加载路由（根据 appConfig.route.useDynamicRoutes 决定静态/动态）
 *   4. 安装路由守卫（仅鉴权）
 *   5. 挂载 DOM
 */

// ==================== 全局样式引入 ====================
import 'element-plus/dist/index.css'
import './assets/css/variables.css'
import './assets/main.scss'
import './assets/css/page.scss'

// ==================== Vue 核心 ====================
import { createApp } from 'vue'
import App from './App.vue'

// ==================== 插件 ====================
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import ElementPlus from 'element-plus'

// ==================== 路由 ====================
import router from './router'
import { setupRouterGuard } from './router/guard'
import { usePermissionStore } from './stores/permission'

const app = createApp(App)

app.use(ElementPlus, { zIndex: 3000 })

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

app.use(router)

// 应用启动时立即加载路由（根据 appConfig.route.useDynamicRoutes 配置）
await usePermissionStore().generateRoutes()

setupRouterGuard(router)

app.mount('#app')
