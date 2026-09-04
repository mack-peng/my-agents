# Framelink MCP for Figma — 使用文档

> 来源：https://www.framelink.ai/docs （GLips/Figma-Context-MCP）
> 仓库：https://github.com/GLips/Figma-Context-MCP （MIT, 15.8k stars, TypeScript 97.4%）
> 最新版本：v0.13.2

## Introduction

Framelink（原 Figma-Context-MCP）是一个 **Figma → Code 的 MCP Server**。它把 Figma 设计数据直接连接到 AI 编码代理（Cursor、Claude Code、Opencode 等），让 agent 理解设计的程度远超截图，从而开箱即用地生成接近像素级还原的代码。

- 核心机制：用户把 Figma 文件/frame/group 链接贴给 agent，agent 调用 MCP 的 `get_figma_data` 函数获取压缩后的布局/样式元数据。
- 相比贴截图的优势：MCP 把 Figma API 响应压缩约 90%，只保留最相关的布局与样式信息，减少喂给模型的上下文，提升准确性与相关性。
- 视频 Demo：https://www.youtube.com/watch?v=6G9yb-LrEqg

### 官方文档导航（本文档对应章节）

| 菜单 | URL | 章节 |
|------|-----|------|
| Introduction | /docs | 本页 |
| Quickstart | /docs/quickstart | 下节 |
| Configuration | /docs/configuration | 下节 |
| CLI Usage | /docs/fetch | 下节 |
| Best Practices | /docs/best-practices | 下节 |
| Troubleshooting | /docs/troubleshooting | 下节 |
| Alternative Server Configurations | /docs/alternate-methods | 下节 |

## Quickstart

三步上手：token → 配置 IDE → 实现设计。

### 1. 获取 Figma access token
- Figma 首页 → 左上角头像 → **Settings** → **Security** 标签页 → 滚动到 **Personal access tokens** → **Generate new token**。
- 命名 token，权限勾选 **File content** 与 **Dev resources**（read）。
- 详细说明见 Figma 官方文档：https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens

### 2. 连接 Figma 到 IDE
- 找到自己的编辑器/代理，按对应说明更新 MCP 配置；配置更新后 Framelink MCP server 会自动下载并启动。
- 默认用 `npx` 启动；Windows 或其它运行时见配置文档。
- 支持的 MCP 客户端（导航中列出）：Claude Code、Cursor、**Opencode**、OpenAI Codex、Google Antigravity、VS Code、Kiro、Kilo Code、Roo Code、Windsurf、Claude Desktop、Trae、Cline、Augment Code、Gemini CLI、Copilot Coding Agent、Copilot CLI、Amazon Q Developer CLI、Warp、Amp、Zed、Smithery、JetBrains AI Assistant、Qwen Code、LM Studio、Visual Studio 2022、Crush、BoltAI、Rovo Dev CLI、Zencoder、Qodo Gen、Perplexity Desktop、Factory、Emdash、Desktop Extension (MCPB)。

### 3. 实现第一个设计
- **复制设计链接**：右键 Figma 中的 frame/group → Copy/Paste as → **Copy link to selection**。
- **粘贴进编辑器**：把链接连同请求（如 "Implement this Figma frame"）发给 agent，agent 会调用 `get_figma_data`。建议一次只做一个 section，复杂设计信息量过大。
- **获得设计**：agent 根据返回的数据生成代码。简单无上下文的 frame 会按字面命名（如 `frame-###`），给出更多业务上下文可获得更符合预期的命名/结构。

### Next steps
- 进阶提示词技巧见 Best Practices 章节。

## Configuration

配置可通过 CLI 参数或环境变量提供（`.env` 或 shell）。

### CLI Arguments

