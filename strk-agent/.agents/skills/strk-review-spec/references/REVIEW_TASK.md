# STRK Spec Review Task

目标：基于项目指定 spec，产出一份中文 spec review，放在 `spec_review/` 子目录下。Review 必须判断 spec 对外部现状、系统现状、相关 spec、内部逻辑、问题定义、解决方案的描述是否成立。

# 一、总体要求

Review 前必须进行充分、严谨、可追溯的调研。调研范围包括：

1. 当前 spec 的完整文字内容；
2. 当前 spec 的图片、流程图、结构图、脑图、design mockup 等视觉材料；
3. 与当前 spec 明确或隐含相关的其他 specs；
4. 与需求相关的项目代码；
5. spec 中提到的第三方系统、外部平台、协议、政策、API、限制或产品行为。

阅读 spec 必须使用已安装的 `strk-prod-specs` skill read mode：

- 从 `specs/specs.json` 识别目标 spec；
- 优先读取 `body.view.local.html`；
- 使用 `attachments/manifest.json` 定位图片和附件；
- 必要时使用 `body.storage.xml` 和 `body.atlas_doc_format.json` 补充结构信息；
- 对每个相关图片逐一打开原始本地附件或关联设计源进行理解，并在 requirement TODO 中记录检查结果。

Contact sheet / thumbnail sheet 只能作为图片索引或任务分派辅助，不能作为 review 证据来源，不能替代逐张打开原始图片。大图、包含文字的图、流程图、mockup、表格截图、状态图必须按原始分辨率或足够清晰的局部放大图检查；如果图片无法清晰读取，必须记录为 evidence incomplete，而不是从缩略图猜测。

禁止只基于 spec 文本或代码经验盲猜。禁止为了节省 token、时间或上下文窗口而跳过图片、代码定位、相关 spec、外部事实或逻辑链检查。

涉及项目代码的调研必须按需使用安装的 `strk-code-guidelines` skill（`$strk-code-guidelines` in runtimes that support `$skill` syntax）加载 project heuristics。它不只用于 code review；只要需要搜索、定位、比较、理解代码，或判断 spec 对系统现状 / 方案适配性的描述是否符合代码库，就应用相关 heuristics 帮助决定要检查哪些共享组件、legacy surface、监控路径、兼容基线、依赖、性能路径、IO / query 路径和候选实现。Heuristics 是参考和指引，不是硬性规则；最终仍应结合具体证据和 judgement，发现不适用时记录简短理由即可。

## Review 维度

每个 requirement 和最终报告都必须覆盖以下六类问题。没有发现问题时，也要说明已检查且暂未发现证据支持问题存在。

1. **外部现状准确性**：spec 对第三方系统、外部平台、行业规则、API、政策、用户外部流程等现状的描述是否符合事实。
2. **系统现状准确性**：spec 对当前产品、代码、数据、API、状态流、权限、实验、埋点、错误处理等现状的描述是否符合代码库。
3. **相关 spec 一致性**：当前 spec 是否与相关 specs 的目标、约束、术语、流程、数据定义、状态定义、优先级或 rollout 计划冲突。
4. **内部一致性**：当前 spec 内部是否存在术语、目标、范围、流程、状态、数据、边界、优先级或示例互相矛盾。
5. **问题定义合理性**：spec 基于 status quo 提出的问题是否逻辑成立，是否有证据支撑，是否混淆原因、症状和目标。
6. **方案适配性**：spec 提出的解决方案是否契合问题和 status quo，是否能合理解决问题，是否遗漏关键 edge case、约束、兼容性、迁移、权限、实验、失败路径或运营风险。

## Evidence 规则

所有 review finding 必须包含证据。可接受证据包括：

