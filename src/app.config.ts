/**
 * ==================== 应用全局配置 ====================
 *
 * 所有项目级配置集中在此文件，修改后全局生效。
 * 这是框架的核心配置文件，用于控制路由模式、布局、应用信息等。
 *
 * 使用方式：
 *   import { appConfig } from '@/app.config'
 *   if (appConfig.route.useDynamicRoutes) { ... }
 *
 * 设计原则：
 *   - 单一配置源：所有配置项集中管理，避免分散在各处
 *   - 类型安全：通过 TypeScript 接口约束配置项类型
 *   - 可扩展：新增配置项只需追加字段，不影响已有代码
 */

// ==================== 应用基本信息 ====================
/** 应用名称（显示在浏览器标题栏、登录页等） */
export const APP_TITLE = '通用管理框架'

/** 应用 Logo 旁的文字（Header 左侧显示） */
export const APP_LOGO_TEXT = '通用管理框架'

/**
 * 运行时首页路径（可被后端返回的角色 home 字段覆盖）
 *
 * 初始值为 '/home'，动态路由模式下 generateRoutes() 会用后端返回值更新它。
 */
let _homePath = '/home'

/** 更新运行时首页路径（仅供 permission store 在动态路由模式下调用） */
export function setHomePath(path: string) {
  _homePath = path
}

// ==================== 应用全局配置对象 ====================
export const appConfig = {
  // ==================== 应用信息 ====================
  app: {
    /** 应用标题 */
    title: APP_TITLE,
    /** Logo 旁文字 */
    logoText: APP_LOGO_TEXT,
    /**
     * 默认首页路径（可配置，动态路由模式下可被后端覆盖）
     *
     * 用户登录后或访问 / 时跳转到此路径。
     * 修改此处即可更换默认首页，如改为 '/dashboard'。
     *
     * 动态路由模式下：generateRoutes() 会自动用后端返回的 home 字段覆盖此值，
     * 使得不同角色的用户看到不同的首页。
     *
     * 注意：/home 路由始终存在于路由表中作为兜底，不受此配置影响。
     */
    get homePath(): string {
      return _homePath
    },
  },

  // ==================== 路由 & 权限配置 ====================
  route: {
    /**
     * 是否启用动态路由（权限模式）
     *
     * 无论哪种模式，staticMenus（首页等公共菜单）始终保留在侧边栏中。
     * 此开关只控制"动态部分"菜单的数据来源。
     *
     * 最终菜单 = staticMenus（始终保留） + 动态部分（见下方说明）
     *
     * true  → 【动态权限模式】
     *         【动态部分】从后端 API 获取（调用 fetchMenus()），
     *         后端根据用户角色返回不同的菜单树。
     *         适用于：多角色后台系统，不同用户看到不同菜单。
     *
     * false → 【静态路由模式】
     *         【动态部分】从前端 menus.ts 中的 dynamicMenuList 数组读取，
     *         所有用户看到的菜单一致。
     *         适用于：单角色后台、无权限需求、或纯前端项目。
     *
     * 两种模式的切换只需修改此处，其余代码自动适配。
     */
    useDynamicRoutes: false,
  },

  // ==================== 布局配置 ====================
  layout: {
    /**
     * 布局模式（静态配置，运行时不可切换）
     *
     * 'sidebar-nav'       → 垂直侧边栏（单列，可折叠）
     * 'sidebar-mixed-nav' → 双列侧边栏（左侧图标列 + 右侧展开列）
     *
     * 修改后重新启动即可生效。
     */
    mode: 'sidebar-mixed-nav' as 'sidebar-nav' | 'sidebar-mixed-nav',
  },

  // ==================== 通知中心配置 ====================
  notice: {
    /**
     * 是否启用 SSE 实时通知（铃铛组件）
     *
     * true  → Header 右侧显示通知铃铛，组件挂载时自动建立 SSE 连接
     *         SSE 端点：GET /userInfo/notice/sse
     *         标为已读：POST /userInfo/notice/read
     *
     * false → 不显示铃铛，不建立 SSE 连接（默认值，按需开启）
     */
    enableSSE: false,
  },

  // ==================== 标签页配置 ====================
  tabbar: {
    /**
     * 是否显示标签页栏
     *
     * true  → 显示标签页（推荐开启，提升多页面切换体验）
     * false → 隐藏标签页，主内容区直接显示页面（类似传统单页应用）
     */
    showTabbar: true,

    /**
     * 固定标签的路径列表
     *
     * 这些标签不可关闭，始终显示在最左侧。
     * 默认将首页设为固定标签。
     * 可根据项目需求添加更多固定路径。
     */
    affixPaths: ['/home'] as readonly string[],
  },
} as const

/**
 * ==================== 环境变量访问封装 ====================
 *
 * Vite 环境变量通过 import.meta.env 访问，变量名必须 VITE_ 开头。
 * 封装为统一的 env 对象，方便在其他模块中使用时获得类型提示。
 *
 * 扩展方式：在 .env.development / .env.production 中新增变量，在此处追加即可。
 */
export const env = {
  /** API 基础地址 */
  get apiBaseUrl(): string {
    return import.meta.env.VITE_API_BASE_URL || ''
  },
  /** 当前是否为开发模式 */
  get isDev(): boolean {
    return import.meta.env.DEV
  },
  /** 当前是否为生产模式 */
  get isProd(): boolean {
    return import.meta.env.PROD
  },
  /** 应用部署基础路径（通常为 '/'） */
  get baseUrl(): string {
    return import.meta.env.BASE_URL
  },
}
