# zendesk-agent

Zendesk 工单管理 agent — 基于 `zcli-ticket` CLI 封装，用于查看、搜索、创建和操作 Zendesk 工单、用户、组织、群组等资源。

## 安装

```bash
npm install -g zcli-ticket
nodenv rehash
```

要求 Node >= 18，CLI 安装后通过 `zcli-ticket` 命令调用。

## 认证配置

三种认证模式，推荐 API Token：

| 模式 | 配置项 | 说明 |
|------|--------|------|
| API Token | `token` | `{email}/token:{token}` base64（推荐） |
| Basic Auth | `password` | `{email}:{password}` base64 |
| OAuth | `oauth-token` | `Bearer {token}` |

```bash
zcli-ticket config-set subdomain <子域名>
zcli-ticket config-set email <邮箱>
zcli-ticket config-set token <API token>
zcli-ticket config-show    # 查看当前配置（token 掩码显示）
```

配置存储在 `~/.zendeskrc`，可通过 `--subdomain` / `--email` / `--token` 临时覆盖。

配置优先级：CLI flags > 环境变量 > 配置文件

| CLI 参数 | 环境变量 |
|----------|----------|
| `-s, --subdomain` | `ZENDESK_SUBDOMAIN` |
| `-e, --email` | `ZENDESK_EMAIL` |
| `--token` | `ZENDESK_TOKEN` |
| `--password` | `ZENDESK_PASSWORD` |
| `--oauth-token` | `ZENDESK_OAUTH_TOKEN` |

## 多 Profile 管理

支持连接多个 Zendesk 实例，每个 profile 独立存储认证信息。

```bash
# 创建 profile
zcli-ticket config-new <profile名>

# 为指定 profile 配置认证
zcli-ticket -p <profile名> config-set subdomain <子域名>
zcli-ticket -p <profile名> config-set email <邮箱>
zcli-ticket -p <profile名> config-set token <token>

# 持久切换默认 profile
zcli-ticket config-use <profile名>

# 临时使用指定 profile
zcli-ticket -p <profile名> <command>

# 查看所有 profile
zcli-ticket config-list

# 查看指定 profile 配置
zcli-ticket -p <profile名> config-show
```

## 输出模式

| 标志 | 输出 | 适用场景 |
|------|------|----------|
| 默认 | 人类可读表格 / 格式化 JSON | 终端查看 |
| `--json` | 机器可读 JSON | 脚本、管道、AI agent 消费 |
| `--raw` | 原始数据 | 其他工具直接消费 |

```bash
zcli-ticket ticket-list --status open          # 默认输出
zcli-ticket --json ticket-list --status open   # JSON 输出
zcli-ticket --json ticket-list | jq '.[].id'   # 管道 jq
```

## 命令参考

所有命令输出的 JSON 字段名遵循 Zendesk API 约定（snake_case），如 `created_at`、`assignee_id`。

### 工单 (Tickets)

```bash
zcli-ticket ticket-list                                    # 所有工单
zcli-ticket ticket-list --status open                      # 按状态过滤
zcli-ticket ticket-list --sort-by updated_at --sort-order desc
zcli-ticket ticket-list-recent                             # 最近更新的工单
zcli-ticket ticket-show <id>                               # 单个工单详情
zcli-ticket ticket-show-many <id1,id2,id3>                 # 批量查看
zcli-ticket ticket-thread <id>                             # 工单 + 全部评论
zcli-ticket ticket-create "<标题>" "<描述>"                 # 创建工单
zcli-ticket ticket-create "<标题>" "<描述>" --priority urgent --tags tag1,tag2
zcli-ticket ticket-create-many tickets.json                # 批量创建（JSON 文件）
zcli-ticket ticket-update <id> --status solved             # 更新工单
zcli-ticket ticket-update <id> --assignee-id <uid>         # 重新分配
zcli-ticket ticket-update <id> --comment "<内容>"           # 添加公开评论
zcli-ticket ticket-update <id> --private-comment "<内容>"   # 添加内部备注
zcli-ticket ticket-update-many <id1,id2,id3> --status closed  # 批量更新
zcli-ticket ticket-delete <id>                             # 删除工单
zcli-ticket ticket-delete-many <id1,id2,id3>               # 批量删除
zcli-ticket ticket-merge <id> --target-id <target_id>      # 合并工单
zcli-ticket ticket-related <id>                            # 关联信息
```

### 评论 (Comments)

```bash
zcli-ticket comment-list <ticket_id>
zcli-ticket comment-create <ticket_id> "<内容>"
zcli-ticket comment-create <ticket_id> "<内容>" --private
zcli-ticket comment-update --ticket-id <tid> --comment-id <cid> "<内容>"
zcli-ticket comment-redact --ticket-id <tid> --comment-id <cid> "<替换文本>"
zcli-ticket comment-delete --ticket-id <tid> --comment-id <cid>
```

### 用户 (Users)

