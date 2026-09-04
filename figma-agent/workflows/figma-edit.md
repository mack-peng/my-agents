# AI 对话式修改 Figma 文件

通过 figwright（双向 MCP）让 AI 直接读写 Figma 画布：读取当前选择、创建/编辑帧、文字、形状、auto-layout、样式、变量、组件等，**复用你项目真实的技术栈与组件**。

## 流程
```
用户描述意图（改什么/加什么/建什么）→ 读取画布上下文 → figwright 写工具执行 → 用户查看确认
```

## 前置依赖 blocks（按序实时检测，缺失即引导）

**Block E1：Figma Desktop 已安装并在运行**
- 检测：询问用户是否已打开 Figma Desktop 且打开了目标文件；或 `pgrep -x Figma`
- 缺失引导：https://www.figma.com/downloads 下载安装 → 打开 → 打开目标设计文件

**Block E2：figwright MCP 已配置到 opencode**
- 检测：`grep -q '"figwright"' ~/.config/opencode/opencode.json && echo present || echo missing`
- 缺失引导：
  1. 编辑 `~/.config/opencode/opencode.json`，在 `mcp` 段加入：
     ```json
     "figwright": {
       "type": "local",
       "command": ["npx", "-y", "@figwright/mcp@latest"],
       "enabled": true
     }
     ```
  2. **重启 opencode** 使配置生效
- 通过确认：本会话能看到 figwright 的 MCP 工具（`ping`、`get_selection`、`get_design_context`、各类写工具等）

**Block E3：figwright 插件已导入 Figma 并连接**
- 检测：调用 figwright `ping` 工具 → connected
- 缺失引导：
  1. 打开 https://github.com/awdr74100/figwright/releases → 下载最新插件 zip → 解压
  2. Figma Desktop：菜单 → Plugins → Development → **Import plugin from manifest…** → 选择解压出的 `manifest.json`
  3. 运行插件（Plugins → Development → Figwright），界面显示 **Connected**
  4. 回对话让我再跑 `ping` 确认

## 执行步骤（对话式工作流）

1. **锁定目标**：让用户在 Figma 中选中要操作的帧/页面，或用 `get_selection` 读取当前选择。
2. **获取上下文**：用 `get_design_context` 获取去重后的设计上下文（布局/排版/变量/组件）；需要复用项目代码栈时，用 `component_map` / `token_map` / `icon_map` 关联代码库。
3. **执行修改**：根据用户意图调用写工具：
   - 建/改帧、文字、形状、auto-layout、效果、样式、变量、组件、页面
   - 复杂一次改多处用批量工具
4. **确认结果**：请用户在 Figma 中查看；或读回节点/截图确认。迭代直到满意。
5. 如果用户同时给了图片并要求照着改，先按 `workflows/image-to-figma.md` 路线A解析图片产出描述，再按本流程写入。

## 提示
- figwright 免费、双向、本地运行（设计数据不出本机），无需 Dev Mode seat，**不需要任何 API key**。
- 修改前先 `get_selection` / `get_design_context`，不要凭空猜测图层名。
- 参考 skill：`figma-codegen`（选择→代码）、`figma-build`（描述/代码→Figma 设计）。
- 需要把当前设计转成结构化描述给 AI 写代码时，改走 `workflows/figma-to-desc.md`。
- **SVG 源导入后的图层纪律**：SVG Place 进来的层中，`IMAGE` fill / `Clip path group` / `Group` 是图形层，不可当作色块删；删任何层前先 `get_node` 核对完整 children 列表。
- **SVG 处理工具习惯**：处理 .svg 时优先用现成库（`rsvg-convert` 渲染、`lxml`/`svgpathtools` 解析），不要自己写 Python SVG 解析；大 SVG 导入 Figma 需用户手动 Place（figwright `import_svg` 装不下）。
- 文字改色用 `set_fills`（`set_text_properties` 不支持 fills）；SVG 文字 path 转文本时 PingFang SC Bold 可能加载失败，用 Semibold 顶替。