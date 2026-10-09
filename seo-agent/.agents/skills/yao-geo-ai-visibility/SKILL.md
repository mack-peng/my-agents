---
name: yao-geo-ai-visibility
description: AI 平台可见性采样协议（综合移植自 yao-geo-skills 的 deepseek/doubao/chatgpt crawler，适配版）。当需要在真实 AI 平台按问题集重复采样，测量目标实体提及率、位置、竞品对比与引用来源结构时使用。
metadata:
  ported_from: https://github.com/yaojingang/yao-geo-skills (MIT; yao-deepseek-crawler / yao-doubao-crawler / yao-chatgpt-crawler)
  ported_at: 2026-10-09
  adapted: 执行栈从 OpenCLI Browser Bridge 改为 browser-agent；移除 Node/Python 脚本与 Excel/HTML 报告；低频人工采样节奏
---

# yao-geo-ai-visibility（适配版）

配套：`seo-agent/workflows/ai-visibility.md`（流程编排）、`seo-agent/templates/ai-visibility-report.md`。

## 用途

在真实 AI 平台（DeepSeek / 豆包 / ChatGPT / 千问 / Kimi / 元宝）按问题集**重复采样**，聚合分析目标实体（人/公司/产品）的：
- 提及率、平均提及次数
- Top 1 / Top 3 / Top 5 概率、平均排名
- 引用来源结构（域名、官方 vs 第三方）
- 同类型竞品对比
- 基于观测的优化线索

## 输入

- 问题集（每行一个；建议 10-20 个；来自 `yao-geo-intent-miner` 或用户提供）
- 重复轮数（每问题建议 ≥5）
- 目标实体 + 别名清单（`实体名|别名A|别名B` 格式）
- 实体类型（person / company / product；竞品必须同类型过滤）
- 平台与浏览器登录态（browser-agent）

## 执行流程（browser-agent 版）

1. **预检**：`read browser-agent/AGENTS.md`；打开平台确认登录态；未登录 → 请用户登录后 `state-save`
2. **逐样本采样**：问题 × 轮数，每样本：
   - 新建对话（fresh window，避免上下文污染）
   - 中文自然问法提交
   - 等待完整回答，记录：平台/问题 ID/轮次/日期/回答全文/目标是否提及/提及位置/引用来源（标题+URL）/竞品出现
   - 失败样本保留（`ok=false` + 原因）；分母保持 N
3. **延迟规则**：低频人工节奏；同一平台样本间留间隔；错峰采样；不做高频自动化
4. **聚合分析**：提及率、Top 概率、平均排名、来源结构、竞品对比（单位：有效样本；失败单列）
5. **报告**：按 `seo-agent/templates/ai-visibility-report.md` 输出 Markdown；raw 数据存同目录 `-raw/`

## 记录字段（每样本）

```
platform / question_id / round / answer_date / ok / answer_text /
target_mentioned / target_position / citations[{title,url,domain}] /
competitors_seen[] / fail_reason
```

## 硬规则（Honest Boundaries）

- **不绕过**登录、验证码、风控、隐藏 API、网络流量或应用存储
- **平台 UI 易变**：采样失败记录阻塞原因，不伪造数据
- **概率 = 重复采样估计值**，不是平台真值；措辞"在 N 次采样中 X 次提及（估计值）"
- **不推断平台内部机制**：不宣传超出 Google AI optimization guide 的"AI 技巧"
- **保留原始证据**：回答全文、引用 URL、失败日志——每个结论可审计
- 竞品识别启发式结果需人工复核（别名、语义标签、排除的候选）
- 只分析平台实际展示的内容；**不声称**引用来源页面正确、完整或可达（如需页面真值，单独抓取核验）
