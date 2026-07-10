#!/usr/bin/env python3
"""Assemble STRK code review report from bounded review artifacts.

This script performs deterministic extraction and concatenation only. It does
not summarize, reinterpret, or expand requirement-level findings.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


SECTION_RE = re.compile(r"^##\s+(.+?)\s*$")
ISSUE_BLOCK_RE = re.compile(r"^##\s+(ISSUE-\d+\s+-\s+.+?)\s*$", re.MULTILINE)
PATH_RE = re.compile(r"`([^`]+\.md)`|([A-Za-z0-9_./-]+\.md)")
STATUS_RE = re.compile(r"^\s*-\s*([^:]+):\s*(.*)\s*$")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Assemble review.md from STRK bounded review artifacts."
    )
    parser.add_argument(
        "review_root",
        help="Review artifact root, e.g. code_review/group-project-mr-123",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Optional output path. Defaults to <review_root>/review.md.",
    )
    return parser.parse_args()


def read_text(path: Path) -> str:
    if not path.exists():
        raise FileNotFoundError(f"missing artifact: {path}")
    return path.read_text(encoding="utf-8")


def split_sections(text: str) -> dict[str, str]:
    lines = text.splitlines()
    starts: list[tuple[str, int]] = []
    for idx, line in enumerate(lines):
        match = SECTION_RE.match(line.strip())
        if match:
            starts.append((match.group(1).strip(), idx))

    sections: dict[str, str] = {}
    for pos, (name, start) in enumerate(starts):
        end = starts[pos + 1][1] if pos + 1 < len(starts) else len(lines)
        body = "\n".join(lines[start + 1 : end]).strip()
        sections[name] = body
    return sections


def clean_line(line: str) -> str:
    return line.rstrip()


def bullet_value(text: str, label: str) -> str | None:
    for line in text.splitlines():
        match = STATUS_RE.match(line)
        if not match:
            continue
        key = match.group(1).strip().lower()
        if key == label.strip().lower():
            return match.group(2).strip()
    return None


def extract_paths(text: str) -> list[str]:
    seen: set[str] = set()
    paths: list[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("|"):
            continue
        for match in PATH_RE.finditer(line):
            value = match.group(1) or match.group(2)
            if not value:
                continue
            if value not in seen:
                seen.add(value)
                paths.append(value)
    return paths


def resolve_paths(review_root: Path, values: list[str]) -> list[Path]:
    resolved: list[Path] = []
    for value in values:
        path = Path(value)
        if not path.is_absolute():
            path = review_root / value
        resolved.append(path.resolve())
    return resolved


def parse_markdown_table(text: str) -> list[str]:
    rows: list[str] = []
    started = False
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped.startswith("|"):
            if started:
                break
            continue
        started = True
        rows.append(stripped)
    return rows


def first_table_from_file(path: Path) -> list[str]:
    return parse_markdown_table(read_text(path))


def table_from_section(path: Path, section_name: str) -> list[str]:
    sections = split_sections(read_text(path))
    if section_name not in sections:
        return []
    return parse_markdown_table(sections[section_name])


def merge_tables(paths: list[Path], section_name: str, expected_header: list[str]) -> list[str]:
    merged: list[str] = []
    body_rows: list[str] = []
    for path in paths:
        rows = table_from_section(path, section_name)
        if not rows:
            continue
        if not merged:
            merged.extend(rows[:2] if len(rows) >= 2 else rows)
        data_start = 2 if len(rows) >= 2 else 1
        body_rows.extend(rows[data_start:])

    if merged:
        merged.extend(body_rows)
        return merged

    header = "| " + " | ".join(expected_header) + " |"
    divider = "|" + "|".join(["---"] * len(expected_header)) + "|"
    return [header, divider]


def review_subject(issue_registry_path: Path) -> str:
    first_line = read_text(issue_registry_path).splitlines()[0].strip()
    prefix = "# Issue Registry: "
    if first_line.startswith(prefix):
        return first_line[len(prefix) :].strip()
    return issue_registry_path.parent.name


def collect_issue_blocks(paths: list[Path]) -> list[str]:
    blocks: list[str] = []
    seen: set[str] = set()
    for path in paths:
        text = read_text(path)
        matches = list(ISSUE_BLOCK_RE.finditer(text))
        for idx, match in enumerate(matches):
            start = match.start()
            end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
            block = text[start:end].strip()
            issue_id = block.splitlines()[0].split(" - ", 1)[0].replace("## ", "").strip()
            if issue_id in seen:
                continue
            seen.add(issue_id)
            blocks.append(block)
    return blocks


def first_nonempty(values: list[str | None], fallback: str = "") -> str:
    for value in values:
        if value and value.strip():
            return value.strip()
    return fallback


def format_section_body(text: str, fallback: str) -> str:
    cleaned = "\n".join(clean_line(line) for line in text.splitlines()).strip()
    return cleaned if cleaned else fallback


def collect_scope_reason(paths: list[Path]) -> str:
    reasons: list[str] = []
    for path in paths:
        sections = split_sections(read_text(path))
        scope = sections.get("Scope")
        if not scope:
            continue
        reason = bullet_value(scope, "Scope reason")
        if reason:
            reasons.append(reason)
    return "; ".join(dict.fromkeys(reasons))


def batch_plan_summary(batch_plan_path: Path) -> list[str]:
    rows = first_table_from_file(batch_plan_path)
    if len(rows) < 3:
        return []
    summaries: list[str] = []
    for row in rows[2:]:
        cells = [cell.strip() for cell in row.strip().strip("|").split("|")]
        if len(cells) < 7:
            continue
        batch_name, checkpoints, _prerequisites, shared_surface, _guideline_scope, _targets, status = cells[:7]
        surface = shared_surface if shared_surface and shared_surface.lower() != "none" else "None"
        summaries.append(f"{batch_name}: shared surface={surface}; status={status}; checkpoints={checkpoints}")
    return summaries


def find_delta_path(review_root: Path) -> Path | None:
    candidate = review_root / "global" / "review-round-delta.md"
    return candidate if candidate.exists() else None


def delta_paths(review_root: Path, final_contract_sections: dict[str, str]) -> list[Path]:
    declared = resolve_paths(
        review_root,
        extract_paths(final_contract_sections.get("Review Round Delta Sources", "")),
    )
    existing_declared = [path for path in declared if path.exists()]
    if existing_declared:
        return existing_declared

    fallback = find_delta_path(review_root)
    return [fallback] if fallback else []


def merge_named_sections(paths: list[Path], section_name: str) -> str:
    chunks: list[str] = []
    for path in paths:
        section = split_sections(read_text(path)).get(section_name, "").strip()
        if section:
            chunks.append(section)
    return "\n\n".join(chunks).strip()


def assemble(review_root: Path, output_path: Path) -> str:
    review_index = review_root / "review-index.md"
    batch_plan = review_root / "batch-plan.md"
    issue_registry = review_root / "issue-registry.md"
    final_contract = review_root / "global" / "final-review-contract.md"

    review_index_sections = split_sections(read_text(review_index))
    final_contract_sections = split_sections(read_text(final_contract))
    delta_source_paths = delta_paths(review_root, final_contract_sections)

    spec_rows_paths = resolve_paths(
        review_root,
        extract_paths(final_contract_sections.get("Spec / Code Design Checklist Sources", "")),
    )
    conflict_rows_paths = resolve_paths(
        review_root,
        extract_paths(final_contract_sections.get("Spec / Design Conflict Checklist Sources", "")),
    )
    guideline_paths = resolve_paths(
        review_root,
        extract_paths(final_contract_sections.get("Guideline Checklist Sources", "")),
    )
    issue_paths = resolve_paths(
        review_root,
        extract_paths(final_contract_sections.get("Issue Detail Sources", "")),
    )
    if not issue_paths:
        issue_paths = [issue_registry]

    backend_paths = [path for path in guideline_paths if "backend" in path.as_posix()]
    frontend_paths = [
        path
        for path in guideline_paths
        if "frontend" in path.as_posix() and "project-heuristics" not in path.as_posix()
    ]
    project_paths = [path for path in guideline_paths if "project-heuristics" in path.as_posix()]

    conclusion = format_section_body(
        final_contract_sections.get("Report Conclusion", ""),
        "- Overall:\n- 主要风险:\n- 需要开发确认的不确定点:\n- 是否建议发布 GitLab 评论:",
    )
    testing = format_section_body(
        final_contract_sections.get("Testing And Verification", ""),
        "- Summary:\n- Blocked checks:",
    )
    verification_delta = merge_named_sections(delta_source_paths, "Verification Delta")
    if verification_delta:
        testing = testing + "\n\n### Latest Verification Delta\n\n" + verification_delta
    publishing = format_section_body(
        final_contract_sections.get("GitLab Publishing Plan", ""),
        "- Plan:\n- Inline candidate source:",
    )
    limitations = format_section_body(
        final_contract_sections.get("Limitations And Uncertainty", ""),
        "- Limitation:",
    )
    issue_delta = merge_named_sections(delta_source_paths, "Issue Delta")
    if issue_delta:
        limitations = limitations + "\n\n### Latest Issue Delta\n\n" + issue_delta
    delta_notes = merge_named_sections(delta_source_paths, "Final Assembly Notes")
    if delta_notes:
        limitations = limitations + "\n\n### Latest Final Assembly Notes\n\n" + delta_notes

    spec_table = merge_tables(
        spec_rows_paths,
        "Spec / Code Design Rows",
        ["Status", "Item", "Conclusion / Notes", "Issue"],
    )
    conflict_table = merge_tables(
        conflict_rows_paths,
        "Spec / Design Conflict Rows",
        ["Status", "Item", "Conclusion / Notes", "Issue"],
    )
    backend_table = merge_tables(
        backend_paths,
        "Checklist Rows",
        ["Status", "Category", "Check", "Conclusion / Notes", "Issue"],
    )
    frontend_table = merge_tables(
        frontend_paths,
        "Checklist Rows",
        ["Status", "Category", "Check", "Conclusion / Notes", "Issue"],
    )
    project_table = merge_tables(
        project_paths,
        "Checklist Rows",
        ["Status", "Category", "Check", "Conclusion / Notes", "Issue"],
    )
    issue_blocks = collect_issue_blocks(issue_paths)

    inputs_section = [
        f"- MR: {first_nonempty([bullet_value(section, 'MR') for section in review_index_sections.values()])}",
        f"- Spec: {first_nonempty([bullet_value(section, 'Spec') for section in review_index_sections.values()])}",
        f"- Code design source: {first_nonempty([bullet_value(section, 'Code design source') for section in review_index_sections.values()])}",
        f"- Local repo: {first_nonempty([bullet_value(section, 'Local repo') for section in review_index_sections.values()])}",
        f"- Source / target: {first_nonempty([bullet_value(section, 'Source / target') for section in review_index_sections.values()])}",
        f"- Commit range: {first_nonempty([bullet_value(section, 'Commit range') for section in review_index_sections.values()])}",
    ]
    if delta_source_paths:
        joined_delta_paths = ", ".join(
            str(path.relative_to(review_root)) if path.is_relative_to(review_root) else str(path)
            for path in delta_source_paths
        )
        inputs_section.append(f"- Latest review delta: {joined_delta_paths}")
    batch_execution_summary: list[str] = []
    if batch_plan.exists():
        plan_summaries = batch_plan_summary(batch_plan)
        if plan_summaries:
            batch_execution_summary = [f"- {summary}" for summary in plan_summaries]

    report_lines: list[str] = [
        f"# MR Review: {review_subject(issue_registry)}",
        "",
        "## 结论",
        "",
        conclusion,
        "",
        "## 审查输入",
        "",
        *inputs_section,
        "",
        "## Batch 执行摘要",
        "",
        *(batch_execution_summary or ["- None"]),
        "",
        "## 具体审查项",
        "",
        "### Spec / Code Design 一致性",
        "",
        *spec_table,
        "",
        "### Spec / Design 冲突",
        "",
        *conflict_table,
        "",
        "### Backend Guideline Checklist",
        "",
        f"- Loaded: {'Yes' if backend_paths else 'No'}",
        f"- Scope reason: {collect_scope_reason(backend_paths)}",
        "",
        *backend_table,
        "",
        "### Frontend Guideline Checklist",
        "",
        f"- Loaded: {'Yes' if frontend_paths else 'No'}",
        f"- Scope reason: {collect_scope_reason(frontend_paths)}",
        "",
        *frontend_table,
        "",
        "### Project Heuristics Checklist",
        "",
        f"- Loaded: {'Yes' if project_paths else 'No'}",
        f"- Scope reason: {collect_scope_reason(project_paths)}",
        "",
        *project_table,
        "",
        "## 风险/问题列表",
        "",
    ]

    if issue_blocks:
        for block in issue_blocks:
            report_lines.extend([block, ""])
    else:
        report_lines.append("- None")
        report_lines.append("")

    report_lines.extend(
        [
            "## 测试与验证",
            "",
            testing,
            "",
            "## GitLab 发布计划",
            "",
            publishing,
            "",
            "## 限制与不确定性",
            "",
            limitations,
            "",
        ]
    )

    output = "\n".join(report_lines).rstrip() + "\n"
    output_path.write_text(output, encoding="utf-8")
    return output


def main() -> int:
    args = parse_args()
    review_root = Path(args.review_root).expanduser().resolve()
    output_path = (
        Path(args.output).expanduser().resolve()
        if args.output
        else review_root / "review.md"
    )
    try:
        assemble(review_root, output_path)
    except Exception as exc:  # noqa: BLE001 - CLI should report concise failures.
        print(f"assemble_review_report.py: error: {exc}", file=sys.stderr)
        return 1

    print(f"Wrote {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
