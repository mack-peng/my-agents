# Backend Review Guideline

## Purpose

Use this guideline when reviewing backend merge request changes. It converts the STRK human backend review checklist into agent-friendly review heuristics.

This guideline is not exhaustive. Do not treat the absence of an item here as approval. Apply general engineering best practices, repository-specific conventions, the synced spec, the code design, and concrete code evidence.

For project-specific thresholds and defaults such as Bugsnag monitoring, read-only third-party data caching, complexity, broad reads, repeated writes, batch insertion, and multi-table joins, load `PROJECT_HEURISTICS.md`. Those heuristics also guide codebase research and implementation planning before review. Treat this guideline and those values as risk prompts, not universal merge blockers or automatic rules. Use judgement against the concrete spec, code, repository conventions, product intent, and tradeoffs; ask for justification or design changes only when the code ignores a relevant heuristic without a sound reason.

When this guideline is loaded, the final review report must include backend guideline checklist items for both top-level categories and their detailed sub-checks. Mark every item checked, linked to an issue, marked uncertain, fixed, `N/A`, or `Not checked` with a reason. Do not only report spec/design mismatches. If a guideline check reveals any plausible risk, possible bug, missing evidence, unclear tradeoff, or implementation concern, raise it as an `Open` or `Needs confirmation` issue instead of burying it in checklist notes. Only clearly safe items may be summarized solely in the checklist.

## Review Stance

Every proposed GitLab comment or report finding should state the reviewer stance:

- `[must]`: the issue must be addressed before merge.
- `[recommend]`: strongly recommended; usually worth fixing before merge unless the author provides a sound tradeoff.
- `[non-blocking]`: useful improvement or follow-up that should not block merge by itself.

Use severity (`P1`, `P2`, `P3`) for report prioritization and stance for reviewer intent. A `P1` or `P2` finding is usually `[must]` unless there is a clear reason otherwise.

## General Review Baseline

Check that the implementation:

- matches the resolved code design; if it intentionally differs, the MR or review report explains the difference and why it is acceptable;
- can be rolled back without breaking users, data, open clients, or external integrations;
- keeps the MR focused on the stated purpose and does not mix unrelated cleanup, debug code, or broad refactors;
- uses commit structure and messages that are understandable for review and future archaeology.

## Modeling And Reuse

Look for responsibility boundaries and unnecessary coupling:

- modules, services, models, jobs, and controllers have clear ownership and do not leak unrelated responsibilities;
- existing helpers, services, libraries, and framework patterns are reused where appropriate;
- duplicated logic is avoided or justified;
- magic numbers, hard-coded literals, product names, account ids, WMP types, and environment assumptions are avoided unless the spec explicitly narrows the scope.

When the spec is not limited to Strikingly, SXL, websites, or a specific WMP type, flag code that hard-codes those assumptions without justification.

## Error Handling And Third-Party Robustness

Check error paths as carefully as happy paths:

- exceptions are not silently swallowed;
- unknown or unexpected backend errors are surfaced through the appropriate monitoring path described in `PROJECT_HEURISTICS.md`, without leaking sensitive data;
- API responses return stable error codes or types when frontend behavior depends on them;
- third-party interactions have appropriate timeout, retry, and fallback behavior;
- retry logic is idempotent when state transitions are involved and always has an ending condition;
- read-only third-party data caching is checked against `PROJECT_HEURISTICS.md`.

## IO, Complexity, And Scale

Review production-scale cost, not only correctness on small examples, using `PROJECT_HEURISTICS.md` for project-specific threshold prompts:

- avoid unnecessary disk, network, API, or database reads;
- avoid broad fetches or fetching large batches when the code only needs a subset;
- avoid bursty writes when real-time behavior is unnecessary;
- avoid repeated writes when only the latest state matters;
- flag high time or memory complexity unless clearly justified.

## Compatibility And Existing Data

For data format, schema, or property changes, verify compatibility with existing data and open clients:

- existing data can be read safely after deploy;
- old formats are transformed on demand when possible;
- grandfathering logic exists when transformation is not possible;
- open browser tabs or older mobile clients do not break;
- existing keys or properties are not removed or semantically changed unless the release plan accounts for compatibility risk.

## Security And Privacy

Always check for common backend security failures:

- external input is not concatenated into SQL;
- SQL inputs are sanitized or parameterized;
- sensitive data such as passwords, payment data, credit cards, passports, national ids, tokens, or secrets is not stored or logged directly;
- authorization checks prevent one user or tenant from accessing another user's data;
- CORS, XSS, CSRF, and CSP behavior is not weakened;
- logs, monitoring events, and error responses do not expose sensitive data.

## Database Migrations

For database migrations, check that the migration is safe for existing production data:

- new migrations are added instead of modifying existing migration files;
- indices are added for columns used in `where` clauses;
- combined indices are used when combined conditions require them;
- adding an index to existing data uses concurrent mode when required by the repository/database;
- uniqueness constraints are preceded by duplicate-data checks;
- non-empty constraints are preceded by null/blank-data checks;
- one-off data transformation logic is not placed inside DB migration files unless explicitly justified and signed off.

## Database Queries

For new or changed queries, inspect both correctness and operational cost:

- no N+1 query pattern is introduced;
- transformations are not called inside `where` clauses unless justified and signed off;
- large inserts are checked against the batch-write heuristic in `PROJECT_HEURISTICS.md`;
- multi-table joins are checked against the join-count heuristic in `PROJECT_HEURISTICS.md`;
- query changes align with available indices and expected production cardinality.

## One-Off Data Migration Or Transformation

When the MR requires one-off data migration or transformation:

- the logic lives in a separate script or clearly documented Rails console procedure, not in ordinary request-path code;
- the code design or release checklist specifies exactly when to run it;
- additions or property population should run before deployment when the new code depends on them;
- removals or destructive transformations should run only when compatibility and rollback implications are clear.

## Concurrency And Transactions

Look for partial failure and race-condition risks:

- synchronous calls to internal or third-party services are avoided when the response is not needed by the request thread;
- asynchronous operations, such as jobs, callbacks, or background workers, have deterministic coordination when order matters;
- operations that must be atomic are wrapped in transactions;
- DML operations are placed after third-party or Redis operations inside a transaction when that reduces partial rollback risk;
- non-transactional side effects have compensation or retry logic when transaction rollback will not undo them;
- deadlock risk is minimized through stable lock ordering and short transactions;
- non-DB shared resources, such as Redis or third-party resources, handle race conditions explicitly.

## Readability, Language, And Framework Conventions

Review maintainability as part of backend quality:

- unconventional code has concise explanatory comments;
- debug code and unstructured debug logs are removed;
- logging uses appropriate levels and avoids sensitive data;
- Ruby code follows Ruby naming and style conventions;
- Rails code follows Rails conventions;
- RSpec code follows RSpec conventions;
- names are understandable and do not create ambiguity about behavior or ownership.

## i18n And Formatting

When backend code creates or serves localized content:

- dynamic values use interpolation rather than executable or dynamic i18n strings;
- injected values are translated or formatted correctly;
- dates and times use the product's expected timezone and locale behavior;
- currencies are formatted correctly;
- zero-decimal currencies, such as JPY and TWD, are handled correctly.

## Third-Party Libraries

When the MR adds or changes backend dependencies:

- the dependency version is pinned according to repository conventions;
- the license is acceptable, preferably MIT or Apache when the repository policy requires it;
- the dependency does not duplicate existing library functionality without justification;
- operational, security, and maintenance risks are acceptable for the feature value.
