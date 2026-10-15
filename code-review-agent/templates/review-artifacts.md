# 评审 artifact 模板与 Context Caps

**这条文件是什么**：低上下文评审的全部 artifact 模板 + 量化上限（Context Caps）与升级路径。`workflows/review-phases.md` 按需引用本文件；评审过程中不把全部 artifact 读进同一上下文。

**原则**：`review.md` 是机械拼装的产物，不是重新生成的摘要。issue 的唯一权威存储在 `issue-registry.md`，重复评审靠状态更新而非重建。

---

## 目录结构

```
<review-output-dir>/<project>-<pr-or-mr-id>/
  review-index.md            ← 评审路由索引（compact root）
  batch-plan.md              ← 宽评审触发时的批次执行计划
  issue-registry.md          ← issue 唯一权威根（compact）
  TASK_STATE.md              ← 进度里程碑 + 恢复路由字段
  requirement-cards/
    <batch-slug>.md          ← 低上下文评审卡片
  evidence/
    <batch-slug>.md          ← card 溢出时的证据（card 只留指针）
  guideline-checks/
    backend.md               ← 后端清单检查
    frontend.md              ← 前端清单检查
    project-heuristics.md    ← 目标项目特定惯例（从项目 AGENTS.md 提取）
  issues/                    ← issue 详情（超限时）
    ISSUE-xxx.md
  index-shards/              ← 索引超限时
    shard-N.md
  review-round-delta.md      ← 重复评审增量（round 2+）
  final-review-contract.md   ← 最终汇总 contract
  review.md                  ← 最终评审报告（机械拼装）
```

---

## Context Caps（量化上限）与升级路径

| 对象 | 目标 | 软上限 | 超限处理 |
|------|------|--------|----------|
| requirement card | 40–80 行 | 120 行 | 先删重复的 spec/design/diff 叙述；再拆 checkpoint；或把证据移 `evidence/<slug>.md`，card 只留源指针 |
| card 上游依赖 | ≤ 3 个上游 card | — | 超出则建 shared shard contract（compact），依赖该 artifact |
| 单 batch | ≤ 6 个 checkpoint | — | 再按 repository / feature area / file group / symbol group / execution path 拆 |
| batch 共享依赖面 | ≤ 1 个宽泛共享依赖 | — | 拆分为两个 batch 或先产出 shared shard contract |
| review-index.md / issue-registry.md | 表格 ≤ 20 行 / ≤ 300 行 | — | 行移入 `index-shards/` / `issues/`，root 只留 shard 图、汇总计数、blocking id、readiness |
| requirement cards 总量 | ≤ 12 个 card / ≤ 1200 行 | — | 分批收敛为 `index-shards` 或 requirement shard contract |
| final-review-contract.md | ≤ 300 行 | — | 按 repository / feature area / dependency / shared touchpoint 拆 |
| 单 checkpoint 大 diff | 不承载大 diff | — | 先按 repository / feature area / file group / symbol group / execution path 拆分 |

**Checkpoint 拆分规则**：一个 Requirement 映射到很多变更文件时，必须按 repository / feature area / file group / symbol group / execution path 拆成显式 checkpoint（后缀如 `<slug>-backend-api`、`<slug>-frontend-ui`），再进深度评审。单个 card 不得因为"产品需求数少"而变成大 diff 的容器。

**一轮一批**：一个 active reviewer pass 只能深度评审一个 batch（+ 该 batch 前置里显式列出的 shared shard contract）；未见该 batch artifact 落盘并更新 `TASK_STATE.md`，不得开启另一 batch 的 checkpoint。

---

## TASK_STATE.md

compact 进度文件；不粘贴需求正文、完整 diff、长测试日志、清单表。宽评审时须记录恢复路由字段（英文 key 为默认，中文等价名亦可）。

```md
# Review Task State: <project> <pr-or-mr-id>

- Review mode: subagent / checkpoint fallback
- Active batch: B1
- Active checkpoint: `<batch-slug>` / None
- Last completed batch: None
- Next artifact paths:
  - `review-index.md`
  - `batch-plan.md`
  - `requirement-cards/<batch-slug>.md`
```

---

## review-index.md

宽评审必需、常规评审建议。compact root，用源路径 / 状态 / card 路径 / issue id / shard 路径 / readiness 代替叙述正文。

```md
# Review Index: <project> <pr-or-mr-id>

## Inputs

- PR/MR:
- Spec / 工单:
- Code Design:
- Repo / branch / commit range:

## Shard Map

| Batch / Checkpoint | Source Pointer | Card | Guideline Scope | Issues | Status |
|---|---|---|---|---|---|
| B1 `<batch-slug>` | spec / ticket / design pointer | `requirement-cards/<batch-slug>.md` | backend / frontend / heuristics / none | ISSUE-xxx | planned / in progress / ready / blocked |

## Readiness

- Cards covered:
- Guideline scopes covered:
- Blocking issues:
- Source gaps:
```

---

## batch-plan.md（宽评审触发时）

