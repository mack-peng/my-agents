# 页面目的 → Schema 选型对照

> 来源：蒸馏自 claude-seo `schema-types`（MIT）+ yao-geo-skills `schema-html-cms-contract`（MIT）。核对日期 2026-10-09。
> 时效性前提：任何选型前先读 `google-currency.md` §1 废弃账本，本页只列**当前有效**结论。

---

## 1. 页面目的 → 主 Schema 映射

| 页面目的 | 主类型 | 配套类型 | 关键必填属性 | 注意事项 |
|---------|--------|---------|-------------|---------|
| 首页 / 品牌站 | `Organization` 或 `WebSite` | `WebPage`、`BreadcrumbList` | Organization: name/url/logo；WebSite: name/url | 放在首页，不必每页重复；用最具体子类型（电商用 OnlineStore，本地商家用 LocalBusiness） |
| 关于我们 | `AboutPage` + `Organization` | `Person`（团队） | name/url | Organization 事实与正文一致 |
| 产品页 | `Product` | `Offer`、`AggregateRating`、`Review`、`Brand` | name/image/offers.price/offers.priceCurrency | **绝不编造**价格/评分/库存；变体商品用 `ProductGroup` + variesBy/hasVariant |
| 服务页 | `Service` | `Offer`、`Organization` | name/provider/areaServed | 服务边界、地域限制写进正文并映射 schema |
| 文章 / 博客 | `Article` 或 `BlogPosting` | `Person`（作者）、`Organization`（publisher）、`ImageObject` | headline/image/datePublished/author | dateModified 用真实更新时间；作者页可用 `ProfilePage`+Person 强化 E-E-A-T |
| 新闻 | `NewsArticle` | 同上 | 同上 | 时效性最强；署名与日期必须醒目 |
| 帮助中心 / 文档 | `TechArticle`（Article 子类） | `BreadcrumbList` | headline/author/datePublished | 步骤用有序列表 + 代码块；FAQ 内容可保留但 schema 价值限于非 Google 消费方 |
| FAQ 页 | `FAQPage`（可保留）或 `QAPage` | — | 真实可见问答 | FAQPage **无 Google 富结果**（2026-05-07 退役）→ 标 Info；真实用户问答单问题页用 QAPage |
| 问答 / 社区 | `QAPage` + `Question` | `DiscussionForumPosting` | mainEntity、acceptedAnswer | QAPage 仍受支持（含评论线程属性） |
| 论坛帖子 | `DiscussionForumPosting` | `Comment` | headline/text/author/datePublished | 多页论坛后续页含原帖及主页 URL |
| 面包屑 | `BreadcrumbList` | — | itemListElement（position/name/item） | 页面上必须有可见面包屑，不伪造层级 |
| 评价 / 测评 | `Review` + 被评对象 | `Reviewer`、`Rating` | reviewRating/author/itemReviewed | 必须有真实评价主体与评价内容 |
| 评分摘要 | `AggregateRating` | — | ratingValue/reviewCount/bestRating | 仅真实聚合数据；假评价 2026-07-24 起明确违规 |
| 活动 | `Event` | `Place`、`Offers`、`Organization` | name/startDate/location | 支持取消/改期状态（eventStatus） |
| 招聘 | `JobPosting` | `Organization`、`Place` | title/description/datePosted/hiringOrganization/jobLocation | `baseSalary` 用于薪资；EstimatedSalary 已退役 |
| 课程 | `Course` + `CourseInstance` | `Organization` | name/description/provider | Course Info 已退役；**Course list**（Course + ItemList 轮播）仍支持 |
| 视频页 | `VideoObject` | `ImageObject` | name/description/thumbnailUrl/uploadDate + contentUrl 或 embedUrl | LearningVideo 已退役，统一用 VideoObject；creator 建议填写 |
| 图片内容 | `ImageObject` | — | contentUrl | 创作者/版权信息加分 |
| 软件 / App | `SoftwareApplication` 或 `WebApplication` | `Offer`、`AggregateRating` | name/applicationCategory/operatingSystem（桌面）或 browserRequirements（Web） | SaaS 用 WebApplication |
| 作者 / 团队页 | `ProfilePage` | `Person` | mainEntity(Person)/name/url | Person 配 sameAs 强化实体 |
| 本地商家 | `LocalBusiness`（子类型更佳） | `OpeningHoursSpecification`、`GeoCoordinates`、`PostalAddress` | name/address/telephone | 多门店每店独立页面 + 独立标记 |
| 电商商品列表 | `ItemList` | — | itemListElement | 列表页只列条目，详情页承载 Product |
| 数据集 | `Dataset` | — | name/description | **仅 Dataset Search 消费**，无 Google Search 富结果；不要以富结果为由推荐 |
| 教育测验 | `Quiz` + `Question` | — | eduQuestionType=Flashcard | Education Q&A 仍支持；PracticeProblem 已退役 |
| 会员/忠诚计划 | `LoyaltyProgram` | — | — | 2025-06 新增；商家政策（退货/配送）嵌套在 Organization 下 |

