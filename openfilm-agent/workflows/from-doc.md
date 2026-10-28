# 从文档做片（飞书文档 / 文章 → 影片）

适用：用户给一个文档要求做成影片（使用入口菜单 2）。典型场景：**AI 调研周刊、周报、发布说明、文章** 转视频。
原则：**阅读 → 提炼裁剪（闸门 1）→ 编排分镜（闸门 2）→ 制作 → 交付**。关键节点必须等用户确认，不闭门造车。

## Step 0 采集（一次问齐）

- **来源**：飞书文档 URL / Token（云文档、知识库均可）、Markdown 文件、或网页文章链接
- **目标**：平台与受众（封面/发布物料默认按小红书）；时长（有旁白时按内容定，不硬凑 60s——先确认内容，最终以 VO 实际时长锁定）；横版 / 竖版 / 双版；要不要声音（需用户先在 Studio → Settings → Providers 配 key）
- **内容限制（重要）**：
  - 哪些内容**可对外**？内部数据 / 内部人名 / 未公开信息要剔除或脱敏（用户圈定"可公开"范围）
  - 标题/结论是否允许改写（事实与数字**永不**改写，只可重写标题与措辞）
- **取舍选项**：全量覆盖 or 精选亮点（长文默认精选）；用户未提供项用默认值继续并在方案中标注

## Step 1 读取内容（委托 feishu-agent / firecrawl-agent）

- **飞书文档** → `docs +fetch` **直出 Markdown**，落盘即用（**禁止任何自制格式转换**——手写正则 HTML→Markdown 会静默丢内容，已验证）：
  ```bash
  lark-cli auth status    # 双身份 ready 才算就绪；未登录按 feishu-agent/AGENTS.md 引导扫码
  # 全文：原始 JSON 落盘 + 抽出 Markdown 正文
  lark-cli docs +fetch --api-version v2 --doc "<url或token>" --doc-format markdown > input/<name>-raw.json
  jq -r '.data.document.content' input/<name>-raw.json > input/<name>-raw.md
  # 大文档先看结构（拿到章节与 block id），再决定全文/局部：
  lark-cli docs +fetch --api-version v2 --doc "<url或token>" --scope outline --max-depth 3
  # 局部读取：--scope section --start-block-id <id>｜--scope keyword --keyword "词1|词2"
  ```
  - **参数以 CLI 自带文档为准**（随版本更新）：`lark-cli skills read lark-doc/references/lark-doc-fetch.md`；不依赖 feishu-agent 里可能过时的旧副本
  - **系统 Markdown 文件**（drive 里的 .md）→ `lark-cli markdown +fetch --file "<url或token>"`
- **网页文章** → firecrawl-agent（`firecrawl scrape`）或 browser-agent
- **媒体单独取**：Markdown 里图片/文件/画板是 `<image token="..."/>` 等标签 → `lark-cli docs +media-preview` / `+media-download`（下载的图可直接进 `assets/` 参与做片）
- **原文落盘**：`input/<name>-raw.json`（原始返回，原样保留）+ `input/<name>-raw.md`（Markdown 正文）；设计阶段只引用落盘文件与闸门 1 确认过的选取表，**不在对话里重贴全文**（AGENTS.md「编排纪律 · Context 隔离」）
- **规模盘点**：章节清单用 `--scope outline`；字数/候选亮点数从 md 统计；自检——md 标题数应与 outline 一致（除文档标题外）

## Step 2 提炼与裁剪 → 闸门 1（必须用户确认）

长文（周刊通常很长）**不搬运全文**，按目标时长提炼：

