# Dify Workflow

Dify 会话已持久化到 `dify.state.json`。

| 用户指令 | 操作 |
|---------|------|
| "打开 Dify" / "打开 Dify Studio" | `close` → `open https://dify.orangemust.com --headed` → `state-load dify.state.json` → `snapshot` |

流程：
1. `playwright-cli open https://dify.orangemust.com --headed`
2. `playwright-cli state-load dify.state.json`
3. `playwright-cli snapshot` (展示页面)
