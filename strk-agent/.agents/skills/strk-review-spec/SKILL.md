---
name: strk-review-spec
description: Deeply review a Strikingly product spec against external status quo, current code behavior, related specs, internal consistency, problem framing, and solution fit. Use when an agent needs to audit or critique a synced STRK spec, validate product assumptions, compare spec claims with code repositories and other local specs, inspect spec images/mockups, or produce a structured spec review report. Always use the installed `strk-prod-specs` skill's read mode (`$strk-prod-specs` in runtimes that support `$skill` syntax) for reading local spec content and attachments.
---

# STRK Review Spec

## Overview

Use this skill to review a specified STRK product spec and produce a Chinese review report under `spec_review/`.

This is an analysis workflow, not a code design workflow. It should investigate facts, code, related specs, images, and requirement logic, then produce actionable review findings for the spec author.

## Core Rules

- Use the installed `strk-prod-specs` skill's read mode (`$strk-prod-specs` in runtimes that support `$skill` syntax) to identify and read the target spec. Do not hand-parse `specs/` in a different way.
- Refresh or validate the local spec through the installed `strk-sync-specs` skill (`$strk-sync-specs` in runtimes that support `$skill` syntax) before review unless the user explicitly requests offline cache-only review.
- Inspect spec images, mockups, diagrams, flowcharts, and attachment manifests. Do not review from text alone when images exist.
- Inspect relevant images from their original local attachment files or linked design sources. Contact sheets or thumbnails may help identify which images exist, but they are not sufficient evidence for review findings and must not replace opening the original image.
- Ground every finding in evidence: spec quote or section, code file/symbol, related spec, external source, image, or logical contradiction.
- When reviewing current code behavior, use the installed `strk-code-guidelines` skill (`$strk-code-guidelines` in runtimes that support `$skill` syntax) for project heuristics that affect code search, code location, reuse judgment, compatibility, performance, IO, third-party reads, or database queries.
- Separate factual mismatches from product judgment. State uncertainty when evidence is incomplete.
- Keep final deliverables primarily in Simplified Chinese, preserving English identifiers, file paths, APIs, third-party product names, field names, and original quoted text when needed.

## Review Scope

Review the target spec across these dimensions:

1. Whether described external status quo matches current third-party or outside-system facts.
2. Whether described system status quo matches the current local codebase.
3. Whether the spec conflicts with related specs.
4. Whether the spec is internally inconsistent or self-contradictory.
5. Whether the problems derived from status quo are logically valid.
6. Whether proposed solutions fit the problems and status quo, and can reasonably solve them.

## Execution Mode

Load `references/REVIEW_TASK.md` before starting any substantial spec review. Treat it as the workflow contract.

If sub-agent or multi-agent tools are available and callable, and the review
includes multiple requirements or broad code/spec research, use the Coordinator
/ Shared Research Worker / Requirement Worker / Reviewer / Final Assembler
workflow described in `references/REVIEW_TASK.md`. The user does not need to
explicitly request subagents; this skill itself is the instruction to use them.

Use checkpoint fallback mode only when no sub-agent/multi-agent tool is
available, the tool is not callable after a concrete failure, or the user
explicitly forbids subagent use: complete only one phase or one requirement per
run, write progress and the fallback reason to `spec_review/TASK_STATE.md`, and
stop cleanly.

Never collapse a multi-requirement deep review into one long-context pass.

Keep the root agent and final assembly path thin. After requirement workers
finish, global consistency review and final assembly must use the low-context
`review-card.md`, `assembly-manifest.md`, `final-readiness.md`, and
`global/final-review-contract.md` artifacts described in
`references/REVIEW_TASK.md`; do not make one agent reread every requirement's
full `spec.md`, `evidence.md`, `findings.md`, or `handoff.md` just because the
final report needs complete coverage.

For large specs, review cards must be reduced in bounded batches into
`global/consistency-shards/shard-N.md` before final readiness. Prefer the
bundled `scripts/assemble_spec_review.py` for final report assembly so complete
finding coverage is preserved by deterministic extraction instead of by loading
all requirement findings into one agent context.

## Code And Project Context

Use the project's local instructions to find code repositories. STRK project workspaces usually record `bobcat`, `openhands`, and `component-kit` paths in `AGENTS.md`; Claude Code projects may expose the same instructions through a thin `CLAUDE.md` that imports `AGENTS.md`.

When CodeGraph is available in a code repository, prefer it for structural code questions such as symbol definitions, callers, callees, impact, and flow tracing. Use text search for literal strings and after opening a specific file.

When codebase research touches project-specific convention areas, use the installed `strk-code-guidelines` skill's project heuristics before deciding the search and inspection plan. This is broader than MR review guidance: it applies when locating current behavior, comparing candidate implementations, checking whether a spec's system-status assumptions are true, or judging whether a proposed solution fits existing code.

For external facts about third-party systems, official documentation and current authoritative sources are preferred. Browse or search when the fact may have changed, and cite the source in the review artifact.

## Required Reference

- `references/REVIEW_TASK.md`: the full STRK spec review workflow, artifact structure, worker responsibilities, completion gates, and final report template. Load it before creating, updating, reviewing, or judging `spec_review/` artifacts.
- the installed `strk-code-guidelines` skill (`$strk-code-guidelines` in runtimes that support `$skill` syntax): shared STRK project heuristics for codebase research and current-system-status review.
