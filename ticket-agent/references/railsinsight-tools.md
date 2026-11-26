# RailsInsight 工具手册（bobcat）

bobcat 的 **Rails 语义层**。补充 codegraph 看不到的 Rails 约定：associations、validations、callbacks、filters、strong params、routes、schema、jobs、mailers、测试约定与改动影响面。

**只用于 bobcat 后端/全栈工单。** 纯前端、样式、component-kit-only 工单不启用。

## MCP 信息

- Server 名：`railsinsight_bobcat`
- 工具名前缀：`railsinsight_bobcat_*`
- 模式：静态解析（`--no-introspection`），不启动 Rails、不连数据库
- 索引：启动时建立；bobcat 约 15,000 文件 / 9 秒
- 启动：OpenCode 首次连接约 10-20 秒；已配置 60s startup timeout
- 性质：实验性（7★），regex 提取；关键结论必须用 codegraph / Read 复核

不可用时（`opencode mcp list` 无 connected，或工具不存在）：

- fallback 到 codegraph + Read
- 在 Phase 2/3 输出中记录「RailsInsight 不可用」及原因，不阻塞流程

## 与 codegraph 的分工

| 问题 | 首选工具 |
|------|----------|
| 类/方法在哪、谁调用、符号影响面 | codegraph |
| model 的 associations / validations / callbacks / columns | `railsinsight_bobcat_get_model` |
| controller 的 actions / filters / strong params | `railsinsight_bobcat_get_controller` |
| 路由 → controller#action | `railsinsight_bobcat_get_routes` |
| 表 / 列 / 索引 / 外键 | `railsinsight_bobcat_get_schema` |
| 全局模式分布（before_action / has_many_through / turbo 等） | `railsinsight_bobcat_search_patterns` |
| 鉴权 / Job / 邮件 / 存储 / API 跨模块视图 | `railsinsight_bobcat_get_subgraph` / `get_deep_analysis` |
| 后端改动影响面 + 受影响测试 | `railsinsight_bobcat_get_blast_radius`；用 codegraph impact 交叉 |
| 测试写法 / 工厂 | `railsinsight_bobcat_get_test_conventions` / `get_factory_registry` |
| CSS / 布局 / 滚动 | cssgraph / cssprobe（不用 RailsInsight） |

## 常用工具

> 下表工具名省略前缀 `railsinsight_bobcat_`；实际调用时需带前缀（如 `railsinsight_bobcat_get_overview`）。

| 工具 | 参数 | 用途 | 实测输出 | 注意 |
|------|------|------|----------|------|
| `get_overview` | 无 | Rails/Ruby 版本、DB、鉴权、关键 model/controller、测试框架 | 1.7KB | bobcat 后端工单第一个调用 |
| `get_model` | `name` | associations、validations、scopes、enums、callbacks、columns | User 38.8KB；小 model 更小 | 改 model 前必查；大 model 只摘关键字段 |
| `get_controller` | `name` | actions、filters、strong params、rescue | 0.5-4.3KB | 改 controller 前必查；继承 filter 需沿父 controller 链核对 |
| `get_routes` | 无 | 完整路由表（namespace / member / collection） | 254KB | 仅在路由问题调用；必须摘要，禁止整段入上下文 |
| `get_schema` | 无 | 表、列、索引、外键、model→table | 很大 | 优先 `get_model` 查单表；只摘相关表 |
| `get_subgraph` | `skill` | authentication / database / frontend / api / jobs / email | 5.1KB | 跨模块问题 |
| `search_patterns` | `pattern` | before_action、has_many_through、turbo_broadcast 等 | 中 | 查全局用法 |
| `get_deep_analysis` | `category`、`depth`、`name` | authorization、jobs、email、storage、caching、realtime、api_patterns 等 | 中 | category 取值见 describe |
| `get_blast_radius` | `files`、`staged`、`base_ref`、`max_depth` | 影响实体（CRITICAL/HIGH/MEDIUM/LOW）+ 受影响测试 | User depth=2 215KB | 用 `max_depth=1`；大范围优先 `get_review_context` |
| `get_review_context` | `files`、`base_ref`、`risk_filter`、`token_budget` | 按 token 预算给受影响 model/controller 结构摘要 | User 5.4KB（token_budget=2000） | 大范围影响面首选 |
| `get_test_conventions` | 无 | spec 风格、let 风格、auth helper、factories、shared examples | 2.6KB | 写测试前 |
| `get_factory_registry` | `model` | 某 model 的 factory、traits、sequences、associations | 0.3KB | 写 spec 前 |
| `index_project` | `force` | 重新索引 | — | 改代码后刷新；约 9 秒 |

