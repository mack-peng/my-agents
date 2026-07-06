# OpnForm REST API 文档整理

> 来源：https://docs.opnform.com/api-reference/（左侧菜单全部页面 + OpenAPI schema）
> 整理日期：2026-06-28 ｜ API 版本：1.0.0
> 本文覆盖 API Reference 左侧导航的全部端点：General / Forms / Submissions / Integrations / Workspaces / Workspace Users / Zapier。

---

## 0. 概览

| 项 | 内容 |
|---|---|
| Base URL（云） | `https://api.opnform.com` |
| Base URL（自托管） | `https://<你的域名>/api`（例：`https://form.orangemust.com/api`，端点前加 `/api` 前缀） |
| 鉴权 | `Authorization: Bearer <Personal Access Token>`（JWT） |
| 分页 | 部分 list 端点支持 `?page=N` |
| 限流 | 每 IP **100 请求/分钟**，超出返回 `429` |
| 错误格式 | `{ "message": "...", "errors": { "field": ["..."] } }` |

### Token 能力（Abilities / Scopes）

| Ability | 授予权限 |
|---|---|
| `workspaces-read` | 读取工作区 |
| `workspaces-write` | 创建/更新/删除工作区 |
| `workspace-users-read` | 列出成员与邀请 |
| `workspace-users-write` | 管理成员与邀请 |
| `forms-read` | 读取表单与提交 |
| `forms-write` | 创建/修改表单与提交 |
| `manage-integrations` | 管理表单 webhook 集成 |

> 操作超出 token 能力 → `403 Forbidden`。

### 通用状态码

| 状态 | 含义 |
|---|---|
| 400 | 请求错误 / 校验失败 |
| 401 | 缺失或无效 token |
| 403 | token 缺少所需 ability |
| 404 | 资源不存在 |
| 429 | 超出限流 |
| 500 | 服务端错误 |

### 创建 PAT（API Keys）

1. 登录 OpnForm → **Settings → Access Tokens**（`/home?user-settings=access-tokens`）。
2. **Create new token** → 命名 → 勾选所需 abilities → **Create**。
3. **令牌只显示一次**，立即复制保存。
4. 撤销：同页 **Revoke**，之后该 token 请求返回 `401`。
5. 最佳实践：每个集成一个独立 token、存环境变量/密钥管理器、不入版本库、定期轮换。

---

## 1. 端点总览（按左侧菜单分组）

### Forms
| 端点 | 方法 路径 | Ability |
|---|---|---|
| Create Form | `POST /open/forms` | forms-write |
| Get Form | `GET /open/forms/{slug}` | forms-read |
| List Workspace Forms | `GET /open/workspaces/{workspaceId}/forms` | forms-read |
| Update Form | `PUT /open/forms/{id}` | forms-write |
| Delete Form | `DELETE /open/forms/{id}` | forms-write |

### Submissions
| 端点 | 方法 路径 | Ability |
|---|---|---|
| Create Submission | `POST /forms/{slug}/answer` | 公开（无需鉴权） |
| List Submissions | `GET /open/forms/{id}/submissions` | forms-read |
| Update Submission | `PUT /open/forms/{id}/submissions/{submission_id}` | forms-write |
| Delete Submission | `DELETE /open/forms/{id}/submissions/{submission_id}` | forms-write |
| Export CSV | `POST /open/forms/{id}/submissions/export` | forms-read |
| Check Export Status | `GET /open/forms/{id}/submissions/export/{job_id}/status` | forms-read |

### Integrations（Webhook）
| 端点 | 方法 路径 | Ability |
|---|---|---|
| Create Webhook | `POST /open/forms/{form}/integrations` | manage-integrations |
| List Integrations | `GET /open/forms/{form}/integrations` | manage-integrations |
| Update Webhook | `PUT /open/forms/{form}/integrations/{integrationid}` | manage-integrations |
| Delete Webhook | `DELETE /open/forms/{form}/integrations/{integrationid}` | manage-integrations |
| List Webhook Events | `GET /open/forms/{form}/integrations/{integrationid}/events` | manage-integrations |

