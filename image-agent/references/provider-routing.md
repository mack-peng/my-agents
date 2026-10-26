# 供应商路由与命令

默认路由：**阿里云快稿 + 火山精修，按场景自动选**。用户点名供应商时以用户为准。

## 决策表

| 场景 | 首选 | 备选 |
|---|---|---|
| 快速草稿 / 批量探索 / 背景纹理 | 阿里云 `z-image-turbo` | 火山 `jimeng_t2i_v30` |
| 高质量中文审美 / 插画 / 主视觉 | 火山 `jimeng_t2i_v40` | 火山 `jimeng_seedream46_cvtob` |
| 换背景 / 多图合成 / 加 Logo 位置 | 阿里云 `bl image edit` + `wan2.7-image` | 火山 `cv20240606 Img2ImgXLSft` |
| 扩图 / 局部重绘 | 火山 `Img2ImgOutpainting` / `Img2ImgInpainting` | 阿里云 `bl image edit` |
| 需要精确保留文字/Logo/UI | **HTML 叠加**，不让 AI 重画 | 只让 AI 做背景 |
| 内部/敏感截图 | **纯手工 HTML**，不发给服务商 | 用户明确确认可外发后再用 AI |

## 阿里云百炼（`bl`）

前置：`bl auth status --output json` 的 `authenticated` 为 `true`。认证细节见 `aliyun-agent/AGENTS.md`。

### 文生图

```bash
bl image generate \
  --prompt "<prompt>" \
  --model z-image-turbo \
  --size 3:4 \
  --n 2 \
  --watermark false \
  --out-dir output/<slug>/assets/ai/
```

- `--size` 支持比例（`3:4`、`16:9`、`1:1`）或像素（`1440*1920`）。
- `--n` 最大 6；批量探索默认 2，最终稿默认 1。
- 模型：
  - `z-image-turbo`：快、便宜、同步，适合草稿/背景/纹理。
  - `wan2.6-t2i`：更高质量，适合最终主视觉。
  - `qwen-image-3.0`：**当前 MaaS 端点 429 频繁，不默认使用**。
- 默认关闭水印：`--watermark false`。
- 先看请求不扣费：加 `--dry-run`。

### 改图 / 多图合成

```bash
bl image edit \
  --image input/base.png \
  --image input/logo.png \
  --prompt "Place the logo in the bottom-left corner. Keep everything else exactly the same." \
  --model wan2.7-image \
  --size 1200*630 \
  --watermark false \
  --out-dir output/<slug>/assets/ai/
```

- `--image` 可重复，本地路径直接传，CLI 自动上传。
- 适合：换背景、去物、风格化、双图合并、把 Logo 放到指定角落。
- **Logo/文字最终仍优先用 HTML 叠加**：AI 可能把 Logo 变形、把中文写错。
- 模型：`wan2.7-image` 对双图合并稳定；`qwen-image-2.0-pro` 可做描述型编辑；`wanx2.1-imageedit --function stylization_all` 做风格化。

### 输出与记录

- `--out-dir` 指向 `output/<slug>/assets/ai/`；文件名用语义化英文。
- 记录：model、prompt、negative prompt、size、seed、耗时、输出路径。
- 失败不自动重试，避免重复扣费。

## 火山引擎（`ve`）

前置：`test -f ~/.volcengine/config.json`。认证细节见 `volcengine-agent/AGENTS.md`。
**不要执行 `ve configure get` / `ve configure list` 并把输出贴到对话或文件**，会泄露 AK/SK。

### 文生图（即梦 / Seedream，异步）

```bash
ve cv CVSync2AsyncSubmitTask --force --version 2022-08-31 --method POST \
  --region cn-north-1 --endpoint visual.volcengineapi.com \
  --body '{"req_key":"jimeng_t2i_v40","prompt":"<prompt>","width":1536,"height":2048,"force_single":true}'
```

```bash
ve cv CVSync2AsyncGetResult --force --version 2022-08-31 --method POST \
  --region cn-north-1 --endpoint visual.volcengineapi.com \
  --body '{"req_key":"jimeng_t2i_v40","task_id":"<task_id>","req_json":"{\"return_url\":true}"}'
```

