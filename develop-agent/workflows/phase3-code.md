# Phase 3: Code

委托 code-agent 按 Spec（+ Code Design）在目标项目中实现代码修改。

## 执行步骤

### 1. 收集上下文

从 Phase 1 获取：
- Spec 文件路径（`design-agent/output/{name}.spec.md`）
- 所有已确认的 Requirement

从 Phase 2 获取（如有）：
- FE Code Design 路径（`code-design-agent/code_design/{fe-project}.code-design.md`）
- BE Code Design 路径（`code-design-agent/code_design/{be-project}.code-design.md`）
- 两份文档中的变更组编号（C1、C2…）与待确认项结论

### 2. 协调器创建开发分支

在目标项目目录下：

```bash
git checkout master
git pull origin master
git checkout -b feat-{需求短名}
```

分支命名规则：`feat-` / `fix-` / `refactor-` 前缀，分隔符 `-`。

### 3. 委托 code-agent

**使用上下文切换模式（`use code-agent`），非 Task 工具委托。**

将 code-agent 的 AGENTS.md 加载为当前操作指令，告知：
- Spec 文件路径 + Code Design 路径（如有）
- 目标项目路径
- 已切换到开发分支，可直接修改
- 本项目约定（从项目 AGENTS.md 获取）

### 4. code-agent 工作流（线性，禁止派子 agent）

code-agent 按自身 AGENTS.md 执行，且必须**在同一上下文内按变更组顺序线性推进**：

1. Phase 0：检查 `.codegraph/` + `.cssgraph/`（如涉及样式）
2. Phase 1：从 FE / BE Code Design 提取变更组清单（C1、C2…）
3. **顺序：BE 先行（Controller → Service → Mapper/SQL → 配置 → DB 迁移）→ FE 跟上（UI → CSS → Data/Store → 接口调用）**
4. 每个变更组：调研 → 实现 → 验证（typecheck / lint / `mvn test`）→ 在 Develop 文档打勾
5. 全部完成后：跑一次完整验证

约束：
- **禁止用 Task 或任何方式把实现拆给子 agent**
- 上下文接近上限时先落盘进度（分支 + 变更组状态），再从落盘处续接

code-agent 负责 git 提交和推送：
- commit message 格式：`<type>(<scope>): <简短描述>`
- push 到同名远程开发分支

### 5. 协调器确认流程

协调器拿到结果后：
- 展示 diff 统计（文件数、+lines/-lines）
- 确认分支名 + commit hash
- 确认 typecheck + lint 零错误
- 用户确认后 sign-off

### 6. 归档（飞书模式）

通过 feishu-agent 更新 Develop 任务文档：

**更新任务上下文**（补充开发分支信息）：
- 使用 `str_replace` 更新 `**开发分支**: （待 Phase 3 补充）` 为实际分支名

**追加 Phase 3 章节**：
```markdown
## Phase 3: Code
- **开发分支**: {分支名}
- **Commit 记录**:
  - `{hash}` {message}
  - `{hash}` {message}
- **修改文件**: {n} files, +{x}/-{y}
- **验证**: typecheck ✅ lint ✅

## Phase 3 TODO
- [x] code-agent 实现代码修改
- [x] typecheck + lint 通过
✅ Phase 3 Sign-off: 已确认
```

**注意**：Commit 记录应包含所有 commit（包括后续修复 commit），便于追溯代码变更历史。

## Sign-off 条件

- [ ] 开发分支已创建
- [ ] 所有代码修改已 commit 并 push
- [ ] `yarn check-types` 零错误
- [ ] `yarn lint` 零错误
- [ ] 飞书模式：Develop 文档已追加 Phase 3 章节

## 产出

- 开发分支名 + commit hash
- 修改的文件列表 + diff 统计