| 参数 | 说明 |
|------|------|
| `--figma-api-key` | Figma Personal Access Token，推荐认证方式。`npx figma-developer-mcp --figma-api-key=figd_xxxxxx` |
| `--figma-oauth-token` | Figma OAuth Bearer token（OAuth 认证时用） |
| `--env` | 自定义 `.env` 文件路径；默认读当前工作目录的 `.env` |
| `--stdio` | stdio 传输模式（本地 MCP 客户端如 Cursor/Claude Desktop/Windsurf 用）。不加此参数则启动 HTTP server |
| `--port` | HTTP server 端口，仅 HTTP/SSE 模式生效，默认 `3333` |
| `--host` | HTTP server 绑定地址，仅 HTTP/SSE 模式，默认 `127.0.0.1` |
| `--format` | 输出格式：`yaml`（默认）/ `json` / `tree`（实验性紧凑格式，结构键位置化编码，样式值去重到 `globalVars`，样式复用多的设计最省 token） |
| `--json` | `--format=json` 的兼容别名 |
| `--image-dir` | 图片下载根目录，`download_figma_images` 只能写该目录内；默认当前工作目录 |
| `--proxy` | HTTP 代理 URL；`--proxy=none` 显式忽略代理环境变量直连；也自动尊重 `HTTP_PROXY`/`HTTPS_PROXY`/`NO_PROXY` |
| `--skip-image-downloads` | 不注册图片下载工具 |
| `--no-telemetry` | 关闭匿名使用遥测（每工具调用上报一次，凭据已脱敏）；等价 `FRAMELINK_TELEMETRY=off` 或 `DO_NOT_TRACK=1` |
| `--help` / `--version` | 帮助 / 版本 |

### Environment Variables

| 变量 | 说明 | 默认 |
|------|------|------|
| `FIGMA_API_KEY` | Figma PAT | — |
| `FIGMA_OAUTH_TOKEN` | Figma OAuth token | — |
| `FRAMELINK_PORT` | HTTP 端口（`PORT` 为兼容别名） | `3333` |
| `FRAMELINK_HOST` | HTTP 主机 | `127.0.0.1` |
| `OUTPUT_FORMAT` | 输出格式 yaml/json/tree | `yaml` |
| `IMAGE_DIR` | 图片下载目录 | 当前工作目录 |
| `FIGMA_PROXY` | 代理 URL 或 `none` | — |
| `SKIP_IMAGE_DOWNLOADS` | 禁用图片下载工具 | `false` |
| `FRAMELINK_TELEMETRY` | `off` 关闭遥测 | — |
| `DO_NOT_TRACK` | 任意 truthy 值关闭遥测 | — |

示例 `.env`：
```bash
FIGMA_API_KEY=figd_xxxxxxxxxxxxxxxxxxxxxx
FRAMELINK_PORT=3333
FRAMELINK_HOST=127.0.0.1
OUTPUT_FORMAT=yaml
SKIP_IMAGE_DOWNLOADS=false
```

### Authentication

1. **Personal Access Token（推荐）**：`--figma-api-key` 或 `FIGMA_API_KEY`。需权限：File content（Read）、Dev resources（Read）。
2. **OAuth Bearer Token**：`--figma-oauth-token` 或 `FIGMA_OAUTH_TOKEN`。提供后使用 `Authorization: Bearer` 头而非 `X-Figma-Token` 头。
3. **Per-Request Token（仅 HTTP 模式）**：每个请求通过 `X-Figma-Token` 头传入 PAT，适合集中式部署（一个实例给多人用，各自用自己的 Figma 身份）。请求头优先级高于全局配置；HTTP 模式可无凭据启动，此时每次调用必须带该头。stdio 模式与 `fetch` CLI 无 per-request 通道，仍需启动时凭据。

### Configuration Precedence

`CLI 参数 > 环境变量（.env/shell）> 默认值`。认证上，per-request `X-Figma-Token` 头对该请求优先级最高。

## CLI Usage（`fetch` 子命令）

除作为 MCP server 运行外，`figma-developer-mcp` 可直接在命令行拉取简化后的 Figma 设计数据，适合脚本化、管道化或快速开发查询。不带子命令运行即为 MCP server；`fetch` 子命令开启直接 CLI 用法。

