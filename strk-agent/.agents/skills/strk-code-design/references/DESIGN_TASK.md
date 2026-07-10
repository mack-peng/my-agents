目标：基于项目指定 spec，产出一份中文 code design，并放在 `code_design/` 子目录下。

# 一、总体要求

在撰写 code design 之前，必须先进行充分、严谨的调研。

调研范围包括：

1. 当前 spec 的完整内容；
2. spec 中关联的其他 specs（如果有）；
3. 与需求相关的项目代码；
4. spec 中的图片、流程图、结构图、脑图、design mockup 等视觉材料。

Spec 文档和图片已经同步到本地：

- 每个 spec 的图片保存在 `attachments/` 子目录下；
- 可通过 `attachments/manifest.json` 找到图片线上链接和本地路径的对应关系；
- `body.view.local.html` 已经将文档中的图片链接替换为本地图片路径。

分析 spec 时，必须结合文字和图片，先整体理解 scope 和背景，再逐条分析每个 requirement。

禁止只基于文字或代码盲猜需求。

## Requirement 拆分不可合并规则

Code design 的基本单位必须严格对应 spec 中的单个 requirement。

每个 requirement 必须拥有独立的：

- `code_design/rN-<requirement-name-slug>/` 子目录；
- `worker-task.md`；
- `spec.md`；
- `spec-analyze.md`；
- `design.md`；
- `assembly-card.md`；
- `handoff.md`；
- Requirement Worker 执行轮次；
- Reviewer Agent review 轮次。

禁止把多个 requirement bundle 成一个调研包、一个 worker assignment、一个子目录、一个 `spec-analyze.md`、一个 `design.md` 或一个 reviewer pass。

即使多个 requirement 共享同一批代码路径、同一段 UI、同一个 API、同一套状态流，仍然必须保持 requirement 级别的一对一产物。共享事实、跨 requirement 统一结论和公共设计只能放入 `code_design/global/`，再由各 requirement 的 `design.md` 引用并说明本 requirement 自己的影响、边界、实现细节和测试方案。

Coordinator、Requirement Worker、Reviewer、Final Readiness / Consistency Checker 和 Final Assembler 都必须把这个一对一关系作为硬 gate。任何合并多个 requirement 的 requirement 目录或 requirement design 都视为 incomplete，必须拆分后才能进入 review 或 final assembly。

涉及整个 spec，或者同时影响多个 requirement 的公共逻辑、共享架构、共享状态流、公共 API、公共数据结构、统一实验逻辑等内容，应放在：

`code_design/global/`

禁止为了节省 token、时间或上下文窗口，而跳过：

- 调研；
- 图片分析；
- 代码定位；
- edge case 分析；
- 兼容性分析；
- review；
- 设计细化步骤。

宁可增加调研和设计文档长度，也不要降低分析严谨性或工程完整性。

## 语言要求

最终会进入 code design 的内容，必须主要使用简体中文撰写。

这些内容包括：

- `code_design/global/*.md` 中会被最终设计引用或合并的分析结论；
- 每个 requirement 的 `spec-analyze.md`；
- 每个 requirement 的 `design.md`；
- 最终 `code_design/code-design.md`。

允许保留英文的内容包括：

- 代码标识符；
- 文件路径；
- API 名称；
- class / method / function / component 名称；
- 数据字段名；
- feature flag / experiment key；
- 第三方产品名；
- 业内通用技术术语；
- 原始 spec 中必须原样保留的英文文案或截图文字。

Agent / sub-agent 自己运行所需、且不会进入最终 code design 的过程管理产物，可以使用英文，例如：

- `code_design/TASK_STATE.md`；
- `worker-task.md`；
- `TODO.md`；
- reviewer 的过程性 `review.md`；
- sub-agent 内部执行说明、状态说明、任务分派说明。

如果某个过程管理产物中的内容会被 final assembler 用于补漏并回写到 `design.md` 或 `global/*.md`，该部分也必须以简体中文为主。

# 二、Multi-Agent 任务分解与执行流程

本任务默认且强制采用 Multi-Agent Coordinator / Worker / Reviewer / Assembler 工作流。

如果当前 agent runtime 提供可调用的 sub-agent / multi-agent 工具，必须使用 multi-agent 模式执行。用户不需要额外显式要求开启 sub-agent；使用本 skill 本身就等于要求按 multi-agent 工作流执行。

只有以下情况允许退化为 checkpoint fallback 模式：

1. 当前 runtime 没有 sub-agent / multi-agent 工具；
2. 可用工具在一次具体调用后证明不可调用；
3. 用户明确禁止本次使用 sub-agent。

如果使用 fallback 模式，必须在 `code_design/TASK_STATE.md` 中记录准确原因。禁止因为用户没有显式提到 sub-agent、agent 自己偏好单 agent、或觉得多 agent 协调更慢而选择 fallback。

Fallback 模式下每次运行只允许完成一个 phase、一个 requirement、一个 reviewer pass、final readiness / consistency contract、final assembly 或 mechanical final gate。

禁止用单个 agent 在一次长上下文中连续完成所有 requirement 的深度调研、设计、review 和最终汇总。

## 1. 执行角色

### Coordinator Agent

Coordinator 是主 agent，只负责总控和轻量索引。

职责：

- 读取本任务说明；
- 进行 lightweight global indexing；
- 识别 requirement 列表；
- 识别 requirement 之间的依赖关系；
- 创建 `code_design/TASK_STATE.md`；
- 创建 `code_design/global/`；
- 为 spec 中每个 requirement 创建一对一独立目录；
- 为每个 requirement 生成一对一 `worker-task.md`，不得把多个 requirement 合并进同一个 task packet；
- 分派 requirement worker / shared research worker / reviewer / assembler。

Coordinator 禁止：

- 深度分析某个 requirement；
- 一次性分析所有图片；
- 一次性读取大量代码；
- 将多个 requirement 分派给同一个 Requirement Worker 或同一个 requirement 目录；
- 直接撰写 requirement `design.md`；
- 直接撰写最终 `code-design.md`；
- 在未落盘 worker task packet 的情况下启动深度分析。

### Shared Research Worker

Shared Research Worker 只负责跨 requirement 的共享事实调研，例如：

- 共享状态流；
- 公共 API / Service / Store；
- 共享数据结构；
- coupon / subscription / payment 等公共逻辑；
- feature flag / experiment；
- 全局高风险代码路径。

输出只能写入：

- `code_design/global/code-map.md`
- `code_design/global/shared-state-flow.md`
- `code_design/global/shared-api-contracts.md`
- `code_design/global/shared-risks.md`

Shared Research Worker 禁止撰写单个 requirement 的 `design.md`，也禁止撰写最终 `code-design.md`。

Shared Research Worker 也禁止把多个 requirement 合并成一个 requirement 级设计。它只能沉淀跨 requirement 共享事实；具体到某个 requirement 的需求拆解、图片结论、代码 gap、实现方案、edge case 和测试方案，必须回到对应 requirement 子目录中完成。

### Final Readiness / Consistency Checker

Final Readiness / Consistency Checker 只负责收尾前的 readiness gate 和跨 requirement 一致性检查，不负责撰写最终 `code-design.md`。

该角色必须把全局一致性检查和 final readiness gate 作为一次语义收尾检查完成，默认读取 requirement `assembly-card.md`，避免两个 agent 或两个连续阶段重复读取全部 requirement `design.md` / `handoff.md`。允许在同一次检查中写入低上下文 contract 和拼装 manifest：

该角色的输出必须落盘为低上下文 contract：

- `code_design/final-readiness.md`
- `code_design/global/final-assembly-contract.md`
- `code_design/assembly-manifest.md`

职责：

- 检查所有 requirement 的 TODO、Completion Certificate、固定章节和必需产物；
- 检查 requirement 之间的共享字段、API、状态流、实现边界是否冲突；
- 将 final assembler 必须遵守的跨 requirement 结论、字段合并结论、互不触碰边界、最终测试/风险合并要求写入 `final-assembly-contract.md`；
- 将每个 requirement 的 gate 结果、文件行数、certificate 摘要和最终可进入 assembly 的结论写入 `final-readiness.md`。

Final Readiness / Consistency Checker 禁止：

- 撰写最终 `code-design.md`；
- 在完成 `final-readiness.md`、`final-assembly-contract.md` 和 `assembly-manifest.md` 后继续进入 final assembly；
- 将全局一致性检查和 final readiness gate 拆成两次完整语义读取；
- 把完整 `design.md`、`handoff.md` 或 review 过程内容复制进 `TASK_STATE.md`；
- 在后续 verifier 已可通过 `final-readiness.md`、`final-assembly-contract.md` 和 `assembly-manifest.md` 完成判断时，要求主 agent 再次语义读取所有 `design.md` / `handoff.md`。

### Requirement Worker

每个 Requirement Worker 只能处理一个 requirement。

Requirement Worker 的输入和输出必须与该 requirement 一对一对应。禁止因为当前 requirement 和其他 requirement 共享代码路径、实现顺序相邻、依赖同一个 API，或需要同一轮上线，就把多个 requirement 合并调研或合并成一个 `design.md`。

职责：

- 读取自己的 `worker-task.md`；
- 创建并实时更新自己的 `TODO.md`；
- 提取该 requirement 的原始 spec 到 `spec.md`；
- 逐张查看并分析该 requirement 相关图片、流程图、设计稿；
- 调研该 requirement 相关代码；
- 完成 `spec-analyze.md`；
- 完成 `design.md`；
- 完成 `assembly-card.md`；
- 完成 `handoff.md`；
- 完成后停止。

Requirement Worker 的写入范围仅限：

- `code_design/rN-<requirement-name-slug>/TODO.md`
- `code_design/rN-<requirement-name-slug>/spec.md`
- `code_design/rN-<requirement-name-slug>/spec-analyze.md`
- `code_design/rN-<requirement-name-slug>/design.md`
- `code_design/rN-<requirement-name-slug>/assembly-card.md`
- `code_design/rN-<requirement-name-slug>/handoff.md`

Requirement Worker 禁止：

- 处理其他 requirement；
- 在本 requirement 的 `spec.md`、`spec-analyze.md`、`design.md`、`assembly-card.md` 或 `handoff.md` 中替其他 requirement 完成正文设计；
- 修改其他 requirement 目录；
- 修改 `code_design/code-design.md`；
- 修改 `code_design/global/*.md`，除非 Coordinator 明确分配其兼任 Shared Research Worker；
- 在完成当前 requirement 后自动进入下一个 requirement。

Requirement Worker 只有在满足以下条件后，才允许报告任务完成：

1. `TODO.md` 中不存在 `[ ]`；
2. `TODO.md` 中不存在 `[~]`；
3. 所有关键任务都已标记为 `[x]`，并带有简短结果说明；
4. `spec.md`、`spec-analyze.md`、`design.md`、`assembly-card.md`、`handoff.md` 均已存在且非空；
5. `design.md` 包含固定模板中的所有章节；
6. `assembly-card.md` 包含固定模板中的所有章节；
7. `handoff.md` 包含固定模板中的所有章节；
8. `handoff.md` 中包含 Completion Certificate；
9. Completion Certificate 中所有检查项均为通过状态。

如果上述任一条件不满足，Requirement Worker 必须报告 blocked 或 incomplete，禁止报告 complete。

