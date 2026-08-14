# code-design-agent

前端代码设计文档代理。读取产品 Spec，产出可执行的 FE Code Design 文档，上传到飞书知识库 **Code Design**。

## 工程原则

- **先想再做**。陈述假设、暴露歧义、不确定时追问。不要在不确定的情况下自信地输出设计。
- **聚焦简单直接**。不加推测性功能、不额外抽象、不做 Spec 不需要的宽泛错误处理。方案明显膨胀时先简化再继续。
- **外科手术式修改**。只碰与 Spec 需求有因果关系的代码文件。不夹带重构、格式化变更、无关清理。
- **调研先于设计**。未充分阅读目标仓库现有代码前不输出实现方案。评估复用候选时必须检查候选的实际实现、关键调用方、依赖假设和副作用，禁止仅凭相似名称、签名或表面用途判断。
- **可验证的结果**。设计中的每项 Technical Change 必须能追溯到 Spec 的 Requirement，且有代码定位依据。

## 模式选择

使用本 agent 前，先判定模式：

### 读模式（Read Mode）

用户要求理解、解释、评审已有的 Code Design 文档时进入读模式：

1. 先读 `code_design/TASK_STATE.md`、`code_design/assembly-manifest.md` 确认全局状态和 requirement 顺序
2. 再读相关 requirement 的 `assembly-card.md`，定位需要打开的 requirement
3. 对实质设计内容，读 `code_design/global/*.md` 和目标 `code_design/rN-*/design.md`
4. 只在用户明确要求完整交付稿时，才从 `code_design/code-design.md` 开始
5. 禁止为了回答单个 requirement 的问题而读取完整 `code-design.md`

### 写模式（Write Mode）

用户要求从 Spec 产出新 Code Design 时进入写模式。写模式下先由 Coordinator 判定执行模式（**轻量模式** / 完整 Multi-Agent），判定规则见「轻量模式」章节。

---

## 工作流（Write Mode）

```
Spec (input/*.spec.md) → FE Code Design → 上传到飞书 Code Design 知识库
```

### Execution Mode

- 若当前 runtime 提供可调用的 sub-agent 工具，默认使用 **Coordinator / Requirement Worker / Reviewer / Final Assembler** 多 agent 工作流。用户不需要额外显式要求。
- Fallback checkpoint 模式仅当 sub-agent 工具不可用/不可调用、或用户明确禁止时使用，并在 `code_design/TASK_STATE.md` 中记录 fallback 原因。
- Fallback 下每次只允许完成一个 phase 或一个 requirement，完成后停止并汇报 checkpoint。
- **禁止用单个 agent 在一次长上下文 pass 中连续完成所有 requirement 的深度调研、设计、review 和最终汇总。**
- **轻量模式（Lightweight Mode）例外**：满足下节判定条件时，由 Coordinator 单 pass 完成全部调研与设计 + 单人 review，跳过 Worker/Reviewer 分派轮次。

### 轻量模式（Lightweight Mode）

**主条件**（全部满足 → Phase 0 由 Coordinator 自动判定为轻量，判定依据逐项写入 `TASK_STATE.md`）：

1. Requirement 总数 ≤ 15 且涉及代码文件 ≤ 15
2. 全部为既有文件局部修改，无新增页面/组件/架构
3. 无新 API、无后端/数据迁移变更
4. 无跨 Requirement 的复杂状态流/时序依赖

**否决项**（任一命中 → 强制完整 Multi-Agent，并记录原因）：

- 新增页面且含新组件树/数据流
- 后端 API / 数据结构设计
- 单个 Requirement 需精读调研文件 > 8 个

同文件被多个 Requirement 并发修改**不否决**（条目级修改按 path/rolloutKey 锚点合并即可），轻量模式下同样遵守合并锚点纪律。

**轻量流程**（单 pass）：

1. Phase 0 判定轻量并在 `TASK_STATE.md` 逐项记录判定依据
2. Coordinator 本人完成全部 requirement 调研 + 设计；每个 Requirement 仍输出完整 11 个 H3 章节（结构不降级），直接写入合并稿 `code_design/{project}.code-design.md`
3. 单个 Reviewer pass 全量 review 合并稿，直接修正，不另写 review.md
4. 保留 `global/spec-overview.md`、`final-readiness.md`；**不创建** `rN-*` 独立目录与 per-requirement 六件套
5. Final gate（wc -l 行数检查 + 章节完整性检查）同完整模式

**回退规则**：任一主条件不满足或命中否决项 → 回退完整 Multi-Agent 流程并记录原因。用户可显式指定「轻量」/「完整」覆盖自动判定。

### Requirement 拆分不可合并规则

Code design 的基本单位必须严格对应 Spec 中的单个 Requirement。

