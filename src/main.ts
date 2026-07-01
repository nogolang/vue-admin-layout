import 'element-plus/dist/index.css'
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'

import App from './App.vue'
import router from './router'
import { setupRouterGuard } from './router/guard'

const app = createApp(App)

// Element Plus 全局配置
app.use(ElementPlus, { zIndex: 3000 })

// Pinia 必须在 router 之前注册（路由守卫中会用 store）
app.use(createPinia())
app.use(router)

// 注册路由守卫 —— 首次导航前加载动态路由
setupRouterGuard(router)

app.mount('#app')
