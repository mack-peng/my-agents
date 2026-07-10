---
name: strk-prod-specs
description: Read, interpret, validate, or define locally synced STRK product spec data under `specs/`. Use when an agent needs a single canonical contract for `specs/specs.json`, synced Confluence spec folders, body representations, local attachments, read-mode product-spec understanding, or write-mode sync/cache updates. Use read mode from consumers such as the installed `strk-code-design` skill (`$strk-code-design` in runtimes that support `$skill` syntax); use write mode from sync producers such as the installed `strk-sync-specs` skill (`$strk-sync-specs` in runtimes that support `$skill` syntax).
---

# STRK Prod Specs

## Overview

Use this skill as the canonical contract for local STRK product specs synced from Confluence into a project `specs/` directory.

This skill has two modes:

- **Read mode**: understand an already-synced spec and answer product, requirement, or design-preparation questions from local files.
- **Write mode**: create, refresh, repair, or validate local spec cache data written by sync tooling.

Load `references/local-spec-format.md` whenever a task depends on exact manifest fields, folder layout, file semantics, attachment mapping, or read/write invariants.

## Choose The Mode

Use **read mode** when the user asks to:

- find or identify a synced spec by title, slug, URL, or description;
- read, summarize, explain, compare, or quote product requirements from a local spec;
- locate product sections, tables, tasks, images, or linked mockups in synced content;
- prepare requirement context for another STRK workflow such as the installed `strk-code-design` skill (`$strk-code-design` in runtimes that support `$skill` syntax);
- check whether a local spec is present and usable before design or implementation work.

Use **write mode** when the user asks to:

- initialize or update `specs/specs.json`;
- define or change the local spec folder format;
- sync, refresh, redownload, repair, or validate Confluence-derived local spec files;
- update version, cache, attachment, or local-path metadata;
- implement producer behavior in the installed `strk-sync-specs` skill (`$strk-sync-specs` in runtimes that support `$skill` syntax).

## Read Mode

1. Work from the project root that contains `specs/specs.json`. If the current directory is a skill repo or code repo without `specs/specs.json`, ask for or infer the actual product project root.
2. Read `specs/specs.json` first. Match a user-provided title, slug, URL, page ID, or short description against `slug`, `title`, `source_url`, `page_id`, and `local_path`.
3. If exactly one spec matches, use it. If multiple specs match, ask the user to choose. If none match, report the available specs instead of guessing.
4. Prefer the spec's `body.view.local.html` for rendered reading and local image references.
5. Use `body.storage.xml` for Confluence-specific structures such as macros, task lists, tables, attachment references, and links that may be simplified in rendered HTML.
6. Use `body.atlas_doc_format.json` when structural editor nodes, table nesting, task state, or exact document hierarchy matter.
7. Use `attachments/manifest.json` to resolve Confluence images and downloaded attachment paths. Treat missing required local images as an incomplete sync, not as absent product content.
8. Treat Figma mockups as external design sources that usually appear in the spec as Figma URLs, not as ordinary downloaded attachments. Identify Figma URLs from `body.view.local.html`, `body.storage.xml`, and `body.atlas_doc_format.json`; use Figma MCP as the default way to inspect the referenced file, page, frame, node, prototype, or screenshot.
9. Inspect visual evidence from the original local attachment file or the linked design source. A generated contact sheet or thumbnail sheet may be used only as a navigation index to find candidate images; it must not replace opening the relevant image at original resolution, because scaled sheets can hide text, layout details, and edge cases.
10. If a Figma mockup cannot be accessed or rendered, mark the design evidence as incomplete or `needs-design-access`. Do not infer UI behavior, copy, states, layout, or requirement details from a Figma link title alone.
11. Use `metadata.<format>.json` and `page.<format>.raw.json` only when answering questions about Confluence metadata, versions, body representation provenance, or sync diagnostics.

Before doing implementation design from a spec, use the installed `strk-sync-specs` skill (`$strk-sync-specs` in runtimes that support `$skill` syntax) to refresh or validate the local copy unless the user explicitly asks to work offline from the current cache.

## Write Mode

1. Load `references/local-spec-format.md` and treat it as the source of truth for manifest schema, folder layout, file semantics, and invariants.
2. Preserve `specs/specs.json` as the project-local index of synced specs. Keep paths project-relative and page IDs as strings.
3. Write complete raw Confluence responses before deriving simplified body or metadata files.
4. Keep `body.view.local.html` consistent with `attachments/manifest.json`; local image rewrites and downloaded files are part of a complete sync.
5. Preserve already-downloaded attachments when refreshing a spec. Reuse existing files by resource ID, previous manifest entry, or current local path when they still correspond to the same embedded asset.
6. Update `local_version`, `online_version`, and `online_version_checked_at` only when the corresponding local files and version checks are complete.
7. Fail loudly on partial syncs that would make consumers misread product requirements, especially missing body files, invalid JSON/XML, stale manifest references, or failed required image downloads.

## Required Reference

- `references/local-spec-format.md`: canonical local spec layout, manifest schema, body file meanings, attachment mapping, read priority, and write-mode invariants.
