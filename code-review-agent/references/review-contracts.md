# 评审契约（Review Contracts）

**来源**：反推自人工评审 Bobcat `!33853`（工单 #26571394，walter.huang 的 3 条意见）——把"资深评审者隐性依赖的收尾/生命周期不变式"显式化为可核对契约。

**怎么用**：变更**触发**下列领域时，`workflows/review-phases.md` Phase 3 加载本文件，Phase 2 卡片**必须**填「契约核对」小节。

**触发条件**（任一命中即适用）：异步流程 / 定时器（setTimeout、setInterval、rAF）/ 状态机 / 事件监听 / 滚动·动画 / 取消·中断路径 / 组件卸载 / 跨上下文（页面、预览模式）切换。

**不是穷举**：本契约是**风险提示清单**，配合代码上下文与工程判断使用；不适用时在卡片「契约核对」里一句话记 N/A。

---

## C1 — 收尾不变式（终态覆盖）

**契约**：任何让流程"结束"的出口（正常完成 / 提前返回 / 看护/轮询结束 / 取消 / 超时 / 卸载 / 上下文切换）都必须走**同一个收尾**（清除"进行中"状态 + 发出完成或终止通知 + 释放资源）。存在"只 `return` 没有收尾"的分支即违约。

**核对方法**：列出状态机的**全部出口**，逐一断言收尾调用；对照被调方契约确认遗漏后果。

**违约示例**（Bobcat !33853 pre-fix `59d9fca8`）：`_scrollTo` 里 `if (scrollCount > 1 && this._isSettledAt(index)) { return }` 只返回、未调 `PageActions.didNavigateToSection()`；`_tickSettleWatch` 的 max/stable 结束分支也未通知 → "跳转中"状态不清，后续手动滚动时 section 高亮 / URL hash 更新被拦截（`navigator_store.es6` L309 清状态、L150 未清则忽略更新）。

## C2 — 异步句柄归属与清理

**契约**：每类异步句柄（`requestAnimationFrame` / `setInterval` / `setTimeout` / `ResizeObserver` / `window` 事件监听 / 订阅）有明确**归属**；取消 / 终止 / 卸载必须清理**全部**相关句柄——**包括在别处（其他方法里）排的定时器**。同一句柄在 A 出口被清、B 出口未清 → 违约。

**核对方法**：建"句柄清单 × 出口"矩阵，逐格核对。

**违约示例**（pre-fix `59d9fca8`）：`_cancelScrollAnimation` 未 `clearTimeout(this._nextScrollTimer)`（该定时器由 `_scrollAnimationCallback` 排），而 `_cancelAutoScroll` / `_scrollToIndex` 却清 → 取消后 250ms 定时器到点重新启动滚动。

## C3 — 中断 / 改道路径穷举

**契约**：穷举所有"打断或改道"路径并逐一验证行为正确：`wheel` / `touchstart` / `keydown` / 改目标（navToPosition 等）/ 页面或上下文切换 / 组件卸载。

**核对方法**：逐路径列出触发条件与预期效果（终止 / 忽略旧任务 / 复位）。

**违约示例**（pre-fix `59d9fca8`）：`touchstart` 取消、`navToPosition` 改目标、组件卸载三条路径都让旧延迟任务重新启动。

## C4 — 监听注册语义一致

**契约**：事件监听的选项（`once` / `passive` / `capture`）必须与 handler 的**生效域**一致。`{ once: true }` + "只在特定键/条件下动作"的 handler = 监听被提前移除。

**核对方法**：读注册点，比较 option 与 handler 判断范围。

**违约示例**（pre-fix `59d9fca8`）：`window.addEventListener('keydown', keyAbort, { once: true })`，而 `keyAbort` 仅对方向键等生效 → 先按 `a`/Shift/Tab 即移除监听，之后方向键无法取消自动对齐。

## C5 — 调用后果追溯

**契约**：对每个"应发生但可能被跳过"的调用（完成通知 / 清理 / 复位），读**被调方契约**并推演"若不调用会怎样"，据此判断是否是缺陷——而不是仅凭调用存在与否。

**核对方法**：定位被调方定义（store / service / receiver），确认其语义与遗漏后果。

**违约示例**（pre-fix）：`didNavigateToSection()` 的必要性来自 store 语义（清跳转状态 → 放开后续更新），据此才能判定 C1 的遗漏是真缺陷。

## C6 — 时序推演

**契约**：异步 + 多定时器场景须画**事件时间线**（触发 → 延迟任务排入 → 用户中断 → 回调执行），验证"中断后旧任务不再生效"。

**核对方法**：给出带时间戳的推演（如 1200ms 排任务 / 1250ms 取消 / 1450ms 任务执行），确认取消后无副作用。

**违约示例**（pre-fix）：1200ms 排延迟调整 → 1250ms 触摸取消（滚动状态已清，但延迟任务仍在）→ 1450ms 任务执行，又为原区块创建新动画。

## C7 — 高风险断言须复现证据（P1/P2 必须）

**契约**：**P1 / P2** 级别的断言必须附**本地复现证据**：用实际方法 + 模拟环境（埋点计数 / 时间线日志 / 采样 / 最小化页面），不凭静态阅读断言。P3 允许静态判断。

**核对方法**：附复现方式与观测（调用次数、采样点、浏览器版本等）。无复现证据的 P1/P2 → 降级为 `Needs confirmation`。

**示例**（walter）：埋点 `didNavigateToSection()` 到第 5 秒调用次数仍为 0；Chrome 155 简化页中派发按键序列验证。

## C8 — 增量不孤立既有资源

**契约**：本次新增/修改的代码不得让它未触及的既有资源（timer / listener / 状态 / 缓存）失去清理路径。新增的取消 / 终止方法必须覆盖**既有**资源。

**核对方法**：对每个新增的收尾方法，列出它"应当覆盖的既有资源全集"，比对实际覆盖。

**违约示例**（pre-fix）："这个定时器原本就存在，但本次新增的取消方法没有把它一起清理。"

---

## 违约记录的写法

卡片「契约核对」中，违约项记为：

```
- 违规契约: C2
- 出口: touchstart 取消
- 未清理句柄: _nextScrollTimer（由 _scrollAnimationCallback 排）
- 证据: 时间线 1200/1250/1450ms（见 C6 复现）
- 关联 issue: ISSUE-xxx
```

issue 的 `Source` 记为 `Review contract Cn`；P1/P2 且无复现证据 → `Needs confirmation`。
