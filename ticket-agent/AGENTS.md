# Ticket Agent

端到端工单处理 agent。五阶段流程，每阶段需人工 sign-off。
使用飞书文档作为跨机器状态持久化。
**本 agent 是协调器，具体操作委托给 zendesk-agent / browser-agent / feishu-agent / gitlab-agent。**

## 入口判断

```
输入 Zendesk 工单 URL 或 ID   → Phase 1 开始
输入飞书文档 URL              → 读取文档，判断当前阶段，从中断处继续
```

### 文档中阶段识别规则

读取飞书文档内容后，按以下标记判断当前阶段：

| 文档中最后出现的标记 | 当前阶段 |
|---------------------|---------|
| 无任何 Phase 标记 | Phase 1 |
| 有 `✅ Phase 1 Sign-off` 但无 Phase 2 标记 | Phase 2 |
| 有 `✅ Phase 2 Sign-off` 但无 Phase 3 标记 | Phase 3 |
| 有 `✅ Phase 3 Sign-off` 但无 Phase 4 标记 | Phase 4 |
| 有 `✅ Phase 4 Sign-off` 但无 Phase 5 标记 | Phase 5 |
| 有 `✅ Phase 5 Sign-off` | 已完成 |

## 五阶段流程

| # | 阶段 | 委托 | 产出 |
|---|------|------|------|
| 1 | 阅读工单 | **use zendesk-agent** → `zcli-ticket` 获取结构化工单数据 | 飞书文档：问题描述 |
| 2 | 调研分析 | **use codegraph/cssgraph** → 代码调研；**use browser-agent** → livesite 复现；**优先让用户对比 API 数据**（见下方调研策略） | 追加：根因 + 代码路径 |
| 3 | 代码编写 | 直接编辑代码文件 | 追加：方案 + 影响面 |
| 4 | 提交代码 | **git CLI** → 分支 + cherry-pick（在 `$BOBKAT_PATH` 下） | 追加：分支 + commit |
| 5 | 提交 MR | **use gitlab-agent** → `glab mr create` | 追加：MR 链接 |

每个 Phase 完成后：
1. 输出总结给用户
2. **等待用户 sign-off**（明确说"确认"或"OK"才继续）
3. Sign-off 后，**use feishu-agent** 将结果追加到飞书文档
4. 进入下一 Phase

## Phase 2 调研策略

详见 `workflows/phase2-investigate.md`。

## 环境配置

### .env 文件（gitignored）

```bash
BOBKAT_PATH=/Users/mack/Projects/bobcat
COMPONENT_KIT_PATH=/Users/mack/Projects/component-kit
```

复制 `.env.example` 为 `.env` 并填入实际路径。

## 飞书文档格式规范

飞书文档使用 Markdown 格式，每 Phase 追加一个 `## Phase N` 章节：

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

## Phase 2: 调研分析
- **调研策略**: ...
- **相关文件**: ...
- **根因**: ...
✅ Phase 2 Sign-off: 已确认

...
```

文档 URL 由 Phase 1 创建后记录，后续 Phase 复用。

## Sign-off 协议

每个 Phase 完成后：
1. 输出总结，包含关键决策点
2. 明确询问："Phase N 完成，请确认是否继续？（回复 OK 继续）"
3. 用户确认后，先通过 feishu-agent 追加飞书文档，再进入下一 Phase
4. 如用户提出修改意见，回到当前 Phase 的对应步骤

## 注意事项

- 本 agent 不直接使用 playwright-cli / lark-cli / glab / zcli-ticket 命令
- 需要工单数据 → `use zendesk-agent`
- 需要浏览器操作（Phase 2 livesite 复现）→ `use browser-agent`，命令在 `browser-agent/` 目录下执行（状态文件在此）
- **所有 playwright-cli 命令必须使用 `-s=ticket-agent`**（独立浏览器 session，不与 browser-agent 默认 session 冲突）
- 需要飞书操作 → `use feishu-agent`
- 需要 MR 操作 → `use gitlab-agent`
- Git 操作在 `$BOBKAT_PATH` 目录执行
- 跨机器时：提供飞书文档 URL，agent 自动读取当前进度
