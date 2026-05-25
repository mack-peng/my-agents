# Atlassian CLI (ACLI) Agent Guide

## 概述

Atlassian CLI (`acli`) 是一个命令行工具，用于通过终端与 Atlassian 产品（如 Jira）交互。支持 macOS、Windows、Linux。

## 安装

### macOS

**Homebrew:**
```bash
brew tap atlassian/homebrew-acli
brew install acli
acli --version
```

**curl 安装 (Intel):**
```bash
curl -LO "https://acli.atlassian.com/darwin/latest/acli_darwin_amd64/acli"
chmod +x ./acli
sudo mv ./acli /usr/local/bin/acli
sudo chown root: /usr/local/bin/acli
```

**curl 安装 (Apple Silicon):**
```bash
curl -LO "https://acli.atlassian.com/darwin/latest/acli_darwin_arm64/acli"
chmod +x ./acli
sudo mv ./acli /usr/local/bin/acli
sudo chown root: /usr/local/bin/acli
```

### Linux

**Debian/Ubuntu:**
```bash
sudo apt-get install -y wget gnupg2
sudo mkdir -p -m 755 /etc/apt/keyrings
wget -nv -O- https://acli.atlassian.com/gpg/public-key.asc | sudo gpg --dearmor -o /etc/apt/keyrings/acli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/acli-archive-keyring.gpg] https://acli.atlassian.com/linux/deb stable main" | sudo tee /etc/apt/sources.list.d/acli.list
sudo apt update && sudo apt install -y acli
```

**RHEL/CentOS/Fedora:**
```bash
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://acli.atlassian.com/linux/rpm/acli.repo
sudo yum install -y acli
```

**curl (x86-64):**
```bash
curl -LO "https://acli.atlassian.com/linux/latest/acli_linux_amd64/acli"
chmod +x ./acli
sudo install -o root -g root -m 0755 acli /usr/local/bin/acli
```

### Windows (PowerShell)

**x86-64:**
```powershell
Invoke-WebRequest -Uri https://acli.atlassian.com/windows/latest/acli_windows_amd64/acli.exe -OutFile acli.exe
```

## 升级

### macOS (Homebrew)
```bash
brew update && brew upgrade acli && acli --version
```

### Linux (Debian)
```bash
sudo apt update && sudo apt upgrade -y acli && acli --version
```

### Linux (RHEL)
```bash
sudo yum check-update && sudo yum update -y acli && acli --version
```

### Windows (curl)
```bash
curl -LO "https://acli.atlassian.com/windows/latest/acli_windows_amd64/acli.exe"
.\acli --version
```

## 认证

支持三种认证方式：

| 认证方式 | 适用命令 | 说明 |
|---------|---------|------|
| API token | `jira auth`, `confluence auth`, `rovodev auth` | 邮箱 + API token |
| API key | `admin auth` | 组织管理员 API key |
| OAuth | `jira auth`, `confluence auth` | 浏览器 OAuth 流程 |

### API Token 认证 (Jira)
```bash
echo <token> | acli jira auth login --site "mysite.atlassian.net" --email "user@atlassian.com" --token
acli jira auth login --site "mysite.atlassian.net" --email "user@atlassian.com" --token < token.txt
```

### OAuth 认证
```bash
acli jira auth login --web
```

### 管理后台认证
```bash
acli admin auth login
```

## 命令结构

```
acli <COMMAND> [<SUBCOMMAND> ...] {MANDATORY FLAGS} [OPTIONAL FLAGS]
```

## 命令参考

### 顶层命令
| 命令 | 描述 |
|------|------|
| `acli` | Atlassian CLI 入口 |
| `acli admin` | 组织管理命令 |
| `acli confluence` | Confluence Cloud 命令 |
| `acli feedback` | 提交反馈或报告问题 |
| `acli jira` | Jira Cloud 命令 |
| `acli rovodev` | Rovo Dev AI 编码助手 (Beta) |

### admin auth — 管理认证
| 子命令 | 描述 |
|--------|------|
| `admin auth login` | 认证管理员任务 |
| `admin auth logout` | 退出登录 |
| `admin auth status` | 查看认证状态 |
| `admin auth switch` | 切换组织管理员账号 |

