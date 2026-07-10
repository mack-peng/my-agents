# Phase 1: 阅读工单

## 输入

Zendesk 工单 URL 或工单 ID。
- URL 格式: `https://<subdomain>.zendesk.com/agent/tickets/<id>` → 提取数字 ID
- 直接提供数字 ID 亦可

## 流程

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
