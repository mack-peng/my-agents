# 从文档出图

适用：飞书文档 / 知识库 / Markdown / 网页文章 → 封面图或分享图。
原则：**阅读 → 提炼裁剪（闸门 1）→ 设计方向（闸门 2）→ 制作 → 交付**。不闭门造车。

## Step 0 采集

- **来源**：飞书文档 URL/Token、Markdown 文件、网页文章链接。
- **出图类型**：封面（哪个平台/尺寸）或分享图。
- **目标**：读者看完记住什么；要突出哪 1 个主线。
- **内容限制**：哪些可对外？内部数据/人名/未公开信息剔除或脱敏。
- **取舍**：全量覆盖还是精选亮点（长文默认精选 3–5 条）。
- **风格**：默认深色科技编辑感；有品牌资产/参考图优先。

## Step 1 读取（委托）

- **飞书** → 读 `feishu-agent/AGENTS.md`，用 `lark-cli docs +fetch` 直出 Markdown：

```bash
lark-cli auth status
lark-cli docs +fetch --api-version v2 --doc "<url或token>" --doc-format markdown > input/<name>-raw.json
jq -r '.data.document.content' input/<name>-raw.json > input/<name>-raw.md
```

- 大文档先看结构：

```bash
lark-cli docs +fetch --api-version v2 --doc "<url或token>" --scope outline --max-depth 3
```

- **网页文章** → 读 `firecrawl-agent/AGENTS.md`，`firecrawl scrape`；需要登录/JS 渲染 → `browser-agent`。
- **媒体**：图片/画板用 `lark-cli docs +media-preview` / `+media-download`，下载到 `input/`；只把用到的拷进 `output/<slug>/assets/`。
- **原文落盘**：`input/<name>-raw.json` + `.md`；设计阶段只引用落盘文件与确认过的选取表，不在对话里重贴全文。

## Step 2 提炼与裁剪（闸门 1）

长文不搬运全文。默认产出「精选 3–5 条」，每条：

- 标题（一句）
- 摘要（一到两句）
- 原文数字/出处
- 可用的图/数据

产出**内容选取表**：

| 选取 | 来源章节 | 一句话摘要 | 用哪张图/数据 | 放封面哪个位置 |
|---|---|---|---|---|

同表列出**删掉了什么、为什么**（跑题/内部/重复/放不下）。

- 逐条过"可对外"范围，剔除敏感项。
- 数字/引用不改写；标题/措辞可润色。
- **等用户确认（增删/排序/主线）后才进入设计。**

## Step 3 设计方向（闸门 2）

- 根据内容选：左对齐编辑部 / 居中海报 / 满版图 + 底部渐变 / 数据卡堆叠。
- 给 2–3 个方向：概念、色板、字体、构图、AI/手工/混合。
- 封面默认混合：AI 背景 + HTML 标题/数据；如果内容偏数据/榜单，优先纯手工数据卡。
- 确认后才动手。

## Step 4 制作

- 按 `workflows/make-cover.md` 或 `make-share.md` 执行。
- 文案只来自 Step 2 确认过的内容；不新增事实。
- 数字卡最多 3 个数字；每个数字标注来源（可写在 `recipe.md`，不必都放图上）。
- 渲染 → `shoot` → 看图 → 修；按 `qa-checklist.md` 验收。

## Step 5 系列化（周刊/周报）

首期就按可复用结构做：

```
output/<series>-YYYY-MM-DD/
├── content.js          # 纯数据：标题/要点/数字/日期
├── styles.css          # 共用色板/字体/组件
├── cover-<size>.html   # 一尺寸一页
├── assets/             # 只放本期用到的
└── recipe.md
```

下一期：

1. 复制上一期工程，命名 `<series>-YYYY-MM-DD`。
2. 替换 `content.js`、素材、日期。
3. 重新渲染；检查数字/标题/安全区。
4. 清理旧 assets；不直接改归档期工程。

## Step 6 交付

- 图片 + `recipe.md`。
- 内容选取与裁剪记录（选了什么、删了什么、为什么）。
- 每个数字/引用的原文出处（章节）。
- 系列化：下期最快复用路径（改哪个文件哪几行）。
- 可选发布文案：标题/正文/标签，数字与图片一致。

## 红线

- ❌ 改数字/引用/结论（事实原样，措辞可润色）。
- ❌ 未经确认把内部/敏感内容做进图。
- ❌ 长文不裁剪直接塞满封面。
- ❌ 跳过闸门 1/2 直接制作。
- ❌ 不看图就交付。
- ❌ 自动发布到平台。
