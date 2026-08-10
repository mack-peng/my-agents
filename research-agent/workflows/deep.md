# 深度调研流程

ReAct 模式的深度研究代理：LLM 驱动搜索决策，每轮根据已累积发现动态推理知识缺口，逐轮深化直到信息充分。适合需要综合分析、对比多个来源的复杂课题。

## 设计原则

- **知识缺口驱动** — 不预设搜索计划，每轮审查全量 findings+topics 后动态决定下一步
- **双层 LLM 分工** — 搜索决策 LLM（精确、低温度 0.3） + 报告生成 LLM（创造性、高温度 0.7）
- **结构化决策输出** — 每轮 LLM 输出 JSON，容错解析，防止格式偏差导致流程中断
- **防重复搜索** — 每轮决策前显式审查已搜主题，禁止重复
- **流式进度反馈** — 每轮结束即时告知用户进度和新发现
- **灵活终止** — LLM 自主判断 shouldContinue，max_depth 仅作安全兜底

## 执行流程

### Phase 0: 入场准备
1. 读取用户提供的调研主题
2. 读取 `DEFAULT_DEPTH` 环境变量（默认 3）作为最大搜索轮数
3. 初始化状态：
   - `findings: []` — 所有轮次的发现（完整文本，不截断）
   - `topics: []` — 已搜索的关键词
   - `urls: []` — 已抓取的 URL
   - `round: 0` — 当前轮次计数

### Phase 1: 首轮搜索启动

直接进入搜索，不预先拆解维度（维度应在搜索过程中动态生成和调整）。

#### 1.1 生成首轮搜索词
- LLM 基于用户问题，生成 2-3 个初始搜索词
- 规则：覆盖核心概念的不同表述，互为补充而非重复
- 搜索词加入 `topics[]`

#### 1.2 执行搜索
```bash
playwright-cli open https://www.google.com --headed
playwright-cli snapshot
playwright-cli fill "input[name=q]" "<搜索关键词>"
playwright-cli press Enter
playwright-cli snapshot
```

#### 1.3 提取 & 抓取
- 从 snapshot 提取结果：标题、URL、摘要
- 用 webfetch 抓取前 `MAX_RESULTS_PER_QUERY` 篇全文
- 将本轮发现追加到 `findings[]`
- 将抓取的 URL 追加到 `urls[]`
- `round += 1`

### Phase 2: 动态迭代搜索（ReAct 循环）

每轮执行以下步骤，直到终止条件满足：

#### 2.1 搜索决策（LLM — 低温度 0.3）

将以下上下文完整提供给 LLM：
```
你是一个搜索决策代理。你需要基于已有的调研发现，分析知识缺口，决定下一步搜索方向。

## 当前状态
- 调研主题：{用户问题}
- 当前轮次：{round}/{DEFAULT_DEPTH}
- 已有发现（共 {N} 条，全文）：
{findings[] 全量内容，不截断}
- 已搜索主题：
{topics[]}

## 分析要求
1. 审查已有发现，识别哪些维度已充分覆盖
2. 识别知识缺口：哪些重要方面还没涉及？信息是否矛盾？数据是否过时？缺少反面观点？缺少实践案例？
3. 判断：基于已有发现是否能生成全面、高质量的报告？

## 输出要求
只输出一行 JSON，不要添加解释、代码块标记（```json```）或额外文本。

{"nextSearchTopic": "下一步搜索关键词", "shouldContinue": true/false, "reasoning": "一句话说明缺口"}

规则：
- shouldContinue 为 true 时，nextSearchTopic 必须与已搜索主题均不同（防重复）
- nextSearchTopic 需要具体、有针对性，不是宽泛词
- 如果信息充分，shouldContinue 设为 false，nextSearchTopic 设为 null
- 如果本轮已经是最后一轮（round==DEFAULT_DEPTH），shouldContinue 只能为 false
```

#### 2.2 解析决策 JSON

稳健解析 LLM 输出（参考 Dify app 解析逻辑）：
```
1. 去除所有代码块标记（```json, ```）
2. 在文本中提取第一个完整 JSON 对象
3. json.loads 解析
4. 容错：解析失败 → shouldContinue=false
```

提取 `nextSearchTopic` 和 `shouldContinue`。

#### 2.3 分支判断

- **shouldContinue == true 且 round < DEFAULT_DEPTH**：
  - 用 nextSearchTopic 执行搜索（复用 Step 1.2-1.3 的搜索逻辑）
  - `topics.push(nextSearchTopic)`
  - 将本轮发现追加到 `findings[]`
  - `round += 1`
  - **向用户流式反馈进度**："第 {round}/{DEFAULT_DEPTH} 轮搜索完成：{nextSearchTopic} — {本轮的简要发现}"

- **shouldContinue == false 或 round >= DEFAULT_DEPTH**：
  - 进入 Phase 3

### Phase 3: 综合报告（LLM — 高温度 0.7）

1. LLM 汇总所有 `findings`（全量上下文）
2. 按 `templates/report.md` 格式生成结构化报告
3. 写入 `output/{主题}-{YYYY-MM-DD}.md`
4. 输出最终统计："共 {N} 轮搜索、{M} 个来源，报告已保存至 output/{主题}-{YYYY-MM-DD}.md"

### Phase 4: 质量检查

- [ ] 报告包含所有必需章节（概述、核心发现、详细分析、结论、来源）
- [ ] 每个核心发现有一句话总结 + 支撑数据
- [ ] 来源链接完整可访问
- [ ] 覆盖多个维度/立场，无明显知识缺口
- [ ] 防重复有效：topics 列表无重复搜索词

## 终止条件（优先级从高到低）

1. LLM 判断信息充分，`shouldContinue=false` → **主要终止条件**
2. 搜索决策 JSON 解析失败 → 默认终止（容错）
3. 达到 `DEFAULT_DEPTH` 轮次 → 安全兜底
4. 用户手动中断 → 立即终止

## 注意事项
- 每次浏览器操作前先 snapshot 确认页面状态
- Google 可能弹出 cookie 弹窗，先用 snapshot 检查并处理
- 搜索关键词使用 Google 高级搜索语法时需转义
- 报告中的引用必须附带来源 URL
- 搜索决策 LLM 的 instruction 使用低温度（0.3），报告生成 LLM 使用高温度（0.7）
- findings 必须全量传给搜索决策 LLM，不要截断 — 信息越完整决策越准
