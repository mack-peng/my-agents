# 做封面图

适用：小红书封面、小程序封面/广告图、公众号文章图、视频封面、活动海报。
原则：**渐进式能力 → 逐闸门 sign-off → 可被调用 → 可恢复**。

## 能力档

| 档 | 问什么 | 产出 |
|---|---|---|
| 快速 | hook + 刊名（≤2 问）；方向按内容类型默认 | 1 张封面 + feed 预览 + QA |
| 标准 | brief 5 字段（用途/刊名/钩子/事实/约束）；方向 3 选 1 | 1 张定稿 + recipe + note-copy |
| 完整 | 标准 + 2–3 变体 + A/B + 12 项评审 | 变体集 + 对比图（批量做法走 `workflows/batch-variants.md`，不另起一套） |

默认「标准」。用户说「你定」→ 用推荐方向并注明假设。

## Phase 表

| Phase | 文件 | 职责 | 产出 | 闸门 |
|---|---|---|---|---|
| 1 Brief | `cover/phase1-brief.md` | 采集（≤3 问）、校验、Brief 确认 | `cover-brief.md` | 闸门 1 |
| 2 Direction | `cover/phase2-direction.md` | 3 方向 + 推荐 | 用户选 | 闸门 2 |
| 3 Produce | `cover/phase3-produce.md` | 渲染 + QA + feed 预览 + 评审 | 初稿 PNG + 评审摘要 | 闸门 3 |
| 4 Deliver | `cover/phase3-produce.md`（同文件） | 交付 + 署名 + Handoff | PNG/JPG + recipe + note-copy | 闸门 4 |

## 调用契约（被其他 agent 调用时）

- **输入**：调用方提供 `cover-brief.md`（含 identity / hook / facts / size / ratio / output_dir）或等价字段
- **跳过菜单和预检**：直接校验 brief → 缺字段返回 `needs_input` + ≤3 问；齐了直接做
- **不猜事实**：数字/引用只来自 brief / 调用方材料；缺来源标缺口
- **输出契约**：
  - `cover-brief.md`（存档）
  - `xhs-cover-<W>x<H>.png / .jpg`
  - `feed-1x1.png` / `feed-1x1-320.png`
  - `recipe.md`（含 `## Status` + `## Handoff`）
  - `<out>.cover-qa.json`（由 `shoot --cover-qa` 产出，如 `xhs-cover-1440x1920.cover-qa.json`）
  - 可选 `note-copy.md`
- 调用方是 openfilm → 定稿 PNG 拷到影片根 `cover-3x4.png`
- **非小红书平台**：命名按 `{用途}-{平台}-{W}x{H}.png`（如 `miniapp-cover-1280x1024.png`、`wechat-cover-900x383.jpg`）；`feed-1x1` 预览仅小红书需要，其他平台跳过并在交付摘要中说明
- **路径约定**：所有命令在工作台根执行，输出 `output/<slug>/`；若 cwd 是 `image-agent/`，路径为 `../output/<slug>/`，不要写成 `image-agent/output/`

## 共用约束

- 尺寸：小红书 **1440×1920**（3:4）
- feed-first：关键信息 y0–1440；底部只放装饰或免责；文字 ≥90px @1440
- 文字/数字/Logo 全 HTML，AI 只出图
- 色板 ≤3、字体 ≤2、一个视觉中心

## 素材（Unsplash / AI）

```bash
unsplash search "<英文关键词>" --orientation portrait --download 2 \
  --out-dir output/<slug>/assets/refs/unsplash/
```

```bash
bl image generate --model qwen-image-3.0 \
  --prompt "<...>" --size 3:4 --n 1 --seed 42 --prompt-extend false --watermark false \
  --out-dir output/<slug>/assets/ai/
```

## 硬约束

- 必须出现的字、禁用元素、截止时间、是否可外发
- 事实与数字来自已确认材料，不编造
- 不让 AI 画中文标题 / Logo / 真实 UI
