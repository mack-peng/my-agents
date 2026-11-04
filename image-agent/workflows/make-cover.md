# 做封面图

适用：小红书封面、小程序封面/广告图、公众号文章图、视频封面、活动海报。
原则：**一次采集齐 → 内容核对 → 方向 sign-off → 制作 → 看图迭代 → 交付**。

## Step 0 采集（一次问齐，不挤牙膏）

- **平台 / 尺寸**：默认按 `references/platform-specs.md`：
  - 小红书：1440×1920
  - 小程序分享：1280×1024
  - 小程序广告：810×1080
  - 公众号文章图：900×383
  - 视频封面：1920×1080 / 1080×1920
  - 用户给精确像素时以用户为准。
- **主题与目标**：一句话主题 + 读者看完要记住什么。
- **文案**：主标题（精确到字）、副标题、3–5 个要点/数字、标签/CTA。
- **素材**：Logo、产品截图、人物/场景图、数据来源、字体。放根 `input/`，说明哪些必须用。
- **视觉方向**：从 `references/art-direction.md` 的 5 个方向里选；用户没有倾向时，给 Swiss editorial / Photo-led / Data 三个选项。
- **模式**：手工 / 混合 / AI。封面常用**混合**（AI/摄影出主体 + HTML 文字），但不是默认；数据/观点类优先纯手工。
- **变体数**：默认 1 张；需要对比时 2–3 个方向。
- **硬约束**：必须出现的字、禁用元素、截止时间、是否可外发。

用户未提供的项用默认值继续（不阻塞），并在方案里标明默认假设。

## Step 1 内容与事实

- 每个数字/引用对来源；不确定的删掉或标缺口。
- 标题优先短：小红书 ≤ 15 字/行，公众号 ≤ 20 字；长标题先改文案，不靠缩小字号硬塞。
- 数据点最多 1–3 个；优先大数字/图表，不默认三张卡；不要为了版面编数字。
- 涉及内部/未公开信息 → 不用 AI，纯手工排版；除非用户确认可外发。

## Step 2 设计方向（闸门 2）

从 `references/art-direction.md` 选 3 个方向，每个写清：

- 方向名 / lineage
- 概念一句话（为什么贴这个主题）
- 参考图 1–2 张（URL 或本地路径；没有就说明这是方向假设）
- 色板（背景/主文字/强调色）
- 字体（标题/正文/元数据）
- 构图（主视觉位置/网格/留白）
- 主导视觉事件（大字/大数/照片/图表/色块）
- 图像处理（AI/摄影/纯色/纸张）
- 对应模板
- 反模式（这张图绝对不要出现什么）
- 推荐理由

等用户选一个再动手。**不要没选就默认做深色科技版**；用户明确说“你定”时才按推荐方向做，并注明可换。

## Step 3 制作

1. 建工程：

```bash
mkdir -p output/<slug>/assets/{ai,brand,fonts,refs}
cp input/<需要的素材> output/<slug>/assets/...
```

2. 按方向选模板，复制到 `output/<slug>/<name>.html`：

| 方向 | 模板 |
|---|---|
| Swiss editorial / 大字海报 | `templates/editorial-poster.html` |
| Photo-led cinematic（深色） | `templates/photo-cover.html` |
| Photo-led cinematic（亮色） | `templates/photo-cover-light.html` |
| Data / infographic | `templates/data-story.html` |
| Warm humanist | `templates/warm-paper.html` |
| Brutalist typographic | `templates/type-poster.html` |
| 深色科技 fallback | `templates/still.html` |

`data-story.html` 默认 1600×900 横向；做 3:4 封面时改成单列（大数字在上、图表在下），不要直接缩放。新模板按 1440×1920 设计；换 1080×1440 等尺寸时按比例改字号/边距/断行，不要只改 viewport。

3. **Prompt lab（需要 AI 图时）**：

先读 `.agents/skills/prompt-images/SKILL.md` 与 `references/prompt-recipes.md`，写清楚：

```text
用途 / 只传达一件事 / 比例 / 品牌观感
主体 / 构图 / 光线 / 色板 / 媒介 / 氛围 / 细节 / 约束
```

