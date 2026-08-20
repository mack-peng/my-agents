# Browser Agent

This directory is configured for browser automation using `playwright-cli` and Playwright testing.

## Environment

- `playwright-cli`: Installed globally via npm
- Default browser: Chromium (use `--browser=firefox` or `--browser=webkit` to switch)
- **本机未安装 Chrome**：`open` 不带 `--browser` 时可能尝试 Chrome 而报错，必须显式 `--browser=chromium`
- Run `playwright-cli --help` for full command list

### run-code 文件格式

`run-code --filename <file>` 的文件必须是一个**箭头函数表达式**（将被包装为 `await (async (page) => {...})(page)` 执行）：

```js
async (page) => {
  await page.goto('https://example.com');
  return 'done';
}
```

文件内**禁止**顶层 `const` / `module.exports` / IIFE — 会报 `SyntaxError`。需要 `setTimeout` 时用 `page.waitForTimeout(ms)`。

## playwright-cli Quick Reference (v0.1.13)

All commands: `playwright-cli <command> [args] [options]`
Named session: `playwright-cli -s=<name> <command> [args] [options]`
Global options: `--help [command]`, `--json`, `--raw`, `--version`

### Opening, Navigation & Page
| Command | Description | Options |
|---------|-------------|---------|
| `playwright-cli open [url]` | Open browser and navigate | `--browser=chrome/firefox/webkit/msedge`, `--headed`, `--persistent`, `--profile <path>`, `--config <path>` |
| `playwright-cli close` | Close the browser | |
| `playwright-cli goto <url>` | Navigate current page to URL | |
| `playwright-cli go-back` | Navigate back | |
| `playwright-cli go-forward` | Navigate forward | |
| `playwright-cli reload` | Reload current page | |
| `playwright-cli resize <w> <h>` | Resize browser window | |
| `playwright-cli attach [name]` | Attach to running browser | `--cdp <url>`, `--endpoint <url>`, `--extension[=browser]`, `--config <path>`, `--session <name>` |
| `playwright-cli detach` | Detach from attached browser | |
| `playwright-cli delete-data` | Delete session data | |

### Element Interaction
| Command | Description | Options |
|---------|-------------|---------|
| `playwright-cli click <target> [button]` | Click element | `--modifiers` (e.g. Shift, Control) |
| `playwright-cli dblclick <target> [button]` | Double-click element | `--modifiers` |
| `playwright-cli fill <target> <text>` | Clear + type into element | `--submit` (press Enter after) |
| `playwright-cli type <text>` | Type into focused element | `--submit` |
| `playwright-cli press <key>` | Press key (e.g. `Enter`, `ArrowLeft`, `Tab`) | |
| `playwright-cli keydown <key>` | Key down | |
| `playwright-cli keyup <key>` | Key up | |
| `playwright-cli select <target> <value>` | Select dropdown option | |
| `playwright-cli check <target>` | Check checkbox/radio | |
| `playwright-cli uncheck <target>` | Uncheck checkbox | |
| `playwright-cli hover <target>` | Hover over element | |
| `playwright-cli drag <startTarget> <endTarget>` | Drag and drop | |
| `playwright-cli drop <target>` | Drop files/data onto element | `--path <file>` (repeatable), `--data "mime/type=value"` (repeatable) |
| `playwright-cli upload <file>` | Upload file(s) | |

### Targeting Elements
- **Ref from snapshot**: `playwright-cli click e15`
- **CSS selector**: `playwright-cli click "#main > button.submit"`
- **Role selector**: `playwright-cli click "role=button[name=Submit]"`
- **Chain selectors**: `playwright-cli click "#footer >> role=button[name=Submit]"`

### Screenshots, Snapshots & PDF
| Command | Description | Options |
|---------|-------------|---------|
| `playwright-cli snapshot [target]` | Capture snapshot with element refs | `--filename`, `--depth <n>`, `--boxes` (include bounding boxes) |
| `playwright-cli screenshot [target]` | Take screenshot | `--filename`, `--full-page` |
| `playwright-cli pdf` | Save page as PDF | `--filename` |

### Mouse
| Command | Description |
|---------|-------------|
| `playwright-cli mousemove <x> <y>` | Move mouse to coordinates |
| `playwright-cli mousedown [button]` | Mouse button down (left/middle/right) |
| `playwright-cli mouseup [button]` | Mouse button up (left/middle/right) |
| `playwright-cli mousewheel <dx> <dy>` | Scroll |

### Dialogs
| Command | Description |
|---------|-------------|
| `playwright-cli dialog-accept [prompt]` | Accept dialog (optionally fill prompt text) |
| `playwright-cli dialog-dismiss` | Dismiss dialog |

### Tabs
| Command | Description |
|---------|-------------|
| `playwright-cli tab-list` | List all tabs |
| `playwright-cli tab-new [url]` | Create new tab |
| `playwright-cli tab-select <index>` | Switch to tab |
| `playwright-cli tab-close [index]` | Close tab (default: current) |

### Storage — State
| Command | Description |
|---------|-------------|
| `playwright-cli state-save [filename]` | Save cookies + localStorage to file |
| `playwright-cli state-load <filename>` | Load saved state from file |

### Storage — Cookies
| Command | Description | Options |
|---------|-------------|---------|
| `playwright-cli cookie-list` | List all cookies | `--domain`, `--path` |
| `playwright-cli cookie-get <name>` | Get cookie by name | |
| `playwright-cli cookie-set <name> <value>` | Set cookie with optional flags | `--domain`, `--path`, `--expires <unix_ts>`, `--httpOnly`, `--secure`, `--sameSite` |
| `playwright-cli cookie-delete <name>` | Delete cookie | |
| `playwright-cli cookie-clear` | Clear all cookies | |