- spec 原文位置、标题、表格、任务、流程图或截图；
- 图片或 mockup 的本地附件路径与观察结论；
- 代码文件、函数、类、组件、API、配置、feature flag 或数据结构；
- 相关 spec 的 slug、标题、章节、原文或图片；
- 第三方官方文档、可信当前来源、API 文档或管理后台观察结果；
- 明确的逻辑推导链。

如果证据不足，输出为 `needs-confirmation`，不要包装成确定性结论。

## Severity

每条 finding 使用以下等级之一：

- `blocker`：spec 关键事实错误、方案无法成立、会导致重大实现方向错误或上线风险。
- `major`：影响核心流程、多个 requirement、数据一致性、权限、兼容性、迁移或关键用户体验。
- `minor`：局部不清晰、边界遗漏、术语不一致或较小范围逻辑缺口。
- `question`：需要产品、业务、外部系统 owner 或工程 owner 确认才能判断。

# 二、Multi-Agent 任务分解与执行流程

本任务默认采用 Coordinator / Shared Research Worker / Requirement Worker / Reviewer / Final Assembler 工作流。

如果当前 agent runtime 支持且可调用 sub-agent / multi-agent 工具，并且 spec
包含多个 requirement 或需要广泛代码/外部事实调研，应默认使用 multi-agent 模式执行。用户不需要额外显式要求开启 sub-agent；使用本 skill 做 substantial review 本身就是按 multi-agent 工作流执行的指令。

只有在 sub-agent / multi-agent 工具不可用、工具存在但具体调用失败、或用户明确禁止本次使用 sub-agent 时，才允许使用 checkpoint fallback 模式。fallback 模式每次运行只允许完成一个 phase 或一个 requirement，并且必须在 `spec_review/TASK_STATE.md` 记录准确 fallback reason。禁止因为用户没有显式提到 sub-agent、agent 自己偏好单 agent、或觉得多 agent 协调更慢而选择 fallback。

## Context Scaling Invariant

Deep review evidence may grow with the number of requirements on disk, but no
single agent should need to load all requirement bodies, all evidence files, all
findings files, or even all review cards at once. Any phase that would otherwise
read an unbounded number of same-kind artifacts must use bounded batches,
intermediate shard contracts, or deterministic scripts.

Required caps:

- A normal `review-card.md` should stay under 120 lines; a complex one should
  stay under 180 lines and must justify the exception in `final-readiness.md`.
- A final readiness / consistency pass may read at most 12 review cards or 1,200
  card lines in one active context, whichever comes first.
- If the review has more cards than that, group cards by dependency, feature
  area, or spec order into `spec_review/global/consistency-shards/shard-N.md`.
  A later pass reads only shard contracts, not the original cards, unless a
  shard points to a specific gap.
- `global/*.md` files are shared-contract sources, not requirement summaries.
  If a global topic grows beyond a compact cross-requirement contract, split it
  into a topic folder with an `index.md` and shard files; final readiness and
  final assembly read only the index plus `global/final-review-contract.md`.
- Top-level `global/*.md`, topic `index.md`, and `global/final-review-contract.md`
  must stay under 300 lines each. `consistency-shards/shard-N.md` must stay
  under 250 lines. If any of these sources exceed the cap, split or reduce them
  again before final assembly; any temporary exception must be recorded in
  `final-readiness.md` with a reason and a targeted follow-up path.
- Final report assembly must be deterministic or mechanical. Prefer the bundled
  `scripts/assemble_spec_review.py`; do not ask one agent to semantically reread
  and rewrite every requirement finding.
- Final `spec-review.md` is a human-facing delivery artifact. Follow-up agents
  must not use it as the default machine-readable entry point when answering
  targeted questions, continuing review, or checking compliance; they should use
  `TASK_STATE.md`, `assembly-manifest.md`, `final-readiness.md`,
  `global/final-review-contract.md`, relevant shard contracts, and targeted
  `review-card.md` / source files instead.

## 1. 执行角色

### Coordinator Agent

Coordinator 只负责总控和轻量索引：

