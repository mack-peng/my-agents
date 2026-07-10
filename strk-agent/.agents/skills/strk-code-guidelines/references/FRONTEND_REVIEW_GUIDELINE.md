# Frontend Review Guideline

## Purpose

Use this guideline when reviewing frontend merge request changes. It converts the STRK human frontend review checklist into agent-friendly review heuristics.

This guideline is not exhaustive. Do not treat the absence of an item here as approval. Apply general engineering best practices, repository-specific conventions, the synced spec, the code design, and concrete code evidence.

For project-specific thresholds and defaults such as legacy frontend surfaces, Bugsnag monitoring, mobile baseline, WMP / WeChat constraints, network polling, expensive UI size, and dependency size, load `PROJECT_HEURISTICS.md`. Those heuristics also guide codebase research and implementation planning before review. Treat this guideline and those values as risk prompts, not universal merge blockers or automatic rules. Use judgement against the concrete spec, code, repository conventions, product intent, and tradeoffs; ask for justification or design changes only when the code ignores a relevant heuristic without a sound reason.

When this guideline is loaded, the final review report must include frontend guideline checklist items for both top-level categories and their detailed sub-checks. Mark every item checked, linked to an issue, marked uncertain, fixed, `N/A`, or `Not checked` with a reason. Do not only report spec/design mismatches. If a guideline check reveals any plausible risk, possible bug, missing evidence, unclear tradeoff, or implementation concern, raise it as an `Open` or `Needs confirmation` issue instead of burying it in checklist notes. Only clearly safe items may be summarized solely in the checklist.

## Review Stance

Every proposed GitLab comment or report finding should state the reviewer stance:

- `[must]`: the issue must be addressed before merge.
- `[recommend]`: strongly recommended; usually worth fixing before merge unless the author provides a sound tradeoff.
- `[non-blocking]`: useful improvement or follow-up that should not block merge by itself.

Use severity (`P1`, `P2`, `P3`) for report prioritization and stance for reviewer intent. A `P1` or `P2` finding is usually `[must]` unless there is a clear reason otherwise.

## General Review Baseline

Check that the implementation:

- matches the resolved code design; if it intentionally differs, the MR or review report explains the difference and why it is acceptable;
- can be rolled back without breaking users, saved data, open browser tabs, mobile clients, or WMP clients;
- keeps the MR focused on the stated purpose and does not mix unrelated cleanup, debug code, or broad refactors;
- uses commit structure and messages that are understandable for review and future archaeology.

## Modeling, Reuse, And Tech Stack

Look for clear ownership and appropriate reuse:

- components, hooks, services, stores, utilities, and style modules have clear responsibility boundaries;
- existing components, helpers, styles, tokens, libraries, and framework patterns are reused where appropriate;
- duplicated logic is avoided or justified;
- magic numbers, hard-coded literals, product names, WMP types, site types, account ids, and environment assumptions are avoided unless the spec explicitly narrows the scope;
- legacy frontend technology choices are checked against `PROJECT_HEURISTICS.md`.

When the spec is not limited to Strikingly, SXL, websites, or a specific WMP type, flag code that hard-codes those assumptions without justification.

## Backend And Third-Party Failure Handling

Check failure states as part of the user experience:

- backend failures have a fallback UI and a manual retry path when retry is meaningful;
- user-facing error messages guide the user's next step without exposing internal details;
- exceptions are not silently swallowed;
- unexpected frontend errors are surfaced through the appropriate monitoring path described in `PROJECT_HEURISTICS.md`, without leaking sensitive data;
- console logging is used only when appropriate for debugging and does not replace monitoring or user feedback;
- third-party interactions have appropriate timeout, retry, fallback UI, and manual retry behavior;
- retry logic is idempotent when state transitions are involved and always has an ending condition.

## Performance, IO, And Complexity

Review main-thread cost and client-side scale, using `PROJECT_HEURISTICS.md` for project-specific threshold prompts:

- avoid unnecessary re-rendering of expensive UI;
- avoid unoptimized data processing that can freeze the main thread;
- avoid serializing or deserializing large JSON on the main thread without justification;
- avoid repeated network requests unless explicitly justified and signed off;
- flag high time or memory complexity using the threshold prompts in `PROJECT_HEURISTICS.md`.

## Compatibility And Existing Data

For data loaded from backend APIs:

- saving or updating data does not change or delete existing keys/properties unless the compatibility plan accounts for it;
- old data shapes are handled safely;
- open browser tabs and older mobile clients are not broken by the new client-side assumptions;
- client-side defaults do not mask backend compatibility issues that should be fixed explicitly.

## Mobile And Responsive Behavior

Unless the spec clearly says mobile optimization is out of scope, verify mobile behavior using the baseline in `PROJECT_HEURISTICS.md`.

Review for:

- content overflow, clipped text, impossible taps, and broken layout;
- modals, drawers, forms, tables, and menus on small screens;
- loading, empty, and error states on mobile;
- keyboard and viewport behavior when forms are involved.

## Security And Privacy

Always check for common frontend security failures:

- sensitive data such as passwords, payment data, credit cards, passports, national ids, tokens, or secrets is not exposed in URLs;
- sensitive data is not logged to console, monitoring, analytics, or browser storage without explicit justification;
- user-controlled content is not rendered in a way that introduces XSS;
- CORS, CSRF, and CSP behavior is not weakened;
- frontend authorization assumptions are backed by backend checks when data access matters.

## WMP Bundle And Compliance

When the MR changes WMP code or increases WMP bundle size:

- verify the WMP bundle remains below the project constraints described in `PROJECT_HEURISTICS.md`;
- flag added dependency or asset size that risks those limits;
- prefer smaller or existing alternatives when functionality overlaps.

## Async And React Concurrency

Look for undetermined behavior caused by async operations:

- code does not read React state immediately after `setState` as if it has already updated;
- behavior does not depend on async-loaded scripts being available before they are actually loaded;
- effects, callbacks, promises, timers, and subscriptions clean up correctly;
- async responses cannot overwrite newer user actions or newer data;
- request cancellation, stale response guards, or sequence checks are used when needed.

## Readability, Language, And Framework Conventions

Review maintainability as part of frontend quality:

- unconventional code has concise explanatory comments;
- debug code and unstructured debug logs are removed;
- logging uses appropriate levels and avoids sensitive data;
- JavaScript naming follows local conventions and remains clear;
- code follows the repository's ESLint rules;
- data transformations use clear collection operations such as `map` and `reduce` when they express the intent better than manual mutation;
- React code does not use direct DOM operations unless there is an explicit, justified integration need;
- names are understandable and do not create ambiguity about behavior or ownership.

## i18n And Formatting

When frontend code renders localized content:

- dynamic values use interpolation rather than executable or dynamic i18n strings;
- injected values are translated or formatted correctly;
- dates and times use the product's expected timezone and locale behavior;
- currencies are formatted correctly;
- zero-decimal currencies, such as JPY and TWD, are handled correctly.

## Third-Party Libraries

When the MR adds or changes frontend dependencies:

- the dependency version is pinned according to repository conventions;
- the license is acceptable, preferably MIT or Apache when the repository policy requires it;
- the dependency does not duplicate existing library functionality without justification;
- added libraries are checked against the size heuristic in `PROJECT_HEURISTICS.md`;
- operational, security, maintenance, and bundle-size risks are acceptable for the feature value.
