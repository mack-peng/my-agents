# Phase 1: Design

委托 design-agent 进行产品设计审查或 Spec 输出。

## 执行步骤

### 1. 收集上下文

从 Phase 0 获取：
- 用户原始需求描述
- 目标项目路径
- 目标页面 / 功能范围

### 2. 委托 design-agent

**使用上下文切换模式（`use design-agent`），非 Task 工具委托。**

告知 design-agent：
- 模式选择（审查模式 / Spec 输出模式）
- 目标项目路径 + 页面范围
- 用户痛点 / 已知问题
- 不可改的约束条件

### 3. design-agent 工作流

design-agent 按自身 AGENTS.md 执行：
1. 入场澄清业务上下文
2. 建立项目认知档案（`projects/{name}.cognition.md`）
3. 输出 Spec 到 `design-agent/output/{name}.spec.md`
4. 逐项与用户确认需求

### 4. 协调器确认流程

协调器拿到 Spec 后：
- 展示 Spec 摘要（Problem 表 + 需求数量 + Part 结构）
- **逐项**请用户确认每个 Requirement
- 用户可修改、取消、补充任何需求条目
- 全部确认后 sign-off

### 5. 归档（飞书模式）

1. 通过 feishu-agent 将 Spec 上传到 `FEISHU_SPEC_WIKI_ID` 知识库
2. 通过 feishu-agent 更新 Develop 任务文档：
   - 追加 `## Phase 1: Design` 章节
   - 挂 Spec 飞书文档链接
   - 追加 `✅ Phase 1 Sign-off`

## Sign-off 条件

- [ ] Spec 文件已保存到 `design-agent/output/`
- [ ] 所有 Requirement 用户已确认（含修改/取消/补充的）
- [ ] 飞书模式：Spec 已上传到 Spec 知识库
- [ ] 飞书模式：Develop 文档已追加 Phase 1 章节

## 产出

- `design-agent/output/{name}.spec.md` — 结构化需求文档
- 飞书模式：Spec 知识库中的文档链接
