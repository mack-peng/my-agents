# STRK Review Code Task

## Purpose

Review a self-hosted GitLab merge request against three sources of truth:

1. the synced product spec under `specs/`;
2. the implementation contract from the resolved code design source;
3. the actual MR diff and surrounding code.

The default deliverable is a local Chinese report. Publishing comments back to GitLab is a separate, user-confirmed phase.

## Context Scaling Invariant

MR review evidence may grow with requirement count, changed files, and guideline
checks on disk, but no single active agent context should need to load all
requirement bodies, all code-design sections, all full diffs, all guideline
evidence, or all requirement review cards at once.

Any review that touches multiple requirements, broad code areas, or both backend
and frontend guideline scopes must use bounded artifacts:

- `batch-plan.md` is the compact execution plan for broad reviews. It records
  batches, owning checkpoints, dependency order, batch caps, and batch
  readiness. It must not copy requirement bodies, long diff prose, or full
  guideline tables. A batch should usually cover at most 6 requirement or diff
  checkpoints, and should carry at most one broad shared dependency surface in
  its prerequisites; if that is still too broad, split again by repository,
  feature area, file group, symbol group, or execution path.
- `review-index.md` is the compact routing root. It records MR metadata, commit
  range, shard map, guideline scope, shard readiness, and summary counts. It
  must not copy requirement text, code-design prose, full diffs, long code
  snippets, worker narratives, or an unbounded requirement table. Requirement
  rows live in `index-shards/shard-N.md` when they exceed the root cap.
- `issue-registry.md` is the compact machine-readable issue root. It records
  issue summary counts, blocking issue ids, recently changed issue ids, and
  issue shard paths. Detailed issue blocks live in `issues/ISSUE-xxx.md` or
  `issue-shards/shard-N.md` when they exceed the root cap.
- `requirement-cards/<requirement-slug>.md` is the low-context review card for
  one requirement or one explicitly split requirement checkpoint. Target 40-80
  lines; treat 120 lines as the soft cap. If a card would exceed the cap, remove
  duplicated spec/design/diff prose first, then split the requirement checkpoint
  or write concise overflow evidence in `evidence/<requirement-slug>.md` and keep
  only source pointers in the card.
- Each requirement card may depend on at most 3 upstream cards. If a card needs
  more dependencies than that, create a shared shard contract or split the
  checkpoint again; do not keep growing one card's read set.
- `guideline-checks/backend.md`, `guideline-checks/frontend.md`, and
  `guideline-checks/project-heuristics.md` are guideline-scope artifacts. They
  record loaded guideline checks, relevant changed code areas, evidence pointers,
  issue ids, and skipped/not-applicable reasons. Do not duplicate the same
  guideline table into every requirement card.
- `global/final-review-contract.md` records cross-requirement and cross-guideline
  conclusions, shared API/data/state/flag/migration checks, remaining blockers,
  final report constraints, the exact source paths a final pass may read, and
  the source lists that deterministic report assembly must use. It must not copy
  full cards, full diffs, or full requirement/design text, and its declared
  source paths must stay within the bounded artifact set rather than pointing
  back to raw spec/design/diff sources.
- `global/review-round-delta.md` is the repeat-review delta root. For round 2+,
  record only changed findings, changed issue ids, newly checked checkpoints,
  and newly blocked verification. Final passes should read the latest delta plus
  compact roots instead of replaying every historical issue detail file.
- If the review has more than 12 requirement cards or more than 1,200 card lines,
  reduce cards in bounded batches into
  `global/requirement-shards/shard-N.md`. A later pass reads shard contracts, not
  every original card, unless a shard points to a specific source gap.
- If `global/requirement-shards/` itself grows broad, add
  `global/requirement-shard-index.md` as the compact shard-of-shards routing
  root. Final review should read that index first and open only the shard files
  it points to for unresolved blockers, cross-shard conflicts, or targeted gaps.
- If one requirement or checkpoint maps to many changed files, split it by
  repository, feature area, file group, symbol group, or execution path before
  deep review. A single card must not become a container for a large full diff
  just because the product requirement count is small.
- Keep top-level global contracts under 300 lines and shard contracts under 250
  lines. If they exceed that, split by repository, feature area, dependency, or
  shared touchpoint before final assembly.
- Final report assembly should be mechanical: read `review-index.md`,
  `issue-registry.md`, guideline-check files, `global/final-review-contract.md`,
  `global/review-round-delta.md` when present, and bounded readiness/shard
  contracts. Use `scripts/assemble_review_report.py` for `review.md`. Read a full
  requirement source, evidence file, or targeted diff only when a card/contract
  points to a concrete gap, conflict, or high-risk finding.

Subagents are preferred when available for broad reviews. If subagents are
unavailable, uncallable, or explicitly disabled, use checkpoint fallback: complete
one requirement card, one guideline-check file, one shard, or one final contract
checkpoint per run. Do not collapse a multi-requirement review into one
long-context pass.

## Required Inputs

- A GitLab merge request URL, or enough information to identify `base_url`, project path or id, and MR IID.
- `~/.strk-gitlab/config.toml`, unless the user explicitly provides another config file for this run.
- A STRK project root containing project instructions and synced specs.
- A code design source. Prefer local `code_design/` when present; otherwise use a user-provided Atlassian/Confluence or Google Docs link.
- Local checkout paths for affected code repositories, usually recorded in project `AGENTS.md`.

