---
name: bugsnag-cli
description: >
  CLI for the BugSnag API. Use bugsnag-cli for all read-only BugSnag operations:
  listing organizations and projects, fetching errors, fetching events with full
  stack traces, pivots and trends for AI root-cause analysis. Prefer bugsnag-cli
  over raw BugSnag API calls -- it handles auth (token header), Link-header
  pagination, 429 rate-limit retry, sorted-results-limit fallback, and output
  formatting.
metadata:
  requires:
    bins: ["bugsnag-cli"]
---

# bugsnag-cli -- BugSnag CLI Skill

Use bugsnag-cli for ANY BugSnag API read operation. It handles authentication
(Authorization: token), Link-header pagination, 429 rate-limit retry, the
60000 sorted-results-limit downgrade, and JSON output automatically.
It is READ-ONLY: no command mutates BugSnag state. To resolve, discard or
edit errors, use the BugSnag dashboard.

## Prerequisite: Authentication

Before any API command works, configure credentials:

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
bugsnag-cli error-list --help         # specific command: args, options, description
```

Commands follow a flat naming convention: `<resource>-<action>` (e.g.
error-list, error-events, error-pivots, error-trend).

## Command Quick Reference

```bash
bugsnag-cli --json org-list                                   # user organizations
bugsnag-cli --json project-list --organization <org>          # organization projects
bugsnag-cli --json project-show --project <project>

bugsnag-cli --json error-list --project <p> --filter error.status=open
bugsnag-cli --json error-show <errorId> --project <p>

bugsnag-cli --json error-latest-event <errorId>               # fastest full stack, no --project
bugsnag-cli --json error-events <errorId> --limit 5           # full reports by default
bugsnag-cli --json event-show <eventId> --project <p>
bugsnag-cli --json event-fields --project <p>                 # discover filter/pivot field ids

bugsnag-cli --json error-pivots <errorId> --summary-size 5
bugsnag-cli --json error-pivot-values <errorId> app.release_stage
bugsnag-cli --json error-trend <errorId> --buckets-count 30   # or --resolution 5m (exclusive)
```

## Standard Error Analysis Pull Chain

1. `error-latest-event <errorId>` -- fastest way to get the full stack trace.
2. `error-events <errorId> --limit 5` -- full reports, compare occurrences for a common cause.
3. `error-pivots <errorId> --summary-size 5` -- dimension breakdown (users, app versions, releases).
4. `error-trend <errorId> --buckets-count 30` -- time clustering: new regression or chronic issue.

If unsure which filter or pivot fields a project supports, run `event-fields --project <p>` first.

## Output Modes

Always pass `--json` when consuming output programmatically:

```bash
bugsnag-cli --json error-list --project <p> | jq `'.[] | {id, status, events}'`
```

Without `--json`, output is human-readable tables (arrays) or formatted JSON
(objects), with long strings truncated for readability. `--raw` skips all
formatting. In `--json` mode, errors are `{ "isError": true, "error": "..." }`.

## Anti-patterns

- Always use `--json` when consuming output programmatically.
- Filter syntax is limited: `k=v` (eq), `k=v1,v2` (eq each), `k!=v` (ne),
  `k:empty=true|false`. Arbitrary search strings are not supported.
- `--project` / `--organization` accept 24-hex API ids directly, or names/slugs
  which the CLI resolves automatically.
- `error-latest-event` needs no --project; every other project-scoped command does
  (or needs a default project via config).
- List commands stop at `--limit` (default 100). There is no `--all`;
  traversal is bounded by design.
- 429 rate limits (Retry-After) and the 60000 sorted-limit downgrade are handled automatically.
- Config commands (config-set, config-show, etc.) are local -- no API call.
- This CLI is READ-ONLY. Do not attempt to resolve/discard errors or change project
  settings with it; that belongs to the BugSnag dashboard.