- 使用已安装的 `strk-prod-specs` skill read mode 解析目标 spec；
- 创建 `spec_review/TASK_STATE.md`；
- 创建 `spec_review/global/`；
- 识别 requirement 列表、相关图片、相关 spec、可能涉及的代码区域、外部系统；
- 为每个 requirement 创建独立目录和 `worker-task.md`；
- 创建 `spec_review/assembly-manifest.md`，记录 requirement 顺序、slug、source files、全局文档和 final assembly 规则；
- 分派 Shared Research Worker、Requirement Worker、Reviewer 和 Final Assembler。

Coordinator 禁止：

- 深度分析某个 requirement；
- 一次性分析所有图片；
- 一次性读取大量代码；
- 直接撰写 requirement `findings.md`；
- 直接撰写最终 `spec-review.md`；
- 在未落盘 worker task packet 的情况下启动深度分析。

### Shared Research Worker

Shared Research Worker 负责跨 requirement 的共享事实调研，输出只能写入：

- `spec_review/global/spec-overview.md`
- `spec_review/global/external-status-quo.md`
- `spec_review/global/code-status-quo.md`
- `spec_review/global/related-specs-map.md`
- `spec_review/global/shared-risks.md`

共享调研应覆盖：

- 目标 spec 的整体 scope、术语、actors、状态、对象、数据和流程；
- 第三方系统或外部事实；
- 当前代码中的共享状态流、API、service、store、model、job、permission、feature flag、experiment、analytics；
- 相关 specs 的关系、依赖、重复或冲突；
- 跨 requirement 的风险和开放问题。

Shared Research Worker 禁止撰写单个 requirement 的 `findings.md`，也禁止撰写最终 `spec-review.md`。

Shared research 必须保持为跨 requirement 的共享事实层。不要把每个 requirement
的完整 evidence、finding 或图片观察复制到 `global/*.md`。如果某个事实只影响单个
requirement，应写入该 requirement 的 `evidence.md` / `findings.md`，并只在
`review-card.md` 暴露必要的低上下文索引。若某个 global 文档开始承载多个
requirement 的正文级细节，必须拆回 requirement artifacts，或在
`global/final-review-contract.md` 中只保留短结论和 source pointer。

Global 文档也必须保持 bounded。如果某个 shared research 输出需要逐项覆盖很多
requirements、related specs、代码路径或外部事实，必须拆成：

- `spec_review/global/<topic>/index.md`：低上下文入口，只保存主题结论、source map、冲突索引和 shard 列表；
- `spec_review/global/<topic>/shard-N.md`：按 feature area、代码区域、外部系统或 spec order 拆分的详细共享调研。

后续 final readiness / final assembly 默认只能读取 topic `index.md`，不得读取所有
topic shards，除非 index 或 final contract 指向一个具体 gap。

### Requirement Worker

每个 Requirement Worker 只能处理一个 requirement。

职责：

- 读取自己的 `worker-task.md`；
- 创建并实时更新自己的 `TODO.md`；
- 提取该 requirement 的原始内容到 `spec.md`；
- 逐张打开原始图片、流程图、设计稿或足够清晰的局部放大图，并分析该 requirement 的视觉证据；
- 调研该 requirement 相关代码；
- 调研该 requirement 相关 specs 和外部事实；
- 完成 `evidence.md`；
- 完成 `findings.md`；
- 完成 `review-card.md`；
- 完成 `handoff.md`；
- 完成后停止。

Requirement Worker 的写入范围仅限：

- `spec_review/<requirement-slug>/TODO.md`
- `spec_review/<requirement-slug>/spec.md`
- `spec_review/<requirement-slug>/evidence.md`
- `spec_review/<requirement-slug>/findings.md`
- `spec_review/<requirement-slug>/review-card.md`
- `spec_review/<requirement-slug>/handoff.md`

Requirement Worker 禁止：