## 2. 页面目的 × GEO 可抽取模块（与 schema 配套）

| 页面目的 | 优先 AI 可抽取模块 | 对应 schema 支撑 |
|---------|-------------------|-----------------|
| 首页 | 一句话定位（"X 是……"）、核心事实卡、客户/案例证据、服务边界 | Organization、WebSite |
| 产品页 | 键值对规格表、对比表、价格/交付方式、FAQ、适用/不适用人群 | Product、Offer、Review |
| 文章页 | 结论前置摘要、问题式 H2、要点列表、一手法据、更新日期 | Article、Person、ImageObject |
| 帮助中心 | 步骤序列、前置条件、错误码表、版本号、可复制代码 | TechArticle、BreadcrumbList |
| 对比页 | 同口径对比表（表前声明口径）、选型判断框架、替代方案边界 | Product/Service + ItemList |
| 落地页 | 首屏直接答案、资质证据、CTA（不干扰答案区） | Organization、Service |

## 3. 页面类型 × 结构化契约（HTML 语义）

- 主内容 `<main>`；核心内容 `<article>` 或明确 `<section>`
- 首屏直接答案：普通文本段落（不放图片/动画里）
- 事实卡：`<dl>`、`<table>` 或带字段名的结构（不用无语义视觉卡片）
- 对比/榜单：必须 `<table>` 或等价结构，表前说明比较口径
- FAQ：真实可见问答，不做隐藏折叠脚本专属内容
- 证据区：来源名称、URL/文档名、核验日期、页面用途
- 多 schema block：稳定 `@id` 互相关联，避免孤立片段互相矛盾

## 4. 校验清单（任何 schema block）

1. `@context` = `"https://schema.org"`（非 http）
2. `@type` 是有效且未废弃类型（对照 `google-currency.md`）
3. 所有必需属性齐全；值类型正确
4. 无占位符文本（如 `[Business Name]`）
5. URL 全部绝对地址；图片 URL 有效
6. 日期 ISO 8601
7. **schema 事实 ⊆ 页面可见正文事实**（最硬的规则）
8. 校验工具：Google Rich Results Test / Schema.org Validator（注意：已退役类型在这些工具里已不可验证）

## 5. 常见错误模式

| 错误 | 修正 |
|------|------|
| 全站共用一套 Organization（每页重复） | Organization 只放首页/关于页；其他页面用 WebPage + `@id` 引用 |
| Product 标注了页面上没有的价格/评分 | 删除或补全正文 |
| 用 FAQPage 博 Google 富结果 | 已无效（2026-05）；保留仅因内容价值，或改 QAPage |
| BreadcrumbList 层级与可见面包屑不一致 | 以可见面包屑为准 |
| Article 无 author/datePublished | 补全；YMYL 主题作者页不可省 |
| 多个孤岛 JSON-LD 实体 | 用 `@id` 组网：Organization `#org` ← WebSite `#website` ← WebPage ← Article |
