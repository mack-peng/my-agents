# Feishu Agent 项目

## 环境

飞书 CLI (`lark-cli`) 已全局安装，当前已登录用户 `用户878821`，Bot 与 User 双重身份已就绪。

如 CLI 未安装或未登录，请参考安装指南：https://open.feishu.cn/document/no_class/mcp-archive/feishu-cli-installation-guide.md

```bash
# 检查登录状态
lark-cli auth status

# 重新配置 & 登录
lark-cli config init --new
lark-cli auth login --recommend
```

## 已安装的 25 个 Skills

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
