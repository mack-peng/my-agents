---
name: cssprobe-cli
description: >
  Runtime CSS probe for layout/scroll/overflow inspection. Use cssprobe-cli to
  diagnose CSS issues in live browsers — height chains, scroll containers,
  overflow, flex constraints, containing block hijacks. Produces structured
  reports with DEFINITE/INDEFINITE/UNVERIFIABLE confidence levels.
metadata:
  requires:
    bins: ["cssprobe-cli", "playwright"]
---

# cssprobe-cli -- Runtime CSS Probe Skill

Use cssprobe-cli to inspect the runtime CSS of any web page. It launches a real
browser, captures computed styles and DOM structure, and produces a structured
report with confidence levels.

## Prerequisite: Browser Installation

Before first use, install Chromium:

```bash
npx playwright install chromium
```

Verify: `cssprobe-cli status`

## Command Discovery

Do NOT memorize all commands. Use:

```bash
cssprobe-cli --help                    # all commands grouped by category
cssprobe-cli inspect --help            # specific command: args, options, description
cssprobe-cli state-import --help       # cookie import command
```

## Core Workflow: Inspect a Page

cssprobe-cli is session-based: `open` starts a browser daemon, then
`inspect` / `tree` / `layout` / `findings`
run against that session. Close the session with `close`.

```bash
# 1. Open a page in a browser session
cssprobe-cli open https://getbootstrap.com/docs/5.3/examples/checkout

# 2. Inspect with an explicit selector
cssprobe-cli inspect body

# 3. Auto-detect: when the page has modals/dialogs, "open" already picks a root
#    candidate, but inspect still needs a selector or auto-detection from candidates.
#    For diagnosis without a selector, use "findings" after open.

# 4. Close the session when done
cssprobe-cli close
```

For local HTML files:

```bash
cssprobe-cli open ./test.html
cssprobe-cli inspect ".container"
```

## Login-Protected Pages

Many pages require authentication. Two approaches:

### Option A: Import cookies from browser export

```bash
# 1. Export cookies from browser (Netscape format)
# 2. Import into cssprobe-cli
cssprobe-cli state-import cookies.txt --out ~/.cssprobe-cli/states/mysite.json

# 3. Open the session with the saved state
cssprobe-cli open https://mysite.com/page --state ~/.cssprobe-cli/states/mysite.json
cssprobe-cli inspect ".target"
```

### Option B: Interactive login

```bash
cssprobe-cli open https://mysite.com --headed
# Browser opens -> complete login manually

cssprobe-cli inspect .target
```

### Option C: Merge cookies into existing state

```bash
cssprobe-cli state-import new-cookies.txt --merge existing.json --out merged.json
```

## Session Mode (inspect multiple areas)

Open once, run as many inspections as you need, then close:

```bash
cssprobe-cli open https://mysite.com

cssprobe-cli tree .dialog-A               # DOM tree
cssprobe-cli layout .sidebar-B            # ASCII layout diagram
cssprobe-cli findings .modal              # Findings only
cssprobe-cli inspect .content --json      # JSON output
cssprobe-cli inject-css ".sidebar { background: red; }"  # inject CSS to test changes

cssprobe-cli close                         # stop browser + daemon
```

## Multi-step UI Flows

Beyond inspection, cssprobe-cli drives the page: click, hover, type, wait, and
run scripted flows -- all in the same session.

```bash
cssprobe-cli click ".layout-switch"            # real mouse click (auto-scroll + actionability wait)
cssprobe-cli click ".item" --nth 2             # 1-based match index; multi-match without --nth fails (strict)
cssprobe-cli hover ".menu-item"
cssprobe-cli type ".block-title input" "Hi" --press Enter    # fill by default
cssprobe-cli type ".editor" "text" --sequential --clear      # real key events for custom editors
cssprobe-cli wait-for ".modal" --state visible --timeout 5000
cssprobe-cli wait-for --js "() => ready === true"
cssprobe-cli wait-for --network-idle
```

### Scripted flows: `run <file>`

A flow script default-exports an async function receiving the API object and
runs inside the daemon session:

```js
export default async ({ page, click, hover, type, waitFor, inspect, screenshot, log }) => {
  await waitFor(".editor-canvas");
  await click(".layout-switch", { nth: 1 });
  await type(".block-title input", "Hello", { press: "Enter", sequential: true, clear: true });
  await waitFor({ networkIdle: true });
  const { findings } = await inspect(".block-grid", { format: "json" });
  await screenshot({ path: "./after.png" });
  return { findings: findings.length };
};
```

```bash
cssprobe-cli run ./flow.js        # --timeout ms (default 300000, 0 = unlimited)
```

Notes:

- Scripts run on your machine with full Node privileges -- only run trusted scripts.
- `screenshot` relative paths resolve against the script directory.
- On failure the command exits 1, prints collected logs, and keeps the session alive.

## Output Modes

Pass `--json` when consuming output programmatically:

```bash
cssprobe-cli inspect body --json
cssprobe-cli inspect body --json | jq `'.findings[] | {id, confidence, message}'`
```

Without `--json`, output is a Markdown report with ancestor chain,
DOM tree, and findings with confidence labels.

## Confidence Model

Every finding carries a confidence level:

| Level | Meaning |
|-------|---------|
| **DEFINITE** | Based on computed values (facts from getComputedStyle) or accessible declared values |
| **INDEFINITE** | Declared value uses `%` -- resolves at runtime |
| **UNVERIFIABLE** | Declared value missing or from blocked cross-origin stylesheet |

The report header shows: `confidence: DEFINITE 8 | INDEFINITE 0 | UNVERIFIABLE 1`

## inspect Options

```bash
cssprobe-cli inspect <selector> [options]

Arguments:
  <selector>                  CSS selector for the root element (required)

Options:
  --json                      Output structured JSON
  --brief                     Compact output: tree sketch + warnings/errors only
  --layout                    ASCII layout diagram showing element positions and sizes
  --depth <n>                 DOM tree depth (default: auto)
```

## open Options

```bash
cssprobe-cli open <url> [options]

Options:
  --browser <engine>          chromium|firefox|webkit (default chromium)
  --headed                    Show browser window
  --viewport <WxH>            Viewport size, e.g. 1280x720
  --state <file>              Load saved state (cookies + localStorage)
```

## state-import: Netscape Cookie Format

```bash
# From file
cssprobe-cli state-import cookies.txt --out mystate.json

# From file with custom name (saves to ~/.cssprobe-cli/states/<name>.json)
cssprobe-cli state-import cookies.txt --name mysite

# From stdin
cat cookies.txt | cssprobe-cli state-import --out mystate.json

# Merge into existing state
cssprobe-cli state-import new-cookies.txt --merge existing.json --out merged.json
```

Netscape format (tab-separated):

```
.example.com	TRUE	/	TRUE	1813025057	session_id	abc123
.example.com	TRUE	/	FALSE	-1	lang	zh-CN
```

## High-Frequency Workflows

### 1. Diagnose layout/scroll issues

```bash
# Inspect a specific component
cssprobe-cli open https://app.example.com/page
cssprobe-cli inspect ".modal-body"

# Get structured data for programmatic analysis
cssprobe-cli inspect ".modal-body" --json | jq `'.findings[]'`
```

### 2. Check if a page has overflow issues

```bash
# Open and analyze
cssprobe-cli open https://getbootstrap.com/docs/5.3/examples/checkout

# Look for findings with level "warning" or "error"
cssprobe-cli inspect body --json | jq `'.findings[] | select(.level != "info")'`
```

### 3. Inspect with authentication

```bash
# Import cookies first
cssprobe-cli state-import exported-cookies.txt --name app

# Then open the session with state
cssprobe-cli open https://app.example.com/dashboard --state ~/.cssprobe-cli/states/app.json
cssprobe-cli inspect ".main-panel"
```

## Anti-patterns

- Always use `--json` when consuming output programmatically.
- `viewport-overflow` flags on elements below the fold are normal for scrolling pages -- not bugs.
- Cross-origin stylesheet blocking is expected. Declared values from blocked sheets are
  marked UNVERIFIABLE. Computed values from getComputedStyle() are still accurate.
- Login state files contain cookies -- treat them as secrets.