宽评审触发条件：> 1 个 in-scope checkpoint、任一按 diff 面拆分的 checkpoint、> 1 个 guideline scope、或预期需要 final contract。

```md
# Review Batch Plan: <project> <pr-or-mr-id>

## Broad Review Trigger

- Trigger(s):
- Planning scope:
- Latest round:

| Batch | Checkpoints | Prerequisites | Shared Dependency Surface | Guideline Scope | Target Artifacts | Status |
|---|---|---|---|---|---|---|
| B1 | `<batch-slug>` | `index-shards/shard-1.md` / None | shared shard contract / None | backend / frontend / none | `requirement-cards/...` | planned / in progress / ready / blocked |

## Batch Readiness Rules

- Per-batch checkpoint cap: 6
- Shared dependency surface cap: 1
- Escalation rule: 超限则按 repository / feature area / file group / symbol group / execution path 再拆
- Repeat-review delta path: `review-round-delta.md`
- Active-pass boundary: 一个 reviewer pass 只评审本 batch + 列出的 shared shard contract
```

---

## issue-registry.md（issue 唯一权威根）

被 card、guideline-check、final contract、review.md、重复评审共同引用；保留 status history，防止后续 agent 为恢复机器状态而重读人类报告。

```md
# Issue Registry: <project> <pr-or-mr-id>

| Issue | Severity | Status | Stance | Source | Owner Artifact | First Seen | Last Checked |
|---|---|---|---|---|---|---|---|
| ISSUE-001 | P1/P2/P3 | Open / Needs confirmation / Fixed / Obsolete | must / recommend / non-blocking | Spec/ticket mismatch / Code Design mismatch / Backend guideline / Frontend guideline / Review contract Cn / General engineering judgment | `requirement-cards/<slug>.md` / `guideline-checks/backend.md` | round/date | round/date |

## ISSUE-001 - <title>

- Evidence pointers:
- Confirmation needed:
- Impact:
- Recommendation:
- Suggested PR comment:
- Status history:
  - Round 1: Open - <brief note>
  - Round 2: Fixed - <brief note and evidence>
```

超 20 个 issue 或 300 行 → 详情移 `issues/ISSUE-xxx.md`（同 block 格式），root 只留汇总计数、blocking id、最近变化 id、shard 路径；`issues/*.md` 超 20 文件 → `issue-shards/shard-N.md`。

**Severity**

- **P1**：生产 breakage、数据丢失、安全/隐私问题、迁移风险、需求阻塞级偏差
- **P2**：功能性 bug、重要需求遗漏、脆弱集成、高风险行为缺少验证
- **P3**：低风险可维护性、小 UI/文案偏差、次要测试缺口、可改善 reviewability 的清理

**Stance**

- `[must]`：合并前必须处理
- `[recommend]`：强烈建议；无合理权衡说明则合并前修
- `[non-blocking]`：有用改进或后续项，本身不阻塞合并

P1 / P2 通常为 `[must]`，除非有明确理由。若 P1/P2 断言源自契约核对或高风险判断，须附**复现证据**（`references/review-contracts.md` C7）；无证据 → 降级 `Needs confirmation`。

---

## requirement-cards/<batch-slug>.md

一个 requirement / checkpoint 一张低上下文 card，固定章节。

```md
# Requirement Review Card: <batch title>

## Scope

- Requirement/checkpoint:
- Status: Passed / Issue / Needs confirmation / Fixed / N/A / Not checked
- Spec / ticket source:
- Code design source:
- Changed files:
- Upstream dependencies:

## Spec / Design Contract

- Demand/design points checked:
- Spec/design conflicts:

## Diff Entry Points

- Changed files/symbols:
- Surrounding code inspected:
- Tests inspected:

## Contracts Check（触发：异步/定时器/状态机/监听/滚动动画；否则记 N/A + 理由）

- 异步句柄清单: raf / setInterval / setTimeout(含他处排的) / ResizeObserver / 事件监听
- 出口 × 清理矩阵:

| 出口路径 | 句柄清理 | 状态复位 | 完成/终止通知 | 契约 |
|---|---|---|---|---|
| 正常完成 | | | | C1 |
| 提前返回 | | | | C1 |
| 取消 (wheel/touch/key) | | | | C2/C3 |
| 改道 (navToPosition 等) | | | | C3 |
| 上下文切换 | | | | C3 |
| 卸载 | | | | C2/C8 |
| 超时/看护结束 | | | | C1 |

- 违规契约: C1 / C2 / ...
- 复现证据（C7，P1/P2 必须）:

## Issues

- ISSUE-xxx from issue-registry.md:

## Verification

- Commands/checks:
- Blocked or missing checks:

## Cross-Batch Touchpoints

- Shared API/data/state/flag/migration/rollout:

## Final Assembly Notes

- Include in final report:
- Source gaps:
```

---

## guideline-checks/&lt;scope&gt;.md

scope = `backend` / `frontend` / `project-heuristics`。记录加载的清单来源、范围理由、检查过的变更面、逐条清单行、关联 issue id、跳过/阻塞理由。card 可引用 issue id，但不得复制整份清单表。

