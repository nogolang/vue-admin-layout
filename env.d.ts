/**
 * ==================== Vite 客户端类型声明 ====================
 *
 * 声明 Vite 特有的类型，使 TypeScript 能识别 import.meta.env 等 Vite API。
 *
 * 作用：
 *   1. 让 TypeScript 识别 import.meta.env.VITE_XXX 环境变量
 *   2. 支持静态资源导入（如图片、JSON 文件等）的类型推断
 *   3. 支持 HMR API（hot module replacement）的类型
 *
 * commonjs: 此文件是纯粹的类型声明文件，不产生任何 JavaScript 输出
 */
/// <reference types="vite/client" />
