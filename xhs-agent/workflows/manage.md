# ⑥ Agent 托管小工具（redapp-cli）

进入条件：产物 zip 已备好（usually workflow ① 产出），要「上传 / 预览 / 送审 / 查审核状态 / 改名改简介」。**每次动作必须用户显式触发**，查与写是一条硬边界。

**redapp-cli 是本 agent 管辖的 skill**（`.agents/skills/redapp-cli/`），不是独立 CLI 工作台；执行前先按其 SKILL.md 的约束核对，本文只写工作台视角的串流与 Hard Stop。

## Step 0 渐进式环境启动（第一次用才走）

1. 实时预检：
   ```bash
   node --version
   which redapp-cli || which redapp
   ls ~/.skillhub-upload/ 2>/dev/null
   ```
2. `redapp` 缺失 → 按用户指令第 6 条「渐进引导」：

> 本次需要用到 redapp-cli（小红书小工具官方 CLI）。它会通过 `npm install --global redskillhub-upload` 装到**当前进程可写 npm prefix**（不污染全局 npm 配置）。需要 Node ≥ 18（发布命令），dev 需要 Node ≥ 20。
> 确认要装吗？（装 / 不装）

用户说「装」→ 执行版本门禁并验证。说「不」→ 停在本步引导。

3. 版本门禁（**每次业务运行前必跑**，写进 skill 的 § 动态版本门禁）：

```bash
# 默认口令（正式版）
node ".agents/skills/redapp-cli/scripts/ensure-cli.mjs"
# Beta 测试口令
node ".agents/skills/redapp-cli/scripts/ensure-cli.mjs" --env beta --npm-policy beta-first
```

`CLI_VERSION_JSON.status ∈ {current, installed, updated}` 才继续；记录 version / tag / env。status=error → 停止并报错，**不换本地源码兜底**。

4. 命令参数约定：
   - 每条业务命令显式带 `--agent`
   - Beta 每条带 `--env beta`，默认口令不附加
   - `--source thirdAgent` 是**已登记的三方来源**（来源值随平台登记而变，若报错「未登记的三方来源: web」请以 config 回执为准）
   - **npm prefix/cache 写到用户可写路径**（只对当前进程生效），比如 `npm_config_prefix=$(mktemp -d) PATH="...:{...}"`，不永久改 npm 配置

## Step 1 登录（需要接口访问时）

```bash
redapp login <ENV_ARGS> --agent
```

- 产出 `PROMPT:<json>` → 展示二维码或授权链接给用户（Agent 内部读本地图片能力；否则给绝对路径 + `authorizeH5Url`）
- 保持同一 CLI 进程等结果，**不重复起登录**；完成出现 `RESULT_JSON:<json>` 即成功
- Token 存 `~/.skillhub-upload/`（beta 在 `~/.skillhub-upload/beta/`）；自动续期，无需反复.login
- `whoami` 只代表本地登录态，不证明接口权限；需要先 `config` 验证
- token 存储位置、Session 目录均不入库（见本文档 Hard Stop）

## Step 2 上传（素材预检）

所有写操作**先 dry-run → 核对 planHash → 再 confirm**；dry-run 输出 `plan` 要回给用户一句话确认关键信息。

```bash
redapp upload --file "<FILE>" --type pkg <ENV_ARGS> --dry-run --agent
# 核对 plan.status=dry_run，planHash →
redapp upload --file "<FILE>" --type pkg <ENV_ARGS> --confirm "<PLAN_HASH>" --agent
```

- `upload` 不带 `--source`（与小工具三方来源不同参数）
- fileId / md5 从 `RESULT_JSON.data` 记录；ZIP 记 md5、图片记 fileId，临时不写库
- **素材在资产上传前必须自己验证**：
  - ZIP ≤10 MiB，解压合计 ≤30 MiB，根目录直接 index.html，路径安全
  - 图标 JPG/PNG ≤5 MiB 1:1；封面 JPG/PNG ≤10 MiB 3:4（宽*4 == 高*3）
  - CLI dry-run 不检查这些字段上限，dry-run 通过不等于素材合规

