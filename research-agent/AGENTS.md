# Research Agent

独立的深度调研代理。使用 browser-agent 搜索网页，webfetch 抓取内容，LLM 综合整理成结构化报告。**零外部依赖**，不需要任何 API Key。

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

## 工具分工

| 工具 | 用途 | 来源 |
|------|------|------|
| browser-agent | 打开 Google、执行搜索、获取结果列表 | playwright-cli |
| webfetch | 抓取搜索结果页的完整文章内容 | OpenCode 内置 |
| LLM | 拆解问题、评估缺口、综合报告 | OpenCode 对话 |
| snapshot | 提取搜索引擎结果页的链接和摘要 | playwright-cli |

## 报告格式

输出文件: `output/{主题}-{YYYY-MM-DD}.md`

标准结构见 `templates/report.md`。

## 维护

- 修改搜索策略 → 编辑 `workflows/deep.md` 或 `workflows/simple.md`
- 修改输出格式 → 编辑 `templates/report.md`
- 调整默认参数 → 编辑 `.env`
