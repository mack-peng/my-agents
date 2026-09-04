# 图片 → Figma 文件

把一张 UI 图片/截图变成**可编辑的 Figma 图层**。

## 路线选择

| 路线 | 保真度 | 依赖 | 场景 |
|------|--------|------|------|
| **A（默认）** | 近似还原 | opencode 模型解析 + figwright 写路径 | 快速全自动，免额外 API |
| **B（可选）** | 高保真 | image-to-slice 插件 + OpenAI 兼容 API | 追求像素级还原时 |
| **C（有源优先）** | 100% 保真 | 用户提供 SVG + 手动 Place | 用户直接给出整页 SVG 时 |

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
- 用户给的是整页 SVG（尤其文字是 path 而非 `<text>` 时）→ 优先走路线 C 下方流程，比从截图近似还原保真得多。

## 路线 C：SVG 矢量源 → Figma（用户提供整页 SVG 时首选）

把用户提供的**整页 SVG 矢量源**变成可编辑的 Figma 图层。文字是 path 的场景也适用——文字转真文本，块面保留矢量。

### 流程
```
用户给 SVG（放 input/）→ rsvg-convert 渲染对照 → 用户拖入 Figma 画布
→ figwright 归位 → 文字路径化 → 色块转 fill → 用户确认
```

### 前置依赖
- **C1**：Figma Desktop + figwright MCP + 插件（同 Block A1-A3）
- **C2（本机工具）**：SVG 处理优先用现成库，不自己写 Python SVG 解析：
  - 渲染：`rsvg-convert`（librsvg，`brew install librsvg`）
  - 结构解析：`lxml` / `svgpathtools`（PEP 668 环境用 `uvx --from lxml python -c "import lxml"` 临时调用，不污染系统）

### 执行步骤（重要顺序，勿跳步）

1. **SVG 入场：用户手动 Place，不是 figwright import**
   - figwright `import_svg` 只适合小碎片（≤2KB）；大 SVG 的 path `d` 数据在对话里无法忠实传输（2000 字符截断），**手写合并 SVG 必失真**（实战教训：自拼 SVG 图标/文字位置全错）。
   - 正确路径：Figma 桌面 → `Shift+Cmd+K`(Place) → 选 `output/` 下的 SVG → 拖到画布。figwright 只做归位（reparent + set_position）。
   - SVG 内嵌位图（`pattern`/`image`）走 figwright 的 URL/base64 导入都会失败（插件沙箱拦 URL、base64 手抄不可靠）——Place 后自动变 IMAGE fill，无损。
   - 导入后 `get_node` 确认：`IMAGE` fill 的层、`Clip path group`、`Group` 都是图形层，**不可当作色块删**。

2. **渲染对照**：`rsvg-convert -w <宽> input/<file>.svg -o output/render.png` 拿到基准图，确认文案/尺寸/颜色。

3. **结构解析**（lxml）：遍历顶层元素，输出 `type / size / fill / transform`，标注「色块 vs 图形」：
   - **色块** = 纯 `rect`/`circle`（无 `d`、fill 非 `url(#pattern)`）
   - **图形** = `path`（文字、图标）或 pattern 填充的 rect（位图）

4. **文字路径 → 真文本**：
   - 文案从渲染 PNG 识别（文字是 path 时 SVG 内无文本节点，也常见 `<text>` 被转换工具路径化）
   - 字号：path bbox 高度推算（如高 21px ≈ 22pt）
   - 字体：PingFang SC（Semibold/Regular 可靠；**Bold 可能加载失败**，用 Semibold 顶替）
   - 颜色：直接取 SVG `fill`，转 RGB 小数
   - 位置：SVG transform 平移量 ≈ 文字框左上（基线略修正）
   - 完后**删除对应 path 层**（先记 ID 再删）

5. **色块转原生 fill**（可编辑颜色）：
   - 顺序：建新 Shape/Frame（fill=SVG 色）→ set_position/圆角 → **reorder 到正确叠序**（白底→色块→图形→文字）→ 确认无遮挡 → 才删旧 Vector 色块。
   - **删除纪律：先 `get_node` 拿当前 children 完整列表，逐个核对 ID 后删。禁止凭猜测批量删**（实战教训：误删把扫描图标/阴影组一起带走，返工多轮）。

6. **验证**：`get_screenshot` 全页确认；重点查：位图（太极等）、图标、阴影组是否还在。

### 该路线 vs A/B 的选择
- 有 SVG → **优先 C**（保真+可编辑，省去 A 的近似误差）
- 只有截图 → A；要像素级 → B