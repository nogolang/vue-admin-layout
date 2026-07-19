/**
 * ==================== Vite 构建配置 ====================
 *
 * 主要配置项说明：
 *   - css.preprocessorOptions.scss.additionalData → 全局注入 SCSS 变量（无需手动 import）
 *   - plugins.AutoImport  → 自动导入 Element Plus 组件和 API（无需 import { ElButton }）
 *   - plugins.Components  → 自动注册 Element Plus 组件（按需加载，减小打包体积）
 *   - resolve.alias['@']  → 路径别名 @ → src/（简化 import 路径）
 *   - server.port         → 开发服务器端口
 *   - server.proxy        → 开发代理（解决跨域问题）
 */
import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig(({ mode }) => {
  /**
   * 加载环境变量
   *
   * 为什么需要手动 loadEnv？
   *   vite.config.ts 的执行时机早于 Vite 加载 .env 文件，
   *   因此需要用 loadEnv 手动加载，否则 process.env / import.meta.env 获取不到自定义变量。
   *
   * 参数说明：
   *   - mode: 当前模式（development / production）
   *   - process.cwd(): 项目根目录
   *   - 'VITE_': 只加载以 VITE_ 开头的变量（安全考虑，防止敏感变量泄露）
   */
  const env = loadEnv(mode, process.cwd(), 'VITE_') || {}

  return {
    // ==================== 构建配置 ====================
    build: {
      // 根据环境变量控制 sourcemap（开发时开启方便调试，生产时关闭减小体积）
      sourcemap: env.VITE_SOURCEMAP === 'true',
    },

    // ==================== CSS 配置 ====================
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },

    // ==================== 插件 ====================
    plugins: [
      // Vue 3 SFC 编译插件
      vue(),

      /**
       * 自动导入 API（Composition API、工具函数等）
       *
       * 效果：无需手动写 import { ref } from 'vue'，直接使用 ref() 即可
       * ElementPlusResolver: 自动导入 Element Plus 的 API（如 ElMessage、ElLoading）
       *
       * 注意：
       *   auto-imports.d.ts 文件由该插件自动生成，已加入 .gitignore 的 *.local 规则或无需提交
       */
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),

      /**
       * 自动注册组件
       *
       * 效果：无需手动 import { ElButton } from 'element-plus' 并在 components 中注册
       * ElementPlusResolver: 自动按需导入 Element Plus 组件
       *
       * 注意：
       *   components.d.ts 文件由该插件自动生成，用于 TypeScript 类型提示
       */
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ],

    // ==================== 路径解析 ====================
    resolve: {
      alias: {
        // @ → src/  简化 import 路径
        // 例如：import { useLayoutStore } from '@/stores/layout'
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },

    // ==================== 开发服务器 ====================
    server: {
      port: 5100, // 开发服务器端口

      /**
       * API 代理配置（按需启用）
       *
       * 使用场景：前后端分离开发时，前端请求 /api/* 代理到后端服务器，解决跨域问题。
       *
       * 如何使用：
       *   1. 取消下方 proxy 配置的注释
       *   2. 将 target 修改为你的后端地址
       *   3. 在 axios 中将 baseURL 设置为空或 '/api'
       *
       * 示例：
       *   前端请求 /api/user/list → 代理到 http://localhost:8080/user/list
       */
      // proxy: {
      //   '^/api': {
      //     target: 'http://localhost:8080', // ← 替换为你的后端地址
      //     changeOrigin: true,               // 修改请求头中的 Origin
      //     rewrite: (path) => path.replace(/^\/api/, ''), // 去掉 /api 前缀
      //   },
      // },
    },
  }
})
