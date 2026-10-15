# 项目方向评审（Project Review）

**这条工作流是什么**：以 **Spec + Code Design** 为需求合约来源的代码评审（即设计一致性评审）。输入 = Spec + Code Design 文档 + MR。评审逐条对照需求与设计检查实现完整性。

**分几步**：4 步（解析 Spec / Code Design → 获取 diff → 建索引 → 进入共用评审流程）。

**哪几步停下来等你**：来源无法读取或缺失时先确认/记录阻塞；`review.md` 交付后等待确认。

---

## 输入

| 项 | 必需 | 说明 |
|----|------|------|
| Spec | ✅ | 本地文件 / Confluence 链接 / 飞书文档链接 |
| Code Design | ✅ | 本地 `output/` / Confluence 链接 / 飞书文档链接 |
| MR / PR | ✅ | GitHub PR / GitLab MR / 本地 diff |
| 代码库路径 | 建议 | 用于本地 diff 与周边代码检查 |

Spec 或 Code Design 缺失其一 → 明确告知用户只能做部分对照（缺哪一侧就少哪一侧的一致性检查），或按优先级先做可得的一侧。

---

## 步骤

### 1. 解析来源（需求合约）

先到 **routing 深度**（标题、Requirement 编号、关键设计决策、目录/链接），不把全文读进根上下文。

**本地文件** → 直接 Read（`specs/`、`output/` 等）。

**Confluence** → 委托 acli-agent：

```bash
acli confluence page view --id <page-id> --json
acli confluence page view --id <page-id> --json --body-format storage
```

**飞书文档** → 委托 feishu-agent（读其 AGENTS.md 后按快捷命令取文档正文）。

**记录来源类型**（写进 `review-index.md` 与 `review.md` 的「评审输入」）：

- `local`：本地路径
- `confluence`：page id / URL
- `feishu`：文档 URL

读不到 → 记录阻塞的凭据/工具原因，标 `🚧 Not checked`，不假设合规。

### 2. 获取 diff

按 `workflows/review-phases.md` 的「输入（Diff 获取）」执行。

### 3. 建立索引与需求映射

按 `workflows/review-phases.md` Phase 1。额外：

- 从 Spec 提取每个 Requirement 的需求点清单
- 从 Code Design 提取对应的实现决策（API 契约、数据流、迁移计划、测试方案）
- 建 Requirement ↔ 实现 ↔ diff 的映射；每个 Requirement/checkpoint 一张 card
- **Spec 与 Code Design 冲突**：以 Spec 为产品正确性优先来源，但在 card 与 `review.md` 的「Spec / Design 冲突」表中显式标注冲突点与两侧指针，供开发者裁决

### 4. 进入共用评审流程

`workflows/review-phases.md` Phase 2–4。

**检查清单选择**：

- 加载 `references/backend-review-checklist.md` / `references/frontend-review-checklist.md`（按变更涉及面）
- 项目特化对照工作区模板：`../references/bobcat-mr-final-review-be-template.md`、`../references/bobcat-mr-final-review-fe-template.md`（项目方向默认 final-review）
- 评审重点：Requirement 逐条覆盖、Code Design 决策落实、跨仓库 handoff、迁移与回滚

### 完成

- `review.md` 的「评审输入」记录 Spec / Code Design 来源类型与指针
- 「Spec / Code Design 一致性」与「Spec / Design 冲突」两张表由各 card 机械合并
- 交付后等待用户确认；如需发布评论到 MR，见 `workflows/publish.md`
