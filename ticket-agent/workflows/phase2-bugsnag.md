# Phase 2-BN: BugSnag 取证

BugSnag 来源工单的 Phase 2 子流程。目标是先建立**可追溯的证据链**，再进入代码调研；不允许只凭错误类名、Job 名或单次事件猜根因。

## 触发条件

仅当 Phase 2 步骤 2 判断为 BugSnag 来源工单时适用。满足任一即触发：

- 工单描述含 BugSnag 项目名 / Dashboard 链接 / error id / error class
- 工单由 BugSnag 自动归档
- 只给了错误类名、Job 名、ConsoleError，没有完整堆栈
- 需要确认错误影响面、变体、趋势、发布回归

**非 BugSnag 工单** → 跳过本流程，按 Phase 2 正常代码调研。

## 前置条件

- Phase 2 步骤 1（获取上下文）已完成
- 已读 `bugsnag-agent/AGENTS.md` 与 `bugsnag-agent/.agents/skills/bugsnag-cli/SKILL.md`（命令真值以 skill / CLI `--help` 为准）
- `bugsnag-cli` 可用、token 已配置；organization / project 上下文明确
- 产物目录：`mkdir -p tmp/bugsnag`
- 只读：禁止 `error-update` / `error-bulk-update`，除非用户明确要求 triage
- 不自动生成 bugsnag-agent 报告；取证结果写入 Phase 2 文档，用户明确要求归档时才走报告分支
- 报告中的用户邮箱 / IP 脱敏

## 流程

### 1. 错误身份与变体

从工单提取所有 error id / Dashboard URL / error class。先建「错误身份表」，不要直接进入代码：

```bash
bugsnag-cli --json error-show <errorId> --project <slug> > tmp/bugsnag/<errorId>-show.json
jq 'keys' tmp/bugsnag/<errorId>-show.json   # 字段以实际输出为准
jq -r '{id, error_class, message, grouping_reason, status, severity, first_seen, last_seen, events, users}' tmp/bugsnag/<errorId>-show.json
```

同 class 的其他错误用全量列表聚合，避免漏掉变体。窗口 / 状态按工单口径：工单是 resolved / regression 时去掉 `error.status=open`：

```bash
bugsnag-cli --json error-list --project <slug> --sort events \
  --filter "error.status=open" --per-page 100 --limit 1000 \
  > tmp/bugsnag/<slug>-open.json
jq -r 'group_by(.error_class)[] | {class: .[0].error_class, n: length, total_events: (map(.events) | add)}' \
  tmp/bugsnag/<slug>-open.json
```

输出必须包含：

- errorId / error_class / message / grouping_reason / status / severity
- first seen / last seen / events / users
- **变体表**：同 class 多 errorId 时逐个列出，注明差异（message、页面、浏览器、堆栈帧、release）。未拆变体不得下单一根因。

### 2. 完整堆栈（硬门禁）

代码调研前必须拉完整堆栈并落表。`error-latest-event` 不需要 `--project`，输出较大，必须先落盘再 jq：

```bash
bugsnag-cli --json error-latest-event <errorId> > tmp/bugsnag/<errorId>-latest.json
jq 'keys' tmp/bugsnag/<errorId>-latest.json   # 探结构，字段以实际输出为准
jq -r '.exceptions[]? | .errorClass as $c | .stacktrace[]? |
  [$c, .method, .file, (.lineNumber|tostring), (.inProject|tostring)] | @tsv' \
  tmp/bugsnag/<errorId>-latest.json
```

逐条核对：

- `in_project=true` 的帧 → 本地源码对应文件 + 行号；逐字符核对产线形态与本地是否一致
- `in_project=null` / 压缩 bundle → 记录 bundle / chunk + 行号 + 列号，转步骤 7 做偏移映射
- 堆栈 `file` 是页面 URL（内联脚本）→ 记录是文档相对行号；不要直接当源码行号
- 事件上下文 / breadcrumbs：记录缺失项；**缺失本身是发现**，写入 UNVERIFIABLE

**门禁：没有完整堆栈 → 停止。** 请用户提供事件详情、Dashboard 链接或可复现会话；不得开始代码调研，不得只凭错误类名推断根因。

