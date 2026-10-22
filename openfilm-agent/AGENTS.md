# openfilm-agent

OpenFilm 封装 — 把 coding agent 变成 video agent：用**网页**做影片（`film.html` + `window.film.frame(t)`），本地浏览器 Studio 人机共编，`look` 自动校验，`render` 导出无字幕 MP4（带字幕走 Studio 烧录）。
上游：<https://github.com/openfilm/openfilm>（MIT）· 站点：<https://openfilm.dev>

## 使用入口（重要）

- 用户说 "use openfilm-agent" / "使用 openfilm-agent" 但**没有指定具体任务**时：**不要直接反问"想做什么"**。先展示能力菜单 + 实时预检结果，再引导用户选择。
- 展示模板（opencode 终端只渲染 CommonMark，**不要用管道表格**，用加粗 + 列表）：

```
openfilm-agent 能为你做什么

**1. 新建影片** — 告诉我内容与目标，我选片型、出分镜、做成片
　示例："做一支 8 秒小红书竖版，介绍我们的 AI 工作台"

**2. 从文档做片** — 给我文档（飞书链接 / 文章），我阅读、提炼编排、做成片
　示例："把这个 AI 调研周刊做成 60 秒竖版"

**3. 改片** — 定向修改已有影片：文案/配色/节奏/换素材/加删镜头
　示例："把 workbench-intro 的副标题改掉，节奏再快一点"

**4. 打开 / 续接** — 打开 Studio 继续编辑
　示例："打开 workbench-intro"

**5. 从示例起步** — 导入官方示例当起点改造
　示例："导入 one-prompt 示例"

**6. 检查 / 交付** — look 全片校验（确定性 + 报错）+ 字幕/混音/封面后期验收；导出默认由你在 Studio 操作，仅在你明确要求时我才执行
　示例："检查竖版那支，给我交付清单"

当前环境预检
- Node ✅ ｜ ffmpeg/ffprobe ✅ ｜ 渲染引擎 ✅ ｜ Studio ✅ 运行中

回复 1–6，或直接描述你的任务。
```

- 用户给出明确任务或选择编号后，再按 Workflow 索引读对应文档并执行。
- 预检命令（展示前实时检测，固定用下面这些，不缓存；缺失项按「环境与依赖」节引导，一次一步、等用户确认）：

```bash
node --version
ffmpeg -version 2>/dev/null | head -1; ffprobe -version 2>/dev/null | head -1
ls ~/Library/Caches/ms-playwright 2>/dev/null | grep chromium_headless_shell
pgrep -f "openfilm/studio/server/main.mjs" >/dev/null && echo "studio: running" || echo "studio: stopped"
```

按输出填入模板预检行，如：`Node ✅ v24.1.0 ｜ ffmpeg ✅ 9.0.2 ｜ 渲染引擎 ✅ ｜ Studio ✅ 运行中`。
- 展示用词（面向用户一律说人话，不用术语 / 报错腔）：**渲染引擎**（= 无头浏览器 / Playwright headless shell）｜**检查**（= look）｜**导出**（= render；带字幕 = Studio 烧录，默认由用户操作）｜**编辑台**（= Studio）；缺失项写"⏳ 首次使用时自动下载（约 93MB）"，不写命令报错原文。

## 入口判断

首次响应按输入形态分流（无任务 → 展示上方菜单）：

- 飞书文档 / 文章链接（带做片意图）→ 菜单 2，走 `workflows/from-doc.md`
- 影片名 / `output/` 下目录 → 菜单 4，`open` 打开；要改则走 `workflows/edit-film.md`
- 点名片型（"用 motion-graphics 做…"）→ 按内容走菜单 1/2，先 `skill <name>` 读整篇
- 直接描述任务 → 按 Workflow 索引匹配；匹配不到 → 展示菜单确认

## 环境与依赖（懒引导：实际使用时才检测，不预装）

```bash
node --version                    # 需 ≥ 22.2（本机 v24.1.0 ✅）
ffmpeg -version | head -1         # 缺失 → brew install ffmpeg（本机已装 9.0.2 ✅；macOS 14 无瓶装需源码编译，约 30-60 分钟）
git --version                     # Studio 版本保存需要（本机 ✅）
```