If any input is missing, inspect the project first. Ask only when the MR, project root, or local repository cannot be determined safely.

## Config Handling

Default config path:

```text
~/.strk-gitlab/config.toml
```

Supported single-host config:

```toml
[gitlab]
base_url = "https://gitlab.example.com"
private_token = "..."
api_version = "v4"

[review]
default_output_dir = "code_review"
publish_mode = "local_report_first"
```

Supported multi-host config:

```toml
default_host = "strk"

[hosts.strk]
base_url = "https://gitlab.example.com"
private_token = "..."
api_version = "v4"

[review]
default_output_dir = "code_review"
publish_mode = "local_report_first"
```

Config rules:

- Expand `~` at runtime.
- Ensure the config file is user-owned private config, not a project-local credential file.
- If the file is missing, create a template with blank token values and owner-only permissions when possible, then ask the user to fill it in.
- Resolve `<review-output-dir>` from `[review].default_output_dir`. If it is missing or blank, default to `code_review`. Relative paths are relative to the STRK project root.
- Prefer the host matching the MR URL. If there is no MR URL, use `default_host` for multi-host config or `[gitlab]` for single-host config.
- The MR URL host must match the selected `base_url`. Stop if it does not match; never send a token to an unexpected host.
- Never print token values or include them in generated artifacts. When showing diagnostic output, redact tokens as `<redacted>`.

## Phase 1: Resolve MR And Local Context

1. Parse the MR URL. Support common self-hosted GitLab URLs such as:
   - `https://gitlab.example.com/group/project/merge_requests/123`
   - `https://gitlab.example.com/group/subgroup/project/-/merge_requests/123`
2. Resolve the GitLab project path from the URL and URL-encode it for API calls.
3. Fetch read-only MR data through GitLab API v4:
   - merge request details;
   - source and target branch names;
   - commits;
   - changed files or MR changes;
   - notes and discussions when supported.
4. Read project instructions, usually `AGENTS.md`, to identify local code repository paths and branch conventions.
5. Match the GitLab project to the local repository. Prefer explicit project instructions; otherwise compare git remotes against the MR project path and host.
6. Fetch the source and target branches into the local checkout if needed. If network or permissions block fetch, record the limitation and continue only if the required commits already exist locally.
7. Create or update `<review-root>/TASK_STATE.md` and
   `<review-root>/review-index.md`, where `<review-root>` is
   `<review-output-dir>/<gitlab-project-slug>-mr-<iid>/`. Keep both compact and
   status-oriented. If the requirement/checkpoint table would exceed 20 rows or
   300 lines, create `index-shards/shard-N.md` and keep only the shard map and
   summary counts in `review-index.md`. When `batch-plan.md` is required,
   `TASK_STATE.md` must also record the current active batch or checkpoint, the
   last completed batch when applicable, and whether the run is subagent mode or
   checkpoint fallback mode.
8. Create or update `<review-root>/issue-registry.md`. Preserve prior issue ids
   and status history on repeat reviews instead of moving issue ownership into
   cards, guideline files, or the final report. If detailed issue blocks would
   exceed 20 issues or 300 lines, move details into `issues/ISSUE-xxx.md` or
   `issue-shards/shard-N.md` and keep only summary counts, blocking ids, recently
   changed ids, and shard paths in `issue-registry.md`.
9. For any broad-review trigger, create or update `<review-root>/batch-plan.md`
   before deep review. Broad-review triggers include more than one in-scope
   requirement/checkpoint, any split-by-diff-surface checkpoint, more than one
   guideline scope, or any expected final contract. The batch plan is the only
   place that should describe deep-review order across checkpoints.

## Phase 2: Read Spec And Code Design

1. Use the installed `strk-prod-specs` skill's read mode (`$strk-prod-specs` in runtimes that support `$skill` syntax) to identify the relevant synced spec and read only routing-depth information first: title, requirement ids/headings, brief requirement summaries when already available, source file paths, attachments/mockup pointers, and links. Do not read every requirement body into the root context before `review-index.md` exists.
2. If the target spec is ambiguous, use MR title, description, branch name, linked issue/spec URLs, and project `specs/specs.json` to find candidates. Ask the user only if multiple plausible specs remain.
3. Resolve the code design source:
   - First check whether the STRK project root has a local `code_design/` directory.
   - If `code_design/` exists, use the installed `strk-code-design` skill (`$strk-code-design` in runtimes that support `$skill` syntax) in read mode. Start from routing artifacts such as `code_design/TASK_STATE.md`, `code_design/assembly-manifest.md`, `code_design/final-readiness.md`, `code_design/global/final-assembly-contract.md`, requirement folder names, assembly cards, and source pointers. Do not start broad MR review routing from the assembled `code_design/code-design.md` unless the user explicitly asks to inspect the full human-facing design document. Do not deep-read all requirement `design.md` or `handoff.md` files in the root context; a requirement reviewer reads only the targeted files needed for its card.
   - If `code_design/` does not exist, inspect MR title, description, linked docs, and project instructions for a code design URL. If no plausible URL is found, ask the user for the code design link before judging design compliance.