### Storage — localStorage
| Command | Description |
|---------|-------------|
| `playwright-cli localstorage-list` | List all keys |
| `playwright-cli localstorage-get <key>` | Get value by key |
| `playwright-cli localstorage-set <key> <value>` | Set key-value |
| `playwright-cli localstorage-delete <key>` | Delete key |
| `playwright-cli localstorage-clear` | Clear all |

### Storage — sessionStorage
| Command | Description |
|---------|-------------|
| `playwright-cli sessionstorage-list` | List all keys |
| `playwright-cli sessionstorage-get <key>` | Get value by key |
| `playwright-cli sessionstorage-set <key> <value>` | Set key-value |
| `playwright-cli sessionstorage-delete <key>` | Delete key |
| `playwright-cli sessionstorage-clear` | Clear all |

### Network
| Command | Description | Options |
|---------|-------------|---------|
| `playwright-cli requests` | List network requests since page load | `--static` (include static resources), `--filter <regex>`, `--clear` |
| `playwright-cli request <index>` | Show full request/response details | `--filename` |
| `playwright-cli request-headers <index>` | Show request headers only | `--filename` |
| `playwright-cli request-body <index>` | Show request body only | `--filename` |
| `playwright-cli response-headers <index>` | Show response headers only | `--filename` |
| `playwright-cli response-body <index>` | Show response body (text inline, binary to file) | `--filename` |
| `playwright-cli route <pattern>` | Mock matching requests | `--status <code>`, `--body <text|json>`, `--content-type`, `--header "name: value"` (repeatable), `--remove-header <names>` (comma-sep) |
| `playwright-cli route-list` | List active routes | |
| `playwright-cli unroute [pattern]` | Remove routes (omit for all) | |
| `playwright-cli network-state-set <state>` | Set online/offline (`online` or `offline`) | |

### DevTools
| Command | Description | Options |
|---------|-------------|---------|
| `playwright-cli console [min-level]` | List console messages | `--clear` |
| `playwright-cli eval <func> [target]` | Evaluate JS on page/element | `--filename` |
| `playwright-cli run-code <code>` | Run Playwright code (receives `page`) | `--filename` (load from file) |
| `playwright-cli generate-locator <target>` | Generate Playwright locator for element | |
| `playwright-cli highlight [target]` | Show highlight overlay | `--hide`, `--style "css"` |
| `playwright-cli tracing-start` | Start trace recording | |
| `playwright-cli tracing-stop` | Stop trace recording | |
| `playwright-cli video-start [filename]` | Start video recording | `--size "WxH"` (e.g. `800x600`) |
| `playwright-cli video-stop` | Stop video recording | |
| `playwright-cli video-chapter <title>` | Add chapter marker to video | `--description`, `--duration <ms>` |
| `playwright-cli show` | Open Playwright Dashboard | `--port <n>`, `--host`, `--annotate`, `--kill` |

### Sessions
| Command | Description |
|---------|-------------|
| `playwright-cli -s=<name> open <url>` | Open in named session |
| `playwright-cli list` | List sessions (add `--all` for all workspaces) |
| `playwright-cli close-all` | Close all browsers |
| `playwright-cli kill-all` | Kill all browser processes (force) |

### Install & Browsers
| Command | Description | Options |
|---------|-------------|---------|
| `playwright-cli install` | Initialize workspace | `--skills claude` (default) or `agents` |
| `playwright-cli install-browser [browser]` | Install browser | `--with-deps`, `--dry-run`, `--list`, `--force`, `--only-shell`, `--no-shell` |

---

## Example Workflows

### Basic browse + screenshot
```bash
playwright-cli open https://example.com --headed
playwright-cli screenshot
playwright-cli close
```

### Fill and submit form
```bash
playwright-cli goto https://example.com/login
playwright-cli fill e5 "user@example.com"
playwright-cli fill e8 "password123"
playwright-cli click "role=button[name='Sign in']"
playwright-cli snapshot
```

### Extract page data
```bash
playwright-cli eval "() => document.title"
playwright-cli eval "() => Array.from(document.querySelectorAll('a')).map(a => a.href)"
```

### Network monitoring
```bash
playwright-cli goto https://example.com
playwright-cli requests
playwright-cli request 1
```

### Cookie management
```bash
playwright-cli cookie-set session_token abc123
playwright-cli cookie-set auth_token eyJ... --domain .example.com --path / --secure --expires 1811303292 --httpOnly --sameSite Lax
playwright-cli state-save session.json
# Later:
playwright-cli state-load session.json
```

---

## 通用规范

### 链接处理
- 用户提供的链接，**默认使用浏览器工具打开**
- 使用 `playwright-cli tab-new <url>` 在新标签页打开
- 如果需要阅读内容，使用 `playwright-cli snapshot` 捕获页面内容
- 不要截图
- 使用 `playwright-cli console` 检查控制台错误

### 阅读页面内容
- 使用 `playwright-cli snapshot` 获取页面结构化快照
- 使用 `playwright-cli eval <js>` 执行 JavaScript 获取特定数据
- 使用 `playwright-cli requests` 查看网络请求

---

## Workflow 索引

当用户的输入匹配以下触发条件时，**先 read 对应 workflow 文件**，理解流程后再执行。

| 触发条件 | 读取文件 |
|---------|---------|
| "打开 Zendesk" "打开工单" 或 `strikingly.zendesk.com/agent/tickets/` URL | `workflows/zendesk.md` |
| `sxl.zendesk.com/agent/tickets/` URL | `workflows/zendesk.md` |
| "打开 Dify" | `workflows/dify.md` |
| "帮我提MR" "提交 MR" "创建 MR" 或 `cd.i.strikingly.com/.../merge_requests/new` URL | `workflows/gitlab-mr.md` |