### Workspaces
| 端点 | 方法 路径 | Ability |
|---|---|---|
| Create Workspace | `POST /open/workspaces/create` | workspaces-write |
| List Workspaces | `GET /open/workspaces` | workspaces-read |
| Update Workspace | `PUT /open/workspaces/{workspaceId}` | workspaces-write（admin） |
| Delete Workspace | `DELETE /open/workspaces/{workspaceId}` | workspaces-write（admin） |

### Workspace Users
| 端点 | 方法 路径 | Ability |
|---|---|---|
| Add User | `POST /open/workspaces/{workspaceId}/users/add` | workspace-users-write（admin） |
| List Users | `GET /open/workspaces/{workspaceId}/users` | workspace-users-read |
| List Invites | `GET /open/workspaces/{workspaceId}/invites` | admin + workspaces-write |
| Update Role | `PUT /open/workspaces/{workspaceId}/users/{userId}/update-role` | workspace-users-write |
| Remove User | `DELETE /open/workspaces/{workspaceId}/users/{userId}/remove` | workspace-users-write |
| Resend Invite | `POST /open/workspaces/{workspaceId}/invites/{inviteId}/resend` | workspace-users-write |
| Cancel Invite | `DELETE /open/workspaces/{workspaceId}/invites/{inviteId}/cancel` | workspace-users-write |
| Leave Workspace | `POST /open/workspaces/{workspaceId}/leave` | workspace-users-write |

### Zapier（遗留）
| 端点 | 方法 路径 |
|---|---|
| Validate API Key | `GET /external/zapier/validate` |
| List Forms | `GET /external/zapier/forms?workspace_id=` |
| New Submission Trigger | `POST /external/zapier/webhook` `{hookUrl, form_id}` |
| Sample Submission Polling | `GET /external/zapier/submissions/recent?form_id=` |
| Unsubscribe Webhook | `DELETE /external/zapier/webhook` `{hookUrl, form_id}` |

---

## 2. Forms

### 2.1 Create Form — `POST /open/forms`（forms-write）
**必填**：`workspace_id`、`title`、`visibility`(`public`/`draft`/`closed`)、`language`(2 位 ISO)、`properties`(数组)。
> 自托管实测：服务端校验还要求 `presentation_style`、`no_branding`、`transparent_background`（见第 8 节边界）。

```json
{
  "workspace_id": 1,
  "title": "Event Registration",
  "visibility": "public",
  "language": "en",
  "properties": [
    { "id": "field-1", "type": "short_text", "name": "First name", "required": true }
  ]
}
```
**响应** `201 Created`（自托管实测返回 `200`），返回完整 `Form` 对象（含 `id`、`slug`）。`403`=缺 forms-write。

### 2.2 Get Form — `GET /open/forms/{slug}`（forms-read）
`slug` 可为 human slug 或 UUID。`200` 返回完整 `Form`（含 `properties`）；`404` 不存在；`403` 无权限。

### 2.3 List Workspace Forms — `GET /open/workspaces/{workspaceId}/forms?page=N`（forms-read）
返回**轻量摘要**（不含 `properties`），分页（`data` + `links` + `meta`）。需要完整字段请用 Get Form。
`FormListItem` 字段：`id, slug, title, visibility, tags, views_count, submissions_count, created_at, updated_at, last_edited_human, closes_at, is_closed, max_submissions_count, max_number_of_submissions_reached, is_pro, workspace_id, share_url`。

### 2.4 Update Form — `PUT /open/forms/{id}`（forms-write）
**更新必须携带这些字段**（否则校验失败）：`title, visibility, language, theme, presentation_style, width, size, border_radius, dark_mode, color, uppercase_labels, no_branding, transparent_background, properties`。
> ⚠️ `properties` **不能为空**，否则会丢失现有字段。
**推荐模式**：先 `GET` 取完整表单 → 本地只改目标字段 → 把**完整对象**整体 `PUT` 回去。`200` 返回更新后的 `Form`。

### 2.5 Delete Form — `DELETE /open/forms/{id}`（forms-write）
永久删除表单及其所有提交。`204 No Content`。

---

## 3. Submissions

