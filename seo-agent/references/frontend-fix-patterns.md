# 前端项目修改模式库

> 用途：`workflows/fix-design.md` 生成具体修改设计时，按目标项目技术栈查本文件的修改模式；`workflows/audit.md` 的 F 维代码扫描对照本文件定位问题。
> 原则：**只描述"改哪里 + 改什么方向"**（文件路径、机制、注入点），不写完整实现；片段 ≤30 行伪代码/示意。本文件是模式库，不代替目标项目的实际技术调研。

---

## 1. 技术栈识别 → 修改入口速查

| 栈 | 识别信号（package.json / 文件） | head 机制 | 路由/渲染 | sitemap/robots 入口 |
|----|-------------------------------|----------|----------|-------------------|
| Next.js App Router | `next` + `app/` 目录 | `app/**/layout.tsx` / `page.tsx` 的 `metadata` / `generateMetadata()` | RSC/SSR/SSG/ISR | `app/sitemap.ts`、`app/robots.ts` 或 next-sitemap |
| Next.js Pages Router | `next` + `pages/` 目录 | `next/head` 组件 / `next-seo` | SSR/SSG/ISR/CSR | `next-sitemap` / `public/robots.txt` |
| Nuxt 3/4 | `nuxt` | `useSeoMeta()` / `useHead()`（页面/布局/`nuxt.config.ts`） | SSR/SSG/混合 | `@nuxtjs/sitemap` 模块 / `public/robots.txt` |
| React SPA（Vite/CRA） | `react` + `vite`/`react-scripts`，单一 `index.html` | `react-helmet-async` / `react-helmet`，或静态 `index.html` | 纯 CSR | `vite-plugin-sitemap` 等插件 / 手工 `public/` |
| Vue SPA | `vue` + `vite`，`index.html` | `@unhead/vue` / `vue-meta` | 纯 CSR（或 vite-ssg） | 插件 / 手工 |
| Astro | `astro` | 布局组件 `.astro` + frontmatter | SSG（默认）/ SSR | `@astrojs/sitemap` 集成 / `public/robots.txt` |
| 静态 HTML | 手写 `.html` | 直接改 HTML | 静态 | 手工生成 sitemap.xml |
| 服务端模板（Blade/Thymeleaf/EJS/JSP 等） | 模板目录 | layout 模板的 `<head>` 区块 | SSR | 服务端路由/控制器生成 |

> 若目标项目有 `.codegraph/`，用 codegraph 工具定位 head 组件、路由注册、layout 组件；样式关联问题用 `.cssgraph/` + cssprobe-agent。

---

## 2. 通用修改模式（按问题类型）

### 2.1 每页唯一 title / description

| 栈 | 修改入口 | 说明 |
|----|---------|------|
| Next.js App Router | 页面 `metadata` 导出或 `generateMetadata()`（读路由参数/数据） | 动态页从数据源生成；根 layout 只放 `title.template` |
| Next.js Pages | `next-seo` 的 `<NextSeo>` 或 `next/head` | 在页面组件中按数据设置 |
| Nuxt | `useSeoMeta({ title, description })` 页面级 | `nuxt.config.ts` 里 `app.head.titleTemplate` |
| React SPA | `react-helmet-async` 的 `<Helmet>` 包在页面组件；**或**改造为预渲染 | 纯 SPA 下 JS 注入的 title 对弱渲染抓取有效性问题（见 §3） |
| Astro / 静态 | layout frontmatter → `<title>` | 静态生成天然每页唯一 |
| 服务端模板 | layout 占位变量 → 控制器填充 | 检查是否有全局写死的 title |

### 2.2 canonical / hreflang

- 定位：与 title 同一 head 管理层；列表页分页需自引用 canonical + 可抓取分页链接
- 检查 **raw HTML 与 JS 渲染结果一致**（2025-12 Google 更新：不一致时 Google 可能任选；canonical 必须服务端输出）
- 多语言：每语言版本输出完整 hreflang 组（含自引用 + x-default）；SPA 站建议由预渲染/SSR 输出

### 2.3 robots / sitemap

| 栈 | 修改入口 |
|----|---------|
| Next.js App Router | `app/robots.ts`、`app/sitemap.ts` 动态生成（从路由/数据源取 URL，杜绝手工失同步） |
| Next.js Pages | `next-sitemap` 配置 `postbuild`；robots 用 `public/robots.txt` 或插件 |
| Nuxt | `@nuxtjs/sitemap` + `nuxt.config.ts` robots 配置 |
| SPA / 静态 | 构建插件（`vite-plugin-sitemap` 等）或从路由表生成脚本 |
| 服务端 | 控制器/中间件动态生成；或构建期脚本 |

