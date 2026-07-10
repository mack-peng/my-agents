#!/usr/bin/env python3
"""Initialize project instructions and specs/specs.json for a Strikingly project."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse

HOME = Path.home()
DEFAULTS = {
    "bobcat": str(HOME / "Local/code/strikingly/bobcat"),
    "openhands": str(HOME / "Local/code/strikingly/openhands"),
    "component_kit": str(HOME / "Local/code/strikingly/component-kit"),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Initialize project instructions and specs/specs.json for a Strikingly project."
    )
    parser.add_argument("--project", default=".", help="Target project directory.")
    parser.add_argument("--bobcat", help="Path to the bobcat repository.")
    parser.add_argument("--openhands", help="Path to the openhands repository.")
    parser.add_argument(
        "--component-kit", dest="component_kit", help="Path to component-kit."
    )
    parser.add_argument(
        "--spec-url",
        action="append",
        default=[],
        help="Confluence spec URL. May be passed multiple times.",
    )
    parser.add_argument(
        "--force", action="store_true", help="Overwrite existing files."
    )
    return parser.parse_args()


def prompt_value(label: str, default: str | None = None) -> str:
    suffix = f" [{default}]" if default else ""
    value = input(f"{label}{suffix}: ").strip()
    return value or (default or "")


def collect_multiline_urls() -> list[str]:
    print(
        "Spec Confluence URLs (comma/space separated, or one per line; blank line to finish):"
    )
    lines: list[str] = []
    while True:
        line = input("> ").strip()
        if not line:
            break
        lines.append(line)
    return split_urls(lines)


def split_urls(values: list[str]) -> list[str]:
    urls: list[str] = []
    for value in values:
        urls.extend(part for part in re.split(r"[\s,]+", value.strip()) if part)
    return urls


def slugify(text: str, fallback: str) -> str:
    decoded = unquote(text).replace("+", " ")
    slug = re.sub(r"[^a-z0-9]+", "-", decoded.lower()).strip("-")
    return slug or fallback


def spec_from_url(url: str, index: int) -> dict[str, object]:
    parsed = urlparse(url)
    page_id_match = re.search(r"/pages/(\d+)(?:/([^?#]+))?", parsed.path)
    if not page_id_match:
        raise ValueError(f"Could not find a Confluence page ID in URL: {url}")

    page_id = page_id_match.group(1)
    title_part = (
        page_id_match.group(2) if page_id_match and page_id_match.group(2) else ""
    )
    fallback = f"spec-{page_id or index}"
    slug = slugify(title_part or page_id, fallback)
    title = unquote(title_part).replace("+", " ").strip()

    return {
        "slug": slug,
        "page_id": page_id,
        "title": title,
        "source_url": url,
        "local_path": f"specs/{slug}",
        "local_version": None,
        "online_version": None,
        "online_version_checked_at": None,
    }


def build_specs(urls: list[str]) -> list[dict[str, object]]:
    specs: list[dict[str, object]] = []
    seen_slugs: dict[str, int] = {}
    for index, url in enumerate(urls, start=1):
        spec = spec_from_url(url, index)
        slug = str(spec["slug"])
        seen_slugs[slug] = seen_slugs.get(slug, 0) + 1
        if seen_slugs[slug] > 1:
            slug = f"{slug}-{seen_slugs[slug]}"
            spec["slug"] = slug
            spec["local_path"] = f"specs/{slug}"
        specs.append(spec)
    return specs


def render_agents_md(bobcat: str, openhands: str, component_kit: str) -> str:
    return f"""# Project Notes

## Project Directory

- Anything inside the `archive/` sub-directory is irrelevant. Do not touch it.

## Code Repositories