```
npx figma-developer-mcp fetch "https://figma.com/design/ABC123/My-File?node-id=1-2" --figma-api-key=figd_xxxxxx
```

- 与 MCP 的 `get_figma_data` 走同一简化管线，输出一致。
- 默认 YAML；`--format=json` / `--format=tree`（实验性）；`--json` 为 `--format=json` 兼容别名。
- 认证方式与 server 相同（flag 或环境变量）。
- **注意**：Figma URL 中的 `&` 等 shell 字符需加引号包裹。

### Flags

| Flag | 说明 |
|------|------|
| `--file-key` | Figma 文件 key（覆盖 URL） |
| `--node-id` | 节点 ID `1234:5678` 格式（覆盖 URL） |
| `--depth` | 限制树遍历深度 |
| `--format` | 输出格式 yaml（默认）/ json / tree |
| `--json` | `--format=json` 兼容别名 |
| `--figma-api-key` | Figma PAT |
| `--figma-oauth-token` | Figma OAuth token |
| `--env` | `.env` 文件路径 |

URL 与显式 flag 同时提供时，flag 优先（例如用 URL 取 file key，仅覆盖 node-id）。

### Examples

```bash
# 取指定节点，YAML 输出
npx figma-developer-mcp fetch "https://figma.com/design/ABC123/My-File?node-id=1-2" --figma-api-key=figd_xxxxxx

# JSON 输出并管道给 jq
npx figma-developer-mcp fetch "https://figma.com/design/ABC123/My-File?node-id=1-2" --figma-api-key=figd_xxxxxx --format=json | jq '.nodes[0]'

# 实验性 tree 格式
npx figma-developer-mcp fetch "https://figma.com/design/ABC123/My-File?node-id=1-2" --figma-api-key=figd_xxxxxx --format=tree

# 用显式 flag 而非 URL
npx figma-developer-mcp fetch --file-key ABC123 --node-id 1:2 --figma-api-key=figd_xxxxxx

# 限制遍历深度
npx figma-developer-mcp fetch "https://figma.com/design/ABC123/My-File" --figma-api-key=figd_xxxxxx --depth 3

# 保存到文件
npx figma-developer-mcp fetch "https://figma.com/design/ABC123/My-File?node-id=1-2" --figma-api-key=figd_xxxxxx > design-data.yaml
```

## Best Practices

（状态：WIP）最大化 AI 生成代码质量的技巧。

### In Figma（设计侧）
- 多用 **auto layout** —— MCP 目前对 floating / absolutely positioned 元素处理不佳。
- 给 frame / group 起名。Protip：用 Figma 的 AI 自动生成名称。

### In your editor（提示词侧）
- 关键还是提供正确上下文：
  - 告诉 agent 可用的资源（如 Tailwind、React）；可引用代码库中的关键文件补充上下文。
  - 除 Figma 原始数据外，提供设计的文字描述细节。
  - 管理上下文大小——提供 frame/group 的链接而非整个文件。

## Troubleshooting

（状态：WIP）详细指南待补充；可加 Discord（https://discord.gg/MeE3UEjdGN）或开 GitHub issue。

### Network proxy / connection errors
- 症状：`fetch failed`、`ECONNRESET`、`Connection was reset`——常见于公司网络/校园网等受管环境。
- **加 `--proxy` flag**：向 IT 要代理 URL，配置里加 `--proxy=http://your-proxy:8080`（或设 `FIGMA_PROXY` 环境变量）。
- 标准代理环境变量：server 自动尊重 `HTTP_PROXY`/`HTTPS_PROXY`/`NO_PROXY`。
- **绕过坏代理**：a) 把 `api.figma.com` 加入 `NO_PROXY`；b) 传 `--proxy=none` 忽略所有代理变量直连。

### Cannot find module
- 安装出错导致。关闭客户端后运行 `npx clear-npx-cache`，再重开客户端。

