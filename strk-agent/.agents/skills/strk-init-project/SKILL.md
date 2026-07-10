---
name: strk-init-project
description: Initialize a Strikingly project workspace by asking setup questions and creating agent project instructions plus a specs/ directory. Use when an agent needs to bootstrap project instructions, collect bobcat/openhands/component-kit repository paths, record Confluence spec URLs, create specs/specs.json, or prepare a project for the strk-sync-specs workflow.
---

# STRK Init Project

## Overview

Initialize a Strikingly project folder with the shared project instructions and local spec manifest used by the installed `strk-sync-specs` skill (`$strk-sync-specs` in runtimes that support `$skill` syntax).

Use the bundled `scripts/init_project.py` script for the actual file creation.
Resolve the script path from this installed skill directory according to the
active agent runtime; do not assume the skill is installed under any specific
global path.

```bash
python3 <strk-init-project-skill-dir>/scripts/init_project.py --project "$PWD"
```

## Questionnaire

Ask the user for these values before initializing:

1. `bobcat` code directory
2. `openhands` code directory
3. `component-kit` code directory
4. Confluence spec URL list

Use these defaults when the user accepts defaults:

```text
bobcat: $HOME/Local/code/strikingly/bobcat
openhands: $HOME/Local/code/strikingly/openhands
component-kit: $HOME/Local/code/strikingly/component-kit
```

Collect spec URLs as one or more Confluence page URLs. Accept comma-separated, whitespace-separated, or one-per-line input.

## Workflow

1. Confirm the target project directory. Default to the current working directory.
2. Ask the questionnaire. Do not invent spec URLs; leave the list empty only if the user explicitly has none yet.
3. Run `scripts/init_project.py` with the collected answers, or run it interactively and answer its prompts.
4. If `AGENTS.md`, `CLAUDE.md`, or `specs/specs.json` already exists, ask before overwriting or pass `--force` only when the user has approved replacement.
5. After initialization, suggest using the installed `strk-sync-specs` skill (`$strk-sync-specs` in runtimes that support `$skill` syntax) to sync any listed specs when the user is ready to read them.

Example non-interactive run:

```bash
python3 <strk-init-project-skill-dir>/scripts/init_project.py \
  --project "$PWD" \
  --bobcat $HOME/Local/code/strikingly/bobcat \
  --openhands $HOME/Local/code/strikingly/openhands \
  --component-kit $HOME/Local/code/strikingly/component-kit \
  --spec-url "https://strikingly.atlassian.net/wiki/spaces/SP/pages/3915677711/Page+Title"
```

## Output

Create this project layout:

```text
AGENTS.md
CLAUDE.md
specs/
  specs.json
```

`AGENTS.md` is the canonical project instruction file for Codex, OMP, Cursor
CLI, Kimi Code CLI, OpenCode, and ZCode. It must include:

- `Project Notes`
- `Project Directory` guidance that `archive/` is irrelevant
- `Code Repositories` entries for `bobcat`, `openhands`, and `component-kit`
- `Engineering Working Principles` guidance for thinking before coding,
  keeping changes simple and surgical, cleaning up only self-created leftovers,
  and verifying non-trivial work
- `Atlassian / Confluence Access` guidance that prefers `acli`, runs authenticated `acli` outside the sandbox, and refreshes local specs through the installed `strk-sync-specs` skill (`$strk-sync-specs` in runtimes that support `$skill` syntax)

`CLAUDE.md` must be a thin Claude Code compatibility file that imports
`AGENTS.md`:

```md
@AGENTS.md
```

`specs/specs.json` must use the manifest schema from the installed `strk-sync-specs` skill (`$strk-sync-specs` in runtimes that support `$skill` syntax):

```json
{
  "cache_ttl_hours": 24,
  "specs": []
}
```

For each Confluence URL, include `slug`, `page_id`, `title`, `source_url`, `local_path`, `local_version`, `online_version`, and `online_version_checked_at`. Leave version fields null during initialization.
