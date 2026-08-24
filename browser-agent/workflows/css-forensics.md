# CSS Forensics — DOM Shape Cognition

When a CSS layout issue cannot be diagnosed from static code alone (flex fix failed, height chain suspicious, only appears in real rendering), use `cssprobe-cli` to get the **real DOM structure + computed values**, then cross-validate with cssgraph static analysis.

## When to use

- Layout bug reproduces in devtools but code review cannot pinpoint the root cause
- Height chain (height:100% / vh / auto) behaves unexpectedly
- `position:fixed` + percent height elements behave abnormally
- Scroll container (overflow-y:auto) does not scroll, or scrollbar does not appear
- Same CSS fix behaves inconsistently across scenarios (zoom, browser differences)
- Need to understand the full layout shape of a component tree (display, flex, position, sizing)

## Prerequisites

- `cssprobe-cli` installed globally: `npm install -g cssprobe-cli`
- Chromium browser installed: `npx playwright install chromium`

## Usage

### Basic inspection

```bash
# Auto-detect root element
cssprobe-cli inspect https://example.com

# With explicit selector
cssprobe-cli inspect https://example.com ".modal-body"

# JSON output (for programmatic consumption)
cssprobe-cli inspect https://example.com ".modal-body" --json
```

### Login-protected pages

```bash
# Import cookies from browser export (Netscape format)
cssprobe-cli state-import cookies.txt --out ~/.cssprobe-cli/states/mysite.json

# Interactive login
cssprobe-cli login https://mysite.com

# Inspect with state
cssprobe-cli inspect https://mysite.com/page ".target" --state ~/.cssprobe-cli/states/mysite.json
```

### Options

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

## Output interpretation

The report is unified Markdown with four sections:

### 1. Ancestor chain (root→html)

Each level shows:
- **Shape classification**: `[role scrollTag h:strategy w:strategy]`
  - Role: `block`, `flex-row`, `flex-col`, `fixed`, `absolute`, `sticky`, `grid`, `inline`
  - Strategy: `fixed` (px/vh/vw), `percent` (%), `viewport` (vh/vw), `content` (auto), `constrained` (max-height only), `calc`
- **Declared values**: `h:selector→value`, `w:selector→value`, `max-height:selector→value`
- **Computed dimensions**: `WxH`
- **CB markers**: `CB:transform/filter/...` (containing block hijack indicators)
- **Inline style**: `style="..."` if present

### 2. DOM tree (N levels deep)

Each node shows:
- `<tag#id.class>` with shape classification `[role scrollTag h:strategy w:strategy]`
- Layout props: `[position,display,h:height,w:width,maxH:...]`
- Metrics: `rect(WxH)` bottom=B scroll=client/scroll
- Flags:
  - `⚠viewport-overflow` / `⚠parent-overflow`
  - `⚠collapsed(0px)`: clientHeight=offsetHeight=0
  - `⚠overflow(N>M)but-overflow=X`: content overflows but clipped/not scrollable
  - `✔scrollable`: overflow works and content is scrollable
  - `CB:...`: containing block modifier
- Repeated structures aggregated as `×N` (1 representative + count)

### 3. Findings with confidence levels

Each finding carries a confidence level:

| Level | Meaning |
|-------|---------|
| **DEFINITE** | Based on computed values (facts from getComputedStyle) or accessible declared values |
| **INDEFINITE** | Declared value uses `%` — resolves at runtime |
| **UNVERIFIABLE** | Declared value missing or from blocked cross-origin stylesheet |

The report header shows: `confidence: DEFINITE 8 | INDEFINITE 0 | UNVERIFIABLE 1`

### 4. Shape analysis (6 dimensions)

**Shape chain**: Role + strategy summary for each ancestor level.

**Scroll analysis**: For each scroll container — scrollable, collapsed, content-sized (scrollHeight==clientHeight → never triggers).

**Height anchor**: Chain of height declarations — DEFINITE (absolute unit) / INDEFINITE (%) / UNVERIFIABLE (auto/none). Max-height only nodes flagged (cap ≠ anchor).

