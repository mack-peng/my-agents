# glitchtip-agent

通过命令行管理 GlitchTip 错误追踪与监控平台的 OpenCode 代理。

本 agent 使用自研 `glitchtip-cli`（Node+TS+zod），覆盖 uptime 监控（monitors）、错误追踪（issues/events）、日志（logs）、发布（releases）、项目与 DSN key 管理等 8 个域 37 个命令。

## 前置检查

```bash
which glitchtip-cli || echo "未安装"
glitchtip-cli --version
glitchtip-cli config-show   # 检查配置与认证状态
```

## 安装

```bash
npm install -g glitchtip-cli
glitchtip-cli --version
```

> 需要 Node.js >= 18。

## 认证

API token 从 Web 端创建：Profile → Auth Tokens → Create New Token。

```bash
# 配置认证
glitchtip-cli config-set url <SERVER_URL>
glitchtip-cli config-set org <ORG_SLUG>
glitchtip-cli config-set token <API_TOKEN>

# 可选：设置默认项目
glitchtip-cli config-set project <PROJECT_SLUG>

# 验证
glitchtip-cli config-show
glitchtip-cli project-list
```

> 配置存储在 `~/.glitchtiprc`（JSON）。多实例支持：`glitchtip-cli config-new <profile>` → `glitchtip-cli -p <profile> config-set ...`
>
> 环境变量覆盖：`GLITCHTIP_URL`、`GLITCHTIP_ORG`、`GLITCHTIP_TOKEN`、`GLITCHTIP_PROJECT`。
>
> 优先级：CLI flags > 环境变量 > `~/.glitchtiprc` 配置文件。

## 实例信息

实例 URL、组织 slug、项目 slug 通过以下命令查询，**不要在文档中硬编码**：

```bash
glitchtip-cli config-show              # 当前配置（secrets masked）
glitchtip-cli project-list             # 项目 slug + id
glitchtip-cli key-list --project <SLUG>  # DSN key
```

## 命令参考

所有子命令共享全局 options：`-u/--url`、`-o/--org`、`--token`、`-p/--profile`、`--json`、`--raw`。不懂的命令用 `glitchtip-cli <cmd> --help` 查看。

### Uptime 监控

```bash
# 列出所有监控
glitchtip-cli monitor-list

# 查看单个监控详情（含最近 checks）
glitchtip-cli monitor-show <ID>

# 创建监控（支持关键字断言）
glitchtip-cli monitor-create "<name>" --url <被监控 URL> --type GET --expected-status 200 --expected-body '"ready":true' --project <SLUG>
# 可选：--type Ping|GET|POST|Heartbeat|TCP Port|SSL（默认 Ping）、--interval <秒>（默认 60）、--timeout <秒>（默认 20）

# 更新监控（合并当前值，只传要改的字段）
glitchtip-cli monitor-update <ID> --interval 300

# 删除监控
glitchtip-cli monitor-delete <ID>

# 查看检查历史
glitchtip-cli monitor-checks <ID>            # 全部检查
glitchtip-cli monitor-checks <ID> --changes  # 仅状态变更
```

> `--project` 传 slug，CLI 自动解析为数字 ID（后端 API 要求数字 ID）。
> `monitor-update` 会先 GET 当前值再合并，所以只需传想改的字段。

### Issues（错误追踪）

```bash
# 列出项目 issues
glitchtip-cli issue-list --project <SLUG>
glitchtip-cli issue-list --project <SLUG> --query "is:unresolved"
glitchtip-cli issue-list --project <SLUG> --sort -priority
glitchtip-cli issue-list --project <SLUG> --environment production --start 2026-08-01T00:00:00Z

# 查看单个 issue
glitchtip-cli issue-show <ID>

# 解决 / 静音 / 重新打开
glitchtip-cli issue-resolve <ID>
glitchtip-cli issue-mute <ID>
glitchtip-cli issue-unresolve <ID>

# 删除
glitchtip-cli issue-delete <ID>

# issue 事件列表
glitchtip-cli issue-events <ID>

# 趋势统计
glitchtip-cli issue-stats <ID1>,<ID2> --stats-period 24h
```

