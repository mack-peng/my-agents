# 生成一张图

适用：用户描述"我想要一张……"的图：文生图、图生图、插画、背景、概念图、纹理、头像、海报底图。
原则：**先判断文字是否关键 → 选模式 → 写 prompt → 出候选 → 选图 → 后期合成 → 验收**。

## Step 0 采集

- **用途**：封面背景 / 分享图 / 文章配图 / 产品概念 / 头像 / 壁纸 / 其他。
- **画面**：主体、动作/状态、环境、风格、色板、光线、镜头感。
- **比例/尺寸**：3:4、16:9、1:1、2.35:1 或精确像素。
- **文字**：画面里要不要字？要 → 文字最终用 HTML 叠；不要 → prompt 加负向词。
- **参考图**：有就放 `input/`；图生图前确认可外发。
- **数量**：默认 2 张候选；最终 1 张。批量/4K 前确认费用。
- **供应商**：默认快稿阿里云、精修火山；用户点名则从用户。

## Step 1 选模式

| 情况 | 模式 |
|---|---|
| 文字、数据、Logo、UI、图表是主体 | **手工 HTML/SVG**，不用 AI |
| 真实照片（办公室/人物/城市/产品场景） | **Unsplash**，见下文 |
| 插画、纹理、背景、概念图 | **AI 文生图** |
| 需要 AI/摄影画面 + 精确文字/Logo | **混合**：AI/摄影出图，HTML 叠字 |
| 要保留现有图的主体/风格 | **图生图**，见 `edit-image.md` |

## Step 2 写 prompt

按 `references/prompt-recipes.md`：

```
[主体] + [动作/状态] + [环境] + [构图/取景] + [留白位置] + [光线] + [色板] + [风格/媒介] + [镜头/质感] + [情绪]
```

封面背景必须写：

- `large empty negative space on the <left/right/top/center> for a headline`
- `no text, no letters, no typography, no watermark, no logo, no UI`

负向词按场景追加；人物/产品/文字各有专项。

## Step 3 出候选

### 阿里云快稿

```bash
bl image generate --prompt "<prompt>" \
  --model z-image-turbo --size <比例或像素> --n 2 \
  --negative-prompt "<负向词>" --watermark false \
  --out-dir output/<slug>/assets/ai/
```

### 火山精修

```bash
node image-agent/scripts/ve-image.mjs t2i \
  --prompt "<prompt>" --size 1536x2048 --seed 42 \
  --out output/<slug>/assets/ai/hero.png
```

或直接 `ve cv CVSync2AsyncSubmitTask` + `GetResult`，见 `references/provider-routing.md`。

### Unsplash 摄影素材

需要真实照片（办公室、人物、城市、产品场景）而不是 AI 画面时：

```bash
unsplash search "<英文关键词>" \
  --orientation landscape --per-page 6 --json

unsplash search "<英文关键词>" \
  --download 2 --out-dir output/<slug>/assets/refs/unsplash/
```

配置、署名与 License 见 `references/unsplash.md`。

规则：

- 默认只出 2 张候选；选定后再出最终 1 张。
- 固定 seed 再改 prompt，一次只改一个维度。
- 记录 prompt / negative / model / req_key / seed / size / task_id / 输出路径。
- 失败不自动重试；报告用户。

## Step 4 选图与后期

看图（`Read` 候选 PNG）：

- 构图是否给文字留了空间？
- 主体是否清楚、没有畸变？
- 有没有乱码文字、假 Logo、多余手指、拼接缝？
- 色板是否统一？是否需要调色/遮罩？

选定后：

- 裁切/构图用 CSS `object-fit: cover` + `object-position`；不拉伸。
- 需要文字/Logo → 以 `templates/still.html` 做 HTML 合成，再 `shoot`。
- 需要统一色调 → 在 HTML 加遮罩/渐变/滤镜；不要反复重生成。
- 低清图不放大充数；重新生成或缩小展示。

## Step 5 交付

- 最终图（PNG/JPG）+ `recipe.md`。
- 如果用了 AI 文字/Logo/产品图，明确说明"未采用，已用 HTML 重排"。
- 用户要源文件时给 HTML + assets；不要只给压扁的 PNG。

## 反模式

- ❌ 让 AI 画中文标题、Logo、真实 UI、数据图表。
- ❌ 画面塞满，没有文字区。
- ❌ 无脑连抽；每次抽卡都花钱。
- ❌ 用低清图放大。
- ❌ 把 AI 生成的乱码字当最终字。
- ❌ 未经确认批量/4K。
- ❌ 把内部截图发给服务商。
