# STRK Write Code Task

Goal: implement an existing STRK `code_design/` package as complete,
reviewable code changes under `code_changes/`, while keeping root, final review,
and final assembly context bounded as requirement count grows.

# Table Of Contents

1. Overall Contract
2. Minimal Output Structure
3. Root Agent Context Isolation
4. Multi-Agent Roles
5. Phase 0: Lightweight Implementation Plan
6. Worktree And CodeGraph Setup
7. Requirement Writer Execution
8. Requirement Coverage Review
9. Context Budget And Hard Stops
10. Fallback Mode
11. Final Integration Review
12. Patch Generation
13. Worktree Cleanup
14. Final README
15. Final Completion Gate

# 1. Overall Contract

The deliverable is patch files plus a Chinese `code_changes/README.md`.
Intermediate files exist only to coordinate work and prevent lost context. Do
not create requirement-level documentation packages unless a requirement is too
large, interrupted, or blocked and needs a short handoff note.

Do not reinterpret the task as an MVP, prototype, "minimal viable loop",
"smallest closed loop", or other reduced deliverable unless the user explicitly
asks for that reduction.

The design is the implementation contract. If the user asks to implement the
design without narrowing it, every requirement in the design is in scope.

Final user-facing deliverables must be primarily in Simplified Chinese,
preserving English only for code identifiers, file paths, commands, API names,
field names, product names, and original text that must remain English.

# 2. Minimal Output Structure

Use this project-local structure:

```text
code_changes/
  TASK_STATE.md
  implementation-index.md
  final-review-contract.md
  README.md
  requirement-cards/
    <requirement-folder-slug>.md
  <repo-name>.patch
```

Optional, only when needed:

```text
code_changes/
  worker-notes/
    <requirement-folder-slug>.md
    shared-<topic>.md
```

`TASK_STATE.md` is the required milestone artifact. Keep it short. It should
record milestone status only:

- final integration review status;
- patch and worktree cleanup status;
- fallback reason, if fallback mode is used.

Keep `TASK_STATE.md` compact. Do not paste requirement design text, long code
snippets, test logs, or review checklist dumps into it. It is a routing and
status file, not a design, implementation index, or review report.

`implementation-index.md` is the low-context dispatch index. It records the
complete in-scope requirement list, dependency order, included repositories,
worktree paths, worker assignments, card paths, coverage status, concise
verification status, and non-code follow-up status. It must not include
requirement design text, code snippets, long test logs, or worker narratives.
Keep it table-like: one concise row per requirement, assignment, repository, or
checkpoint, with file paths and status fields instead of prose paragraphs.

`requirement-cards/<requirement-folder-slug>.md` is the low-context
requirement handoff card. Name each card after the matching `code_design/`
requirement folder. For example, `code_design/r1-ai-entry/` maps to
`code_changes/requirement-cards/r1-ai-entry.md`. If a requirement is split into
sub-checkpoints, keep the parent folder slug and append the explicit checkpoint
suffix, for example `r3-checkout-flow-backend-api.md`.

Each requirement card should stay short: target 40-80 lines, and treat 120
lines as the soft budget for complex requirements. When a card would exceed
that budget, first remove duplicated design text, test logs, and prose
narrative. If it still needs more room, split the requirement into explicit
sub-checkpoints or write a short worker note and keep only the card facts
needed for dispatch, coverage review, final review, and README assembly.
Record any intentional over-budget card and reason in `implementation-index.md`.
Worker notes used for overflow must stay concise and must not become replacement
requirement designs or expanded requirement cards.
Use stable section names so final review and README assembly can consume cards
mechanically:

- `Scope`: assigned scope and source design paths;
- `Changed Files`: changed files and diff entry points;
- `Implemented Points`: implemented demand/design points;
- `Verification`: commands and results or exact blockers;
- `Non-Code Follow-Up`: requirement-specific non-code follow-up;
- `Cross-Requirement Touchpoints`: shared APIs/data/state/flags/migrations, or
  risks that final review must check;
- `Coverage Status`: coverage review pass/fail and concrete missing points, if
  any.

