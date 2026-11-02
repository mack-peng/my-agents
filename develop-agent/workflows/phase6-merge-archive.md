# Phase 6: Merge + 归档

用户在另一 agent 中完成 code-review-agent 评审后，带回结论执行合并与归档。
本阶段入口是**外部 review 结论**，不是本 session 内的评审产物。

## 执行步骤

### 1. 接收外部 review 结论

用户提供：
- 外部 review 结论（Approved / blocking 清单）
- review.md 路径（外部 session 产出：`output/code-review/{project}-{branch}/review.md`）

判定：
- P1/P2 `[must]` blocking 未清零 → 回 Phase 5 修复轮（见 `workflows/phase5-mr-submit.md` 第 4 节）
- blocking 清零（Approved 或仅 P3 / non-blocking）→ 进入合并；P3 项由用户决定是否处理

### 2. 委托 gitee-agent 合并

```
use gitee-agent
```

gitee-agent 执行：
- 合并前复查 `mergeable=true`（review 期间 master 可能再次前进；不满足则回到 PR 保鲜：`git fetch origin && git merge origin/master` 并 push）
- `gitee-cli pr review <number> --action approve`
- `gitee-cli pr merge <number>`

### 3. 归档（飞书模式）

通过 feishu-agent 更新 Develop 任务文档：

**追加 Phase 6 章节**：
```markdown
## Phase 6: Merge + 归档
- **外部 review 结论**: Approved（blocking 0 / P3 n）
- **PR**: #{number} {title}
- **状态**: merged

## Phase 6 TODO
- [x] 接收外部 review 结论
- [x] gitee-agent approve + merge
✅ Phase 6 Sign-off: 已完成
```

> Spec 和 Code Design 已在 Phase 1/2 上传到各自知识库，Phase 6 不重复上传；外部 review.md 在外部 session 留档，不单独上传。

### 4. 输出流程摘要

```
develop-agent 全流程完成

| Phase | Agent | 产出 |
|-------|-------|------|
| 0 Pre-flight | — | 项目路径 + 需求确认 |
| 1 Design | design-agent | Spec: {name}.spec.md |
| 2 Code Design | code-design-agent | 跳过 / Code Design: {name}.md |
| 3 Code | code-agent | {n} files, commit {hash} |
| 4 Verify | ci-lite | Build {bid} → Deploy {did} |
| 5 MR 提交 | gitee-agent | PR #{num}（外部 review 通过） |
| 6 Merge + 归档 | gitee-agent | merged |
```

## Sign-off 条件

- [ ] 外部 review 结论已接收（blocking 清零）
- [ ] PR 已 approve + merge
- [ ] 飞书模式：Develop 文档已追加 Phase 6 章节（含最终摘要）
- [ ] 完整流程摘要已输出

## 产出

- Merge 确认
- 完整流程摘要
