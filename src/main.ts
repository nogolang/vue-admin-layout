/**
 * ==================== 应用入口（main.ts） ====================
 *
 * 启动流程：
 *   1. 注册全局样式
 *   2. 注册插件（Element Plus → Pinia → Router）
 *   3. 加载路由（由 appConfig.route 控制数据来源和加载时机）
 *   4. 安装路由守卫（鉴权 + 路由就绪检查）
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

// ==================== 路由 & 配置 ====================
import router from './router'
import { setupRouterGuard } from './router/guard'
import { usePermissionStore } from './stores/permission'
import { appConfig } from './app.config'

const app = createApp(App)

app.use(ElementPlus, { zIndex: 3000 })

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

// 先加载动态路由，再注册 router，否则 app.use(router) 触发初始导航时
// 动态路由尚未注入，页面刷新后会命中 404 通配符
if (appConfig.route.loadRoutesOn === 'startup') {
  await usePermissionStore().generateRoutes()
}

app.use(router)

setupRouterGuard(router)

app.mount('#app')
