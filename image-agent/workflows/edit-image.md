# 改图

适用：换背景、去物、扩图、局部重绘、改风格、改颜色、加/换 Logo、改尺寸、多图合成。
原则：**原图只读 → 明确改什么/保留什么 → 选对工具 → 输出新版本 → 对比验收**。

## Step 0 检查原图

- 尺寸、比例、清晰度；是否够最终展示尺寸（≥ 1.2 倍）。
- 主体/人脸/产品/文字/Logo 哪些必须原样保留。
- 版权/授权：用户图 / 已授权图 / AI 生成；不处理来源不明的敏感图。
- 是否可外发：内部/敏感图默认**只走 HTML 叠加**，不发给 AI 服务商。

## Step 1 选方法

| 需求 | 方法 |
|---|---|
| 加文字/Logo/数据卡/边框 | **HTML 叠加**（最稳，精确） |
| 换背景、去物、风格化 | 阿里云 `bl image edit` + `wan2.7-image` |
| 多图合成/把 Logo 放到指定位置 | 阿里云 `bl image edit --image a --image b`（Logo 最终仍 HTML 叠） |
| 扩图/补画面 | 火山 `Img2ImgOutpainting`；或阿里云 edit 提示"extend the background" |
| 局部重绘 | 火山 `Img2ImgInpainting`；或阿里云 edit 描述局部 |
| 风格迁移 | 火山 `Img2ImgXLSft` / `AIGCStylizeImage`；阿里云 `wanx2.1-imageedit --function stylization_all` |
| 改尺寸/裁切 | CSS `object-fit` / `object-position`；或用 `sips` 裁切，不拉伸 |

## Step 2 执行

### HTML 叠加（文字/Logo/数据）

1. 原图拷到 `output/<slug>/assets/`。
2. 以 `templates/still.html` 做画布，图片作为 `.bg` 或 `.hero`。
3. 文字/Logo/数据用 HTML 排；Logo 用原始 SVG/PNG。
4. `shoot` 渲染；检查裁切/对比/安全区。

### 阿里云改图

```bash
bl image edit \
  --image input/<原图>.png \
  --prompt "Keep the product exactly as it is. Replace the background with <target>. Do not change the logo or any text." \
  --model wan2.7-image \
  --size <目标比例或像素> \
  --watermark false \
  --out-dir output/<slug>/assets/ai/
```

- 本地路径直接传；`--image` 可重复做多图合成。
- 一次只改一个变量；改背景就不要同时改风格。
- AI 可能改 Logo/文字/产品形状：最终用 HTML 合成原图 + 新背景，或只取 AI 的背景。

### 火山改图

```bash
ve cv20240606 Img2ImgXLSft --req_key i2i_xl_sft \
  --body '{"req_key":"i2i_xl_sft","binary_data_base64":["<base64>"],"prompt":"<edit prompt>","scale":7,"return_url":true}'
```

- 输入先压到约 1024px / ≤500KB；大图复杂改图优先阿里云。
- 扩图/局部重绘用 `Img2ImgOutpainting` / `Img2ImgInpainting`，参数以 `ve cv20240606 <Action> -h --detail` 为准。

## Step 3 对比验收

- 原图 vs 新图并排看：主体/人脸/产品/Logo 是否被改。
- 边缘是否自然：接缝、光影、透视、色温。
- 文字/Logo 是否变形、模糊、错字。
- 放大 100% 看 AI 痕迹：多余手指、重复纹理、融化边缘。
- 尺寸/比例是否准确；是否有不必要裁切。
- 不覆盖原图：输出 `v2` / `archive/`。

## Step 4 交付

- 新图 + `recipe.md`，写清：改了什么、保留了什么、用了哪个 provider/model/prompt、失败/重试情况。
- 如果 AI 改了不能改的东西，回到 HTML 合成方案，不硬交付。
- 用户可能要源文件：给 HTML + assets。

## 反模式

- ❌ 直接覆盖 `input/` 原图。
- ❌ 让 AI 改真实人脸身份、Logo、UI 文字。
- ❌ 一次改多个变量，无法判断效果。
- ❌ 大图 base64 硬塞命令行导致失败。
- ❌ 把内部截图上传服务商。
- ❌ 只看缩略图不看 100%。
- ❌ 用拉伸/非等比缩放改尺寸。