- 默认产出「**精选 3–5 条**」：每条 = 标题（一句）+ 摘要（一到两句）+ 原文数字/出处
- **没发生的事不做镜头**：负面/缺席信息（"某家本周零新品"类）不单独成镜——删掉，或在别的镜头里一句带过（实测：闭源静默整镜被用户砍掉）
- 或按用户要求：精简版（1 条主线讲透）/ 完整版（分镜对应章节，秒数按内容分配）
- 产出**内容选取表**并展示给用户：

  | 选取 | 来源章节 | 一句话摘要 | 用哪张图/数据 | 预估秒数 |
  |---|---|---|---|---|

  同表列出**删掉了什么、为什么**（跑题 / 内部 / 重复 / 时长不够）
- 限制检查：逐条过一遍"可对外"范围，剔除敏感项
- 选取表中的秒数是**预估**；最终时长以 VO 实际时长回填（见 Step 4）
- **等用户确认（增删/排序/时长）后才进入设计**

## Step 3 编排设计 → 闸门 2（必须用户确认）

- **选片型**（读 `openfilm skill <name>` 整篇照做）：
  - 信息类周刊 / 数据故事 → `motion-graphics`（首选）
  - 发布感 / 产品向 → `keynote`；讲解向 → `whiteboard`
- **分镜表**：镜号 ｜ 时长（预算值，VO 后回填）｜ 画面内容 ｜ 动效意图 ｜ 文案（精确到字；文案只来自 Step 2 确认过的内容）
- **口播稿生成 TTS 前完成口语自检**（整稿念一遍、读音改写表套用——见 `references/audio-subtitles.md`「口播稿自检」「读音改写表」）：重录是全链返工，别把书面语带进录音棚
- 确认后才动手（对齐 `workflows/build-film.md` Step 3 的 sign-off 要求）

## Step 4 制作

按 AGENTS.md「标准工作流 · 做片」：`open output/<film-name>` → 写页面 → **音频驱动时长**（先生成全部 VO → 量实际时长 → 回填 `at`/`duration` → 锁定总时长，详见 `references/audio-subtitles.md`）→ `look` 循环 → Studio 人机共编 → 后期验收（字幕抽 4 帧 + 混音对基线 + 封面）→ **默认不导出**（用户在 Studio 操作；有旁白/字幕成片走 Studio 烧录导出，`render` 不含字幕）。

**系列化（周刊复用）**：如果是周期性内容，首期按"可复用模板"做——
- 固定结构：`content.js` 纯数据（文案/数字/时长）｜ `scene.js` 共享渲染器 ｜ `styles.css` 共用样式 ｜ `scene-NN.html` 一镜一页（只有 `data-scene` 差异）｜ `cover-3x4.html` 封面
- 后续每期：**复制上一期工程**（命名 `<series>-YYYY-MM-DD`）→ 替换 `content.js` / 素材 / VTT / 封面 → 重新对时（VO 时长会变，总时长随之变）→ 清理旧 assets → `look` 复验
- 不直接改归档期工程；在交付说明里写清"下期改哪个文件哪几行"

## Step 5 交付说明

- 内容选取与裁剪记录（可回溯：选了什么、删了什么）
- 每个数字 / 引用标注原文出处（章节）
- 系列化：下期最快复用路径
- 字幕：有旁白时，带字幕成片走 Studio 导出「烧录字幕」；`render` 不含字幕；交付前抽 4 帧确认不压字
- 混音：记录 `look` 输出的 integrated LUFS / true peak，与基线比对（`references/audio-subtitles.md`）
- 封面与发布文案：小红书默认 3:4（`workflows/publish-kit.md`）
- 可改点：哪些文案在 Studio / 文件里可直接改

## 红线

- ❌ 改数字 / 引用 / 结论——事实原样，措辞可润色
- ❌ 未经用户确认把内部 / 敏感内容做进片子（闸门 1 必须逐条过）
- ❌ 长文不裁剪直接塞满分镜（时长失真、信息过载）
- ❌ 跳过闸门 1 / 2 直接制作；跳过 `look` 直接交付
- ❌ 把分镜秒数当锁定值（VO 后必须回填）；自动导出 / 写 Desktop/Downloads
