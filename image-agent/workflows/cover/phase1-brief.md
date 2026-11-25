# Cover Phase 1: Brief（采集与确认）

从本 agent 的 `templates/cover-brief.md` 复制到 `output/<slug>/cover-brief.md`，逐字段填写。
**被其他 agent 调用时**：brief 已由调用方提供，跳过填写，直接用 `check-cover-brief` 校验。

## 需要用户提供的（最多 3 问，分组问）

1. 刊名/期次（identity + issue）
2. 一句话钩子（hook + subhook）
3. 事实来源（文章/链接/直接给数据，每条带出处）

## 不需要问的（有默认值）

| 字段 | 默认值 | 说明 |
|---|---|---|
| platform | xiaohongshu | |
| size | 1440x1920 (3:4) | 与 image-agent `platform-specs.md` 统一 |
| ratio | 3:4 | |
| visual_direction | 按内容类型默认 | 数据/资讯 → Swiss editorial/Data；有真实主体 → Photo-led |
| mode | standard | 标准（brief + 3 方向 + 1 稿）；快速→只出 1 稿；完整→多变体 + A/B + 完整评审 |
| output_dir | output/<slug>/ | |
| deadline | 不设 | |

## 流程

1. **用 `templates/cover-brief.md`** 复制到工程，填 frontmatter + 事实表 + 约束
2. **校验**：`node image-agent/scripts/check-cover-brief.mjs <file>` — 缺必填/超字数/无来源即报
3. **展示 Brief 确认**（≤6 行）+ 假设列表

## Brief 确认消息形状

```
Brief 确认
- 用途/平台：小红书 3:4 1440×1920
- 刊名/期次：<identity>
- 钩子：<hook>
- 事实：N 条（均带出处）
- 约束：无小字 / feed 1:1 可见
OK / 改？
```

## 闸门 1 · Sign-off

用户 OK → 进 Phase 2（方向）。改 → 回到本文件修订。

## 校验失败处理

- 缺字段 → 返回 `needs_input` + 最多 3 个分组问题，不猜事实、不改数字
- 事实无来源 → 返回 `needs_input` 要求补来源，**不编造**
- brief 由调用方 agent 提供 → 校验格式后直接进闸门 2
