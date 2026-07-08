# my-agents

AI 工作台 — 常用工作工具封装为独立 agent 目录。人类拆任务、做决策、审结果；AI 读取各 agent 文档后调用对应 CLI 或执行工作流，完成具体产出。

## 理念

人类负责拆任务、做决策、审结果；AI 负责执行。每个 agent 封装一套能力边界，AI 读取 `AGENTS.md` 或 skill 后即可调用对应 CLI 或原生工作流完成任务。

## Agents

| Agent | 工具 | 能力 |
|---|---|---|
| [acli-agent](./acli-agent) | `acli` | Atlassian 全家桶：Jira issues/sprints、Confluence pages/blogs |
| [apihz-agent](./apihz-agent) | `apihz-cli` | 479+ API（天气、IP、翻译、OCR、短信等） |
| [browser-agent](./browser-agent) | `playwright-cli` | 浏览器自动化：导航、截图、表单、网络监控、测试 |
| [code-agent](./code-agent) | OpenCode 原生 | Feature 开发：按 Spec + Code Design 实现代码 |
| [code-design-agent](./code-design-agent) | OpenCode 原生 | 前端代码设计：从产品 Spec 产出 FE Code Design 文档 |
| [design-agent](./design-agent) | OpenCode 原生 | 产品设计审查：UI/UX、转化、品牌，输出 Spec |
| [dify-agent](./dify-agent) | `dify-cli` | Dify AI 平台：聊天/补全、知识库、工作流 |
| [doc-agent](./doc-agent) | `officecli` | Office 文档：创建/编辑 .docx/.xlsx/.pptx |
| [feishu-agent](./feishu-agent) | `lark-cli` | 飞书：IM、文档、表格、多维表格、日历、邮件等 26 个技能 |
| [gitee-agent](./gitee-agent) | `gitee-cli` | Gitee 码云：repo、issue、PR、release、组织 |
| [github-agent](./github-agent) | `gh` | GitHub：repo、issue、PR、Actions、release |
| [gitlab-agent](./gitlab-agent) | `glab` | GitLab：repo、issue、MR、CI/CD、pipeline |
| [morph-agent](./morph-agent) | `morph-cli` | Dagger CI：项目构建、JAR 部署 |
| [planka-agent](./planka-agent) | `planka-cli` | Planka 看板：project、board、card、member |

### 流水线串联

三个 OpenCode 原生 agent 可串联成一条产品交付流水线：

```
设计审查 → 代码设计 → 代码实现
design-agent → code-design-agent → code-agent
```

人类在每个环节审阅并确认后，再进入下一环节。

## 使用方式

```bash
# CLI 封装型 — AI 读取 AGENTS.md 后调用全局 CLI
cd github-agent
gh issue list --assignee "@me"

# OpenCode 原生型 — AI 按工作流执行
cd code-agent
# AI 读取 input/*.spec.md 后开始实现
```

## 结构约定

```
my-agents/
  AGENTS.md             # 本文档
  <agent-name>/
    AGENTS.md           # agent 参考文档（12 个目录）
    AGENT.md            # 少数 agent 使用单数形式（dify-agent/、morph-agent/）
    skills/             # 技能定义
    .agents/skills/     # 已安装的 skills（feishu-agent 有 26 个 lark 技能）
```

## 快速开始

1. 安装目标 CLI 工具（各 agent 目录下有说明）或使用 OpenCode 原生 agent
2. 配置认证信息（环境变量或全局 CLI 配置）
3. AI 读取 `AGENTS.md` 或 skill 后开始工作