**Width anchor**: Same pattern for width declarations.

**Flex constraints**: Flex parent-child relationships — min-height:auto issues, flex-grow/shrink analysis.

**Containing block**: Nodes with transform/filter/perspective/will-change/contain declarations.

**Layout patterns**: Automatic detection of common patterns:
- `fixed ancestor + no height anchor → children % resolve to auto → content-sized overflow`
- `flex-col ancestor → children height governed by flex-grow/shrink/min-height`
- `scroll container exists but no height anchor above → overflow:auto never triggers`
- `all ancestors are content-sized → height depends entirely on content`

## Symptom → Assumption mapping

| Symptom (report flag) | Assumption | Fix direction |
|---|---|---|
| Scroll container `clientHeight=0` + `overflow=auto` + content overflows | Anchor issue: height chain all auto/% → collapsed to 0 | Give one level a definite height (e.g. `height:100vh`) |
| Scroll container content-sized (scrollHeight==clientHeight) but overflows viewport | Anchor issue: content expands instead of constrained height | Same as above, or add `min-height:0` in flex layout (constraint issue) |
| Overflow but `overflow=hidden` clips | Anchor issue or parent overflow mis-set | Check if clip point should scroll |
| Chain has `CB:transform` + fixed root node | **Containing block hijack**: % height resolves against transform ancestor | Use viewport units (vh) or remove transform |
| Flex child breaks container | Constraint issue: `min-height:auto` default | Add `min-height:0` to child |
| `fixed` role + `h:percent` + no height anchor | Fixed overlay with percent height → depends on containing block | Add `height:100vh` or use viewport units |
| `flex-col` role + children with `h:content` | Flex column with content-sized children → height depends on flex properties | Check flex-grow/shrink/min-height declarations |
| All ancestors `h:content` | Entire chain is content-sized → no constraints propagate | Give one level a definite height |

## Integration with cssgraph_diagnose

After running cssprobe-cli, pass the ancestor chain to cssgraph for static analysis:

```bash
cssgraph diagnose ".version-history" "div.editor-root" "div.s-kit-modal" "div.s-kit-modal-body" "div.version-history"
```

cssgraph_diagnose provides:
- Static declaration analysis (what the stylesheet says vs what the browser computed)
- File:line locations for each rule
- Pattern detection from CSS rules alone (no runtime needed)

**When cssprobe-cli and cssgraph conflict**: trust cssprobe-cli (runtime truth) and record in the ticket.

## Verification checklist

- Report is self-consistent: anchor check and overflow findings should corroborate each other
- After fix, re-run cssprobe-cli — scroll container should show `✔scrollable` and chain should have a definite anchor
- Real editor verification: open version history dialog in striking.ly editor, run cssprobe-cli, confirm report matches test page conclusions
- If cssgraph_diagnose shows UNVERIFIABLE levels, cssprobe-cli is the ground truth

## Test matrix (dom-report-test.html, local http server)

| Scenario | Construction | Expected finding |
|---|---|---|
| Collapse signature | fixed modal + transform ancestor (CB hijack) | All chain 0px, clientHeight=0, `CB:transform` marker, pattern: fixed+no-anchor |
| Content-sized signature | relative modal, no definite ancestor height | Content-sized chain (2264px), scrollHeight==clientHeight → "never triggers" |
| Flex control | flex:1 + overflow-y:auto child | `✔scrollable` (normal) |
| Flex constraint signature | flex child without overflow → min-height:auto breaks parent | Overflows parent but not scroll container → constraint candidate |
| Fix verification | Same collapse + height:100vh anchor | `✔scrollable` + anchor check finds absolute-unit declaration |

## Limitations

- Requires an interactive browser session (login state)
- `file://` protocol: some computed values unreliable — use local http server for test pages
- Cross-origin stylesheet blocking: declared values from blocked sheets are marked UNVERIFIABLE
- Static cssgraph analysis cannot know real DOM structure / transform hijacking / runtime resolution — UNVERIFIABLE is the fallback confidence
