---
name: yao-geo-page-blueprint
description: GEO 页面蓝图方法（移植自 yao-geo-skills，适配版）。当需要把页面目的、目标问题、品牌事实、用户路径和转化目标落成可实施的页面结构方案时使用。
metadata:
  ported_from: https://github.com/yaojingang/yao-geo-skills (MIT)
  ported_at: 2026-10-09
  adapted: 输出简化为 Markdown；四格式渲染移除；Schema/CMS 部分对齐 seo-agent references
---

# yao-geo-page-blueprint（适配版）

配套：`seo-agent/workflows/page-blueprint.md`（流程编排）、`seo-agent/references/schema-by-page-purpose.md`、`seo-agent/references/geo-citability.md`、`seo-agent/references/google-currency.md`。

## 使用场景

- 把目标内容、目标问题、品牌知识、用户路径和转化目标，落成 GEO 友好的页面方案
- 页面类型：产品页、专题页、文章页、榜单页、对比页、科普页、知识库页、案例页、FAQ 页
- 页面要同时服务 AI 抓取/抽取、真实用户阅读与转化
- 交付物含 HTML 语义结构、Schema 建议、前端/CMS 字段清单

## 不适用

- 全站品牌/竞品/信源/平台采样诊断 → 用 `workflows/audit.md` 或 `workflows/ai-visibility.md`
- 只写文章/标题/内容改写，不需要页面落地方案 → 不适用

## 推荐信息架构

1. 输入、假设与边界
2. 首屏直接答案（普通文本段落，40-60 词）
3. 结构化摘要
4. Query fan-out 子问题覆盖
5. 核心事实卡（原子事实）
6. 判断框架
7. 对比表（表前声明口径）
8. 实体关系与知识图谱字段
9. 证据区与来源台账
10. AI 可抽取模块
11. FAQ（高价值问题中前段放置）
12. 案例或证明
13. 用户转化模块（CTA 不干扰答案与证据区）
14. HTML、Schema、CMS 与实施验收
15. 移动端与无障碍建议
16. 结尾摘要

## 分析维度（必答）

| 维度 | 必答问题 | 产物 |
|------|---------|------|
| 目标与边界 | 服务哪个目标问题、用户路径、转化动作、合规边界？ | 输入假设表、风险边界 |
| Query fan-out | 还会问哪些定义/对比/价格/风险/实施/替代问题？ | 子问题矩阵、模块映射 |
| 平台适配 | 国内 AI 平台分别需要哪些结构信号？ | 平台适配表 |
| 内容事实 | 哪些可写、哪些不能写、哪些必须引用来源？ | 事实卡、证据台账 |
| 实体关系 | 品牌/产品/场景/竞品/案例之间什么关系？ | 实体关系表、`@id` 建议 |
| 页面架构 | 模块顺序、首尾复述、信息密度如何服务抽取和转化？ | 信息架构、模块合同 |
| 抽取单元 | 哪些内容可独立抽取且上下文无关？ | 键值对、步骤、表格、FAQ、摘要 |
| Schema 与 HTML | 正文事实如何映射到语义标签与 Schema 候选？ | HTML 样例、字段来源 |
| 体验与可访问性 | 菜单、标题、锚点、移动端如何稳定阅读？ | 标题层级、移动布局 |
| 落地与验收 | 开发/CMS/内容/合规如何验收？ | 字段清单、验收清单 |

## 研究驱动规则

- GEO 可见性要求答案、事实、数据、来源、上下文并存
- 长上下文位置偏置 → 关键信息靠前并在结尾复述
- RAG 证据可追溯 → 结论附近放来源、日期、字段来源
- 结构化特征 → 同时设计宏观顺序、模块切块、字段级强调
- Schema 只描述正文已有事实（不编造评分/价格/资质/评价）
- 生成式 AI 搜索会扩展相关查询 → 覆盖主问题与合理 fan-out 子问题
- 数据模式声明：`provided-source-pack / assisted-web-research / ai-answer-sample / synthetic-planning`；没有真实来源时必须标注方案假设与待核实清单

## 校验清单

- 首屏不能只有营销口号：直接答案 + 关键事实 + 摘要
- 报告须系统说明输入边界、fan-out、实体关系、证据、Schema、CMS、验收
- 需要真实数据时先建来源包与核验日期；无来源标假设，不把模型记忆写成事实
- FAQ 不能只在页底；高价值问题进入中前段
- HTML 语义清楚：表格/问答/步骤/事实卡不靠视觉卡片表达
- Schema 不越界；FAQPage 不承诺 Google 富结果（真实单问题问答页用 QAPage）
- 证据区含来源、页面位置、核验日期、用途
- 交付前自检（见 `seo-agent/workflows/page-blueprint.md` 校验清单）