### 3.1 Create Submission — `POST /forms/{slug}/answer`（公开，无需鉴权）⭐
请求体以**字段 UUID** 为 key（字段 ID 通过 Get Form 获取）：
```json
{
  "completion_time": 10,
  "3700d380-197b-47b9-a008-3acc31bbd506": "Alice",
  "12461db5-0c19-429e-840b-8de1e359c42f": "alice@example.com"
}
```
- 值类型随字段类型：文本=string，数字=number，复选=boolean，多选=array。
- `completion_time`(number, 秒, 选填)；`is_partial`(bool, 选填，需表单开启"Collect partial submissions"，返回 `submission_hash` 供后续更新)。
- **响应** `200`：`{ type:"success", message, submission_id, is_first_submission, redirect, submission_hash }`。
- `422`：校验错误，`errors` 以字段 UUID 为 key。`404`：表单不存在或未发布。

### 3.2 List Submissions — `GET /open/forms/{id}/submissions`（forms-read）
Query：`page`、`per_page`(默认/最大 100)、`search`(只搜字段值，大小写不敏感)、`status`(`completed`/`partial`/`all`)。
返回分页 `Submission`：`{ id, form_id, completion_time, data }`，`data` 以字段 UUID 为 key 并含元数据 `status/created_at/id`。文件/签名字段返回 `{file_url, file_name}`，**file_url 签名 10 分钟过期**。按 `created_at` 倒序。

### 3.3 Update Submission — `PUT /open/forms/{id}/submissions/{submission_id}`（forms-write）
只需发送要改的字段 key（+ 可选 `completion_time`）。`200` 返回更新后的 submission。

### 3.4 Delete Submission — `DELETE /open/forms/{id}/submissions/{submission_id}`（forms-write）
`200` `{"message":"Record successfully removed."}`。

### 3.5 Export CSV — `POST /open/forms/{id}/submissions/export`（forms-read）
Body：`{ "columns": { "<field_id>": true, "created_at": true } }`。
小表单同步返回 CSV（`text/csv`）；大表单异步返回 `{ message, job_id, is_async:true }`。

### 3.6 Check Export Status — `GET /open/forms/{id}/submissions/export/{job_id}/status`（forms-read）
`status`：`processing`/`completed`/`failed`；含 `progress, processed_submissions, total_submissions, file_url(完成后), expires_at`。**导出文件 24 小时后删除**。建议每 2–5 秒轮询。

---

## 4. Integrations（Webhook）

### 4.1 Create Webhook — `POST /open/forms/{form}/integrations`（manage-integrations）
```json
{
  "integration_id": "webhook",
  "status": "active",
  "data": {
    "webhook_url": "https://example.com/hook",
    "webhook_secret": "whsec_至少12位",
    "webhook_headers": { "X-API-Key": "..." }
  },
  "logic": { }
}
```
- `webhook_url`：必须 HTTPS、且解析到公网 IP（私网/loopback/link-local/云元数据地址被拒）。不跟随重定向。
- `webhook_secret`：选填，≥12 位，启用 HMAC-SHA256 签名（`X-Webhook-Signature` 头）。
- `webhook_headers`：最多 10 个，值 ≤255 字符。**禁用头**：`Authorization, X-Webhook-Signature, Content-Type, Content-Length, Host, Cookie, X-CSRF-Token, X-Forwarded-For, X-Forwarded-Proto, X-Real-IP`。
- `logic`：选填，满足条件才触发。
`200` 返回 `form_integration`；`422` 校验错误。

### 4.2 List Form Integrations — `GET /open/forms/{form}/integrations`
返回 `FormIntegration[]`：`{ id, form_id, integration_id, status, data }`。

### 4.3 Update Webhook — `PUT /open/forms/{form}/integrations/{integrationid}`
同 Create 结构；`webhook_headers` 会**整体替换**。更新 `webhook_secret` = 轮换密钥（接收端建议设置过渡期同时接受新旧）。

### 4.4 Delete Webhook — `DELETE /open/forms/{form}/integrations/{integrationid}`
`200` `{"message":"Form Integration was deleted."}`。

### 4.5 List Webhook Events — `GET /open/forms/{form}/integrations/{integrationid}/events`
返回 `IntegrationEvent[]`（倒序）：`{ id, integration_id, event:"submission.created", status:"success"|"failed"|"timeout", response_code, error_message, created_at }`。用于调试/监控/审计。

