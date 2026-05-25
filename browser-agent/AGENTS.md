# Browser Agent

This directory is configured for browser automation using `playwright-cli` and Playwright testing.

## Environment

- `playwright-cli`: Installed at `/Users/mack/.nvm/versions/node/v24.1.0/bin/playwright-cli`
- Default browser: Chromium (use `--browser=firefox` or `--browser=webkit` to switch)
- Run `playwright-cli --help` for full command list

## playwright-cli Quick Reference

### Opening & Navigation
| Command | Description |
|---------|-------------|
| `playwright-cli open <url>` | Open browser and navigate to URL (headless) |
| `playwright-cli open <url> --headed` | Open browser with visible window |
| `playwright-cli goto <url>` | Navigate current page to URL |
| `playwright-cli close` | Close current page |
| `playwright-cli go-back` | Navigate back |
| `playwright-cli go-forward` | Navigate forward |
| `playwright-cli reload` | Reload current page |

### Element Interaction
| Command | Description |
|---------|-------------|
| `playwright-cli click <ref>` | Click element by ref or selector |
| `playwright-cli type <text>` | Type text into focused/editable element |
| `playwright-cli fill <ref> <text>` | Fill text (clear + type) |
| `playwright-cli check <ref>` | Check checkbox/radio |
| `playwright-cli uncheck <ref>` | Uncheck checkbox |
| `playwright-cli select <ref> <value>` | Select dropdown option |
| `playwright-cli hover <ref>` | Hover over element |
| `playwright-cli drag <startRef> <endRef>` | Drag and drop |

### Targeting Elements
- **Ref from snapshot**: `playwright-cli click e15`
- **CSS selector**: `playwright-cli click "#main > button.submit"`
- **Role selector**: `playwright-cli click "role=button[name=Submit]"`
- **Chain selectors**: `playwright-cli click "#footer >> role=button[name=Submit]"`

### Screenshots & Snapshots
| Command | Description |
|---------|-------------|
| `playwright-cli snapshot` | Capture page snapshot with element refs |
| `playwright-cli screenshot` | Take viewport screenshot |
| `playwright-cli screenshot <ref>` | Screenshot specific element |
| `playwright-cli pdf` | Save page as PDF |

### Keyboard & Mouse
| Command | Description |
|---------|-------------|
| `playwright-cli press <key>` | Press a key (Enter, ArrowLeft, Tab, etc.) |
| `playwright-cli keydown <key>` | Key down |
| `playwright-cli keyup <key>` | Key up |
| `playwright-cli mousemove <x> <y>` | Move mouse |
| `playwright-cli mousedown [button]` | Mouse button down |
| `playwright-cli mouseup [button]` | Mouse button up |
| `playwright-cli mousewheel <dx> <dy>` | Scroll |

### Tabs
| Command | Description |
|---------|-------------|
| `playwright-cli tab-list` | List all tabs |
| `playwright-cli tab-new [url]` | Create new tab |
| `playwright-cli tab-select <index>` | Switch to tab |
| `playwright-cli tab-close [index]` | Close tab |

### Network
| Command | Description |
|---------|-------------|
| `playwright-cli requests` | List network requests since page load |
| `playwright-cli request <num>` | Show full request details |
| `playwright-cli route <pattern> [opts]` | Mock network requests |
| `playwright-cli route-list` | List active routes |
| `playwright-cli unroute [pattern]` | Remove routes |

### Storage
| Command | Description |
|---------|-------------|
| `playwright-cli state-save [filename]` | Save cookies + localStorage |
| `playwright-cli state-load <filename>` | Load saved state |
| `playwright-cli cookie-list` | List cookies |
| `playwright-cli cookie-get <name>` | Get cookie value |
| `playwright-cli cookie-set <name> <val>` | Set cookie |
| `playwright-cli cookie-delete <name>` | Delete cookie |
| `playwright-cli cookie-clear` | Clear all cookies |
| `playwright-cli localstorage-list` | List localStorage keys |
| `playwright-cli localstorage-get <key>` | Get localStorage value |
| `playwright-cli localstorage-set <k> <v>` | Set localStorage |
| `playwright-cli localstorage-delete <key>` | Delete localStorage key |
| `playwright-cli localstorage-clear` | Clear all localStorage |

### DevTools
| Command | Description |
|---------|-------------|
| `playwright-cli console [min-level]` | List console messages |
| `playwright-cli eval <func> [ref]` | Evaluate JS on page |
| `playwright-cli run-code <code>` | Run Playwright code snippet |
| `playwright-cli tracing-start` | Start trace recording |
| `playwright-cli tracing-stop` | Stop trace recording |
| `playwright-cli video-start` | Start video recording |
| `playwright-cli video-stop` | Stop video recording |

### Sessions
| Command | Description |
|---------|-------------|
| `playwright-cli -s=<name> open <url>` | Open in named session |
| `playwright-cli list` | List all sessions |
| `playwright-cli close-all` | Close all browsers |
| `playwright-cli kill-all` | Kill all browser processes |
| `playwright-cli show` | Open monitoring dashboard |

### Browser Options
| Option | Description |
|--------|-------------|
| `--headed` | Show browser window |
| `--browser=chrome/firefox/webkit/msedge` | Choose browser |
| `--persistent` | Save browser profile to disk |
| `--config <path>` | Config file path |

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
playwright-cli state-save session.json
# Later:
playwright-cli state-load session.json
```