- sitemap 只含**可索引** URL（200 且非 noindex）；robots.txt 声明 sitemap 地址
- 环境隔离：确保 staging 的 `Disallow: /` / noindex 不进入生产构建（env 变量区分）

### 2.4 JSON-LD 结构化数据

- **注入点选择**：优先服务端输出（RSC/SSR/SSG/模板渲染），避免纯 JS 注入（Google 可能延迟处理；多数 AI 爬虫不执行 JS）
- 通用组件模式：`<script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(schema)}} />`（React）；Vue/Nuxt 用 `useHead({ script: [{ type: 'application/ld+json', innerHTML: ... }] })`；Astro/模板直接内联
- 组织方式：`@id` 组网（Organization `#org` ← WebSite `#website` ← WebPage ← Article/Product）
- 数据来源：schema 数据必须来自页面实际数据（props/查询结果），与可见正文一致
- 按页面目的选类型 → 查 `schema-by-page-purpose.md`

### 2.5 渲染模式（CSR 内容不可见问题）

| 现状 | 修改方向 |
|------|---------|
| 纯 CSR SPA，公开内容页 | ① 迁移 SSR/SSG（Next/Nuxt/Astro 重写成本高时）；② 预渲染（prerender）公开路由为静态 HTML；③ 至少保证 title/meta/canonical/JSON-LD 在构建后静态注入 |
| SSR 框架但 head 靠客户端 useEffect | 移到框架的服务端 head API（generateMetadata / useSeoMeta） |
| 动态渲染（按 UA 分流） | 按技术债处理，长期迁移 SSR/SSG（Google 明确定性为 workaround） |
| hash 路由（`#/`） | 迁移 history 路由；hash 部分不被当作独立页面 |

### 2.6 图片

- LCP 图（首屏主图）：**不懒加载**、`fetchpriority="high"`、预加载关键图
- 所有图：显式 width/height（防 CLS）、alt 描述内容、现代格式（WebP/AVIF）、响应式 srcset
- Next.js 用 `next/image`（注意配置 `priority`）；Nuxt 用 `NuxtImg`；其他用构建插件（vite-imagetools 等）

### 2.7 内链与导航

- 关键页面从首页 ≤3 点击可达；面包屑组件输出 `BreadcrumbList`
- 锚文本描述性（避免"点击这里"）；列表页输出可抓取 `<a href>`
- 页脚导航可补充重要页面内链

---

## 3. 代码层风险 → 修改方向映射（与审查清单 F 维对应）

| 审查发现（F 维） | 修改方向 | 典型变更组大小 |
|-----------------|---------|--------------|
| F1 CSR-only 关键内容 | 渲染模式迁移或预渲染（§2.5） | L（跨页面改造） |
| F2 head 硬编码 | 引入 head 管理层（§2.1），按路由/数据注入 | M（逐模板改造） |
| F3 meta 由 JS 注入 | 迁移到服务端 head API（§2.1/§2.4） | M |
| F4 sitemap/robots 手工维护 | 动态生成（§2.3） | S-M |
| F5 hash 路由 | history 路由迁移 + 服务器 fallback 配置 | M-L |
| F6 首屏 LCP 图懒加载 | 标记 priority/不懒加载（§2.6） | S |
| F7 无 hreflang | head 层输出 hreflang 组（§2.2） | M |
| F8 环境变量串环境 | 构建配置区分 + 验证脚本 | S |

成本标尺（沿用 yao 方法）：**S** 0.5-1 人日（字段/meta/schema 修补）；**M** 2-4 人日（模板/组件/CMS 字段调整）；**L** 5-10 人日（跨页面模板/架构/数据源改造）。

---

## 4. 修改设计的输出要求（交给 fix-design 工作流）

每个变更组必须包含：

1. **问题来源**：引用审查报告条目编号（如 A5 / B3）
2. **目标文件**：精确到路径（如 `app/layout.tsx`、`src/pages/product/[id].vue`）——需实际读目标项目确认，不得猜测
3. **修改方式**：机制说明 + 示意片段（≤30 行，不写完整实现）；说明数据从哪来
4. **依赖关系**：与其它变更组的先后顺序
5. **验证方法**：可复测命令或检查点（如 `curl -s URL | grep canonical`、富结果测试）
6. **风险与兼容性**：影响面（模板公共组件？多语言？缓存策略？）

**硬规则**：本 agent 只出设计，不改代码；目标文件路径必须经过实际代码检索确认（codegraph/read），禁止凭框架惯例臆断路径。