### Reviewer Agent

Reviewer Agent 只 review 一个 requirement 或一个明确的全局文档范围。

职责：

- 根据被 review 的范围，使用安装的 `strk-code-guidelines` skill（`$strk-code-guidelines` in runtimes that support `$skill` syntax）加载适用的 project heuristics 和 review guideline：前端相关内容使用其 frontend review guideline，后端相关内容使用其 backend review guideline，同时涉及前后端时两者都必须加载；
- 检查是否遗漏 requirement 文字；
- 检查被 review 的 requirement 目录是否只覆盖一个 spec requirement，且没有把多个 requirement bundle 在同一份 `spec-analyze.md`、`design.md` 或 `handoff.md` 中；
- 检查是否遗漏图片、流程图、设计稿内容；
- 检查是否遗漏代码定位；
- 检查是否遗漏 edge cases；
- 检查是否遗漏状态流、API、数据结构、权限、实验、埋点、loading/error/retry；
- 检查 `assembly-card.md` 是否忠实反映 `design.md` 中所有跨 requirement interface、共享代码触点、依赖顺序、backend/frontend impact、consistency risk 和 source gap；如果 `design.md` 提到共享逻辑、跨库 handoff、公共 API、共享字段、共享状态、同文件改动或实施依赖，`assembly-card.md` 必须有对应短记录；
- 如果 review 范围触及 `strk-code-guidelines` 的 project heuristics 覆盖面，检查适用 heuristics 是否被考虑过；如果相关 heuristic 未采用，确认设计中已有合理上下文理由；
- 如果 requirement 涉及多个代码库，检查每个代码库是否都有对应的当前逻辑、改动边界、跨库 contract、接收端/发送端实现细节和测试方案；
- 检查 `design.md` 是否只是摘要；
- 执行 Backend Implementation Depth Gate：如果 requirement 的后端承担权限、数据、创建、校验、存储、异步、第三方 IO、跨 repo 接收端、token/session、文件上传或 launch/create 类动作，检查后端章节是否包含文件级边界、复用候选分析、controller/service/model/job 核心流程、错误/事务/幂等/并发/隐私/测试落点，以及至少一个能降低实现歧义的核心代码骨架；
- 如果 requirement 同时涉及前端和后端，检查前后端设计深度是否失衡，尤其后端是否缺少核心实现边界、核心代码骨架、权限/事务/错误处理/测试细节；
- 检查 `TODO.md` 是否体现真实执行过程。

Reviewer 默认应直接修正对应 requirement 文档。只有在无法直接修改、需要交接阻塞问题、用户明确要求保留 review trail，或为了防止 context compression 丢失问题清单时，才允许输出过程性 `review.md`。最终 requirement `design.md` 必须是修正后的最终稿，不能只留下 review comments。

Coordinator / Reviewer 在接受 Requirement Worker 结果前，必须执行 completion gate。

如果出现以下任一情况，必须拒收该 worker 结果，并要求原 worker 继续修复，或重新分派 worker / reviewer 修正：

- `TODO.md` 包含 `[ ]`；
- `TODO.md` 包含 `[~]`；
- required artifact files 缺失或为空；
- `design.md` 缺少固定章节；
- `assembly-card.md` 缺少固定章节；
- `assembly-card.md` 遗漏 `design.md` 中已经确认的跨 requirement interface、共享代码触点、实施依赖、consistency risk 或 source gap；
- `handoff.md` 缺少固定章节；
- `handoff.md` 缺少 Completion Certificate；
- Completion Certificate 中存在未通过项；
- Completion Certificate 的 `Worker final status` 不是 `complete`。
- 后端承担权限、数据、创建、校验、存储、异步、第三方 IO、跨 repo 接收端、token/session、文件上传或 launch/create 类动作，但 `design.md` 的后端章节只有 API 列表、JSON 字段、笼统 service/controller 名称或高层描述，没有文件级改动边界、controller/service/model/job 核心流程、错误/事务/幂等/并发/隐私/测试落点和至少一个核心代码骨架。
- 同时涉及前端和后端的 requirement 中，前端设计包含具体组件、hook、伪代码或核心代码，而后端设计只有 API 列表、字段 JSON、笼统 service 名称或高层描述，没有对应的 controller/service/model/job 核心实现细节。
- 涉及多个代码库的 requirement 中，只详细设计了发起端代码库，却把接收端代码库、跨库 handoff、payload 消费、兼容旧路径、失败恢复或跨库测试写成笼统描述，或完全遗漏。

未通过 completion gate 的 requirement，禁止标记为完成，禁止进入 final assembly。

### Final Assembler Agent

Final Assembler 只负责最终整合，不重新调研，也不重新执行 readiness / consistency 语义检查。最终整合必须优先采用确定性机械拼装：agent 读取低上下文 contract、manifest 和固定模板来确认顺序与结构，完整 requirement `design.md` 只作为拼装命令读取的源文件，不默认进入 agent 的语义上下文。

Final Assembler 只能读取：

- `code_design/TASK_STATE.md`
- `code_design/final-readiness.md`
- `code_design/global/final-assembly-contract.md`
- `code_design/assembly-manifest.md`
- `code_design/*/assembly-card.md`
- `code_design/global/*.md`
- `code_design/*/design.md`（只在 `assembly-card.md`、`final-readiness.md` 或 `final-assembly-contract.md` 明确指出需要补漏、冲突或模板不完整时定向读取；机械拼装命令可以按 manifest 读取这些文件，但 agent 禁止默认语义重读全部正文）
- `code_design/*/handoff.md`（只在 `final-readiness.md`、`assembly-card.md` 或 `final-assembly-contract.md` 明确指出需要补漏时读取对应 requirement 的 handoff；禁止默认重读全部 handoff）

最终 `code-design.md` 的正文主要来源只能是：

- `code_design/global/*.md`
- `code_design/*/design.md`

`assembly-card.md` 和 `handoff.md` 只能用于：

- 在 `final-readiness.md` 已经缺失、不可信或明确指向某个 requirement 时检查 worker 是否完成；
- 在 `assembly-card.md` 或 `final-assembly-contract.md` 指出某个 requirement 需要补漏时快速定位重点；
- 发现 `design.md` 中遗漏但 `handoff.md` 明确记录的关键风险或结论。

如果 `handoff.md` 与 `design.md` 重复，应以 `design.md` 为正文来源。

如果 `handoff.md` 提醒了 `design.md` 中遗漏的关键结论，必须先修正对应 `design.md`，再进入 final assembly。

Final Assembler 禁止：

- 重新读取原始 spec；
- 重新打开图片或设计稿；
- 重新进行大规模代码调研；
- 重新执行全部 readiness gate 或 global consistency pass；
- 在已存在可信 `final-readiness.md`、`final-assembly-contract.md` 和 `assembly-manifest.md` 时默认重读所有 `handoff.md`；
- 把 requirement design 压缩成 summary；
- 将 `handoff.md` 整篇复制、完整合并或作为最终正文来源；
- 将 Completion Certificate 写入最终 `code-design.md`；
- 用“详见 xxx/design.md”代替具体内容。

Final Assembler 完成后，主 agent / verifier 只能执行机械 final gate，例如 `wc -l`、固定标题检查、禁止词搜索、Completion Certificate / TODO 泄漏搜索。禁止为了“最后确认”再次语义重读所有 requirement 正文。

## 2. 目录与产物结构

必须使用以下结构：

```txt
code_design/
  TASK_STATE.md
  final-readiness.md
  assembly-manifest.md
  global/
    spec-overview.md
    code-map.md
    shared-state-flow.md
    shared-api-contracts.md
    shared-risks.md
    final-assembly-contract.md
  rN-<requirement-name-slug>/
    worker-task.md
    TODO.md
    spec.md
    spec-analyze.md
    design.md
    assembly-card.md
    handoff.md
  code-design.md
```

`TASK_STATE.md` 是全局 milestone 追踪，不记录每个 requirement 的所有细节任务，但必须记录足以恢复收尾阶段的低上下文事实：

- requirement 列表、编号、名称和目录 slug；
- shared research 是否完成；
- 每个 requirement 的 completion gate 结果；
- Final Readiness / Consistency Contract 的落盘路径：`global/final-assembly-contract.md`、`final-readiness.md` 和 `assembly-manifest.md`；
- Final assembly 和 mechanical final gate 的结果。

`TASK_STATE.md` 禁止只写一句 “complete” 而不说明可接续的落盘入口。它也禁止复制完整 requirement 细节；详细内容应保留在 requirement 目录、global 文档、`final-readiness.md`、`global/final-assembly-contract.md` 和 `assembly-manifest.md` 中。

示例：

```md
# Code Design Task State

- [x] Global indexing. Result: requirement folders and worker tasks created.
- [~] Requirement 1 worker running.
- [ ] Requirement 2 worker pending.
- [ ] Requirement 3 worker pending.
- [ ] Requirement 4 worker pending.
- [ ] Requirement 5 worker pending.
- [ ] Final readiness / consistency contract pending.
- [ ] Final assembly pending.
- [ ] Mechanical final gate pending.
```

每个 requirement 的细颗粒度任务必须放在该 requirement 自己的 `TODO.md` 中，禁止把所有 requirement 的详细 TODO 堆到一个全局文件里。

过程产物的低上下文原则：

- `worker-task.md`、`TODO.md`、`assembly-card.md`、`handoff.md`、`final-readiness.md`、`final-assembly-contract.md` 和 `assembly-manifest.md` 是导航、审计、拼装和恢复入口，不是正文设计稿；
- 这些文件必须保存可接续的事实、路径、状态和风险，但禁止复制大段 spec、完整代码、完整图片分析正文或完整 `design.md` 段落；
- 如果某条信息已经完整写入 `design.md` 或 `global/*.md`，过程产物只保留短结论、文件路径、章节名和必要的补漏提醒；
- 过程产物应优先使用表格、短 bullet 和路径引用，避免重复叙述同一段需求或工程方案。

## 3. Phase 0：Lightweight Global Indexing

在正式进入 requirement worker 分析之前，Coordinator 只能进行轻量级全局索引，禁止进行长时间、大规模、深度的全局调研。

该阶段目标仅包括：

- 识别 requirement 列表；
- 理解 spec 的整体主题；
- 识别关键模块；
- 识别相关代码仓库；
- 识别 requirement 之间的依赖关系；
- 识别共享数据结构；
- 识别共享状态流；
- 识别公共 API / Service / Store；
- 识别 feature flag / experiment；
- 识别需要重点关注的复杂流程图或架构图；
- 创建每个 requirement 的 `worker-task.md`。

该阶段禁止：

- 深度分析所有 requirement；
- 深度阅读所有代码；
- 一次性分析所有图片；
- 一次性分析所有流程图；
- 在 context 中长期保留大量 requirement 细节；
- 在进入 requirement worker 前提前完成所有全局调研。

Phase 0 输出：

- `code_design/TASK_STATE.md`
- `code_design/global/spec-overview.md`
- `code_design/rN-<requirement-name-slug>/worker-task.md`

完成 Phase 0 后，如果因为上述允许的 fallback 原因而无法 spawn worker，应停止并向用户汇报 checkpoint；如果使用 multi-agent，Coordinator 必须继续分派 workers，但 Coordinator 自己不能进入深度分析。