### 3. 影响面与环境

```bash
bugsnag-cli --json error-events <errorId> --limit 5 --project <slug> \
  > tmp/bugsnag/<errorId>-events.json
bugsnag-cli --json error-pivots <errorId> --summary-size 5 --project <slug> \
  > tmp/bugsnag/<errorId>-pivots.json
```

记录：

- events / users、first seen / last seen
- 页面 URL 分布（付费页 / 编辑器 / 客户站点 / 特定模板）
- 浏览器 / OS / 设备 / release / 自定义字段分布
- breadcrumbs 与请求上下文（endpoint、状态码、前后台切换等）
- 多次事件的共性：同一页面、同一 release、同一错误阶段，还是分散
- 分清 `events` 与 `users`；事件数不能当作用户数或延迟指标

### 4. 趋势与变体相位

```bash
bugsnag-cli --json error-trend <errorId> --resolution 2h --project <slug> \
  > tmp/bugsnag/<errorId>-trend.json
```

定性：

- **spike**：短窗口突增，常见于发布 / 配置变更
- **chronic**：长期稳定，常见于存量缺陷或环境噪音
- **regression**：修复后重新出现，需对齐 release / commit
- 同 class 多 errorId：分别拉 trend，**相位同步 → 同因；相位不同步 → 独立抛错路径**

### 5. 发布基线

```bash
bugsnag-cli --json release-list --project <slug> --limit 10 > tmp/bugsnag/<slug>-releases.json
bugsnag-cli --json release-group-list --project <slug> --release-stage-name production --limit 10 \
  > tmp/bugsnag/<slug>-release-groups.json
```

核对：

- first seen 与部署 / commit / release 时间是否对齐
- `release.seen_in` 是否恒一：同一 release 持续报错 → 修复未生效或未部署
- `errors_introduced_count` 是否异常抬升
- 是否跨多个 release 持续存在（存量）还是单 release 新增（回归）
- **未核对 release 不得说「已修复」或「回归」**

### 6. 跨项目核对

堆栈指向 API、网络、服务端渲染或第三方 SDK 时：

- 核对服务端 BugSnag 项目的同窗口错误 / 异常
- 能实测的接口用 curl / 服务端日志核对状态码、耗时、错误体
- 明确责任归属：前端 / 服务端 / 第三方 / 未确认
- BugSnag **不提供**请求延迟指标：p95 / 超时率等 APM 数据必须标「外部依赖」，禁止用事件数冒充

### 7. 代码定位

以堆栈帧的类 / 方法 / 文件为关键词，按 Phase 2 的搜索约束使用 `codegraph_explore`（maxFiles=8），不要全量 grep：

- 压缩 bundle：用 chunk 文件名 + 行 / 列偏移反查源文件；核对产线 chunk 与工作区版本
- 内联脚本：用 `ticket-agent/scripts/web-inline-map.mjs` 把文档相对 `line:col` 映射到 inline block，校验列号是否越界
- 多实现并存：按技术栈演进 / git 信息 / 可达性确认「在用路径」
- **bobcat 后端帧**：帧中的类对应 model/controller 时，用 `railsinsight_bobcat_get_model` / `get_controller` 补 associations、filters、strong params；帧涉及路由/URL 时用 `get_routes`。RailsInsight 只补结构，文件/行为仍以 codegraph + Read 为准
- 定位不到、源码与产线不一致、事件时 HTML 不可得 → 标 UNVERIFIABLE，列阻塞，不得猜

### 8. 复现与验证

- 优先构造最小复现场景（特定页面、操作、网络条件、浏览器）
- 内联 / 压缩脚本问题用 `ticket-agent/scripts/web-repro.mjs` 捕获 `pageerror`、注入脚本与 DOM 快照
- 无法模拟的条件（iOS 真机切后台、特定 CDN 变体、登录态缺失）如实记录
- 复现结果只用于验证假设；复现成功要给触发条件和堆栈证据，不能只写「已复现」

### 9. 输出总结