### admin user — 用户管理
| 子命令 | 描述 |
|--------|------|
| `admin user activate` | 激活用户 |
| `admin user deactivate` | 停用用户 |
| `admin user delete` | 删除托管账号 |
| `admin user cancel-delete` | 取消删除托管账号 |

### feedback — 反馈
```bash
acli feedback -s "Summary" -d "Details" -e "user@atlassian.com" [-a attachment]
```

### jira auth — Jira 认证
| 子命令 | 描述 |
|--------|------|
| `jira auth login` | 认证 Jira 账号 |
| `jira auth logout` | 退出 Jira |
| `jira auth status` | 查看 Jira 认证状态 |
| `jira auth switch` | 切换 Jira 账号 |

### jira board — 看板
| 子命令 | 描述 |
|--------|------|
| `jira board list-sprints` | 获取所有冲刺 |
| `jira board search` | 搜索看板 |

### jira dashboard — 仪表盘
| 子命令 | 描述 |
|--------|------|
| `jira dashboard search` | 搜索 Jira 仪表盘 |

### jira field — 自定义字段
| 子命令 | 描述 |
|--------|------|
| `jira field create` | 创建自定义字段 |
| `jira field delete` | 将字段移至回收站 |
| `jira field cancel-delete` | 从回收站恢复字段 |

### jira filter — 过滤器
| 子命令 | 描述 |
|--------|------|
| `jira filter add-favourite` | 添加过滤器为收藏 |
| `jira filter change-owner` | 更改过滤器所有者 |
| `jira filter list` | 列出我的/收藏的过滤器 |
| `jira filter search` | 搜索 Jira 过滤器 |

### jira project — 项目管理
| 子命令 | 描述 |
|--------|------|
| `jira project archive` | 归档项目 |
| `jira project create` | 创建项目 |
| `jira project delete` | 删除项目 |
| `jira project list` | 列出项目 |
| `jira project restore` | 恢复项目 |
| `jira project update` | 更新项目 |
| `jira project view` | 查看项目详情 |

### jira sprint — 冲刺管理
| 子命令 | 描述 |
|--------|------|
| `jira sprint list-workitems` | 列出冲刺中的工作项 |

### jira workitem — 工作项
| 子命令 | 描述 |
|--------|------|
| `jira workitem archive` | 归档工作项 |
| `jira workitem assign` | 分配工作项 |
| `jira workitem attachment delete` | 删除附件 |
| `jira workitem attachment list` | 列出附件 |
| `jira workitem clone` | 克隆工作项 |
| `jira workitem comment create` | 创建评论 |
| `jira workitem comment delete` | 删除评论 |
| `jira workitem comment list` | 列出评论 |
| `jira workitem comment update` | 更新评论 |
| `jira workitem comment visibility` | 获取评论可见性选项 |
| `jira workitem create` | 创建工作项 |
| `jira workitem create-bulk` | 批量创建工作项 |
| `jira workitem delete` | 删除工作项 |
| `jira workitem edit` | 编辑工作项 |
| `jira workitem link create` | 创建工作项链接 |
| `jira workitem link delete` | 删除工作项链接 |
| `jira workitem link type` | 查看链接类型 |
| `jira workitem link list` | 列出工作项链接 |
| `jira workitem search` | 搜索工作项 |
| `jira workitem transition` | 转换工作项状态 |
| `jira workitem unarchive` | 取消归档工作项 |
| `jira workitem view` | 查看工作项 |
| `jira workitem watcher remove` | 移除监视人 |

### confluence auth — Confluence 认证
| 子命令 | 描述 |
|--------|------|
| `confluence auth login` | 认证 Confluence 账号 |
| `confluence auth logout` | 退出 Confluence |
| `confluence auth status` | 查看 Confluence 认证状态 |
| `confluence auth switch` | 切换 Confluence 账号 |

#### 认证示例
```bash
# OAuth 浏览器登录
acli confluence auth login --web

# API Token 认证
echo <token> | acli confluence auth login --site "mysite.atlassian.net" --email "user@atlassian.com" --token
acli confluence auth login --site "mysite.atlassian.net" --email "user@atlassian.com" --token < token.txt
```

### confluence page — 页面管理
| 子命令 | 描述 |
|--------|------|
| `confluence page view` | 查看 Confluence 页面详情 |