4. Read external code design links by source:
   - **Atlassian / Confluence**: use `acli`, not browser automation, when authenticated access is available. Prefer structured page bodies, for example `acli confluence page view --id <page-id> --json --body-format storage`, `atlas_doc_format`, or `view` as needed. Run authenticated `acli` commands outside the sandbox when sandboxed auth fails.
   - **Google Docs**: use `gws`. Extract the document id from `/document/d/<id>/...` links. Prefer `gws docs documents get --params '{"documentId":"<id>"}'` for structured content; use `gws drive files export --params '{"fileId":"<id>","mimeType":"text/plain"}' --output <tmp-file>` or another supported export MIME type if plain text export is easier to review. Run authenticated `gws` commands outside the sandbox when sandboxed auth or network access fails.
   - For either source, first extract a routing-depth outline with headings, requirement numbering, tables of contents, links, and decision/risk section pointers. Preserve full structured content on disk if exported, but do not load the full external design into root context. If the document cannot be read, stop and report the blocked credential/tooling reason.
5. Record the code design source in the review report as one of:
   - `local code_design/`;
   - `Atlassian/Confluence: <url or page id>`;
   - `Google Docs: <url or document id>`.
6. Build the requirement routing map before deep review:
   - list every requirement or explicit requirement group relevant to the MR;
   - assign a stable `<requirement-slug>` to each item;
   - record spec source pointers, code-design source pointers, related changed
     files, likely guideline scopes, and the target
     `requirement-cards/<requirement-slug>.md` path in `review-index.md` or the
     relevant `index-shards/shard-N.md`;
   - if a single requirement is too broad for one bounded pass, split it into
     explicit checkpoints with suffixes such as `<requirement-slug>-backend-api`
     or `<requirement-slug>-frontend-ui`.
   - if a requirement maps to many files or symbols, split by repository,
     feature area, file group, symbol group, or execution path and record each
     checkpoint in `review-index.md` or the relevant `index-shards/shard-N.md`.
7. Turn the routing map into a bounded execution plan in `batch-plan.md` before
   any card-level deep review:
   - assign each checkpoint to a review batch;
   - keep each batch compact, usually no more than 6 checkpoints and no more
     than one broad shared dependency surface;
   - record per-batch prerequisites, expected guideline scopes, and target
     outputs;
   - record whether the batch can be reviewed independently or requires a shared
     shard contract first.
   - once deep review starts, one active reviewer pass may review only one batch
     plus any compact shared shard contract explicitly listed in that batch's
     prerequisites; finish that batch's artifacts and update `TASK_STATE.md`
     before opening checkpoints from another batch.
8. Compare the spec and code design at routing depth before judging the MR. Treat
   the spec as the higher-priority product contract if they conflict, but record
   exact conflict pointers in the affected requirement card or
   `global/final-review-contract.md`; do not silently choose one side.
9. Record the spec, code design source, MR URL, local repo path, source branch,
   target branch, and commit range in `review-index.md` and the final report.

## Phase 3: Inspect Diff And Surrounding Code

1. Use local git to compute the diff between target and source, matching GitLab MR branches or commit SHAs as closely as possible.
2. Inspect changed files and nearby code. Do not review only from the patch when surrounding behavior matters.
3. When CodeGraph is initialized in the local repo, prefer it for:
   - symbol definitions and signatures;
   - callers and callees;
   - flow tracing;
   - impact analysis.
4. Use text search for literal strings, translation keys, comments, static assets, generated code, and config keys.
5. Review existing tests and any new or modified tests. If tests are missing, determine whether the risk justifies a finding.
6. If the MR changes backend code, data models, APIs, jobs, migrations, integrations, server-side i18n, or backend dependencies, use the installed `strk-code-guidelines` skill (`$strk-code-guidelines` in runtimes that support `$skill` syntax) and its backend review guideline to guide backend-specific risk review.
7. If the MR changes frontend code, UI behavior, client-side data handling, styles, bundles, WMP code, frontend i18n, or frontend dependencies, use the installed `strk-code-guidelines` skill (`$strk-code-guidelines` in runtimes that support `$skill` syntax) and its frontend review guideline to guide frontend-specific risk review.
8. If inspecting surrounding code or the MR diff touches project-specific heuristic surfaces such as frontend styling, component reuse, legacy frontend surfaces, monitoring, compatibility, dependency size, performance, IO, third-party reads, or data queries, use the installed `strk-code-guidelines` skill's project heuristics. These heuristics are not hard rules; judge applicability and ask for justification when a relevant heuristic is ignored without a sound reason.
9. Review each requirement through its own card before finalizing findings. A
   requirement reviewer reads only the assigned requirement source pointers,
   relevant code-design sections, targeted diff/surrounding code, relevant tests,
   and upstream cards explicitly listed as dependencies in `review-index.md` or
   the relevant `index-shards/shard-N.md`. Keep dependency fan-in to 3 upstream
   cards or fewer; if more context is needed, write or update a shared shard
   contract and depend on that compact artifact instead.
   Write the result to `requirement-cards/<requirement-slug>.md` with these stable
   sections:
   - `Scope`: assigned requirement/checkpoint and source pointers;
     upstream dependency pointers, if any;
   - `Spec / Design Contract`: concise demand/design points, conflicts, and
     source paths;
   - `Diff Entry Points`: changed files, symbols, and targeted surrounding code
     inspected;
   - `Spec / Code Design Rows`: rows this card contributes to the final
     Spec / Code Design checklist;
   - `Spec / Design Conflict Rows`: rows this card contributes to the final
     conflict checklist;
   - `Issues`: issue ids from `issue-registry.md` opened, confirmed, fixed,
     obsolete, or needing confirmation;
   - `Verification`: tests, manual checks, blocked checks, and risk-based missing
     coverage;
   - `Cross-Requirement Touchpoints`: shared APIs, data/state, flags,
     migrations, rollout, ordering, or dependencies;
   - `Final Assembly Notes`: concise notes needed by the final report.
   A reviewer pass must not opportunistically continue into another batch's
   checkpoints just because related files are already open; hand off through
   updated artifacts instead.