`final-review-contract.md` is the final integration review contract. It records
the cross-requirement decisions that were checked, shared API/data/state/flag
or migration alignment, verification adequacy, issue routing back to
requirement workers, known limitations, and the source paths that final assembly
may use. It must not copy full requirement cards, full diffs, or full design
sections. For large requirement sets, build this contract incrementally by
dependency group, repository, or shared touchpoint so no review pass needs to
hold every card and every targeted diff in one context.

Do not create mandatory per-requirement `TODO.md`, `implementation-plan.md`,
`changes.md`, `verification.md`, `review.md`, or `handoff.md` files. Those files
were useful for code design, but they are too heavy for code implementation.

# 3. Root Agent Context Isolation

When subagent or multi-agent tools are callable, the root agent must stay thin.
It is the dispatcher for subagents, not the implementation Coordinator.

Root agent responsibilities:

- load this skill and task contract;
- spawn the Coordinator subagent;
- pass the project root, user request, and this task contract to the
  Coordinator;
- after Coordinator writes the compact dispatch plan in
  `code_changes/TASK_STATE.md` and `code_changes/implementation-index.md`,
  spawn the listed shared workers, requirement writers, requirement coverage
  reviewers, final integration reviewer, and final assembler from the root
  context;
- read only compact `code_changes/TASK_STATE.md`,
  `code_changes/implementation-index.md`, final README, and final patch status;
- report progress and final outcome to the user.

Root agent must not:

- read full `code_design/code-design.md`;
- read all requirement `design.md` files;
- inspect large code areas;
- run requirement implementation itself;
- run requirement coverage review itself;
- run final integration review itself;
- paste worker outputs into the conversation context.

Use only one subagent layer. All subagents are spawned by the root agent.
Subagents must not spawn other subagents.

If the root agent needs more detail, it should ask the relevant subagent to
write a short update to `implementation-index.md`, the relevant requirement
card, or a short optional worker note. Do not pull the full worker context back
into the root conversation.

# 4. Multi-Agent Roles

Multi-agent execution is mandatory when the current runtime provides callable
subagent or multi-agent tools. The user does not need to explicitly ask for
subagents; this skill itself is the instruction to use them.

Fallback checkpoint mode is allowed only when:

- no subagent or multi-agent tool exists in the current runtime;
- the available tool is not callable after a concrete tool failure;
- the user explicitly forbids subagent use for this run.

If fallback mode is used, record the exact reason in
`code_changes/TASK_STATE.md`. Do not use fallback merely because the user did
not mention subagents, because the agent prefers a single-agent flow, or because
multi-agent coordination feels slower.

## Coordinator

Coordinator is a subagent when subagent tools are callable. It owns lightweight
planning only. It writes a compact dispatch plan for the root agent to execute.

Responsibilities:

- read this task contract;
- use the installed `strk-code-design` skill's read mode to understand the
  expected `code_design/` structure;
- read project instructions for repository paths and local rules;
- read `code_design/code-design.md` enough to identify requirements,
  repositories, major files/modules, migrations, tests, and risks;
- read `code_design/global/*.md` and requirement `handoff.md` files only when
  needed to identify dependencies or shared implementation;
- create and maintain `code_changes/TASK_STATE.md`;
- create and maintain `code_changes/implementation-index.md`;
- decide dependency order and worker ownership;
- prepare or reuse isolated worktrees;
- ensure CodeGraph readiness in changed worktrees;
- write the shared worker, requirement writer, coverage reviewer, final
  integration reviewer, and final assembler assignments into
  `implementation-index.md` for the root agent to spawn.

Coordinator must not:

- deep-read all requirement `design.md` files into one long context;
- deep-read all code areas before worker assignment;
- implement an entire non-trivial design directly;
- spawn other subagents;
- allow workers to shrink the implementation scope.

## Shared Implementation Worker

Use a shared implementation worker only when multiple requirements depend on
the same code path, API contract, data structure, migration, shared component,
service, store, feature flag, or test fixture.

The shared worker should implement the shared foundation or write a short
`worker-notes/shared-<topic>.md` only when needed to unblock downstream
requirement workers. Do not create a large shared design document.

