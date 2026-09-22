# Phase 6: 工单回复（RESOLUTION NOTE）

本 Phase 将已确认的解决结果写回 Zendesk 工单（内部备注）。适用于两类工单：
- 有代码变更（component-kit / bobcat）——MR 链接已知、用户侧已恢复
- 无代码变更（自定义代码 / 支持类问题）——根因确认、用户侧验证恢复后即可执行

## 前置条件

- **用户明确指示"回复工单"后才执行**（同 Phase 4b / 5b，不自动触发）
- 写权限可用（Phase 0 Pre-flight 已检查 `oauthScope` 含 `tickets:write`）
- 根因已确认、用户侧影响已验证恢复（livesite / 测试环境 / HO 确认）

## 输入

- 工单 ID 与 profile（沿用 Phase 1）
- 根因结论与验证方式（来自已完成的 Phase 或用户直接提供）
- MR 链接（有代码变更时）或解决方式说明（无 MR 时）
- 成功截图文件路径

## 备注格式（硬性规则）

按 `references/resolution-note-template.md` 起草：

- root cause 只保留本工单命中的一项，用短句（如 `-Caused by custom code`）
- `Actions required from the user` 默认留空；仅在确需客户操作时填写
- 成功截图内嵌在 `* Please provide screenshots to show that it's resolved` 行下方
- 解决方案写在 MR 链接行下方：如何解决（动作 + 注释掉的用户代码块）+ `user reference`（系统现有实现/参考代码）
- `Submitted by` 填 `zendesk-agent/.env` 中的 `SUBMITTED_BY`
- 语言英文；草稿落盘 `/tmp/opencode/ticket-<id>-note.txt`（评审）与 `-note.html`（发送）

## 流程

### 1. 起草草稿

- 文本版 `ticket-<id>-note.txt`：内嵌截图位置用 `[screenshot inline: <file>]` 占位，供用户评审
- HTML 版 `ticket-<id>-note.html`：`<br>` 换行 + `<img src="<upload content_url>">`，用于发送

### 2. 上传截图并取 content_url

⚠️ `zcli-ticket 0.1.6` 的 `attachment-upload` 有 bug（命令定义缺 `upload: true`，会把请求 JSON 当文件上传，落库为 63 字节 `application/json`）。CLI 修复前用 curl：

```bash
# 用 ~/.zendeskrc 的 client 凭据换 token（scope 需含 tickets:write）
CID=$(jq -r '.profiles.<profile>.oauthClientId' ~/.zendeskrc)
SEC=$(jq -r '.profiles.<profile>.oauthClientSecret' ~/.zendeskrc)
BODY=$(jq -n --arg cid "$CID" --arg sec "$SEC" '{grant_type:"client_credentials",client_id:$cid,client_secret:$sec,scope:"tickets:read tickets:write"}')
TOKEN=$(curl -s -X POST "https://<subdomain>.zendesk.com/oauth/tokens" -H "Content-Type: application/json" -d "$BODY" | jq -r .access_token)

# multipart 上传，取回 token + content_url（token 有效期约 1 小时）
curl -s -X POST "https://<subdomain>.zendesk.com/api/v2/uploads?filename=<name>" \
  -H "Authorization: Bearer $TOKEN" \
  -F "uploaded_data=@<file>;type=image/png"
```

- 核对返回的 `size` / `content_type` 与实际文件一致，防止坏附件进入工单
- 伪造/错误的 upload 用 `DELETE /api/v2/uploads/<token>` 清理

### 3. Sign-off

将完整草稿（含截图内嵌位置）展示给用户，等待确认。**未经 sign-off 禁止发送。**

### 4. 发送（内嵌截图）

CLI `comment-create` 不支持 `html_body`，无法内嵌图片 → 用 curl PUT：

```bash
jq -n --rawfile html /tmp/opencode/ticket-<id>-note.html --arg t "<upload-token>" \
  '{ticket:{comment:{html_body:$html, uploads:[$t], public:false}}}' > /tmp/opencode/payload.json
curl -s -X PUT "https://<subdomain>.zendesk.com/api/v2/tickets/<id>.json" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d @/tmp/opencode/payload.json
```

- **`public:false` 必须显式携带**：curl 请求漏掉即可能落为公开回复
- 无内嵌截图需求时才用 CLI：`zcli-ticket -p <profile> comment-create <id> "$(cat note.txt)" --private`
- 不修改工单 status（保持现状，由 HO 跟进处置）
- 实测（#26561573）：html_body 引用 upload `content_url` 不会让 Zendesk 把附件标记为 `inline: true`；图片在引用行渲染，同时仍出现在底部附件列表

### 5. 结果确认

- `GET /api/v2/tickets/<id>/comments.json?include_inline_images=true` 核对：`public=false`、附件 `size`/`content_type`、html_body 内 img 位置
- 渲染效果在 Zendesk UI 人工确认（图片 URL 需登录态，API 直取 403 属预期）
- 有疑问时复核：`zcli-ticket -p <profile> --json comment-list <id>` 确认最后一条为 internal

### 6. 更正已发备注

- Zendesk 评论不可编辑/删除：更正方式 = 追加一条更正备注（旧备注保留）
- redact（`comment-redact` / `PUT /api/v2/comment_redactions/{comment_id}`）永久删改内容且需权限，仅在用户明确要求时使用

### 7. 飞书模式

发送成功后，**use feishu-agent** 将 Phase 6 结果与 Sign-off 追加到飞书文档。

## TODO 记录

```markdown
## Phase 6 TODO
- [x] 起草 RESOLUTION NOTE。结果：/tmp/opencode/ticket-<id>-note.txt
- [x] 截图上传。结果：token / content_url
- [x] 用户 sign-off
- [x] 发送内部备注。结果：comment <id>, public=false
✅ Phase 6 Sign-off: 已确认
```

## 禁止

- 未经用户明确指示不得触发（不随 Phase 5 自动执行）
- 不得发送公开回复：客户沟通需用户显式授权，默认由 HO 负责
- 不得修改 status / assignee / priority 等字段（除非用户明确要求）
- 不得在 sign-off 前发送
