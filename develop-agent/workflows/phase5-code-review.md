# Phase 5: Code Review

委托 code-review-agent 对开发分支变更做结构化评审（项目方向：Spec + Code Design（如有）+ diff），产出 review.md。本阶段位于 Phase 4（Verify）之后、Release 之前，评审以 Phase 4 的线上验证结果为证据。

## 执行步骤

### 1. 收集上下文

从 Phase 1 获取：
- Spec 文件路径（`design-agent/output/{name}.spec.md`）— 必需
- 飞书 Spec 链接

从 Phase 2 获取（如有）：
- FE / BE Code Design 路径与飞书链接（Phase 2 跳过时记 N/A，一致性仅对照 Spec）

从 Phase 3 / 4 获取：
- 开发分支名 + commit 列表 + 修改范围摘要
- Phase 4 验证结果（成功链路 / 失败链路 / 监控证据）

### 2. 委托 code-review-agent

**使用上下文切换模式（`use code-review-agent`），非 Task 工具委托。**

- 评审方向：**项目方向**（Spec + Code Design + diff）
- diff 来源：本地分支对比（此阶段 PR 尚未创建）——`git diff origin/master..<开发分支>` 或 commit 范围
- 输出目录：`output/code-review/<project>-<branch-slug>/`（无 PR 编号时用分支名）
- code-review-agent 按自身 AGENTS.md 执行 Phase 0-4（含后端/前端清单检查与契约核对）

### 3. 协调器处理评审结论

1. 展示 review.md 结论（Overall / blocking issue 列表 / P3 建议）
2. **P1/P2 `[must]` blocking issue**：返回 Phase 3 修复 → 重跑 Phase 4 验证 → 复审（code-review-agent round 2，增量走 `review-round-delta.md`，issue 状态更新而非删除）
3. 非阻塞项（P3 / non-blocking）：逐条列出，由用户决定是否处理；处理的进入修复轮
4. 所有 blocking 清零后进入 sign-off

### 4. 归档（飞书模式）

通过 feishu-agent 更新 Develop 任务文档：

**追加 Phase 5 章节**：
```markdown
## Phase 5: Code Review
- **结论**: Approved（blocking 0 / P3 n）
- **评审产物**: output/code-review/{project}-{branch}/review.md
- **修复轮**: （如有）

## Phase 5 TODO
- [x] code-review-agent 评审（round 1）
- [x] blocking 修复与复审（如有）
✅ Phase 5 Sign-off: 已确认
```

## Sign-off 条件

- [ ] review.md 已交付（`output/code-review/<project>-<branch>/review.md`）
- [ ] 无未处理的 blocking issue（P1/P2）
- [ ] 非阻塞项已记录并经用户裁决
- [ ] 飞书模式：Develop 文档已追加 Phase 5 章节

## 产出

- review.md 路径 + 结论（Approved / Needs changes / Blocked）
- blocking / non-blocking issue 统计与处理结论
- 修复轮的 commit 记录（如有，追加到 Phase 3 的 Commit 记录中）
