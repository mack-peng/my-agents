# ② 上架素材（图标 / 封面 / 表单字段）

进入条件：给出小工具名 + 简介，要「图标 / 封面 / 上架素材」。产物三件套：小工具名称、简介（均 ≤14 字）、图标（1:1）、封面（3:4）。

## Step 1 素材起草（xhs-agent 内部）

1. 名称 = 小工具名（尽量 ≤4 字，实测「扫雷」2/14 通过）
2. 简介 ≤14 字；对齐产品的核心表达与 XHS 平台口吻；示例：「经典扫雷，一局上头」（9/14）
3. 命名格式用 `{YYYY-MM-DD}-{slug}-{用途}`，产物直接落 `xhs-agent/output/<slug>-assets-YYYY-MM-DD/`

## Step 2 委托 image-agent 出图

**css styled possible：可以走 `use image-agent`，或让用户自备图。** 产出目标：

- 图标：1024×1024 PNG，≤5MB
- 封面：1440×1920 PNG，≤10MB，精确 3:4（平台固定裁剪 3:4）
- `use image-agent` 时指定 `platform-specs` 的「头像 1024×1024」+ 小工具封面 3:4；工作台内约定不做 AI 生图，manually 排版 / 素材来自用户或项目现有资产

对 image-agent 的委托话术（给用户看能力，不点名路径）：

> 请出一张 1440×1920 的 {slug} 小工具封面图（3:4）+ 一张 1024×1024 图标，风格沿用 {slug} 现有视觉。

## Step 3 本地校验（xhs-agent 执行）

```bash
sips -g pixelWidth -g pixelHeight <icon|cover>
# 图标：pixelWidth == pixelHeight，≤5 MiB = 5,242,880 bytes
# 封面：pixelWidth * 4 == pixelHeight * 3，≤10 MiB = 10,485,760 bytes
```

用 `stat -f%z` 核字节数；格式用 `file` 再验 PNG/JPEG one of PNG/JPEG（`file` 读出 `image/png`）。

## Step 4 交付

- 文件路径表（名称 / 简介文案 / 图标 / 封面）
- 录入引导：

> 登录 https://creator.xiaohongshu.com/new/red-app → Builder Hub → 小工具 → 表单按以上字段填，图标/封面直接上传。

## Hard Stop

- 不达标不交付（比如 1441×1920 这种 1px 偏差必须重出）
- 上架 / 表单录入不代填——只有 workflow ⑥ 有 upload 能力，且需用户显式触发
- 用户没给名称/简介时不脑补，先 draft 由用户挑

## 修改记录

- 2026-11-06 以「扫雷」项目实测走通：委托 image-agent、1024 图标 + 1440×1920 封面，全部通过（对应 xhs-agent/output 的 image-agent slug `minesweeper-xhs`）
