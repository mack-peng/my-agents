---
name: cssgraph
description: >
  CSS intelligence for AI coding agents. Use cssgraph BEFORE grep/Read for
  any CSS question: finding where a class is defined, checking cascade
  conflicts, assessing CSS change impact, identifying dead CSS, or searching
  selectors by property value. Only active when a .cssgraph/ directory exists
  at the project root.
metadata:
  requires:
    bins: ["cssgraph"]
---

# cssgraph — CSS Intelligence Skill

Use this skill whenever you need to understand, modify, refactor, or clean up
CSS in an indexed project. cssgraph is a pre-built knowledge graph of every
className, property, and style dependency — one tool call replaces grep + Read
loops.

## Prerequisite Check

Before using any cssgraph tool, verify a `.cssgraph/` directory exists at the
project root. If missing, skip cssgraph entirely — indexing is the user's
decision. Notify them: "This project isn't indexed. Run `cssgraph init` to
enable CSS intelligence."

## Tool Selection Guide

Use the decision tree below. **cssgraph_explore is the primary tool** — it
answers most CSS questions in a single call. Only reach for other tools when
explore isn't sufficient.

### Primary: cssgraph_explore

Use FIRST for:
- "What is .btn-primary? Show me all its styles."
- "What overrides .header and what does .header override?"
- "Which JSX files reference .card?"

Returns: className definitions grouped by file, sorted by specificity
(descending), with full properties, overrides chain, caller list, and source
context snippets.

⚠️ **Not suitable for:** composite selectors (`.a.b`, `.a > .b`). Use
**cssgraph_rule** for those.

### When explore isn't enough

| Your question | Use |
|---|---|
| "What files would break if I rename .btn?" | **cssgraph_impact** ⚠️ Only tracks the first FTS5-ranked match — if the class appears in multiple files, the radius may be incomplete |
| "What's the full impact of `.sidebar .nav a.active`?" | **cssgraph_rule** — handles composite selectors with loose/strict file impact |
| "Which JSX components reference .btn?" | **cssgraph_callers** ⚠️ Same single-match limitation as impact |
| "Show me the cascade chain for .title" | **cssgraph_cascade** — lists all definitions ordered by specificity, with overrides ⚠️ Override edges are intra-file only |
| "Are there class selectors nobody references?" | **cssgraph_unused** ⚠️ May report false positives: HTML/ERB/Haml references might not be indexed |
| "Which selectors use display:flex?" | **cssgraph_property** — prefix search by default; use exact mode for literal match |
| "Where exactly is `.btn-primary` defined?" | **cssgraph_details** — O(1) exact match. No results? Fall back to **cssgraph_search** |
| "Is there a class named something like btn-*?" | **cssgraph_search** — fuzzy name search |
| "Which code files use ALL classes in `.foo.bar`?" | **cssgraph_impact_selector** — strict (all classes) and loose (any class) impact |
| "Why doesn't this scroll container scroll?" | **cssgraph_diagnose** — static shape diagnosis: classifies height/width declarations as DEFINITE/INDEFINITE/UNVERIFIABLE along the ancestor chain, detects layout patterns |
| "What style files exist in this project?" | **cssgraph_files** |
| "Is the index healthy and up to date?" | **cssgraph_status** |

### Lightweight fallback (no MCP / task-tool subagents)

When cssgraph MCP tools are unavailable, use the CLI:

```bash
cssgraph explore "<class-name>"    # same output as cssgraph_explore
cssgraph rule ".a .b"              # same as cssgraph_rule
cssgraph details ".btn"            # same as cssgraph_details
cssgraph diagnose ".target" ".a .b" ".a .c"  # static shape diagnosis
cssgraph status                    # same as cssgraph_status
```

### projectPath parameter

All MCP tools accept an optional `projectPath` — use it to query a different
indexed project. Omit to auto-detect from the current working directory.

## Three Core Workflows

### 1. Understand a class

```
cssgraph_explore(query=".btn-primary")
  → shows: definition, properties, specificity, overrides chain, callers
  → follow-up: cssgraph_cascade(className="btn-primary") for full cascade path
```

### 2. Safe CSS refactoring

```
1. cssgraph_explore(query=".btn") to understand the current rule
2. cssgraph_impact(className="btn") to see affected files
3. cssgraph_rule(selector=".btn") for composite impact
4. cssgraph_callers(className="btn") to see JSX references
5. cssgraph_impact_selector(selector=".btn") for code-file-only impact
```

### 3. Dead CSS cleanup

```
1. cssgraph_unused(limit=50) to find potentially unused classes
2. For each candidate: cssgraph_explore(query=".unused-class") to double-check
3. cssgraph_rule(selector=".unused-class") to confirm zero impact
```

⚠️ **The unused tool can produce false positives.** A class may be used in
HTML/ERB/Haml templates, dynamically generated, or referenced by unindexed
files. Always verify with explore before deleting.

### 4. CSS layout debugging (scroll/height issues)

When a scroll container doesn't scroll, a dialog collapses to 0px, or
height:100% doesn't work as expected:

```
1. Run dom-report.js (browser-agent scripts/dom-report.js) to get runtime shape
2. Pass the ancestor chain to cssgraph_diagnose for static analysis:
   cssgraph_diagnose(className=".version-history",
     chain=[".wrapper .modal", ".wrapper .modal-body", ".wrapper .version-history"])
3. Compare: dom-report.js = runtime truth, cssgraph_diagnose = static rules
```

**Key:** Pass full descendant selectors (e.g. `.wrapper .modal`) for precise
matching — avoids false matches from unrelated dialogs. When dom-report.js and
cssgraph conflict, trust dom-report.js (runtime truth).

⚠️ **Static limitation:** cssgraph_diagnose cannot know the real DOM structure
or runtime resolution. UNVERIFIABLE levels require dom-report.js verification.

## Cross-tool Patterns

- **Composite selectors always use rule.** `.a.b`, `.a > .b`, `.a + .b`
  are NOT single classNames. explore and impact won't handle them correctly.
- **Verify with explore after rule.** rule tells you which files are affected;
  explore tells you what the class actually looks like.
- **Check status after editing CSS.** cssgraph auto-syncs changes, but the
  staleness banner in tool responses tells you which files are pending
  re-index. Use cssgraph_status to confirm.
- **CSS modules hashed names** are resolved automatically by rule and details.
  If a hashed name isn't resolving, the source map may be missing.
- **Node IDs survive property edits** (based on sha256 of filePath:selector:className,
  not line numbers), so references edges persist across minor style tweaks.

## Anti-patterns

- Don't grep for classNames — cssgraph IS the index
- Don't re-verify cssgraph results with Read
- Don't use explore for composite selectors
- Don't trust unused results without verification
- Don't assume impact covers all instances of a multi-file className
