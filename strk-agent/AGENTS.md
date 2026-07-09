# STRK Agent

STRK 产品开发调度入口。对话式收集任务信息，在用户指定的干净目录中执行开发工作流。

## 代码库

代码库路径由 `.env` 管理，不硬编码在本文档中：

```env
BOBCAT_REPO_PATH=/path/to/bobcat
OPENHANDS_REPO_PATH=/path/to/openhands
COMPONENT_KIT_REPO_PATH=/path/to/component-kit
```

首次使用时，检查 `.env` 中 `BOBCAT_REPO_PATH` 是否为空：
- 若为空，对话式询问用户路径，写入 `.env`
- 若已配置但路径在磁盘不存在，提示用户修正

`.env` 已加入 `.gitignore`，不会提交到仓库。

## 可用 Skills

已安装在 `~/.agents/skills/`，通过 `$skill` 语法或 skill tool 加载：

| Skill | 用途 |
|-------|------|
| `strk-init-project` | 在目标目录初始化 STRK 项目工作区，创建 `AGENTS.md` 和 `specs/specs.json` |
| `strk-sync-specs` | 从 Confluence 同步产品 spec 到本地 `specs/` |
| `strk-prod-specs` | 读取、校验本地 spec 缓存 |
| `strk-review-spec` | 深度评审 spec，产出中文评审报告 |
| `strk-code-guidelines` | 代码调研、实现和评审指南 |
| `strk-code-design` | 基于 spec 撰写 `code_design/` 设计文档 |
| `strk-write-code` | 基于 code_design 在隔离 worktree 中实现代码，产出 patch |
| `strk-review-code` | 基于 spec + code design + MR diff 产出中文代码评审报告 |

## 对话式工作流

启动后按以下顺序交互收集信息：

### 0. 检查配置

读取 `.env`。若 `BOBCAT_REPO_PATH` 为空，询问用户 bobcat 路径并写入。若路径在磁盘不存在，提示用户修正。`OPENHANDS_REPO_PATH` / `COMPONENT_KIT_REPO_PATH` 为空表示未配置，跳过。

### 1. 确认任务类型

询问用户要做什么，映射到对应 skill：

- "同步 spec" / "拉 spec" → `strk-sync-specs`
- "评审 spec" / "review spec" → `strk-review-spec`
- "写设计" / "code design" → `strk-code-design`
- "写代码" / "实现" → `strk-write-code`
- "评审代码" / "review MR" → `strk-review-code`

### 2. 确认目标工作目录

询问用户在哪个目录下干活。这个目录是干净的 project folder，所有产物（`specs/`、`code_design/`、`code_changes/`）都会落在该目录中。

如果目录不存在，创建它。如果目录存在但未初始化，先运行 `strk-init-project`。

### 3. 收集任务所需信息

根据 skill 类型收集对应信息：

- **spec 相关**：Confluence URL
- **code design**：spec 路径、设计范围
- **write code**：code_design 路径
- **review code**：GitLab MR URL

### 4. 加载 skill 并执行

收集完信息后，加载对应 skill 并在目标目录中执行工作流。每次只加载一个 skill，按需串联。

## 工程原则

- 使用 `git worktree` 隔离代码变更，不污染主 checkout
- 所有产物落盘到用户指定的目标目录，不在本 agent 目录生成
- 遵循 STRK 工程原则：先思考再编码、外科手术式修改、不夹带无关改动
