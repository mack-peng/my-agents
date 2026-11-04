# 生图提示词配方

目标：让 AI 产出**能直接当素材用**的图，而不是“好看的随机图”。

方法主要来自 `replicate/skills@prompt-images`（Apache-2.0，已安装在 `.agents/skills/prompt-images/`），并按本 agent 的 provider 做本地化。写 prompt 前先读该 skill；本文件只保留最常用的规则和模型差异。

## 1. 先写 brief，再写 prompt

四问：

1. **用途**：封面背景 / 分享图 / 文章配图 / 产品概念 / 头像 / 海报底图。
2. **只传达一件事**：一句话。想讲五件事，就等于什么都没讲。
3. **比例/尺寸**：3:4、16:9、1:1、2.35:1 或精确像素。
4. **品牌观感**：色板、字体气质、参考图、禁用元素。

产出一句话 brief：

```text
[用途] for [平台/比例]，传达 [一件事]，采用 [风格/材质/光线]，在 [位置] 留白。
```

## 2. Prompt 八要素

```text
[主体] + [构图/取景] + [光线] + [色彩] + [媒介/风格] + [氛围] + [细节/焦点] + [约束]
```

- **主体**：具体到材质和状态。“磨砂黑陶瓷杯”，不是“一个杯子”。
- **构图/取景**：close-up / wide / flat lay / 主体在左 1/3 / 右侧留白给标题。
- **光线**：方向、质量、时间。“左侧柔和窗光”“右上方硬质聚光”“阴天平光”。
- **色彩**：命名色或品牌色。“深炭黑 + 一个暖橙强调”；不要只写“高级感”。
- **媒介/风格**：editorial photography / cinematic still / 3D render / flat vector / watercolor。
- **氛围**：calm / tense / optimistic / editorial / documentary。
- **细节/焦点**：浅景深、微距、纹理、雨滴、纸纤维、拉丝金属。
- **约束**：比例、留白位置、不要文字/Logo/UI/人物。

## 3. 写法

- **自然语言优先**。现代模型理解句子和空间关系，关键词堆叠会变得更随机。
- **具体胜过冗长**。每个词都要能改变画面；删掉不指导画面的形容词。
- **正向描述**。与其写“不要汽车”，不如写“空荡、安静的街道”；负向 prompt 按模型支持情况使用。
- **文字用引号**。如果确实要 AI 渲染文字（本 agent 默认不用），把文字放进 `"..."`，并写清字体、字重、颜色、位置。
- **镜头/灯光词是有效控制**：35mm / 85mm、f/1.4、golden hour、softbox、rim light、overcast。
- **材质词是有效控制**：brushed steel、matte aluminum、kraft paper、frosted glass、coarse linen。
- **身份保留**：有参考图时，用短而硬的句子：“Use the person/object in the reference images as the same identity. Do not redesign it. Only change scene, pose, clothing, lighting, rendering style, and composition.” 不要写一长串面部特征，那会合成一个新的人。

## 4. 模型差异

### `qwen-image-3.0`（最终稿默认）

- 长段自然语言，信息密度高；适合主视觉、复杂场景、海报底图。
- 用 8–14 个空间位置短语走遍画面：左上、顶部横带、左侧、中心、右侧、下三分之一、右下角。
- 结构：一句 20 词左右的开场（媒介 + 风格 + 主体 + 背景/色板）→ 背景/表面 → 按区域走画面 → 文字（如有）→ 独立一句光线 → 一句整体构图/氛围收尾。
- 比例放在 CLI `--size`，不要写进 prompt 正文。
- 精细控制时用 `--prompt-extend false`，避免 CLI 改写你写好的长 prompt；只有一句粗略想法时才让它扩写。
- 默认 `--n 1` 最终稿；草稿最多 2 张。

```bash
bl image generate \
  --model qwen-image-3.0 \
  --prompt "<完整自然语言 prompt>" \
  --negative-prompt "text, letters, watermark, logo, UI, blurry, oversaturated" \
  --size 1536*2048 \
  --seed 42 \
  --prompt-extend false \
  --watermark false \
  --out-dir output/<slug>/assets/ai/
```

### `wan2.7-image`（改图 / 多图合成）

- 强项：换背景、去物、风格化、双图合并、保留主体。
- 写清三件事：**保留什么、改什么、不能动什么**。
- 一次只改一个变量；改背景就不要同时改风格。
- Logo/文字最终仍用 HTML 叠加。

```bash
bl image edit \
  --image input/base.png \
  --prompt "Keep the product, its label, and the camera angle exactly as they are. Replace only the background with a warm studio backdrop, soft gradient, gentle shadow. Do not change the product shape or any text." \
  --model wan2.7-image \
  --size 1200*630 \
  --watermark false \
  --out-dir output/<slug>/assets/ai/
```

### 即梦 / Seedream（火山）