- 处理其他 requirement；
- 修改其他 requirement 目录；
- 修改 `spec_review/global/*.md`，除非 Coordinator 明确分配其兼任 Shared Research Worker；
- 修改最终 `spec_review/spec-review.md`；
- 在完成当前 requirement 后自动进入下一个 requirement。

Requirement Worker 只有在满足以下条件后，才允许报告 complete：

1. `TODO.md` 中不存在 `[ ]`；
2. `TODO.md` 中不存在 `[~]`；
3. 所有关联图片均已逐张检查并记录结果，或明确说明该 requirement 无相关图片；
4. 六个 review 维度均已检查并在 `findings.md` 中有结论；
5. `spec.md`、`evidence.md`、`findings.md`、`review-card.md`、`handoff.md` 均已存在且非空；
6. `findings.md`、`review-card.md` 和 `handoff.md` 包含固定模板中的所有章节；
7. `review-card.md` 保持低上下文，只包含 final/global review 需要的短事实、finding index、shared touchpoints、open questions 和 source pointers；
8. `handoff.md` 包含 Completion Certificate；
9. Completion Certificate 中所有检查项均为通过状态。

如果上述任一条件不满足，Requirement Worker 必须报告 blocked 或 incomplete，禁止报告 complete。

### Reviewer Agent

Reviewer Agent 只 review 一个 requirement 或一个明确的全局文档范围。

职责：

- 检查是否遗漏 requirement 原文；
- 检查是否遗漏图片、流程图、设计稿；
- 检查是否遗漏代码定位；
- 检查是否遗漏相关 spec；
- 检查是否遗漏外部事实核查；
- 检查六个 review 维度是否都被覆盖；
- 检查 finding 是否有 evidence、severity、impact 和建议；
- 检查 `review-card.md` 是否准确索引 blocker/major/question、shared touchpoints、source gaps、final assembly notes，且没有复制完整 evidence 或 findings 正文；
- 检查 `TODO.md` 是否体现真实执行过程。

Reviewer 可以直接修正对应 requirement 文档，也可以输出 `review.md`，但最终 requirement `findings.md` 必须是修正后的最终稿，不能只留下 review comments。

Coordinator / Reviewer 在接受 Requirement Worker 结果前，必须执行 completion gate。未通过 gate 的 requirement 禁止标记为完成，禁止进入 final assembly。

### Final Readiness / Consistency Reviewer

Final Readiness / Consistency Reviewer 负责在 final assembly 之前完成一次低上下文全局检查。它可以由 Coordinator、Reviewer Agent 或单独的 Consistency Reviewer 执行，但不能由 Final Assembler 兼任，避免最终汇总上下文中重新加载所有 requirement 源文档。

默认读取范围：

- `spec_review/TASK_STATE.md`
- `spec_review/assembly-manifest.md`
- compact global source files explicitly listed in `assembly-manifest.md` or `global/final-review-contract.md`
- `spec_review/*/review-card.md`，但一次 active context 最多 12 张或 1,200 行
- `spec_review/global/consistency-shards/*.md`，仅在 cards 已先被分批 reduce 成 shards 后
- 必要时定向读取被 card 或 global contract 标记为有缺口的单个 requirement `findings.md` / `handoff.md`

职责：

- 检查每个 requirement 是否通过 completion gate；
- 检查跨 requirement 的术语、状态、对象、API、权限、rollout、related specs 和外部事实是否冲突；
- 检查 `global/*.md` 是否只保留共享事实，不复制 requirement 正文；
- 如果 review cards 未超过单次读取上限，检查每个 `review-card.md` 是否足以支撑全局一致性判断，并检查 blocker / major / question 是否从 `findings.md` 被准确索引到 `review-card.md`；
- 如果 review cards 超过单次读取上限，先由 shard reviewer 在 bounded batch 内检查 card 准确性和局部一致性，写入 `spec_review/global/consistency-shards/shard-N.md`；顶层 Final Readiness / Consistency Reviewer 只能基于 shard contracts 检查 coverage、cross-shard conflicts、source gaps 和 eligibility；
- 写入 `spec_review/global/final-review-contract.md`；
- 写入 `spec_review/final-readiness.md`，明确 `Assembly Eligibility: eligible` 或 `blocked`。

