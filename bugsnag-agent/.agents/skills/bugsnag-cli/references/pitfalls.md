# bugsnag-cli Pitfalls & Boundaries

## Default Read-Only + Explicit Writes

- The CLI is read-only by default. Only `error-update` and `error-bulk-update`
  mutate BugSnag state, and both require `--write`.
- Without `--write` the CLI exits 1 with a clear error.
- Delete, create/link/unlink issue, and comment writes are not supported; use
  the BugSnag dashboard.
- `discard` is not delete: it stops future events and can be reversed with
  `undiscard`.

## Auth & Config

- Config file: `~/.bugsnagrc` (JSON). Use `config-path` to confirm.
- Auth is a Personal Auth Token sent as `Authorization: token <token>`.
- Priority: CLI flags > env vars (`BUGSNAG_AUTH_TOKEN`, `BUGSNAG_BASE_URL`,
  `BUGSNAG_ORGANIZATION`, `BUGSNAG_PROJECT`, `BUGSNAG_PROFILE`) > config file.
- `config-show` masks secrets (first 4 + last 2 chars).

## Pagination: Link and Offset

- Link-paginated: errors, events, error pivots, pivot values, releases, release groups.
- Offset-paginated: span groups, span group summaries, page load span groups,
  comments. Starred span groups use page_token/Link pagination.
- Every list command supports `--limit` (default 100). Offset commands also
  support `--offset`. There is no `--all` and no unbounded traversal.
- `release-list` caps `--per-page` at 10.

## Sorted Results Limit (API error code 60000)

- Sorted endpoints cap how many sorted results they can return. On
  `{ errors: [...], code: 60000 }`, bugsnag-cli retries once with `sort=unsorted`.
- After a downgrade, ordering may change; narrow the window with filters.

## Filter Syntax (strictly)

- `--filter` is repeatable. Only `k=v`, `k=v1,v2`, `k!=v`, and
  `k:empty=true|false` are supported.
- Serialized as `filters[FIELD][][type]=...` and `filters[FIELD][][value]=...`.
- Array query params use bracketed keys: `--pivots` sends `pivots[]`;
  `--categories` sends `categories[]`.
- Performance endpoints accept the same event-style filters. The
  `PerformanceFilter[]` shape returns HTTP 400; do not use it.
- Time filters such as `span.since` and `event.since` accept ISO 8601 UTC or
  relative values like `7d`; `ne` is not supported on time filters.

## Path Encoding

- Path IDs preserve existing `%XX` escapes and encode raw characters once.
- A literal `%XX` sequence in an ID is indistinguishable from an escape and is
  passed through; this is a documented heuristic.

## Span Pagination

- `span-group-spans` and `span-group-spans-by-name` pagination semantics are
  unverified without span data; prefer `span-group-spans` by ID when possible.

## Trend Path Drift

- The live API accepts singular `/trend` for error and project trends.
- The plural `/trends` path listed in the OpenAPI document returns HTTP 404.
- `error-trend` and `project-trend` use the singular path.

## Performance Plan Limits

- `performance-overview` returns HTTP 403 when the organization lacks the
  `performance-scores` plan feature.
- `span-group-list` may return an empty array even when healthy; verify the
  project has performance data before concluding there are no spans.

## latest_event Needs No Project

- `error-latest-event <errorId>` calls `GET /errors/{error_id}/latest_event`;
  the path has no project id, so `--project` is not accepted or needed.
- All other error-scoped commands require `--project` or a default project.

## Counts Reflect Filters

- With filters applied, `error-list` `events` / `users` counts are filtered counts,
  not lifetime totals (`unthrottled_occurrence_count` is untouched).
- Some endpoints cap `per_page` below 100 (events use max 30); the CLI sends
  per_page automatically and the API clamps it.

## JSON Output Mode

- Pass `--json` BEFORE the command name: `bugsnag-cli --json error-list`.
- In JSON mode, errors are `{ "isError": true, "error": "message" }` and the
  process exits with code 1. Check `isError` before parsing results.
- Shape downstream with jq: `bugsnag-cli --json error-list | jq ...`.
