# Feishu Agent 项目

## 前置检查

每次使用飞书 Agent 前，先检查 `lark-cli` 是否可用和已登录：

```bash
# 检查 CLI 是否安装
which lark-cli || echo "未安装"

# 检查登录状态
lark-cli auth status
```

如 `lark-cli` 未安装，按以下步骤安装。

## 安装

### 1. Node.js 版本

`lark-cli` 需要 Node.js >= 20.12.0。如使用 nodenv：

```bash
nodenv global 22.13.0   # 或其他 >= 20.12 的版本
```

### 2. 安装 CLI

```bash
npm install -g @larksuite/cli
```

### 3. 安装 Skills

```bash
npx -y skills add https://open.feishu.cn --skill -y
```

## 配置与登录

### 配置应用凭证

```bash
lark-cli config init --new
```

此命令会输出二维码和浏览器链接，用户在浏览器中完成应用创建后，进程会自动完成配置。

### 登录（两步流程）

**第一步：获取授权 URL 和 device_code**

```bash
lark-cli auth login --recommend --no-wait --json
```

输出包含 `device_code` 和 `verification_url`。用 `verification_url` 生成二维码展示给用户：

```bash
# 生成 ASCII 二维码（通用，无需图片支持）
lark-cli auth qrcode --ascii "<verification_url>"
```

将 URL 和二维码一并展示给用户，告知用户扫码授权后回复"完成"。

**第二步：用 device_code 完成登录**

用户确认授权后执行：

```bash
lark-cli auth login --device-code "<device_code>"
```

### 验证

```bash
lark-cli auth status
```

成功时 Bot 和 User 双身份均为 `ready`。

## 已安装的 27 个 Skills

项目 `.agents/skills/` 目录下已安装以下飞书技能，所有技能均使用 `lark-cli` 命令行操作：

| Skill | 功能 |
|-------|------|
| lark-im | 收发消息、管理群聊、搜索聊天记录、表情回复 |
| lark-doc | 创建、读取、编辑、翻译飞书云文档 |
| lark-sheets | 电子表格：创建表格、读写单元格、批量操作 |
| lark-base | 多维表格：建表、字段管理、记录 CRUD、视图/仪表盘/工作流 |
| lark-calendar | 查看日程、创建/更新会议、预约会议室、查询忙闲 |
| lark-mail | 收发邮件、管理草稿、搜索邮件 |
| lark-task | 创建待办、管理任务清单、分配协作成员 |
| lark-drive | 上传/下载文件、文件夹管理、文件搜索、导入导出 |
| lark-wiki | 管理知识空间、节点层级、成员权限 |
| lark-approval | 审批实例和任务管理 |
| lark-vc | 搜索历史会议、获取纪要/逐字稿 |
| lark-vc-agent | 机器人入会/离会、读取会中实时事件 |
| lark-minutes | 上传音视频转文字、搜索妙记列表 |
| lark-slides | 创建和编辑演示文稿 |
| lark-whiteboard | 查看/编辑画板，支持 Mermaid/PlantUML/D3 |
| lark-okr | 管理目标与关键结果 |
| lark-contact | 按姓名/邮箱搜索员工、解析 open_id |
| lark-attendance | 查询考勤打卡记录 |
| lark-apps | 部署 HTML 到飞书妙搭（公网可访问） |
| lark-event | 实时事件流订阅与消费 |
| lark-markdown | 创建、读取、编辑 Markdown 文件 |
| lark-note | 查询会议纪要详情和逐字记录 |
| lark-openapi-explorer | 查找和调用原生飞书 OpenAPI |
| lark-skill-maker | 创建自定义 lark-cli Skill |
| lark-shared | 身份切换、权限问题诊断、CLI 更新 |
| lark-workflow-meeting-summary | 会议纪要整理工作流 |
| lark-workflow-standup-report | 日程待办摘要 |

## 使用方式

遇到飞书相关任务时，优先读取对应 skill 的 `SKILL.md` 和 `references/` 文件了解具体命令。Skill 文件位于：
- `.agents/skills/<skill-name>/SKILL.md`
- `skills/<skill-name>/SKILL.md`（两处为同步链接）

所有操作通过 `lark-cli` 命令执行，例如：
```bash
# 查日程
lark-cli calendar +agenda

# 发消息
lark-cli im messages send --receive-id <open_id> --content "Hello"

# 搜索文档
lark-cli drive +search --keyword "关键词"
```
