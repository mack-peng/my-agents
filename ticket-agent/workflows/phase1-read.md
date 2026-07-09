# Phase 1: 阅读工单

## 输入

Zendesk 工单 URL（SXL 或 Strikingly）

## 流程

### 1. 打开工单

**Use browser-agent**.

根据 URL 域名选择对应的 Zendesk 实例和状态文件：

- `sxl.zendesk.com` → 加载 `sxl.zendesk.state.json`
- `strikingly.zendesk.com` → 加载 `zendesk.state.json`

所有 Playwright 命令使用独立 session `-s=ticket-agent`，避免与其他 agent 冲突。

具体流程：
1. `playwright-cli -s=ticket-agent open <zendesk-url> --headed`
2. `playwright-cli -s=ticket-agent state-load <state-file>`
3. `playwright-cli -s=ticket-agent goto "<工单URL>"`
4. `playwright-cli -s=ticket-agent snapshot`

### 2. 获取工单内容

```bash
playwright-cli -s=ticket-agent snapshot
playwright-cli -s=ticket-agent eval "() => document.title"
playwright-cli -s=ticket-agent console
```

### 3. 提取关键信息

从 snapshot 中提取：

| 字段 | 提取位置/方式 |
|------|-------------|
| 工单标题 | `heading "Ticket: ..."` |
| 状态 | OPEN / PENDING / SOLVED |
| 请求人 | Requester 区域 |
| 处理人 | Assignee* 区域 |
| HO Assignee | HO Assignee* 区域 |
| 分类 | Categories* 区域 |
| 类型 | Ticket Type* |
| 标签 | Tags 区域 |
| 问题描述 | Conversation 中第一条消息 |
| 复现步骤 | Conversation 中的 Internal note |
| Livesite URL | Conversation 中的链接 |
| 附件（视频/图片） | Conversation 中的 img/link |
| 客户上下文 | 右侧 Customer context 面板 |
| 交互历史 | 右侧 Interaction history |

### 4. 读取附件

如工单含图片附件，读取图片确认内容。视频文件需提醒人工查看。

### 5. 输出摘要

```
## 工单 #ID — 标题

| 字段 | 值 |
|------|-----|
| 状态 | OPEN |
| ... | ... |

### 问题描述
（完整描述）

### 复现步骤
1. ...
2. ...

### 附件
- 录屏: <URL>
- 截图: <URL>

### 关键链接
- Livesite: <URL>
- Editor: <URL>
- Slack: <URL>
```

### 6. 等待 Sign-off

**"Phase 1 完成。问题描述是否准确？是否有补充信息？请确认后继续。（回复 OK / 或提出修改）"**

- 如工单含视频，提醒用户查看录屏内容
- 如问题描述不清晰，提出具体问题请用户补充
- 如 livesite URL 缺失，请用户提供

### 7. Sign-off 后：创建飞书文档

**Use feishu-agent** → `lark-cli docs +create` 创建飞书文档。

文档内容格式：

```markdown
# [工单 #ID] 问题标题

## Phase 1: 问题描述
- **工单链接**: ...
- **状态**: ...
- **请求人**: ...
- **分类**: ...
- **问题描述**: ...
- **复现步骤**: ...
- **Livesite**: ...
✅ Phase 1 Sign-off: 已确认
```

创建完成后，记录飞书文档 URL。后续 Phase 都会用到。