## Requirement Writer

Each Requirement Writer owns exactly one requirement or one explicitly split
sub-requirement checkpoint.

Responsibilities:

- read only the relevant requirement portions of `code_design/code-design.md`,
  plus relevant `code_design/global/*.md`, requirement `design.md`, or
  requirement `handoff.md` when needed;
- read upstream requirement cards when this requirement depends on previous
  work, and read upstream worker notes or diffs only when the card points to a
  specific shared API, data structure, code path, conflict, or risk;
- inspect relevant code with CodeGraph for structural questions;
- implement the complete assigned requirement scope;
- run focused verification when feasible, or record the blocker;
- write or update the matching requirement card using the same slug as the
  `code_design/` requirement folder;
- report changed files, verification result, and any non-code follow-up in the
  requirement card and implementation index.

Requirement Writer must not:

- process another requirement;
- edit files outside assigned ownership without Coordinator reassignment;
- start the next requirement after finishing;
- produce broad process documentation instead of code.

If a writer is interrupted, blocked, or handling a large split requirement, it
may write a short `code_changes/worker-notes/<requirement-folder-slug>.md`
containing:

- assigned scope;
- changed files;
- completed implementation points;
- remaining implementation points;
- blockers or verification notes.

## Requirement Coverage Reviewer

Requirement-level review is a coverage gate only.

The reviewer reads the assigned requirement design source, the matching
requirement card, patch stats, and targeted hunks or files for the assigned
scope. It should not load the full repository patch by default. Read broader
diff context only when the card, patch stat, or requirement design points to a
specific shared path, migration, API contract, generated file, or high-risk
edge case.

The reviewer checks whether the assigned diff coverage includes:

- all demand points in that requirement;
- all implementation points for that requirement in the code design;
- requirement-specific edge cases, states, API fields, migrations, tests, and
  non-code follow-up that the design explicitly mentions.

The reviewer should not perform broad code-quality review, cross-requirement
architecture review, style review beyond obvious scope misses, or global test
strategy review at this stage. Those belong to final integration review.
Requirement coverage review therefore does not run the full
`strk-code-guidelines` review-guideline pass. It still uses project heuristics
when checking code paths that the requirement/design contract already made
relevant, including shared component choices, legacy surfaces, monitoring,
compatibility, dependency size, performance, IO, third-party reads, or database
queries. If a relevant project heuristic is part of the requirement/design
contract and the diff misses it, treat that as a coverage miss. If the reviewer
notices a broader heuristic or guideline risk outside the requirement coverage
gate, record it briefly for final integration review instead of expanding this
phase.

If coverage is incomplete, return the requirement to the writer with concrete
missing points, and update the requirement card and implementation index. If
coverage passes, mark it in the requirement card and implementation index.

# 5. Phase 0: Lightweight Implementation Plan

The Coordinator subagent performs a lightweight pass before any deep
implementation. The root agent should not perform Phase 0 when subagents are
callable.

Read enough to identify:

- complete in-scope requirement list;
- requirement dependencies and required implementation order;
- shared code paths, APIs, services, components, stores, migrations, feature
  flags, experiments, test fixtures, and config changes;
- included repositories and base branches;
- worktree paths;
- CodeGraph status;
- likely verification commands;
- non-code follow-up named by the design.

Do not deep-read all requirement details or all code. The goal is a routing map,
not implementation.

Phase 0 must create `code_changes/TASK_STATE.md` and
`code_changes/implementation-index.md`. Keep `TASK_STATE.md` as a concise
milestone log and use `implementation-index.md` as the implementation control
plane.

`implementation-index.md` must include a root-dispatch section with enough
information for the root agent to spawn each subagent without reading heavy
design context:

- worker/reviewer role;
- requirement or shared scope slug;
- matching `code_design/` requirement folder slug and requirement card path;
- dependency prerequisites;
- source design file paths to read;
- repository/worktree ownership;
- expected result to write back into the requirement card,
  implementation-index, or final-review-contract;
- whether the task can run now or must wait for another task.

