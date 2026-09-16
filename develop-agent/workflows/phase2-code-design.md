# Phase 2: Code Design

委托 code-design-agent 将 Spec 转化为 FE / BE 两份 Code Design 文档。**本阶段可选**，协调器在 Phase 1 sign-off 后询问用户是否跳过。

## Spec 输入方式

| 来源 | 传递方式 | 适用场景 |
|------|----------|----------|
| 本地文件 | `design-agent/output/{name}.spec.md` 路径 | Session 模式 / 飞书模式本地有文件 |
| 飞书文档 URL | Spec 文档链接 | 飞书模式仅在线时，通过 feishu-agent 读取 |

## 跳过条件

- 用户明确说"跳过 Code Design"
- 或需求变更范围小（单一文件、纯配置修改等）
- 跳过时在 Develop 文档追加 `## Phase 2: Code Design（已跳过）`，直接进入 Phase 3

## 执行方式（硬性）

- **单 pass 线性执行**：协调器加载 code-design-agent 的 AGENTS.md 后，在**同一上下文**内完成 FE / BE 两份文档。
- **禁止在本 Phase 内派发子 agent**（不得用 Task 拆 requirement 给 Worker、不得设 Reviewer / Final Assembler 角色）。
- 上下文接近上限时：先落盘已完成部分（文档 + Develop 文档进度），再从落盘处续接。

## 执行步骤

### 1. 收集上下文

从 Phase 1 获取：
- Spec 来源（文件路径 or 飞书 URL）
- 目标项目路径（FE / BE 各一）
- 所有已确认的 Requirement

### 2. 按 code-design-agent 工作流产出设计

按 code-design-agent AGENTS.md 的 Step 1–6 执行（读 Spec + 代码定位 → Spec Analysis → 变更清单三件套 → 依赖/兼容性/风险 → 工期与延后范围 → 自检）。

产出：
- FE Code Design（UI/组件 · 样式/CSS · 数据/Store · 接口调用）
- BE Code Design（Controller · Service · Mapper/SQL · 配置变更 · 数据库迁移 · 第三方依赖）

### 3. 上传飞书（两份独立文档）

1. 在 Code Design 知识库（`FEISHU_CODE_DESIGN_WIKI_ID`）创建两个独立节点：
   - `{项目} — FE Code Design：{需求}`
   - `{项目} — BE Code Design：{需求}`
2. 写入正文，并给**每个变更组编号**（C1、C2…）+ 列「待确认项」（Q1、Q2…）

### 4. 评论 sign-off（人审 gate）

1. 告知用户：在飞书文档中对变更组/待确认项**逐条评论**（哪条要改就评论哪条）
2. 协调器读取评论：
   ```bash
   NODENV_VERSION=24.10.0 lark-cli drive file.comments list --params '{"file_token":"<docToken>","file_type":"docx"}'
   ```
3. 按评论修订文档 → 重新上传 → 用户在文档内 sign-off（或对话确认，由协调器补记）
4. 全部确认后进入 Phase 3

### 5. 归档（飞书模式）

更新 Develop 任务文档：
- 追加 `## Phase 2: Code Design` 章节
- 挂 FE / BE Code Design 飞书链接
- 追加 Phase 2 TODO + `✅ Phase 2 Sign-off`

## Sign-off 条件

- [ ] FE / BE Code Design 均已产出并自检（Self-checklist 全绿）
- [ ] 两份文档已上传 Code Design 知识库（独立节点）
- [ ] 用户逐条评论/sign-off 完成，待确认项闭环
- [ ] 飞书模式：Develop 文档已追加 Phase 2 章节

## 产出

- `code-design-agent/code_design/{fe-project}.code-design.md`
- `code-design-agent/code_design/{be-project}.code-design.md`
- 飞书模式：Code Design 知识库中的两个文档链接