10. Run guideline checks in separate guideline artifacts when their scope applies:
   - backend changes go to `guideline-checks/backend.md`;
   - frontend changes go to `guideline-checks/frontend.md`;
   - project-specific heuristics go to `guideline-checks/project-heuristics.md`.
   Each guideline artifact must record the loaded guideline source, scope reason,
   changed code areas checked, detailed checklist rows, issue ids from
   `issue-registry.md`, and skipped or blocked reasons. Requirement cards may
   reference guideline issue ids, but must not copy the full guideline checklist.
   Use a stable `Checklist Rows` section so final assembly can read these files
   mechanically.
11. Build the structured review checklist before finalizing findings. The checklist is the audit trail for what was checked and what evidence supports the conclusion:
   - include every spec/code-design requirement or requirement group that was relevant to the MR;
   - include spec/design conflict checks;
   - include every loaded backend/frontend guideline category and its detailed sub-checks, not only the top-level headings.
   - render checklist sections as Markdown tables by default for readability.
12. Mark every checklist item with one of these statuses:
   - `✅ Passed`: checked; use only when the reviewer is clearly satisfied that there is no meaningful issue or risk for that item;
   - `❌ Issue`: checked and produced an open issue in the risk list;
   - `⚠️ Needs confirmation`: checked and found a material uncertainty that should be raised for developer confirmation;
   - `🛠️ Fixed`: checked and previously open issue is now fixed in the latest review round;
   - `➖ N/A`: not applicable to this MR, with a reason;
   - `🚧 Not checked`: could not be checked, with a blocked reason.
   Do not omit a checklist item just because it did not produce a finding.

## Phase 4: Bounded Final Review And Assembly

1. Before writing `review.md`, verify requirement readiness through bounded shard
   readiness, not by making one agent read every requirement row. If the root
   `review-index.md` exceeds the root cap, each `index-shards/shard-N.md` must
   contain its own readiness result: covered rows, card existence, status
   coverage, issue id coverage, verification summary, and blockers.
2. If requirement cards exceed 12 files or 1,200 lines, create
   `global/requirement-shards/shard-N.md` in bounded batches. Each shard records
   covered cards, requirement coverage status, issues, cross-card conflicts,
   source gaps, and whether the cards are eligible for final review.
   If requirement shards themselves exceed 6 files or otherwise stop being a
   compact read set, create `global/requirement-shard-index.md` to summarize
   shard coverage, shard readiness, blocking shard ids, and exact shard paths
   the next pass may open.
3. Create or update `global/final-review-contract.md` from `review-index.md`,
   `issue-registry.md`, index shard readiness, issue shard summaries,
   guideline-check files, and either bounded cards, requirement shards, or the
   requirement shard index when present. It must record:
   - final overall stance and blocking issue ids;
   - spec/design conflict decisions and source pointers;
   - cross-requirement API/data/state/flag/migration/rollout checks;
   - backend/frontend/project guideline coverage;
   - verification adequacy and blocked checks;
   - prior MR discussion status;
   - exact source paths final assembly may read if a targeted gap remains;
   - exact artifact paths for deterministic report assembly, including
     spec/code-design checklist row sources, conflict row sources, guideline row
     sources, issue detail sources, and optional delta sources.
4. Only after the final contract is complete, assemble `review.md`. Prefer
   `scripts/assemble_review_report.py` for mechanical extraction from cards,
   issue detail files or issue shards, guideline artifacts, the final contract,
   and the latest delta file when present. Do not semantically reread and
   rewrite every requirement, every issue, or every full diff during final
   assembly.
5. Before final assembly, run the bundled validator when available:
   `scripts/validate_review_artifacts.py <review-root>`. Treat validator errors
   as final-readiness blockers and record the compact validator output in
   `global/final-review-contract.md`. If the script cannot run, perform the same
   structural checks manually in bounded batches and record the reason.

## Review Dimensions

Evaluate the MR across these dimensions:

- **Spec compliance**: implemented behavior matches the synced product requirements, including edge cases, copy, permissions, rollout, and non-code requirements.
- **Code design compliance**: implementation follows resolved code design decisions, APIs, data flow, migrations, test plan, and explicit constraints.
- **Spec/design conflicts**: the spec and code design disagree, omit different requirements, or imply different behavior. Prefer the spec when judging product correctness, but make the conflict visible so developers can decide whether to revise the design, implementation, or spec.
- **Implementation correctness**: bugs, regressions, race conditions, nil/empty states, error handling, backward compatibility, and unintended side effects.
- **Integration risk**: cross-repo contracts, API schemas, database migrations, background jobs, feature flags, config, analytics, i18n, and deployment sequencing.
- **Frontend conventions**: use existing STRK shared colors, component-kit components, scoped styles, and escaped LESS `calc(...)` where applicable.
- **Security and privacy**: token handling, access control, data exposure, unsafe logging, SSRF/open redirect, and authorization checks.
- **Testing and verification**: coverage for changed behavior, risk-appropriate tests, missing manual QA, and blocked verification.
- **MR discussion state**: unresolved prior comments, reviewer concerns, and whether the MR changed code without addressing them.

