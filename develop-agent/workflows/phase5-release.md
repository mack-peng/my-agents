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

### 2. 委托 gitee-agent 创建 PR

```
use gitee-agent
```

gitee-agent 执行：
- 在目标项目目录下 `gitee-cli pr create`
- head: 开发分支，base: 目标分支
- PR body 含：变更摘要、验证状态、修改文件列表

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
| 4 Verify | morph-agent | Build {bid} → Deploy {did} |
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
