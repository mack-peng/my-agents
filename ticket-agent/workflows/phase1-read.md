# Phase 1: 阅读工单

## 输入

Zendesk 工单 URL 或工单 ID。
- URL 格式: `https://<subdomain>.zendesk.com/agent/tickets/<id>` → 提取数字 ID
- 直接提供数字 ID 亦可

Jira 工单 URL。
- URL 格式: `https://<site>.atlassian.net/browse/<KEY>` → 提取工单 KEY（如 `SI-863`）

## 流程

> Zendesk 来源走本节 1-4；Jira 来源走下方「Jira 来源」节；节 5-6（Sign-off、Sign-off 后动作）对两者通用。

### 1. 获取工单详情和对话内容

**Use zendesk-agent** → `zcli-ticket` 直接读取。一条命令同时获取工单元数据和所有评论：

```bash
zcli-ticket --json ticket-thread <id>
```

**工单元数据字段**：

| JSON 字段 | 含义 | 提取内容 |
|-----------|------|----------|
| `id` | 工单 ID | 编号 |
| `subject` / `raw_subject` | 标题 | 问题标题 |
| `status` | 状态 | open / pending / solved 等 |
| `requester_id` | 请求人 ID | 需结合 user-show 获取姓名 |
| `assignee_id` | 处理人 ID | 需结合 user-show 获取姓名 |
| `group_id` | 处理组 ID | 内部分类参考 |
| `tags` | 标签 | 标签列表 |
| `custom_fields` | 自定义字段 | 分类、类型等 |
| `created_at` / `updated_at` | 时间 | 创建/更新时间 |
| `priority` | 优先级 | urgent / high / normal / low |
| `type` | 类型 | problem / incident / question / task |
| `url` | API URL | 可拼接 Zendesk 页面链接 |

**评论内容提取**：输出中包含 `_comments` 数组（CLI 客户端注入，前缀 `_` 避免与 API 原生字段冲突），每条评论关键字段：

| 内容 | 来源 |
|------|------|
| 问题描述 | 第一条公开评论（`"public": true`） |
| 内部备注 | `"public": false` 的评论 |
| 复现步骤 | 内部备注或评论中的步骤描述 |
| Livesite URL | 评论中的链接 |
| 附件引用 | 评论中的 `attachments` 数组（`file_name`, `content_url`） |

### 2. 解析请求人 / 处理人信息

```bash
zcli-ticket --json user-show <requester_id>
zcli-ticket --json user-show <assignee_id>
```

### 3. 提取附件信息

从 `_comments` 的 `attachments` 中提取：
- 文件名、大小、类型
- 附件 API URL（供后续引用，不读取内容）

### 4. 输出摘要

```
## 工单 #ID — 标题

| 字段 | 值 |
|------|-----|
| 状态 | OPEN |
| 请求人 | xxx |
| 处理人 | xxx |
| 分类 | xxx |
| 类型 | xxx |
| 标签 | tag1, tag2 |
| 创建时间 | xxx |

### 问题描述
（完整描述）

### 内部备注 / 复现步骤
1. ...
2. ...

### 附件
- 录屏: <file_name> — <content_url>
- 截图: <file_name> — <content_url>

### 关键链接
- 工单链接: https://<subdomain>.zendesk.com/agent/tickets/<id>
- Livesite: <URL>
- Editor: <URL>
```

## Jira 来源

### 1. 获取工单详情

```bash
# 详情（--json 输出先落盘再 jq，防 stdout 截断；acli 无 -o 参数，用 shell 重定向）
acli jira workitem view <KEY> --json > work/<KEY>.json

# 评论（无评论返回空数组，属正常）
acli jira workitem comment list --key <KEY> --json > work/<KEY>-comments.json
```

**字段映射**：

| JSON 字段 | 含义 |
|-----------|------|
| `.key` | 工单编号 |
| `.fields.summary` | 标题 |
| `.fields.description` | 描述（ADF 文档树，段落 text 节点用 `jq -r '[.fields.description.content[]?.content[]?.text] | join("\n\n")'` 拼接；列表等富节点需人工查看 JSON） |
| `.fields.status.name` | 状态 |
| `.fields.issuetype.name` | 类型（Bug / Task / Story…） |
| `.fields.assignee.displayName` | 处理人 |
| `.fields.reporter.displayName` | 报告人 |

**默认 fields 集有限**：`created` / `updated` / `labels` / `priority` 等常返回 null（未随 view 返回）。摘要中此类字段如实标注「未返回」，不臆造。

### 2. 输出摘要

```markdown
## 工单 <KEY> — <summary>

| 字段 | 值 |
|------|-----|
| 链接 | https://<site>.atlassian.net/browse/<KEY> |
| 状态 | <status.name> |
| 类型 | <issuetype.name> |
| 处理人 | <assignee.displayName> |

### 问题描述
（description ADF text 原样保留。工单描述已含调研判读（如 BugSnag 变体、堆栈帧、修复方向）时原样呈现，Phase 2 直接以它为输入，不丢弃。）

### 评论
无 / 按条列出

### 关键链接
- 工单链接: https://<site>.atlassian.net/browse/<KEY>
- 描述中出现的看板 / 控制台链接: 逐条列出
```

### 3. 飞书文档标题

Jira 无数字工单 ID，标题用 `[工单 KEY] 标题`（如 `[SI-863] EcommerceSettingsFetchError in ecommerce settings fetch (timeout)`）。

### 5. 等待 Sign-off

**"Phase 1 完成。问题描述是否准确？是否有补充信息？请确认后继续。（回复 OK / 或提出修改）"**

- 如工单含视频附件，提醒用户人工查看录屏内容
- 如问题描述不清晰，提出具体问题请用户补充
- 如 livesite URL 缺失，请用户提供

### 6. Sign-off 后

**飞书模式**：**Use feishu-agent** →

```bash
# 1. 在知识库中创建文档节点
lark-cli wiki +node-create --space-id <FEISHU_WIKI_ID> --title "[工单 #ID] 问题标题"

# 2. 写入内容
lark-cli docs +update --api-version v2 --doc "<doc_url>" --command append --doc-format markdown --content $'# [工单 #ID] 问题标题\n\n## Phase 1: 问题描述\n- **工单链接**: ...\n...'
```

创建完成后，记录飞书文档 URL。后续 Phase 都会用到。

**Session 模式**：在对话中记录 Phase 1 摘要（保持与飞书文档一致的 Markdown 格式），直接进入 Phase 2 调研策略询问。