Ground every finding in evidence: spec text, code design section, changed code, surrounding code, tests, GitLab discussion, or a concrete failure scenario. Separate confirmed bugs from questions or product judgment. When a finding depends on a spec/design conflict, cite both sides and state that the review is using the spec as the default source of truth for product correctness.

Raise possible risks explicitly. If the code, spec, design, tests, discussions, or guideline checks suggest any plausible risk, possible bug, missing evidence, unclear tradeoff, or implementation concern, add it to the risk/issue list as `Open` or `Needs confirmation` instead of hiding it in checklist notes. Only use a plain checked checklist item when you are clearly satisfied that the item has no meaningful problem. State what evidence caused the concern, what confirmation is needed when applicable, and what risk remains if the assumption is wrong.

Backend-specific dimensions from the installed `strk-code-guidelines` skill are mandatory to consider for backend MRs, and frontend-specific dimensions from that skill are mandatory to consider for frontend MRs, but neither guideline is exhaustive. Continue applying general technical best practices, repo-local conventions, and reviewer judgment.

Do not let spec/design consistency dominate the whole review. Even when all product requirements appear covered, still inspect backend/frontend guideline categories for implementation quality, robustness, compatibility, security, performance, maintainability, and dependency risk. The final report must make this guideline pass visible through a structured checklist, not a vague summary.

For repeat reviews of the same MR, preserve history. Update issue statuses instead of deleting resolved issues, and add new review-round notes when code changes introduce new risks.

## Output Artifacts

Write all local artifacts under the configured review output directory:

```text
<review-output-dir>/<gitlab-project-slug>-mr-<iid>/review.md
```

Use a filesystem-safe `<gitlab-project-slug>` derived from the GitLab project path, for example `group-project`. Use `-mr-<iid>` instead of `!<iid>` in directory names so generated paths are shell-friendly.

Artifact layout:

```text
<review-output-dir>/<gitlab-project-slug>-mr-<iid>/
  TASK_STATE.md
  batch-plan.md
  review-index.md
  issue-registry.md
  review.md
  index-shards/
    shard-N.md
  requirement-cards/
    <requirement-slug>.md
  evidence/
    <requirement-slug>.md
  issues/
    ISSUE-xxx.md
  issue-shards/
    shard-N.md
  guideline-checks/
    backend.md
    backend-shards/
      shard-N.md
    frontend.md
    frontend-shards/
      shard-N.md
    project-heuristics.md
    project-heuristics-shards/
      shard-N.md
  global/
    final-review-contract.md
    review-round-delta.md
    requirement-shard-index.md
    requirement-shards/
      shard-N.md
```

`TASK_STATE.md` is a compact progress file. Do not paste requirement text, full
diffs, long test logs, guideline tables, or worker narratives into it. When
`batch-plan.md` exists, `TASK_STATE.md` must record enough bounded routing state
to resume without replaying every card: review mode, active batch or active
checkpoint, last completed batch when applicable, and the next compact artifact
paths to open.

Use a stable key format for these bounded routing fields. English keys are the
portable default; equivalent Chinese keys are also acceptable when they keep the
same meaning and structure. The `last completed` field may be `None` / `无` when
the first batch or checkpoint is still in progress. Accepted Chinese key names
include `审查模式`, `当前批次`, `当前检查点`, `上一个完成批次`, and
`上一个完成检查点`.

Minimal template:

```md
# Review Task State: <project> !<iid>

- Review mode: subagent / checkpoint fallback
- Active batch: B1
- Active checkpoint: `<requirement-slug>` / None
- Last completed batch: None
- Next artifact paths:
  - `review-index.md`
  - `batch-plan.md`
  - `requirement-cards/<requirement-slug>.md`
```

`batch-plan.md` is mandatory whenever a broad-review trigger is true. It is a
compact execution plan, not a full analysis document. Keep it focused on batch
boundaries, prerequisites, shared dependency surface, target artifacts, and
readiness status.

`review-index.md` is mandatory for broad reviews and recommended for every
review. It is a compact root, not the complete requirement table. Keep it
table-like and use source paths, statuses, card paths, issue ids, shard paths,
readiness summaries, and short notes instead of prose. If the full
requirement/checkpoint list exceeds 20 rows or 300 lines, store rows in
`index-shards/shard-N.md` and keep only the shard map, summary counts, and
readiness status in `review-index.md`.

Batch plan template:

```md
# Review Batch Plan: <project> !<iid>

## Broad Review Trigger

- Trigger(s):
- Planning scope:
- Latest round:

| Batch | Checkpoints | Prerequisites | Shared Dependency Surface | Guideline Scope | Target Artifacts | Status |
|---|---|---|---|---|---|---|
| B1 | `<requirement-slug>`, `<checkpoint-slug>` | `index-shards/shard-1.md` / `None` | `shared shard contract` / `None` | backend / frontend / heuristics / none | `requirement-cards/...`, `guideline-checks/...` | planned / in progress / ready / blocked |

## Batch Readiness Rules

- Per-batch checkpoint cap:
- Shared dependency surface cap:
- Escalation rule when dependency budget is exceeded:
- Repeat-review delta path:
- Active-pass boundary: one reviewer pass may deep-review only this batch plus
  its listed shared shard contract prerequisites before writing artifacts and
  updating `TASK_STATE.md`.
```

Index shard template:

```md
# Index Shard: <name>

## Coverage

- Rows covered:
- Source grouping:
- Readiness: ready / blocked
- Blockers:

| Requirement / Checkpoint | Spec Source | Design Source | Card | Guideline Scope | Issues | Status |
|---|---|---|---|---|---|---|

## Shard Readiness

- Card existence checked:
- Status coverage checked:
- Issue id coverage checked:
- Verification summary checked:
- Source gaps:
```

`issue-registry.md` is the compact canonical issue root used by cards,
guideline-check files, shards, final contracts, final reports, and repeat
reviews. It preserves issue status history and prevents later agents from
needing to reread final human-facing reports to recover machine state. If
detailed issue blocks exceed 20 issues or 300 lines, store details in
`issues/ISSUE-xxx.md` or `issue-shards/shard-N.md` and keep only summary counts,
blocking ids, recently changed ids, and shard paths in `issue-registry.md`.
If `issues/*.md` exceeds 20 files, create `issue-shards/shard-N.md` summaries so
follow-up agents can read shard summaries instead of every issue detail file.

Issue registry template:

```md
# Issue Registry: <project> !<iid>

| Issue | Severity | Status | Stance | Source | Owner Artifact | Last Checked |
|---|---|---|---|---|---|---|
| ISSUE-001 or issue-shards/shard-N.md | P1/P2/P3 | Open / Needs confirmation / Fixed / Obsolete | must / recommend / non-blocking | Spec/design mismatch / Backend guideline / Frontend guideline / General engineering judgment | requirement-cards/<slug>.md / guideline-checks/backend.md | <round/date> |

## ISSUE-001 - <title>

- Evidence pointers:
- Confirmation needed:
- Impact:
- Recommendation:
- Suggested GitLab comment:
- Status history:
```

Issue detail files and issue shards use the same `ISSUE-xxx` block format. The
final report assembler reads only blocking issues, recently changed issues, or
the issue shard summaries listed in `global/final-review-contract.md` unless the
user asks for a full issue audit.

The bundled `scripts/validate_review_artifacts.py` is a structural cap
validator. It can check required root files, line caps, row caps, shard
requirements, broad-trigger final contract presence, guideline-check caps, card
soft caps, dependency-budget markers, shard readiness markers, and final
contract size without loading all artifacts into agent context. It does not
prove semantic coverage; shard readiness, issue status, and finding correctness
still belong to the owning reviewer/checkpoint.

Requirement card template:

```md
# Requirement Review Card: <requirement title>

## Scope

- Requirement/checkpoint:
- Status: Passed / Issue / Needs confirmation / Fixed / N/A / Not checked
- Spec source:
- Code design source:
- Related changed files:
- Upstream dependencies:

## Spec / Design Contract

- Demand/design points checked:
- Spec/design conflicts:

## Diff Entry Points

- Changed files/symbols:
- Surrounding code inspected:
- Tests inspected:

## Spec / Code Design Rows

| Status | Item | Conclusion / Notes | Issue |
|---|---|---|---|

## Spec / Design Conflict Rows

| Status | Item | Conclusion / Notes | Issue |
|---|---|---|---|

## Issues

- ISSUE-xxx from issue-registry.md:

## Verification

- Commands/checks:
- Blocked or missing checks:

## Cross-Requirement Touchpoints

- Shared API/data/state/flag/migration/rollout:

## Final Assembly Notes

- Include in final report:
- Source gaps:
```

Guideline-check artifact template:

```md
# Guideline Check: <scope>

## Scope

- Loaded guideline source:
- Scope reason:
- Changed code areas:
- Related issue ids:

## Checklist Rows

| Status | Category | Check | Conclusion / Notes | Issue |
|---|---|---|---|---|

## Skipped / Blocked

- Reason:
```

Requirement shard template:

```md
# Requirement Shard: <name>

## Coverage

- Cards covered:
- Shared dependency surface:
- Eligibility: ready / blocked
- Source gaps:

## Spec / Code Design Rows

| Status | Item | Conclusion / Notes | Issue |
|---|---|---|---|

## Spec / Design Conflict Rows

| Status | Item | Conclusion / Notes | Issue |
|---|---|---|---|

## Final Assembly Notes

- Cross-card conflicts:
- Blocking issues:
- Verification summary:
```

Requirement shard index template:

```md
# Requirement Shard Index: <project> !<iid>

## Coverage

- Shards covered:
- Total cards covered:
- Blocking shards:
- Ready shards:

| Shard | Coverage | Shared Dependency Surface | Eligibility | Blocking Issues | Source Gaps |
|---|---|---|---|---|---|
| `global/requirement-shards/shard-1.md` | `<requirement-slug>`, `<requirement-slug-2>` | payments rollout | ready / blocked | ISSUE-001 | none |

## Final Review Routing

- Open these shard files for unresolved blockers:
- Open these shard files for cross-shard conflict checks:
- Skip these shard files unless a targeted gap is raised:
```

Guideline-check files should use the same issue ids as the final risk list and
include only the guideline rows relevant to the MR. If a guideline file becomes
too large, split it by code area under
`guideline-checks/<scope>-shards/shard-N.md`, for example
`guideline-checks/backend-shards/shard-1.md`, and list the split files in
`review-index.md` and `global/final-review-contract.md`.

Report template:

