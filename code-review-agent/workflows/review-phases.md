# 共用评审流程（Review Phases）

**这条工作流是什么**：工单方向 / 项目方向在完成"输入解析"后共同进入的评审主流程。产出低上下文 artifact，最终机械拼装 `review.md`。

**分几步**：Phase 0 环境与来源 → Phase 1 建立评审索引 → Phase 2 分批深度评审 → Phase 3 Guideline Check → Phase 4 Final Contract & 机械拼装。

**哪几步停下来等你**：过程态 artifact 由 sub-agent / 主 agent 落盘；最终 `review.md` 交付后等待用户确认。发布评论属独立可选阶段（见 `workflows/publish.md`）。

---

## 输入（Diff 获取）

| 输入 | 示例话术 | 行为 |
|------|----------|------|
| **GitHub PR** | "review https://github.com/org/repo/pull/42" | 委托 github-agent：`gh pr view --json` 取元信息，`gh pr diff` 取 diff |
| **GitLab MR** | "review https://gitlab.example.com/group/project/-/merge_requests/123" | 委托 gitlab-agent：`glab mr view` / `glab mr diff`；或 GitLab API v4 |
| **本地 commit** | "review commit abc1234 in ~/code/my-project" | `git log` + `git diff abc1234^..abc1234` |
| **commit 范围** | "review the last 3 commits …" | `git diff HEAD~3..HEAD` |
| **分支对比** | "review feature-x against main …" | `git diff main..feature-x` |
| **原始 diff** | 直接粘贴 diff 内容 | 文本解析 |
| **未提交变更** | "review my working changes …" | `git diff` + `git diff --cached` |

**获取优先级**：① 本地路径 → `cd` 后执行 git 命令；② PR/MR URL → 平台 CLI/API；③ 有 URL 无认证 → `webfetch` 取 diff 页；④ 本地 patch 文件 → 直接 Read。

**认证**：GitHub → 委托 github-agent（`gh`）；GitLab → 委托 gitlab-agent（`glab`）；本地仓库直接用已认证 remote，不额外管理凭据。

**需求合约来源**（由方向文件提供）：工单 / Spec / Code Design 的来源类型与指针，记录进 `review-index.md` 与 `review.md` 的「评审输入」。

---

## 评审维度

每份评审按实际情况覆盖：

- **Spec / 工单一致性**：实现是否匹配需求，包括 edge case、文案、权限、灰度逻辑
- **Code Design 一致性**：实现是否遵循设计决策、API 契约、数据流、迁移计划、测试方案
- **Spec / Design 冲突**：Spec 与 Code Design 不一致、遗漏不同需求或隐含不同行为 → 以 Spec 为产品正确性优先来源，但显式标注冲突点供裁决
- **实现正确性**：bug、回归、race condition、nil/空状态、错误处理、向后兼容、副作用
- **集成风险**：跨仓库 contract、API schema、数据库迁移、后台 job、feature flag、埋点、i18n、部署顺序
- **安全性**：token 处理、权限校验、数据暴露、不安全日志、SSRF/open redirect、CORS/XSS/CSRF/CSP
- **测试与验证**：变更行为覆盖、风险适配的测试、缺失手动 QA、阻塞验证
- **代码风格与复用**：贴合现有风格、合理复用、不夹带无关重构

**纪律**：不得让 spec/design 一致性淹没 guideline 检查；即使需求看似全覆盖，仍要检查后端/前端清单类别。

---

## Phase 0: Setup

进入目标项目后先执行：

1. `which ocr` → 未安装按 `AGENTS.md` 的"安装检查"引导
2. 涉及代码结构分析 → `.codegraph/` 存在，否则提示 `codegraph init -i`
3. 涉及样式变更 → `.cssgraph/` 存在（可选，否则提示 `cssgraph init`）
4. 已读取目标项目 `AGENTS.md`
5. 确认需求合约来源（工单 / Spec / Code Design 指针），缺失则记录阻塞而非假设

---

## Phase 1: 建立评审索引

1. 获取变更概览：变更文件列表、文件数、行数（可先用 `ocr delegate preview` 生成 reviewable 清单与 ref 元数据作为分组依据）
2. 按模块/功能分组，识别评审 batch；单 batch ≤ 6 checkpoint
3. 需求合约先读 routing 深度（标题、Requirement 编号、关键决策），不整读全文
4. 建 requirement routing map：每个 checkpoint 记 spec/工单源指针、Code Design 源指针、关联变更文件、guideline scope、目标 card 路径
5. 一个 Requirement 映射大 diff 时，先按 repository / feature area / file group / symbol group / execution path 拆 checkpoint
6. 宽评审触发时（> 1 checkpoint / 拆分 checkpoint / > 1 guideline scope / 需要 final contract）建 `batch-plan.md`
7. 落盘 `review-index.md` + `TASK_STATE.md`（含恢复路由字段）
8. 建立/更新 `issue-registry.md`；重复评审保留既有 issue id 与状态历史

