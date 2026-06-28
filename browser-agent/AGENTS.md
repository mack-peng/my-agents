# Browser Agent

This directory is configured for browser automation using `playwright-cli` and Playwright testing.

## Environment

- `playwright-cli`: Installed globally via npm
- Default browser: Chromium (use `--browser=firefox` or `--browser=webkit` to switch)
- Run `playwright-cli --help` for full command list

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
| `playwright-cli pause-at <location>` | Run test and pause at `file:line` | |
| `playwright-cli resume` | Resume test execution | |
| `playwright-cli step-over` | Step over next test call | |
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

## Playwright Test Framework Concepts

CLI commands for running tests:
```
npx playwright test [options] [test-filter...]
npx playwright test --headed
npx playwright test --project=chromium
npx playwright test --ui
npx playwright test --debug
npx playwright test --workers=1
npx playwright test -g "test title"
npx playwright test --last-failed
npx playwright test --shard=1/3
```

### Configuration (`playwright.config.ts`)
```ts
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 720 },
    // storageState: 'auth.json',  - for authentication
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Core API

**Locators** (preferred way to find elements):
- `page.getByRole('button', { name: 'Submit' })`
- `page.getByText('Hello')`
- `page.getByLabel('Email')`
- `page.getByPlaceholder('Enter name')`
- `page.getByTestId('login-button')`
- `page.getByTitle('Close')`
- `page.getByAltText('logo')`
- `page.locator('.class')` / `page.locator('#id')`
- `page.locator('css=...')` / `page.locator('xpath=...')`
- `locator.filter({ hasText: '...' })` / `locator.first()` / `locator.last()` / `locator.nth(n)`
- `page.frameLocator('#frame').getByRole('...')` - for iframes

**Actions** (auto-wait for actionability):
```ts
await locator.click()
await locator.fill('text')
await locator.type('text')       // types character by character
await locator.check() / .uncheck()
await locator.selectOption('value')
await locator.hover()
await locator.dragTo(target)
await locator.focus()
await locator.press('Enter')
await locator.setInputFiles('file.txt')
```

**Assertions** (async - automatically retry until condition met):
```ts
await expect(locator).toBeVisible()
await expect(locator).toBeHidden()
await expect(locator).toBeChecked()
await expect(locator).toBeEnabled()
await expect(locator).toBeDisabled()
await expect(locator).toHaveText('exact text')
await expect(locator).toContainText('partial')
await expect(locator).toHaveValue('value')
await expect(locator).toHaveCount(3)
await expect(locator).toHaveAttribute('href', '/path')
await expect(page).toHaveTitle(/Playwright/)
await expect(page).toHaveURL('**/login')
await expect(page).toHaveScreenshot()
await expect(locator).toHaveScreenshot()
```

**Test Annotations:**
```ts
test.skip('reason')              // skip test
test.fail()                      // expect failure
test.fixme()                     // skip + mark as failing
test.slow()                      // triple timeout
test.only()                      // run only this test
test.describe('group', () => {}) // group tests
// Tags: @fast, @slow
test('login @fast', async () => {})
```

---

## Playwright Documentation Structure

### Getting Started (7 pages)
| Page | Key Content |
|------|-------------|
| Installation | `npm init playwright@latest`, browsers install, project scaffold, `playwright.config.ts` |
| Writing tests | Actions + assertions, first test, test isolation, hooks (`beforeEach/afterEach`) |
| Generating tests | `npx playwright codegen`, record interactions, generate locators, emulation |
| Running & debugging | `--headed`, `--project`, `--last-failed`, `--ui`, `--debug`, `-g` filter |
| Trace viewer | `trace: 'on-first-retry'`, HTML report (`npx playwright show-report`), DOM snapshots |
| Setting up CI | GitHub Actions workflow, artifact upload, retry on CI |
| VS Code | Extension, run/debug via sidebar, CodeGen, AI fix with Copilot, Trace Viewer |

### Playwright Test (18 pages)
| Page | Key Content |
|------|-------------|
| Agents | Planner (test plan), Generator (code), Healer (auto-repair) |
| Annotations | `skip/fail/fixme/slow/only`, tags `@fast`, `test.describe` |
| Command line | `npx playwright test [options]`, filter by file/line/title |
| Configuration | `testDir`, `fullyParallel`, `retries`, `workers`, `reporter`, `projects`, `webServer` |
| Configuration (use) | `baseURL`, `storageState`, emulation (`viewport/colorScheme/locale/timezoneId/geolocation`) |
| Emulation | Viewport, device (`...devices['iPhone 15']`), locale, timezone, geolocation, color scheme, permissions |
| Fixtures | Built-in (`page/browser/context`), custom fixtures, worker-scoped, `autouse`, timeout |
| Global setup/teardown | Project dependencies (setup/teardown projects), `globalSetup`/`globalTeardown` config |
| Parallelism | `workers` config, `fullyParallel`, sharding (`--shard=1/3`), `test.describe.serial` |
| Parameterize tests | Dynamic test generation with arrays of values |
| Projects | Multi-browser config, environments, dependencies (sequential execution), teardown |
| Reporters | HTML (default), Line, List, JSON, JUnit, Blob (merge), custom reporters |
| Retries | `retries` config, `test.flaky()`, `expect().toPass()` |
| Sharding | `--shard=x/y` for CI parallelization across machines |
| Timeouts | Test timeout, expect timeout, global timeout (config or CLI overrides) |
| TypeScript | `@ts-check`, tsconfig path resolution, type safety |
| UI Mode | `--ui`, watch mode, locator picker, time travel, step-by-step trace |
| Web server | `webServer` config: command, url, port, `reuseExistingServer` |

### Guides (40+ pages)
| Page | Key Content |
|------|-------------|
| Library | `chromium.launch()`, `browser.newPage()` for scripting vs testing |
| Accessibility testing | `page.accessibility.snapshot()`, `page.accessibility.getAXTree()` |
| Actions | click, fill, type, check, selectOption, hover, drag, focus, press, scroll, upload |
| Assertions | async matchers (visible, text, value, etc.), generic matchers, custom matchers |
| API testing | `page.request.get()/post()/put()/delete()`, `APIResponse` assertions |
| Authentication | `storageState` for login reuse, `context.addCookies()`, API-based auth |
| Auto-waiting | Actionability checks: visible, enabled, stable, not detached, not obscured |
| Best Practices | Web-first assertions, proper locators, avoid `$`/`$$`, no manual waits, POM |
| Browsers | Chromium/Firefox/WebKit, channels (Chrome/Edge/Firefox Stable), `npx playwright install` |
| Chrome extensions | Launch with extension path, test extension UI |
| Clock | `page.clock.fastForward()`, `page.clock.install()`, `page.clock.pauseAt()` |
| Components (exp) | `test.mount()` for React/Vue/Svelte component testing |
| Debugging Tests | `--debug`, Playwright Inspector, `page.pause()`, VS Code breakpoints |
| Dialogs | `page.on('dialog')`, `dialog.accept()/dismiss()`, alert/confirm/prompt |
| Downloads | `page.waitForEvent('download')`, `download.saveAs()`, `download.path()` |
| Evaluating JS | `page.evaluate()`, `page.evaluateHandle()`, passing args, JSHandle |
| Events | `page.on()`, `page.waitForEvent()`, request/response/popup/console events |
| Extensibility | Custom fixtures, custom reporters, custom matchers (`expect.extend()`) |
| Frames | `page.frame()`, `frameLocator()`, cross-frame element location |
| Handles | JSHandle, ElementHandle, `handle.$()`, `handle.evaluate()` |
| Isolation | `browser.newContext()`, per-test isolation, multi-page within context |
| Locators | `getByRole/Text/Label/Placeholder/TestId/Title/AltText`, `locator()` with CSS |
| Mock APIs | `page.route()` to intercept/fulfill/abort requests |
| Mock browser APIs | `context.grantPermissions()`, geolocation mocking |
| Navigations | `page.goto()`, lifecycle (`load/domcontentloaded/networkidle`), `page.waitForURL()` |
| Network | HTTP auth, modify request/response, network throttling, `page.unroute()` |
| Other locators | CSS selectors, XPath selectors |
| Pages | `browser.newPage()`, `context.newPage()`, multi-page, popup handling |
| Page object models | Encapsulate page logic in classes, inject via fixtures |
| Screenshots | `page.screenshot()` full page/clip/mask, `locator.screenshot()`, `--update-snapshots` |
| Service Workers | Intercept with `page.route()`, test SW behavior |
| Snapshot testing | `expect(locator).toMatchAriaSnapshot()` (ARIA tree comparison) |
| Test generator | Codegen deep dive: record, assertions, locator picker, emulation |
| Touch events (legacy) | `page.touchscreen.tap()` |
| Trace viewer | `trace: on/off/retain-on-failure/on-first-retry`, viewing DOM snapshots, network, console |
| Videos | `context.video()`, `video.saveAs()`, `video.path()` |
| Visual comparisons | `toHaveScreenshot()`, pixel matching, snapshot file management |
| WebView2 | Microsoft Edge WebView2 testing |

### Migration, Integrations, Languages
| Page | Key Content |
|------|-------------|
| Migrate from Protractor | Guide for Protractor-to-Playwright migration |
| Migrate from Puppeteer | Guide for Puppeteer-to-Playwright migration |
| Migrate from Testing Library | Guide for Testing Library migration |
| Docker | `mcr.microsoft.com/playwright` Docker images |
| Continuous Integration | CI setup for GitHub Actions, Azure, Jenkins, etc. |
| Selenium Grid (exp) | Connect Playwright to Selenium Grid |
| Supported languages | JS/TS (Node.js), Python, Java, .NET |

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

## Zendesk Workflow

Zendesk 会话已持久化到 `zendesk.state.json`。当用户说以下任意自然语言指令时，执行对应的操作：

| 用户指令 | 操作 |
|---------|------|
| "打开 Zendesk" / "打开工单" / "打开 Zendesk 工单" | `close` → `open https://strikingly.zendesk.com --headed` → `state-load zendesk.state.json` → `goto https://strikingly.zendesk.com/agent/tickets/26500992` → `snapshot` |
| "打开工单 26500992" (或其它工单号) | 同上，goto 对应工单 URL |