```md
# MR Review: <project> !<iid>

## 结论

- Overall: Approved / Needs changes / Blocked
- 主要风险:
- 需要开发确认的不确定点:
- 是否建议发布 GitLab 评论: No / Summary only / Inline candidates

## 审查输入

- MR:
- Spec:
- Code design source:
- Local repo:
- Source / target:
- Commit range:

## 具体审查项

### Spec / Code Design 一致性

| Status | Item | Conclusion / Notes | Issue |
|---|---|---|---|
| ✅ Passed / ❌ Issue / ⚠️ Needs confirmation / 🛠️ Fixed / ➖ N/A / 🚧 Not checked | <requirement slug/title + concise check item + source pointer> | <what was checked and the conclusion; include spec/design/code/test references when helpful> | <issue id or -> |

### Spec / Design 冲突

| Status | Item | Conclusion / Notes | Issue |
|---|---|---|---|
| ✅ Passed / ❌ Issue / ⚠️ Needs confirmation / 🛠️ Fixed / ➖ N/A / 🚧 Not checked | <conflict id/title + concise check item + source pointers> | <what was checked and the conclusion; include spec and design references when helpful> | <issue id or -> |

### Backend Guideline Checklist

- Loaded: Yes / No
- Scope reason:

| Status | Category | Check | Conclusion / Notes | Issue |
|---|---|---|---|---|
| <mechanically insert relevant rows from `guideline-checks/backend.md` or its listed `backend-shards/*.md`; do not duplicate rows that were not loaded for this MR> |||||

### Frontend Guideline Checklist

- Loaded: Yes / No
- Scope reason:

| Status | Category | Check | Conclusion / Notes | Issue |
|---|---|---|---|---|
| <mechanically insert relevant rows from `guideline-checks/frontend.md` or its listed `frontend-shards/*.md`; do not duplicate rows that were not loaded for this MR> |||||

### Project Heuristics Checklist

- Loaded: Yes / No
- Scope reason:

| Status | Category | Check | Conclusion / Notes | Issue |
|---|---|---|---|---|
| <mechanically insert relevant rows from `guideline-checks/project-heuristics.md` or its listed `project-heuristics-shards/*.md`; do not duplicate rows that were not loaded for this MR> |||||

## 风险/问题列表

This section is mechanically assembled from compact `issue-registry.md` plus the
issue detail files or issue shard summaries referenced by
`global/final-review-contract.md`. Do not use `review.md` as the canonical issue
store for follow-up rounds.

### ISSUE-001 - P1/P2/P3 - Open/Needs confirmation/Fixed/Obsolete - <标题>

- Stance: [must] / [recommend] / [non-blocking]
- First seen:
- Last checked:
- Source: Spec/design mismatch / Backend guideline / Frontend guideline / General engineering judgment
- Evidence:
- Confirmation needed:
- Impact:
- Recommendation:
- Suggested GitLab comment:
- Status history:
  - Round 1: Open - <brief note>
  - Round 1: Needs confirmation - <what needs developer confirmation>
  - Round 2: Fixed - <brief note and evidence>

## 测试与验证

## GitLab 发布计划

## 限制与不确定性
```

Final review contract template additions:

```md
# Final Review Contract: <project> !<iid>

## Report Conclusion

- Overall:
- 主要风险:
- 需要开发确认的不确定点:
- 是否建议发布 GitLab 评论:

## Spec / Code Design Checklist Sources

- `requirement-cards/<slug>.md`
- `global/requirement-shards/shard-N.md`

## Spec / Design Conflict Checklist Sources

- `requirement-cards/<slug>.md`
- `global/requirement-shards/shard-N.md`

## Guideline Checklist Sources

- Backend:
  - Loaded:
  - Scope reason:
  - Sources:
- Frontend:
  - Loaded:
  - Scope reason:
  - Sources:
- Project Heuristics:
  - Loaded:
  - Scope reason:
  - Sources:

## Issue Detail Sources

- `issue-registry.md`
- `issues/ISSUE-xxx.md`
- `issue-shards/shard-N.md`

## Review Round Delta Sources

- `global/review-round-delta.md`

## Testing And Verification

- Summary:
- Blocked checks:

## GitLab Publishing Plan

- Plan:
- Inline candidate source:

## Limitations And Uncertainty

- Limitation:
```

Repeat-review delta template:

```md
# Review Round Delta: <project> !<iid> round <n>

## Inputs

- Previous round baseline:
- Newly checked batches:
- Newly changed files / commits:

## Issue Delta

- New issue ids:
- Status-changed issue ids:
- Obsolete issue ids:

## Verification Delta

- Newly passed checks:
- Newly blocked checks:

## Final Assembly Notes

- Update final contract sections:
- Detail sources changed:
```

Severity guidance:

- **P1**: likely production breakage, data loss, security/privacy issue, migration hazard, or a requirement-blocking mismatch.
- **P2**: meaningful functional bug, important missing requirement, fragile integration, or missing verification for risky behavior.
- **P3**: lower-risk maintainability, small UX/copy mismatch, minor test gap, or cleanup that improves reviewability.

## Optional GitLab Publishing Phase

Do not publish anything during the default review phase.

Publish only when all are true:

1. The local report exists.
2. The user explicitly asks to publish comments.
3. The agent has re-read the exact comments to publish.
4. Each comment includes a brief issue description and the key evidence needed for the author to verify it.
5. The comments do not expose tokens, private config, unrelated local paths, or speculative claims as facts.

Publishing modes:

- **Summary note**: post one MR note containing the conclusion and selected findings.
- **Inline candidates**: attempt line-level discussions only for comments with reliable file and line mapping. Inline comments should be concise but must include:
  - the stance and issue summary;
  - evidence, such as spec/design reference plus code path or line;
  - impact and recommended action when not obvious.
  When the user asks to publish inline comments, append this exact signature to the end of each inline comment:

```md
---
By [Strikingly R&D Agent](https://cd.i.strikingly.com/strikingly/agent-rnd-skills)
```

For GitLab 10.8.x, inline discussion support and required position payloads may differ from modern GitLab. If inline publishing fails or the line mapping is uncertain, fall back to a summary note that references file paths and line numbers in text.

After publishing, update the report's `GitLab 发布计划` section with what was posted and any failures.

## Completion Criteria

Finish only when:

- GitLab config was loaded without exposing tokens;
- MR metadata and diff source were resolved or blocked reasons are recorded;
- synced spec was identified and read at routing depth through `strk-prod-specs`;
- code design was resolved and read at routing depth from local `code_design/`
  through `strk-code-design`, from Atlassian/Confluence through `acli`, or from
  Google Docs through `gws`; targeted deep reads are recorded in the relevant
  requirement card, evidence file, or final contract;
- `batch-plan.md` exists whenever any broad-review trigger is true, and deep
  review followed its batch boundaries instead of expanding one active context
  across all checkpoints at once;
- `review-index.md` exists and records MR metadata, commit range, shard map,
  guideline scope, shard readiness, summary counts, and root-level status
  without carrying an unbounded requirement/checkpoint table;
- root-context spec/design reading stayed at routing depth before
  `review-index.md` existed; any full requirement/design body was read only by a
  targeted requirement/checkpoint reviewer or through a targeted source gap in a
  card/contract;
- local `code_design/` routing did not start from the assembled
  `code_design/code-design.md` unless the user explicitly requested the full
  human-facing document; default routing used `strk-code-design` read-mode
  routing artifacts instead;
- `issue-registry.md` exists as the compact canonical issue root with summary
  counts, blocking issue ids, recently changed issue ids, issue shard/detail
  paths, and readiness status. Detailed issue fields such as evidence pointers,
  suggested comments, and status history may live in `issues/ISSUE-xxx.md` or
  `issue-shards/shard-N.md`;
- every in-scope requirement/checkpoint has a low-context requirement card, or
  `review-index.md` records a blocked reason;
- no requirement card depends on more than 3 upstream cards unless a compact
  shared shard contract is used instead;
- if requirement cards exceed 12 files or 1,200 lines, requirement shard
  contracts exist and cover every card exactly once before final review;
- if any requirement/checkpoint maps to a large diff surface, the work is split
  by repository, feature area, file group, symbol group, or execution path before
  final review; no single card carries a broad full-diff review narrative;
- every loaded backend/frontend/project guideline scope has a guideline-check
  artifact, or `review-index.md` records why that scope is not applicable or
  blocked;
- when `batch-plan.md` exists, `TASK_STATE.md` records the active batch or
  active checkpoint, the last completed batch when applicable, and the current
  review mode so follow-up runs can resume from a bounded entry point;
- no active reviewer pass deep-reviewed checkpoints from multiple batches before
  updating the current batch artifacts and `TASK_STATE.md`;
- `global/final-review-contract.md` exists whenever any broad-review trigger is
  true: more than one in-scope requirement/checkpoint, more than 12 cards, more
  than 1,200 total card lines, both backend and frontend guideline scopes are
  loaded, both requirement cards and guideline-check artifacts exist, or a
  requirement/checkpoint was split by diff surface. The contract records
  cross-requirement, cross-guideline, verification, discussion, and publishing
  readiness conclusions without copying full requirement bodies, full cards, or
  full diffs;
- if `global/requirement-shards/*.md` grows beyond a compact final-pass read set,
  `global/requirement-shard-index.md` exists and is used as the default routing
  root before opening individual requirement shards;
- `scripts/validate_review_artifacts.py <review-root>` passed when available, or
  equivalent bounded structural checks were recorded with a reason the script
  could not run;
- changed code and relevant surrounding code were inspected by the owning
  requirement, diff checkpoint, or guideline artifact, with source pointers
  recorded there; the final agent did not repeat a broad code inspection;
- the structured review checklist is present, including relevant spec/design items and every loaded backend/frontend guideline sub-check, each marked checked, linked to an issue, marked uncertain, fixed, `N/A`, or `Not checked` with a reason;
- the risk/issue list is assembled from compact `issue-registry.md` plus issue
  detail files or issue shard summaries referenced by
  `global/final-review-contract.md`; these sources preserve prior issues across
  review rounds and update their status instead of deleting resolved items;
- repeat reviews update `global/review-round-delta.md` so later passes can read
  the latest delta instead of replaying all prior round details;
- every plausible risk, possible bug, missing evidence, unclear tradeoff, or implementation concern is listed in the risk/issue list as `Open` or `Needs confirmation`; only clearly safe items are summarized solely in the checklist;
- findings are evidence-backed and severity-ranked;
- local report exists under `<review-output-dir>/`;
- `review.md` was assembled mechanically through
  `scripts/assemble_review_report.py` or an equivalent deterministic process
  using the final contract's declared source lists;
- final assembly did not require one agent to semantically reread all
  requirement bodies, all code-design sections, all full diffs, or all cards in
  one active context;
- publishing was skipped by default or performed only after explicit user confirmation.
