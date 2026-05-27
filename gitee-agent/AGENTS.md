# AGENTS.md — gitee-cli Reference

`@orangemust/gitee-cli` is a CLI tool for managing Gitee (码云) repos, issues, PRs, releases, and orgs.
Run via `gitee-cli` (global install) or `npx @orangemust/gitee-cli`.

## Authentication

```
gitee-cli auth login              # Interactive login (hides token input)
echo "token" | gitee-cli auth login --with-token  # Non-interactive via stdin
gitee-cli auth logout             # Clear stored credentials
gitee-cli auth status             # Show current auth status
```

Token priority: `GITEE_TOKEN` env var > `~/.gitee-cli/config.json`

## Global Flags

| Flag | Description |
|------|-------------|
| `--json` | JSON output for parsing |
| `--repo <owner/repo>` | Override auto-detected repo |
| `--page <n>` | Page number (default 1) |
| `--per-page <n>` | Results per page (max 100, default 20) |

## Repo auto-detection

Inside a Gitee repo directory, `--repo` can be omitted — it auto-detects from `git remote`. Supports both:
- `https://gitee.com/owner/repo.git`
- `git@gitee.com:owner/repo.git`

## Repository

```
gitee-cli repo list                             # List repos (authenticated user)
gitee-cli repo list --owner <user>              # List specific user's repos
gitee-cli repo list --type <type>               # all|owner|public|private|member (default: all)
gitee-cli repo list --page <n>                  # Pagination
gitee-cli repo list --per-page <n>              # Results per page (max 100)
gitee-cli repo list --json                      # JSON output

gitee-cli repo create <name>                    # Create repo
gitee-cli repo create <name> --private          # Create private repo
gitee-cli repo create <name> --description "..." # Set description
gitee-cli repo create <name> --org <org>        # Create under organization
gitee-cli repo create <name> --json             # JSON output

gitee-cli repo view [owner/repo]                # View repo details (auto-detect or specify)
gitee-cli repo view --repo <owner/repo>         # Explicit repo
gitee-cli repo view --json                      # JSON output

gitee-cli repo clone <owner/repo>               # Clone a repo

gitee-cli repo delete <owner/repo>              # Delete repo (asks confirmation)
gitee-cli repo delete <owner/repo> --yes        # Skip confirmation
```

## Issue

```
gitee-cli issue list                            # List issues (open, auto-detect repo)
gitee-cli issue list --repo <owner/repo>        # Explicit repo
gitee-cli issue list --state <state>            # open|closed|all (default: open)
gitee-cli issue list --page <n>                 # Pagination
gitee-cli issue list --per-page <n>             # Results per page
gitee-cli issue list --json                     # JSON output

gitee-cli issue create --title "Bug: xxx"       # Create issue
gitee-cli issue create --title "..." --body "..."     # With body
gitee-cli issue create --title "..." --assignee <user> # Assign to user
gitee-cli issue create --repo <owner/repo> --title "..." # Explicit repo
gitee-cli issue create --json                   # JSON output

gitee-cli issue view <number>                   # View issue details
gitee-cli issue view <number> --repo <owner/repo> # Explicit repo
gitee-cli issue view <number> --json            # JSON output

gitee-cli issue update <number> --title "..."   # Update title
gitee-cli issue update <number> --body "..."    # Update body
gitee-cli issue update <number> --assignee <user> # Reassign
gitee-cli issue update <number> --state <state> # open|closed|progressing|rejected
gitee-cli issue update <number> --labels "bug,urgent" # Comma-separated labels
gitee-cli issue update <number> --repo <owner/repo> # Explicit repo
gitee-cli issue update <number> --json          # JSON output

gitee-cli issue close <number>                  # Close issue
gitee-cli issue close <number> --repo <owner/repo> # Explicit repo
gitee-cli issue close <number> --json           # JSON output

gitee-cli issue comment <number> --body "..."   # Add comment
gitee-cli issue comment <number> --repo <owner/repo> --body "..." # Explicit repo
gitee-cli issue comment <number> --json         # JSON output

gitee-cli issue comments <number>               # List all comments
gitee-cli issue comments <number> --repo <owner/repo> # Explicit repo
gitee-cli issue comments <number> --page <n>    # Pagination
gitee-cli issue comments <number> --per-page <n> # Results per page
gitee-cli issue comments <number> --json        # JSON output
```

## Pull Request

