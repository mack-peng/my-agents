# 图片 → Figma 文件

把一张 UI 图片/截图变成**可编辑的 Figma 图层**。

## 路线选择

| 路线 | 保真度 | 依赖 | 场景 |
|------|--------|------|------|
| **A（默认）** | 近似还原 | opencode 模型解析 + figwright 写路径 | 快速全自动，免额外 API |
| **B（可选）** | 高保真 | image-to-slice 插件 + OpenAI 兼容 API | 追求像素级还原时 |

## 路线 A：opencode 解析图片 → figwright 写入（默认，推荐）

### 流程
```
用户提供图片/截图 → 本会话模型解析（布局树/文字/颜色/间距/组件）
→ 产结构化描述 → figwright「figma-build」写节点 → Figma 画布
```

### 前置依赖 blocks（按序实时检测，缺失即引导）

**Block A1：Figma Desktop 已安装并在运行**
- 检测：询问用户是否已打开 Figma Desktop；或检测进程 `pgrep -x Figma`
- 缺失引导：https://www.figma.com/downloads 下载安装 → 打开 → 新建/打开一个设计文件

**Block A2：figwright MCP 已配置到 opencode**
- 检测：读 `~/.config/opencode/opencode.json` 的 `mcp` 段是否含 `figwright`
  ```bash
  grep -q '"figwright"' ~/.config/opencode/opencode.json && echo present || echo missing
  ```
- 缺失引导（让用户操作或按确认后写入）：
  1. 在 `~/.config/opencode/opencode.json` 的 `mcp` 段加入：
     ```json
     "figwright": {
       "type": "local",
       "command": ["npx", "-y", "@figwright/mcp@latest"],
       "enabled": true
     }
     ```
  2. **重启 opencode** 使配置生效
- 通过确认：当前会话应能看到 figwright 的 MCP 工具（如 `ping`、`get_selection`）

**Block A3：figwright 插件已导入 Figma 并连接**
- 检测：调用 figwright `ping` 工具，返回 connected
- 缺失引导：
  1. 打开 https://github.com/awdr74100/figwright/releases → 下载最新插件 zip → 解压
  2. Figma Desktop：菜单 → Plugins → Development → **Import plugin from manifest…** → 选择解压出的 `manifest.json`
  3. 运行插件（Plugins → Development → Figwright），应显示 **Connected**
  4. 回到对话让我再跑一次 `ping` 确认

### 执行步骤
1. 用户提供图片 → 先放入仓库根 `input/`（gitignored），再读取该路径。
2. 读取图片，解析出：页面结构树（frame/section 层级）、每个元素的类型（文本/按钮/卡片/输入框…）、文案、颜色值、间距、圆角、阴影等。
3. 产出结构化描述（组织成清晰的布局树文本）。
4. 通过 figwright 的 `figma-build`（或底层 `create_frame` / `create_rectangle` / `create_text` / 填充与 auto-layout 等写工具）在 Figma 中按描述构建图层。
5. 完成后请用户在 Figma 中查看；如需调整，走 `workflows/figma-edit.md`。

## 路线 B：image-to-slice 插件（可选，高保真）

### 前置依赖 blocks

**Block B1：Figma Desktop 已安装并在运行**（同 Block A1）

**Block B2：image-to-slice 插件已导入**
- 检测：询问插件是否在 Figma 的 Plugins → Development 中可见
- 缺失引导：
  1. 打开 https://github.com/50kg/image-to-slice → Code → Download ZIP → 解压
  2. Figma Desktop：Plugins → Development → **Import plugin from manifest…** → 选解压目录的 `manifest.json`

**Block B3：插件内已配置 OpenAI 兼容 API（图片理解 + 图片生成/修补）**
- 检测：询问插件「设置」里是否已保存模型配置且点过「测试」通过
- 缺失引导（这个 API key 需要你自己提供，不会经过我）：
  1. Figma 内运行 image-to-slice 插件 → 打开「设置」
  2. 点「＋ 新建 API」，配置：
     - Base URL：`https://api.openai.com/v1`（或你的中转地址）
     - 模型：图片理解用一个（如 `gpt-4o`），图片生成/修补用另一个（如 `gpt-image-1`）
     - API Key：填入你自己的 key（仅保存在本地插件配置）
     - 用途：分别选「图片理解」与「图片生成 / 修补」
  3. 点「测试」，直到显示通过

### 执行步骤
1. 用户提供图片。
2. 引导用户在插件内：载入图片 → AI 拆图 → 人工校准切图/遮挡 → 生成完整背景 → 「切图导入」或「AI 图层导入」→ 得到可编辑 Figma 图层（或下载 `.fig` / HTML）。
3. 需要跨工具协作时（如把产物交给读路径生成代码），产物放仓库根 `output/` 说明。

## 通用提示
- 用户给的是 Figma 链接而非图片时，改走 `workflows/figma-to-desc.md`。
- 只做图片解析 + 描述时（用户没要求写 Figma），不必启动写路径，仅给出描述即可。