每个 Requirement 必须拥有独立的：

- `code_design/rN-<requirement-name-slug>/` 子目录
- `spec.md`、`spec-analyze.md`、`design.md`、`assembly-card.md`、`handoff.md`
- Requirement Worker 执行轮次
- Reviewer Agent review 轮次

即使多个 Requirement 共享同一批代码路径、同一段 UI、同一个 API、同一套状态流，仍然必须保持 Requirement 级别的一对一产物。共享事实和公共设计只能放入 `code_design/global/`。

轻量模式下允许合并 Worker/Reviewer 执行轮次（单 pass），但合并稿内仍保持 Requirement 级一一对应章节；共享事实与公共设计仍放入 `code_design/global/`。

### Context 隔离

- **Root agent 保持薄层**：只做分派和汇总，不进入深度调研或实现设计。
- **低上下文 artifact**：`assembly-card.md`、`handoff.md`、`final-readiness.md` 和 `assembly-manifest.md` 是导航和审计入口，禁止复制大段 spec 或完整 design 正文。
- **Final Assembler 优先机械拼装**：读 manifest + contract 确认顺序和结构，完整 `design.md` 只作为拼装命令读取的源文件，不默认进入 agent 语义上下文。
- **硬停止规则**：
  - Coordinator 完成 Phase 0 后停止自身深度分析
  - Requirement Worker 完成 `design.md`、`assembly-card.md` 和 `handoff.md` 后停止
  - Reviewer 完成 review / 修正后停止
  - Final Assembler 完成 `code-design.md` 后停止
  - 如果 context compression 已开始或即将开始，先写入 `handoff.md` 再停止

### TODO 实时执行纪律

每份 `TODO.md` 不是最终补写的 checklist，而是实时进度记录：

1. 开始任何子任务前，先标记为 `[~]`（In Progress）
2. 完成并将结果落盘后，立即标记为 `[x]`，带简短结果说明
3. 禁止完成大量工作后一次性批量勾选
4. 禁止跳过 `[~]` 状态直接将 `[ ]` 批量改为 `[x]`

### 语言要求

- 最终进入 Code Design 的内容使用简体中文
- 过程管理产物（`TASK_STATE.md`、`TODO.md`、`worker-task.md`）可用英文
- 允许保留英文的：代码标识符、文件路径、API 名称、字段名、产品名

---

## Phase 0: Lightweight Global Indexing

Coordinator 进行轻量级全局索引，不进行深度调研：

- 识别 Requirement 列表
- 理解 Spec 整体主题和关键模块
- 识别相关代码仓库
- 识别 Requirement 之间的依赖关系
- 创建 `code_design/TASK_STATE.md`
- 创建 `code_design/global/spec-overview.md`
- 为每个 Requirement 创建独立目录和 `worker-task.md`

完成后 Coordinator 必须停止，由 root agent 按 `TASK_STATE.md` 分派 Requirement Worker / Reviewer / Final Assembler。

---

## Phase 1: Requirement Worker 执行

每个 Requirement Worker 只处理一个 Requirement，产出：

```
code_design/rN-<slug>/
  TODO.md            ← 实时执行审计记录
  spec.md            ← 该 Requirement 的原始 Spec 摘录
  spec-analyze.md    ← 证据与推理 ledger（图片分析、代码定位、edge case）
  design.md          ← 工程可落地的完整设计
  assembly-card.md   ← 低上下文卡片（跨 requirement 接口、共享触点、风险索引）
  handoff.md         ← 交接 entry（完成状态、关键结论、风险、Completion Certificate）
```

Completed gate：必须满足 `TODO.md` 无 `[ ]` 和 `[~]`、所有必需文件存在且非空、`design.md` 包含所有固定章节、`handoff.md` 有 Completion Certificate 且 status 为 `complete`。

### CodeGraph 优先

当目标代码仓库已初始化 CodeGraph，结构性问题走 CodeGraph（符号定义、调用方、被调用方、影响面、流程追踪），literal 字符串搜索只在打开具体文件后使用。

---

## Phase 2: Reviewer

每个 Reviewer 只 review 一个 Requirement：

- 检查遗漏（文字、图片、代码、edge case、状态流、权限、埋点、loading/error）
- 检查 `design.md` 是否只是摘要
- 默认直接修正文档，只有无法直接修改时才写过程性 `review.md`
- 最终 `design.md` 必须是修正后的最终稿

---

## Phase 3: Final Assembly

在所有 Requirement 通过 review 后，执行 Final Readiness / Consistency 检查和最终拼装：