- 最终稿用 `qwen-image-3.0`；`z-image-turbo` 只做草稿/纹理。
- 结构化长 prompt 加 `--prompt-extend false`；固定 `--seed`。
- 默认 2 张候选，选定后再出 1 张最终稿。
- **不要默认生成 abstract dark tech texture**；背景必须有主体/场景，或者用 HTML/SVG 图形。
- 真实摄影优先 Unsplash：

```bash
unsplash search "<英文关键词>" \
  --orientation portrait --download 2 \
  --out-dir output/<slug>/assets/refs/unsplash/
```

```bash
bl image generate \
  --model qwen-image-3.0 \
  --prompt "<主体 + 构图 + 光线 + 色板 + 留白 + no text/no logo>" \
  --negative-prompt "text, letters, watermark, logo, UI, blurry, oversaturated" \
  --size 3:4 --n 1 --seed 42 --prompt-extend false --watermark false \
  --out-dir output/<slug>/assets/ai/
```

4. 写 HTML：改模板的 `--w` / `--h` 与 `<meta name="viewport">`、`:root` 色板/字体、文案断行、数据、素材路径、安全区；装饰出血加 `data-bleed`。
   - `photo-cover.html` / `photo-cover-light.html` 的 `.photo` 是占位：替换为 `background-image: url(...)` 或 `<img>`，不要保留空占位交付。
   - `warm-paper.html` 的 `.figure` 是占位：替换为真实小图或纸张纹理。
   - `editorial-poster.html` 的 `.ghost` 是背景大词，改 `--ghost: "..."`；不要让它和主题无关。
   - 新模板（editorial/photo/data/warm/type）没有内置 `@font-face`；要用 Maple 时按需添加。`still.html` 自带 Maple `@font-face`，字体缺失会 404，先删掉或换系统字体。

5. 渲染：

```bash
node image-agent/scripts/shoot.mjs output/<slug>/<name>.html \
  --out output/<slug>/<name>.png --json
```

6. 按 JSON 修：字体失败、图片缺失/低清、文字裁切、溢出、控制台错误。修完重跑。

7. **看图 + 设计评审**：`Read` 最终 PNG 全尺寸；再 `sips -Z 320` 看缩略图；按 `references/design-review.md` 打分并修正，然后按 `references/qa-checklist.md` 过一遍。

## Step 4 初稿 sign-off（闸门 3）

展示：

- 成品 PNG
- 一句话设计说明（为什么这样排）
- 设计评审摘要（12 项分数 / 减法测试）
- 每个数字的来源
- 可改点（标题/数据/颜色/背景）
- 默认假设

问："初稿完成，请确认（OK 继续 / 指出要改的）"。

## Step 5 交付

- 最终 PNG/JPG（按平台命名）。
- `recipe.md`（用 `templates/recipe.md`）。
- 可选发布文案：标题（≤20 字）、5 个要点、5–6 个标签；数字与图片一致。
- 多版本放 `archive/`；不覆盖用户输入。
- 交付说明写清：哪些字/数字在 HTML 里可直接改、下次怎么复用。

## 封面类型速查

| 类型 | 尺寸 | 关键约束 |
|---|---|---|
| 小红书 | 1440×1920 | 底部 12% 避开 UI；标题上 2/3；缩略图可读 |
| 小程序分享 | 1280×1024 | 中央 1:1 安全区；四周 6–8% |
| 小程序广告 | 810×1080 | 底部 10% 留给平台标签；重要内容上 80% |
| 公众号文章图 | 900×383 | **底部 28% 是标题覆盖区**；核心视觉上 60–65% |
| 视频封面横 | 1920×1080 | 右下角避开时长/播放按钮 |
| 视频封面竖 | 1080×1920 | 底部 15% 避开标题/按钮 |

## 反模式

- ❌ 用可套任何公司的通用模板。
- ❌ 让 AI 画中文标题、Logo、真实 UI。
- ❌ 编数字/引用；用未确认的内部数据。
- ❌ 未 sign-off 就做 3 个方向 × 多尺寸。
- ❌ 只跑 `shoot` 不看图。
- ❌ 把一个尺寸直接缩放成另一个比例。
- ❌ 自动导出到 Desktop/Downloads。
