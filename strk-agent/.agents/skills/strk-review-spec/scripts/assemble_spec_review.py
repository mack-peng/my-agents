#!/usr/bin/env python3
"""Assemble spec_review/spec-review.md from review artifacts.

This script performs deterministic extraction and assembly only. It does not
summarize, rewrite, or reinterpret requirement findings.
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path


SECTION_RE = re.compile(r"^##\s+(.+?)\s*$")
SUBSECTION_RE = re.compile(r"^###\s+(.+?)\s*$")
ELIGIBLE_RE = re.compile(r"Assembly Eligibility:\s*eligible\b", re.IGNORECASE)
SEVERITY_RE = re.compile(r"^###\s+(blocker|major|minor|question)\s*:\s+", re.IGNORECASE)
GLOBAL_SOURCE_LINE_CAP = 300


@dataclass(frozen=True)
class GlobalSource:
    order: int
    path: str
    purpose: str


@dataclass(frozen=True)
class RequirementSource:
    order: int
    requirement: str
    card_path: str
    findings_path: str
    handoff_path: str
    include: str


@dataclass(frozen=True)
class Manifest:
    title: str
    output_path: str
    global_sources: list[GlobalSource]
    requirement_sources: list[RequirementSource]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Assemble spec_review/spec-review.md from spec_review/assembly-manifest.md."
    )
    parser.add_argument(
        "--project",
        default=".",
        help="Project root containing spec_review/assembly-manifest.md.",
    )
    parser.add_argument(
        "--manifest",
        default=None,
        help="Optional manifest path. Defaults to <project>/spec_review/assembly-manifest.md.",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Optional output path. Defaults to manifest Canonical Output or spec_review/spec-review.md.",
    )
    return parser.parse_args()


def clean_cell(value: str) -> str:
    value = value.strip()
    if value.startswith("`") and value.endswith("`") and len(value) >= 2:
        value = value[1:-1]
    return value.strip()


def parse_table(lines: list[str], start: int) -> tuple[list[list[str]], int]:
    rows: list[list[str]] = []
    i = start
    while i < len(lines):
        line = lines[i].strip()
        if not line.startswith("|"):
            break
        cells = [clean_cell(cell) for cell in line.strip("|").split("|")]
        if cells and all(re.fullmatch(r":?-{3,}:?", cell.strip()) for cell in cells):
            i += 1
            continue
        rows.append(cells)
        i += 1
    return rows, i


def section_ranges(lines: list[str]) -> dict[str, tuple[int, int]]:
    starts: list[tuple[str, int]] = []
    for i, line in enumerate(lines):
        match = SECTION_RE.match(line)
        if match:
            starts.append((match.group(1).strip(), i))

    ranges: dict[str, tuple[int, int]] = {}
    for idx, (name, start) in enumerate(starts):
        end = starts[idx + 1][1] if idx + 1 < len(starts) else len(lines)
        ranges[name] = (start + 1, end)
    return ranges


def bullet_value(lines: list[str], section_name: str) -> str | None:
    ranges = section_ranges(lines)
    if section_name not in ranges:
        return None
    start, end = ranges[section_name]
    for line in lines[start:end]:
        stripped = line.strip()
        if stripped.startswith("- "):
            value = stripped[2:]
            if ":" in value:
                _, value = value.split(":", 1)
            return clean_cell(value)
    return None


def table_rows(lines: list[str], section_name: str) -> list[list[str]]:
    ranges = section_ranges(lines)
    if section_name not in ranges:
        return []
    start, end = ranges[section_name]
    i = start
    while i < end:
        if lines[i].strip().startswith("|"):
            rows, _ = parse_table(lines, i)
            return rows
        i += 1
    return []


def parse_int(value: str, context: str) -> int:
    try:
        return int(value)
    except ValueError:
        raise ValueError(f"{context}: expected integer order, got {value!r}") from None


def drop_header(rows: list[list[str]], expected: list[str]) -> list[list[str]]:
    if not rows:
        return rows
    actual = [cell.lower() for cell in rows[0]][: len(expected)]
    if actual == expected:
        return rows[1:]
    return rows


def parse_manifest(path: Path) -> Manifest:
    if not path.exists():
        raise FileNotFoundError(f"Manifest not found: {path}")

    lines = path.read_text(encoding="utf-8").splitlines()
    title = bullet_value(lines, "Spec Title") or bullet_value(lines, "Document Title") or "Spec Review"
    output_path = bullet_value(lines, "Canonical Output") or "spec_review/spec-review.md"

    global_rows = drop_header(table_rows(lines, "Global Sources"), ["order", "file", "purpose"])
    requirement_rows = drop_header(
        table_rows(lines, "Requirement Sources"),
        ["order", "requirement", "review card", "findings", "handoff", "include in final report"],
    )

    global_sources = [
        GlobalSource(
            order=parse_int(row[0], "Global Sources"),
            path=row[1],
            purpose=row[2],
        )
        for row in global_rows
        if len(row) >= 3 and row[0]
    ]
    requirement_sources = [
        RequirementSource(
            order=parse_int(row[0], "Requirement Sources"),
            requirement=row[1],
            card_path=row[2],
            findings_path=row[3],
            handoff_path=row[4],
            include=row[5],
        )
        for row in requirement_rows
        if len(row) >= 6 and row[0]
    ]

    validate_orders([source.order for source in global_sources], "Global Sources")
    validate_orders([source.order for source in requirement_sources], "Requirement Sources")
    validate_unique([source.path for source in global_sources], "Global source file")
    validate_unique([source.card_path for source in requirement_sources], "Requirement review card")
    validate_unique([source.findings_path for source in requirement_sources], "Requirement findings")

    if not requirement_sources:
        raise ValueError("Manifest has no Requirement Sources rows.")

    return Manifest(
        title=title,
        output_path=output_path,
        global_sources=sorted(global_sources, key=lambda item: item.order),
        requirement_sources=sorted(requirement_sources, key=lambda item: item.order),
    )


def validate_orders(orders: list[int], context: str) -> None:
    if not orders:
        return
    duplicates = sorted({order for order in orders if orders.count(order) > 1})
    if duplicates:
        raise ValueError(f"{context}: duplicate order values: {duplicates}")
    expected = list(range(1, len(orders) + 1))
    actual = sorted(orders)
    if actual != expected:
        raise ValueError(f"{context}: orders must be contiguous from 1, got {actual}")


def validate_unique(values: list[str], context: str) -> None:
    normalized = [value.strip() for value in values if value.strip()]
    duplicates = sorted({value for value in normalized if normalized.count(value) > 1})
    if duplicates:
        raise ValueError(f"{context}: duplicate values: {duplicates}")


def resolve_source(project: Path, source: str) -> Path:
    path = Path(source)
    if not path.is_absolute():
        path = project / path
    return path


def read_source(path: Path) -> str:
    if not path.exists():
        raise FileNotFoundError(f"Source file not found: {path}")
    return path.read_text(encoding="utf-8").strip()


def line_count(text: str) -> int:
    if not text:
        return 0
    return len(text.splitlines())


def validate_global_source_size(text: str, path: Path) -> None:
    lines = line_count(text)
    if lines > GLOBAL_SOURCE_LINE_CAP:
        raise ValueError(
            f"{path}: global source has {lines} lines, above the {GLOBAL_SOURCE_LINE_CAP} "
            "line cap. List a compact topic index or shard contract in the manifest instead."
        )


def validate_readiness(project: Path) -> None:
    readiness = project / "spec_review" / "final-readiness.md"
    text = read_source(readiness)
    if not ELIGIBLE_RE.search(text):
        raise ValueError(f"{readiness}: Assembly Eligibility must be eligible before assembly.")


def extract_section(text: str, section_name: str) -> str:
    lines = text.splitlines()
    ranges = section_ranges(lines)
    if section_name not in ranges:
        return ""
    start, end = ranges[section_name]
    return "\n".join(lines[start:end]).strip()


def extract_finding_blocks(text: str) -> str:
    findings = extract_section(text, "Findings")
    if not findings:
        return ""

    lines = findings.splitlines()
    starts = [i for i, line in enumerate(lines) if SUBSECTION_RE.match(line)]
    if not starts:
        return findings.strip()

    blocks: list[str] = []
    for idx, start in enumerate(starts):
        end = starts[idx + 1] if idx + 1 < len(starts) else len(lines)
        block = "\n".join(lines[start:end]).strip()
        if block:
            blocks.append(block)
    return "\n\n".join(blocks)


def split_finding_blocks(text: str) -> dict[str, list[str]]:
    findings = extract_section(text, "Findings")
    buckets: dict[str, list[str]] = {
        "blocker": [],
        "major": [],
        "minor": [],
        "question": [],
        "other": [],
    }
    if not findings:
        return buckets

    lines = findings.splitlines()
    starts = [i for i, line in enumerate(lines) if SUBSECTION_RE.match(line)]
    if not starts:
        stripped = findings.strip()
        if stripped:
            buckets["other"].append(stripped)
        return buckets

    for idx, start in enumerate(starts):
        end = starts[idx + 1] if idx + 1 < len(starts) else len(lines)
        block = "\n".join(lines[start:end]).strip()
        if not block:
            continue
        first_line = block.splitlines()[0]
        match = SEVERITY_RE.match(first_line)
        severity = match.group(1).lower() if match else "other"
        buckets[severity].append(block)
    return buckets


def render_blocks(blocks: list[str]) -> str:
    return "\n\n".join(blocks).strip() if blocks else "None."


def include_requirement(source: RequirementSource) -> bool:
    value = source.include.strip().lower()
    return value not in {"no", "false", "skip", "exclude"}


def assemble(project: Path, manifest: Manifest, output_override: str | None) -> tuple[Path, str]:
    validate_readiness(project)

    chunks: list[str] = [f"# Spec Review: {manifest.title.strip()}"]

    global_chunks: list[str] = []
    for source in manifest.global_sources:
        source_path = resolve_source(project, source.path)
        text = read_source(source_path)
        validate_global_source_size(text, source_path)
        global_chunks.append(f"### {source.purpose or source.path}\n\n{text}")

    requirement_chunks: list[str] = []
    evidence_index: list[str] = []
    severity_buckets: dict[str, list[str]] = {
        "blocker": [],
        "major": [],
        "minor": [],
        "question": [],
        "other": [],
    }
    for source in manifest.requirement_sources:
        if not include_requirement(source):
            continue

        card_path = resolve_source(project, source.card_path)
        findings_path = resolve_source(project, source.findings_path)
        card_text = read_source(card_path)
        findings_text = read_source(findings_path)
        finding_blocks = extract_finding_blocks(findings_text)
        split_blocks = split_finding_blocks(findings_text)
        for severity, blocks in split_blocks.items():
            severity_buckets[severity].extend(
                f"#### Requirement {source.order}: {source.requirement}\n\n{block}"
                for block in blocks
            )

        requirement_chunks.append(
            "\n\n".join(
                chunk
                for chunk in [
                    f"### Requirement {source.order}: {source.requirement}",
                    "#### Review Card",
                    card_text,
                    "#### Finding Blocks",
                    finding_blocks or "No finding blocks found in `findings.md`.",
                ]
                if chunk.strip()
            )
        )
        evidence_index.append(
            f"- Requirement {source.order}: {source.requirement} "
            f"({source.card_path}, {source.findings_path})"
        )

    chunks.append(
        "## Executive Summary\n\n"
        "Assembled mechanically from final review artifacts. See "
        "`spec_review/global/final-review-contract.md` for reviewed conclusions."
    )
    chunks.append("## Overall Verdict\n\nSee `spec_review/global/final-review-contract.md`.")
    coverage_text = "See `spec_review/final-readiness.md` and `spec_review/assembly-manifest.md`."
    if global_chunks:
        coverage_text += "\n\n### Global Sources\n\n" + "\n\n".join(global_chunks)
    chunks.append("## Review Coverage\n\n" + coverage_text)
    chunks.append("## Blockers\n\n" + render_blocks(severity_buckets["blocker"]))
    chunks.append("## Major Findings\n\n" + render_blocks(severity_buckets["major"]))
    chunks.append("## Minor Findings\n\n" + render_blocks(severity_buckets["minor"]))
    chunks.append(
        "## Questions / Needs Confirmation\n\n"
        + render_blocks(severity_buckets["question"] + severity_buckets["other"])
    )
    chunks.append(
        "## External Status Quo Review\n\n"
        "See review cards, finding blocks, and `global/final-review-contract.md`."
    )
    chunks.append(
        "## Code Status Quo Review\n\n"
        "See review cards, finding blocks, and `global/final-review-contract.md`."
    )
    chunks.append(
        "## Related Spec Consistency Review\n\n"
        "See review cards, finding blocks, and `global/final-review-contract.md`."
    )
    chunks.append(
        "## Internal Consistency Review\n\n"
        "See review cards, finding blocks, and `global/final-review-contract.md`."
    )
    chunks.append(
        "## Problem Framing Review\n\n"
        "See review cards, finding blocks, and `global/final-review-contract.md`."
    )
    chunks.append(
        "## Solution Fit Review\n\n"
        "See review cards, finding blocks, and `global/final-review-contract.md`."
    )
    chunks.append("## Requirement-by-Requirement Findings\n\n" + "\n\n".join(requirement_chunks))
    chunks.append("## Recommended Spec Changes\n\nSee finding recommendations above.")
    chunks.append("## Evidence Index\n\n" + "\n".join(evidence_index))
    chunks.append("## Residual Risks\n\nSee requirement review cards and `global/final-review-contract.md`.")

    output = "\n\n".join(chunk.strip() for chunk in chunks if chunk.strip()) + "\n"
    output_path = resolve_source(project, output_override or manifest.output_path)
    return output_path, output


def main() -> int:
    args = parse_args()
    project = Path(args.project).resolve()
    manifest_path = (
        Path(args.manifest).resolve()
        if args.manifest
        else project / "spec_review" / "assembly-manifest.md"
    )

    try:
        manifest = parse_manifest(manifest_path)
        output_path, output = assemble(project, manifest, args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(output, encoding="utf-8")
    except Exception as exc:  # noqa: BLE001 - CLI should report concise failures.
        print(f"assemble_spec_review.py: error: {exc}", file=sys.stderr)
        return 1

    print(f"Wrote {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