After Phase 0, if the runtime cannot spawn workers for one of the allowed
fallback reasons, stop and report the checkpoint. In multi-agent mode,
Coordinator must stop after writing the dispatch plan. The root agent then
spawns the workers listed in `implementation-index.md`.

# 6. Worktree And CodeGraph Setup

For each included repository, work in a temporary git worktree under the current
STRK project root's `.worktrees/` directory, not under the source code
repository directory.

Use this project-local path pattern:

```text
<project-root>/.worktrees/<project-or-task>-<repo-name>
```

Use this pattern:

```bash
git -C <repo> status --short
git -C <repo> worktree list
git -C <repo> worktree add -b <branch-prefix>/<project-or-task>-<repo> <project-root>/.worktrees/<project-or-task>-<repo> <base-branch>
```

Choose `<branch-prefix>` from the active agent/runtime's local instructions when
configured; otherwise use `agent`. Choose `<base-branch>` from repository local
instructions or the current default branch, commonly `develop` for STRK repos.

If a proper worktree already exists, reuse it after confirming:

- it is on the intended branch;
- it has no unrelated changes that would contaminate the patch;
- prior worker changes are part of this task and documented.

Track whether each worktree was created by this workflow or reused. Worktrees
created by this workflow must be removed after patch generation. Reused
worktrees must be preserved unless the user explicitly asks to remove them.

Do not edit the original checkout unless the user explicitly requests it.

Before code edits in each worktree, check whether CodeGraph is initialized:

```bash
test -d <worktree>/.codegraph
```

If missing, initialize it from the worktree root:

```bash
codegraph init -i
```

Use CodeGraph for definitions, callers, callees, traces, and impact checks. Use
text search for literal strings, comments, translation keys, and static assets.

# 7. Requirement Writer Execution

Every in-scope requirement must be implemented by a Requirement Writer or by a
single fallback checkpoint.

Requirement writers should keep their context small:

- read only the design sections needed for their assigned requirement;
- inspect only relevant code paths;
- persist only concise notes when needed;
- report results to Coordinator instead of producing large documents.

If two requirements need the same file or module, do not run writers in
parallel on that ownership range. Assign a shared worker or serialize the
writers.

When one requirement depends on another, the dependent worker must read the
upstream requirement card first. Read the upstream diff or worker note only
when the card points to a specific shared API, data structure, code path,
conflict, or risk that must be inspected before editing.

# 8. Requirement Coverage Review

Each requirement must pass coverage review before final integration review.

Coverage review asks only:

1. Did the diff implement every demand point in this requirement?
2. Did the diff implement every code-design implementation point for this
   requirement?
3. Did the diff cover requirement-specific edge cases, states, API fields,
   migrations, tests, and non-code follow-up explicitly called out by the
   design?

Do not expand requirement-level review into broad quality review. If the
reviewer notices a global/code-quality issue, note it briefly for final
integration review, but do not block requirement coverage unless it means this
requirement is incomplete.
Do the same for `strk-code-guidelines` project heuristic concerns: only block
coverage when the heuristic is part of the requirement/design contract;
otherwise pass the concern to final integration review.

Record pass/fail and missing points in the matching requirement card and
`code_changes/implementation-index.md`.

# 9. Context Budget And Hard Stops

The workflow must actively prevent context explosion and context pollution.

Do not keep these in context long term:

- full `code_design/code-design.md`;
- all requirement designs at once;
- large code excerpts across multiple repos;
- every worker's detailed implementation state;
- all requirement cards plus full diffs plus full design files in the same
  context;
- every test log.

Persist only the minimum useful coordination state into `TASK_STATE.md` or a
short worker note when needed. Requirement-level facts needed after the worker
finishes must live in the matching requirement card, not in the root
conversation.

Hard stop rules:

- Root agent stops heavy reading after spawning the Coordinator, but continues
  dispatching subagents from compact `TASK_STATE.md` and
  `implementation-index.md`.