模板与 Context Caps 见 `templates/review-artifacts.md`。

---

## Phase 2: 分批深度评审

每个 batch 由独立 Requirement Reviewer（sub-agent）完成，或 fallback 下由主 agent 分批完成。

**每个 batch reviewer 只读**：分配给该 batch 的需求合约段落、该 batch 的 diff hunk 与周边代码、上游 card（≤ 3）。

**输出** `requirement-cards/<batch-slug>.md`（固定章节见 `templates/review-artifacts.md`）。

**契约核对（触发时强制）**：变更触及**异步 / 定时器 / 状态机 / 事件监听 / 滚动·动画 / 取消·中断路径 / 卸载 / 上下文切换**任一时，card **必须**含「契约核对」小节（异步句柄 × 出口矩阵 + 终态出口是否收尾），并对 `references/review-contracts.md` 的 C1–C8 逐条给结论（不适用记 `N/A` + 一句理由）。未填 → card 不算完成。

**纪律**：

- 一轮一批：一个 pass 只做一个 batch（+ 前置里列出的 shared shard contract），落盘并更新 `TASK_STATE.md` 后才开下一 batch
- 不因相关文件已打开就顺手继续另一 batch 的 checkpoint；靠 artifact 交接
- card 达软上限（120 行）先删重复叙述，再拆分或移证据到 `evidence/<slug>.md`

---

## Phase 3: Guideline Check

当变更触及以下领域时，创建对应 guideline-check artifact：

- 后端代码（API、数据模型、Job、迁移、权限、第三方、IO、并发）→ `guideline-checks/backend.md`，加载 `references/backend-review-checklist.md`
- 前端代码（UI 行为、样式、状态、Bundle、响应式、RTL、异步）→ `guideline-checks/frontend.md`，加载 `references/frontend-review-checklist.md`
- 目标项目特定惯例 → `guideline-checks/project-heuristics.md`（从目标项目 `AGENTS.md` 提取）
- **评审契约**：变更触及异步 / 定时器 / 状态机 / 事件监听 / 滚动动画类时，加载 `references/review-contracts.md`，在 card「契约核对」中留结论；P1/P2 断言须附复现证据（C7），无证据 → 降级 `Needs confirmation`

加载的清单来源、范围理由、逐条检查与关联 issue id 记入 artifact。项目特化清单按方向引用工作区模板（工单 → `../references/bobcat-mr-bugfix-{be,fe}-template.md`；项目 → `../references/bobcat-mr-final-review-{be,fe}-template.md`）。

状态标记与 checklist 纪律见 `templates/review-artifacts.md`。**任何 plausible risk 必须进 issue 列表（Open / Needs confirmation），不得只埋在清单里。**

---

## Phase 4: Final Contract & 机械拼装

1. 各 batch 完成后更新 `final-review-contract.md`：整体结论、blocking id、spec/design 冲突裁决、跨 batch 共享项、guideline 覆盖、验证充分性、拼装源清单
2. 按 contract 声明的源清单**机械拼装** `review.md`——不是重新生成摘要，而是各 card + issue-registry + guideline-check 的结构化合并
3. 拼装前做结构自检（见完成标准）；如目标项目有 validate 脚本则运行
4. 交付 `review.md` 后停止，等待用户确认

---

## Hard Stop

- Phase 1 完成后停止自身深度分析（sub-agent 模式下由 coordinator 继续分派 batch reviewer）
- 每个 batch reviewer 完成 card 后停止
- final contract 完成后停止
- 机械拼装 `review.md` 完成后停止
- 如果 context compression 已开始或即将开始，先写完当前 card 再停止

---

## 完成标准（Completion Criteria）

全部满足才算完成：

- diff 源与元信息已解析，或记录了阻塞原因
- `review-index.md` 存在并记录输入、shard/card 映射、readiness，且不承载无界需求表
- 宽评审触发时 `batch-plan.md` 存在，且深度评审遵循其 batch 边界
- `issue-registry.md` 存在，含汇总计数、blocking id、近期变化 id、shard/详情路径
- 每个 in-scope checkpoint 有低上下文 card，或 index 记录阻塞理由
- 无 card 依赖超过 3 个上游 card（除非用 shared shard contract）
- 每个加载的 guideline scope 有对应 guideline-check artifact，或 index 记录不适用/阻塞理由
- 结构化 checklist 完整：相关 spec/design 条目 + 每个加载的 guideline 子检查，逐项标记状态
- issue 列表来自 registry + 详情文件，均有证据支撑并分级；重复评审更新状态而非删除
- 任何 plausible risk / 可能 bug / 缺失证据 / 不清楚权衡都进入 issue 列表（Open / Needs confirmation）；只有明确安全项仅出现在清单中
- `review.md` 由 contract 声明的源清单机械拼装完成，未语义重读全部正文
- 默认未发布任何评论，或仅经用户显式确认后发布