### 403 Forbidden（按响应 body 的 `err` 字段区分）
| err 值 | 原因 | 修复 |
|--------|------|------|
| `Invalid scope(s): ...` | PAT 创建时未勾选所需 scope | 在 Figma Settings→Security→Personal access tokens 重新生成，勾选 **File content**（Read）+ **Dev resources**（Read） |
| `Invalid token` | token 被吊销/打错/混入空白/不是真 token | 生成新 PAT 并更新配置 |
| `Token expired` | OAuth token 过期 | 刷新 OAuth token；PAT 不过期，非必要可改用 PAT |
| `File not exportable` | 文件分享设置禁止复制/分享/导出 | 文件所有者允许 viewer 复制/分享/导出；或把文件复制到自己的工作区 |
| 其它 | 文件未共享给该账号/代理或防火墙返回自己的 403 | 确认文件归属/共享；若响应体不像 Figma JSON（HTML、第三方厂商名、"Access denied"）多为代理拦截，见 proxy 节 |

### 429 Too Many Requests
- Framelink 本身无限流，限流来自 Figma API。
- Free 计划约 **6 次/月**；付费计划（含 Dev Seats）约 **10 次/分钟**。
- 限流取决于**文件所有者的计划**：Starter 团队里的文件按 Starter（很低）限流 → 复制到自己的付费团队。
- 刚升级付费可能延迟生效。

### Claude Desktop: wrong Node version
- 用 NVM 等版本管理器时 Claude Desktop 可能用错 Node 版本。
- 修复：创建包装脚本 `/usr/local/bin/npx-for-claude`：
```zsh
#!/bin/zsh
source ~/.zshrc
exec npx "$@"
```
`chmod +x /usr/local/bin/npx-for-claude`，然后把 Claude Desktop 配置里的 `command` 从 `npx` 改为 `npx-for-claude`。

## Alternative Server Configurations

### Server-sent events (SSE)
stdio 方式有问题时的替代方案。

1. **启动 server（HTTP/SSE 模式，不加 `--stdio`）**：
```
> npx figma-developer-mcp --figma-api-key=<your-figma-api-key>
# Initializing Figma MCP Server in HTTP mode on port 3333...
# HTTP server listening on port 3333
# SSE endpoint available at http://localhost:3333/sse
# Message endpoint available at http://localhost:3333/messages
```
2. **配置 JSON 连接 SSE endpoint**（默认端口 3333，可用 `--port=1234` 改）：
```json
{
  "mcpServers": {
    "Framelink MCP for Figma": {
      "url": "http://localhost:3333/sse",
      "env": { "FIGMA_API_KEY": "<your-figma-api-key>" }
    }
  }
}
```
- HTTP/SSE 模式下支持每请求 `X-Figma-Token` 头，见 Configuration 的 Per-Request Token。

### Running the MCP server locally
1. clone 仓库（https://github.com/GLips/Figma-Context-MCP）
2. `pnpm install`
3. `cp .env.example .env`，填入 Figma token（仅需读权限）
4. `pnpm run dev`（可按需加 flag：`--version`、`--figma-api-key`、`--port`、`--help`）
5. 按上面 SSE 方式配置 JSON 连接

### Inspect Responses
本地仓库执行 `pnpm inspect`，启动 `@modelcontextprotocol/inspector` Web UI（默认 http://localhost:5173），方便触发工具调用并审查响应。

---

## 快速参考（TL;DR）

- **是什么**：给 AI 编码代理提供 Figma 布局/样式数据的 MCP server（`figma-developer-mcp`，又名 Framelink）。
- **核心工具**：`get_figma_data`（拉取简化设计数据）、`download_figma_images`（下载图片）。
- **快速起步**：Figma 生成 PAT → IDE 配置 MCP（`npx -y figma-developer-mcp --figma-api-key=... --stdio`）→ 复制 frame 链接 → 让 agent "Implement this Figma frame"。
- **离线/脚本**：`npx figma-developer-mcp fetch "<figma-url>" --figma-api-key=...`。
- **注意**：Figma 免费版 API 限流约 6 次/月；MCP 本身无限流。