```bash
zcli-ticket user-list                                      # 所有用户
zcli-ticket user-list --role agent                         # 按角色过滤
zcli-ticket user-me                                        # 当前用户
zcli-ticket user-show <id>                                 # 单个用户
zcli-ticket user-show-many <id1,id2,id3>                   # 批量查看
zcli-ticket user-create "<姓名>" "<邮箱>"                   # 创建用户
zcli-ticket user-create "<姓名>" "<邮箱>" --role agent --verified
zcli-ticket user-create-many users.json                    # 批量创建
zcli-ticket user-update <id> --name "<新名称>"             # 更新用户
zcli-ticket user-update <id> --role admin                  # 提升权限
zcli-ticket user-update-many <id1,id2,id3> --role agent    # 批量更新
zcli-ticket user-delete <id>                               # 删除用户
zcli-ticket user-delete-many <id1,id2,id3>                 # 批量删除
zcli-ticket user-merge --source-id <id> --target-id <id>   # 合并用户
zcli-ticket user-search --query "<关键词>"                  # 按名称搜索
zcli-ticket user-search --email "<邮箱>"                    # 按邮箱搜索
zcli-ticket user-search --external-id "<id>"               # 按外部 ID 搜索
zcli-ticket user-autocomplete "<关键词>"                    # 名称自动补全
zcli-ticket identity-list --user-id <id>                   # 用户身份列表
```

### 组织 (Organizations)

```bash
zcli-ticket org-list
zcli-ticket org-show <id>
zcli-ticket org-create "<名称>" --external-id "<id>" --tags "tag1,tag2"
zcli-ticket org-update <id> --name "<新名称>"
zcli-ticket org-delete <id>
zcli-ticket org-search --external-id "<id>"
zcli-ticket org-membership-list --org-id <id>
zcli-ticket org-membership-create --user-id <uid> --org-id <oid>
zcli-ticket org-membership-delete <id>
```

### 群组 (Groups)

```bash
zcli-ticket group-list
zcli-ticket group-show <id>
zcli-ticket group-create "<名称>"
zcli-ticket group-update <id> --name "<新名称>"
zcli-ticket group-delete <id>
zcli-ticket group-membership-list --group-id <id>
zcli-ticket group-membership-create --user-id <uid> --group-id <gid>
zcli-ticket group-membership-delete <id>
```

### 搜索 (Search)

```bash
zcli-ticket search "status:open"                           # 工单搜索
zcli-ticket search "type:user <关键词>"                     # 用户搜索
zcli-ticket search "type:organization <关键词>"             # 组织搜索
zcli-ticket search "status:open priority:urgent" --sort-by created_at --sort-order desc
```

### 视图 (Views)

```bash
zcli-ticket view-list
zcli-ticket view-show <id>
zcli-ticket view-execute <id>                              # 获取视图中的工单
zcli-ticket view-execute <id> --sort-by created_at
zcli-ticket view-count <id>                                # 工单数量
zcli-ticket view-count-many <id1,id2,id3>                  # 批量统计
```

### 附件 (Attachments)

```bash
zcli-ticket attachment-show <id>
zcli-ticket attachment-upload <文件路径>
zcli-ticket attachment-upload <文件路径> --filename "<自定义名称>"
zcli-ticket attachment-delete <id>
```

### 工单字段与表单

```bash
zcli-ticket ticket-field-list
zcli-ticket ticket-field-show <id>
zcli-ticket ticket-form-list
zcli-ticket ticket-form-show <id>
```

### 标签与宏

```bash
zcli-ticket tag-list
zcli-ticket macro-list
zcli-ticket macro-show <id>
zcli-ticket macro-apply --ticket-id <tid> --macro-id <mid>
```

### 挂起的工单 (Suspended Tickets)

```bash
zcli-ticket suspended-list
zcli-ticket suspended-recover <id>
zcli-ticket suspended-delete <id>
```

### 增量导出 (Incremental Exports)

```bash
zcli-ticket incremental-tickets <unix_timestamp>           # 指定时间戳之后的工单
zcli-ticket incremental-users <unix_timestamp>
zcli-ticket incremental-orgs <unix_timestamp>
```

## 常见操作模式

### 按状态查看工单

```bash
zcli-ticket ticket-list --status open
zcli-ticket ticket-list --status pending
zcli-ticket ticket-list --status solved
```

### 搜索工单

```bash
zcli-ticket search "status:open priority:urgent"
zcli-ticket search "type:ticket tags:printer"
zcli-ticket search "assignee:frontend@strikingly.com"
```

### 批量操作工单

```bash
zcli-ticket ticket-update-many 1,2,3 --status closed
zcli-ticket ticket-delete-many 4,5,6
```

### 查找用户

```bash
zcli-ticket user-search --query "John"
zcli-ticket user-search --email "john@example.com"
```

### 为工单添加评论

```bash
zcli-ticket ticket-update <id> --comment "已在处理"
zcli-ticket ticket-update <id> --private-comment "需要升级"
```

## Agent 边界

- **负责**：Zendesk 工单、用户、组织、群组、搜索、视图、附件等资源的 CRUD 操作
- **不负责**：Zendesk 管理后台配置、触发器/自动化/业务规则设置、报表导出

## 参考

- zcli-ticket 仓库：https://github.com/mack-peng/zcli-ticket
- Zendesk API 文档：https://developer.zendesk.com/api-reference/
