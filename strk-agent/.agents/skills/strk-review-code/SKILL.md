---
name: strk-review-code
description: Review STRK GitLab merge requests against the synced product spec, resolved code design, and MR code diff. Use when an agent needs to review a self-hosted GitLab MR, check whether implementation matches `specs/` and the relevant code design source, produce a Chinese code review report, or optionally publish reviewed comments back to GitLab after explicit confirmation.
---

# STRK Review Code

## Overview

Use this skill to review a self-hosted GitLab merge request against the product spec, the relevant code design, and the actual code diff.

The default output is a local Chinese review report under the configured review output directory. Do not publish GitLab comments unless the user explicitly confirms after reading the local report.

## Core Rules

- Read GitLab access from `~/.strk-gitlab/config.toml` by default. If the user provides a different config path, use it only for that run.
- Never print, quote, commit, include in reports, or pass GitLab tokens through visible command arguments. Use token values only inside the process that makes API requests.
- Treat GitLab 10.8.x compatibility as the baseline. Prefer conservative GitLab API v4 endpoints and always fall back to local report or summary note if inline discussion publishing is unavailable.
- Use local git repositories for diff and code inspection. Use the GitLab API for MR metadata, commits, changed files, notes, and discussions.
- Use the installed `strk-prod-specs` skill (`$strk-prod-specs` in runtimes that support `$skill` syntax) to read synced product specs. Do not satisfy this dependency by opening this repository's local skill source files.
- Resolve the code design before judging implementation correctness. If a local `code_design/` package exists, use the installed `strk-code-design` skill (`$strk-code-design` in runtimes that support `$skill` syntax) in read mode and follow its routing artifacts first instead of starting from the assembled `code_design/code-design.md` by default. If no local `code_design/` exists, ask the user for the code design link and read it from Atlassian/Confluence with `acli` or from Google Docs with `gws`.
- Keep requirement-related MR review context bounded. Broad reviews must use a review index, a compact batch plan, low-context requirement cards, guideline check files, shard contracts when needed, a final review contract, and deterministic final assembly instead of loading every requirement, design section, diff, and checklist item into one active agent context.
- Use the spec as the higher-priority product contract when the spec and code design conflict. Still call out the conflict explicitly in the review output so developers can judge whether the design, implementation, or spec needs correction.
- Use CodeGraph in affected code repositories when available for structural questions such as definitions, callers, callees, flows, and impact. Use text search for literal strings, translation keys, comments, static assets, and generated output.
- For project-specific heuristics and thresholds, use the installed `strk-code-guidelines` skill (`$strk-code-guidelines` in runtimes that support `$skill` syntax) when inspecting surrounding code or MR changes that touch matching frontend styling, component, legacy surface, monitoring, compatibility, dependency, performance, IO, or data-query areas. These heuristics are not hard rules; judge applicability and ask for justification when a relevant heuristic is ignored without a sound reason.
- For backend changes, use the installed `strk-code-guidelines` skill's backend review guideline and apply it as a risk checklist. It is not exhaustive; still use general engineering judgment and repository-specific conventions.
- For frontend changes, use the installed `strk-code-guidelines` skill's frontend review guideline and apply it as a risk checklist. It is not exhaustive; still use general engineering judgment and repository-specific conventions.
- Keep final deliverables primarily in Simplified Chinese, preserving English identifiers, file paths, API names, field names, product names, and original quoted text when needed.

## Config Contract

Default single-host config:

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

If `~/.strk-gitlab/config.toml` is missing, create a private empty template there, restrict permissions to owner-only when possible, and ask the user to fill it in. If the token is missing, stop before making API calls.

## Workflow

Load `references/REVIEW_CODE_TASK.md` before starting any substantial MR review, judging review completeness, or publishing comments. Treat it as the workflow contract.

Use the bounded workflow in `references/REVIEW_CODE_TASK.md` for broad or multi-requirement reviews. Plan broad reviews in batches before deep reading, keep each requirement card within its dependency budget, and use the bundled assembler for `review.md` instead of hand-summarizing all cards in one pass. When batch review is active, one deep-review pass should handle only one batch plus any compact shared shard contract it explicitly depends on; record batch progress in `TASK_STATE.md` before moving to another batch. Use checkpoint fallback mode only when sub-agent or multi-agent tools are unavailable, uncallable, or explicitly disabled: complete one phase or one requirement/guideline checkpoint at a time, write progress under the configured review output directory, and stop cleanly instead of collapsing a broad MR review into one long-context pass.

## Required Reference

- `references/REVIEW_CODE_TASK.md`: the full STRK GitLab MR code review workflow, config handling, evidence rules, report template, publishing gates, and completion criteria.
- `scripts/validate_review_artifacts.py`: deterministic structural validator for bounded-context review artifacts. Run it before final assembly when available.
- `scripts/assemble_review_report.py`: deterministic report assembler for `review.md`. Use it after `global/final-review-contract.md` is ready; do not replace it with a final free-form summary pass over all cards.
- the installed `strk-code-guidelines` skill (`$strk-code-guidelines` in runtimes that support `$skill` syntax): shared STRK project heuristics plus frontend/backend review guidelines. Use project heuristics when inspecting surrounding code or MR changes touching matching frontend styling, component, legacy surface, monitoring, compatibility, dependency, performance, IO, or data-query areas. Use backend review guidance for backend code, data models, APIs, jobs, migrations, integrations, server-side i18n, or backend dependencies. Use frontend review guidance for frontend code, UI behavior, client-side data handling, styles, bundles, WMP code, frontend i18n, or frontend dependencies.
