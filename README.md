# my-agents

将常用的工作工具做成一个一个的 agent 目录。人作为 AI 操作员，AI 利用 CLI 做单独的工作与产出。

## 理念

每个 agent 目录包含一套完整的工具集和技能定义（skills），AI 可以直接调用 CLI 工具完成具体任务。人类操作员负责分解任务、调度 agent、审核结果。

## Agents

| Agent | 工具 | 能力 |
|---|---|---|
| [acli-agent](./acli-agent) | `acli` | Atlassian 全家桶：Jira issues/sprints、Confluence pages/blogs、项目管理 |
| [apihz-agent](./apihz-agent) | `apihz-cli` | 接口盒子：479+ API（天气、IP、翻译、OCR、短信等） |
| [browser-agent](./browser-agent) | `playwright-cli` | 浏览器自动化：导航、截图、表单填写、网络监控、测试 |
| [browser-use-agent](./browser-use-agent) | `browser-use` | 浏览器智能代理（Python + DeepSeek） |
| [design-agent](./design-agent) | OpenCode 原生 | 产品设计：现状分析、优化建议、spec 生成、新功能嵌入设计 |
| [dify-agent](./dify-agent) | `dify-cli` | Dify AI 平台：聊天/补全、知识库、文件/音频、工作流 |
| [doc-agent](./doc-agent) | `officecli` | Office 文档：创建/编辑 .docx/.xlsx/.pptx |
| [feishu-agent](./feishu-agent) | `lark-cli` | 飞书企业能力：IM、文档、表格、多维表格、日历、邮件等 25+ 技能 |
| [gitee-agent](./gitee-agent) | `gitee-cli` | Gitee 码云：repo、issue、PR、release、组织管理 |
| [github-agent](./github-agent) | `gh` | GitHub：repo、issue、PR、Actions、release、codespace 等 |
| [gitlab-agent](./gitlab-agent) | `glab` | GitLab：repo、issue、MR、CI/CD、pipeline、runner 等 |
| [morph-agent](./morph-agent) | `morph-cli` | Dagger CI：项目构建、JAR 部署 |
| [planka-agent](./planka-agent) | `planka-cli` | Planka 看板：project、board、card、member、webhook 等 |

## 使用方式

```bash
# 在对应 agent 目录下，AI 读取 AGENTS.md 或 skills 后即可调用 CLI
cd <agent-name>

# 示例：GitHub 操作
gh issue list --assignee "@me"

# 示例：飞书发消息
lark-cli im send -c <chat_id> -t "hello"

# 示例：Dify AI 对话
dify-cli chat send "你好"
```

## 结构约定

```
my-agents/
  AGENTS.md             # 根目录 agent 说明
  <agent-name>/
    AGENTS.md           # agent CLI 命令参考
    AGENT.md            # 部分 agent 使用单数形式
    skills/             # 技能定义（遵循 Agent Skills spec）
    .agents/skills/     # 已安装的 skills
```

## 快速开始

1. 安装对应 CLI 工具（各 agent 目录下有说明）
2. 配置认证信息
3. AI 读取 AGENTS.md 或 skills 后开始工作
