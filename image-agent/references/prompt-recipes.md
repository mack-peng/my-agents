# 生图提示词配方

目标：让 AI 产出**能直接当素材用**的图，而不是"好看的随机图"。提示词必须服务构图：主体、留白、光线、色板、可用区域。

## 1. 基本结构

```
[主体] + [动作/状态] + [环境] + [构图/取景] + [留白位置] + [光线] + [色板] + [风格/媒介] + [镜头/质感] + [情绪]
```

示例：

```
A single abstract glass prism floating above a dark matte surface,
soft volumetric light from the upper right, deep charcoal background,
large empty negative space on the left for typography,
muted palette with one lime accent, premium editorial 3D render,
85mm lens, subtle grain, no text, no letters, no watermark, no logo
```

## 2. 封面背景专用

封面背景的第一要求是**给文字留地方**：

- 明确写出留白位置：`large empty negative space on the left / top / center`
- 明确不要文字：`no text, no letters, no typography, no watermark, no logo, no UI`
- 背景复杂度控制在"有质感但不抢字"：`subtle texture, soft gradient, shallow depth of field`
- 暗色封面加：`deep charcoal background, soft vignette, cinematic lighting`
- 亮色封面加：`warm off-white paper texture, soft daylight, minimal shadows`

模板：

```
<subject>, <composition>, large empty negative space in the <left/right/top/center>
for a headline, <lighting>, <palette>, <style>, <texture>,
no text, no letters, no typography, no watermark, no logo, no UI, no people
```

## 3. 风格预设

### 科技编辑感

```
premium editorial tech visual, dark charcoal background, glass and brushed metal,
one lime accent, volumetric light, subtle grid, cinematic contrast, fine grain,
clean geometry, no text, no letters, no watermark, no logo
```

### 温暖人文

```
candid editorial photograph, natural window light, warm neutral palette,
soft shadows, shallow depth of field, 50mm lens, authentic skin texture,
quiet atmosphere, no text, no letters, no watermark, no logo
```

### 极简产品

```
minimal product photography, single object on a seamless background,
soft studio light, gentle shadow, 85mm lens, high detail, clean composition,
large negative space, no text, no letters, no watermark, no logo
```

### 纸张拼贴

```
cut-paper collage, layered paper textures, torn edges, subtle print grain,
muted editorial palette, handmade composition, soft shadows between layers,
no text, no letters, no watermark, no logo
```

### 等距 3D

```
isometric 3D render, miniature scene, soft clay materials, pastel palette,
clean studio lighting, gentle ambient occlusion, high detail, centered composition,
no text, no letters, no watermark, no logo
```

### 电影感场景

```
cinematic still, anamorphic composition, dramatic side light, atmospheric haze,
deep shadows, muted teal and amber palette, 35mm film grain,
no text, no letters, no watermark, no logo
```

### 抽象渐变

```
abstract gradient mesh, smooth color transitions, soft grain, luminous depth,
deep charcoal to lime accent, minimal composition, large negative space,
no text, no letters, no watermark, no logo
```

### 复古印刷

```
retro print poster texture, halftone dots, misregistered ink, aged paper,
limited palette, bold geometric shapes, editorial layout, no text, no letters,
no watermark, no logo
```

## 4. 负向提示词

通用：

```
text, letters, words, typography, watermark, logo, signature, UI, screenshot,
low resolution, blurry, jpeg artifacts, oversaturated, cluttered composition,
busy background, distorted faces, extra fingers, deformed hands, bad anatomy,
duplicate limbs, plastic skin, generic stock photo
```

人物场景追加：

```
extra people, malformed eyes, asymmetric face, unnatural teeth, waxy skin
```

产品场景追加：

```
warped product, wrong proportions, fake brand, melted edges, extra parts
```

## 5. 图生图

原则：**保留什么、改什么、不能动什么**，三句话说清。

模板：

```
Keep the <subject/product/face/composition> exactly as it is.
Change <background/lighting/style/color> to <target>.
Do not change <logo/text/product shape/identity>.
```

示例：

```
Keep the product and its label exactly as they are. Replace the background with a warm
studio backdrop, soft gradient, gentle shadow. Do not change the product shape or text.
```

- 输入图先压到约 1024px / ≤500KB（火山 base64 限制）；保留原图用于最终合成。
- 一次只改一个变量；改多了无法判断哪一步有效。
- 图生图不用于改真实人脸身份、Logo、UI 文字。

## 6. 种子与迭代

- 固定 `seed` 再改 prompt，才能比较"只改了风格"的效果。
- 一次只改一个维度：主体 / 构图 / 光线 / 色板 / 风格。
- 记录每次的 prompt、negative prompt、model、req_key、seed、size、task_id、输出路径。
- 选中一张后，用同 seed 生成 2K/4K 版本；不要直接放大低清图。
- 失败/不满意时先改 prompt，不要盲目连抽；每次抽卡都花钱。

## 7. 常见问题

- **画面太满，没地方放字**：提示词加 `large empty negative space on the left/top`，并降低主体占比。
- **文字乱码**：AI 不应画字；加负向词，最终用 HTML 叠字。
- **Logo 变形**：不让 AI 画 Logo；用原始 SVG/PNG 在 HTML 叠加。
- **产品/UI 被改**：改走"真实截图 + HTML 透视/阴影"；不要让 AI 重绘。
- **人物手/脸崩**：减少人物数量、拉远镜头、避免手部特写；必要时换构图。
- **风格太泛**：加入具体媒介/镜头/光线/材质词，并绑定主题（不要用可套任何公司的通用词）。
- **颜色不统一**：明确色板（背景色、主色、强调色），后期用 HTML 遮罩/调色统一。
