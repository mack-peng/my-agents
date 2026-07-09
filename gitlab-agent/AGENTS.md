# GitLab CLI (glab) 命令参考

## 概述

GLab 是一个开源 GitLab CLI 工具，将 GitLab 带到终端中。

### 主要功能
- 查看、管理和重试 CI/CD pipeline
- 创建 changelog
- 创建和管理 release
- 向 GitLab Duo Chat 提问 Git 相关问题
- 管理 GitLab Kubernetes agents

### 安装

```bash
brew install glab
```

安装说明见 [GLab README](https://gitlab.com/gitlab-org/cli#installation)

### 认证

```bash
# Interactive login
glab auth login

# Check auth status
glab auth status

# Logout
glab auth logout
```

> 提示：不懂的命令使用 `命令 + -h` 查看帮助

### 环境变量

| 变量 | 描述 |
|------|------|
| `BROWSER` | 打开链接时使用的浏览器 |
| `DEBUG` | 设为 true 输出更多日志信息 |
| `GITLAB_HOST` / `GL_HOST` | 自管理 GitLab 服务器的 URL，默认 https://gitlab.com |
| `GITLAB_TOKEN` | API 请求认证令牌 |
| `GLAB_CHECK_UPDATE` | 设为 true 强制检查更新 |
| `GLAB_DEBUG_HTTP` | 设为 true 输出 HTTP 传输信息 |
| `NO_PROMPT` | 设为 true 禁用提示 |
| `REMOTE_ALIAS` / `GIT_REMOTE_URL_VAR` | 包含 GitLab URL 的 git remote 变量 |

---

## 命令列表

### alias
创建、列出和删除命令别名。
```bash
glab alias set co "mr create"
glab alias list
glab alias delete co
```

### api
向 GitLab API 发起认证请求。
```bash
glab api <endpoint> [flags]
glab api projects/:fullpath/releases
glab api issues --paginate
glab api graphql -f query="query { currentUser { username } }"
```
常用选项：
- `-X, --method` - HTTP 方法（默认 GET）
- `-F, --field` - 添加参数
- `-H, --header` - 添加请求头
- `--paginate` - 获取所有页面
- `--output` - 输出格式：json, ndjson

### attestation
管理软件证明（实验性功能）。
```bash
glab attestation verify <project> <filename>
```

### auth
管理 glab 的认证。
```bash
glab auth login
glab auth logout
glab auth status
glab auth configure-docker
glab auth docker-helper
glab auth dpop-gen
```

### changelog
从项目提交历史生成 changelog。
```bash
glab changelog generate
```

### check-update
检查 glab 最新版本。
```bash
glab check-update
glab update
```

### ci
管理 GitLab CI/CD pipelines 和 jobs。
```bash
glab ci list                      # List pipelines
glab ci status                    # View pipeline status
glab ci view                      # View current pipeline
glab ci trace <job-id>            # Trace job logs
glab ci run                       # Run pipeline
glab ci cancel <id>               # Cancel pipeline
glab ci retry <job-id>            # Retry job
glab ci lint                      # Lint .gitlab-ci.yml
glab ci artifact <ref> <job>      # Download artifacts
glab ci trigger                  # Trigger pipeline
glab ci delete                   # Delete pipeline
glab ci get                       # Get pipeline
glab ci config                    # Show pipeline config
glab ci run-trig                  # Run trigger
```

### cluster
管理 GitLab Kubernetes Agents。
```bash
glab cluster agent <command>      # Manage agents
glab cluster graph                # Query K8s object graph
```

### completion
生成 shell 补全脚本。
```bash
glab completion -s bash      # Bash
glab completion -s zsh       # Zsh
glab completion -s fish      # Fish
glab completion -s powershell # PowerShell
```

### config
管理 glab 设置。
```bash
glab config get <key>
glab config set <key> <value>
glab config edit
```
可配置项：browser, check_update, display_hyperlinks, editor, glamour_style, host, token, visual

### deploy-key
管理部署密钥。
```bash
glab deploy-key list              # List deploy keys
glab deploy-key add <key-file>    # Add deploy key
glab deploy-key delete <id>       # Delete deploy key
glab deploy-key get <id>          # Get deploy key
```

### duo
使用 GitLab Duo。
```bash
glab duo cli prompt [flags]
```

### gpg-key
管理 GitLab 账户的 GPG 密钥。
```bash
glab gpg-key list                 # List GPG keys
glab gpg-key add <key-file>       # Add GPG key
glab gpg-key delete <id>          # Delete GPG key
glab gpg-key get <id>             # Get GPG key
```

### incident
管理 GitLab 事故。
```bash
glab incident list                # List incidents
glab incident view <id>           # View incident
glab incident close <id>          # Close incident
glab incident reopen <id>         # Reopen incident
glab incident note <id> -m "comment" # Add comment
glab incident subscribe <id>      # Subscribe
glab incident unsubscribe <id>    # Unsubscribe
```

### issue
管理 GitLab Issues。
```bash
glab issue list                   # List issues
glab issue create                 # Create issue
glab issue view <id>              # View issue
glab issue view --web <id>        # View issue in web
glab issue update <id>            # Update issue
glab issue close <id>             # Close issue
glab issue reopen <id>            # Reopen issue
glab issue delete <id>            # Delete issue
glab issue note <id> -m "comment" # Add comment
glab issue subscribe <id>         # Subscribe
glab issue unsubscribe <id>       # Unsubscribe
glab issue board                  # List issue board
```

### iteration
检索迭代信息。
```bash
glab iteration list               # List iterations
```

### job
管理 GitLab CI/CD jobs。
```bash
glab job artifact <ref> <job>     # Download job artifacts
```

### label
管理项目标签。
```bash
glab label list                   # List labels
glab label create                 # Create label
glab label edit                   # Edit label
glab label delete                 # Delete label
glab label get <id>               # Get label details
```

### milestone
管理组或项目里程碑。
```bash
glab milestone list               # List milestones
glab milestone create             # Create milestone
glab milestone edit               # Edit milestone
glab milestone delete             # Delete milestone
glab milestone get                # Get milestone
```

### mr
创建、查看和管理 Merge Requests。
```bash
glab mr list                      # List MRs
glab mr create                    # Create MR
glab mr create --fill --label bugfix  # Create MR with options
glab mr view <id>                 # View MR details
glab mr merge <id>                # Merge MR
glab mr approve <id>              # Approve MR
glab mr diff <id>                 # View MR changes
glab mr note <id> -m "comment"    # Add comment
glab mr close <id>                # Close MR
glab mr reopen <id>               # Reopen MR
glab mr checkout <id>             # Checkout MR branch
glab mr rebas <id>                # Rebase MR
glab mr subscribe <id>            # Subscribe MR
glab mr unsubscribe <id>          # Unsubscribe MR
glab mr revoke <id>               # Revoke approval
glab mr update <id>               # Update MR
glab mr delete <id>               # Delete MR
glab mr issues <id>               # List MR issues
glab mr todo <id>                 # List MR todos
```

### mcp
管理 MCP 服务器。
```bash
glab mcp list                     # List MCP servers
glab mcp add                      # Add MCP server
glab mcp remove                   # Remove MCP server
```

### opentofu
使用 OpenTofu 或 Terraform 集成。
```bash
glab opentofu init <state>        # Initialize
glab opentofu state <command>     # Manage state
```

### orbit
管理 GitLab Orbit。
```bash
glab orbit list
glab orbit remote <command>       # Remote Knowledge Graph
glab orbit local                  # Local Orbit CLI
```

### pipeline
Pipelines (ci 的别名)
```bash
glab pipeline list                # List pipelines
glab pipeline status              # Current pipeline status
glab pipeline run                 # Run pipeline
```

### release
管理 GitLab releases。
```bash
glab release list                 # List releases
glab release view <tag>           # View release
glab release create <tag>         # Create release
glab release download <tag>       # Download release assets
glab release upload <tag> <file>  # Upload assets
glab release delete <tag>         # Delete release
```

### repo
管理 GitLab 仓库和项目。
```bash
glab repo clone <repo>            # Clone repository
glab repo list                    # List repositories
glab repo view                    # View current repo
glab repo create                  # Create new repo
glab repo fork                    # Fork repository
glab repo delete                  # Delete repository
glab repo archive                 # Archive repository
glab repo contributors            # List contributors
glab repo members                 # Manage members
glab repo mirror                  # Mirror repository
glab repo publish                 # Publish repository
glab repo remote                  # Manage remotes
glab repo search                  # Search repos
glab repo transfer                # Transfer repository
glab repo update                  # Update repository
```

### runner
管理 GitLab CI/CD runners。
```bash
glab runner list                  # List runners
glab runner jobs <id>             # List runner jobs
glab runner assign <id>           # Assign to project
glab runner unassign <id>         # Unassign
glab runner delete <id>           # Delete runner
glab runner update <id>           # Update runner
glab runner managers <id>         # List managers
```

### runner-controller
管理 GitLab Runner Controller。
```bash
glab runner-controller list                # List controllers
glab runner-controller create              # Create controller
glab runner-controller get <id>            # Get controller
glab runner-controller update <id>         # Update controller
glab runner-controller delete <id>         # Delete controller
glab runner-controller scope <command>     # Manage scopes
glab runner-controller token <command>     # Manage tokens
```

### schedule
管理 GitLab CI/CD 调度。
```bash
glab schedule list                # List schedules
glab schedule create              # Create schedule
glab schedule update <id>         # Update schedule
glab schedule delete <id>         # Delete schedule
glab schedule run <id>            # Run schedule
```

### search
在 GitLab 项目中搜索代码和资源（Beta）。
```bash
glab search semantic              # Semantic code search
```

### securefile
管理项目的安全文件。存储最多 100 个文件用于 CI/CD pipelines，最大 5MB。
```bash
glab securefile list              # List secure files
glab securefile create <name> <file> # Create secure file
glab securefile get <id>          # Get secure file
glab securefile download <id>     # Download secure file
glab securefile remove <id>       # Remove secure file
```

### skills
管理 glab agent skills（实验性）。支持 GitLab Duo Agent Platform、Claude Code、Codex、 Gemini CLI 等。
```bash
glab skills list                  # List skills
glab skills install [name]        # Install skills
```

### snippet
创建、查看和管理代码片段。
```bash
glab snippet create --title "Title" --filename "main.go"
```

### ssh-key
管理 GitLab 账户的 SSH 密钥。
```bash
glab ssh-key list                 # List SSH keys
glab ssh-key add <key-file>       # Add SSH key
glab ssh-key delete <id>          # Delete SSH key
glab ssh-key get <id>             # Get SSH key
```

### stack
管理云组件栈。
```bash
glab stack list
glab stack create <name>          # Create stack
glab stack sync                   # Sync stack
glab stack save                   # Save progress
glab stack amend                  # Amend changes
glab stack next/prev              # Navigate stack
glab stack first/last             # Jump to start/end
glab stack reorder                # Reorder stack
glab stack switch <name>          # Switch stacks
```

### todo
管理待办事项列表。
```bash
glab todo list                    # List todos
glab todo done <id>               # Mark done
glab todo done --all              # Mark all done
```

### token
管理个人、项目或组令牌。
```bash
glab token list                   # List tokens
glab token create <name>          # Create token
glab token revoke <name|id>       # Revoke token
glab token rotate <name|id>       # Rotate token
```

### user
与 GitLab 用户账户交互。
```bash
glab user events                  # View user events
```

### variable
管理 GitLab 项目或组的变量。
```bash
glab variable list                # List variables
glab variable set <key> <value>   # Set variable
glab variable get <key>           # Get variable
glab variable update <key> <value> # Update variable
glab variable delete <key>        # Delete variable
glab variable export              # Export variables
```

### version
显示 glab 版本信息。
```bash
glab version                      # Show version
glab check-update                 # Check for updates
```

### work-items
管理工作项（实验性）。支持 epics、issues、tasks、incidents、test cases 等类型。
```bash
glab work-items list              # List work items
glab work-items create            # Create work item
glab work-items update <iid>      # Update work item
glab work-items delete <iid>      # Delete work item
```

---

## 常用标志

- `-R, --repo` - 选择仓库 (OWNER/REPO or GROUP/NAMESPACE/REPO)
- `-h, --help` - 显示帮助
- `--hostname` - 指定 GitLab 实例主机名
- `-g, --global` - 使用全局配置

---

## 配置

### 设置默认编辑器
```bash
glab config set editor vim
```

### 设置默认主机 (自托管 GitLab)
```bash
glab config set -g host gitlab.example.com
# glab config set -g host gitlab.example.com
```

### 禁用 TLS 验证 (用于自签名证书)
```bash
glab config set skip_tls_verify true --host gitlab.example.com
```

### 设置 CA 证书
```bash
glab config set ca_cert /path/to/ca.pem --host gitlab.example.com
```

### 默认项目

由于此 agent 工作在 git 仓库之外，需要使用 `-R` 指定项目：

```bash
-R group/project
```

---

## 常见使用示例

```bash
# 列出分配给你的 MRs (在非 git 目录下使用 -R)
glab mr list --assignee=@me -R group/project

# 列出 open 状态的问题
glab issue list --state=opened -R group/project

# 从分支创建 MR
glab mr create --fill --label bugfix -R group/project

# 查看 pipeline 状态
glab ci status -R group/project

# 关闭 MR
glab mr close 12345 -R group/project

# 查看 MR diff
glab mr diff 12345 -R group/project

# 克隆仓库
glab repo clone group/project

# 创建 release
glab release create v1.0.0
```

> **重要**: 对于自管理 GitLab（非 gitlab.com），`glab mr` / `glab api` 等命令推荐在仓库目录下执行。仓库目录下的 git remote 会自动解析 host，避免 `-R` 无法正确匹配非默认 host 的问题。如果必须在仓库外执行，使用 `glab api` 并显式指定 `--hostname`。

---

## 创建 MR

当用户要求创建 MR（提交MR/提MR/创建MR）时：

1. 确认目标仓库在本机的路径（如 `strikingly/Bobcat` → `/Users/mack/Projects/bobcat`）
2. 确认 source branch 和 target branch
3. 收集 MR 描述所需信息：Zendesk/Jira URL、Reviewer、Description、Reason、Solution、Scope of Impact
4. 按模板 `references/bobcat-mr-bugfix-fe-template.md` 填充内容

```bash
# 在仓库目录下执行
glab mr create --source-branch <branch> --target-branch develop --title "<title>"

# 补充 description（内容较多时写文件后用 API）
glab api projects/strikingly%2FBobcat/merge_requests/<iid> -X PUT -f description="$(cat /tmp/desc.md)"
```

BoBCat Bugfix-FE 模板：`references/bobcat-mr-bugfix-fe-template.md`

---

## 技巧

- 优先在仓库目录下执行 `glab` 命令，git remote 会自动解析 host，比 `-R` 更可靠
- 如果不在 git 仓库中，使用 `glab api` + `--hostname` 显式指定主机，而非依赖 `-R` 标志
- 使用 `glab config set -g host <hostname>` 设置默认主机
- 常用过滤器：`--assignee=@me`、`--author=@me`、`--state=opened/closed/merged`、`--per-page N`