流程：
1. `playwright-cli open https://strikingly.zendesk.com --headed`
2. `playwright-cli state-load zendesk.state.json`
3. `playwright-cli goto https://strikingly.zendesk.com/agent/tickets/<ticket_id>`
4. `playwright-cli snapshot` (展示页面)

## SXL Zendesk Workflow

SXL Zendesk 会话已持久化到 `sxl.zendesk.state.json`。当用户提供一个 `https://sxl.zendesk.com/agent/tickets/<ticket_id>` 链接时，执行以下操作：

流程：
1. `playwright-cli open https://sxl.zendesk.com --headed`
2. `playwright-cli state-load sxl.zendesk.state.json`
3. `playwright-cli goto <用户提供的工单URL>`
4. `playwright-cli snapshot` (获取页面结构)
5. `playwright-cli eval "() => document.title"` (获取页面标题)
6. 阅读 snapshot、console 输出，理解工单内容，整理并总结给用户

## Dify Workflow

Dify 会话已持久化到 `dify.state.json`。当用户说以下任意自然语言指令时，执行对应的操作：

| 用户指令 | 操作 |
|---------|------|
| "打开 Dify" / "打开 Dify Studio" | `close` → `open https://dify.orangemust.com --headed` → `state-load dify.state.json` → `snapshot` |