> issue 状态值：`resolved`、`unresolved`、`ignored`（mute = ignored）。

### Events（事件）

```bash
# 项目最新事件
glitchtip-cli event-list --project <SLUG>

# issue 的事件
glitchtip-cli issue-events <ID>
```

### Projects（项目）

```bash
glitchtip-cli project-list
```

### Keys / DSN

```bash
glitchtip-cli key-list --project <SLUG>
glitchtip-cli key-create --project <SLUG> --name "my-key"
```

### Logs（日志）

```bash
# 列出日志
glitchtip-cli log-list --level error --service api --query "connection refused"
glitchtip-cli log-list --level error,warning --start 2026-08-01T00:00:00Z --limit 50

# 日志资源（services, hosts 等）
glitchtip-cli log-resources

# 日志统计
glitchtip-cli log-stats

# 单条日志
glitchtip-cli log-show <LOG_ID>
```

> 日志 level：`sample`、`debug`、`info`、`warning`（不是 warn）、`error`、`fatal`。

### Releases & Deploys（发布与部署）

```bash
# 发布
glitchtip-cli release-list
glitchtip-cli release-list --project <SLUG>
glitchtip-cli release-create 1.0.0 --project <SLUG>
glitchtip-cli release-show 1.0.0
glitchtip-cli release-update 1.0.0 --ref abc123
glitchtip-cli release-delete 1.0.0

# 部署
glitchtip-cli deploy-list 1.0.0
glitchtip-cli deploy-create 1.0.0 --environment production --url <DEPLOY_URL>

# Commits
glitchtip-cli commit-list 1.0.0
glitchtip-cli commit-set 1.0.0 --ids abc123,def456
```

## 输出模式

| Flag | 用途 |
|------|------|
| （默认） | 人类可读表格（数组）/ 格式化 JSON（对象） |
| `--json` | 机器可读 JSON（脚本/AI agent 消费） |
| `--raw` | 跳过格式化 |

```bash
glitchtip-cli monitor-list                          # 表格
glitchtip-cli --json monitor-list                   # JSON
glitchtip-cli --json monitor-list | jq '.[].name'   # 管道
```

## Agent Skill 安装

```bash
# 安装到所有检测到的 agent
glitchtip-cli skill-install

# 安装到指定 agent
glitchtip-cli skill-install --target opencode
glitchtip-cli skill-install --target claude

# 安装到当前目录
glitchtip-cli skill-install --local

# 卸载
glitchtip-cli skill-uninstall
```

> Skill 安装到 `~/.agents/skills/glitchtip-cli/`（opencode/cursor）或 `~/.claude/skills/glitchtip-cli/`（claude）。

## 常见工作流

```bash
# 1. 查看所有监控状态
glitchtip-cli monitor-list

# 2. 查看某项目未解决 issue
glitchtip-cli issue-list --project <SLUG> --query "is:unresolved"

# 3. 排查错误：查日志
glitchtip-cli log-list --level error --limit 50

# 4. 新增一个带关键字断言的网站监控
glitchtip-cli monitor-create "my-site" --url https://example.com --type GET --expected-status 200 --expected-body '"ready":true' --project <SLUG>

# 5. 更新监控间隔
glitchtip-cli monitor-update <ID> --interval 300

# 6. 创建 release 并关联 commits
glitchtip-cli release-create 1.0.0 --project <SLUG>
glitchtip-cli commit-set 1.0.0 --ids sha1,sha2
```

## 安全原则

- 删除类操作（`monitor-delete`、`release-delete`）执行前向用户二次确认
- token 存 `~/.glitchtiprc`，不写入仓库目录文件
- 破坏性操作前先用 `list` 确认目标 ID 正确
- `--json` 模式下错误为 `{ isError: true, error: "..." }`，检查 `isError` 再解析