- 首次用到渲染引擎（Playwright headless shell）时（`open` / `look` / `render`，实测由 `open` 触发）自动下载 **93MB** 到 `~/Library/Caches/ms-playwright/`，一次性；系统里已有 Chromium/Chrome **不能**免除下载（Playwright 只用自管浏览器）。
- 下载失败手动补：`npx playwright-core install chromium-headless-shell`
- 桌面 app 兜底（自带 ffmpeg + 浏览器，免 CLI 依赖）：<https://openfilm.dev>
- 不安装官方 skill（`npx skills add openfilm/openfilm` 只有 462B 指针，内容已在本文件）；内置片型技能随 CLI 动态读取，无需安装、不 vendor。

## 入口与命令（`openfilm <命令>`）

- 本机 `openfilm` 已通过 `npm link` 指向本地 fork `/Users/mack/Open-projects/openfilm/packages/openfilm`；**不要用 `npx openfilm@latest`**（会绕过本地百炼 provider）。链接丢失时重新执行 `cd /Users/mack/Open-projects/openfilm/packages/openfilm && npm link`。
- **禁止 `openfilm update`**：本地 fork 可能落后上游且带未提交改动（如百炼 provider），update 会覆盖。CLI 打印 "newer version is out" 时只报告给用户，不执行升级；fork 升级是单独的手工任务，不属于本 agent 工作流。
- **不改 OpenFilm fork / CLI / Studio 代码**：openfilm-agent 是文档封装层，除非用户明确要求改 fork，否则只调用不修改。
- `openfilm` — 完整手册（约千字）；**实现/改片前先跑一次**，细节以手册为准
- `open [folder | url]` — 建/开影片；相对路径按 cwd 解析；GitHub 地址会被复制进 projects 库后打开
- `look [what] [t | a-b]` — 校验：接触表 + 同一 t 两遍乱序绘制比对 + 页面报错/字体失败/缺失音频/被裁文本检查（**不校验字幕**）；`look 4.5` 单帧、`look 3-6` 区间、`look assets/a.mp4` 媒体文件
- `render [a-b]` — 导出 MP4（画面+混音；**不烧字幕**；`--4k` / `--blur` 运动模糊 / `--alpha` 透明）；带字幕成片走 Studio 导出中心「烧录字幕」；**默认不执行——导出由用户在 Studio 操作，仅用户当次明确要求"你来导出"时才运行**；输出走项目根默认路径，禁止 `--out` 指向 Desktop/Downloads
- `get [what]` — 生成配音/音乐/音效/转写/图像/视频（需用户在 Studio → Settings → Providers 用自己的 key 连接服务商；视频 clip 贵，需用户在 Studio 确认）；单独运行可看哪些已连接
- `skills` / `skill <name>` — 内置片型技能（collage、keynote、long-to-short、lyric-video、motion-graphics、presenter-pip、replicate、screen-demo、vintage-film、whiteboard）：打印后**整篇读完照做**；技能文件夹只读，用到的文件复制进影片工程
- `openfilm <命令> --help` — 单命令选项

## 核心模型（细节以手册为准）

**影片 = 文件夹 + `film.html`**

- `<section>` = 时间线轨道（第一个在最上层：标题放素材前、背景放最后）；同轨 clip 不重叠
- **按层分层，不按镜头分层**：所有镜头页面放**同一个 section**，用顺序 `at` 硬切；音乐、VO 各自独立 section。拆成"一镜一 section"会变成并行轨道/黑帧（已实测教训）
- clip 就是元素：`<iframe>`（页面）/ `<video>` / `<img>` / `<audio>`；**每个声音独立成 clip**
- `src` + `#t=in,out` 选片段（无 duration 的页面/图片必须 `#t=0,长度`）；`at` 影片内起点（秒）；`left/top/width/height`（px）与 `rotate` 定位；外观用 CSS
- `speed`（0.25–4）改快慢：clip 时长 = (out−in)/speed，**只改 speed，不重做文件**；`volume`/`muted`；`id` 唯一名
- 页面没画到的部分透明；没有任何 clip 的时刻是黑色
- `overrides` 是人在 Studio 的修改：**原样保留，不合并不清理**

**页面（一个镜头一个页面）**

```js
window.film = {
  frame(t) { /* 画出 t 秒的全部画面，可用 three.js / WebGL / canvas / SVG / CSS */ },
  duration: 6,                 // 可选：页面自身时长
  ready: loadEverything(),     // 可选：Promise，settle 后才开始绘制
  width: 480, height: 320,     // 可选：只占画面一部分的页面
};
```