如果发现某个 `review-card.md` 过长、缺少 blocker/major、缺少 shared touchpoint、或与 `findings.md` 明显不一致，应只定向读取该 requirement 的源文件并要求对应 worker / reviewer 修正。禁止为了“最后放心”重读所有 requirement 的完整 `spec.md`、`evidence.md`、`findings.md` 或 `handoff.md`。

`consistency-shards/shard-N.md` 模板：

```md
# Consistency Shard <N>

## Scope
- Cards covered:
- Requirement orders:
- Feature/code/spec area:

## Cross-Requirement Signals

## Blockers / Majors In This Shard

## Questions In This Shard

## Conflicts Or Shared Decisions

## Source Gaps Requiring Targeted Reread

## Shard Contract For Final Review
```

### Final Assembler Agent

Final Assembler 只负责最终整合，不重新调研。Final Assembler 只能在
`spec_review/final-readiness.md` 显示 `Assembly Eligibility: eligible` 后启动。

Final Assembler 只能读取：

- `spec_review/TASK_STATE.md`
- `spec_review/assembly-manifest.md`
- `spec_review/final-readiness.md`
- `spec_review/global/final-review-contract.md`
- compact global source files explicitly listed in `assembly-manifest.md`
- `spec_review/*/review-card.md` only when the total cards fit within the bounded card cap
- `spec_review/global/consistency-shards/*.md` when cards exceed the bounded card cap

最终 `spec-review.md` 的正文主要来源只能是：

- compact global source files explicitly listed in `assembly-manifest.md`
- `spec_review/*/review-card.md` or `spec_review/global/consistency-shards/*.md`
- 通过 manifest 指定的机械步骤从 `spec_review/*/findings.md` 提取的 finding blocks

Final Assembler 默认不得语义重读所有 `findings.md`。如果最终报告需要逐条保留
requirement finding，应按 `assembly-manifest.md` 的顺序机械拼接或提取
`findings.md` 中的 finding blocks；只在 `final-review-contract.md` 或
`review-card.md` 明确指出某个 requirement 有 source gap、冲突或补漏线索时，才定向读取该 requirement 的 `findings.md` / `handoff.md` 并要求先修正源文件。

Final Assembler 应优先运行本 skill 的确定性脚本：

```sh
<strk-review-spec-skill-dir>/scripts/assemble_spec_review.py --project <project-root>
```

如果需要显式指定解释器，使用 `python3 <strk-review-spec-skill-dir>/scripts/assemble_spec_review.py --project <project-root>`。

该脚本只按 manifest 和 readiness 做机械提取与拼装；它不会总结、重写或重新判断 findings。脚本进程可以按 manifest 读取 O(N) 个 source files，因为这些内容不会进入 agent 的语义上下文；禁止的是让一个 agent 在 active context 中语义读取 O(N) 个 requirement artifacts。若运行环境不能执行脚本，Final Assembler 必须按同样规则手工机械拼装，并记录不能运行脚本的原因。

`assembly-manifest.md` 的 Global Sources 只能列 compact top-level global
docs、topic `index.md`、`global/final-review-contract.md` 或 consistency
shard contracts。不得把 topic shard detail files 或其它大正文文件列入
Global Sources；如果脚本报告 global source 超过行数 cap，必须先拆分或改列低上下文 index。

Final Assembler 禁止：

