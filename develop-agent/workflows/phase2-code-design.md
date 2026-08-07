# Phase 2: Code Design

委托 code-design-agent 将 Spec 转化为代码设计文档。**本阶段可选**，协调器在 Phase 1 sign-off 后询问用户是否跳过。

## Spec 输入方式

| 来源 | 传递方式 | 适用场景 |
|------|----------|----------|
| 本地文件 | `design-agent/output/{name}.spec.md` 路径 | Session 模式 / 飞书模式本地有文件 |
| 飞书文档 URL | Spec 文档链接 | 飞书模式仅在线时，通过 feishu-agent 读取 |

## 跳过条件

- 用户明确说"跳过 Code Design"
- 或需求变更范围小（单一文件、纯配置修改等）
- 跳过时在 Develop 文档追加 `## Phase 2: Code Design（已跳过）`，直接进入 Phase 3

## 执行步骤

### 1. 收集上下文

从 Phase 1 获取：
- Spec 来源（文件路径 or 飞书 URL）
- 目标项目路径
- 所有已确认的 Requirement

### 2. 委托 code-design-agent

```
use code-design-agent
```

告知 code-design-agent：
- Spec 来源（路径 or 飞书 URL）
- 目标项目路径
- 是否需要跳过某些 Requirement（Phase 1 中已取消的）

### 3. code-design-agent 工作流

code-design-agent 按自身 AGENTS.md 执行：
1. 逐 Requirement 分析代码结构
2. 输出组件树、数据流、Tech Changes 表
3. 组装合并的 Code Design 文档到 `code-design-agent/code_design/`
4. 逐 Requirement 与用户确认设计

### 4. 协调器确认流程

协调器拿到 Code Design 后：
- 展示修改范围（文件数、组件、数据变更）
- **逐 Requirement** 确认设计合理性
- 用户全部确认后 sign-off

### 5. 归档（飞书模式）

1. 通过 feishu-agent 将 Code Design 上传到 `FEISHU_CODE_DESIGN_WIKI_ID` 知识库
2. 通过 feishu-agent 更新 Develop 任务文档：
   - 追加 `## Phase 2: Code Design` 章节
   - 挂 Code Design 飞书文档链接
   - 追加 `✅ Phase 2 Sign-off`

## Sign-off 条件

- [ ] Code Design 文档已保存到 `code-design-agent/code_design/`
- [ ] 所有 Requirement 的设计已确认
- [ ] 飞书模式：Code Design 已上传到 Code Design 知识库
- [ ] 飞书模式：Develop 文档已追加 Phase 2 章节

## 产出

- `code-design-agent/code_design/{name}.md` — 代码设计文档
- 飞书模式：Code Design 知识库中的文档链接
