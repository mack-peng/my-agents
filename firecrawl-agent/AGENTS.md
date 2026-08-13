# Firecrawl Agent 项目

`firecrawl-cli` 是 Firecrawl 官方 CLI，提供网页抓取、搜索、地图、爬取、交互、监控与 agent 任务能力。配置持久化在 CLI 自身，无需 `.env`。

## 前置检查

每次使用前，先检查 CLI 是否可用和已登录：

```bash
# 检查 CLI 是否安装
which firecrawl || echo "未安装"

# 检查认证状态、并发额度与剩余 credits
firecrawl --status
```

## 安装

```bash
npm install -g firecrawl-cli
```

可选：安装 skills 供 AI coding agent 自动发现（含 CLI / build / workflows 三段）：

```bash
npx -y firecrawl-cli@latest init --all --browser
```

## 配置与登录

### 登录（持久化凭证）

```bash
firecrawl login                        # 交互式（打开浏览器或提示输入 key）
firecrawl login --browser              # 浏览器认证（agent 推荐）
firecrawl login --api-key fc-YOUR-API-KEY  # 直接用 key
```

登录后凭证持久化，后续命令直接使用，无需每次指定。未配置 key 时回退到 keyless 免费档（按 IP 限流）。免费 key（1000 credits）在 https://firecrawl.dev 注册获取。

### 查看 / 退出

```bash
firecrawl view-config                  # 查看当前配置与认证状态
firecrawl logout                       # 清除已存凭证
```

### 环境变量（可选覆盖，优先级高于已存配置）

```bash
export FIRECRAWL_API_KEY=fc-YOUR-API-KEY
```

### 连接自托管 Firecrawl

```bash
# 临时指定
firecrawl --api-url http://localhost:3002 scrape https://example.com

# 持久化自定义 API 地址（用 login，它是 config 的别名；
# config 拼写因 --api-url 与全局选项重名而读不到值，会误入云登录流程）
firecrawl login --api-url http://localhost:3002

# 或环境变量
export FIRECRAWL_API_URL=http://localhost:3002
```

使用自定义 API URL 时，CLI 跳过 Firecrawl Cloud 的 key 鉴权。

## 快捷命令（直接从本文件复制使用）

### Scrape（单页抓取）

```bash
firecrawl https://example.com                          # 默认 markdown 输出
firecrawl scrape https://example.com                   # 显式 scrape 命令
firecrawl https://example.com --only-main-content      # 仅正文（去导航/页脚/广告，推荐）
firecrawl https://example.com --html                   # HTML 输出
firecrawl https://example.com --format markdown,links  # 多格式（返回 JSON）
firecrawl https://example.com --format summary         # 页面摘要
firecrawl https://example.com --format json --schema '{"type":"object","properties":{"title":{"type":"string"}}}'
firecrawl https://example.com --wait-for 3000          # 等 JS 渲染
firecrawl https://example.com --screenshot             # 截图
firecrawl https://example.com --redact-pii             # 脱敏 PII
firecrawl https://example.com -o output.md             # 保存到文件
```

格式：`markdown, html, rawHtml, links, screenshot, json, images, summary, changeTracking, attributes, branding, product`。

### Search（网页搜索）

```bash
firecrawl search "web scraping tutorials"
firecrawl search "AI news" --limit 10 --pretty
firecrawl search "AI" --sources web,news,images
firecrawl search "tech news" --tbs qdr:d              # qdr:h/d/w/m/y 时间过滤
firecrawl search "documentation" --scrape --scrape-formats markdown   # 搜索并抓取结果
# 搜索 + 抓取全文 + JSON 输出（供 research-agent 深度/简单搜索调用）
firecrawl search "<关键词>" --limit 3 --scrape --scrape-formats markdown --json
```

### Developer（开发者索引：issues/PR/README/文档）

```bash
firecrawl developer "how do I configure retries" --limit 10
```

### Map（站点 URL 发现）

```bash
firecrawl map https://example.com
firecrawl map https://example.com --search "blog"      # 按查询过滤
firecrawl map https://example.com --limit 500 --json
firecrawl map https://example.com --sitemap only       # 仅用 sitemap
```

### Crawl（整站爬取）

```bash
firecrawl crawl https://example.com --wait             # 等待完成
firecrawl crawl https://example.com --limit 100 --max-depth 3 --wait
firecrawl crawl https://example.com --include-paths /blog,/docs --wait
firecrawl crawl https://example.com --exclude-paths /admin,/login --wait
firecrawl crawl <job-id>                               # 查状态
firecrawl crawl <job-id> --cancel                      # 取消
firecrawl crawl https://example.com --wait --pretty -o results.json
```

### Interact（页面交互）

```bash
firecrawl scrape https://www.amazon.com                # 先抓取（scrape ID 自动保存）
firecrawl interact "Search for iPhone 16 Pro Max"      # 用自然语言交互
firecrawl interact "Click on the first result and tell me the price"
firecrawl interact stop                                # 结束会话
```

### Monitor（周期性抓取/爬取 + 变更 diff）

```bash
firecrawl monitor create --name "Hacker News AI" \
  --schedule "every 30 minutes" \
  --goal "Alert when a new AI-related story enters the top 10." \
  --page https://news.ycombinator.com
firecrawl monitor run <monitorId>
firecrawl monitor checks <monitorId> --limit 10
firecrawl monitor check <monitorId> <checkId> --page-status changed
firecrawl monitor update <monitorId> --goal "..."
firecrawl monitor delete <monitorId>
```

### Agent（自然语言调研/数据采集）

```bash
firecrawl agent "Find the top 5 AI startups and their funding amounts" --wait
firecrawl agent "Compare pricing plans" --urls https://slack.com/pricing,https://teams.microsoft.com/pricing --wait
firecrawl agent "Get company info" --urls https://example.com --schema '{"type":"object","properties":{"name":{"type":"string"}}}' --wait
firecrawl agent "Competitive analysis" --model spark-1-pro --wait   # spark-1-mini 为默认（更便宜）
firecrawl agent <job-id> --status                    # 查状态
firecrawl agent <job-id> --cancel                    # 取消
```

### 其他

```bash
firecrawl credit-usage                # 查看团队 credits 余额与用量
firecrawl version                     # 查看 CLI 版本
```

## 全局选项

| 选项 | 说明 |
|------|------|
| `--status` | 显示版本、认证、并发、credits |
| `--api-key <key>` / `-k` | 临时覆盖 API key |
| `--api-url <url>` | 使用自定义 API URL（自托管/本地） |
| `--help` / `-h` | 查看命令帮助 |
| `--version` / `-V` | 查看 CLI 版本 |

## 输出与注意事项

- **单格式** → 输出原始内容（markdown 文本 / HTML 等）；**多格式** → 输出 JSON。
- `--pretty` 美化 JSON；`--json` 强制 JSON；`-o <path>` 保存到文件。
- 输出默认到 stdout，可直接管道或重定向：`firecrawl https://example.com | head -50`。

```bash
# 用 jq 组合
firecrawl https://example.com --format links --json | jq -r '.links[]'
firecrawl map https://example.com | wc -l
jq -r '.data.web[].url' search-results.json
```

- 关闭匿名遥测：`export FIRECRAWL_NO_TELEMETRY=1`（遥测只含 CLI 版本/OS/Node 版本/开发工具，不含 URL 与文件内容）。
- 完整命令帮助：`firecrawl --help` 或 `firecrawl COMMAND --help`。
- 在线文档：https://docs.firecrawl.dev/sdks/cli