```md
# Guideline Check: <scope>

## Scope

- Loaded checklist source:
- Scope reason:
- Changed code areas:
- Related issue ids:

## Checklist Rows

| Status | Category | Check | Conclusion / Notes | Issue |
|---|---|---|---|---|

## Skipped / Blocked

- Reason:
```

**状态标记**

| 状态 | 含义 |
|------|------|
| `✅ Passed` | 检查通过，无实质问题/风险 |
| `❌ Issue` | 发现问题，已关联 issue |
| `⚠️ Needs confirmation` | 存在实质不确定性，需开发者确认 |
| `🛠️ Fixed` | 之前 open 的 issue 在本轮已修复 |
| `➖ N/A` | 不适用，附理由 |
| `🚧 Not checked` | 无法检查，附阻塞理由 |

**checklist 纪律**

- 加载的每个类别及其子检查都要逐项标记；不得因未发现问题而省略条目
- 任何 plausible risk、可能 bug、缺失证据、不清楚的权衡 → 进 issue 列表（Open / Needs confirmation），不得只埋在清单里
- 只有明确安全的条目才允许仅出现在清单中
- 不得让 spec/design 一致性检查淹没 guideline 检查

---

## final-review-contract.md

由 review-index、issue-registry、各 card、guideline-check 汇总；记录跨 batch 结论、blocking id、拼装源清单，供机械拼装 `review.md`。

```md
# Final Review Contract: <project> <pr-or-mr-id>

## Report Conclusion

- Overall: Approved / Needs changes / Blocked
- 主要风险:
- 需要开发者确认的不确定点:
- 是否建议发布评论: No / Summary only / Inline candidates

## Spec / Code Design Checklist Sources

- `requirement-cards/<slug>.md`

## Spec / Design Conflict Sources

- `requirement-cards/<slug>.md`

## Guideline Checklist Sources

- Backend: loaded yes/no, scope reason, sources
- Frontend: loaded yes/no, scope reason, sources
- Project heuristics: loaded yes/no, scope reason, sources

## Issue Detail Sources

- `issue-registry.md`
- `issues/ISSUE-xxx.md`

## Review Round Delta Sources

- `review-round-delta.md`

## Testing And Verification

- Summary:
- Blocked checks:

## Publishing Plan

- Plan:
- Inline candidate source:

## Limitations And Uncertainty

- Limitation:
```

---

## review-round-delta.md（重复评审 round 2+）

只记增量；最终 pass 读最新 delta + compact roots，不重放全部历史。

```md
# Review Round Delta: <project> <pr-or-mr-id> round <n>

## Inputs

- Previous round baseline:
- Newly checked batches:
- Newly changed files / commits:

## Issue Delta

- New issue ids:
- Status-changed issue ids:
- Obsolete issue ids:

## Verification Delta

- Newly passed checks:
- Newly blocked checks:

## Final Assembly Notes

- Update final contract sections:
- Detail sources changed:
```

---

## review.md（最终报告，机械拼装）

来源：issue-registry（含 blocking / 近期变化 issue）+ 各 card 的 Spec/Code Design 行 + guideline-check 行 + final contract。**不要**把 `review.md` 当作 issue 的权威存储。

```md
# 代码评审: <project> <pr-or-mr-id>

## 结论

- Overall: Approved / Needs changes / Blocked
- 主要风险:
- 需要开发者确认的不确定点:
- 是否建议发布评论: No / Summary only / Inline candidates

## 评审输入

- PR/MR:
- 工单 / Spec:
- Code Design:
- 代码库:
- 分支 / Commit 范围:
- 需求合约来源类型: local / zendesk / jira / confluence / feishu

## Spec / Code Design 一致性

| Status | Item | Conclusion / Notes | Issue |
|---|---|---|---|

## Spec / Design 冲突

| Status | Item | Conclusion / Notes | Issue |
|---|---|---|---|

## 后端检查清单（如适用）

- Loaded: Yes / No
- Scope reason:

| Status | Category | Check | Conclusion / Notes | Issue |
|---|---|---|---|---|

## 前端检查清单（如适用）

- Loaded: Yes / No
- Scope reason:

| Status | Category | Check | Conclusion / Notes | Issue |
|---|---|---|---|---|

## 项目 Heuristics 检查清单（如适用）

- Loaded: Yes / No
- Scope reason:

| Status | Category | Check | Conclusion / Notes | Issue |
|---|---|---|---|---|

## 风险 / 问题列表

### ISSUE-001 - P1/P2/P3 - Open/Needs confirmation/Fixed/Obsolete - <标题>

- Stance: [must] / [recommend] / [non-blocking]
- First seen:
- Last checked:
- Source: Spec/ticket mismatch / Code Design mismatch / Backend guideline / Frontend guideline / Review contract Cn / General engineering judgment
- Evidence:
- Confirmation needed:
- Impact:
- Recommendation:
- Suggested PR comment:
- Status history:
  - Round 1: Open - <brief note>

## 测试与验证

## 限制与不确定性
```