- `req_key`：
  - `jimeng_t2i_v30`：快
  - `jimeng_t2i_v40`：质量（默认）
  - `jimeng_seedream46_cvtob`：最新
- 提交成功 `code=10000` 才有 `task_id`；查询 `status`：`in_queue` → `done` / `fail`。
- 返回的 `image_urls` **24 小时有效**，必须立即下载到 `assets/ai/`。
- `force_single=true` 强制单图，省积分；组图按张数计费，最多 15−输入图数 张。
- `width`/`height` 1K–4K；草稿 1024–1536，最终 2048；4K 前先确认。
- 批量/多 seed 前确认费用；失败不自动重试。

或使用封装脚本：

```bash
node image-agent/scripts/ve-image.mjs t2i \
  --prompt "<prompt>" \
  --size 1536x2048 \
  --out output/<slug>/assets/ai/hero.png
```

### 图生图 / 局部编辑（`cv20240606`，同步）

```bash
ve cv20240606 Img2ImgXLSft --req_key i2i_xl_sft \
  --body '{"req_key":"i2i_xl_sft","binary_data_base64":["<base64>"],"prompt":"<edit prompt>","scale":7,"return_url":true}'
```

- 本地图用 `binary_data_base64`；单图输入。
- 大图 base64 会超过命令行长度限制：先把输入压到约 1024px / ≤500KB 再传；大图复杂改图优先走阿里云 `bl image edit`。
- 也可用 `image_urls` 传可公网访问的 URL（需用户提供；不要临时上传敏感图到公开地址）。
- 其它 Action：
  - `Img2ImgOutpainting`：智能扩图
  - `Img2ImgInpainting`：交互编辑/局部重绘
  - `AIGCStylizeImage`：风格化
  - `FaceSwap` / `FaceSwapAI`：换脸（需确认授权，默认不做）
- 参数以 `ve cv20240606 <Action> -h --detail` 为准。

### `ve-image.mjs` 封装

```bash
node image-agent/scripts/ve-image.mjs t2i --prompt "<prompt>" --size 1536x2048 --out <path> [--req-key jimeng_t2i_v40] [--seed 42]
node image-agent/scripts/ve-image.mjs i2i --image input/ref.jpg --prompt "<edit prompt>" --out <path> [--req-key i2i_xl_sft]
```

- 自动 submit / poll / download；输出 JSON receipt（task_id、req_key、prompt、seed、size、out）。
- i2i 输入 > 500KB 时脚本拒绝并提示先压缩；不自动上传。
- 默认超时 180s，轮询间隔 2s；失败不重试。

## 成本与安全

- 默认只生成 **1 张最终稿**；草稿最多 2 张；批量/4K/组图先确认。
- 第一次调用供应商或数量 > 2 时，先向用户确认。
- 记录每次调用的 provider/model/req_key/seed/size/task_id/输出路径，写入 `recipe.md`。
- 图生图会把图片上传服务商；内部/敏感截图默认只走手工排版。
- 不生成真实人物换脸、名人伪造、侵权品牌素材；需要时先确认授权。
- 不把 API key 写入任何文件；CLI 已管理认证。
- 供应商报错先报告，不静默切换供应商、不自动重试。

## 验证记录

- 2026-10-26：`z-image-turbo` 1024×1024 调用成功（约 1.0MB）。速度快，但同一 prompt 下画面偏抽象、细节弱；适合草稿/背景纹理，不作为最终主视觉。
- 2026-10-26：`jimeng_t2i_v40` 1024×1024 调用成功（612KB，轮询约 3s）。空间感、材质和光线明显更好；适合最终主视觉。URL 24h 有效，脚本已即时下载。
- `ve-image.mjs` 的 `--task-id` 可用于恢复已提交任务，避免重复生成扣费。
- 火山 i2i（`cv20240606 Img2ImgXLSft`）目前只做了 `--dry-run` 参数验证（2026-10-26），未实测出图；首次真实使用时按小图（≤500KB）验证一次并回填本记录。