#### page view 示例
```bash
acli confluence page view --id 123456789
acli confluence page view --id 123456789 --json
acli confluence page view --id 123456789 --body-format storage
acli confluence page view --id 123456789 --include-labels --include-likes --include-version
```

### confluence blog — 博客管理
| 子命令 | 描述 |
|--------|------|
| `confluence blog create` | 创建博客文章 |
| `confluence blog list` | 列出博客文章 |
| `confluence blog view` | 查看博客文章详情 |

#### blog create 示例
```bash
acli confluence blog create --space-id 12345 --title "Release Notes" --body "<p>Content</p>"
acli confluence blog create --space-id 12345 --title "Draft" --status draft --body "<p>Content</p>"
acli confluence blog create --space-id 12345 --title "Private" --private --body "<p>Content</p>"
acli confluence blog create --space-id 12345 --title "From file" --from-file ./blog_content.html
acli confluence blog create --from-json ./blog_payload.json
acli confluence blog create --generate-json
```

#### blog list 示例
```bash
acli confluence blog list --space-id 12345
acli confluence blog list --space-id 12345 --limit 10 --json
acli confluence blog list --space-id 12345 --title "Release Notes"
acli confluence blog list --space-id 12345 --body-format storage
```

#### blog view 示例
```bash
acli confluence blog view --id 98765
acli confluence blog view --id 98765 --body-format storage
acli confluence blog view --id 98765 --version 2
acli confluence blog view --id 98765 --draft
acli confluence blog view --id 98765 --json
```

### confluence space — 空间管理
| 子命令 | 描述 |
|--------|------|
| `confluence space archive` | 归档 Confluence 空间 |
| `confluence space create` | 创建 Confluence 空间 |
| `confluence space list` | 列出 Confluence 空间 |
| `confluence space restore` | 恢复已删除/归档的空间 |
| `confluence space update` | 更新空间信息 |
| `confluence space view` | 查看空间详情 |

#### space archive/restore 示例
```bash
acli confluence space archive --key SPACEKEY
acli confluence space restore --key SPACEKEY
```

#### space create 示例
```bash
acli confluence space create --key SPACEKEY --name "Space Name"
acli confluence space create --key SPACEKEY --name "Space Name" --description "Description"
acli confluence space create --key SPACEKEY --name "Space Name" --private
```

#### space list 示例
```bash
acli confluence space list
acli confluence space list --type personal
acli confluence space list --expand description,homepage
acli confluence space list --keys SPACEKEY1,SPACEKEY2
acli confluence space list --status archived
acli confluence space list --json
```

#### space update 示例
```bash
acli confluence space update --key SPACEKEY --name "New Name"
acli confluence space update --key SPACEKEY --description "Updated description"
```

#### space view 示例
```bash
acli confluence space view --id 123456
acli confluence space view --id 123456 --icon --labels
acli confluence space view --id 123456 --include-all
acli confluence space view --id 123456 --json
```

### rovodev — Rovo Dev AI 助手
| 子命令 | 描述 |
|--------|------|
| `rovodev auth login` | 认证 Rovo Dev |
| `rovodev auth logout` | 退出 Rovo Dev |
| `rovodev auth status` | 查看 Rovo Dev 状态 |

## 常用示例

### 创建工作项
```bash
acli jira workitem create --summary "New Task" --project "TEAM" --type "Task"
acli jira workitem create --from-file workitem.txt --project "PROJ" --type "Bug" --assignee "user@atlassian.com"
acli jira workitem create --generate-json
acli jira workitem create --from-json workitem.json
```

### 编辑工作项
```bash
acli jira workitem edit --key "KEY-1,KEY-2" --summary "New Summary"
acli jira workitem edit --jql "project = TEAM" --assignee "user@atlassian.com"
acli jira workitem edit --filter 10001 --description "Updated description" --yes
```

### 转换工作项状态
```bash
acli jira workitem transition --key "KEY-1,KEY-2" --status "Done"
acli jira workitem transition --jql "project = TEAM" --status "In Progress"
acli jira workitem transition --filter 10001 --status "To Do" --yes
```

### 用户管理
```bash
acli admin user activate --email john@example.com,anna@example.com
acli admin user activate --id abcd,123
acli admin user activate --from-file listofmails.txt
```

