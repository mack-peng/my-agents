# my-agents

将常用的工作工具做成一个一个的 agent 目录。人作为 AI 操作员，AI 利用 CLI 做单独的工作与产出。

## 理念

每个 agent 目录包含一套完整的工具集和技能定义（skills），AI 可以直接调用 CLI 工具完成具体任务。人类操作员负责分解任务、调度 agent、审核结果。

## Agents

| Agent | 工具 | 能力 |
|---|---|---|
| [acli-agent](./acli-agent) | `acli` | Atlassian 全家桶：Jira issues/sprints、Confluence pages/blogs、项目管理 |
| [browser-agent](./browser-agent) | `playwright-cli` | 浏览器自动化：导航、截图、表单填写、网络监控、测试 |
| [dify-agent](./dify-agent) | `dify-cli` | Dify AI 平台：聊天/补全、知识库、文件/音频、工作流 |
| [doc-agent](./doc-agent) | `officecli` | Office 文档：创建/编辑 .docx/.xlsx/.pptx，支持大纲、演讲稿、财报等 |
| [feishu-agent](./feishu-agent) | `lark-cli` | 飞书企业能力：IM、文档、表格、多维表格、日历、邮件、任务、云盘、OKR 等 25+ 技能 |
| [github-agent](./github-agent) | `gh` | GitHub 完整操作：repo、issue、PR、Actions、release、codespace、secret 等 |

## 使用方式

```bash
# 在对应 agent 目录下，AI 读取 AGENTS.md 或 skills 后即可调用 CLI
cd agents/<agent-name>

# 示例：GitHub 操作
gh issue list --assignee "@me"

# 示例：飞书发消息
lark-cli im send -c <chat_id> -t "hello"

# 示例：Dify AI 对话
dify-cli chat send "你好"
```

## 结构约定

```
agents/
  <agent-name>/
    AGENTS.md          # agent 使用说明（可选）
    skills/            # 技能定义（遵循 Agent Skills spec）
    .agents/skills/    # 已安装的 skills
```

## 快速开始

1. 安装对应 CLI 工具（各 agent 目录下有说明）
2. 配置认证信息
3. AI 读取 AGENTS.md 或 skills 后开始工作