```
gitee-cli pr list                               # List PRs (open, auto-detect)
gitee-cli pr list --repo <owner/repo>           # Explicit repo
gitee-cli pr list --state <state>               # open|closed|merged|all (default: open)
gitee-cli pr list --page <n>                    # Pagination
gitee-cli pr list --per-page <n>                # Results per page
gitee-cli pr list --json                        # JSON output

gitee-cli pr create --title "feat: xxx" --head <branch>  # Create PR
gitee-cli pr create --title "..." --head <branch> --base <branch> # Custom base (default: master)
gitee-cli pr create --title "..." --head <branch> --body "..." # With description
gitee-cli pr create --repo <owner/repo> --title "..." --head <branch> # Explicit repo
gitee-cli pr create --json                      # JSON output

gitee-cli pr view <number>                      # View PR details
gitee-cli pr view <number> --repo <owner/repo>  # Explicit repo
gitee-cli pr view <number> --json               # JSON output

gitee-cli pr merge <number>                     # Merge PR (plain merge)
gitee-cli pr merge <number> --method squash     # Squash merge
gitee-cli pr merge <number> --method rebase     # Rebase merge
gitee-cli pr merge <number> --message "..."     # Custom merge message
gitee-cli pr merge <number> --repo <owner/repo> # Explicit repo
gitee-cli pr merge <number> --json              # JSON output

gitee-cli pr close <number>                     # Close PR
gitee-cli pr close <number> --repo <owner/repo> # Explicit repo
gitee-cli pr close <number> --json              # JSON output

gitee-cli pr comment <number> --body "..."      # Add comment
gitee-cli pr comment <number> --repo <owner/repo> --body "..." # Explicit repo
gitee-cli pr comment <number> --json            # JSON output

gitee-cli pr comments <number>                  # List all comments
gitee-cli pr comments <number> --repo <owner/repo> # Explicit repo
gitee-cli pr comments <number> --page <n>       # Pagination
gitee-cli pr comments <number> --per-page <n>   # Results per page
gitee-cli pr comments <number> --json           # JSON output

gitee-cli pr files <number>                     # List changed files (+additions -deletions, colored)
gitee-cli pr files <number> --repo <owner/repo> # Explicit repo
gitee-cli pr files <number> --json              # JSON output

gitee-cli pr diff <number>                      # Show diff (+green -red, colored)
gitee-cli pr diff <number> --repo <owner/repo>  # Explicit repo
gitee-cli pr diff <number> --json               # JSON output (patch per file)

gitee-cli pr review <number> --action approve               # Approve PR
gitee-cli pr review <number> --action request_changes        # Request changes
gitee-cli pr review <number> --action comment --body "..."   # Review comment
gitee-cli pr review <number> --repo <owner/repo> --action ... # Explicit repo
gitee-cli pr review <number> --json             # JSON output

gitee-cli pr review-comments <number>            # List review comments
gitee-cli pr review-comments <number> --repo <owner/repo> # Explicit repo
gitee-cli pr review-comments <number> --page <n> # Pagination
gitee-cli pr review-comments <number> --per-page <n> # Results per page
gitee-cli pr review-comments <number> --json     # JSON output
```

## Release

```
gitee-cli release list                          # List releases
gitee-cli release list --repo <owner/repo>      # Explicit repo
gitee-cli release list --page <n>               # Pagination
gitee-cli release list --per-page <n>           # Results per page
gitee-cli release list --json                   # JSON output

gitee-cli release create --tag v1.0.0 --name "Release v1.0.0"  # Create release
gitee-cli release create --tag v1.0.0 --name "..." --body "..." # With body
gitee-cli release create --tag v1.0.0 --name "..." --draft     # Create as draft
gitee-cli release create --tag v1.0.0 --name "..." --prerelease # Mark as pre-release
gitee-cli release create --repo <owner/repo> --tag v1.0.0 --name "..." # Explicit repo
gitee-cli release create --json                 # JSON output
```

## Organization

```
gitee-cli org list                              # List organizations
gitee-cli org list --page <n>                   # Pagination
gitee-cli org list --per-page <n>               # Results per page
gitee-cli org list --json                       # JSON output
```

## Raw API

```
gitee-cli api GET <path>                        # GET request to Gitee API v5
gitee-cli api POST <path>                       # POST request
gitee-cli api PUT <path>                        # PUT request
gitee-cli api DELETE <path>                     # DELETE request
gitee-cli api <method> <path> --field key=value # Set request field (repeatable)
gitee-cli api <method> <path> --query key=value # Set query parameter (repeatable)
gitee-cli api <method> <path> --paginate        # Auto-paginate all pages, combine results
gitee-cli api <method> <path> --no-auth         # Skip authentication
gitee-cli api <method> <path> --json            # Compact JSON output

# Examples:
gitee-cli api GET /user
gitee-cli api GET /repos/owner/repo
gitee-cli api POST /user/repos --field name=myrepo --field private=true
gitee-cli api GET /repos/owner/repo/issues --query state=open
gitee-cli api GET /repos/owner/repo/issues --paginate
gitee-cli api GET /emojis --no-auth
```

## Common patterns

```bash
# JSON parsing with jq
gitee-cli repo list --json | jq '.[].full_name'
gitee-cli issue list --json | jq '.[] | {number: .number, title: .title}'
gitee-cli pr list --json | jq '.[] | select(.state == "open") | .title'

# One-liner install + configure
npm install -g @orangemust/gitee-cli && echo "token" | gitee-cli auth login --with-token && gitee-cli auth status
```

## Errors

- **Authentication required** → No token. Run `gitee-cli auth login` or set `GITEE_TOKEN`.
- **Unauthorized** → Token invalid/expired. Get a fresh token.
- **Not found** → Repo doesn't exist or token lacks access.
- **Forbidden** → Token lacks required scopes.
- **Could not determine repository** → Not in a Gitee git dir and no `--repo` flag.
