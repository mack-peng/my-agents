# Phase 3: Code

委托 code-agent 按 Spec（+ Code Design）在目标项目中实现代码修改。

## 执行步骤

### 1. 收集上下文

从 Phase 1 获取：
- Spec 文件路径（`design-agent/output/{name}.spec.md`）
- 所有已确认的 Requirement

从 Phase 2 获取（如有）：
- Code Design 文档路径（`code-design-agent/code_design/{name}.md`）

### 2. 协调器创建开发分支

在目标项目目录下：

```bash
git checkout master
git pull origin master
git checkout -b feat-{需求短名}
```

分支命名规则：`feat-` / `fix-` / `refactor-` 前缀，分隔符 `-`。

### 3. 委托 code-agent

```
use code-agent
```

告知 code-agent：
- Spec 文件路径 + Code Design 路径（如有）
- 目标项目路径
- 已切换到开发分支，可直接修改
- 本项目约定（从项目 AGENTS.md 获取）

### 4. code-agent 工作流

code-agent 按自身 AGENTS.md 执行：
1. Phase 0：检查 `.codegraph/` + `.cssgraph/`
2. Phase 1：理解输入，建立 TODO
3. Phase 2：调研代码结构、影响范围、学习现有风格
4. Phase 3：编码 — 按 Requirement 逐文件修改
5. Phase 4：验证 — `yarn check-types` + `yarn lint`

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
- 追加 `## Phase 3: Code` 章节
- 记录分支名 + commit hash + 修改统计
- 追加 `✅ Phase 3 Sign-off`

## Sign-off 条件

- [ ] 开发分支已创建
- [ ] 所有代码修改已 commit 并 push
- [ ] `yarn check-types` 零错误
- [ ] `yarn lint` 零错误
- [ ] 飞书模式：Develop 文档已追加 Phase 3 章节

## 产出

- 开发分支名 + commit hash
- 修改的文件列表 + diff 统计