**禁用**：`get_full_index`（默认 12k token，容易挤爆上下文）。除非用户明确要求，否则不调用。

## 上下文预算（实测）

bobcat 的 `User` 是超大 model，工具输出不可默认全量入上下文：

| 调用 | 实测 | 建议 |
|------|------|------|
| `get_overview` | 1.7KB | 每次后端工单都用 |
| `get_model User` | 38.8KB | 只摘 associations/callbacks/相关 columns；不粘贴全文 |
| `get_controller` | 4.3KB | 可直接用 |
| `get_routes` | 254KB | 仅在路由问题使用，摘要后丢弃原文 |
| `get_blast_radius User depth=2` | 215KB | 用 `max_depth=1`，或改用 `get_review_context(token_budget=2000)`（5.4KB） |
| `get_test_conventions` | 2.6KB | 写测试前用 |
| `get_factory_registry` | 0.3KB | 写 spec 前用 |
| `get_subgraph authentication` | 5.1KB | 跨模块问题用 |

原则：**先小后大**——`get_overview` → `get_model`/`get_controller` → 必要时 `get_review_context`；输出超过约 10KB 时改用 codegraph / Read 做定点查询。

## bobcat 配方

### 改 model

1. `get_model <Model>` — 确认 associations、validations、callbacks、concerns、columns（大 model 只摘关键字段）
2. `get_review_context { "files": ["app/models/<model>.rb"], "token_budget": 2000 }` — 受控的影响面摘要；需要完整风险分级/受影响测试时再 `get_blast_radius`（`max_depth=1`）
3. `codegraph_impact` / `codegraph_callers` — 交叉符号级影响
4. Read 目标文件 — 以源码为准
5. 改完后 `index_project`，再复查 `get_review_context`

### 改 controller / filter

1. `get_controller <Controller>` — actions、filters、strong params、rescue；继承 filter 需查父 controller
2. filters 为空时，用 `get_controller` 查父 controller（如 `Admin::ApplicationController`）
3. `get_routes` — 确认路由与 namespace（输出 254KB，仅路由问题使用，摘要后丢弃原文）
4. `search_patterns`（如 `before_action`）— 查同类 controller 的写法
5. `codegraph_explore` — 展开具体方法/调用链

### 查 schema / 列

1. `get_model <Model>` — 该 model 的 columns（优先，输出小）
2. `get_schema` — 需要索引/外键/全表关系时；只摘要相关表，不粘贴全文
3. `codegraph` 查 migration 或 schema 使用点

### 查回调 / 后台任务 / 邮件

1. `search_patterns`（`before_action`、`after_commit`、`has_many_through` 等）
2. `get_subgraph { "skill": "jobs" | "email" | "authentication" | "api" }`
3. `get_deep_analysis { "category": "jobs" | "email" | "authorization" | ... }`
4. `codegraph_callers` 追踪具体方法

### 写测试

1. `get_test_conventions`
2. `get_factory_registry { "model": "<Model>" }`
3. `get_well_tested_examples`（按需）
4. Read 同类 spec 作为风格参考

### BugSnag 堆栈定位

- 堆栈帧是 model → `get_model <Class>`
- 堆栈帧是 controller → `get_controller <Controller>`
- 帧涉及路由/URL → `get_routes`
- 仍以 codegraph 定位文件/行为准；RailsInsight 只补 Rails 结构

## 反模式

- ❌ 用 `get_full_index` 代替针对性查询
- ❌ 把 RailsInsight 的 regex 结果当最终事实；元编程/动态生成的方法可能漏
- ❌ 改完代码不刷新索引就复查影响面
- ❌ 在纯前端 / component-kit 工单上使用
- ❌ 把原始 JSON 整段写进飞书文档；只摘关键事实与工具名
- ❌ 用 RailsInsight 替代 cssgraph/cssprobe 做样式取证

## Phase 2 输出片段（示例）

```md
### Rails 结构事实
- `railsinsight_bobcat_get_overview`：Rails 4.2.11.1 / Ruby 2.7.5 / Devise / Sidekiq / RSpec
- `railsinsight_bobcat_get_model User`：`has_many :sites, dependent: :destroy`；15 个 concerns
- `railsinsight_bobcat_get_controller Admin::UsersController`：21 个 actions；filters 为空（继续查 `Admin::ApplicationController` 链）
- `railsinsight_bobcat_get_review_context app/models/user.rb`：1184 个受影响实体（CRITICAL 1 / HIGH 156 / MEDIUM 643 / LOW 384）
- 交叉验证：codegraph `User` 影响 538 个符号；closest root cause 位于 `app/models/user.rb:332`
```