```md
## Phase 2-BN: BugSnag 取证

### 错误身份
- project: <slug>
- errorId: <id>
- class / message / grouping_reason / status / severity: ...
- 同族变体：<errorId>（差异：...）

### 影响面
- first/last seen: ...
- events / users: ...
- 环境：浏览器 / OS / 设备 / release
- 页面 / 业务场景：...
- 趋势：spike / chronic / regression
- 发布基线：first_seen ↔ release / commit；release.seen_in 是否恒一

### 堆栈与代码定位
| errorId | 关键帧 | file:line | in_project | 本地核对 |
|---------|--------|-----------|------------|----------|
| ... | ... | ... | true/null | 一致 / 偏移 / 不一致 |

- 责任归属：前端 / 服务端 / 第三方 / 未确认
- RailsInsight 补充（bobcat 后端帧）：`get_model` / `get_controller` / `get_routes` 的关键结果；与 codegraph / Read 冲突时以源码为准

### 交叉核对
- 服务端 / 日志 / 接口实测：...
- 外部依赖：APM p95 / 超时率（BugSnag 不提供）

### 结论
- DEFINITE（CLI 事实或直接可验证）：...
- PROBABLE（强形态推断，一处数据即可验证）：...
- INDEFINITE（方向性判断）：...
- UNVERIFIABLE（当前上报缺失，写明阻塞）：...
- 根因候选：...
- 影响面：...
- 下一步取证 / 修复方向：...
```

结论分级沿用 bugsnag-agent 报告模板：`DEFINITE` / `PROBABLE` / `INDEFINITE` / `UNVERIFIABLE`。每个数字必须能追溯到一次 CLI 调用或 jq 聚合结果。

### 10. 等待 Sign-off

> **"Phase 2-BN 完成。BugSnag 取证是否充分？变体、堆栈、趋势与发布基线是否准确？请确认后继续。"**

Sign-off 后：

- **DEFINITE / PROBABLE** → 回到 Phase 2 步骤 4，用堆栈帧和取证结论做代码调研；Phase 2 Sign-off 时统一写入，不单独改阶段识别
- **INDEFINITE / UNVERIFIABLE** → 停止代码修改，列出下一份证据（真机、完整堆栈、事件 HTML、服务端日志等），不得猜根因
- **飞书模式**：由 Phase 2 统一追加 `## Phase 2-BN: BugSnag 取证` 到文档
- **Session 模式**：在对话中记录本节摘要，等待用户确认后回到 Phase 2

## 硬规则

- 未取得完整堆栈 → 不得开始代码调研
- 未拆分同族变体 → 不得下单一根因
- `in_project=null` / 压缩帧 / 第三方帧 → 不得直接断言第一方代码根因
- 未核对 release → 不得说「已修复」或「回归」
- 无法复现 / 无法定位 → 必须标 UNVERIFIABLE，并写明确切阻塞
- `--json` 输出先落 `tmp/bugsnag/` 再 jq 聚合；禁止整段原始 JSON 进入对话
- 只读；禁止 BugSnag 写操作（`error-update` / `error-bulk-update`）除非用户明确要求 triage
- 报告引用 user.email / IP 一律脱敏
- 不自动生成 / 归档 bugsnag-agent 报告

## 反模式

### ❌ 拉完 latest-event 就直接 grep 代码

堆栈只是入口，不是根因。必须完成变体拆分、影响面、趋势 / 发布基线，再进入代码定位。

### ❌ 把同 class 的多个 errorId 合并成一个根因

同一错误类可能是不同抛错路径（例如超时 + 无 message 变体）。分别拉 trend，相位同步才是同因。

### ❌ 用 events 数当延迟 / 超时率

BugSnag 事件数是错误发生次数，不是请求耗时。APM 指标缺失时标「外部依赖」，不要编造。

### ❌ 看到 PR 已合并就说「已修复」

必须核对 release / `release.seen_in` / 部署时间；合并 ≠ 部署，部署 ≠ 生效。

### ❌ 把 js-html 的 lineNumber 当源码行号

`js-html` 分组键是页面内联脚本的文档相对行号；需用 `web-inline-map.mjs` 映射，列号越界说明事件时 HTML 与当前抓取不一致。
