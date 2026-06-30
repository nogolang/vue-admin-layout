import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ mode})=>{
  //加载环境变量，在其他js里，我们直接使用import.meta.env.xxxx可以获取到
  //但是vite config里，必须要手动加载，因为执行时机的问题
  const env = loadEnv(mode, process.cwd(), 'VITE_') || {};

  return {
    //可以更好的调试
    build: {
      sourcemap: env.VITE_SOURCEMAP === 'true'
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/assets/css/variable.scss" as *;`,
          api: 'modern-compiler',
        }
      }
    },
    plugins: [
      vue(),
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server:{
      port:5100,

      //动态代理
      // proxy:{
      //     '^/api':{
      //         //目标地址，这里应该填写网关地址，axios的baseUrl直接写一个/api就好了
      //         target:'http://192.168.80.128:10001',
      //
      //         //允许跨域
      //         changeOrigin:true,
      //
      //         //重写路径,\/api意思是转义/符号
      //         rewrite:(path)=>path.replace(/^\/api/,'')
      //     }
      // }
    }
  }
})


