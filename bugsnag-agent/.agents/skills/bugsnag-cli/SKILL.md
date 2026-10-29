---
name: bugsnag-cli
description: >
  CLI for the BugSnag API. Use bugsnag-cli for BugSnag read operations and
  explicit error triage: listing organizations and projects, fetching errors,
  events, project trends, releases, saved searches, comments, and performance
  span groups and traces. Mutating commands require --write. Prefer bugsnag-cli
  over raw BugSnag API calls -- it handles auth, Link/offset pagination, 429
  retry, sorted-results fallback, and output formatting.
metadata:
  requires:
    bins: ["bugsnag-cli"]
---

# bugsnag-cli -- BugSnag CLI Skill

Use bugsnag-cli for BugSnag API operations. It handles authentication
(Authorization: token), Link-header and offset pagination, 429 retry, the
60000 sorted-results-limit downgrade, and JSON output automatically.

The CLI is read-only by default. The only mutating commands are
`error-update` and `error-bulk-update`; both require `--write`.
Delete, issue linking, and comment writes are not supported; use the BugSnag
dashboard for those.

## Prerequisite: Authentication

```bash
bugsnag-cli config-set auth-token <personal-auth-token>   # from app.bugsnag.com/settings/my-account
bugsnag-cli config-set organization <org-id-or-name>      # optional default organization
bugsnag-cli config-set project <project-id-or-name>       # optional default project
```

Config is stored in `~/.bugsnagrc`. Verify with `bugsnag-cli config-show`.
Override per-command: `bugsnag-cli --auth-token <t> --base-url <url> <command>`.
Multiple instances (profiles): `bugsnag-cli config-new staging` -> `bugsnag-cli -p staging config-set ...`

## Command Discovery

Do NOT memorize all commands. Use:

```bash
bugsnag-cli --help                    # all commands grouped by category
bugsnag-cli span-group-list --help    # specific command: args, options, description
```

Commands follow a flat naming convention: `<resource>-<action>` (e.g.
error-list, project-trend, span-group-list).

## Command Quick Reference

Navigation and projects:

```bash
bugsnag-cli --json org-list
bugsnag-cli --json project-list --organization <org>
bugsnag-cli --json project-show --project <project>
```

Errors, events, and comments:

```bash
bugsnag-cli --json error-list --project <p> --filter error.status=open
bugsnag-cli --json error-show <errorId> --project <p>
bugsnag-cli --json error-latest-event <errorId>
bugsnag-cli --json error-events <errorId> --limit 5
bugsnag-cli --json event-list --project <p> --limit 10
bugsnag-cli --json event-show <eventId> --project <p>
bugsnag-cli --json event-fields --project <p>
bugsnag-cli --json comment-list <errorId> --project <p>
```

Project health, pivots, trends, saves searches:

```bash
bugsnag-cli --json project-pivots --project <p> --summary-size 10
bugsnag-cli --json project-pivot-values app.release_stage --project <p>
bugsnag-cli --json project-trend --project <p> --buckets-count 30
bugsnag-cli --json project-stability --project <p>
bugsnag-cli --json saved-search-list --project <p>
bugsnag-cli --json saved-search-show <savedSearchId>
```

Releases:

```bash
bugsnag-cli --json release-list --project <p>
bugsnag-cli --json release-show <releaseId> --project <p>
bugsnag-cli --json release-group-list --project <p> --release-stage-name production
bugsnag-cli --json release-group-show <releaseGroupId>
```

Performance:

```bash
bugsnag-cli --json span-group-list --project <p> --sort duration_p95 --filter span.since=7d
bugsnag-cli --json span-group-summaries --project <p>
bugsnag-cli --json span-group-show <spanGroupId> --project <p>
bugsnag-cli --json span-group-timeline <spanGroupId> --project <p>
bugsnag-cli --json span-group-distribution <spanGroupId> --project <p>
bugsnag-cli --json span-group-performance-targets <spanGroupId> --project <p>
bugsnag-cli --json span-group-spans <spanGroupId> --project <p>
bugsnag-cli --json span-group-spans-by-name <category> <name> --project <p>
bugsnag-cli --json starred-span-group-list --project <p>
bugsnag-cli --json page-load-span-group-list --project <p>
bugsnag-cli --json page-load-span-group-show <pageLoadSpanGroupId> --project <p>
bugsnag-cli --json trace-fields --project <p>
bugsnag-cli --json trace-spans <traceId> --project <p> --from <ISO> --to <ISO>
bugsnag-cli --json org-trace-spans <traceId> --organization <org> --from <ISO> --to <ISO>
bugsnag-cli --json performance-overview --project <p>
bugsnag-cli --json network-grouping-show --project <p>
```

Triage writes (require `--write`):

```bash
bugsnag-cli error-update <errorId> --project <p> --write --operation fix
bugsnag-cli error-update <errorId> --project <p> --write --operation assign --assigned-collaborator-id <id>
bugsnag-cli error-update <errorId> --project <p> --write --operation snooze --reopen-if occurs_after --seconds 3600
bugsnag-cli error-bulk-update --project <p> --write --error-ids id1,id2 --operation ignore
```

## Standard Workflows

1. Project error overview: `error-list --project <p> --sort events --filter error.status=open --filter event.since=1d`.
2. Single error deep dive: `error-latest-event <errorId>` -> `error-events <errorId> --limit 5` -> `error-pivots <errorId> --summary-size 5` -> `error-trend <errorId>`.
3. Project health: `project-trend` + `project-stability` + `project-pivots`.
4. Release regression: `release-list --project <p>` -> `release-group-list --project <p> --release-stage-name production` -> compare error trends around the release.
5. Performance triage: `trace-fields` -> `span-group-list --sort duration_p95 --filter span.since=7d` -> `span-group-show` -> `span-group-spans` or `trace-spans`.
6. Triage: `error-show` to confirm the error, then `error-update --write` and verify the returned status.

## Output Modes

Always pass `--json` when consuming output programmatically:

```bash
bugsnag-cli --json error-list --project <p> | jq '.[] | {id, status, events}'
```

Without `--json`, output is human-readable tables (arrays) or formatted JSON
(objects), with long strings truncated for readability. `--raw` skips all
formatting. In `--json` mode, errors are `{ "isError": true, "error": "..." }`.

## Pagination: Link and Offset

- Event, error, pivot-value, release, and release-group lists use `Link: rel="next"`.
- Span groups, page loads, and comments use `offset` + `per_page`.
- Starred span groups use `page_token`/Link pagination in the live API.
- Both modes respect `--limit` (default 100). There is no `--all`; traversal is bounded by design.
- `release-list` caps `--per-page` at 10.
- Offset traversal assumes a short page means the end; an endpoint that silently truncates `per_page` can stop early.

## Filters

`--filter` is repeatable and supports:

- `k=v` (eq), `k=v1,v2` (one eq per value)
- `k!=v` (ne)
- `k:empty=true|false` (emptiness)

They serialize to `filters[FIELD][][type]=...` and `filters[FIELD][][value]=...`.
Performance endpoints use the same event-style filters; do not send a
PerformanceFilter[] object.

Discover event fields with `event-fields --project <p>` and trace fields with
`trace-fields --project <p>`.

## Anti-patterns

- Always use `--json` when consuming output programmatically.
- Do not attempt delete, issue linking, or comment writes; they are not exposed.
- Mutating commands require `--write`; without it they fail by design.
- `error-latest-event` needs no `--project`; every other project-scoped command does.
- List commands stop at `--limit` (default 100); there is no unbounded `--all`.
- 429 rate limits and the 60000 sorted-limit downgrade are handled automatically.
- The live API uses singular `/trend`; the plural `/trends` path returns 404.