- 重新读取原始 spec；
- 重新打开图片或设计稿；
- 重新进行大规模代码或外部事实调研；
- 重新执行 final readiness / global consistency review；
- 一次性语义读取所有 requirement full artifacts；
- 把 requirement findings 压缩成无证据 summary；
- 将 `handoff.md` 整篇复制、完整合并或作为最终正文来源；
- 将 Completion Certificate 写入最终 `spec-review.md`。

# 三、目录与产物结构

必须使用以下结构：

```txt
spec_review/
  TASK_STATE.md
  assembly-manifest.md
  final-readiness.md
  global/
    spec-overview.md
    external-status-quo.md
    code-status-quo.md
    related-specs-map.md
    shared-risks.md
    final-review-contract.md
    consistency-shards/
      shard-N.md
    <topic>/
      index.md
      shard-N.md
  <requirement-slug>/
    worker-task.md
    TODO.md
    spec.md
    evidence.md
    findings.md
    review-card.md
    handoff.md
    review.md
  spec-review.md
```

# 四、固定模板

## `worker-task.md`

```md
# Worker Task: <requirement title>

## Scope
- Requirement slug:
- Requirement title:
- Source sections:
- Related images:
- Related specs:
- Suspected code areas:
- External systems/facts to verify:

## Required Checks
- [ ] External status quo accuracy
- [ ] Code status quo accuracy
- [ ] Related spec consistency
- [ ] Internal consistency
- [ ] Problem framing logic
- [ ] Solution fit
- [ ] Image/mockup understanding
- [ ] Evidence-backed findings

## Output Files
- TODO.md
- spec.md
- evidence.md
- findings.md
- review-card.md
- handoff.md
```

## `TODO.md`

```md
# TODO

- [ ] Read worker-task.md
- [ ] Extract requirement text into spec.md
- [ ] Inspect every related image/mockup and record observations
- [ ] Verify external status quo
- [ ] Verify code status quo
- [ ] Compare related specs
- [ ] Check internal consistency
- [ ] Check problem framing logic
- [ ] Check solution fit
- [ ] Write evidence.md
- [ ] Write findings.md
- [ ] Write low-context review-card.md
- [ ] Write handoff.md with Completion Certificate
```

Each checked item must include a short result note.

## `evidence.md`

```md
# Evidence

## Spec Evidence

## Image Evidence

## Code Evidence

## Related Spec Evidence

## External Evidence

## Logical Analysis
```

## `findings.md`

```md
# Findings: <requirement title>

## Requirement Summary

## Review Matrix

| Dimension | Result | Evidence |
|---|---|---|
| External status quo accuracy | pass / finding / needs-confirmation | |
| Code status quo accuracy | pass / finding / needs-confirmation | |
| Related spec consistency | pass / finding / needs-confirmation | |
| Internal consistency | pass / finding / needs-confirmation | |
| Problem framing logic | pass / finding / needs-confirmation | |
| Solution fit | pass / finding / needs-confirmation | |

## Findings

### <severity>: <short title>

- Dimension:
- Evidence:
- Impact:
- Recommendation:
- Owner question:

## No-Issue Notes

## Residual Risks
```

## `review-card.md`

`review-card.md` 是 final readiness、global consistency 和 final assembly 的低上下文入口，不是完整 evidence 或 finding 的替代品。普通 requirement 通常不得超过 120 行；复杂 requirement 通常不得超过 180 行。超过时必须删去与 `findings.md` / `evidence.md` 重复的正文，只保留全局判断需要的短事实、source pointer、shared touchpoint、open question 和 assembly note。