## Step 3 预览（送审前强制扫码）

```bash
redapp preview --source thirdAgent <ENV_ARGS> --file "./preview.json" --dry-run --agent --qr-out "./preview-qr.png"
```

- payload `pkgFileId / md5 / [appName / version / iconFileId]`
- 二维码无法内嵌展示 → 给绝对路径 + `previewUrl`
- 用户扫码后必须明确回复「预览通过，可以送审」（或类似）；仅「已扫码」**不算通过**
- 用户报 bug → 修 → 重新预览；不重复用旧 planHash

## Step 4 送审

```bash
redapp submit --source thirdAgent <ENV_ARGS> --file "./submit.json" --dry-run --agent
# 仅在 preview 已「预览通过」才 confirm →
redapp submit --source thirdAgent <ENV_ARGS> --file "./submit.json" --confirm "<PLAN_HASH>" --agent
```

- submit.json 必填：`appName`、`slogan`、`iconFileId`、`coverFileId`、`version`（三段整数）、`pkgFileId`、`md5`、`categories: [1 个 code]`、`authorizations: []`
- `appName` / `slogan` ≤14 字符（JS `.length`），**CLI 不查字数上限**，Agent 前置检查
- 回执 `RESULT_JSON.status=submitted` 才算发送成功（不是审核通过）；记录返回 appId
- 后续 `status / history` 查询：
  ```bash
  redapp status  --source thirdAgent <ENV_ARGS> --app-id "<APP_ID>" --agent
  redapp history --source thirdAgent <ENV_ARGS> --app-id "<APP_ID>" --agent
  ```
  status: 0 未发布 / 1 审核中 / 2 已发布 / 3 未通过 / 4 已下架；auditStatus 同理区分历史 vs 展示

## Step 5 修改基础信息（可选）

`redapp edit` 三项必填（appName / slogan / iconFileId 另两项跟现有值皆传），`coverFileId` 可选；CLI dry-run **不查这三项是否齐全**，Agent 前置核对。

## 会话管理

- 多步操作维护 `session.json`（放本 agent 的 `output/<task>/` 目录，**不落进打包产物 / 不进 output 主产物根**），存脱敏件（status / planHash / fileId / md5 / previewUrl）；不存 token / Cookie / 授权链接原文
- 用户说「继续」时先 `list / status` 对账，不重复上传 / 预览 / 送审
- `in_flight` / `unknown` 先查询对账；不能从日志缺失推断失败
- 任务结束后在交付里说明已完成阶段 / appId / 版本 / 记录路径

## 模拟器（本地 dev，不登成功也可以跑）

```bash
redapp dev --dir "./dist" <ENV_ARGS> --agent
```

- Node ≥ 20；首次自动装 `@skillbuilder/miniapp-simulator@0.2.0`
- SDK 缓存 `~/.skillhub-upload/simulator/`
- 本地调试≠送审前扫码预览，不能替代另一道（preview QR）步门禁
- 服务常驻，结束时明确 SIGTERM 该进程

## Hard Stop

- 登录 / 上传 / 预览 / 送审 / 编辑均由用户在本轮显式触发；不跨 workflow 串行
- Token / Cookie / 登录授权链接原文不入库、不进报告；`.skillhub-upload` 目录已在根 .gitignore 排除
- 材料字段上限 / 比例 / 名称简介 14 字 / 1:1 / 3:4 都是 Agent 前置检查，dry-run 不代劳
- send 审深度：**预览通过反馈缺失 → 不确认**；`RESULT_JSON.status≠submitted` 不宣称送审成功
- 所有 dry-run 未通过必须先修；`planHash` 一旦变化不得复用
- HTTP 200 ≠ 业务成功，以 `RESULT_JSON` 内业务 code 为准
- `submitted` 只代表接收送审，不等于审核通过 / 发布成功

## 修改记录

- 2026-11-06 初版：CLI 全量读 `.agents/skills/redapp-cli/{SKILL.md, references/*, scripts/ensure-cli.mjs}` 提取；尚未实测发命令，用户首次使用时按实际输出更新本页（特别是 source 默认值、错误码扩展、preview JSON 字段名）
