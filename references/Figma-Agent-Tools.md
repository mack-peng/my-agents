# Figma Agent 工具选型与配置（GitHub 调研结论）

> 调研日期：2026-09-04。多轮 GitHub 搜索/阅读后为 `figma-agent/` 选定的工具栈与备选对比。

## 一句话结论

| 用途 | 选定工具 | 备选 |
|------|---------|------|
| Figma → 结构化描述（读） | **Framelink MCP** (`figma-developer-mcp`) | 官方 Figma MCP（Code Connect）、OpenFig CLI（离线 .fig） |
| AI 对话式修改（写） | **figwright MCP** (`@figwright/mcp`) | 官方远程 MCP（写 beta）、figma-edit-mcp、figma-mcp-write-server |
| 图片 → Figma | **路线A：opencode 解析 → figwright 写入** | 路线B：image-to-slice 插件 |

## 选型工具详解

### 1. figwright（写路径核心）— https://github.com/awdr74100/figwright
- **双向** Figma MCP server：读（选择→框架感知代码）+ 写（代码/描述→画布）。
- 免费，不需 Dev Mode seat；本地运行（server + relay + plugin），设计数据不出本机。
- **112 个 MCP 工具**：读（节点/样式/变量/组件/字体/截图/PDF/视频导出）；写（帧/文字/形状/auto-layout/效果/样式/变量/组件/Motion/批量）；grounding（`get_design_context`、`component_map`/`token_map`/`icon_map` 关联代码库、`design_diff` 基线对比）。
- **provider-first codegen**：探测真实技术栈 + 复用已有组件/token/icon。
- Skills：`figma-codegen`（选择→代码）、`figma-build`（描述/代码→Figma 设计）。
- 依赖：Node 20.19+ / 22.12+（本机 v24 ✅）、Figma Desktop 导入插件、MCP 客户端。
- 无需任何 API key。

### 2. Framelink MCP（读路径核心）— https://github.com/GLips/Figma-Context-MCP
- 15.8k stars。Figma API 响应压缩约 90%，只留最相关布局/样式。
- CLI 可脚本化：`npx figma-developer-mcp fetch "<url>" --format=yaml|json|tree`。
- 认证：`--figma-api-key=figd_xxx` 或 `FIGMA_API_KEY` 环境变量；需 File content + Dev resources 读权限。
- 限流：Figma 免费版约 6 次/月；付费 10 次/分（取决于文件所有者计划）。
- 详见 `references/Framelink-MCP-Figma-Use-Doc.md`。

### 3. image-to-slice（图片→Figma，可选高保真）— https://github.com/50kg/image-to-slice
- Figma Desktop 插件 + 网页模式：AI 拆图、被遮挡背景补齐、人工校准、导入可编辑 Figma 图层、导出 HTML/CSS、下载 `.fig`。
- 需 OpenAI 兼容 API（图片理解 + 图片生成/修补各一），在插件「设置」中配置并「测试」。
- 保真度高但交互重、需额外 API key；figma-agent 中降级为路线B。

## 备选对比

### 读方向
| 工具 | 优点 | 缺点 |
|------|------|------|
| **官方 Figma MCP** (https://github.com/figma/mcp-server-guide) | `get_design_context`、生成代码、**Code Connect**（复用真实组件）、写画布 beta、远程 `mcp.figma.com/mcp` | 读工具限流（Starter 6 次/月）；写 beta 将收费 |
| **OpenFig CLI** (https://github.com/OpenFig-org/openfig-cli) | 免 Figma 应用解析/渲染/修改 `.fig/.deck`，`npm i -g openfig-cli`，MIT，附 MCP | 修改能力当前偏 `.deck`；新项目 |
| bernaferrari/FigmaToCode (5.2k) | 确定性 HTML/React/Tailwind/Flutter/SwiftUI，无 AI 隐私友好 | Figma 插件，无 CLI |

### 写方向
| 工具 | 优点 | 缺点 |
|------|------|------|
| **figma-edit-mcp** (https://github.com/neozhehan/figma-edit-mcp) | 安全约束最强（作用域锁定/精确层名校验/批量全量校验/变量样式单独授权） | 需 WebSocket bridge + 插件，配置较繁 |
| **figma-mcp-write-server** (https://github.com/oO/figma-mcp-write-server) | 24 个写工具最全，插件 API 直连免 REST 限流 | 需 Node 22 + Figma Desktop 活动会话 |
| grab/cursor-talk-to-figma-mcp (7k) | 始祖，批量文本替换/实例 override 传播 | 需 Bun |

## 配置速查

### FIGMA_API_KEY（读路径，用户自写）
```zsh
echo 'export FIGMA_API_KEY="figd_你的key"' >> ~/.zshrc && source ~/.zshrc
```

### figwright MCP（写路径，opencode）
```json
{
  "mcp": {
    "figwright": {
      "type": "local",
      "command": ["npx", "-y", "@figwright/mcp@latest"],
      "enabled": true
    }
  }
}
```
位置：`~/.config/opencode/opencode.json`。改后重启 opencode。插件从 https://github.com/awdr74100/figwright/releases 下载 zip 导入 Figma。

### image-to-slice（路线B）
插件：https://github.com/50kg/image-to-slice → Download ZIP → Figma Plugins→Development→Import plugin from manifest。OpenAI 兼容 API 在插件「设置」配置并「测试」。

## 检测命令速查（实时检测用，不回显 key）
```bash
# figma key 是否已配（环境变量）
zsh -c 'source ~/.zshrc 2>/dev/null; [ -n "$FIGMA_API_KEY" ]' && echo present || echo missing
# figma key 是否已配（.env 兜底）
grep -q '^FIGMA_API_KEY=figd_' figma-agent/.env && echo present || echo missing
# figwright MCP 是否已配
grep -q '"figwright"' ~/.config/opencode/opencode.json && echo present || echo missing
# 读工具可用性
npx -y figma-developer-mcp --version
```