- 画面审美强，适合高质量中文主视觉；异步任务，提交后轮询。
- prompt 具体但不必写到 500 词；主体、环境、构图、光线、色板、镜头/材质写清即可。
- 固定 `--seed`；最终稿 `force_single=true`；URL 24 小时有效，脚本会立即下载。
- 4K / 批量 / 多 seed 前先确认费用。

```bash
node image-agent/scripts/ve-image.mjs t2i \
  --req-key jimeng_t2i_v40 \
  --prompt "<prompt>" --size 1536x2048 --seed 42 \
  --out output/<slug>/assets/ai/hero.png
```

### `z-image-turbo`（只做草稿/纹理）

- 快、便宜，适合探索方向和生成极淡的纸纹/纹理。
- 不用于最终主视觉；不要用它的输出直接交付。
- prompt 可以短一些，但主体/构图/色板仍要写。

## 5. 按视觉方向加约束

### Photo-led / 摄影

在 prompt 末尾加：

```text
editorial photography, subject placed on the left third, soft directional window light from the left, muted charcoal and warm grey palette, shallow depth of field, large empty negative space on the right for a headline, no text, no letters, no typography, no watermark, no logo, no UI
```

### Warm humanist / 纸张人文

```text
quiet editorial photograph, warm off-white paper and natural materials, soft diffused daylight, muted earth tones with one ochre accent, film grain, large breathing room, no text, no letters, no watermark, no logo, no UI
```

### Swiss editorial / Brutalist / Data

默认**不用 AI 出主画面**。用 HTML/SVG 做字体、色块、网格、图表；AI 只可做极淡的纸纹/纹理，且不能抢字。

## 6. 负向 prompt

通用：

```text
text, letters, words, typography, watermark, logo, signature, UI, screenshot,
blurry, low resolution, jpeg artifacts, oversaturated, cluttered composition,
busy background, generic stock photo, distorted faces, extra fingers, deformed hands,
bad anatomy, duplicate limbs, plastic skin
```

- 现代模型不一定支持负向 prompt；不支持时，把约束写成正向描述。
- 不要把“no text”交给负向 prompt 就完事；最终文字仍然 HTML 叠加。
- 负向词不要堆 50 个；只放真正会毁图的 5–10 个。

## 7. 参考图与图生图

- 需要风格一致：给 1–2 张参考图，用 `bl image edit` / `ve i2i`，写“保留什么、改什么”。
- 需要角色/产品一致：短句锁定身份，不要长描述；参考图 2–4 张足够。
- 输入图先压到约 1024px / ≤500KB（火山 base64 限制）；原图另存，用于最终 HTML 合成。
- 图生图会把图片上传服务商；内部/敏感截图默认只走 HTML。

## 8. 迭代

- 默认先出 2 张候选；选定后再出 1 张最终稿。
- 一次只改一个维度：主体 / 构图 / 光线 / 色板 / 风格。
- 固定 seed 再改 prompt，才能比较“只改了风格”。
- 记录：provider、model、prompt、negative、seed、size、task_id、输出路径、耗时。
- 失败不自动重试；先报告，避免重复扣费。

## 9. 常见错误

- 关键词堆叠：`cool office, 4k, masterpiece, ultra detailed`。
- 用 `transform` 做小修改，导致整个人/产品被换掉。
- 不写“保留什么”，模型把不能动的东西改了。
- 在没有负向 prompt 能力的模型上硬塞负向词。
- 引导系数过高，画面“烧焦”；降低 CFG/scale。
- 期望模型有实时知识；它没有。
- 复杂场景写得太短；现代模型能吃长 prompt，但每个要求要写清。
- 忽略比例；用模型不擅长的尺寸。
- 用错模型；某个模型不擅长文字/去物/换角度，换模型比硬调 prompt 更快。
- 以为写了 `no readable screens` 模型就不画屏幕文字；实测 qwen-image-3.0 仍会生成可读代码/UI。含屏幕的题材要加局部遮罩，或让屏幕在画面外/严重虚焦。
- 不迭代；一次没出好就放弃，或者盲目连抽。

## 10. 弱 → 强示例

**弱**

```text
cool tech background, 4k, masterpiece, ultra detailed
```

**强**

```text
A calm editorial still life on a dark charcoal desk: a single matte-black ceramic cup, a folded sheet of warm off-white paper, and a thin lime-green cable, arranged on the left third. Soft directional window light from the upper left, long gentle shadows, muted charcoal and warm grey palette, shallow depth of field. Large empty negative space on the right for a headline. Premium editorial photography, 85mm lens, subtle grain, no text, no letters, no typography, no watermark, no logo, no UI.
```

**弱**

```text
make the background better
```

**强**

```text
Keep the product, its label, and the camera angle exactly as they are. Replace only the background with a warm studio backdrop: soft gradient from warm grey to off-white, a gentle shadow under the product, no props. Do not change the product shape, label, or any text.
```
