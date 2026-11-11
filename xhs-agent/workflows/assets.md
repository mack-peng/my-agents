# ② 上架素材（图标 / 封面 / 表单字段）

进入条件：用户要「图标 / 封面 / 上架素材」。产物三件套：小工具名称、简介（均 ≤14 字）、图标（1:1）、封面（3:4）。

## Step 0 目标解析（通用入口；规则详见 AGENTS.md）

1. 用户点名工具 → 用之；
2. 未点名 → `ls xhs-agent/output/*/` 列 manifest 候选让用户选；
3. 无记录 → 一次集中问：小工具名称（当场报 n/14）+ 简介意向（可用一句话素材让 agent 起草）。

禁止从会话上下文静默代入历史工具；想用上下文推断必须显式声明并给纠正机会。

## Step 1 素材起草（目标确定后）

1. 名称 = 小工具名（尽量 ≤4 字，实测「扫雷」2/14 通过——仅作实测案例，非默认值）
2. 简介 ≤14 字；对齐产品的核心表达与 XHS 平台口吻；示例：「经典扫雷，一局上头」（9/14）
3. 命名格式用 `{YYYY-MM-DD}-{slug}`，产物落 `xhs-agent/output/{YYYY-MM-DD}-{slug}/`，含 manifest.md

## Step 2 委托 image-agent 出图（或用户自备图）

产出目标：

- 图标：1024×1024 PNG，≤5MB
- 封面：1440×1920 PNG，≤10MB，精确 3:4（平台固定裁剪 3:4）

委托示例话术（给用户看能力，不点名路径）：

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

- 2026-11-06 第一次修订：补 Step 0 通用目标解析 + manifest 登记；清理草稿残留字句；「扫雷」降级为实测案例
- 2026-11-06 以「扫雷」项目首次实测走通：委托 image-agent、1024 图标 + 1440×1920 封面全部通过（对应 `output/2026-11-06-saolei/`）
