---
name: strk-sync-specs
description: Sync and read Strikingly Atlassian/Confluence product specs into a local specs folder. Use when an agent needs to initialize, refresh, manage, or inspect Strikingly spec documents from Confluence URLs, especially when preserving structured page content, tracking local vs online page versions, using a 24-hour version-check cache, or deciding whether to use acli versus Chrome.
---

# STRK Sync Specs

## Core Rules

- Prefer `acli` for Atlassian/Confluence docs. Use Chrome only as a fallback because it is slow for this workflow.
- Run authenticated `acli` commands outside the sandbox. Inside the sandbox, `acli` may not see local auth credentials and can incorrectly report unauthenticated.
- Use the installed `strk-prod-specs` skill's write mode (`$strk-prod-specs` in runtimes that support `$skill` syntax) as the canonical contract for `specs/specs.json`, synced spec folders, body representations, attachment manifests, and cache invariants.
- Manage specs through `specs/specs.json`. It is the project-local source of truth for each spec's identity, local path, versions, and version-check timestamp.
- Before reading a local spec, refresh or validate it through the sync script. If the online version was checked within the last 24 hours and local files exist, use the local cache. If the check is stale, query Confluence and redownload only when the online version is newer.

## Local Layout

Use the installed `strk-prod-specs` skill's write mode (`$strk-prod-specs` in runtimes that support `$skill` syntax) for the authoritative local layout and schema. The bundled `scripts/sync_specs.sh` is the implementation that writes that format.

Do not copy the sync logic into every project. Keep the reusable implementation in this skill's bundled `scripts/sync_specs.sh`; projects should only keep `specs/specs.json` and downloaded spec folders.

## Manifest Schema

Use the `specs/specs.json` schema defined by the installed `strk-prod-specs` skill's write mode (`$strk-prod-specs` in runtimes that support `$skill` syntax). Keep page IDs as strings and `local_path` project-relative.

## Workflow

1. If `specs/specs.json` is missing, create it from the provided Confluence URLs. Derive `page_id` from `/pages/<id>/` in the URL and choose stable lowercase slugs.
2. Before reading a spec, run this skill's bundled `scripts/sync_specs.sh` script against the project, for example: `<strk-sync-specs-skill-dir>/scripts/sync_specs.sh --project "$PWD" <slug>`. Resolve the script path from this installed skill directory according to the active agent runtime; do not assume a specific global skill path. If the command needs online access or `acli` auth, run it outside the sandbox.
3. Use `--project <path>` when running from outside the project root, or `--manifest <path/to/specs.json>` when the manifest has a custom location.
4. For reading semantics, use the installed `strk-prod-specs` skill's read mode (`$strk-prod-specs` in runtimes that support `$skill` syntax). In short: read `body.view.local.html` first for quick rendered content with local image paths, then use `attachments/manifest.json`, `body.storage.xml`, and `body.atlas_doc_format.json` as needed.
5. After a download, ensure the manifest's `local_version`, `online_version`, and `online_version_checked_at` are updated.

## Download Mapping

For each spec, download the three Confluence body representations required by the installed `strk-prod-specs` skill's write mode (`$strk-prod-specs` in runtimes that support `$skill` syntax):

```bash
acli confluence page view --id "$page_id" --json --body-format storage
acli confluence page view --id "$page_id" --json --body-format atlas_doc_format
acli confluence page view --id "$page_id" --json --body-format view
```

The bundled `scripts/sync_specs.sh` writes the local files, derived metadata, title/source helpers, rendered local HTML, and attachment manifest according to the installed `strk-prod-specs` skill's write mode (`$strk-prod-specs` in runtimes that support `$skill` syntax).

## Figma Mockups

This sync script does **not** automatically download Figma mockups. Prefer Figma MCP or the Figma UI for design analysis when available. If local Figma REST API caching is explicitly needed, use the separate `strk-sync-figma` skill (`$strk-sync-figma` in runtimes that support `$skill` syntax) manually.

## Image Attachments

The sync script extracts embedded Confluence image attachments from `body.view.html` and downloads them through the Confluence attachment REST download endpoint:

```text
/wiki/rest/api/content/<page_id>/child/attachment/att<attachment_id>/download
```

The script loads the Atlassian API token from `~/.acli/config.toml`. It reads `[atlassian] api_token = "..."` and optionally `[atlassian] email = "..."`. If the config file is missing, the script creates a private template at that path with blank values and asks the user to fill in the token and email. If the file exists but the token or email is blank or missing, the script reminds the user to fill in the missing value. It uses `ATLASSIAN_EMAIL` when set, otherwise defaults to the config email.

For each downloaded image:

- The file is saved under the spec folder's `attachments/` directory.
- `attachments/manifest.json` records the original URL and local path.
- `body.view.local.html` rewrites `src`, `data-image-src`, and `srcset` on matching `<img>` tags to local `attachments/...` paths, and adds `data-local-image-src`.
- Existing files in `attachments/` are preserved across spec refreshes. Before downloading, the script reuses already-downloaded images by current local path or by previous manifest `resource_id`; only missing current images are fetched again.

When a spec has embedded images, image download is part of a successful sync. If the Atlassian API token is missing from `~/.acli/config.toml` or any image download fails, the sync command fails rather than leaving an incomplete local spec.

## Validation

Run these checks after creating or updating the local spec setup:

```bash
jq empty specs/specs.json
bash -n <strk-sync-specs-skill-dir>/scripts/sync_specs.sh
<strk-sync-specs-skill-dir>/scripts/sync_specs.sh --project "$PWD"
```

The final command should use local cache when `online_version_checked_at` is still within `cache_ttl_hours`.
