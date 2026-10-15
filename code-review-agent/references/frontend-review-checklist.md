# 前端评审检查清单（Frontend Review Checklist）

**来源**：移植自 `agent-rnd-skills` 的 `strk-code-guidelines/FRONTEND_REVIEW_GUIDELINE.md`（去项目专有化）。项目特化清单见工作区模板 `../references/bobcat-mr-bugfix-fe-template.md` 与 `../references/bobcat-mr-final-review-fe-template.md`。

**怎么用**：`workflows/review-phases.md` Phase 3 加载本清单，逐条标记状态（`✅ Passed` / `❌ Issue` / `⚠️ Needs confirmation` / `🛠️ Fixed` / `➖ N/A` / `🚧 Not checked`）。本清单不是穷举，不因某条缺失即视为通过；结合目标项目 `AGENTS.md`、仓库惯例与工程判断。

**判断优先**：以下均为提示性启发，不是硬规则。项目特定阈值（如监控路径、移动端基线、依赖体积、小程序/平台约束）以目标项目 `AGENTS.md` 或规范为准。

**Stance**：`[must]` 合并前必须处理｜`[recommend]` 强烈建议｜`[non-blocking]` 不阻塞。P1/P2 通常为 `[must]`。

---

## 1. General Review Baseline

- 实现与已确认的设计一致；刻意偏离时说明差异及可接受理由
- 可回滚，不破坏用户、已保存数据、已打开 tab、旧版移动端或平台客户端
- MR 聚焦既定目的，不夹带无关清理、调试代码或大范围重构

## 2. Modeling, Reuse And Tech Stack

- 组件 / hook / service / store / 工具 / 样式模块职责边界清晰
- 合理复用现有组件 / helper / 样式 / token / 库 / 框架模式
- 重复逻辑已避免或说明理由
- 避免 magic number、硬编码字面量、产品名、平台类型、账号 id、环境假设，除非需求明确限定范围
- 样式变更从目标 DOM 与就近样式入口出发，比较既有 className / selector / mixin / token 后再决定复用还是新增；新 selector 职责清晰；颜色/排版/间距遵循变量或 token 约定，不复制字面量

## 3. Backend And Third-Party Failure Handling

- 后端失败有 fallback UI 与手动重试路径（重试有意义时）
- 用户可见错误信息引导下一步且不暴露内部细节
- 异常未被静默吞掉；意外前端错误经项目监控路径上报，不泄漏敏感数据
- console 日志仅用于合适的调试，不替代监控或用户反馈
- 第三方交互有 timeout / retry / fallback UI / 手动重试
- 涉及状态迁移的 retry 幂等，且必有终止条件

## 4. Performance, IO And Complexity

- 避免昂贵 UI 的不必要重渲染
- 避免冻结主线程的未优化数据处理
- 避免无理由在主线程序列化/反序列化大 JSON
- 无明确批准时避免重复网络请求
- 高时间/内存复杂度按项目阈值提示标记

## 5. Compatibility And Existing Data

- 保存/更新不改变或删除既有 key/property，除非兼容方案已覆盖
- 旧数据形态被安全处理
- 已打开 tab、旧版移动端客户端不被新客户端假设破坏
- 客户端默认值不掩盖应由后端显式修复的兼容问题

## 6. Mobile And Responsive Behavior

- 除非需求明确排除，按项目移动端基线验证
- 内容溢出、文字截断、不可点击、布局错乱
- 小屏上的 modal / drawer / 表单 / 表格 / 菜单
- 移动端 loading / empty / error 状态；表单键盘与视口行为

## 7. RTL And Directionality

- 除管理/支持页外，默认将 RTL 作为兼容面（除非范围明确排除）
- 优先逻辑 CSS 属性（inline-start/end）而非物理 left/right
- 布局顺序、定位、overlay、滚动、过渡、方向性图标在 LTR/RTL 均正确
- 混排文本、数字、email、URL、截断与对齐可读
- portal 与第三方组件收到正确的 `dir` 上下文
- 物理方向规则或 `[dir='rtl']` override 有理由、有作用域、已测试，且不产生两份漂移实现

## 8. Security And Privacy

- 敏感数据（密码、支付、卡号、证件号、token、密钥）不出现在 URL
- 敏感数据不无理由写入 console / 监控 / 分析 / 浏览器存储
- 用户可控内容渲染不引入 XSS
- 未削弱 CORS / CSRF / CSP
- 前端授权假设有后端校验支撑（数据访问相关时）

## 9. Async And React Concurrency

- 不在 `setState` 后立即读 React state 当作已更新
- 不依赖尚未加载完成的异步脚本
- effect / callback / promise / timer / subscription 正确清理
- 异步响应不能覆盖更新的用户操作或更新的数据
- 请求取消、stale response guard 或序号校验在需要时使用
- **异步 / 定时器 / 状态机 / 事件监听 / 滚动动画类变更**：按 `references/review-contracts.md` 的 C1–C8 契约逐条核对（收尾不变式、句柄归属与清理、出口穷举、监听注册语义、时序推演、增量不孤立既有资源）；P1/P2 断言须附复现证据（C7）

## 10. Readability, Language And Framework Conventions

- 非常规代码有简明注释；调试代码与无结构调试日志已移除
- 日志级别合适且不含敏感数据
- 命名符合本仓库惯例且清晰
- 遵循仓库 ESLint 规则
- 数据转换用清晰集合操作（map / reduce）；React 代码无直接 DOM 操作（除非有明确集成理由）

## 11. i18n And Formatting（渲染本地化内容时）

- 变更文案含占位符时，动态值用插值而非可执行/动态 i18n 字符串
- 每个用户可见占位符有来源证据（raw source / canonical display producer / localization stage / 需匹配的 UI）
- 注入的领域标签复用规范显示源，而非复制的英文字面量 map（除非记录了不变的品牌/标识例外）
- 要求两个可见面一致时，比较最终 locale 渲染值，且覆盖至少一个受影响的非英文 locale
- 日期时间使用产品期望的时区/locale；货币格式正确；零小数货币（JPY、TWD 等）正确处理

## 12. Third-Party Libraries

- 依赖版本按仓库惯例锁定
- license 可接受（优先 MIT / Apache）
- 不重复现有库功能（除非说明理由）
- 增加库的体积按项目阈值检查，运营/安全/维护风险对功能价值可接受