- **铁律：同一 `t` 永远画出同一画面**——帧会乱序、并行、插帧（运动模糊）调用，不得依赖上一次绘制结果
- 页面 `<head>` 的 `<meta name="viewport" content="width=<W>, height=<H>">` 必须与影片尺寸一致（竖版 1080×1920 就写 `width=1080, height=1920`）
- 页面必须提供时长：`window.film.duration`（推荐，一镜一页时每页各自设置），否则 iframe 需要 `#t=0,长度`；两者都没有时 clip 时长不确定
- 页面不滚动：不加 `scrolling` 属性，版面按完整画幅设计，内容切换用硬切/页面内动画
- 页面从不自己播放（无动画循环/自动播放）；`frame` 返回（或 Promise resolve）即捕获画面；WebGL 上下文需 `preserveDrawingBuffer: true`
- 页面没有声音：镜头音效放到 film.html 对应影片秒（clip 的 `at` + 页面 t − clip 的 in）；移动页面 clip 时同步移动其声音
- 页面 t 从 0 起是页面自己的时间；在影片中的位置/时长由 film.html 决定
- 一镜一页（五镜 = 五个页面），人才能单镜裁剪/重排/替换；共享的字体/颜色/logo 写成公共文件加载

**字幕**：媒体旁同名 `.vtt`（`vo/1.wav` → `vo/1.vtt`），Studio 据此生成影片字幕；**不要在页面里画字幕**。VO/VTT/混音/字幕 QA 细则见 `references/audio-subtitles.md`。

- VTT 是字幕源；`get asr` 只提供时间轴，文字必须以口播稿校正（专名、版本号、英文缩写常被听错）。
- `openfilm look` 看不到字幕；字幕要在 Studio 预览或烧录导出后抽帧验收。
- 当前 `openfilm render` 只出画面+混音，**不烧字幕**；带字幕成片用 Studio 导出中心勾选「烧录字幕」（自动化可用导出 API 的 `burnSubtitles: true`）。
- 竖屏字幕基线（1080×1920）：`y≈0.786`、字号 `3.8%`、黑色 box `48%`、圆角 `.18em`、padding `.5/.22em`、无描边无阴影；位置用相对比例，不写死像素。若压住正文/下一章标题/结尾大字，经 Studio 调位置。`at` / `speed` 改动字幕后随；换音频或换音色要重做 VTT。
- 字幕位置/样式属于人（`.film/subtitles.json`），**禁止文本编辑器直接改 JSON**；用户明确要求调整时，通过 Studio UI 或 Studio API 操作（等同于人在 Studio 改），改前先读当前配置。交付前抽 4 帧：开头、首个内容镜、密集信息镜、结尾。

## 人机协作规则（重要）

- 人在 Studio 随时改片：**改 film.html 前先读**，只改意图内的部分
- `locked` 轨道是人的：不碰；`hidden` 不显示、`muted` 不出声，同理尊重
- 媒体文件绝不裁剪/转码成新文件——裁只改 `#t=`，快慢只改 `speed`；裁剪显示交给 CSS
- 随手清理：`assets/` 只留影片用得到的媒体；做素材的中间产物删掉
- `.` 开头的文件/目录（`.film`、`.git`）属于工具，不动

## 编排纪律（多阶段任务通用）

**Sign-off 协议**（闸门之间不自动推进）：

- 每个闸门 / 版本完成后：输出总结 + 明确询问 "<阶段>完成，请确认是否继续？（回复 OK 继续 / 指出要改的）"
- 用户确认前不动手；用户提修改意见 → 回到对应步骤，不跳步
- 分镜表确认后转为 **TODO 清单**（`[~] 进行中` / `[x] 已完成（带结果）` / `[ ] 待处理`），禁批量勾选，交付前清零

**Hard Stop**（不做不请自来的动作）：

- **默认不导出**：不 `render`、不自动 Studio 导出/烧字幕——导出由用户在 Studio 操作；仅用户当次明确说"你来导出"时才执行，输出走项目根默认路径，禁止写 Desktop/Downloads
- 不替用户做 `get` 媒体（需先配 key；视频 clip 需用户在 Studio 确认）；provider 报错先报告用户，不静默切换服务商
- 不自动跳过闸门；不把未确认的内部内容做进片子
- 不动 `locked` 轨道与 `overrides`；不关用户的 Studio；不跑 `openfilm update`；不改 OpenFilm fork/CLI/Studio 代码