- Coordinator stops after Phase 0 dispatch planning.
- Shared worker stops after shared foundation work or concise shared note.
- Requirement Writer stops after implementing and reporting its assigned scope.
- Requirement Coverage Reviewer stops after coverage pass/fail.
- Final Integration Reviewer stops after final review result.
- Final Assembler stops after patches, README, and worktree cleanup.
- If context compression starts, is about to start, or the requirement becomes
  too large, write a short worker note and stop before starting new scope.

If one requirement is too large, split it into explicit sub-checkpoints such as:

- `R3-A backend API`
- `R3-B frontend state`
- `R3-C UI and tests`

The parent requirement cannot pass coverage review until all sub-checkpoints
pass.

# 10. Fallback Mode

Use checkpoint fallback only for the allowed fallback reasons from Section 4.
Do not choose fallback because the user did not explicitly request subagents. If
subagents are callable in the root context, the root agent must dispatch
subagents instead of running fallback checkpoints itself.

One run may complete only one of:

- Phase 0;
- one shared implementation checkpoint;
- one requirement writer checkpoint;
- one requirement coverage review checkpoint;
- final integration review;
- final assembly.

After each checkpoint, stop and report:

- what was completed;
- changed files;
- verification run or blocked;
- requirement card, implementation-index, or final-review-contract updates;
- next checkpoint to run.

Fallback mode still uses the same minimal output structure, coverage gates,
dependency ordering, and final completion gates. It is not permission to
collapse the whole implementation into one long-context pass.

# 11. Final Integration Review

After all requirement coverage reviews pass, run final integration review before
patch generation.

Use the installed `strk-code-guidelines` skill (`$strk-code-guidelines` in
runtimes that support `$skill` syntax) to load shared project heuristics, the
frontend review guideline, the backend review guideline, or both according to
the final diff's impact area. Project heuristics should already have informed
earlier code search and implementation choices when matching surfaces were
involved; final integration review verifies those choices still fit the whole
diff. Use them as non-exhaustive review prompts alongside the code design,
targeted diffs or source files indicated by requirement cards, local repository
conventions, verification evidence, and best engineering judgment.

Final integration review reads `implementation-index.md`, relevant requirement
cards, patch stats, verification summaries, and only the targeted diffs or
source files pointed to by cards as shared, conflicting, or high-risk. It must
not default to rereading every requirement design or every full patch in one
context. For large requirement sets, review cards in bounded batches grouped by
dependency group, repository, or shared touchpoint. As a soft threshold, use
bounded batches when there are more than 8-10 requirement cards, or when the
cards plus targeted diffs would exceed a comfortable working set. After each
batch, append the checked decisions, open risks, and source paths to
`final-review-contract.md`; the final pass should read the implementation index
and accumulated contract before selectively opening any remaining targeted
cards or diffs.

Review:

- shared code paths are consistent;
- API/data structures match across repositories;
- feature flags, experiments, permissions, migrations, and config changes are
  coherent;
- frontend and backend expectations align;
- code follows local patterns and avoids unrelated churn;
- STRK frontend conventions are followed;
- verification is adequate or blockers are documented;
- no worker reverted or overwrote another worker's change;
- all non-code follow-up is captured.

If a conflict or quality issue appears, send the affected requirement or shared
scope back to writer/reviewer correction.

When review passes or stops on blockers, ensure `final-review-contract.md`
contains the reviewed cross-requirement decisions, remaining issues, source
paths used, and any targeted follow-up required before patch generation or final
assembly.

# 12. Patch Generation

Create one patch file per changed repository.

Default layout:

```text
code_changes/
  README.md
  <repo-name>.patch
```

Generate patches from isolated worktrees. Include new files in the patch;
staging inside the isolated worktree is acceptable for patch generation:

```bash
git -C <worktree> add -A
git -C <worktree> diff --binary --full-index --cached HEAD > <project-root>/code_changes/<repo-name>.patch
```

Do not commit unless the user asks.

If there are no changes for an included repository, do not create an empty
patch. Mention the no-op repository in `code_changes/README.md`.

# 13. Worktree Cleanup

After patch files are generated and recorded, remove task-created worktrees.
The patch is the deliverable; the temporary worktree is not.

Before removing each worktree, verify:

- the corresponding patch file exists;
- the patch file includes the intended changes;
- verification results and blockers have been recorded;
- no unrelated changes are present in the worktree.

Use:

```bash
git -C <repo> worktree remove <project-root>/.worktrees/<project-or-task>-<repo>
```

If removal fails because the worktree has unexpected changes, stop and inspect
instead of forcing removal. Do not use `--force` unless the user explicitly
approves it.

If the workflow reused a pre-existing worktree, or the user explicitly asked to
keep a worktree for follow-up debugging, do not remove it. Record the retained
worktree path and reason in `code_changes/README.md`.

Temporary branches created only for the removed worktree may be left in the
source repository unless the user asks to delete them. If a runtime deletes the
temporary branch, it must first confirm the patch exists and no worktree still
uses the branch.

# 14. Final README

Write `code_changes/README.md` in Simplified Chinese. Assemble it primarily
from `implementation-index.md`, requirement cards, `final-review-contract.md`,
patch status, and verification summaries. Do not reread all worker contexts,
all requirement designs, or all full diffs to write the README; read targeted
source files only when a card or final-review-contract points to a specific
gap, conflict, or high-risk follow-up. The requirement-by-requirement section
should be mechanically assembled from requirement cards, preferably as a table
or compact list. Do not semantically reread and rewrite every card in one
context. For large requirement sets, read cards in bounded batches from the card
paths in `implementation-index.md`, append the corresponding README table rows
or compact list items, and then do the final pass from the README draft plus
`final-review-contract.md` instead of reopening all cards.

It must include:

- source design path and implemented requirement scope;
- included repositories, base branches, and worktree paths used during
  implementation;
- worktree cleanup status, including any retained worktree and reason;
- dependency order actually used;
- patch files and the repository/base branch each patch applies to;
- commands to apply each patch, such as `git apply <patch-file>`;
- requirement-by-requirement implementation details with changed files;
- verification commands run and results;
- skipped tests or blocked verification with exact reasons;
- known limitations or manual QA still needed;
- non-code changes required beyond the patches, such as cloud/platform
  configuration, feature flags, environment variables, data migrations, rollout
  steps, or operational coordination.

Use this source mapping for mechanical assembly:

- requirement implementation details and changed files come from requirement
  card `Changed Files` and `Implemented Points` sections;
- verification commands, skipped tests, and blockers come from requirement card
  `Verification` section and the implementation index;
- known limitations and requirement-specific non-code follow-up come from
  requirement card `Non-Code Follow-Up` sections;
- cross-requirement decisions, shared follow-up, and integration risks come
  from `final-review-contract.md`;
- patch application commands and base branches come from the implementation
  index and patch generation status.

If no non-code changes are needed, state that explicitly.

The README must preserve the implementation facts needed for a reviewer or
engineer to apply and inspect the patches, but it should not duplicate the full
code design, requirement cards, final-review-contract, or patch contents.

# 15. Final Completion Gate

Finish only when:

- `code_changes/TASK_STATE.md` exists and reflects actual milestones;
- `code_changes/implementation-index.md` exists and maps every in-scope
  requirement to its matching requirement card;
- each requirement card is named after the corresponding `code_design/`
  requirement folder slug and records changed files, verification, coverage
  status, and cross-requirement touchpoints;
- any intentional over-budget requirement card is recorded with a reason in
  `code_changes/implementation-index.md`;
- Phase 0 identified requirement dependencies and worker assignments;
- every in-scope requirement has passed requirement coverage review, unless the
  user explicitly deferred it or a blocker is documented;
- `code_changes/final-review-contract.md` records final integration review
  results, reviewed cross-requirement decisions, and any blockers;
- final integration review has passed or blockers are documented;
- each changed repository has a patch file;
- task-created worktrees have been removed, unless explicitly retained and
  documented;
- `code_changes/README.md` is complete and in Simplified Chinese;
- verification results or blockers are documented;
- non-code follow-up is documented.

If any gate fails, do not claim completion. Report the failed gate, update
`TASK_STATE.md`, and continue only within the next bounded worker/checkpoint.