```md
# Review Card: <requirement title>

## Identity
- Requirement order:
- Requirement slug:
- Requirement title:
- Source files:
  - spec:
  - evidence:
  - findings:
  - handoff:

## Result Index
- Overall result: pass / has-findings / needs-confirmation / blocked
- Blocker findings: list all, one line each, with pointer
- Major findings: list all, one line each, with pointer
- Minor findings: count plus top 3 only, with pointer
- Questions: list owner-facing questions that affect final report, one line each, with pointer

## Six-Dimension Matrix
| Dimension | Result | Pointer |
|---|---|---|
| External status quo accuracy | pass / finding / needs-confirmation | findings.md#... |
| Code status quo accuracy | pass / finding / needs-confirmation | findings.md#... |
| Related spec consistency | pass / finding / needs-confirmation | findings.md#... |
| Internal consistency | pass / finding / needs-confirmation | findings.md#... |
| Problem framing logic | pass / finding / needs-confirmation | findings.md#... |
| Solution fit | pass / finding / needs-confirmation | findings.md#... |

## Shared Touchpoints
- External systems:
- Code paths / APIs / models / flags:
- Related specs:
- Images / mockups:
- Cross-requirement dependencies:

## Final Assembly Notes
- Must include in final report:
- Can remain in requirement details only:
- Source gaps requiring fix before assembly:
```

## `handoff.md`

```md
# Handoff: <requirement title>

## Completed Scope

## Key Findings

## Evidence Index

## Follow-Up Questions

## Final Assembly Notes

## Completion Certificate

- Worker final status: complete / incomplete / blocked
- All related images inspected: yes / no / not-applicable
- All six review dimensions checked: yes / no
- Code status quo checked: yes / no / not-applicable
- External status quo checked: yes / no / not-applicable
- Related specs checked: yes / no / not-applicable
- Findings include evidence and severity: yes / no
- Review card is accurate and low-context: yes / no
- TODO has no open or in-progress items: yes / no
```

## `assembly-manifest.md`

```md
# Spec Review Assembly Manifest

## Template Version
- Review task version:

## Spec Title
- <spec title>

## Canonical Output
- spec_review/spec-review.md

## Global Sources
| Order | File | Purpose |
|---:|---|---|

## Requirement Sources
| Order | Requirement | Review card | Findings | Handoff | Include in final report |
|---:|---|---|---|---|---|

## Mechanical Assembly Rules
- Final Assembler may read only TASK_STATE.md, this manifest, final-readiness.md, global/final-review-contract.md, manifest-listed compact global source files, and bounded review-card files by default.
- Manifest file paths must be explicit files, not wildcards.
- If review cards exceed 12 files or 1,200 card lines, Final Readiness must use consistency shard contracts instead of asking Final Assembler to read every card, and Final Assembler must read shard contracts rather than all review cards.
- Full findings.md files may be consumed only by `scripts/assemble_spec_review.py`, equivalent deterministic/mechanical extraction, or targeted reread when a card/contract points to a specific gap.
- Completion Certificates must not be copied into spec-review.md.
```

## `global/final-review-contract.md`

```md
# Final Review Contract

## Assembly Eligibility Inputs

## Cross-Requirement Findings

## Shared Status Quo Conclusions

## Shared Terminology / State / Data Decisions

## Conflicts Resolved Before Assembly

## Open Questions Requiring Final Report Visibility

## Source Gaps Requiring Fix Before Assembly

## Final Report Must-Include Items

## Targeted Source Files Allowed For Final Assembler
```

`final-review-contract.md` 禁止复制完整 requirement 正文或完整 evidence。它只保存跨 requirement 一致性结论、最终报告约束、必须显式呈现的问题和有条件允许 Final Assembler 定向读取的源文件。

## `final-readiness.md`

```md
# Final Readiness

## Requirement Gate Results
| Requirement | TODO clean | Artifacts complete | Images checked | Six dimensions checked | Review card valid | Certificate passed | Result |
|---|---|---|---|---|---|---|---|

## Review Card Size Check
| Requirement | Lines | Result | Notes |
|---|---:|---|---|

## Consistency Shard Check
| Shard | Cards covered | Lines | Result | Notes |
|---|---:|---:|---|---|

## Global Source Size Check
| Source | Lines | Indexed/sharded | Result | Notes |
|---|---:|---|---|---|

## Global Consistency Check

## Source Gaps

## Assembly Eligibility
- Assembly Eligibility: eligible / blocked
- Reason:
```

