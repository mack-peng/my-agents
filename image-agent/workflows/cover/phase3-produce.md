# Cover Phase 3: 制作与交付（闸门 3 + 闸门 4）

按 Phase 2 选定的方向出封面，全流程包含渲染 QA、feed 预览、设计评审、署名、Handoff。

## 制作

### 建工程

```bash
mkdir -p output/<slug>/assets/{ai,brand,fonts,refs}
```

### 按方向选模板

| 方向 | 模板 |
|---|---|
| Swiss editorial / 大字海报 | `templates/editorial-poster.html` |
| Photo-led cinematic（深色） | `templates/photo-cover.html` |
| Photo-led cinematic（亮色） | `templates/photo-cover-light.html` |
| Data / infographic | `templates/data-story.html` |
| Warm humanist | `templates/warm-paper.html` |
| Brutalist typographic | `templates/type-poster.html` |

### 渲染

```bash
# 在工作台根执行；若 cwd 是 image-agent/，把 output/ 换成 ../output/
node image-agent/scripts/shoot.mjs output/<slug>/<name>.html \
  --out output/<slug>/<name>.png --min-font 90 --cover-qa --json
```

- `--cover-qa` 产出 `<out>.cover-qa.json`（同目录，`xhs-cover-1440x1920.cover-qa.json`）
- 在 HTML 里标 `data-masthead`（刊名）和 `data-key`（钩子/数字/CTA），检查才会校验刊名 ≥120px、关键元素在 feed 1:1 区内

- `--min-font 90`：小红书封面强制字号（1440 宽下 <90px 在 feed 里不可读）
- 封面加 `--also-jpg` 出 JPG 备用

### Feed 1:1 预览

```bash
node image-agent/scripts/feed-preview.mjs output/<slug>/<name>.png
```

产出 `feed-1x1.png` + `feed-1x1-320.png`——信息流里的实际显示效果

### 设计评审

- `Read` 最终 PNG 全尺寸；`sips -Z 320` 缩略图；再 `Read` 缩略图
- 按 `references/design-review.md` 12 项打分
- **闸门 3 只展示前 3 项分数 + 2 个可改点**，完整表写进 recipe

### 闸门 3 消息形状

```
初稿（PNG）
一句话：<设计说明>
评审：概念 N / 主视觉 N / 缩略图 N（完整表在 recipe）
可改：<字号 / 图 / 文案>
OK / 改 X？
```

### 闸门 4 · 交付

- 最终 PNG + JPG（按平台命名，`xhs-cover-<W>x<H>.png`）
- `recipe.md`：含 `## Status` + `## Handoff` + 评审完整表
- `cover-qa.json`（`shoot --cover-qa` 产出）
- 可选发布文案：标题（≤20 字）、5 个要点、5–6 标签
- **署名**：Unsplash / AI 图片放正文末尾，不占封面小字
- 多版本放 `archive/`；不覆盖用户输入
- **双落点**：调用方是 openfilm 时，定稿 PNG 拷到影片根 `cover-3x4.png`

### 闸门 4 消息形状

```
交付
- PNG / JPG / feed-1x1 / recipe / cover-qa.json / note-copy
- 署名：Photo by <name> on Unsplash
- 复用：改 <file> 的 <字段>
```

## Hard Stop

- 不交付未看过的图（Read PNG 全尺寸 + 320 缩略图）
- `shoot` 有硬错误不算完成
- 不写 Desktop / Downloads
- 不让 AI 画中文标题 / Logo / 真实 UI
