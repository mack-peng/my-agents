# 文件评审（File Review）

**这条工作流是什么**：用户指定文件路径（而非 diff）时，对单文件或模块做代码质量评审。

**分几步**：4 步。

---

## 步骤

1. 用 CodeGraph 理解目标文件的架构位置、调用关系、影响面（`codegraph_explore` ← 主力；按需 `codegraph_callers` / `codegraph_impact`）。样式文件用 `cssgraph_*`。
2. 阅读周边关联文件建立上下文（调用方、被调用方、同类文件）。
3. 检查：逻辑正确性、错误处理、边界条件、复用机会、风格一致性、安全隐患；涉及后端/前端时按 `workflows/review-phases.md` Phase 3 加载对应清单。
4. 输出简版评审报告到 `<review-output-dir>/<file-slug>/review.md`（结构见 `templates/review-artifacts.md` 的 review.md 模板；单文件场景可省略 batch/card 层，直接给结论 + 问题列表）。

## 说明

- 文件评审无需 diff 获取，也不强制分批评审；文件数多或涉及多模块时，退化为按文件分组的轻量 Diff 式评审。
- issue 仍进 `issue-registry.md`（如产出该 artifact），保持与主流程一致的分级与 stance。