## 4. Phase 1：Requirement Worker Execution

每个 requirement 都必须由独立 worker 处理，或在 fallback 模式下由主 agent 单独运行一个 checkpoint 处理。

每个 requirement worker 必须拆解并完成：

- 提取 requirement 原始内容；
- 分析 requirement 文字；
- 分析 requirement 图片；
- 查看 design mockup；
- 定位相关代码；
- 分析现有逻辑；
- 分析 edge cases；
- 推导隐性需求；
- 撰写 `spec.md`；
- 撰写 `spec-analyze.md`；
- 撰写 `design.md`；
- 撰写 `handoff.md`；
- 自检 review。

禁止只写笼统的大任务，必须拆解到足够细的粒度。但 TODO 粒度应服务于质量审计和断点恢复，不应把每一次普通文件打开、无结论的小修、格式整理或重复确认都写成独立任务。

错误示例：

- “分析 requirement 1”

正确示例：

- “查看 requirement 1 的第 1 张流程图”
- “分析 AI Agent Entry 当前入口逻辑”
- “定位 template page reducer”
- “分析 template page store 数据来源”
- “确认 experiment flag 是否影响入口展示”
- “分析 mobile layout 是否受影响”
- “检查 empty state 是否需要兼容”
- “撰写 r1-ai-entry/spec-analyze.md”

不需要单独记录为 TODO 的低价值动作示例：

- “打开文件 A”
- “重新阅读上一段”
- “修正错别字”
- “调整 Markdown 格式”
- “把同一结论同步改写到另一处过程文件”

## 5. Project Heuristics 的使用方式

项目经验规则集中保存在安装的 `strk-code-guidelines` skill（`$strk-code-guidelines` in runtimes that support `$skill` syntax）中。Requirement Worker、Reviewer 和 Final Readiness / Consistency Checker 只要需要搜索、定位、比较、理解代码，或在设计 / review 中触及对应领域，就必须加载并参考该 skill 的 project heuristics。

这些 heuristics 是高概率适用的经验提示，不是硬性规则。必须加载和参考适用的 guideline / heuristic，但最终是否采用必须依赖 spec、图片/设计稿、现有代码、repository conventions、产品意图、工程 tradeoff 和 agent / reviewer judgement：

- 代码调研阶段必须参考相关 heuristic，帮助决定要搜索哪些共享组件、legacy surface、监控路径、兼容基线、依赖、性能路径、IO / query 路径和候选实现；
- 设计阶段必须判断相关 heuristic 是否适用，并把经 judgement 确认适用的实现结论写入 `design.md`；
- review 阶段必须检查相关 heuristic 是否被考虑过；
- 如果某条 heuristic 看似相关但不适用，不要强行套用，应在 `design.md`、`spec-analyze.md` 或 `handoff.md` 中用一句短说明记录原因；
- Reviewer 不能仅因为没有采用某条 heuristic 就判定设计错误，只有缺少适用性判断、例外理由明显不成立、或结合具体证据会造成实现/维护风险时才要求补写或修正；
- 新增 heuristics 时应优先放入 `strk-code-guidelines` 的 project heuristics，避免把经验规则散落成 workflow hard rule。

## 6. Backend Implementation Depth Gate

Backend Implementation Depth Gate 是 requirement completion gate 的一部分，不是 final assembly 时才做的补充检查。

Requirement Worker、Self Review 和 Reviewer 必须先判断 backend impact level：

- `none`：不涉及后端 API、route、controller、service、model、job、migration、serializer、policy/ability、cache、queue、存储、token/session、权限或跨 repo 接收端。
- `thin`：只需要保留现有 route/controller/gon/query pass-through、静态 class/scope 或轻量配置，不新增业务状态或服务端行为。
- `core`：后端承担权限、数据、创建、校验、存储、异步、第三方 IO、跨 repo 接收端、token/session、文件上传、handoff、verification、launch/create 类动作，或前端能否正确工作依赖新的后端 contract。

`none` / `thin` 不能只写 “N/A”。必须写明：

- 不涉及或 thin 的原因；
- 已检查过的 controller/service/model/job/API/route 依据；
- 是否有间接后端回归测试，例如 route render、gon pass-through、mobile redirect 或 query preservation。

`core` 必须补齐可实施设计，不能只写 API path、JSON 字段、表名、service 名称或“新增 controller/service”。至少包括：

- 文件级改动边界：route、controller、service/domain object、model/migration、job/worker、serializer/policy/ability、spec 文件分别在哪里；
- 复用候选分析：现有 controller/service/helper/model scope 是否能复用，为什么复用或不复用，特别是相似候选的业务语义、副作用、权限和数据范围；
- controller / endpoint 核心流程：before_action、参数校验、权限/scope/rollout 顺序、调用 service 的位置、成功/失败 response 结构和稳定错误码；
- service / domain object 核心流程：输入、输出、主要 public method、关键分支、状态变更、幂等性、事务边界、外部调用、错误类型；
- model / data / migration 判断：是否需要字段、enum、索引、状态机、关联、scope、数据迁移；不需要时说明已检查依据；
- 后端安全与隐私：authorization、ownership、tenant boundary、敏感字段、日志、monitoring、URL/token/storage key 暴露风险；
- 并发与一致性：重复请求、race condition、partial failure、transaction rollback 后无法撤销的副作用、重试/补偿；
- 性能与查询：关键 query、索引、N+1、大批量数据、缓存、异步 job；
- 后端测试落点：request/controller spec、service spec、model spec、job spec、权限/ownership/error/concurrency/edge case 测试。

`core` backend 至少需要一个核心代码骨架，通常是 controller action 或 service `call` 的 Ruby/Python 伪代码/核心代码片段。如果涉及状态变更、事务、异步 job、文件/object storage、第三方 IO、权限兜底、token exchange、handoff 或 launch/create 类动作，必须给出对应 service 流程骨架。代码骨架不要求完整可运行，但必须能让 implementer 看出方法边界、关键分支、错误类型和测试目标。

如果 worker 判断某个 requirement 是 `none` 或 `thin`，但 spec/code evidence 中出现 backend-impact 信号（例如 upload、handoff、verification、permission、token、storage、job、migration、OpenHands receiving side、create/launch action），必须在 `design.md` 中解释为什么这些信号不提升到 `core`。

## 7. Requirement 内部图片与设计稿分析

图片、流程图、设计稿的分析任务，必须归属于具体 requirement 的 worker 内部。

禁止先一次性分析完整个 spec 的所有图片，再统一输出分析结果。

正确流程：

1. 分析单个 requirement；
2. 查看该 requirement 相关文字；
3. 逐张查看该 requirement 相关图片、流程图、设计稿；
4. 调研相关代码；
5. 完成该 requirement 的 `spec.md`；
6. 完成该 requirement 的 `spec-analyze.md`；
7. 完成该 requirement 的 `design.md`；
8. 完成该 requirement 的 `assembly-card.md`；
9. 完成该 requirement 的 `handoff.md`；
10. 完成该 requirement 的 review；
11. 停止。

对于 requirement 内的每一张图片、流程图、设计稿，都必须有独立分析任务。

尤其：

- Figma；
- Lanhu；
- 流程图；
- 脑图；
- 结构图；
- UI mockup；
- 时序图；
- 状态机；
- 交互图。

必须确保这些视觉材料已经被逐一查看、逐一分析，并在 requirement 对应的分析文档中落盘。

禁止只在 context 中“看过但不写下来”。

图片分析结果必须尽快落盘，但不同产物承担不同粒度，禁止三处重复同一段正文：

- `spec-analyze.md` 保存逐图证据、关键节点、分支、异常路径和推理；
- `design.md` 保存会影响实现的 UI、流程、状态、API、edge case 和测试结论；
- `handoff.md` 只保存 final assembler 或 checker 必须注意的关键图片结论、风险和补漏线索。

而不是长时间停留在 context 中。

## 8. TODO.md 实时执行纪律

TODO.md 不是最终补写的 checklist，而是执行过程中的实时进度记录。

必须遵守：

1. 开始任何 TODO 子任务前，必须先将该任务从 `[ ]` 标记为 `[~]`，表示 In Progress；
2. 完成该子任务并将结果落盘后，必须立即将该任务从 `[~]` 标记为 `[x]`；
3. 禁止完成多个无关子任务后一次性批量勾选；
4. 禁止在没有中间 `[~]` 状态的情况下，将一批 `[ ]` 任务直接改成 `[x]`；
5. 每次 TODO 更新最多只能完成同一小步骤内的少量强相关任务；
6. 如果发现新任务，必须先追加为 `[ ]`，再按 `[~]` -> `[x]` 执行；
7. 每个 `[x]` 任务应带简短结果说明，说明产物文件、关键结论或已确认的代码位置。

正确示例：

- `[~] View and analyze attachments/foo.png`
- `[x] View and analyze attachments/foo.png. Result: confirms trial cancel copy differs from non-trial copy.`
- `[~] Locate coupon cleanup callers in subscription create flow`
- `[x] Locate coupon cleanup callers in subscription create flow. Result: found in bobcat/app/services/payment/create_subscription_service.rb.`

错误示例：

- 一次性把整个 Requirement 1 下 20 个任务从 `[ ]` 全部改成 `[x]`；
- 先完成 spec、图片分析、代码调研、design，再回头统一勾选 TODO；
- `[x] Analyze requirement 1` 但没有说明具体结果、产物或代码定位。

写入或修改以下文件后，必须立即同步更新对应 TODO：

- `worker-task.md`
- `spec.md`
- `spec-analyze.md`
- `design.md`
- `assembly-card.md`
- `handoff.md`

`TASK_STATE.md`、`global/*.md`、`final-readiness.md`、`global/final-assembly-contract.md`、`assembly-manifest.md` 和 `code-design.md` 的进度应记录在 `TASK_STATE.md` 或对应 contract / manifest 中，不要求回写到每个 requirement 的 `TODO.md`。

允许在同一次文件编辑中同时完成一个小步骤的产物写入和 TODO 状态更新，避免为了制造 `[~]` -> `[x]` 轨迹而产生额外无信息量的编辑。禁止省略 `[~]` 状态，也禁止在完成大量工作后回头伪造 TODO 过程。

如果某次 TODO 更新中把 5 个以上未完成任务直接改成完成，除非这些任务属于同一个原子操作自然产生的文件写入，否则视为流程违规，必须重新按小步骤更新 TODO。

## 9. Context Budget 与 Hard Stop

必须主动控制 context 占用。

禁止：

- 在 context 中长期保留完整 spec 内容；
- 长时间保留大量图片分析结果；
- 长时间保留大量代码细节；
- 长时间保留多个 requirement 的完整分析状态；
- 在一个 worker 中处理多个 requirement。

每个 worker 的目标是始终保持：

- 小工作集（small working set）；
- 局部推理（localized reasoning scope）；
- 增量持久化（incremental persistence）；
- 最小必要上下文（minimum necessary context）。

Hard stop rules：