### 4.6 Validating Webhook Signatures（签名校验指南）
- 头：`X-Webhook-Signature: sha256=<hex>`；`signature = HMAC-SHA256(webhook_secret, raw_body)`。
- 校验：去掉 `sha256=` 前缀 → 用密钥+**原始请求体**计算 → **常量时间比较** → 不匹配则拒绝。
- ⚠️ 必须用**原始 body**（解析再序列化会导致签名不一致）。
- Webhook payload 含 `form_id, form_title, submission_id, submission`。
- 示例（Node/Express）：
```javascript
app.use(express.raw({ type: 'application/json' }));
app.post('/webhook', (req, res) => {
  const sig = req.headers['x-webhook-signature'];
  const expected = 'sha256=' + crypto.createHmac('sha256', SECRET).update(req.body).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
    return res.status(401).send('Invalid signature');
  const data = JSON.parse(req.body);
  res.status(200).send('ok');
});
```

---

## 5. Workspaces

| 操作 | 端点 | 说明 |
|---|---|---|
| Create | `POST /open/workspaces/create` | Body `{ name(必填), emoji }`；创建者自动成为 admin。返回 `{message, workspace_id, workspace}` |
| List | `GET /open/workspaces` | 返回当前用户所属工作区数组 `{id,name,icon,settings,max_file_size,is_readonly}` |
| Update | `PUT /open/workspaces/{workspaceId}` | admin；Body `{name(必填), emoji}` |
| Delete | `DELETE /open/workspaces/{workspaceId}` | admin；**不可逆**，删除其下全部表单/提交/设置 |

---

## 6. Workspace Users

角色枚举：`admin` / `user` / `readonly`（成员列表里也可能显示 `member`/`viewer`）。

| 操作 | 端点 | Body / 说明 |
|---|---|---|
| Add User | `POST /open/workspaces/{workspaceId}/users/add` | `{email, role}`；用户已存在则加入，否则发邀请邮件。**自托管 Community 全实例上限 2 用户**，超出需 Enterprise license（把已有用户加入别的工作区不占新席位） |
| List Users | `GET /open/workspaces/{workspaceId}/users` | 返回 `{id,name,email,role}[]` |
| List Invites | `GET /open/workspaces/{workspaceId}/invites` | **需 admin + `workspaces-write`**；返回 `{id,email,role,status(pending/accepted),valid_until}[]`，不暴露 invite token |
| Update Role | `PUT /open/workspaces/{workspaceId}/users/{userId}/update-role` | `{role}` |
| Remove User | `DELETE /open/workspaces/{workspaceId}/users/{userId}/remove` | 被移除者若无其它工作区会自动建个人工作区 |
| Resend Invite | `POST /open/workspaces/{workspaceId}/invites/{inviteId}/resend` | 空 body；错误（未找到/已接受）返回 `400` |
| Cancel Invite | `DELETE /open/workspaces/{workspaceId}/invites/{inviteId}/cancel` | 删除待处理邀请 |
| Leave Workspace | `POST /open/workspaces/{workspaceId}/leave` | 仅本人离开（不能用此踢人）；`204` |

---

## 7. Zapier（遗留端点）

| 操作 | 端点 | 说明 |
|---|---|---|
| Validate API Key | `GET /external/zapier/validate` | `200` 有效 / `401` 无效 |
| List Forms | `GET /external/zapier/forms?workspace_id=` | 返回 `Form[]` |
| New Submission Trigger | `POST /external/zapier/webhook` | Body `{hookUrl, form_id}` 注册新提交 webhook |
| Sample Submission Polling | `GET /external/zapier/submissions/recent?form_id=` | 返回最近提交 `Submission[]` |
| Unsubscribe Webhook | `DELETE /external/zapier/webhook` | Body `{hookUrl, form_id}` 取消订阅 |

> 已废弃：`GET /open/forms`（跨工作区列全部表单）已从文档移除，仅保留给旧 Zapier 集成，不建议新用。

---

## 8. 关键 Schema

