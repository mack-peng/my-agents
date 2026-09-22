# Phase 5: Release

委托 gitee-agent 提交 PR 并合并，委托 feishu-agent 更新 Develop 任务文档。

## 执行步骤

### 1. 收集上下文

从 Phase 3 获取：
- 开发分支名
- commit hash 列表

从 Phase 4 获取：
- 验证结果（全部通过）

向用户确认：
- 目标 base 分支（默认 master）
- PR 标题和描述内容
- **Reviewer**（参考 ticket-agent 规范：给出候选清单让用户选择；无实际人选时填 `not applicable`）

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

- 填充规则（对齐 `ticket-agent/workflows/phase5-mr-bobcat.md`，**由协调器生成，不留给提交者**）：
  1. **严格保持模板结构不变**，各 section 的占位提示替换为实际内容
  2. **Self-checklist 由协调器依据 Phase 1-4 证据逐项判定并勾选**（如：diff 自审、typecheck/lint/构建通过、preprod 验证、可回滚、无调试代码、原子 commit、conventional commits）；不适用项按模板自身的 `not applicable` 约定标注，不虚构勾选
  3. 与 Code Design 存在差异时：先在 MR 评论中列出差异说明（满足「marked them out and added comments」），再勾选对应项
  4. References 表：Code Design Doc 填飞书链接；Jira / Zendesk / TL / Reviewer 无实际值时填 `not applicable`
  5. FE Bugfix 模板的 Problem Solving Process（Description / Reason / Solution / Scope Of Impact / Test Result）**用中文填写**，取自 Phase 1 Problem 与 Phase 3/4 结论
  6. 描述写入临时文件（如 `/tmp/develop-mr-<repo>.md`），`gitee-cli pr create --body "$(cat ...)"`

### 3. 用户 Review

- 协调器展示 PR URL
- 用户在 PR 页面 review
- 用户确认后 → 进入合并

### 4. 委托 gitee-agent 合并

gitee-agent 执行：
- `gitee-cli pr review <number> --action approve`
- `gitee-cli pr merge <number>`

### 5. 归档（飞书模式）

通过 feishu-agent 更新 Develop 任务文档：

**追加 Phase 5 章节**：
```markdown
## Phase 5: Release
- **PR**: #{number} {title}
- **状态**: merged

## Phase 5 TODO
- [x] gitee-agent 创建 PR
- [x] 用户 review 通过
- [x] gitee-agent approve + merge
✅ Phase 5 Sign-off: 已完成
```

> Spec 和 Code Design 已在 Phase 1/2 上传到各自知识库，Phase 5 不重复上传。

### 6. 输出流程摘要

```
develop-agent 全流程完成

| Phase | Agent | 产出 |
|-------|-------|------|
| 0 Pre-flight | — | 项目路径 + 需求确认 |
| 1 Design | design-agent | Spec: {name}.spec.md |
| 2 Code Design | code-design-agent | 跳过 / Code Design: {name}.md |
| 3 Code | code-agent | {n} files, commit {hash} |
| 4 Verify | ci-lite | Build {bid} → Deploy {did} |
| 5 Release | gitee-agent | PR #{num} → merged |
```

## Sign-off 条件

- [ ] PR 已创建
- [ ] PR 已 approve + merge
- [ ] 飞书模式：Develop 文档已追加 Phase 5 章节（含最终摘要）
- [ ] 完整流程摘要已输出

## 产出

- PR URL + 编号
- Merge 确认
- 完整流程摘要
