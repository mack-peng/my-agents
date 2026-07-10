---
name: strk-write-code
description: Fully implement STRK code changes from an existing `code_design/` package or STRK code design document. Use when an agent needs to read a STRK design with the installed `strk-code-design` skill's read mode (`$strk-code-design` in runtimes that support `$skill` syntax), lightly index the full design, split implementation by requirement and dependency order, create isolated git worktrees under the current project root's `.worktrees/` directory, use CodeGraph for structural code work, run requirement-level writer/reviewer checkpoints with low-context requirement cards, and deliver complete per-repository patch files plus a Chinese README for applying the full in-scope implementation.
---

# STRK Write Code

## Overview

Use this skill to turn an existing STRK code design into complete code changes
without disturbing other agents or the user's active repository checkouts.

This skill is not an MVP/prototype workflow. It must fully implement the
requested design scope unless the user explicitly narrows the scope or a blocker
is documented. Requirement splitting, worker assignment, and checkpoints are
context-management mechanisms; they must not drop requirements, edge cases,
shared dependencies, tests, migrations, or non-code follow-up.

## Required Inputs

Work from the STRK project root, not directly from a code repository, unless the
user explicitly says the project root and repo are the same.

Expected project inputs:

- Project instructions with code repository paths, usually in `AGENTS.md`;
  Claude Code projects may expose the same instructions through a thin
  `CLAUDE.md` that imports `AGENTS.md`.
- `code_design/code-design.md` and supporting files under `code_design/`.
- The user's implementation request, if they explicitly want only a subset of
  the design.

If any required input is missing or ambiguous, inspect the project first. Ask
only when the repo set or target design cannot be determined safely.

## Required Workflow Reference

Before implementing code, load `references/WRITE_CODE_TASK.md` from this skill
and follow it as the authoritative execution contract. Do not simplify its
phase structure, minimal output rules, dependency ordering, requirement coverage
review, final integration review, patch generation, worktree cleanup, or README
requirements.

The workflow borrows the installed `strk-code-design` skill's
multi-agent/checkpoint discipline, but keeps code implementation lean:

- the root agent stays thin and acts only as the subagent dispatcher when
  subagent tools are callable;
- Phase 0 lightweight indexing of the full code design and requirement
  dependencies is performed by the Coordinator subagent, not by the root agent;
- shared implementation workers only when shared code paths require them;
- requirement-level writer workers that primarily produce code diffs;
- requirement-level coverage reviewers that check only requirement/design-point
  completeness;
- compact requirement cards named after the corresponding `code_design/`
  requirement folder, used for final review and README assembly without
  rereading every requirement in full;
- final integration review for cross-requirement consistency, code quality,
  verification, shared dependency issues, and applicable frontend/backend review
  guidance;
- final patch and `code_changes/README.md` delivery.

If the current runtime provides callable subagent or multi-agent tools, use
multi-agent mode by default. The user does not need to explicitly request
subagents. Fallback checkpoint mode is allowed only when no such tool is
available/callable, the user explicitly forbids subagents, or a concrete tool
failure blocks subagent use; record the reason in `code_changes/TASK_STATE.md`.

When subagent tools are callable, the root agent must not read the full
`code_design/code-design.md`, all requirement designs, or large code diffs.
Spawn a Coordinator subagent first. After it writes the compact dispatch plan in
`code_changes/TASK_STATE.md` and `code_changes/implementation-index.md`, the
root agent must spawn the listed writer, coverage reviewer, final integration
reviewer, and final assembler subagents itself. Use only one subagent layer:
subagents must not spawn other subagents. Keep root-agent context limited to
compact `TASK_STATE.md` / implementation-index updates, final patch status, and
final user-facing delivery.

## Code Design Dependency

Use the installed `strk-code-design` skill (`$strk-code-design` in runtimes that
support `$skill` syntax) in read mode before making implementation decisions.
This is a skill dependency, not a source-file dependency: do not satisfy it by
opening this repository's local `strk-code-design` source files or a
machine-specific skill installation path. If `strk-code-design` is unavailable
in the current agent runtime, stop and report the missing skill instead of
approximating the workflow from local files.

The Coordinator subagent should read the design starting from
`code_design/code-design.md`, then use `code_design/TASK_STATE.md`,
`code_design/global/*.md`, `code_design/*/design.md`, and
`code_design/*/handoff.md` as directed by `references/WRITE_CODE_TASK.md`. Treat
the code design as the implementation contract. If the user asks to implement
the design without narrowing it, every requirement in the design is in scope.

## Repository And CodeGraph Rules

Use the project's local instructions to find code repositories. STRK project
workspaces usually record `bobcat`, `openhands`, and `component-kit` paths in
`AGENTS.md`.

For each included repository, work in a temporary git worktree under the current
STRK project root's `.worktrees/` directory, for example
`<project-root>/.worktrees/<project-or-task>-<repo-name>`. Do not create task
worktrees under the source code repository directory. Do not edit the original
checkout unless the user explicitly requests it. After patches are generated
and recorded, remove worktrees created for this task unless the user explicitly
asks to keep them.

Before code edits in each worktree, ensure CodeGraph is initialized there. Use
CodeGraph for structural questions such as definitions, callers, callees, flow
traces, and impact checks. Use text search for literal strings, comments,
translation keys, static assets, and after opening a specific file. When code
search or location touches likely STRK project convention areas, use the
installed `strk-code-guidelines` skill's project heuristics to decide which
shared components, legacy surfaces, monitoring paths, compatibility baselines,
dependencies, performance paths, IO paths, and query patterns need inspection.

## STRK Project Heuristics

When implementation, code search, or code location touches frontend styling,
component reuse, legacy frontend surfaces, monitoring, mobile/WMP
compatibility, dependency size, performance, IO, third-party reads, or database
queries, use the installed `strk-code-guidelines` skill (`$strk-code-guidelines`
in runtimes that support `$skill` syntax). These heuristics are shared across
STRK skills and are not hard rules. Apply the ones that fit the current code
and design; when a relevant heuristic is intentionally not used, record the
context-specific reason in `code_changes/README.md` or the relevant worker
notes.

## Final Review Guidance

During final integration review, use the installed `strk-code-guidelines` skill
(`$strk-code-guidelines` in runtimes that support `$skill` syntax) for project
heuristics when the final diff touches matching heuristic surfaces, for the
frontend review guideline when the final diff touches frontend code, and for
the backend review guideline when it touches backend code. If the final diff
touches both surfaces, use both guidelines. These guidelines are
non-exhaustive review prompts: do not treat a guideline miss as the only kind of
issue that matters, and do not treat the absence of a matching guideline item as
approval. Continue to use the code design, concrete diff, repository
conventions, verification evidence, and best engineering judgment.

## Completion Criteria

Finish only when the gates in `references/WRITE_CODE_TASK.md` pass, including:

- Phase 0 design indexing, dependency mapping, worktree setup, and CodeGraph
  readiness are documented by the Coordinator subagent;
- every requirement in the requested design scope has passed requirement
  coverage review, unless explicitly deferred by the user or blocked with
  documented reasons;
- final integration review has checked cross-requirement consistency, shared
  code paths, code quality, verification, and applicable frontend/backend review
  guidance;
- verification has been run or blocked reasons are documented;
- one patch exists for each changed repository;
- task-created worktrees have been removed, unless the user explicitly asked to
  keep them or a reused worktree must be preserved and documented;
- `code_changes/README.md` explains how to apply the diffs and any non-code
  follow-up.