- Coordinator 完成 Phase 0 后必须停止自身深度分析；
- Requirement Worker 完成 `design.md`、`assembly-card.md` 和 `handoff.md` 后必须停止；
- Reviewer 完成 review / 修正后必须停止；
- Final Readiness / Consistency Checker 完成 `final-readiness.md`、`global/final-assembly-contract.md` 和 `assembly-manifest.md` 后必须停止；
- Final Assembler 完成 `code-design.md` 后必须停止；
- Mechanical final gate 完成文件级检查后必须停止，不得进入语义重读；
- 如果 context compression 已经开始、即将开始、或当前 requirement 明显过大，必须先写入 `handoff.md`，然后停止，不得继续推进新任务。

收尾阶段的额外 context 规则：

- 同一批 requirement `assembly-card.md` / `global/*.md` 只允许一个语义检查阶段完整读取；`design.md` / `handoff.md` 只能按 card 或 contract 指向定向读取；
- Final Readiness / Consistency Contract 的语义结论必须写入 `global/final-assembly-contract.md`、`final-readiness.md` 与 `assembly-manifest.md`；
- Final Assembler 必须优先读取上述 contract 和 manifest 文件，并只在 card 或 contract 指向具体缺口时读取对应源文件；
- 主 agent 在 Final Assembler 完成后只允许跑机械 gate，不允许为了确认质量再次读取全部正文；
- 如果需要在 compact 后恢复，先读 `TASK_STATE.md`、`final-readiness.md`、`global/final-assembly-contract.md` 和 `assembly-manifest.md`，不要直接重读全部 requirement 产物。

如果某个 requirement 过大，必须拆成 sub-checkpoints，例如：

- `R3-A cleanup callers`
- `R3-B flow diagram`
- `R3-C design`

每个 sub-checkpoint 完成后必须落盘，并在 `handoff.md` 记录当前进度、已确认事实、剩余任务和下一步入口。

## 10. Fallback 模式

只有符合第二节中允许的 fallback 原因时，才允许使用 checkpoint fallback。禁止因为用户没有显式要求 sub-agent 而选择 fallback：

- 一次运行只允许完成 Phase 0、一个 requirement、一个 reviewer pass、final readiness / consistency contract、final assembly 或 mechanical final gate 中的一项；
- 完成后必须停止并向用户汇报 checkpoint；
- 禁止在同一次运行中自动进入下一个 requirement；
- 禁止在 fallback 模式下一次性完成整个 `code_design/`。

Fallback 模式下仍然必须使用同样的目录结构、TODO 纪律、handoff 文件和最终完整性 gate。

# 三、每个 requirement 的产出结构

对于每个 requirement，都需要在 `code_design/` 下创建独立子目录，例如：

- `code_design/r1-ai-entry/`
- `code_design/r2-template-picker/`

必须先按 spec requirement 顺序建立一对一目录清单，再启动 Requirement Worker。禁止用一个目录表达多个 requirement，例如 `r1-r2-entry-and-picker/`、`r1-ai-flow-bundle/`、`r1-shared-ui` 这类 bundle 目录都不合规。

目录命名必须使用 `rN-<requirement-name-slug>` 格式：

- `r` 固定表示 requirement；
- `N` 是该 requirement 在 spec 中的顺序编号，例如 requirement 1 使用 `r1-`，requirement 2 使用 `r2-`；
- 后缀必须来自 requirement 名称，使用简短、可读的 kebab-case slug；
- requirement 名称太长时可以合理缩写，但必须保留能识别该 requirement 的核心含义；
- 如果 requirement 原名是中文，可以使用简短英文语义 slug 或拼音 slug；
- 禁止使用 `requirement-1`、`req-1`、`r-one` 或只有编号没有名称的目录名。

如果 Coordinator 发现一个 spec requirement 内部有多个子场景或子功能，只能在同一个 requirement 目录内用章节或 sub-checkpoint 细分；如果 spec 中是多个并列 requirement，则必须拆成多个 requirement 目录，不能为了减少 worker 数量而合并。

每个 requirement 子目录下必须包含以下核心文件。`review.md` 是可选过程产物，只在本节第 6 点列出的条件下产出。

## 0. worker-task.md

`worker-task.md` 是 Coordinator 交给 Requirement Worker 的低上下文任务包，不是 spec 副本，也不是设计正文。

它必须包含足够让 worker 独立开始工作的入口信息：

- requirement 编号、名称、目录 slug；
- 本 requirement 在 synced spec 中的来源位置或 anchor；
- 相关本地 spec 文件路径；
- 相关图片、流程图、Figma / Lanhu / mockup 链接或本地 attachment 路径；
- 预计相关代码仓库和模块入口；
- 已知跨 requirement 依赖或共享逻辑；
- 必须产出的文件和 completion gate。

`worker-task.md` 禁止复制大段原始 spec、完整图片分析、完整代码片段或预写设计方案。通常应控制在约 80-120 行内；复杂 requirement 可以略长，但仍应保持为入口索引。

`worker-task.md` 必须只分派一个 requirement。它可以指出相关 requirement 的目录和依赖关系，但禁止要求 worker 同时完成另一个 requirement 的调研、分析、设计或 review。

## 1. TODO.md

`TODO.md` 是 requirement 内的执行审计和断点恢复记录，不是完整工作日志。

必须记录的任务类型：

- requirement 原文提取；
- 每一张相关图片、流程图、设计稿的逐张查看和分析；
- 关键代码路径定位和现有逻辑分析；
- edge case、兼容性、权限、状态流、API / 数据结构、测试方案等质量检查；
- `spec.md`、`spec-analyze.md`、`design.md`、`assembly-card.md`、`handoff.md` 的创建和关键修正；
- self review 以及适用 frontend/backend guideline 的结果。

不必记录的任务类型：

- 无新结论的重复阅读；
- 普通文件打开和跳转；
- Markdown 排版、小错别字、标题编号修正；
- 只为同步过程产物而做的机械性改写。

每个 `[x]` 任务的结果说明应短而可审计，优先写路径、symbol、图片名、关键结论或产物文件。禁止把 `spec-analyze.md`、`design.md` 或 review checklist 的正文复制进 TODO。

## 2. spec.md

`spec.md` 是 requirement source packet，用于让后续 reviewer 能定位本 requirement 的原始依据。它不是完整 synced spec 的副本。

必须保存该 requirement 相关的原始信息：

- 原始文字；
- 原始图片引用；
- 原始表格、列表、状态说明或流程说明；
- 图片链接必须指向本地图片路径。

不要遗漏任何与该 requirement 直接相关的原始信息。

可以省略或用路径引用代替的内容：

- 与本 requirement 无直接关系的其它 requirement 原文；
- 已在 `global/spec-overview.md` 保存的全局背景；
- 大段重复出现的通用页面说明，除非它会影响当前 requirement 的设计判断。

如果省略了全局背景或其它 requirement 内容，必须用一句短说明指向 `global/spec-overview.md` 或对应 requirement 的 `spec.md`，不能让 reader 误以为原始 spec 没有这些内容。

## 3. spec-analyze.md

结合 spec、图片和代码，对该 requirement 做完整分析拆解。

`spec-analyze.md` 是证据和推理 ledger，不是 `design.md` 的平行正文版本。它必须完整记录会影响设计的证据、图片结论、代码定位和推理链，但应避免复制大段原始 spec、完整代码片段或未来会在 `design.md` 中展开的实现方案正文。

推荐写法：

- 用短 quote 或本地图片路径标识原始依据；
- 用表格或短 bullet 记录 “证据 -> 推理 -> 对设计的影响”；
- 代码只记录仓库、相对路径、symbol / 方法 / 组件、大致位置和关键行为结论；
- 对复杂流程图逐图分析，但只落盘关键节点、分支、异常路径和实现映射，不重复描述无实现影响的视觉细节。

内容必须包括：

- requirement 中明确提到的所有需求点；
- 文字和每一张图片中表达的需求点；
- 从需求中可以合理推导出的隐性需求；
- 可能涉及的 edge cases；
- 相关代码定位，包括：
  - 代码库名称；
  - 代码库内的相对文件路径；
  - 文件中的大致位置；
  - 当前代码逻辑说明；
  - 该代码与需求之间的关系。

推荐结构：

```md
# Requirement N Spec Analysis

## Source Index
| Source | Local path / URL | Why it matters |

## Evidence Ledger
| Evidence | Source | Reasoning | Design Impact |

## Image / Diagram Analysis
| Image | Observed facts | Flow / state / UI implications | Implementation impact |

## Code Evidence
| Repo | Path / symbol | Current behavior | Relevance |

## Edge Cases And Open Context
```

该结构可以按实际需要调整，但必须保持证据、推理和设计影响可追踪。禁止把 `design.md` 中的完整实现方案提前写在这里。

图片分析要求：

- 必须逐张打开原始尺寸图片进行分析；
- 禁止把多张图片拼成一张大图后粗略查看；
- 对流程图、脑图、结构图、业务逻辑图等，必须重点分析并确认完整理解；
- 对文字 + 图片共同表达的需求，必须结合两者理解，禁止只看文字或只看代码。

## 流程图 / 时序图 / 逻辑图 特别要求

如果 spec 图片中包含以下类型的内容：

- 流程图；
- 时序图；
- 状态机；
- 逻辑图；
- 架构图；
- 数据流图；
- 交互流程图；
- 生命周期图；
- 状态流转图；
- 业务编排图；
- decision tree；
- pipeline 图；
- queue / async flow 图；
- AI agent workflow 图；
- 任何表达业务逻辑或系统行为的图；

则必须：

1. 在 `spec-analyze.md` 中明确分析该图表达的逻辑；
2. 说明图中的关键节点、状态、流转条件、异常路径和边界情况；
3. 说明该逻辑与现有代码实现之间的对应关系；
4. 在 `design.md` 中明确描述最终实现方案；
5. 尽可能将图中的逻辑转换为：
   - 伪代码；
   - 状态机定义；
   - 状态流转描述；
   - sequence flow；
   - event flow；
   - reducer/store 状态变化；
   - async job workflow；
   - API interaction flow；
   - controller/service 调用链；
   - queue / worker 执行流程；
   - AI agent execution flow；
   - 其他工程可实现的逻辑表达方式。

禁止仅用一句“参考流程图实现”来概括。

必须确保流程逻辑已经被完整理解，并被准确映射到工程实现设计中。

对于复杂流程：

- 必须拆解正常路径；
- 必须拆解异常路径；
- 必须拆解 retry/fallback 行为；
- 必须拆解状态同步问题；
- 必须拆解 race condition 或 async timing 风险；
- 必须拆解边界条件和失败场景。

如果图片中的流程逻辑无法完全理解：

1. 必须明确指出无法理解的部分；
2. 必须说明原因；
3. 必须说明已经尝试过哪些分析方式；
4. 禁止基于猜测直接设计实现方案。

## 4. design.md

基于 `spec-analyze.md`，为该 requirement 产出工程可落地的 code design。

`design.md` 不是 `spec-analyze.md` 的摘要，也不是 high-level implementation plan。

它必须完整吸收 `spec-analyze.md` 中与实现相关的信息，包括：

- 需求拆解；
- 图片 / 流程图 / 设计稿结论；
- 当前代码定位；
- 当前代码逻辑；
- gap analysis；
- edge cases；
- 隐性需求；
- 兼容性风险；
- 状态流 / 时序流 / 数据流。

并在此基础上补充可直接实施的工程方案。

禁止只输出以下简版结构：

