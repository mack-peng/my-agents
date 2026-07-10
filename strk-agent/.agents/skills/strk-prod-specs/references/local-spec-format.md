# Local Spec Format

## Scope

Define the project-local representation of STRK product specs synced from Confluence. This reference is authoritative for both consumers that read specs and producers that write spec cache files.

## Project Layout

Each product project stores synced specs under:

```text
specs/
  specs.json
  <slug>/
    source.url
    title.txt
    metadata.storage.json
    metadata.atlas_doc_format.json
    metadata.view.json
    page.storage.raw.json
    page.atlas_doc_format.raw.json
    page.view.raw.json
    body.storage.xml
    body.atlas_doc_format.json
    body.view.html
    body.view.local.html
    attachments/
      manifest.json
      <attachment-id>-<filename>
```

Use lowercase stable slugs. Keep `local_path` project-relative.

## Manifest Schema

`specs/specs.json` is the project-local source of truth:

```json
{
  "cache_ttl_hours": 24,
  "specs": [
    {
      "slug": "short-stable-folder-name",
      "page_id": "3915677711",
      "title": "Confluence page title",
      "source_url": "https://strikingly.atlassian.net/wiki/spaces/SP/pages/3915677711/Page+Title",
      "local_path": "specs/short-stable-folder-name",
      "local_version": 328,
      "online_version": 328,
      "online_version_checked_at": "2026-05-18T14:17:00+08:00"
    }
  ]
}
```

Field rules:

- `cache_ttl_hours`: number of hours before an online version check is stale. Default to `24` when initializing.
- `slug`: stable lowercase folder name used for matching and script arguments.
- `page_id`: Confluence page ID as a string, even when numeric.
- `title`: latest known Confluence title.
- `source_url`: original Confluence page URL.
- `local_path`: project-relative path to the spec folder.
- `local_version`: version of the local downloaded body files.
- `online_version`: latest online version observed during the last version check.
- `online_version_checked_at`: ISO 8601 timestamp with timezone for the last online version check.

## Body Representations

Store all three Confluence body formats because each answers different questions:

- `body.view.local.html`: primary read-mode file. It is rendered Confluence HTML with image URLs rewritten to local attachments.
- `body.view.html`: original rendered Confluence HTML before local rewrites.
- `body.storage.xml`: Confluence storage body. Use for macros, tasks, tables, attachment references, links, and other Confluence-native structures.
- `body.atlas_doc_format.json`: Atlas Document Format body. Use for editor-node hierarchy, nested structure, task state, and exact document shape.

Store the full raw API responses before deriving body files:

- `page.storage.raw.json`
- `page.atlas_doc_format.raw.json`
- `page.view.raw.json`

Store response metadata with `.body` removed:

- `metadata.storage.json`
- `metadata.atlas_doc_format.json`
- `metadata.view.json`

Also store:

- `title.txt`: page title from the storage response.
- `source.url`: original URL from `specs/specs.json`.

## Attachment Manifest

`attachments/manifest.json` maps embedded Confluence images and attachments to local files. Each entry should include:

```json
{
  "resource_id": "att123456789",
  "filename": "mockup.png",
  "remote_url": "https://...",
  "thumbnail_url": "https://...",
  "rest_download_url": "https://strikingly.atlassian.net/wiki/rest/api/content/3915677711/child/attachment/att123456789/download",
  "local_path": "attachments/att123456789-mockup.png",
  "downloaded": true,
  "byte_size": 12345,
  "sha256": "..."
}
```

The local path is relative to the spec folder. `body.view.local.html` should rewrite `src`, `data-image-src`, and matching `srcset` values to the local path and add `data-local-image-src` when possible.

Missing required embedded images mean the local spec is incomplete. Consumers should report that state instead of treating the image as intentionally absent.

## Figma Mockups

Figma mockups are external design sources and usually appear in synced specs as Figma URLs. They are not guaranteed to appear in `attachments/manifest.json`, because the local sync format only downloads Confluence-hosted embedded images and attachments.

Read-mode consumers should:

- Identify Figma URLs from `body.view.local.html`, `body.storage.xml`, and `body.atlas_doc_format.json`.
- Use Figma MCP as the default access path to inspect the referenced file, page, frame, node, prototype, or screenshot.
- Use the authenticated Figma UI only as a fallback when Figma MCP is unavailable or insufficient, or when the user explicitly asks for UI inspection.
- Record which Figma URL or node was inspected and what visual states, copy, layout, interaction, or requirement details were observed.
- Treat inaccessible Figma references as incomplete design evidence and label them `needs-design-access` or equivalent.
- Avoid inferring UI behavior, copy, states, layout, or requirement details from a Figma URL, embed title, or link text alone.

When Confluence also contains a downloaded static image of a Figma mockup, inspect both the local image and the Figma source when possible. Prefer the current Figma source for design truth, but note any mismatch between the local image and the Figma file.

## Read Priority

For normal product understanding:

1. Read `specs/specs.json` to identify the target spec.
2. Read `<local_path>/body.view.local.html` for rendered content.
3. Read `<local_path>/attachments/manifest.json` to resolve images and inspect attachment availability.
4. Identify Figma references and inspect the linked design source when the spec depends on a mockup, prototype, or design state.
5. Inspect relevant images from their original local attachment files, and inspect Figma-dependent designs from the linked Figma source when possible. Contact sheets or thumbnail sheets are acceptable only as a quick index; they are not source evidence and must not be used as the sole basis for product or design conclusions.
6. Read `body.storage.xml` or `body.atlas_doc_format.json` when rendered HTML is ambiguous or too lossy.
7. Read metadata and raw responses only for provenance, version, or sync diagnostics.

## Write Invariants

Write-mode producers must maintain these invariants:

- Never update manifest versions as successful when required body files are missing, invalid, or derived from different online versions.
- Never leave `body.view.local.html` pointing at nonexistent local attachment files for required embedded images.
- Preserve existing downloaded attachment files across refreshes unless replacing them with a verified current copy.
- Keep raw API responses and derived files in sync.
- Keep `specs/specs.json` valid JSON and avoid absolute local machine paths.
- Use project-relative paths for cache data so project folders can move between machines.
- Prefer explicit failure over partial cache states that would mislead read-mode consumers.
