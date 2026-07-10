---
name: strk-code-guidelines
description: Shared STRK code guidelines and project heuristics used by STRK design, implementation, codebase research, spec review, and MR review skills. Use when an agent needs project-specific engineering heuristics for code search, code location, reuse decisions, implementation planning, or review, or when it needs the canonical frontend/backend review guidelines.
---

# STRK Shared Code Guidelines

This skill is a shared reference package. It exists so other STRK skills can use
one canonical copy of code guidelines, review guidelines, and project heuristics
instead of duplicating them in each skill.

Use this skill when a STRK workflow needs:

- project-specific heuristics for colors, component reuse, LESS syntax, legacy
  frontend surfaces, monitoring, compatibility, dependency size, performance,
  IO, third-party reads, or database queries;
- codebase research guidance for searching, locating, comparing, and judging
  relevant existing code before design or implementation choices;
- implementation planning guidance for deciding whether to reuse, extend, or
  add code in affected repositories;
- frontend review risk categories and stance guidance;
- backend review risk categories and stance guidance.

## Judgement First

All references in this skill are advisory engineering guidance. They are meant
to prompt better code research, design, implementation, and review, not to
replace project context or professional judgement. Consuming skills may require
agents to load and consider the applicable references, but no heuristic or
guideline item is automatically mandatory just because it appears relevant.

Apply a guideline only when it fits the spec, mockups, current code, repository
conventions, runtime constraints, product intent, and engineering tradeoffs. If
the better choice is to deviate, record the context-specific reason briefly in
the relevant design, review, or handoff artifact.

## Required References

- `references/PROJECT_HEURISTICS.md`: STRK project heuristics for codebase
  research, design, implementation, and review. These are not universal hard
  rules; judge applicability against the spec, mockups, existing code,
  repository conventions, and engineering tradeoffs.
- `references/FRONTEND_REVIEW_GUIDELINE.md`: frontend review risk categories
  and comment stance guidance. Use it as a risk-prompting checklist, not as an
  automatic rulebook.
- `references/BACKEND_REVIEW_GUIDELINE.md`: backend review risk categories and
  comment stance guidance. Use it as a risk-prompting checklist, not as an
  automatic rulebook.

## Dependency Rule

Other STRK skills should depend on the installed `strk-code-guidelines`
skill (`$strk-code-guidelines` in runtimes that support `$skill` syntax)
through the active agent's normal skill mechanism. Do not copy these references
into each consuming skill.