- `bobcat`: `{bobcat}`. Strikingly main product repository, contains most of product features (including signup/login, dashboard, website editor, AI site builder, AI logo, domain, domain email, payment/subscription, audience/contact/CRM, etc), likely relevant to all projects unless specified otherwise. Main branch: `develop`.
- `openhands`: `{openhands}`. Strikingly AI Coding product repository, only relevant to AI coding (vibe coder) product line. Main branch: `develop`.
- `component-kit`: `{component_kit}`. Strikingly component kit. When possible, always reuse existing components (Input/Tab/CheckBox/Radio/Button/Card/Carousel, etc) in the kit with css/style customization instead of re-inventing the wheel. Main branch: `develop`.
- Before structural code exploration or implementation, check each code repository for `.codegraph/`. If it is missing, initialize CodeGraph from that repository root with `codegraph init -i`.
- When code changes are needed, assume multiple agents may be working in the same repositories at the same time. Check repository status first and prefer temporary isolated `git worktree` workspaces under this project directory's `.worktrees/` subdirectory for edits to avoid conflicts with user or agent changes. After patch files are generated, remove worktrees created for the task unless the user explicitly asks to keep them.

## Atlassian / Confluence Access

- Prefer `acli` when accessing Atlassian or Confluence documentation. Use Chrome only as a fallback, because Chrome automation is much slower for this workflow.
- Run `acli` outside the sandbox when it needs authentication. Inside the sandbox it may not be able to access the local auth credentials and can incorrectly report as unauthenticated.
- Before reading a local spec, use the installed `strk-sync-specs` skill (`$strk-sync-specs` in runtimes that support `$skill` syntax) and run its bundled `scripts/sync_specs.sh --project <current-directory> <slug>` script for that spec. Resolve the script path from the active agent runtime's installed skill directory instead of assuming a specific global skill path. The script uses the cached local copy when the online version was checked within the last 24 hours; otherwise it checks Confluence and refreshes the local files when the online version is newer.

## Engineering Working Principles

- Think before coding. State important assumptions, surface ambiguity, and ask when the correct interpretation cannot be inferred safely.
- Prefer simple, direct solutions. Do not add speculative features, abstractions, configuration, or broad error handling that the task does not need.
- Make surgical changes. Touch only files and lines that trace back to the request, match the surrounding style, and avoid opportunistic refactors, formatting churn, or unrelated cleanup.
- Clean up only what your change creates. Remove imports, variables, files, or helper code made unused by your own edit, but do not remove pre-existing dead code unless explicitly asked.
- Work toward verifiable outcomes. Define the expected result for non-trivial tasks, run focused tests or checks when feasible, and record exact blockers when verification cannot be completed.
- Treat these principles as guardrails, not a substitute for judgement; for small mechanical tasks, keep the process lightweight while preserving correctness.
"""


def render_claude_md() -> str:
    return """@AGENTS.md
"""


def write_file(path: Path, content: str, force: bool) -> None:
    if path.exists() and not force:
        raise FileExistsError(
            f"{path} already exists; rerun with --force to overwrite it"
        )
    path.write_text(content, encoding="utf-8")


def main() -> int:
    args = parse_args()
    interactive = sys.stdin.isatty()

    project = Path(args.project).expanduser().resolve()
    bobcat = args.bobcat or (
        prompt_value("bobcat code directory", DEFAULTS["bobcat"])
        if interactive
        else DEFAULTS["bobcat"]
    )
    openhands = args.openhands or (
        prompt_value("openhands code directory", DEFAULTS["openhands"])
        if interactive
        else DEFAULTS["openhands"]
    )
    component_kit = args.component_kit or (
        prompt_value("component-kit code directory", DEFAULTS["component_kit"])
        if interactive
        else DEFAULTS["component_kit"]
    )
    spec_urls = (
        split_urls(args.spec_url)
        if args.spec_url
        else (collect_multiline_urls() if interactive else [])
    )

    try:
        spec_entries = build_specs(spec_urls)
    except ValueError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2

    specs = {
        "cache_ttl_hours": 24,
        "specs": spec_entries,
    }

    project.mkdir(parents=True, exist_ok=True)
    specs_dir = project / "specs"
    specs_dir.mkdir(exist_ok=True)

    write_file(
        project / "AGENTS.md",
        render_agents_md(bobcat, openhands, component_kit),
        args.force,
    )
    write_file(
        project / "CLAUDE.md",
        render_claude_md(),
        args.force,
    )
    write_file(
        specs_dir / "specs.json",
        json.dumps(specs, indent=2, ensure_ascii=False) + "\n",
        args.force,
    )

    print(f"Initialized {project}")
    print(f"- AGENTS.md")
    print(f"- CLAUDE.md")
    print(f"- specs/specs.json ({len(specs['specs'])} specs)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
