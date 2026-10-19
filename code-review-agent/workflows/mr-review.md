# MR 方向评审（无工单 / 无 Spec）

**这条工作流是什么**：当变更没有工单、没有 Spec / Code Design（内部任务 / 维护类 / CI 修复等）时，以 **MR 描述 + CI / 运行证据 + 相关讨论** 作为需求合约的评审。后续流程与工单 / 项目方向一致，仅合约来源不同。

**分几步**：4 步（解析合约 → 获取 diff → 建索引 → 进入共用评审流程）。

**哪几步停下来等你**：合约来源缺失且无法补齐时先确认；`review.md` 交付后等待确认。

---

## 输入

| 项 | 必需 | 说明 |
|----|------|------|
| MR / PR | ✅ | GitLab MR / GitHub PR / 本地 diff |
| 需求合约来源 | 尽力 | 优先级：MR 描述（Problem / Reason / Solution）> CI job 证据 / 关联 issue > commit message 与讨论 |
| 代码库路径 | 建议 | 用于本地 diff 与周边代码检查 |
| 类型 | 建议 | Bugfix / 维护 / CI 修复（影响检查清单选择，默认 bugfix） |

---

## 步骤

### 1. 解析合约（MR 描述 + 证据）

委托 gitlab-agent / github-agent（第一手；不经协调器中转）：

```bash
glab mr view <id>                    # 描述与元信息（自管理 GitLab 在仓库目录执行）
glab api projects/<url-encoded-path>/merge_requests/<id>   # 或走 API
gh pr view <id> --json               # GitHub
```

提取：Problem / Reason / Solution、验证声明、关联 job / issue 链接；CI 失败证据（job trace）按需取。

**信息缺失规则**：合约不完整不是阻塞项——缺失项（如描述未覆盖的后续提交）以 source gap 记录进 `review-index.md` 与 `review.md`「限制与不确定性」，不臆测需求、不跳过评审。描述与实现不一致、描述未覆盖的提交 → 直接作为 issue（P3 起）上报。

### 2. 获取 diff

按 `workflows/review-phases.md` 的「输入（Diff 获取）」执行。

### 3. 建立索引

按 `workflows/review-phases.md` Phase 1。`review-index.md` 的 Inputs 记录：

- MR / PR + commit range
- 需求合约来源类型: `local`（MR 描述 + CI / 运行证据）
- source gaps（合约缺失项）

### 4. 进入共用评审流程

`workflows/review-phases.md` Phase 0–4。

**检查清单选择**：

- 按变更性质加载 `references/backend-review-checklist.md` / `references/frontend-review-checklist.md`
- bugfix 类对照工作区模板：`../references/bobcat-mr-bugfix-be-template.md`、`../references/bobcat-mr-bugfix-fe-template.md`
- 评审重点：修复是否解决声明的根因、是否引入回归、验证证据是否支撑结论

### 完成

- `review.md` 的「评审输入」记录 MR 与来源类型；「限制与不确定性」记录合约缺失项与工具限制（如 ocr 不可用）
- 交付后等待用户确认；如需发布评论到 MR，见 `workflows/publish.md`