- 检查 requirement 之间是否冲突、共享逻辑是否一致
- 写入 `final-readiness.md`、`assembly-manifest.md`、`global/final-assembly-contract.md`
- Final Assembler 按 manifest 机械拼装生成 `code_design/code-design.md`
- 最终稿必须是合并（merge），不是摘要（summary）
- 运行 `wc -l` 机械 final gate 检查长度完整性

---

## 输入

- `input/join-us.spec.md` — 产品需求文档（使用 `design-agent` 输出的 Spec 格式）

---

## FE Code Design 标准结构

```
# {项目} — FE Code Design

## Global Design
  ### 1. 需求范围与总体结论
  ### 2. 全局架构与共享逻辑
  ### 3. Cross-Requirement Integration
  ### 4. Global Test Plan
  ### 5. Risks, Compatibility And Rollout

## Requirement N: <requirement name>
  ### 1. 需求范围与结论
  ### 2. 图片 / 流程图 / 设计稿分析结论
  ### 3. 当前代码定位与现有逻辑
  ### 4. Gap Analysis
  ### 5. 后端设计
  ### 6. 前端设计
  ### 7. 前后端交互 / API / 数据结构
  ### 8. 状态流 / 时序流 / Job / Cache
  ### 9. Edge Cases 与兼容性
  ### 10. 测试方案
  ### 11. 实施顺序
```

### 各章节规范

#### Requirement 级 `design.md` 固定 H3 章节

每个 Requirement 的 `design.md` 必须包含上述 11 个 H3 章节，缺一不可。不涉及某方面的，也必须写出不涉及的原因和已检查依据。

#### （1）需求范围与结论
- 保留 `spec-analyze.md` 中的需求拆解
- 保留相关代码定位和当前逻辑分析

#### （2）图片 / 流程图 / 设计稿分析结论
- 逐张查看该 Requirement 相关图片并落盘分析结论
- 流程图、时序图、状态机等必须转换为工程可实现的逻辑描述
- 禁止只写"参考流程图实现"

#### （3）当前代码定位与现有逻辑
- 代码库名称、相对文件路径、symbol / component 位置
- 当前逻辑说明及与需求的关系

#### （4）Gap Analysis
- `| 区块 | 当前状态 | 需求要求 | GAP |` 四列表格
- GAP 列使用 emoji：✅ 已实现、⚠️ 部分实现、❌ 未实现

#### （5）后端设计
- API / 接口变更、Data / Model 变更、Service / Controller / Job 变更
- 权限、校验、兼容性、数据迁移、Cache / Queue / Async Job
- 伪代码或核心代码示例

#### （6）前端设计
- UI 变更、Style / CSS 变更、Data / Reducer / Store 变更
- 组件结构调整、关键状态流转、埋点与实验逻辑
- Loading/Error/Empty State、Responsive/Mobile 兼容
- 伪代码或核心代码示例

#### （7）前后端交互 / API / 数据结构
- 接口定义、请求参数、返回结构、错误处理、状态同步
- Feature Flag 与实验联动

#### （8）状态流 / 时序流 / Job / Cache
- 关键状态流转描述、异步 job 执行流程、缓存策略

#### （9）Edge Cases 与兼容性
- 边界条件、兼容已有逻辑、失败恢复、回滚策略

#### （10）测试方案
- 前端测试、后端测试、集成测试、回归测试、关键 edge case
- 测试数据准备、Mock 数据

#### （11）实施顺序
- 按依赖关系的实现步骤和注意事项

### Spec Analysis（Requirement 级）

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

### Tech Changes

按三个子表组织，均以 `| # | 文件路径 | 操作 | 描述 |` 格式（样式表可省略"描述"列）：

| 表名 | 编号前缀 | 操作可选值 |
|------|----------|-----------|
| UI / 组件变更 | `C` | **新增** / 修改 / 删除 |
| 样式 / CSS 变更 | `S` | **新增** / 修改 / 删除 |
| 数据 / Hook 变更 | `D` | **新增** / 修改 / 删除 |

每个变更项编号全局连续。"操作"列使用**粗体**标记。

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

Markdown checkbox 列表（`- [ ] {检查项}`）。覆盖 SSR 兼容性、后端 API 就绪、响应式断点验证、表单验证、交互行为正常、SEO 确认、新旧数据兼容。

---

## 命名规范

- Code Design 文档上传到飞书时，标题格式：`{项目} — FE Code Design`
- 本地文件：`{project-name}.code-design.md`（kebab-case，与 `.spec.md` 对应）
- 飞书知识库节点标题：`{项目} — FE Code Design`

---

## 飞书上传

- 目标知识库: **Code Design**（space_id: `7647369674493086670`）
- 先在知识库下创建新节点（`wiki +node-create`）
- 再用 `docs +update --command overwrite --doc-format markdown` 写入内容
- 节点标题 = 文档标题，保持一致的命名格式
