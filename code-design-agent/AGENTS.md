# code-design-agent

前端代码设计文档代理。读取产品 Spec，产出可执行的 FE Code Design 文档，上传到飞书知识库 **Code Design**。

## 工作流

```
Spec (input/*.spec.md) → FE Code Design → 上传到飞书 Code Design 知识库
```

## 输入

- `input/join-us.spec.md` — 产品需求文档（使用 `design-agent` 输出的 Spec 格式）

## FE Code Design 标准结构

```
# {项目} — FE Code Design

## Spec               ← 关联的产品 Spec 说明（指向 input/*.spec.md）
## Spec Analysis      ← 当前实现 vs 需求的 GAP 分析表
## Requirements       ← 需求拆解表
## Spec Gaps / 需确认事项 ← 需与 PM 确认的问题列表
## 主要难点            ← 技术难点 + Mock 代码
## Tech Changes       ← 组件/样式/数据/Hook 变更清单
## Page Block Order   ← 页面区块自上而下结构
## Component Tree     ← 组件树
## Dependencies with Others ← 后端依赖、API 定义
## Timeline           ← 分任务工时估算
## Release Checklist  ← 发布检查清单
```

## 各章节规范

### Spec

一句话说明上游 Spec 的覆盖范围，指向 `input/` 目录下的文件名。

### Spec Analysis

`| 区块 | 当前状态 | 需求要求 | GAP |` 四列表格。每一行对比一个区块的当前实现与需求差异，GAP 列使用 emoji 标记：✅ 已实现、⚠️ 部分实现、❌ 未实现。

### Requirements

`| # | Requirement | 所属板块 | Mock | 主要难点 |` 五列表格。

- `#`: 前缀 `R`（R1, R2, ...），全局连续编号
- `Requirement`: 需求描述，精确到组件或交互行为
- `所属板块`: 归属哪个板块（如 Doors / Agro / 共享）
- `Mock`: 参考 Spec 对应条目
- `主要难点`: 明确标记"无"或简要描述难点

### Spec Gaps / 需确认事项

`| # | 问题 | 影响 | 结论 |` 四列表格。

- `#`: 前缀 `Q`（Q1, Q2, ...）
- `问题`: 具体的问题描述
- `影响`: 指向关联的 Requirement 编号（如 R15）
- `结论`: ✅ 已回答 + 结论，或 ⏳ 待确认

确认后的结论写入该行，不再保留为待办。

### 主要难点

每个难点独立小节，包含：

- **标题**: `难点 N: {描述}`
- **Mock 代码**: TypeScript/TSX fenced code block，标注文件名路径

Mock 代码必须是真实可读的伪代码级实现示意，包含关键逻辑和注释说明。

### Tech Changes

按三个子表组织，均以 `| # | 文件路径 | 操作 | 描述 |` 格式（样式表可省略"描述"列）：

| 表名 | 编号前缀 | 操作可选值 |
|------|----------|-----------|
| UI / 组件变更 | `C` | **新增** / 修改 / 删除 |
| 样式 / CSS 变更 | `S` | **新增** / 修改 / 删除 |
| 数据 / Hook 变更 | `D` | **新增** / 修改 / 删除 |

每个变更项编号全局连续（C1, C2, ..., S1, S2, ..., D1, D2, ...）。"操作"列使用**粗体**标记。

### Page Block Order

使用 fenced code block 以缩进树形结构展示页面自上而下的区块顺序：

```
N. {区块名}（新增/修改）
   ─ {子区块描述}
```

每个区块标记是新增还是修改。缩进表示嵌套关系。

### Component Tree

使用 fenced code block 以缩进树形结构展示组件层级：

```
Page
├── ChildComponent
│   ├── GrandchildComponent
│   └── GrandchildComponent
└── ChildComponent
```

### Dependencies with Others

`| Requirement | 依赖后端 | 状态 | API 定义 |` 四列表格。

- 状态列使用 ✅ / ⏳
- API 定义须包含完整的 Request/Response JSON Schema（fenced code block）

### Timeline

`| 任务 | 预估工时 |` 两列表格。

- 工时精确到 `Xh`（小时）
- 最后一行 `**合计**` 用粗体，汇总总工时

### Release Checklist

Markdown checkbox 列表（`- [ ] {检查项}`）。覆盖：

- SSR 兼容性
- 后端 API 就绪
- 响应式断点验证
- 表单验证
- 交互行为正常
- SEO 确认
- 新旧数据兼容

## 命名规范

- Code Design 文档上传到飞书时，标题格式：`{项目} — FE Code Design`
- 本地文件：`{project-name}.code-design.md`（kebab-case，与 `.spec.md` 对应）
- 飞书知识库节点标题：`{项目} — FE Code Design`

## 飞书上传

- 目标知识库: **Code Design**（space_id: `7647369674493086670`）
- 先在知识库下创建新节点（`wiki +node-create`）
- 再用 `docs +update --command overwrite --doc-format markdown` 写入内容
- 节点标题 = 文档标题，保持一致的命名格式
