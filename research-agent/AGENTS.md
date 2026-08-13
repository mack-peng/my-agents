# Research Agent

独立的深度调研代理。搜索与抓取委托 browser-agent（浏览器模式）或 firecrawl-agent（Firecrawl 模式）执行，LLM 负责搜索决策与报告生成。**零外部依赖**，不需要任何 API Key。

## 触发规则

| 用户输入 | 模式 | 执行文件 |
|---------|------|---------|
| "调研" / "深度调研" / "研究一下" / "deep research" | **深度调研** | `workflows/deep.md` |
| "查一下" / "简单查" / "快速搜索" / "搜一下" | **简单搜索** | `workflows/simple.md` |
| 直接给一个 URL | **页面抓取** | webfetch 直接读 + LLM 总结 |

## 环境配置

复制 `.env.example` 为 `.env` 并按需修改：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DEFAULT_DEPTH` | 3 | 深度调研默认搜索轮数 |
| `MAX_RESULTS_PER_QUERY` | 3 | 每轮搜索抓取的文章数 |
| `SEARCH_ENGINE_URL` | `https://www.google.com` | 搜索引擎首页 |
| `REPORT_OUTPUT_DIR` | `output` | 报告输出目录 |
| `USE_FIRECRAWL` | `false` | 执行方选择：`true` 委托 firecrawl-agent，`false` 委托 browser-agent |

## 设计理念

采用 **ReAct（Reasoning + Acting）** 模式的深度研究代理：

- **知识缺口驱动** — 不预设搜索计划。每轮搜索后，LLM 审查所有已累积发现 + 已搜索主题，识别知识缺口，动态决定下一步搜索方向。搜索计划在执行过程中逐渐成形，而非提前固化。
- **双层 LLM 分工** — 搜索决策使用低温度（0.3）追求精确性；报告生成使用高温度（0.7）追求创造性和可读性。
- **结构化决策输出** — 每轮搜索决策输出 JSON `{nextSearchTopic, shouldContinue, reasoning}`，配合容错解析，防止 LLM 格式偏差导致流程崩溃。
- **灵活终止** — LLM 自主判断信息是否充分（`shouldContinue`），`DEFAULT_DEPTH` 仅作安全兜底，不做硬约束。

## 工具分工

搜索与抓取**不直接调用底层 CLI**，而是委托对应 agent 目录执行（先 read 其 AGENTS.md，按其快捷命令操作）。

| 执行方 | 用途 | 角色 |
|------|------|------|
| firecrawl-agent | Firecrawl 模式：搜索 + 抓取全文一步完成 | 执行层 |
| browser-agent | 浏览器模式：打开 Google、执行搜索、获取结果列表、兜底抓取 | 执行层 |
| LLM (决策, 0.3) | 审查已有发现、识别知识缺口、决定下一步搜索 | 搜索决策层 |
| LLM (报告, 0.7) | 汇总发现、综合生成结构化调研报告 | 报告生成层 |

## 报告格式

输出文件: `output/{主题}-{YYYY-MM-DD}.md`

标准结构见 `templates/report.md`。

## 维护

- 修改搜索策略 → 编辑 `workflows/deep.md` 或 `workflows/simple.md`
- 修改输出格式 → 编辑 `templates/report.md`
- 调整默认参数 → 编辑 `.env`