### Form（节选可写字段）
`workspace_id`(写), `title`, `visibility`(public/draft/closed), `language`, `tags[]`, `custom_domain`,
外观：`theme`(default/simple/notion), `font_family`, `color`, `dark_mode`(light/dark/auto), `width`(centered/full), `size`(sm/md/lg), `border_radius`(none/small/full), `layout_rtl`, `uppercase_labels`, `cover_picture`, `logo_picture`, `no_branding`, `transparent_background`,
提交行为：`submit_button_text`(≤50), `submitted_text`(≤2000), `redirect_url`, `re_fillable`, `re_fill_button_text`(≤50), `confetti_on_submission`, `show_progress_bar`, `auto_save`, `auto_focus`, `enable_partial_submissions`, `editable_submissions`, `editable_submissions_button_text`(≤50),
访问控制：`closes_at`, `closed_text`, `max_submissions_count`, `max_submissions_reached_text`, `password`, `use_captcha`, `captcha_provider`(recaptcha/hcaptcha), `can_be_indexed`,
其它：`seo_meta`, `custom_code`, `database_fields_update`, `properties[]`。
只读：`id`, `slug`。

### FormProperty（字段块）
文档正式定义：`id`(uuid), `type`, `name`, `help`, `hidden`, `required`, `placeholder`, `width`(full/1\/2/1\/3/2\/3/1\/4/3\/4)。
**`additionalProperties: true`** —— 允许任意附加属性（如 `select.options`、`max_char_limit`、`multi_lines`、`logic` 等，文档未列出，需自行了解内部结构）。

### Submission
`{ id, form_id, completion_time, data }`，`data` 以字段 UUID 为 key + 元数据（`status, created_at, id`）。

### 其它
- `FormIntegration`：`{ id, form_id, integration_id, status(active/inactive), data }`
- `IntegrationEvent`：`{ id, integration_id, event, status(success/failed/timeout), response_code, error_message, created_at }`
- `ExportJobStatus`：`{ status, progress, form_id, user_id, job_id, processed_submissions, total_submissions, file_url, expires_at, error_message, created_at, updated_at }`
- `Workspace`：`{ id, name, icon, settings, max_file_size, is_readonly }`
- `Invite`：`{ id, email, role, status(pending/accepted), valid_until }`

---

## 9. 实战要点 / 能力边界（结合自托管 form.orangemust.com 实测）

1. **自托管 Base URL 带 `/api` 前缀**：如 `https://form.orangemust.com/api/open/forms`、`https://form.orangemust.com/api/forms/{slug}/answer`。
2. **创建/更新校验比文档严**：除文档必填项外，自托管 v2.0.2 还要求 `presentation_style`(如 `classic`)、`no_branding`、`transparent_background`。文档示例的类型名 `short_text` 实际存储为 `text`（类型词表未在文档公开）。
3. **字段类型专属结构无文档**：靠 `FormProperty.additionalProperties:true` 塞入。例如：
   - 文本：`{type:"text", multi_lines:false, max_char_limit:250, show_char_limit:false}`；长文本=`multi_lines:true`。
   - 单选：`{type:"select", without_dropdown:false, select:{options:[{id,name}]}}`（提交值=选项 `id`）。
4. **条件逻辑（`logic`）完全无文档，且校验宽松**（写错会被静默接受但运行时不生效）。正确结构：
   ```json
   "logic": {
     "conditions": { "operatorIdentifier": "and", "children": [
       { "identifier": "<源字段id>", "value": {
           "operator": "equals",
           "property_meta": {"id": "<源字段id>", "type": "select"},
           "value": "<选项值>" } } ] },
     "actions": ["show-block", "require-answer"]
   }
   ```
   - ⚠️ 分组节点 key 必须是 **`operatorIdentifier`**（不是 `operator`），否则运行时条件恒为 false。
   - 动作枚举：`show-block / hide-block / require-answer / make-it-optional / enable-block / disable-block`；**合法动作取决于字段当前 `hidden`/`required`/`disabled` 状态**（如 `show-block` 仅对 `hidden:true` 字段有效）。
   - 逻辑只能作用于**整块**（显示/隐藏/必填/启停），**不能按另一字段过滤单个 select 的选项**——"A 字段联动 B 选项"需拆成多个条件字段。
5. **提交接口是 `POST /forms/{slug}/answer`，不是 `/submissions`**；请求体以**字段 UUID** 为 key；服务端会按 `logic` 动态计算必填（隐藏的字段不必填）。
6. **更新表单务必先 GET 再整体 PUT**，且 `properties` 不能为空，否则丢字段。
7. 自托管部分端点返回码与文档略有出入（文档 `201/204`，实测可能 `200`）。
