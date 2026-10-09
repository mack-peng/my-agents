---
name: yao-geo-page-audit
description: 页面 GEO 诊断方法（移植自 yao-geo-skills，适配版）。当需要诊断页面/小页面集合的可抓取性、结构规范、内容证据、AI 可抽取性与公开答案素材覆盖时使用。
metadata:
  ported_from: https://github.com/yaojingang/yao-geo-skills (MIT)
  ported_at: 2026-10-09
  adapted: 输出简化为 Markdown；执行栈为 firecrawl-agent / browser-agent；去脚本化
---

# yao-geo-page-audit（适配版）

配套：`seo-agent/workflows/audit.md`（流程编排）、`seo-agent/references/technical-seo-checklist.md`、`seo-agent/references/geo-citability.md`、`seo-agent/references/google-currency.md`。

## Job

给定目标 URL 或页面集合，诊断页面如何被搜索驱动的 AI 系统**发现、解析、引用、总结**。只分析公开页面可观测的素材与证据覆盖；**没有平台采样数据时，不评估** AI 平台召回、排名、引用份额或平台内部行为。

## 五阶段链路

```
发现 (Discovery) → 检索候选 (Retrieval candidate) → 正文抽取 (Main-content extraction) → 证据质量 (Evidence quality) → 生成引用 (Generated citation)
```

## 页面类型识别与抽样

- 首页：补充 1 个代表性一级页 + 1 个代表性二级页（说明选择依据）
- 栏目页：补充上级入口 + 1 个详情页（检查内链、面包屑、栏目摘要）
- 产品页：产品事实、适用对象、服务边界、价格/交付、FAQ、schema
- 文章页：标题层级、作者、更新时间、来源、引用、摘要、段落独立性
- 文档/帮助页：步骤、错误码、参数表、版本号、可复制代码

## 诊断维度

1. **可抓取性**：状态码、robots、canonical、meta robots、sitemap、移动渲染、JS 依赖
2. **结构规范性**：H1-H3、摘要、目录、FAQ、表格、列表、面包屑、内链、锚文本、schema
3. **内容信号**：实体全称、结论前置、数据、引用、案例、时间、作者、来源、价格、服务边界
4. **AI 可抽取性**：键值对、原子事实、对比表、步骤、问答、上下文无关摘要、段落独立性
5. **证据质量**：相关性、准确性、客观性、新鲜度、权威/责任归属、清晰度
6. **移动端与性能**：移动优先内容一致性、核心事实是否懒加载、首屏稳定、LCP/INP/CLS 复测
7. **可访问结构**：`main`、`article`、heading 顺序、链接文字、表格标题、图片 alt、焦点可见性
8. **实体与来源网络**：Organization、Product、SoftwareApplication、Person、sameAs、作者、编辑原则
9. **公开答案素材覆盖**：搜索结果、百科、资讯、公众号、帮助中心、文档页能否支撑高意图问题
10. **竞争与替代语义**：竞品页是否更容易回答目标问题；品牌页是否缺少"区别、限制、适用/不适用"表述

## 权威证据流程

1. 先记录页面观察（HTTP、HTML、schema、正文、移动/桌面差异）
2. 再补官方证据（官网、产品页、价格页、帮助中心、案例）
3. 再对齐标准（Google Search Central、Schema.org、WCAG、Web Vitals）
4. 最后引用研究（GEO、RAG、正文抽取、结构化信息抽取）
5. 无法验证的内容标为「输入缺口」或「需日志/CMS/平台采样验证」

证据标记：**观察 / 官方 / 标准 / 研究 / 推断 / 缺口**。

## 分析深度要求

- 每个核心问题说明：发现方式、页面证据、影响链路、修复动作、验收方式
- 每个页面至少 1 个"可抽取事实模块"建议（事实卡/对比表/FAQ/步骤表/来源台账）
- 每个 P0/P1 问题至少对应 1 条代码层或 CMS 字段层动作
- 中文答案场景必须给**目标问题示例**，不能只写"提升国内 AI 可见性"
- 无平台采样 → 只诊断公开答案素材完整性

## P0/P1 建议字段

问题、证据、影响、修复动作、示例代码或字段、负责人、预估成本、验收方式。

## 成本标尺

- **S**：0.5-1 人日（字段/文案/meta/schema 修补）
- **M**：2-4 人日（模板/CMS 字段/SSR/组件调整）
- **L**：5-10 人日（跨页面模板/信息架构/数据源改造）

## 边界（禁止事项）

- 无日志权限 → 只报告前台可观测证据，不推断日志级抓取频率
- 无平台采样 → 不分析平台召回/排名/答案频次/引用份额
- schema 不得声明正文没有的事实
- 区分「用户可见内容」「爬虫可读内容」「AI 可抽取内容」三者
- 重要结论必须标证据来源；来源不可得则标假设或缺口
- 不把"浏览器可见"等同"初始 HTML 可读"；不把"Google 可渲染"等同"所有抓取器可渲染"