- “设计方案”；
- “测试建议”；
- “风险”。

每个 requirement 的 `design.md` 必须只使用 H2/H3 结构，缺一不可。最终 `code-design.md` 的 H1 只属于完整设计文档本身；requirement `design.md` 的 H2 会在机械拼装时直接成为最终文档中的 requirement 级 H2。H3 标题用于保证不同项目的 code design 格式稳定；正文粒度、表格使用、伪代码位置和实现细节组织方式可以按项目实际情况调整，但不得删除标题或把多个标题合并成一个笼统章节。

```md
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

每个 H3 下应按项目需要组织段落、表格、短 bullet、伪代码或代码骨架。可以在 H3 正文中用加粗短标签表达内部结构，例如 `原始需求范围`、`最终设计结论`、`文件级改动边界`、`Backend impact level`、`核心流程`、`测试落点`，但不要再新增 H4/H5 标题，避免最终拼装层级失控。

如果某 requirement 不涉及其中某一类内容，也不能省略章节，必须在对应章节中明确写出：

- 不涉及的原因；
- 已检查过的相关代码或 spec 依据；
- 是否存在间接影响。

内容必须包括：

### （1）需求拆解与代码定位

- 保留 `spec-analyze.md` 中的需求拆解；
- 保留相关代码定位和当前逻辑分析。
- Project heuristics 适用性：代码调研、候选实现比较、复用判断、跨 repo 边界判断和实现方案选择时，必须使用安装的 `strk-code-guidelines` skill 加载并参考 project heuristics。Heuristics 是参考和指引，不是强制规则；经 judgement 判断适用的 heuristic 结论必须进入 `design.md` 的相关方案章节；看似相关但不适用时，必须简短说明原因。
- 如果 requirement 涉及多个代码库，必须为每个代码库分别保留当前逻辑、相关文件、关键 symbol、现有调用链、与本需求的关系和是否需要修改。禁止只在一个代码库中写详细设计，而把另一个代码库用“同步支持”“接收 payload”“复用现有逻辑”等一句话带过。

### （2）实现方案风格与修改尺度约束

所有涉及具体代码修改的设计，必须遵守以下原则：

- 写代码时必须先学习并模仿相关现有代码的风格，包括命名、文件组织、抽象层级、错误处理、状态流、测试写法和局部工程习惯，避免设计出与周边代码风格差异很大、看起来突兀、不利于理解的实现；
- 如果现有代码模式明显是 code smell，不要为了“保持一致”而盲目模仿；应选择最小、局部可理解、与现有架构兼容的改进方式，并在 design 中说明原因；
- 修改现有代码文件时必须控制修改尺度，禁止把功能实现与大规模重构、格式化 churn、文件搬迁、无关 cleanup 混在一起；
- 能合理复用现有 helper、component、module、service、hook、store、API、测试工具或扩展点时，应优先复用，避免重复造轮子；
- 评估复用候选时，必须检查候选的实际实现、关键调用方、依赖假设、副作用、错误处理、权限/数据范围、兼容性和适用场景；禁止仅凭相似名称、签名、参数结构、返回结构、文件路径、注释或表面用途判断可以复用；
- 如果同一代码库或多个代码库中存在看起来相似的 API / 接口 / 函数 / 方法 / component / service / hook / store，必须比较它们的实现差异和业务语义，再决定直接复用、局部扩展复用、新增实现或明确不复用；design 中应写出被选方案的依据，以及重要候选被排除的原因；
- 设计中的伪代码或核心代码示例应体现最小必要 diff，服务于 code review 和风险控制，而不是展示理想化重写后的代码。

如果某个 requirement 确实需要较大范围重构，必须明确说明：

- 为什么无法用较小改动完成；
- 哪些改动是功能必需，哪些可以延期；
- 如何拆分为可 review、可验证的阶段。

### （3）前端方案

包括但不限于：

- UI 变更；
- Style / CSS 变更；
- Data / Reducer / Store 变更；
- 组件结构调整；
- 关键状态流转；
- 埋点与实验逻辑；
- Loading/Error/Empty State；
- Responsive/Mobile 兼容；
- 权限与可见性逻辑；
- 伪代码或核心代码示例。

方案细节必须足够工程落地。

### （4）后端方案

包括但不限于：

- API / 接口 / 视图变更；
- Data / Model 变更；
- Service / Controller / Job / Worker / Query 变更；
- 权限、校验、兼容性、数据迁移等相关考虑；
- Cache / Queue / Async Job；
- Feature Flag / Experiment；
- 错误处理与降级策略；
- 伪代码或核心代码示例。

方案细节必须足够工程落地。

如果 requirement 同时涉及前端和后端，后端设计必须达到与前端设计相当的可实施深度。禁止前端写到组件、hook、状态和核心代码，而后端只写 API path、JSON 字段或“新增 service/controller”。

后端章节必须按实际影响面补齐以下内容：

- 文件级改动边界：controller、service、model、job、serializer、policy/ability、route、migration、spec 文件分别放在哪里；
- 复用候选分析：现有 controller/service/helper/model scope 是否能复用，复用或不复用的原因，尤其要比较相似候选的业务语义和副作用；
- controller / endpoint 核心流程：before_action、参数校验、权限/scope/rollout 顺序、调用 service 的位置、成功/失败 response 结构；
- service / domain object 核心流程：输入、输出、主要方法、关键分支、状态变更、幂等性、事务边界、外部调用、错误类型；
- model / data 设计：是否需要字段、enum、索引、状态机、关联、scope、数据迁移；不需要时说明已检查的依据；
- 后端安全与隐私：authorization、ownership、tenant boundary、敏感字段、日志、监控、URL/token 暴露风险；
- 并发与一致性：重复请求、race condition、partial failure、transaction rollback 后无法撤销的副作用、重试/补偿；
- 性能与查询：关键查询、索引、N+1、大批量数据、缓存或异步 job；
- 稳定错误码 contract：前端依赖的错误码在哪里生成，未知错误如何处理，是否泄漏实现细节；
- 后端测试落点：request spec、service spec、model spec、job spec、权限/ownership/error/concurrency/edge case 测试。

后端核心代码示例不是越多越好，但必须覆盖最能降低实现歧义的路径。通常至少需要 controller action 或 service `call` 的伪代码/核心 Ruby 片段；如果有状态变更、事务、异步 job、文件/第三方 IO、权限兜底或 launch/create 类动作，必须给出对应 service 流程骨架。

后端章节不需要为了和前端行数一样而堆字数；但如果后端承担权限、数据、创建、校验、存储、异步或第三方调用等核心风险，设计深度必须能让实现者直接知道改哪些文件、如何组织核心方法、错误/事务/测试怎么落。

### （5）前后端交互 / 集成方案

包括但不限于：

- 接口定义；
- 请求参数；
- 返回结构；
- 错误处理；
- 状态同步；
- 兼容已有逻辑的方式；
- Loading/Error/Retry 行为；
- Feature Flag 与实验联动；
- 伪代码或核心代码示例。

如果 requirement 涉及多个代码库或多个应用，必须额外写出跨代码库设计：

- Source / target mapping：哪个代码库负责发起，哪个代码库负责接收，哪个服务或页面负责持久化或消费；
- Cross-repo contract：payload 字段、类型、命名风格、URL / token / storage key / session key、TTL、单次使用语义、ownership 校验和错误码；
- Receiving side implementation：接收端具体改哪些文件、读取 contract 的时机、如何写入 store/state、如何触发现有流程、如何避免重复执行；
- Backward compatibility：旧入口、旧 sessionStorage key、旧 API body、旧 conversation create flow、旧文件上传 flow 是否继续可用；
- Failure and recovery：发起端成功但跳转失败、接收端拉 payload 失败、重复刷新、重复点击、token 过期、conversation 已创建但首条消息未发送时如何处理；
- Security / privacy：prompt、file URL、storage key、signed URL、token 是否会进入 query string、browser history、logs、analytics、referrer 或 local/session storage；
- Cross-repo tests：每个代码库各自需要的 unit/request/component 测试，以及至少一个跨库手动或自动集成验证路径。

跨代码库 handoff 禁止只写“跳转到 X 并携带 data”。必须说明接收端如何消费 data，并明确如果接收端现有逻辑只支持纯文本、单仓库状态或旧 payload，具体要如何扩展且不破坏旧入口。

### （6）测试方案

包括但不限于：

- 前端测试；
- 后端测试；
- 集成测试；
- 回归测试；
- 关键 edge cases；
- 测试数据准备；
- Mock 数据；
- Feature Flag 测试；
- 权限测试；
- Empty/Error/Loading 状态测试。

测试方案必须细化到工程可执行层面。

完成每个 requirement 的 `design.md` 后，必须以 reviewer 的视角重新 review 一遍，查漏补缺。

Self review 必须先判断该 requirement 的工程影响面，并按需加载 `strk-code-guidelines` 中的 project heuristics / review guideline：

- 如果 self review 需要重新搜索、定位、比较或理解代码，或涉及 `strk-code-guidelines` project heuristics 中覆盖的颜色、基础组件、样式、legacy frontend surface、监控、mobile/WMP、依赖体积、性能、IO、第三方读取、database query 或其它实现经验规则，加载 `strk-code-guidelines`；
- 如果涉及 frontend UI、state、API consumption、client compatibility、mobile、WMP、i18n、frontend security、frontend performance 或 frontend dependencies，使用 `strk-code-guidelines` 的 frontend review guideline；
- 如果涉及 backend APIs、services、jobs、data models、database queries 或 migrations、permissions、third-party integrations、backend security、backend performance 或 backend dependencies，使用 `strk-code-guidelines` 的 backend review guideline；
- 如果同时涉及前后端，两份 guideline 都必须加载；
- 如果无法确定影响面，先根据已定位代码和实现方案做最合理判断；仍不确定时，加载可能相关的 guideline，并在 `TODO.md` / `handoff.md` 中说明不确定性；
- guideline 不是 mandatory rulebook，也不是 exhaustive checklist；不能把未命中的 guideline 条目当作安全证明，也不能把命中的 guideline 条目机械当成必须照做。必须继续结合 spec、图片/设计稿、现有代码、repository conventions、edge cases 和 best engineering judgement 审查；
- review guideline 来源于 MR review 场景；在 code design self review 中应转化为设计质量检查和补漏提示，不要求在最终 `design.md` 或 `code-design.md` 中输出 guideline checklist。

Self review 尤其检查：

- 是否遗漏图片中的需求；
- 是否遗漏隐性需求；
- 是否遗漏 edge cases；
- 是否遗漏已有代码兼容性；
- 是否遗漏状态流；
- 如果同时涉及前端和后端，是否存在前端细节明显多于后端、后端只停留在 API/JSON contract 的失衡；如果存在，必须补齐后端 controller/service/model/job 核心设计和核心代码示例；
- 如果涉及多个代码库，是否每个代码库都有可实施的设计；跨库 payload 是否有发送端、接收端、兼容、失败恢复和测试细节；
- 是否遗漏 loading/error/empty 状态；
- 是否遗漏权限逻辑；
- 是否遗漏埋点或实验逻辑；
- 是否遗漏适用的 `strk-code-guidelines` project heuristics 检查：例如颜色变量映射、`component-kit` 复用、LESS/CSS `calc(...)` 写法、legacy frontend surface、Bugsnag/monitoring、mobile/WMP、依赖体积、性能阈值、IO/query 阈值；如果相关 heuristic 未采用，是否已有合理的上下文理由；
- 是否要求实现者学习并贴合现有代码风格，且没有盲目模仿明显 code smell；
- 是否控制了现有文件修改尺度，避免不必要重构、格式化 churn、无关 cleanup 和过大 diff；
- 是否优先复用了可合理复用的现有 helper、component、module、service、hook、store、API、测试工具或扩展点；
- 是否已经检查相似复用候选的实际实现和调用上下文，避免仅凭名称、签名或表面结构猜测其适用性；
- 是否方案过于抽象、无法落地；
- 是否已覆盖适用 review guideline 中会影响设计质量、实现风险、测试方案、兼容性、安全、性能、可回滚性、依赖选择和代码边界的检查点。

如果 review 发现 `design.md` 缺少代码定位、API、状态流、edge cases、测试细节、图片结论、适用 project heuristic 的判断或例外理由、后端核心实现细节、controller/service/model/job 核心代码骨架、后端权限/事务/错误处理/测试落点、跨代码库 source/target mapping、接收端实现细节、跨库 payload contract、跨库兼容/失败恢复/测试落点、现有代码风格约束、修改尺度控制、合理复用策略、相似候选实现差异分析，或适用 guideline 暴露出的兼容性、安全、性能、可回滚、权限、数据迁移、第三方依赖、i18n、移动端、WMP、并发或测试缺口，必须立即补写对应章节。

禁止只在 TODO.md 中标记 review 完成，却不修改存在缺口的 design 文档。

`TODO.md` 中的 self review 任务必须简短记录本次适用的 guideline，例如 “Applied frontend guideline: yes/no/N/A” 和 “Applied backend guideline: yes/no/N/A”，但不得把 guideline checklist 整篇复制进 TODO。

每个 requirement 的 `design.md` 通常应显著长于对应的 `spec-analyze.md`，因为它需要保留分析结论并补充完整工程设计。

如果 `design.md` 明显短于 `spec-analyze.md`，或只包含高层 bullet points，应优先判断为 accidental summarization，必须重写。

## 5. assembly-card.md

每个 requirement worker 完成 `design.md` 后，必须额外产出 `assembly-card.md`。

`assembly-card.md` 是 Final Readiness / Consistency Checker 和 Final Assembler 的低上下文输入。它不是 `design.md` 的摘要正文，也不是最终 `code-design.md` 的正文来源；它只保存跨 requirement 一致性检查和机械拼装所需的短事实、字段、路径和风险索引。普通 requirement 通常应控制在约 40-80 行内，复杂 requirement 通常应控制在约 80-120 行内。

`assembly-card.md` 必须使用以下固定结构：

```md
# Requirement N Assembly Card

