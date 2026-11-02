# Phase 5: MR 提交

委托 gitee-agent 创建 PR，交付 MR 链接给用户，**评审由用户在另一 agent 中完成**（code-review-agent）。
本阶段位于 Phase 4（Verify）之后；PR 创建即本阶段核心产出，不在本 session 内做代码评审。

## 执行步骤

### 1. 收集上下文

从 Phase 1 获取：
- Spec 文件路径（`design-agent/output/{name}.spec.md`）— 必需
- 飞书 Spec 链接

从 Phase 2 获取（如有）：
- FE / BE Code Design 路径与飞书链接（Phase 2 跳过时填 `not applicable`）

从 Phase 3 / 4 获取：
- 开发分支名 + commit 列表
- Phase 4 验证结果（BUILD/DEPLOY ID、线上验证结论）

向用户确认：
- 目标 base 分支（默认 master）
- PR 标题和描述内容
- **Reviewer**（给出候选清单让用户选择；无实际人选时填 `not applicable`）

### 2. 委托 gitee-agent 创建 PR

```
use gitee-agent
```

gitee-agent 执行：
- 在目标项目目录下 `gitee-cli pr create`
- head: 开发分支，base: 目标分支
- **PR body 套用 Bobcat MR 模板**（`references/bobcat-mr-*-template.md`，Gitee 模板自动填充仅 Web 端生效，CLI 需手动传 body）：

| MR 类型 | BE 仓库（如 door-applets-bg） | FE 仓库（如 door-adminpro / door-applets） |
|---------|------------------------------|--------------------------------------------|
| 功能/需求（走 Spec + Code Design） | `bobcat-mr-final-review-be-template.md` | `bobcat-mr-final-review-fe-template.md` |
| Bug 修复 | `bobcat-mr-bugfix-be-template.md` | `bobcat-mr-bugfix-fe-template.md` |

- 填充规则（**由协调器生成，不留给提交者**）：
  1. **严格保持模板结构不变**，各 section 的占位提示替换为实际内容
  2. **Self-checklist 由协调器依据 Phase 0-4 证据逐项判定并勾选**（如：diff 自审、typecheck/lint/构建通过、preprod 验证、可回滚、无调试代码、原子 commit、conventional commits）；不适用项按模板自身的 `not applicable` 约定标注，不虚构勾选
  3. 与 Code Design 存在差异时：先在 MR 评论中列出差异说明（满足「marked them out and added comments」），再勾选对应项
  4. References 表：Spec 填飞书链接；Code Design Doc 填飞书链接或 `not applicable`（Phase 2 跳过时）；Jira / Zendesk / TL / Reviewer 无实际值时填 `not applicable`
  5. FE Bugfix 模板的 Problem Solving Process（Description / Reason / Solution / Scope Of Impact / Test Result）**用中文填写**，取自 Phase 1 Problem 与 Phase 3/4 结论
  6. 描述写入临时文件（如 `/tmp/develop-mr-<repo>.md`），`gitee-cli pr create --body "$(cat ...)"`

- 创建后 **PR 保鲜**（多流并行时 master 可能已在分支切出后前进，导致 PR 创建即 `mergeable=false`）：
  - `git fetch origin && git merge origin/master` 入开发分支并 push（禁止 rebase / force push）
  - 解冲突 golden path：注册类清单文件（如 `db.changelog-master.yaml`）**保留双方条目**并保持文件名排序；解完 `git diff --check` 确认无残留 marker；跑项目级快检（typecheck / 编译 / yaml 解析）
  - `gitee-cli pr view <number> --json` 确认 `mergeable=true` 后再交付链接

### 3. 交付 MR 链接 + 外部 review 交接

- 协调器输出 PR URL 与外部 review 指引：

  > 请在另一个 agent（新 session）中执行 code-review-agent 评审本 MR：
  > `use code-review-agent`
  > 项目方向输入：Spec（飞书链接 / 本地路径）+ MR 链接
  > 评审产出 `output/code-review/{project}-{branch}/review.md`，结论带回本 session

- 用户确认已接收链接后 sign-off
- **本 session 停止**，等待用户带回外部 review 结论（Phase 6 入口）

### 4. 修复轮（外部 review 发现 blocking 时）

外部 review 报告 P1/P2 `[must]` blocking issue → 回本 session：

1. 按外部 review 问题清单修复（走 Phase 3 修复流程）
2. 重跑 Phase 4 验证（构建部署 + 线上验证）
3. 追加 commit 并 push（禁止 force push），MR 自动更新
4. 请用户在外部再次 review（round 2，增量走 `review-round-delta.md`，issue 状态更新而非删除）

## Sign-off 条件

- [ ] PR 已创建，body 按模板填充且 Self-checklist 已勾选
- [ ] `mergeable=true`（PR 保鲜完成）
- [ ] MR 链接已交付，用户确认接收
- [ ] 飞书模式：Develop 文档已更新 Phase 5 章节

## 产出

- PR URL + 编号
- 外部 review 交接指引
