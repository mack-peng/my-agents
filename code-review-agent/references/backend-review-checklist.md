# 后端评审检查清单（Backend Review Checklist）

**来源**：移植自 `agent-rnd-skills` 的 `strk-code-guidelines/BACKEND_REVIEW_GUIDELINE.md`（去项目专有化）。项目特化清单见工作区模板 `../references/bobcat-mr-bugfix-be-template.md` 与 `../references/bobcat-mr-final-review-be-template.md`。

**怎么用**：`workflows/review-phases.md` Phase 3 加载本清单，逐条标记状态（`✅ Passed` / `❌ Issue` / `⚠️ Needs confirmation` / `🛠️ Fixed` / `➖ N/A` / `🚧 Not checked`）。本清单不是穷举，不因某条缺失即视为通过；结合目标项目 `AGENTS.md`、仓库惯例与工程判断。

**判断优先**：以下均为提示性启发，不是硬规则。当偏离是更优解时，在 issue/card 里简短记录上下文理由。项目特定阈值（如监控路径、性能/IO 阈值、依赖体积）以目标项目 `AGENTS.md` 或规范为准。

**Stance**：`[must]` 合并前必须处理｜`[recommend]` 强烈建议｜`[non-blocking]` 不阻塞。P1/P2 通常为 `[must]`。

---

## 1. General Review Baseline

- 实现与已确认的设计一致；如刻意偏离，MR 或报告说明差异及可接受理由
- 可回滚，且回滚不破坏用户、数据、已打开客户端或外部集成
- MR 聚焦既定目的，不夹带无关清理、调试代码或大范围重构
- commit 结构 / message 便于评审与日后追溯

## 2. Modeling And Reuse

- module / service / model / job / controller 职责边界清晰，不泄漏无关职责
- 合理复用现有 helper / service / library / 框架模式；重复逻辑已避免或说明理由
- 避免 magic number、硬编码字面量、产品名、账号 id、环境假设，除非需求明确限定范围

## 3. Error Handling And Third-Party Robustness

- 异常未被静默吞掉；未知/意外错误经项目约定的监控路径上报，且不泄漏敏感数据
- 前端行为依赖 API 错误时，返回稳定的错误码/类型
- 第三方交互有合适的 timeout、retry、fallback
- 涉及状态迁移的 retry 幂等，且必有终止条件
- 只读第三方数据缓存策略与项目规范一致

## 4. IO, Complexity And Scale

- 避免不必要的磁盘 / 网络 / API / 数据库读取
- 需要子集时避免宽泛拉取或大批量拉取
- 无实时要求时避免突发写入；只需最新状态时避免重复写入
- 高时间/内存复杂度如无明确理由需标记（阈值见目标项目规范）

## 5. Compatibility And Existing Data

- 部署后旧数据可安全读取；旧格式能按需转换
- 无法转换时存在 grandfathering 逻辑
- 已打开浏览器 tab 或旧版客户端不被破坏
- 未在无兼容方案下移除或语义修改既有 key/property

## 6. Security And Privacy

- 外部输入不拼接进 SQL；SQL 输入已清洗/参数化
- 敏感数据（密码、支付、卡号、证件号、token、密钥）不直接存储或记录日志
- 授权校验防止一个用户/租户访问另一个用户的数据
- 未削弱 CORS / XSS / CSRF / CSP
- 日志、监控事件、错误响应不暴露敏感数据

## 7. Database Migrations

- 新增 migration，不修改既有 migration 文件
- `where` 用到的列有索引；组合条件用组合索引
- 对既有数据加索引时按仓库/数据库要求用 concurrent 模式
- 加唯一约束前检查重复数据；加非空约束前检查 null/空数据
- 一次性数据转换逻辑不放进 DB migration 文件（除非明确批准并 sign-off）

## 8. Database Queries

- 未引入 N+1
- `where` 中不调用数据转换（除非明确批准并 sign-off）
- 大批量插入按批量写阈值处理
- 单查询 join 表数按项目 join 阈值控制
- 查询变更与可用索引、生产基数匹配

## 9. One-Off Data Migration / Transformation

- 逻辑放在独立脚本或明确文档化的控制台流程，不放在请求路径代码里
- 设计或发布清单明确何时运行
- 新增/填充数据应在部署前运行（新代码依赖时）；删除/破坏性转换只在兼容与回滚影响明确时运行

## 10. Concurrency And Transactions

- 主请求线程不需要响应时，不同步调用内部/第三方服务
- 异步操作（job、callback、worker）在顺序重要时有确定性协调
- 必须原子性的操作包在事务里
- 事务内把 DML 放在第三方 / Redis 操作之后，降低部分回滚风险
- 非事务副作用有补偿或重试
- 通过稳定锁顺序、短事务降低死锁风险
- Redis、第三方等非 DB 共享资源的竞态已显式处理
- **异步 / 定时器 / 状态机 / 事件订阅 / 后台任务变更**：按 `references/review-contracts.md` 的 C1–C8 契约逐条核对（收尾不变式、句柄归属与清理、出口穷举、时序推演、增量不孤立既有资源）；P1/P2 断言须附复现证据（C7）

## 11. Readability And Framework Conventions

- 非常规代码有简明注释；调试代码/无结构调试日志已移除
- 日志级别合适且不含敏感数据
- 命名符合仓库语言/框架惯例，无歧义
- 遵循仓库 lint / 框架约定

## 12. i18n And Formatting（涉及本地化内容时）

- 变更文案含占位符时，动态值用插值而非可执行/动态 i18n 字符串
- 每个用户可见占位符有来源证据（raw source / canonical display producer / localization stage / 需匹配的 UI）
- 注入的领域标签复用规范显示源，而非复制的英文字面量 map（除非记录了不变的品牌/标识例外）
- 日期时间使用产品期望的时区/locale；货币格式正确；零小数货币（JPY、TWD 等）正确处理
- 覆盖至少一个受影响的非英文 locale

## 13. Third-Party Libraries

- 依赖版本按仓库惯例锁定
- license 可接受（仓库政策要求时优先 MIT / Apache）
- 不重复现有库功能（除非说明理由）
- 运营/安全/维护风险对功能价值可接受
