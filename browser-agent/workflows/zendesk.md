# Zendesk Workflow

## Strikingly Zendesk

Zendesk 会话已持久化到 `zendesk.state.json`。

| 用户指令 | 操作 |
|---------|------|
| "打开 Zendesk" / "打开工单" / "打开 Zendesk 工单" | `close` → `open https://strikingly.zendesk.com --headed` → `state-load zendesk.state.json` → `goto https://strikingly.zendesk.com/agent/tickets/26500992` → `snapshot` |
| "打开工单 26500992" (或其它工单号) | 同上，goto 对应工单 URL |

流程：
1. `playwright-cli open https://strikingly.zendesk.com --headed`
2. `playwright-cli state-load zendesk.state.json`
3. `playwright-cli goto https://strikingly.zendesk.com/agent/tickets/<ticket_id>`
4. `playwright-cli snapshot` (展示页面)

## SXL Zendesk

SXL Zendesk 会话已持久化到 `sxl.zendesk.state.json`。当用户提供一个 `https://sxl.zendesk.com/agent/tickets/<ticket_id>` 链接时，执行以下操作：

流程：
1. `playwright-cli open https://sxl.zendesk.com --headed`
2. `playwright-cli state-load sxl.zendesk.state.json`
3. `playwright-cli goto <用户提供的工单URL>`
4. `playwright-cli snapshot` (获取页面结构)
5. `playwright-cli eval "() => document.title"` (获取页面标题)
6. 阅读 snapshot、console 输出，理解工单内容，整理并总结给用户
