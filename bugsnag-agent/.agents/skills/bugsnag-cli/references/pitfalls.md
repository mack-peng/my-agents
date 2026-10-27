# bugsnag-cli Pitfalls & Boundaries

## Read-Only Positioning

- Every bugsnag-cli command is a GET. There is no discard, delete, update or
  status-change command.
- To resolve, reopen, ignore or delete errors, use the BugSnag dashboard.

## Auth & Config

- Config file: `~/.bugsnagrc` (JSON). Use `config-path` to confirm.
- Auth is a Personal Auth Token sent as `Authorization: token <token>`.
  Tokens live at app.bugsnag.com/settings/my-account.
- Priority: CLI flags > env vars (`BUGSNAG_AUTH_TOKEN`, `BUGSNAG_BASE_URL`,
  `BUGSNAG_ORGANIZATION`, `BUGSNAG_PROJECT`, `BUGSNAG_PROFILE`) > config file.
- `config-show` masks secrets (first 4 + last 2 chars).

## Pagination: Link Header + Limit

- List endpoints paginate via the RFC-style `Link: <...>; rel="next"` header;
  bugsnag-cli follows it automatically.
- Every list command supports `--per-page` (page size, default 30) and `--limit`
  (cumulative fetch cap, default 100).
- Traversal stops when the next Link is absent or `--limit` results were collected.
- There is NO `--all` flag and no unbounded traversal.

## Sorted Results Limit (API error code 60000)

- Sorted endpoints cap how many sorted results the API can return. When the API
  responds with `{ errors: [...], code: 60000 }`, bugsnag-cli transparently retries
  once with `sort=unsorted`.
- After a downgrade, rows may not arrive in `last_seen` order; do not rely on
  ordering across that boundary, or add filters to narrow the window yourself.

## Filter Syntax (strictly)

- `--filter` is repeatable. Only these expression forms are supported:
  `k=v` (eq), `k=v1,v2` (one eq per value), `k!=v` (ne),
  `k:empty=true|false` (emptiness).
- They are serialized to `filters[FIELD][][type]=...` and `filters[FIELD][][value]=...`
  query parameters.
- Time filters (`event.since`, `event.before`) accept ISO 8601 UTC or relative
  times like `7d`, and do not support `ne`.
- Discover valid field ids per project with `event-fields --project <p>` (e.g.
  `error.status`, `app.version`, `user.email`).

## latest_event Needs No Project

- `error-latest-event <errorId>` calls `GET /errors/{error_id}/latest_event` --
  the path has no project id, so `--project` is not accepted or needed.
- All other project-scoped commands (`error-show`, `error-events`,
  `event-show`, `error-pivots`, `error-pivot-values`, `error-trend`,
  `event-fields`) require `--project` or a default project from config.

## Counts Reflect Filters

- With filters applied, `error-list` `events` / `users` counts are the
  filtered counts, not lifetime totals (`unthrottled_occurrence_count` is untouched).
- Some endpoints cap `per_page` below 100 (events use max 30); the CLI sends
  per_page automatically and the API clamps it.

## JSON Output Mode

- Pass `--json` BEFORE the command name: `bugsnag-cli --json error-list`.
- In JSON mode, errors are `{ "isError": true, "error": "message" }` and the
  process exits with code 1. Check for `isError` before parsing results.
- Shape downstream with jq: `bugsnag-cli --json error-list | jq ...`.
- Text mode truncates long strings (summary, message, event_class); use
  `--json` for complete objects.
