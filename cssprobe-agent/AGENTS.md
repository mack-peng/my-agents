# cssprobe-agent

Runtime CSS probe for layout/scroll/overflow inspection. Uses `cssprobe-cli` to analyze live pages in a browser.

## Environment

- `cssprobe-cli`: Installed globally via npm (`npm install -g cssprobe-cli`)
- Browser: Chromium (auto-discovered from Playwright cache)
- Run `cssprobe-cli --help` for full command list

## Quick Reference

### Inspection

```bash
# Inspect a page with explicit selector
cssprobe-cli inspect https://example.com ".main-content"

# Auto-detect root element
cssprobe-cli inspect https://example.com

# Local HTML file
cssprobe-cli inspect ./test.html ".container"

# JSON output (for programmatic consumption)
cssprobe-cli inspect https://example.com ".content" --json
```

### Login-Protected Pages

```bash
# Import cookies from browser export (Netscape format)
cssprobe-cli state-import cookies.txt --out ~/.cssprobe-cli/states/mysite.json

# Interactive login
cssprobe-cli login https://mysite.com

# Inspect with state
cssprobe-cli inspect https://mysite.com/page ".target" --state ~/.cssprobe-cli/states/mysite.json
```

### Configuration

```bash
cssprobe-cli config-show                 # Show current config
cssprobe-cli config-set <key> <value>    # Set config value
cssprobe-cli config-list                 # List all profiles
cssprobe-cli config-use <name>           # Switch active profile
cssprobe-cli config-new <name>           # Create new profile
cssprobe-cli config-path                 # Show config file path
```

## inspect Options

```bash
cssprobe-cli inspect <url> [selector] [options]

Arguments:
  <url>                       URL, file:// path, or local HTML file
  [selector]                  CSS selector for root (auto-detected if omitted)

Options:
  --json                      Output structured JSON
  --headed                    Show browser window
  --browser <engine>          chromium|firefox|webkit (default chromium)
  --zoom                      Run 1x/0.5x viewport diagnosis
  --depth <n>                 DOM tree depth (default 6)
  --max-nodes <n>             Node count cap (default 60)
  --up-to <tag>               Ancestor stop tag (default html)
  --state <file>              Load saved state (cookies + localStorage)
```

## Confidence Model

Every finding carries a confidence level:

| Level | Meaning |
|-------|---------|
| **DEFINITE** | Based on computed values (facts from getComputedStyle) or accessible declared values |
| **INDEFINITE** | Declared value uses `%` — resolves at runtime |
| **UNVERIFIABLE** | Declared value missing or from blocked cross-origin stylesheet |

The report header shows: `confidence: DEFINITE 8 | INDEFINITE 0 | UNVERIFIABLE 1`

## Output Modes

| Flag | Output | Use Case |
|------|--------|----------|
| (default) | Markdown report with ancestor chain, DOM tree, findings | Terminal viewing |
| `--json` | Structured JSON with snapshot, findings, confidence summary | Scripts, `jq` pipes, AI agent consumption |

## state-import: Netscape Cookie Format

```bash
# From file
cssprobe-cli state-import cookies.txt --out mystate.json

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

## Agent Skill

```bash
# Install skill for all detected agents
cssprobe-cli skill-install

# Install for a specific agent
cssprobe-cli skill-install --target opencode
cssprobe-cli skill-install --target claude

# Remove installed skills
cssprobe-cli skill-uninstall
```

## Global Options

```
--json              Output as JSON (default: Markdown)
--raw               Output raw result without formatting
--help [command]    Show help for a command or global
--version           Show version
-p, --profile       Use named config profile
```

## Common Workflows

### Diagnose layout/scroll issues

```bash
cssprobe-cli inspect https://app.example.com/page ".modal-body"
cssprobe-cli --json inspect https://app.example.com/page ".modal-body" | jq '.findings[]'
```

### Check for overflow issues

```bash
cssprobe-cli inspect https://example.com
cssprobe-cli --json inspect https://example.com | jq '.findings[] | select(.level != "info")'
```

### Inspect with authentication

```bash
cssprobe-cli state-import exported-cookies.txt --out ~/.cssprobe-cli/states/app.json
cssprobe-cli inspect https://app.example.com/dashboard ".main-panel" --state ~/.cssprobe-cli/states/app.json
```

## Reference

- **Repository**: https://github.com/mack-peng/cssprobe-cli
- **npm**: https://www.npmjs.com/package/cssprobe-cli
- **Documentation**: cssprobe-cli/docs/guide/installation.md