## Source
- Requirement: R<N> <requirement name>
- Design source: code_design/rN-<slug>/design.md
- Handoff source: code_design/rN-<slug>/handoff.md

## Canonical Heading
- Final H2 section heading: `## Requirement N: <requirement name>`

## Cross-Requirement Interfaces
| Type | Name / Field / API / State | Producer | Consumer | Compatibility note |
| --- | --- | --- | --- | --- |

## Shared Code Touchpoints
| Repo | Path / Symbol | Role | Other requirements that may touch it |
| --- | --- | --- | --- |

## Backend Impact
- Level: none/thin/core
- Core backend boundary:
- Required backend tests:

## Frontend Impact
- Main UI / state boundary:
- Required frontend tests:

## Assembly Must Preserve
- 需要在最终 `code-design.md` 中保留的本 requirement 关键实现结论，使用短 bullet。

## Consistency Risks
- 需要和其它 requirement 或 global 文档对齐的字段、状态、API、权限、测试或上线风险。

## Source Gaps
- None
```

要求：

- `assembly-card.md` 禁止复制完整 `design.md` 段落、完整代码骨架或完整图片分析；
- `assembly-card.md` 中的每条结论必须能追溯到本 requirement 的 `design.md`、`spec-analyze.md` 或 `global/*.md`；
- `assembly-card.md` 必须覆盖本 requirement 所有会影响全局一致性检查的事实，包括跨 requirement 依赖、共享 API / payload / state / event、共享代码路径、同文件改动风险、跨 repo handoff、实施顺序约束、测试联动和 rollout / rollback 边界；
- 如果 `design.md` 有关键缺口，`Source Gaps` 必须写出具体缺口和需要回写的章节，不能用 `assembly-card.md` 替代修正；
- Final Readiness / Consistency Checker 默认先读所有 `assembly-card.md` 做一致性检查，只在 card 指向冲突、缺口或高风险共享边界时，定向读取对应 `design.md` / `handoff.md`。

## 6. handoff.md

每个 requirement worker 完成后，必须产出 `handoff.md`。

`handoff.md` 的目标不是替代 `design.md`，也不是最终 `code-design.md` 的正文来源，而是为 reviewer、readiness/consistency checker 和必要时的 final assembler 提供低上下文成本的交接入口，避免后续阶段重新读取大量 spec、图片和代码。Final Assembler 默认应通过 `assembly-card.md`、`final-readiness.md`、`global/final-assembly-contract.md` 和 `assembly-manifest.md` 获取已经确认的收尾结论。

`handoff.md` 应保持短而可审计。普通 requirement 通常应控制在约 40-80 行内；复杂 requirement 通常应控制在约 80-150 行内。超过这个范围时，应优先删除与 `design.md` 重复的正文段落，保留路径、关键结论、补漏提醒、风险和 Completion Certificate。

`handoff.md` 必须包含：

```md
# Requirement N Handoff

## Completed Artifacts

- spec.md
- spec-analyze.md
- design.md
- assembly-card.md
- TODO.md

## Requirement Scope

用简短文字说明该 requirement 覆盖的业务范围。

## Key Conclusions

列出该 requirement 已确认的关键需求结论、图片结论、流程图结论。

## Code Locations

列出最重要的代码位置：

- repository
- relative path
- symbol / controller / service / component
- 该位置与需求的关系

## Design Decisions

列出最终采用的关键工程设计决策。

## Edge Cases And Risks

列出 final assembler 必须保留的边界情况和风险。

## Cross-Requirement Notes

列出与其他 requirement 或 global shared logic 的依赖、冲突或一致性要求。

## Final Assembly Notes

说明最终 `code-design.md` 合并时必须检查和保留的内容。该章节只作为 final assembler 的提醒清单，不应整段复制进最终 `code-design.md`。

## Completion Certificate

- TODO status checked: yes
- Remaining `[ ]` tasks: 0
- Remaining `[~]` tasks: 0
- Required artifacts exist: yes
- `design.md` fixed sections complete: yes
- `assembly-card.md` fixed sections complete: yes
- `handoff.md` fixed sections complete: yes
- Backend impact level: none/thin/core
- Backend implementation depth gate: pass/N/A
- Applicable review guidelines applied: frontend/backend/N/A
- Key findings written in Simplified Chinese where required: yes
- Worker final status: complete
```

`handoff.md` 禁止只写“详见 design.md”。

`handoff.md` 禁止整篇进入最终 `code-design.md`。

Completion Certificate 禁止进入最终 `code-design.md`。

Completion Certificate 是 requirement worker 的完成证明，必须位于 `handoff.md` 中。

如果 `TODO.md` 中仍有 `[ ]` 或 `[~]`，或者必需产物缺失，Completion Certificate 禁止写 `Worker final status: complete`。

如果某项无法通过，必须写出实际状态，并将 worker final status 写为 `blocked` 或 `incomplete`。

如果 requirement 有无法获取的关键上下文，必须在 `handoff.md` 中说明：

- 缺失内容；
- 已尝试方式；
- 对设计结论的影响；
- 当前最合理的工程假设；
- 后续 reviewer / assembler 需要注意的风险。

## 7. review.md

默认不产出 `review.md`。

Reviewer 或 self review 的目标是直接修正 `design.md`、`spec-analyze.md`、`assembly-card.md` 或 `handoff.md`，让最终 requirement 文档本身成为已 review 后的最终稿。

只有在以下情况才允许写 `review.md`：

- reviewer 无法直接修改目标文件；
- 需要向原 worker 交接一组必须修复的问题；
- 用户明确要求保留 review trail；
- review 发现的问题较多，直接修改前需要先落盘问题清单以防 context compression。

即使写了 `review.md`，它也只是过程产物；所有阻塞问题必须最终回写到对应 requirement 文档，不能只留在 `review.md` 中。

# 四、前端需求的特别要求

对于前端相关需求，额外要求如下：

1. 如果 spec 中提到 Figma / Lanhu / design mockup，必须主动访问查看，并将其作为需求分析的重要依据；
2. Figma mockup 通常以 Figma URL 的形式存在于 spec 中。必须按照已安装的 `strk-prod-specs` skill read mode，从 `body.view.local.html`、`body.storage.xml`、`body.atlas_doc_format.json` 中识别 Figma URL；
3. Figma mockup 默认必须通过 Figma MCP 访问，查看对应 file、page、frame、node、prototype 或 screenshot；
4. 只有当 Figma MCP 不可用、不足以理解设计，或用户明确要求时，才使用 authenticated Figma UI / browser 作为 fallback；
5. 如果 Figma / Lanhu / design mockup 无法访问，必须在 `TODO.md`、`spec-analyze.md`、`handoff.md` 中记录缺失内容、已尝试方式、对设计结论的影响、当前最合理工程假设和后续风险；
6. 禁止只根据 Figma URL、embed title、link text、spec 文字或代码盲猜 UI 行为、文案、状态、布局、交互或需求细节；
7. 设计稿结论必须写入 requirement 的图片 / 流程图 / 设计稿分析章节，并在最终 code design 中保留会影响实现的 UI 状态、文案、布局、交互、edge case 和视觉约束；
8. 对需求或 UI 中提到的颜色、基础组件或 LESS/CSS 写法，必须使用安装的 `strk-code-guidelines` skill 加载并参考 project heuristics；这些是经验规则和判断提示，不是 universal hard rules，适用时写入设计，不适用时说明原因；
9. Frontend self review / reviewer pass 必须检查 `strk-code-guidelines` 中相关 heuristics 是否被考虑过，但不能在缺少上下文判断时机械强制套用；
10. 如果样式方案中需要 CSS `calc(...)`，且当前文件确认为 LESS 环境，通常参考 `strk-code-guidelines` 的 project heuristics 使用 `~'calc(100% - 12px)'` 这种转义字符串形式；
11. 必要时可以通过 Computer Use 打开浏览器访问：

`https://www.strikingly.com/`

并注册账号体验相关页面，查看现有视觉效果和交互逻辑。

如需截图，截图也应按 requirement 组织保存。

# 五、无法获取上下文时的处理方式

如果有其他必要上下文无法获取，例如：

- spec 关联文档无法访问；
- Figma / Lanhu 无法打开；
- 本地代码缺失；
- 环境无法运行；
- 页面无法访问；

需要明确记录：

- 无法获取的内容；
- 已尝试的方式；
- 当前影响；
- 是否阻塞设计结论。

并及时与我沟通确认。

不要在关键上下文缺失时直接假设结论。

# 六、Review 输出要求

Review 的目标是发现问题并直接修改 design 文档本身，而不是输出 review 过程。

最终产出的所有 code design（包括 requirement 级别 design 和最终汇总版）都必须是“已经完成 review 并修正后的最终稿”。

禁止在最终文档中出现以下内容：

- reviewer feedback；
- reviewer comments；
- review notes；
- TODO；
- FIXME；
- open questions；
- pending items；
- unresolved concerns；
- “后续再确认”；
- “待讨论”；
- “可能需要”；
- “建议进一步分析”；
- 任何类似的过程态内容。

如果 review 发现问题，应直接修改对应设计内容，而不是把问题保留在最终文档中。

除非确实存在无法获取的关键上下文，否则最终 design 必须表现为：

- 已充分调研；
- 已完成 review；
- 已完成查漏补缺；
- 可直接交付工程团队实施。

如果确实存在无法确认的信息：

1. 必须明确说明缺失的上下文；
2. 必须说明已经尝试过哪些获取方式；
3. 必须说明该缺失信息对方案的影响范围；
4. 必须给出当前最合理的工程假设；
5. 必须说明哪些部分会因此存在风险。

即使存在缺失上下文，也禁止输出低质量、未完成状态的设计稿。

# 七、Final Readiness / Consistency Contract（一次语义收尾检查）

在所有 requirement 完成后，需要进行一次 Final Readiness / Consistency Contract 阶段。该阶段同时完成全局一致性检查（Global Consistency Pass）和 final assembly readiness gate。

该阶段应由 Coordinator、Reviewer Agent 或 Final Readiness / Consistency Checker 执行，但不得重新进入大规模原始调研。Final Assembler 禁止兼任该阶段，避免在最终汇总上下文中重复加载所有 requirement 源文档。

禁止先执行一个完整 Global Consistency Pass，再启动另一个 agent 重读同一批文件执行 final readiness gate。readiness 的机械检查和 consistency 的语义检查必须在同一次收尾检查中完成，并分别写入 `final-readiness.md` 和 `global/final-assembly-contract.md`。

该阶段只能读取：

- `code_design/TASK_STATE.md`
- `code_design/global/*.md`
- `code_design/*/assembly-card.md`
- `code_design/*/design.md`（只在 card 指出共享边界、缺口、冲突或高风险结论需要源文档核实时定向读取）
- `code_design/*/handoff.md`（只用于摘录 Completion Certificate 或处理 card / contract 指出的补漏线索）
- `code_design/*/TODO.md`（只用于统计 `[ ]` / `[~]` 和检查 TODO 过程纪律，不做语义重读）

该阶段的目标是：

- 检查所有 requirement 的 TODO、Completion Certificate、固定章节和必需产物；
- 检查 requirement 之间是否冲突；
- 检查共享逻辑是否一致；
- 检查全局状态流是否闭环；
- 检查 `code_design/global/*.md` 是否完整覆盖 spec-level 背景、共享代码地图、共享状态流、共享 API / payload / event contract、共享风险和跨 requirement 实施边界；
- 检查 `code_design/global/*.md` 与所有 `assembly-card.md` 是否一致；如果 card 指出共享 interface、shared touchpoint、dependency 或 risk，但 global 文档没有对应全局结论，必须补齐 global 文档或解释为什么该事实只属于单 requirement；
- 检查 API / 数据结构 / event schema 是否统一；
- 检查不同 worker 对共享逻辑是否做出了互相冲突的假设；
- 检查 `assembly-card.md` 是否足以支撑全局一致性判断；如果某个 card 对有共享逻辑信号的 requirement 只写 `None`、只列正文路径、或缺少 interface / shared touchpoint / dependency / risk 信息，必须定向读取对应 `design.md` 核实，并要求 reviewer 修正 `assembly-card.md` 或 `design.md` 后再继续；
- 检查 `assembly-card.md` 行数是否保持低上下文：普通 requirement 通常不得超过 120 行，复杂 requirement 通常不得超过 180 行；超过时必须删除与 `design.md` 重复的正文，只保留全局一致性判断需要的短事实、路径、接口、依赖、风险和 source gap；
- 检查是否需要回写修正某个 requirement 的 `design.md` 或 `handoff.md`。
- 创建 `code_design/assembly-manifest.md`，作为最终 `code-design.md` 的确定性拼装顺序和模板清单。

如果发现跨 requirement 冲突，必须先修正对应 requirement 文档或 global 文档，再进入最终汇总。

全局一致性检查部分完成后，必须写入：

`code_design/global/final-assembly-contract.md`

该 contract 是 Final Assembler 和后续 verifier 的低上下文入口，必须包含：

```md
# Final Assembly Contract

## Source Files

列出最终汇总允许使用的 global 文档、requirement `assembly-card.md` 和 requirement `design.md` 文档。完整 `design.md` 默认只作为机械拼装源文件，不要求 Final Assembler 语义重读全部正文。

## Requirement Order

列出最终 `code-design.md` 中 requirement 的顺序、标题和目录 slug。

## Cross-Requirement Decisions

记录跨 requirement 的最终统一结论，例如共享 payload 字段、API 参数、状态流、权限、发布/缓存语义、互斥实现边界。

## Required Integration Sections

列出 final assembler 必须新增或保留的 cross-requirement integration、global consistency、汇总测试和风险章节。

## Non-Goals And Do-Not-Touch Boundaries

记录本次 final design 必须排除的范围，以及不能被其它 requirement 误伤的路径、功能或产品边界。

## Source Gaps Requiring Fix Before Assembly

如果某个 handoff 指出 `design.md` 缺关键结论，列出必须先回写的文件和具体缺口；如果没有，写 `None`。

## Mechanical Final Gate Commands

列出 final assembler 完成后 verifier 只需执行的文件级检查命令和预期判断。
```

`final-assembly-contract.md` 禁止复制完整 requirement 正文，也禁止替代 `design.md` 作为最终正文来源。它只保存跨文档一致性结论、最终汇总约束和机械 gate 入口。

该阶段还必须同时写入：

`code_design/final-readiness.md`

该文件必须包含：

```md
# Final Readiness Gate

## Requirement Gate Matrix

| Requirement | TODO `[ ]` | TODO `[~]` | Required files | Fixed sections | Backend depth | Certificate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |

## File Size And Line Counts

列出每个 requirement 的 `design.md`、`assembly-card.md`、`handoff.md`、`TODO.md` 和 global 文档行数，用于 final length/completeness gate。`assembly-card.md` 行数必须单独标出是否通过低上下文 cap。

## Certificate Summary

只摘录每个 requirement 的 Completion Certificate 关键字段，不复制完整 handoff。

## Assembly Eligibility

写明 `eligible` 或 `blocked`。只有所有 requirement 均通过时才允许写 `eligible`。

## Final Verifier Inputs

列出 verifier 后续只需要读取/执行的 contract 文件和机械命令。
```

该阶段还必须写入：

`code_design/assembly-manifest.md`

该 manifest 是最终 `code-design.md` 的确定性拼装计划，必须包含：

```md
# Code Design Assembly Manifest

## Template Version
- v1

## Document Title
- <spec title> Code Design

## Canonical Output
- code_design/code-design.md

## Global Sources
| Order | Source file | Final section |
| --- | --- | --- |

## Requirement Sources
| Order | Requirement | Card file | Design file | Final H2 section heading |
| --- | --- | --- | --- | --- |

## Required Final Sections
1. Global Design
2. Requirement 1: <requirement name>
3. Requirement 2: <requirement name>
4. Continue one H2 per requirement in spec order

## Mechanical Assembly Rules
- Use this manifest order exactly.
- Write exactly one H1 for the final `code-design.md`.
- Insert global sources under `## Global Design`.
- Global source files must not contain H1 or H2 headings; use H3 or lower inside global source files so they fit under `## Global Design`.
- Insert each requirement `design.md` as an H2 section in spec order.
- Requirement `design.md` must already use H2/H3 only; preserve its heading text, heading levels, relative heading structure, and body text.
- Do not include `TODO.md`, `handoff.md`, `assembly-card.md`, Completion Certificate, review notes, or process comments in `code-design.md`.
- Only remove exact duplicate adjacent headings introduced by concatenation.
```

`assembly-manifest.md` 禁止包含 requirement 正文。它只记录输出模板版本、文件顺序、标题映射和机械拼装规则。

Final Assembler 应优先使用本 skill 自带的确定性拼装脚本：

```sh
python3 <strk-code-design-skill-dir>/scripts/assemble_code_design.py --project <project-root>
```

其中 `<strk-code-design-skill-dir>` 必须按当前 agent runtime 的已安装 skill 目录解析，不要硬编码本仓库或个人机器路径。只有脚本不可用时，才允许使用等价的确定性 shell 命令；无论使用哪种方式，都必须遵守 `assembly-manifest.md` 的顺序和规则。

所有 requirement 必须同时满足：

- `TODO.md` 中不存在 `[ ]`；
- `TODO.md` 中不存在 `[~]`；
- `spec.md`、`spec-analyze.md`、`design.md`、`assembly-card.md`、`handoff.md` 均存在且非空；
- `design.md` 包含固定模板中的所有章节；
- `assembly-card.md` 包含固定模板中的所有章节；
- `assembly-card.md` 行数通过低上下文 cap，或已在 `final-readiness.md` 说明复杂 requirement 例外理由和压缩依据；
- `handoff.md` 包含 Completion Certificate；
- Completion Certificate 中 Remaining `[ ]` tasks 为 `0`；
- Completion Certificate 中 Remaining `[~]` tasks 为 `0`；
- Completion Certificate 中 Backend impact level 为 `none`、`thin` 或 `core`；
- Completion Certificate 中 Backend implementation depth gate 为 `pass` 或 `N/A`；
- Completion Certificate 中 Worker final status 为 `complete`。

如果任一 requirement 未通过 readiness gate，必须在 `final-readiness.md` 写明 `Assembly Eligibility: blocked`，更新 `TASK_STATE.md`，并要求对应 requirement worker / reviewer 修正。禁止在 blocked 状态下生成最终 `code_design/code-design.md`。

写入 `final-assembly-contract.md` 和 `final-readiness.md` 后，该阶段必须更新 `TASK_STATE.md`，然后停止。禁止同一个 agent 继续进入 Final Assembler。

# 八、最终完整交付版 Code Design（Canonical Full Design）

在所有 requirement 完成、review 完成、并完成 Final Readiness / Consistency Contract 后，必须额外产出一份最终完整交付版 code design。

Final Assembler 启动前只能读取已经落盘的 `final-readiness.md`、`global/final-assembly-contract.md` 和 `assembly-manifest.md` 来确认 eligibility、模板版本和拼装顺序，禁止临时重新执行 readiness gate 或 global consistency pass。Final Assembler 只能在 `final-readiness.md` 显示 `Assembly Eligibility: eligible` 时启动。

该文档是：

- 最终主设计稿；
- 工程团队实际阅读和实施的版本；
- 单一事实来源（single source of truth）；
- Canonical Full Design。

最终文件必须放在：

`code_design/code-design.md`

最终 `code-design.md` 必须使用以下固定 H1/H2/H3 框架。H1 只用于最终完整设计文档；H2 直接对应 Global Design 和每个 Requirement；H3 是 Global 或单个 Requirement 内的固定主题。Final Assembler 可以根据项目实际情况补充 H3 以下的表格、列表、伪代码和说明，但不得删除 H1/H2/H3 主框架，也不得改变 requirement 顺序：

```md
# <spec title> Code Design

## Global Design
### 1. 需求范围与总体结论
### 2. 全局架构与共享逻辑
### 3. Cross-Requirement Integration
### 4. Global Test Plan
### 5. Risks, Compatibility And Rollout

## Requirement 1: <requirement name>
<!-- Insert code_design/r1-<slug>/design.md here. It must already use H2/H3 only. -->

## Requirement 2: <requirement name>
<!-- Insert code_design/r2-<slug>/design.md here. It must already use H2/H3 only. -->

## Requirement N: <requirement name>
<!-- Continue in spec requirement order. -->
```

机械拼装时，requirement `design.md` 必须已经以 `## Requirement N: <requirement name>` 开头，且内部只使用 H3 主题标题。Final Assembler 应直接拼接 requirement `design.md`，禁止再做语义重写、标题降级或把多个 requirement 的正文改写成同一个 bullet list。

## Read Mode Context Rules

`code_design/code-design.md` 的主要读者是人类。它是工程团队阅读、评审和交付的完整 assembled document，不是 agent 后续理解 code design 时的默认入口。

当 agent 需要理解、实现、review、定位或回答某个已有 code design 时，必须优先使用拆分后的低上下文源产物：

1. 先读 `code_design/TASK_STATE.md`、`code_design/assembly-manifest.md`、`code_design/final-readiness.md` 和 `code_design/global/final-assembly-contract.md`，确认整体状态、requirement 顺序、global contract 和可用入口；
2. 再读相关 requirement 的 `assembly-card.md`，定位需要打开的 requirement、共享代码触点、跨 requirement 依赖、source gap 或风险；
3. 对 substantive implementation details，读 `code_design/global/*.md` 和目标 `code_design/rN-*/design.md`；
4. 只有用户明确要求阅读最终完整文档、需要面向人类的完整交付稿、或需要检查最终拼装格式时，才从 `code_design/code-design.md` 开始；
5. 禁止为了回答单个 requirement、单个代码路径、单个 API 或单个实现问题而默认读取完整 `code-design.md`。

`code-design.md` 必须保持完整、可独立阅读；但 agent 后续工作应优先走 manifest / card / global / requirement design 的导航路径，避免重新把全部 requirements 正文装入上下文。

# 最终完整交付版的目标

最终完整交付版的目标是：

- 将所有 requirement design 合并为一份统一设计稿；
- 提供完整工程上下文；
- 保证跨 requirement 的一致性；
- 保证工程实现完整性；
- 保证工程团队无需再阅读过程文档即可直接实施。

该文档必须是：

- 完整版；
- 无损版；
- 工程细节完整保留版；

而不是：

- 精简版；
- 摘要版；
- condensed version；
- executive summary；
- high-level overview。

# 汇总原则（Merge, NOT Summarize）

最终阶段应以：

- merge；
- structure organization；
- terminology unification；
- consistency alignment；

为主。

最终稿不是重新生成的一份新摘要，而是以各 requirement `design.md` 和 `global/*.md` 为正文源文档进行结构化整合后的 canonical document。

`handoff.md` 不是最终正文源文档，只能作为 readiness gate、导航、检查清单和补漏线索使用。

最终汇总阶段必须按以下流程执行：

1. 读取 `code_design/TASK_STATE.md`，确认 Final Readiness / Consistency Contract 已完成；
2. 读取 `code_design/final-readiness.md`，确认 `Assembly Eligibility: eligible`；
3. 读取 `code_design/global/final-assembly-contract.md`，确认 source files、requirement order、cross-requirement decisions、required integration sections 和 mechanical final gate commands；
4. 读取 `code_design/assembly-manifest.md`，确认最终模板版本、global source 顺序、requirement source 顺序和 final H2 section heading；
5. 如果 `final-assembly-contract.md` 的 `Source Gaps Requiring Fix Before Assembly` 不是 `None`，必须停止并要求对应 worker / reviewer 修正源文档；
6. 默认不读取全部 `design.md` / `handoff.md`；只有 card 或 contract 明确指出某个 requirement 有补漏线索时，才定向读取对应源文件；
7. 按 `assembly-manifest.md` 的固定模板和顺序，用脚本或确定性 shell 命令机械拼装生成 `code_design/code-design.md`，禁止让 agent 基于记忆或语义重写所有正文：
   - 写入最终 `code-design.md` 固定 H1/H2/H3 框架；
   - 插入 manifest 中列出的 global source 内容；
   - 按 manifest 顺序插入每个 requirement `design.md` 正文；
   - 确认每个 requirement `design.md` 已经以 H2 开头且内部只使用 H3 主题标题；
   - 保留 requirement `design.md` 的 H2/H3 标题、相对层级和正文；
8. 根据 `final-assembly-contract.md` 补充 cross-requirement integration、global consistency notes、汇总测试方案和风险章节；
9. 只允许去除机械拼装产生的完全重复相邻标题、空白行和明显重复的局部连接句；
10. 必须保留每个 requirement 的需求拆解、图片结论、代码定位、gap、实现方案、状态流、edge cases 和测试方案；
11. 不允许把 requirement design 压缩成 bullet summary；
12. 不允许用“详见 xxx/design.md”代替具体内容；
13. 不允许将最终产物命名、描述或执行为 summary。

禁止：

- 大规模摘要；
- 大规模压缩；
- 用高层概括替代工程细节；
- 为了“简洁”而删除实现细节；
- 为了节省 token 而压缩 requirement 内容；
- 重新生成简化版设计。

Requirement design 中已经存在的工程内容，应尽量直接保留，而不是重新生成“更短版本”。

# 必须完整保留的信息

最终完整交付版必须完整保留：

- requirement 需求拆解；
- 图片分析结论；
- 流程图逻辑；
- 时序逻辑；
- 状态流转；
- edge cases；
- 隐性需求；
- 代码定位；
- API 定义；
- 数据结构；
- reducer/store 设计；
- async workflow；
- queue/job 流程；
- feature flag；
- experiment；
- loading/error/retry 行为；
- 权限逻辑；
- fallback/degrade 策略；
- 现有代码风格约束；
- 修改尺度与复用策略；
- 测试方案；
- 伪代码；
- 核心代码示例；
- 工程实现细节。

禁止因为这些内容“已经在 requirement design 中存在”而省略。

# 汇总结构要求

最终完整交付版必须使用清晰结构组织，例如：

1. 整体分析；
2. 全局架构与共享逻辑；
3. Requirement 1；
4. Requirement 2；
5. Requirement 3；
6. Cross-Requirement Integration；
7. Global Consistency Notes；
8. 测试方案；
9. 风险与兼容性分析。

每个 requirement 必须明确标注为：

- `Requirement 1`
- `Requirement 2`
- `Requirement 3`

方便与原始 spec 对照。

# 汇总阶段禁止行为

禁止在最终汇总阶段：

- 重新完整分析所有 requirement；
- 重新完整阅读 spec；
- 重新完整分析所有图片；
- 重新展开大规模代码调研；
- 推翻已经完成的 requirement design；
- 对 requirement 内容进行大规模重写；
- 在 context 中重新堆积完整 requirement 分析。

最终汇总阶段应基于：

- 已落盘的 requirement design；
- global 分析文档；
- `final-readiness.md` 中的 readiness gate 结果；
- `global/final-assembly-contract.md` 中的跨 requirement 注意事项、补漏线索和 consistency pass 修正结果；

进行结构化合并。

# 汇总阶段允许的修改

允许：

- 调整章节结构；
- 去除完全重复内容；
- 统一术语；
- 统一命名；
- 补充跨 requirement 关系；
- 修复 consistency issue；
- 补充全局状态流；
- 补充跨 requirement edge cases；
- 补充全局架构说明。

但禁止损失工程细节。

# 长度与完整性要求

默认情况下：

最终完整交付版通常应当：

- 明显长于单个 requirement design；
- 接近所有 requirement design 的总长度；
- 保留绝大多数工程细节。

如果最终完整交付版明显短于 requirement design 总和，需要优先怀疑发生了错误摘要化（accidental summarization）。

最终汇总前和汇总后都必须执行长度与完整性检查。Final Assembler 启动前优先使用 `final-readiness.md` 中已经记录的 source 行数；完成后运行：

```sh
wc -l code_design/code-design.md code_design/*/design.md code_design/global/*.md
```

检查标准：

1. `code_design/code-design.md` 通常应接近所有 requirement `design.md` 与 `global/*.md` 的总长度；
2. 如果 `code_design/code-design.md` 少于上述源文档总行数的 70%，必须视为 accidental summarization，重新汇总；
3. 如果某个 requirement 的 `design.md` 缺少固定章节，必须补齐后再进入最终汇总；
4. 如果某个 requirement 的 `design.md` 只包含高层 bullet points，必须重写；
5. 如果最终稿只包含总览、核心变更、关键代码、review checklist 等摘要型章节，必须重写。

`TASK_STATE.md` 和 final assembly task 中禁止使用 `summary`、`summarize`、`design summary` 等措辞描述最终汇总任务。

应使用：

- `Assemble canonical full design by merging requirement designs, not summarizing them`
- `Check final design preserves requirement-level implementation details`
- `Run length/completeness gate for all design documents`
- `Rewrite any requirement design that only contains high-level bullets`

# 最终交付要求

最终完整交付版必须：

- 自成一体；
- 可独立阅读；
- 不依赖过程文档；
- 不引用“详见某 requirement design”；
- 不引用“详见 spec-analyze.md”；
- 不引用 review 过程；
- 不包含 TODO/FIXME/open question 等过程态内容。

工程团队应该能够：

- 仅阅读 `code_design/code-design.md`
- 即完整理解需求、架构、实现方案、状态流、接口、边界条件与测试方案；
- 并直接开始工程实施。

最终 review / verifier 只能执行机械 final gate，不得重新语义读取所有 requirement 正文。

机械 final gate 必须检查 TODO.md 是否体现真实执行过程；检查方式应优先使用 `final-readiness.md` 的矩阵和少量 `rg` / `wc` 命令，而不是重新阅读全部 TODO 正文：

- 是否存在大批量一次性勾选；
- 是否每个 requirement 都有逐步推进痕迹；
- 是否关键任务有结果说明；
- 是否 TODO 状态与实际产物一致；
- 是否存在先完成大量工作、再回头统一勾选的迹象。

机械 final gate 还必须检查 `TASK_STATE.md` 是否准确反映 global indexing、worker execution、review、`final-readiness.md`、`final-assembly-contract.md`、`assembly-manifest.md`、final assembly 和 mechanical final gate 的 milestone 状态。

如果 `TODO.md`、`TASK_STATE.md`、`final-readiness.md`、`final-assembly-contract.md` 或 `assembly-manifest.md` 不符合实时执行纪律，必须补充过程记录并修正后续执行方式；如果 contract 明确指出设计文档本身因此存在遗漏风险，必须重新 review 对应 requirement。禁止在没有具体 contract 指向的情况下，为了“最后放心”重读所有 requirement 正文。
