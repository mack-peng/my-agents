#!/usr/bin/env python3
"""Assemble STRK code_design/code-design.md from assembly-manifest.md.

This script intentionally performs deterministic file assembly only. It does
not summarize, rewrite, or reinterpret requirement designs.
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class GlobalSource:
    order: int
    path: str
    section: str


@dataclass(frozen=True)
class RequirementSource:
    order: int
    requirement: str
    card_path: str
    design_path: str
    final_heading: str


@dataclass(frozen=True)
class Manifest:
    title: str
    output_path: str
    global_sources: list[GlobalSource]
    requirement_sources: list[RequirementSource]


SECTION_RE = re.compile(r"^##\s+(.+?)\s*$")
HEADING_RE = re.compile(r"^(#{1,6})\s+")
PROCESS_HEADING_RE = re.compile(
    r"^#{1,6}\s+(Completion Certificate|Completed Artifacts|Requirement \d+ Handoff)\s*$",
    re.IGNORECASE,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Assemble code_design/code-design.md from code_design/assembly-manifest.md."
    )
    parser.add_argument(
        "--project",
        default=".",
        help="Project root containing code_design/assembly-manifest.md.",
    )
    parser.add_argument(
        "--manifest",
        default=None,
        help="Optional manifest path. Defaults to <project>/code_design/assembly-manifest.md.",
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
            return clean_cell(stripped[2:])
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


def parse_manifest(path: Path) -> Manifest:
    if not path.exists():
        raise FileNotFoundError(f"Manifest not found: {path}")

    lines = path.read_text(encoding="utf-8").splitlines()
    title = bullet_value(lines, "Document Title") or "Code Design"
    output_path = bullet_value(lines, "Canonical Output") or "code_design/code-design.md"

    global_rows = table_rows(lines, "Global Sources")
    requirement_rows = table_rows(lines, "Requirement Sources")

    if global_rows and [cell.lower() for cell in global_rows[0]][:3] == [
        "order",
        "source file",
        "final section",
    ]:
        global_rows = global_rows[1:]
    if requirement_rows and [cell.lower() for cell in requirement_rows[0]][:5] == [
        "order",
        "requirement",
        "card file",
        "design file",
        "final h2 section heading",
    ]:
        requirement_rows = requirement_rows[1:]

    global_sources = [
        GlobalSource(
            order=parse_int(row[0], "Global Sources"),
            path=row[1],
            section=row[2],
        )
        for row in global_rows
        if len(row) >= 3 and row[0]
    ]
    requirement_sources = [
        RequirementSource(
            order=parse_int(row[0], "Requirement Sources"),
            requirement=row[1],
            card_path=row[2],
            design_path=row[3],
            final_heading=row[4],
        )
        for row in requirement_rows
        if len(row) >= 5 and row[0]
    ]

    validate_manifest_rows(global_sources, requirement_sources)

    if not requirement_sources:
        raise ValueError("Manifest has no Requirement Sources rows.")

    return Manifest(
        title=title,
        output_path=output_path,
        global_sources=sorted(global_sources, key=lambda item: item.order),
        requirement_sources=sorted(requirement_sources, key=lambda item: item.order),
    )


def validate_manifest_rows(
    global_sources: list[GlobalSource],
    requirement_sources: list[RequirementSource],
) -> None:
    validate_orders([source.order for source in global_sources], "Global Sources")
    validate_orders([source.order for source in requirement_sources], "Requirement Sources")
    validate_unique([source.path for source in global_sources], "Global source file")
    validate_unique([source.design_path for source in requirement_sources], "Requirement design file")
    validate_unique([source.card_path for source in requirement_sources], "Requirement card file")
    validate_unique([source.final_heading for source in requirement_sources], "Requirement final H2 heading")


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


def validate_global_source(text: str, path: Path) -> None:
    for line_no, line in enumerate(text.splitlines(), start=1):
        match = HEADING_RE.match(line)
        if match and len(match.group(1)) < 3:
            raise ValueError(
                f"{path}:{line_no}: global sources must use H3 or lower headings under ## Global Design."
            )


def validate_requirement_source(text: str, path: Path, expected_heading: str) -> None:
    lines = [line for line in text.splitlines() if line.strip()]
    if not lines:
        raise ValueError(f"{path}: requirement design is empty.")

    first = lines[0].strip()
    expected = expected_heading.strip()
    if not expected.startswith("## "):
        expected = f"## {expected}"
    if first != expected:
        raise ValueError(f"{path}: first heading must be {expected!r}, got {first!r}.")

    for line_no, line in enumerate(text.splitlines(), start=1):
        match = HEADING_RE.match(line)
        if not match:
            continue
        level = len(match.group(1))
        if level == 1 or level > 3:
            raise ValueError(f"{path}:{line_no}: requirement designs must use H2/H3 only.")


def assert_no_process_artifacts(text: str, output_path: Path) -> None:
    for line_no, line in enumerate(text.splitlines(), start=1):
        if PROCESS_HEADING_RE.match(line.strip()):
            raise ValueError(
                f"{output_path}:{line_no}: assembled output contains process artifact heading {line!r}."
            )


def assemble(project: Path, manifest: Manifest) -> tuple[Path, str]:
    chunks: list[str] = [f"# {manifest.title.strip()}"]

    if manifest.global_sources:
        chunks.append("## Global Design")
        for source in manifest.global_sources:
            source_path = resolve_source(project, source.path)
            text = read_source(source_path)
            validate_global_source(text, source_path)
            chunks.append(text)

    for source in manifest.requirement_sources:
        card_path = resolve_source(project, source.card_path)
        if not card_path.exists():
            raise FileNotFoundError(f"Assembly card not found: {card_path}")
        design_path = resolve_source(project, source.design_path)
        text = read_source(design_path)
        validate_requirement_source(text, design_path, source.final_heading)
        chunks.append(text)

    output = "\n\n".join(chunk.strip() for chunk in chunks if chunk.strip()) + "\n"
    output_path = resolve_source(project, manifest.output_path)
    assert_no_process_artifacts(output, output_path)
    return output_path, output


def main() -> int:
    args = parse_args()
    project = Path(args.project).resolve()
    manifest_path = Path(args.manifest).resolve() if args.manifest else project / "code_design" / "assembly-manifest.md"

    try:
        manifest = parse_manifest(manifest_path)
        output_path, output = assemble(project, manifest)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(output, encoding="utf-8")
    except Exception as exc:  # noqa: BLE001 - CLI should report concise failures.
        print(f"assemble_code_design.py: error: {exc}", file=sys.stderr)
        return 1

    print(f"Wrote {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
