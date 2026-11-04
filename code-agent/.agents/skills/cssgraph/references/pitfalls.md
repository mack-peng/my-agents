# cssgraph Tool Pitfalls & Boundaries

This reference documents the known edge cases and limitations of each cssgraph
tool. Read it when a result seems surprising or incomplete.

## cssgraph_explore

- **Composite selectors:** Returns incorrect results for `.a.b`, `.a > .b`,
  etc. Use cssgraph_rule instead.
- **Max 20 files:** Hard cap at 20 files regardless of maxFiles argument.
- **Source context reads from disk:** May fail silently if a file was deleted
  after indexing — source snippets will be omitted without warning.
- **Properties from `contains` edges:** If a class_selector node has no
  outgoing contains edges to css_property nodes (rare, happens with empty
  rule-sets), properties will show as empty.
- **Overrides are intra-file only:** The overrides/overridden-by sections only
  reflect relationships within the SAME file. Cross-file cascade priority is
  shown only via specificity ordering.

## cssgraph_impact

- **Single-first-result bias:** Uses FTS5 search with limit=1. If a className
  appears in multiple files, only the TOP-ranked match is analyzed. The impact
  radius may miss other definitions entirely.
- **BFS depth 3:** Traversal is capped at depth 3, both directions, all edge
  kinds. Some transitive dependencies may be omitted.
- **1000 node cap:** Default limit in GraphTraverser. Large codebases may hit
  this ceiling.

## cssgraph_callers

- **Same single-first-result bias as impact:** Only shows callers for the top
  FTS5-ranked className match.
- **Depth 2 traversal:** Only follows incoming references and contains edges
  up to depth 2. Deeply nested component hierarchies may be truncated.
- **JSX/TSX only:** Callers are identified via references edges, which come
  from JSX className extraction, view template extraction, and CSS Module
  resolution. Dynamic className usage (string concatenation, computed
  expressions) may not be tracked.

## cssgraph_cascade

- **Correctly finds ALL selectors:** Unlike impact and callers, cascade uses
  getClassSelectorsByName (case-insensitive) to find every matching selector.
- **Overrides are intra-file only:** The overrides and overriddenBy lists only
  reflect edges within the same file. Cross-file specificity conflicts are NOT
  represented as edges — the cascade ordering by specificity is still correct,
  but the "why" (which rule overrides which) may be incomplete for cross-file.
- **Properties from contains edges:** Same limitation as explore.

## cssgraph_rule

- **Contains match uses LIKE:** The "Related selectors" section uses SQL
  `LIKE '%classname%'` which may match substrings. Searching for `.btn`
  will also match `.btn-primary`, `.btn-danger`, etc.
- **CSS Module hashed names:** Resolved automatically via moduleHashMap built
  at index time. If the source map is missing, hashed names won't resolve.
- **Strict files capped at 20:** More results truncated with "...and N more".
  Use --json output for the full list.
- **Deduplication by filePath:line:selector key:** Prevents duplicate display
  but may hide legitimate cases where the same selector appears identically in
  the same file (duplicate rule-sets).

## cssgraph_impact_selector

- **Delegates to analyzeRule:** Same limitations as cssgraph_rule.
- **Code files only:** Filters results to .js/.jsx/.ts/.tsx/.es6 extensions.
  View templates (.erb/.haml/.html) are excluded, even if indexed.

## cssgraph_unused

- **FALSE POSITIVES:** A class selector is marked "unused" only when NO
  incoming references edge points to it. This means:
  - Classes used in HTML/ERB/Haml templates that weren't indexed
  - Classes used dynamically (document.createElement, innerHTML)
  - Classes in external systems (CMS, API responses)
  - All will show as unused even though they may be actively used.
- **Limit clamped:** Default 50, max 200. Results beyond the limit are not
  shown.
- **ALWAYS verify with explore before deleting.** Run cssgraph_explore on each
  candidate and check the "Referenced by" section.

## cssgraph_property

- **Prefix search (default):** Non-exact mode uses FTS5 prefix matching.
  Searching for "8" will match "8px", "8rem", "8%", "80%", etc.
- **Exact mode:** Use `exact: true` for literal value matching. This bypasses
  FTS5 entirely and uses direct index lookup on nodes.value.
- **Property filter:** When `property` is provided, adds a
  `lower(name) = lower(property)` constraint. Case-insensitive.
- **Parent resolution:** Each result resolves the parent class_selector via
  incoming contains edges. Only the first match is returned.

## cssgraph_details

- **Exact match only:** Uses `WHERE selector = ?` — no fuzzy matching.
  "No exact match" means the selector doesn't exist as-is. Fall back to
  cssgraph_search for fuzzy discovery.
- **CSS Module resolution:** Hashed names are resolved before matching.
- **Properties from node JSON or contains edges:** Prefers embedded JSON,
  falls back to edge traversal.

## cssgraph_diagnose

- **Static analysis only:** Cannot know the real DOM structure, computed values,
  or runtime resolution. UNVERIFIABLE levels require dom-report.js verification.
- **Multi-class precise matching:** When chain labels contain multiple classes
  (e.g. `.wrapper .modal`), uses containment search to find rules with ALL
  classes. Falls back to per-class name search if no containment results.
- **Single-class broad matching:** A label like `.s-kit-modal` matches ALL
  rules containing that class — may include unrelated dialogs. Use full
  descendant selectors for precision.
- **No DOM context:** Doesn't know which rules actually apply to a specific
  DOM element. A rule like `.s-kit-modal { height: 36px }` from crm.less
  may match even if the target element uses a different `.s-kit-modal` rule.
- **Height/width only:** Currently analyzes height, width, max-height,
  max-width, display, position, overflow, flex, containing block. Does not
  analyze margin, padding, grid, or other layout properties.

## cssgraph_search

- **FTS5 OR query:** Splits input on spaces and joins with OR. "btn primary"
  becomes `"btn" OR "primary"` — matches either term.
- **Hard limit 10:** Results are capped at 10. No pagination.
- **Returns locations only:** No properties, edges, or callers. Use explore
  for full context after identifying a candidate.

## Indexing Limitations

- **Parse errors are silent:** Style files that fail PostCSS parsing are
  skipped with a sentinel empty result. They appear in the files table but
  have zero class_selector or css_property nodes. The error log is at
  `.cssgraph/errors.log`.
- **Overrides are intra-file only:** Computed during per-file extraction.
  Cross-file specificity conflicts are NOT represented as override edges.
- **Node IDs survive property edits:** sha256(filePath:selector:className) is
  line-number independent. Changing property values keeps the same ID.
  Changing the selector string generates a new ID.
- **FTS5 triggers are deferred:** During bulk indexing, FTS5 triggers are
  dropped and rebuilt in one pass. Incremental syncs after the initial index
  use live triggers — SLOWER per-change but always accurate.