流程：
1. `playwright-cli open https://dify.orangemust.com --headed`
2. `playwright-cli state-load dify.state.json`
3. `playwright-cli snapshot` (展示页面)

---

## 通用规范

### 链接处理
- 用户提供的链接，**默认使用浏览器工具打开**
- 使用 `playwright-cli tab-new <url>` 在新标签页打开
- 如果需要阅读内容，使用 `playwright-cli snapshot` 捕获页面内容
- 使用 `playwright-cli console` 检查控制台错误

### 阅读页面内容
- 使用 `playwright-cli snapshot` 获取页面结构化快照
- 使用 `playwright-cli eval <js>` 执行 JavaScript 获取特定数据
- 使用 `playwright-cli requests` 查看网络请求

---

## References 参考文档

整理自浏览器抓取的外部文档，存放在 `references/` 下。

| 文件 | 来源 | 内容 |
|------|------|------|
| `references/Opnform-Use-Doc.md` | https://docs.opnform.com | OpnForm 技术文档全量整理（25 篇页面） |

### OpnForm 文档索引 (`references/Opnform-Use-Doc.md`)

| 分组 | 章节 | 源 URL |
|------|------|--------|
| Get Started | Introduction | `/introduction` |
| Get Started | Tech Stack | `/tech-stack` |
| Features | Computed Variables | `/features/computed-variables` |
| Deployment | Docker Deployment | `/deployment/docker` |
| Deployment | Docker Development Setup | `/deployment/docker-development` |
| Deployment | Local Deployment | `/deployment/local-deployment` |
| Deployment | Cloud vs Self-Hosting | `/deployment/cloud-vs-self-hosting` |
| Deployment | Self-hosted License | `/deployment/self-hosted-license` |
| Deployment | License Activation | `/deployment/license-activation` |
| Enterprise | Workspace Custom SMTP | `/deployment/enterprise-features/workspace-custom-smtp` |
| Enterprise | Single Sign-On | `/deployment/enterprise-features/single-sign-on` |
| Enterprise | Multiple Workspaces & Team Roles | `/deployment/enterprise-features/multiple-workspaces` |
| Enterprise | White Label & Advanced Branding | `/deployment/enterprise-features/white-label-branding` |
| Enterprise | Custom Code | `/deployment/enterprise-features/custom-code` |
| Enterprise | Audit Logs | `/deployment/enterprise-features/audit-logs` |
| Enterprise | External Storage | `/deployment/enterprise-features/external-storage` |
| Configuration | Environment Variables | `/configuration/environment-variables` |
| Configuration | OAuth Integration Setup | `/configuration/oauth-setup` |
| Configuration | AWS S3 Configuration | `/configuration/aws-s3` |
| Configuration | Email Setup | `/configuration/email-setup` |
| Configuration | Using your own domain | `/configuration/custom-domain` |
| Configuration | Subdomain Redirect | `/configuration/subdomain-redirect` |
| Configuration | OIDC SSO Configuration | `/configuration/oidc-sso` |
| Configuration | Disable Two-Factor Authentication | `/configuration/disable-2fa` |
| Embedding | JavaScript SDK | `/embedding/javascript-sdk` |

---
