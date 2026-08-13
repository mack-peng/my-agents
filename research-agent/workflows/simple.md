# 简单搜索流程

单轮 Google 搜索 → 抓取前几篇 → LLM 整理。适合快速查一个事实、定义、数据或列表。

## 触发条件
- 用户说 "查一下/搜一下/快速搜索" + 具体关键词
- 明显不需要多轮分析的简单问题
- 用户给了一个很具体的搜索词

## 执行流程

执行方由 `USE_FIRECRAWL` 配置控制。**不直接调用底层 CLI**：先 read 对应 agent 的 AGENTS.md，按其快捷命令执行。

### Firecrawl 模式（`USE_FIRECRAWL=true`）

#### Step 1: 搜索+抓取
委托 firecrawl-agent：read `firecrawl-agent/AGENTS.md`，按「Search（网页搜索）」快捷命令一条完成搜索 + 抓取全文（带 `--scrape --scrape-formats markdown`，`--limit 5`，`--json`）。正文为空的条目用 webfetch 兜底抓取。

#### Step 2: 整理
- LLM 根据返回的 markdown 正文直接回答
- 格式：简洁直接，引用来源
- 如果信息不够，主动提示用户是否需要深度调研

---

### 浏览器模式（`USE_FIRECRAWL=false`，默认）

#### Step 1: 搜索
委托 browser-agent：read `browser-agent/AGENTS.md`，按其工作流打开 Google、输入关键词、执行搜索并 snapshot 结果列表。

#### Step 2: 提取
从 snapshot 中提取前 3-5 条结果的标题、URL、摘要。

#### Step 3: 抓取
用 webfetch 逐个抓取感兴趣的结果（webfetch 不可用时委托 browser-agent goto + snapshot 兜底）。

#### Step 4: 整理
- LLM 根据抓取内容回答用户问题
- 格式：简洁直接，引用来源
- 如果信息不够，主动提示用户是否需要深度调研

## 输出
简要回答 + 来源链接，不生成完整报告。