**Context 隔离**：

- 长文档先落盘 `input/`（gitignored）；设计阶段只引用落盘文件与确认过的选取表，不在对话里重贴全文
- 跨环节只传"确认过的结论"（选取表 / 分镜表 / TODO 状态），不传原始全文与中间产物

## 标准工作流

**做片**：

1. 仓库根执行 `openfilm open output/<film-name>` — 建片并先让 Studio 在场（用户在浏览器里实时看变化、可随时手动编辑）
2. 写页面 + 编排 film.html（需要片型参考时 `openfilm skill <name>`；有旁白时**音频驱动时长**——先生成 VO、量实际时长、再回填镜头 `at`/`duration`，详见 `references/audio-subtitles.md`）
3. 在影片目录内 `openfilm look` 校验（确定性 + 报错 + 响度；不校验字幕层），修 → look → 修，直到干净
4. **后期验收**：字幕抽 4 帧（开头/首个内容镜/密集信息镜/结尾）+ 混音对基线（`references/audio-subtitles.md`）；封面按 `workflows/publish-kit.md`
5. 交付 = Studio 预览 + 交付说明；**默认不导出**——用户在 Studio 操作；仅用户明确要求时 agent 执行（无字幕 `render`，带字幕 Studio 烧录）
6. 需要生成的素材 → `get`（先引导用户在 Studio 配好服务商 key）

**改片**：先读 film.html、相关页面与 VTT → 只改意图内部分 → `look` 复验。

## 输入输出

- 影片工程（目录）→ 仓库根 `output/<film-name>/`（gitignored）；`open` 相对路径按 cwd 解析，从仓库根传 `output/<film-name>`，或 `cd output` 后 `open <film-name>`
- 用户素材 → 仓库根 `input/`：图片 / logo（PNG·SVG）/ 视频（mp4·mov）/ 音频（mp3·wav）/ 文案·数据 / 字体（.ttf/.woff2）。**只把影片用到的拷贝进 `output/<片名>/assets/`**（Studio 媒体池可见、可编辑），其余不动；语义化英文命名；不重编码（裁只改 `#t=`、快慢只改 `speed`）
- 示例片（可直接当起点）：`openfilm open https://github.com/openfilm/examples/tree/main/one-prompt`

## 注意事项

- 需要飞书文档读取 → **use feishu-agent**（先读其 AGENTS.md）；**参数细节以 CLI 自带文档为准**（`lark-cli skills read lark-doc/references/lark-doc-fetch.md`，随版本更新；快捷命令可能过时）
- **飞书取数直出 Markdown**：`lark-cli docs +fetch --api-version v2 --doc "<url>" --doc-format markdown`（原始 JSON 原样落盘，`jq -r '.data.document.content'` 抽正文）；**禁止自制格式转换**——手写正则 HTML→Markdown 会静默丢内容（已实测教训）
- 网页抓取 → firecrawl-agent / browser-agent（读其 AGENTS.md）
- 影片工程本体就是状态：同机 `open` 即恢复（Studio 自带版本历史）；**不引入跨机持久化**（素材在本地，无此场景）

## Workflow 索引

| 触发条件 | 读取文件 |
|---------|---------|
| "新建影片" / "做一支片子" / 用户描述内容与目标（菜单 1） | `workflows/build-film.md` |
| "从文档做片" / 用户给飞书文档·文章链接要求做片（菜单 2） | `workflows/from-doc.md` |
| "改片" / 对已有影片定向修改（菜单 3） | `workflows/edit-film.md` |
| "打开" / "续接"（菜单 4） | 本文件「入口与命令」直接执行 `open`，无需读 workflow |
| "从示例起步"（菜单 5） | `open <github url>` 导入后，如需改造按 `workflows/edit-film.md` 流程 |
| "校验" / "检查" / "交付"（菜单 6） | 本文件「入口与命令」执行 `look` + 后期验收；导出默认用户在 Studio 操作，仅显式要求时 agent 执行 |
| "做封面" / "发布文案" / "小红书封面" | `workflows/publish-kit.md` |
