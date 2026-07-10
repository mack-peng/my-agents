---
name: strk-code-design
description: Read, understand, review, or create Strikingly code design documents that follow the STRK `code_design/` structure and DESIGN_TASK workflow. Use when an agent needs to write a canonical code design from a locally synced Confluence spec, identify a spec by name or slug via `specs/specs.json` and the installed `strk-sync-specs` skill (`$strk-sync-specs` in runtimes that support `$skill` syntax), inspect existing `code_design/` artifacts, explain requirement/global design contents, check completion gates, or reason about whether a code design satisfies STRK workflow requirements.
---

# STRK Code Design

## Overview

Use this skill to work with STRK code design packages under `code_design/`.

This skill supports two related modes:

- **Write mode**: turn a specific locally synced STRK spec into a complete Chinese code design package and canonical `code_design/code-design.md`.
- **Read mode**: inspect, explain, review, or reason about an existing `code_design/` package according to the same required structure, gates, and design contract.

The authoritative workflow and detailed requirements live in `references/DESIGN_TASK.md`. Load that reference whenever the task involves creating, validating, reviewing, or judging compliance of code design artifacts. Do not simplify the workflow, gates, artifact structure, TODO discipline, language rules, review requirements, or final assembly requirements.

Project heuristics live in the installed `strk-code-guidelines` skill (`$strk-code-guidelines` in runtimes that support `$skill` syntax). Load that skill whenever requirement work needs to search, locate, compare, or reason about code in affected repositories, and during design and review when the work touches matching frontend, styling, component, implementation, monitoring, compatibility, dependency, performance, IO, or data-query surfaces. These heuristics are not hard rules; use them as high-probability prompts, judge applicability against the spec, mockups, existing code, repository conventions, product intent, and engineering tradeoffs, and briefly record the reason when a relevant heuristic is intentionally not used.

Frontend and backend review heuristics also live in the installed `strk-code-guidelines` skill (`$strk-code-guidelines` in runtimes that support `$skill` syntax). Load the applicable guideline during requirement self review, reviewer passes, or compliance review when the design touches that surface. These guidelines are not exhaustive; use them as additional review prompts alongside the spec, code evidence, repository conventions, and engineering judgment.

Code designs must pass the backend implementation depth gate from
`references/DESIGN_TASK.md`. When backend work is `core` impact, such as
permissions, data, creation, validation, storage, async jobs, third-party IO,
cross-repo receiving, token/session handling, upload, handoff, verification, or
launch/create actions, the requirement design must include concrete backend
file boundaries, controller/service/model/job flow, error/transaction/test
details, and at least one core code skeleton. Do not accept a backend section
that only lists API paths, JSON fields, or vague service names.

## Choose The Mode

Use **write mode** when the user asks to create, generate, assemble, draft, or complete a code design for a spec.

Use **read mode** when the user asks to:

- explain an existing code design;
- find the relevant requirement design for a behavior;
- review whether `code_design/` is complete or compliant;
- check readiness gates, TODO discipline, handoffs, or final assembly quality;
- compare code design contents against the STRK requirements;
- answer implementation questions from existing requirement `design.md` and
  `global/*.md` sources, using `code_design/code-design.md` mainly as the
  human-facing assembled document.

## Write Mode: Resolve The Target Spec

1. Work from the project root that contains `specs/specs.json`. If the current directory is a skill repo rather than a project repo, ask for or infer the actual project root before continuing.
2. If the user names a spec by title, partial title, slug, or short description, match it against `specs/specs.json` fields such as `slug`, `title`, `source_url`, and `local_path`.
3. If there is exactly one plausible match, use it. If multiple specs match, ask the user to choose before starting the design workflow.
4. Before reading the matched spec, use the installed `strk-sync-specs` skill (`$strk-sync-specs` in runtimes that support `$skill` syntax) to refresh or validate the local copy. Prefer the sync script from that skill, passing `--project <project-root>` and the matched slug.
5. Use the installed `strk-prod-specs` skill's read mode (`$strk-prod-specs` in runtimes that support `$skill` syntax) as the canonical contract for reading the synced spec. Resolve content from `body.view.local.html`, `body.storage.xml`, `body.atlas_doc_format.json`, and `attachments/manifest.json` according to that skill.
6. Follow the installed `strk-prod-specs` skill's read mode (`$strk-prod-specs` in runtimes that support `$skill` syntax) for Figma mockups: identify Figma URLs in the synced spec and use Figma MCP as the default way to inspect the referenced file, page, frame, node, prototype, or screenshot.

## Write Mode: Load The Design Workflow

After the target spec is clear and locally available:

1. Read this skill's `references/DESIGN_TASK.md`.
2. Treat that reference as the exact task contract, except replace its example target spec name with the resolved user-requested spec.
3. Create all required artifacts under the project root's `code_design/` directory.
4. Keep final deliverables primarily in Simplified Chinese, preserving English only for code identifiers, file paths, API names, field names, product names, and original text that must remain English.
5. When a design includes concrete code changes, ensure the design instructs implementers to fit existing code style, avoid unnecessary refactors or formatting churn, and prefer reasonable reuse so later `strk-write-code` work (`$strk-write-code` in runtimes that support `$skill` syntax) produces focused, reviewable diffs.
6. During code design, use the installed `strk-code-guidelines` skill's project heuristics before and during code research, candidate comparison, implementation planning, and requirement self review. The heuristics must inform the final `design.md` conclusions whenever they fit the context, but they remain guidance rather than mandatory implementation rules.
7. Before choosing to reuse, modify, or extend an existing API, helper, component, service, hook, store, function, or method, inspect its implementation and relevant callers. Do not infer suitability from similar names, signatures, file paths, or surface shape, including when similar candidates exist across multiple repositories.
8. Name each requirement deliverable subfolder as `rN-<requirement-name-slug>`, where `N` is the requirement's spec order number, for example `r1-ai-entry` and `r2-template-picker`. Keep the suffix based on the requirement name, abbreviating long names when needed. Do not use generic names such as `requirement-1`.
9. Strictly keep requirement artifacts one-to-one with the spec requirements. Each requirement must have its own subfolder, `worker-task.md`, `spec.md`, `spec-analyze.md`, `design.md`, `handoff.md`, worker pass, and reviewer pass. Do not bundle multiple requirements into one research packet, one worker assignment, one subfolder, or one combined requirement design, even when the requirements share code paths or must be implemented together.
10. When a requirement crosses repositories or applications, such as a bobcat entry launching or handing data to openhands, design both sides of the boundary. Identify the source repository, target repository, payload contract, receiving-side implementation, compatibility with existing entry paths, failure recovery, and tests in each affected repository. Do not treat a cross-repo handoff as complete if only the initiating repository is designed in detail.

## Execution Mode

Follow `references/DESIGN_TASK.md` for multi-agent vs fallback execution:

- If sub-agent or multi-agent tools are available and callable, use the Coordinator / Shared Research Worker / Requirement Worker / Reviewer / Final Readiness / Consistency Checker / Final Assembler workflow. The user does not need to explicitly request subagents; this skill itself is the instruction to use them.
- Use checkpoint fallback mode only when no sub-agent/multi-agent tool is available, the tool is not callable after a concrete failure, or the user explicitly forbids subagent use. In fallback mode, complete only one allowed phase per run: Phase 0, one requirement, one reviewer pass, final readiness / consistency contract, final assembly, or mechanical final gate, and record the fallback reason in `code_design/TASK_STATE.md`.

In either mode, never collapse the workflow into a single long-context pass across all requirements.

## Read Mode: Understand Existing Designs

When reading an existing `code_design/` package:

1. Read `references/DESIGN_TASK.md` enough to understand the expected artifact structure, fixed sections, gates, and final assembly rules.
2. Treat `code_design/code-design.md` as the human-facing assembled design. Start there only when the user wants the full document, a broad human-readable overview, or final delivery wording.
3. For agent understanding, implementation planning, code work, review, provenance, or requirement-level questions, do not start by reading the full `code-design.md`. Start with `code_design/TASK_STATE.md`, `code_design/assembly-manifest.md`, `code_design/final-readiness.md`, and `code_design/global/final-assembly-contract.md` when present, then read the relevant `assembly-card.md` files to identify the specific requirement and global sources needed.
4. Prefer `code_design/global/*.md` and the targeted `code_design/rN-*/design.md` files for substantive implementation details. Read full requirement `design.md` files only for the requirement(s) relevant to the question, or when a card / contract points to a specific conflict, source gap, or high-risk dependency.
5. Treat `assembly-card.md` and `handoff.md` as navigation, consistency, readiness, and recovery artifacts, not as primary design sources. `assembly-card.md` is for low-context routing and cross-requirement signals; `handoff.md` is for completion status and handoff risk.
6. If reviewing compliance, check the exact gates from `references/DESIGN_TASK.md`, including required files, fixed sections, assembly-card coverage, TODO status, Completion Certificate fields, final assembly readiness, manifest validity, and length/completeness expectations.
7. If the existing design is incomplete or non-compliant, state the concrete missing artifact, section, gate, or workflow violation. Do not silently infer missing design details as if they were completed.

## Code And Project Context

Use the project's local instructions to find code repositories. STRK project workspaces usually record `bobcat`, `openhands`, and `component-kit` paths in `AGENTS.md`; Claude Code projects may expose the same instructions through a thin `CLAUDE.md` that imports `AGENTS.md`.

When CodeGraph is available in a code repository, prefer it for structural code questions such as symbol definitions, callers, callees, impact, and flow tracing. Use text search for literal strings and after opening a specific file.

When locating or comparing existing code, use the installed `strk-code-guidelines` skill (`$strk-code-guidelines` in runtimes that support `$skill` syntax) to bring project heuristics into the research plan. For example, use it to remember likely shared component sources, legacy frontend surfaces, monitoring paths, compatibility baselines, dependency-size prompts, and backend IO/query thresholds before deciding which files, symbols, callers, or candidate implementations matter.

For frontend-related designs, also consider its STRK frontend implementation heuristics during both design and review. Treat them as default prompts, not universal requirements; if a relevant heuristic is not used, explain the context-specific reason briefly in the requirement artifacts.

## Required Reference

- `references/DESIGN_TASK.md`: the full STRK code design workflow, artifact templates, gates, review rules, and final assembly rules. Load it before creating, updating, reviewing, or judging `code_design/` artifacts.
- `scripts/assemble_code_design.py`: deterministic final assembly helper. Use it from the installed `strk-code-design` skill directory when `references/DESIGN_TASK.md` calls for manifest-driven assembly of `code_design/code-design.md`.
- the installed `strk-code-guidelines` skill (`$strk-code-guidelines` in runtimes that support `$skill` syntax): shared STRK project heuristics plus frontend/backend review guidelines. Use project heuristics whenever codebase research, design, implementation planning, or review touches matching frontend, backend, styling, monitoring, compatibility, dependency, performance, IO, or data-query surfaces.
