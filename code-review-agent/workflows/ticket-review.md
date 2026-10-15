# 工单方向评审（Ticket Review）

**这条工作流是什么**：以**工单**为需求合约来源的代码评审。输入 = 工单链接 + MR。工单提供问题描述与期望行为，MR 提供代码变更；评审对照工单与对应检查清单。

**分几步**：4 步（解析工单 → 获取 diff → 建索引 → 进入共用评审流程）。

**哪几步停下来等你**：工单无法读取或缺关键信息时先确认；`review.md` 交付后等待确认。

---

## 输入

| 项 | 必需 | 说明 |
|----|------|------|
| 工单链接 | ✅ | Zendesk 工单 URL/ID 或 Jira work item key/URL |
| MR / PR | ✅ | GitHub PR / GitLab MR / 本地 diff |
| 代码库路径 | 建议 | 用于本地 diff 与周边代码检查 |
| 类型 | 建议 | Bugfix / 其他（影响检查清单选择，默认 bugfix） |

工单链接与 MR 二者缺一 → 先追问或按"信息缺失规则"记录阻塞，不假设。

---

## 步骤

### 1. 解析工单（需求合约）

**Zendesk 工单** → 委托 zendesk-agent（第一手；不经 ticket-agent 中转）：

```bash
# 先确定 profile（URL 子域名 → config-list 匹配）
zcli-ticket config-list
zcli-ticket -p <profile> --json ticket-thread <id>   # 工单详情 + 全部评论（含内部备注）
```

**Jira 工单** → 委托 acli-agent：

```bash
acli jira workitem view <KEY> --json                 # 工单详情
acli jira workitem view <KEY> --json | jq '.fields.summary'
```

**从工单提取**（作为本次评审的需求合约）：

- 问题描述、复现步骤、期望行为、影响面（scope of impact）
- 相关讨论 / 内部备注中的约束与决策
- Zendesk 客户工单与 Jira 开发工单同时存在时，两处都读，冲突时以开发工单/明确决策为准并显式标注

**信息缺失规则**：工单读不到或关键信息缺失 → 记录缺失项、已尝试方式、影响范围，标 `⚠️ Needs confirmation`；不假设合规。

### 2. 获取 diff

按 `workflows/review-phases.md` 的「输入（Diff 获取）」执行（github-agent / gitlab-agent 委托，或本地 git）。

### 3. 建立索引

按 `workflows/review-phases.md` Phase 1。`review-index.md` 的「Inputs」记录：

- 工单链接 + 来源类型（`zendesk` / `jira`）
- MR / PR + commit range
- 提取到的需求要点（brief，不复制工单全文）

### 4. 进入共用评审流程

`workflows/review-phases.md` Phase 2–4。

**检查清单选择**：

- 加载 `references/backend-review-checklist.md` / `references/frontend-review-checklist.md`（按变更涉及面）
- 项目特化对照工作区模板：`../references/bobcat-mr-bugfix-be-template.md`、`../references/bobcat-mr-bugfix-fe-template.md`（工单方向默认 bugfix）
- 评审重点：修复是否解决工单根因、是否引入回归、是否贴合工单要求；对照 bugfix 检查清单的 General / Reusability / Performance / Compatibility / Security / 第三方库类别

### 完成

- `review.md` 的「评审输入」记录工单链接与来源类型；「限制与不确定性」记录无法核实的工单信息
- 交付后等待用户确认；如需发布评论到 MR，见 `workflows/publish.md`