## Final `spec-review.md`

`spec-review.md` is allowed to be a complete O(N) human-facing report. Agents
must not treat it as the default follow-up entry point; use the Read Mode below
for targeted future work.

```md
# Spec Review: <spec title>

## Executive Summary

## Overall Verdict

## Review Coverage

## Blockers

## Major Findings

## Minor Findings

## Questions / Needs Confirmation

## External Status Quo Review

## Code Status Quo Review

## Related Spec Consistency Review

## Internal Consistency Review

## Problem Framing Review

## Solution Fit Review

## Requirement-by-Requirement Findings

## Recommended Spec Changes

## Evidence Index

## Residual Risks
```

# 五、Completion Gate

Before accepting a requirement as complete, verify:

- `TODO.md` has no `[ ]` or `[~]`;
- required artifact files exist and are non-empty;
- every related image is inspected or explicitly marked not applicable;
- all six review dimensions appear in `findings.md`;
- each finding has severity, dimension, evidence, impact, and recommendation or owner question;
- `review-card.md` exists, stays low-context, and accurately indexes all blocker, major, question, shared touchpoint, source gap, and final assembly notes from `findings.md`;
- `handoff.md` includes Completion Certificate and all applicable checks pass;
- `Worker final status` is `complete`.

If any check fails, mark the requirement incomplete and send it back for repair.

Before final assembly, verify:

- `assembly-manifest.md` exists and lists every requirement in spec order;
- `assembly-manifest.md` Global Sources lists only compact global docs, topic indexes, `global/final-review-contract.md`, or consistency shard contracts, never topic shard detail files;
- every requirement passes completion gate;
- every requirement has a valid low-context `review-card.md`;
- if total review cards exceed 12 files or 1,200 lines, consistency shards exist and cover every card exactly once;
- global topic docs are compact or have low-context indexes when sharded;
- `global/final-review-contract.md` exists and contains no unresolved source gap that requires worker repair;
- `final-readiness.md` exists and says `Assembly Eligibility: eligible`.

If any final gate fails, do not generate `spec-review.md`; update `TASK_STATE.md` and route the failing requirement or global artifact back for repair.

# 六、Read Mode / Follow-up Usage

After `spec-review.md` exists, treat it as the complete human-facing report, not
as the default source for future agent work. For follow-up questions, compliance
checks, targeted explanations, or additional review:

1. Start with `spec_review/TASK_STATE.md`, `spec_review/assembly-manifest.md`,
   `spec_review/final-readiness.md`, and
   `spec_review/global/final-review-contract.md`.
2. If the question is cross-requirement, read the relevant consistency shard
   contracts or compact global indexes identified by the manifest/contract.
3. If the question targets a requirement, read only that requirement's
   `review-card.md`, then open its `findings.md` / `evidence.md` only when the
   card points to the needed detail.
4. Do not read the full `spec-review.md` just to answer a targeted question or
   validate one requirement. Only read it when the user explicitly asks to audit
   the final human-facing report as a document.

# 七、Fallback Mode

When sub-agents are unavailable:

1. Phase 0: create `spec_review/TASK_STATE.md`, global directory, requirement list, and worker-task packets.
2. Phase 1: complete shared global research only.
3. Phase 2+: complete one requirement per run, including `review-card.md`.
4. Review phase: review one completed requirement or one global document range per run.
5. Final readiness phase: create/update `assembly-manifest.md`, consistency shards if required, `global/final-review-contract.md`, and `final-readiness.md` only from bounded batches of global docs and review cards, with targeted rereads only for card/contract gaps.
6. Final phase: assemble `spec-review.md` only after all requirements pass completion gate and `final-readiness.md` says `Assembly Eligibility: eligible`.

Do not perform multiple deep requirement reviews in one fallback run.