### 批量操作与输出
```bash
# 输出到文件
acli jira workitem search --jql "project = TEST" --limit 10 --csv > output.csv

# 管道过滤
acli jira workitem search --jql "project = ACLI" --limit 10 | grep "To Do"

# JSON 输出 + jq 提取
acli jira workitem view ACLI-100 --json | jq '.fields.summary'

# 命令链
acli jira workitem search --jql "project = TEST" --limit 10 && echo "Completed"
```

### CI/CD 安装脚本
```bash
#!/bin/bash
set -euo pipefail
curl -LO "https://acli.atlassian.com/linux/latest/acli_linux_amd64/acli"
chmod +x ./acli
# 认证
echo "$BOT_API_TOKEN" | ./acli jira auth login --email bot@atlassian.com --site hello.atlassian.com --token
```

## Shell 自动补全

### Zsh
```bash
# 当前会话
source <(acli completion zsh)
# 永久 (Linux)
acli completion zsh > "${fpath[1]}/_acli"
# 永久 (macOS)
acli completion zsh > $(brew --prefix)/share/zsh/site-functions/_acli
```

### Bash
```bash
# 当前会话
source <(acli completion bash)
# 永久 (Linux)
acli completion bash > /etc/bash_completion.d/acli
# 永久 (macOS)
acli completion bash > $(brew --prefix)/etc/bash_completion.d/acli
```

### Fish
```bash
acli completion fish | source
acli completion fish > ~/.config/fish/completions/acli.fish
```

### PowerShell
```powershell
acli completion powershell | Out-String | Invoke-Expression
```

## 故障排查

- `--ignore-errors` — 批量操作忽略单条失败
- `--json` — 输出 JSON 格式
- `--generate-input-json` — 生成输入 JSON 模板
- 后端错误会提供 trace ID，保存后联系 Atlassian 支持
- 使用 `acli help [path]` 获取帮助
- 使用 `acli feedback` 提交反馈

## 版本历史

| 版本 | 日期 | 主要变更 |
|------|------|---------|
| v1.3.15-stable | 2026-03-25 | OAuth 权限更新，需站点管理员重新授权 |
| v1.3.5-stable | 2025-10-29 | 新增 board list-sprints/search, field create/delete/cancel-delete, filter list/add-favourite, sprint list-workitems, workitem create-bulk/attachment-delete/comment-delete/comment-update/watcher-remove |
| v1.3.4-stable | 2025-09-19 | 新增 workitem link create/delete/type/list, comment list/visibility, attachment list |
| v1.3.0-stable | 2025-07-24 | Rovo Dev 独立更新, bug fixes |
| v1.2.1-stable | 2025-06-13 | 引入 Rovo Dev (Beta), admin auth login 新增 --email 必填 |
| v1.1.0 | 2025-05-27 | GA 发布, 新增 jira/auth/admin auth, admin user, jira dashboard/filter, project view |
| v1.0.3-beta | 2025-04-10 | 更新 auth login 示例 |
| v1.0.2-beta | 2025-04-08 | 修复 project view 错误 |
| v1.0.1-beta | 2025-04-07 | 新增 project view 命令 |
| v1.0.0-beta | 2025-04-01 | 初始版本 |

## 下载链接

| 平台 | 架构 | 链接 |
|------|------|------|
| macOS | arm64 | https://acli.atlassian.com/darwin/latest/acli_darwin_arm64.tar.gz |
| macOS | amd64 | https://acli.atlassian.com/darwin/latest/acli_darwin_amd64.tar.gz |
| Linux | arm64 | https://acli.atlassian.com/linux/latest/acli_linux_arm64.tar.gz |
| Linux | amd64 | https://acli.atlassian.com/linux/latest/acli_linux_amd64.tar.gz |
| Linux | arm64 (deb) | https://acli.atlassian.com/linux/latest/acli_linux_arm64.deb |
| Linux | amd64 (deb) | https://acli.atlassian.com/linux/latest/acli_linux_amd64.deb |
| Linux | arm64 (rpm) | https://acli.atlassian.com/linux/latest/acli_linux_arm64.rpm |
| Linux | amd64 (rpm) | https://acli.atlassian.com/linux/latest/acli_linux_amd64.rpm |
| Windows | amd64 | https://acli.atlassian.com/windows/latest/acli_windows_amd64/acli.exe |
| Windows | arm64 | https://acli.atlassian.com/windows/latest/acli_windows_arm64/acli.exe |
