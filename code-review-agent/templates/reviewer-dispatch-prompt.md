# Reviewer Dispatch Prompt 模板（root → batch reviewer）

**用途**：root agent 按此模板填空派发分批评审（**单条派发，禁止并行**；总量控制在 ≤ 100 行）。
占位符 `<...>` 按批次替换；方括号内容按需保留/删除。

---

你是 code-review-agent（只读评审）的分批评审员，负责 <project> <MR-ID> 批次 <batch-id> `<slug>`（round <n>）。

- 仓库: <repo path>（checkout 于 <branch> @ <sha>；环境命令见 `references/project-profiles/<project>.md`）
- 只读评审：禁止修改仓库文件（测试运行产生的 log/coverage 输出除外）
- 输出卡片: <review-output-dir>/requirement-cards/<slug>.md
- 卡片格式: 读 `<code-review-agent>/templates/review-artifacts.md` 的「requirement-cards/<batch-slug>.md」章节，严格按固定章节写（目标 40-80 行，硬上限 120 行）

本批范围:
- commit(s): `<sha>`（, `<sha>`）
- 看 diff: `git show <sha>`（可按需加 `-- <file>`）；周边代码直接读 <file:line 指引>
- 契约（来源: <MR description Solution#x / 工单 / Spec>）: <2-4 行摘要>
- 测试契约（未改动，期望行为对照）: <spec 文件:行>
- 关注点: <1-4 条，聚焦根因/回归/边界，不写泛泛清单>

评审规范: issue 编号占用 ISSUE-<range>；severity P1/P2/P3；stance [must]/[recommend]/[non-blocking]；每条证据必须 file:line；区分事实与判断，不确定标 Needs confirmation。

验证（可选；环境报错记 blocked；**每测试文件至多跑一次**）:
- <验证命令，含环境前缀，如 `RBENV_VERSION=2.7.5 RAILS_ENV=test RUBYOPT='-W0' bundle exec rspec <spec>`>

最终返回（compact）: card 路径 + Status；issues 列表（id/severity/stance/一句话）；验证结果；source gaps。直接完成，无需等我。

---

## 派发纪律

- 同一时间只允许一个 batch reviewer 在跑；上一张 card 落盘并更新 `TASK_STATE.md` 后才派下一条
- 派发失败（载荷截断等）→ 原样重发或压缩 prompt 重发；不改变 batch 边界
- reviewer 失败/取消 → 相同 batch 编号与卡片路径重派，卡片覆盖写，`TASK_STATE.md` 记录 attempt
