#!/usr/bin/env python3
"""Validate STRK MR review artifacts for bounded-context workflow gates."""

from __future__ import annotations

import argparse
from pathlib import Path


ROOT_REQUIRED = [
    "TASK_STATE.md",
    "review-index.md",
    "issue-registry.md",
]

DISALLOWED_DESIGN_ENTRY_PATHS = [
    "code_design/code-design.md",
]


def line_count(path: Path) -> int:
    if not path.exists():
        return 0
    return len(path.read_text(encoding="utf-8").splitlines())


def table_rows(path: Path) -> int:
    if not path.exists():
        return 0
    rows = 0
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped.startswith("|"):
            continue
        if set(stripped.replace("|", "").strip()) <= {"-", ":"}:
            continue
        rows += 1
    return max(0, rows - 1)


def existing_files(root: Path, relative: str) -> list[Path]:
    folder = root / relative
    if not folder.exists():
        return []
    return sorted(path for path in folder.glob("*.md") if path.is_file())


def contains_any(path: Path, needles: list[str]) -> bool:
    if not path.exists():
        return False
    text = path.read_text(encoding="utf-8").lower()
    return any(needle.lower() in text for needle in needles)


def count_list_items(text: str, label: str) -> int | None:
    lines = text.splitlines()
    target = f"- {label}:"
    for idx, line in enumerate(lines):
        if line.strip().lower() != target.lower():
            continue
        value = line.split(":", 1)[1].strip()
        if not value or value.lower() == "none":
            return 0
        count = 0
        if value:
            count += len([item for item in value.split(",") if item.strip()])
        j = idx + 1
        while j < len(lines):
            stripped = lines[j].strip()
            if not stripped:
                j += 1
                continue
            if stripped.startswith("## "):
                break
            if stripped.startswith("- "):
                count += 1
                j += 1
                continue
            if not lines[j].startswith("  "):
                break
            j += 1
        return count
    return None


def guideline_shard_folder(path: Path) -> str:
    return f"guideline-checks/{path.stem}-shards"


def first_markdown_table(path: Path) -> list[str]:
    if not path.exists():
        return []
    rows: list[str] = []
    started = False
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped.startswith("|"):
            if started:
                break
            continue
        started = True
        rows.append(stripped)
    return rows


def split_table_cells(row: str) -> list[str]:
    stripped = row.strip().strip("|")
    return [cell.strip() for cell in stripped.split("|")]


def batch_checkpoint_count(cell: str) -> int:
    if not cell or cell.lower() == "none":
        return 0
    return len([item for item in cell.split(",") if item.strip()])


def count_shared_dependency_surfaces(cell: str) -> int:
    if not cell or cell.lower() == "none":
        return 0
    return len([item for item in cell.split(",") if item.strip()])


def extract_paths(text: str) -> list[str]:
    paths: list[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped.startswith("- "):
            continue
        value = stripped[2:].strip().strip("`")
        if value.endswith(".md"):
            paths.append(value)
    return paths


def allowed_contract_path(path: str) -> bool:
    normalized = path.lstrip("./")
    allowed_prefixes = (
        "requirement-cards/",
        "global/requirement-shards/",
        "global/requirement-shard-index.md",
        "guideline-checks/",
        "issues/",
        "issue-shards/",
        "issue-registry.md",
        "global/review-round-delta.md",
    )
    return normalized in {"issue-registry.md"} or normalized.startswith(allowed_prefixes)


def split_sections(text: str) -> dict[str, str]:
    sections: dict[str, list[str]] = {}
    current: str | None = None
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("## "):
            current = stripped[3:].strip()
            sections[current] = []
            continue
        if current is not None:
            sections[current].append(line)
    return {name: "\n".join(lines).strip() for name, lines in sections.items()}


def contains_disallowed_design_entry(text: str) -> str | None:
    normalized = text.replace("\\", "/")
    for path in DISALLOWED_DESIGN_ENTRY_PATHS:
        if path in normalized:
            return path
    return None


def has_task_state_batch_fields(text: str) -> bool:
    lowered = text.lower()
    has_active = (
        "- active batch:" in lowered
        or "- active checkpoint:" in lowered
        or "- 当前批次:" in text
        or "- 当前检查点:" in text
    )
    has_last_completed = (
        "- last completed batch:" in lowered
        or "- last completed checkpoint:" in lowered
        or "- 上一个完成批次:" in text
        or "- 上一个完成检查点:" in text
    )
    has_mode = "- review mode:" in lowered or "- 审查模式:" in text
    return has_active and has_mode and has_last_completed


def contract_source_section_rules(path: str) -> tuple[list[str], int] | None:
    normalized = path.lstrip("./")
    if normalized.startswith("requirement-cards/"):
        return (["Spec / Code Design Rows", "Spec / Design Conflict Rows"], 160)
    if normalized.startswith("global/requirement-shards/"):
        return (["Spec / Code Design Rows", "Spec / Design Conflict Rows", "Final Assembly Notes"], 220)
    if normalized == "global/requirement-shard-index.md":
        return (["Coverage", "Final Review Routing"], 220)
    if normalized.startswith("guideline-checks/"):
        return (["Checklist Rows"], 180)
    if normalized.startswith("issues/") or normalized.startswith("issue-shards/") or normalized == "issue-registry.md":
        return (["ISSUE"], 220)
    if normalized == "global/review-round-delta.md":
        return (["Issue Delta", "Verification Delta", "Final Assembly Notes"], 180)
    return None


def section_line_count(section_body: str) -> int:
    if not section_body:
        return 0
    return len(section_body.splitlines())


def compact_section_warning(path: Path, root: Path) -> str | None:
    relative = str(path.relative_to(root))
    rules = contract_source_section_rules(relative)
    if rules is None:
        return None
    expected_sections, section_cap = rules
    text = path.read_text(encoding="utf-8")
    if "ISSUE" in expected_sections:
        if line_count(path) > section_cap:
            return f"{relative} exceeds compact issue artifact cap of {section_cap} lines but is not referenced by final-review-contract.md"
        return None
    sections = split_sections(text)
    for section_name in expected_sections:
        if section_name not in sections:
            continue
        if section_line_count(sections[section_name]) > section_cap:
            return f"{relative} section '{section_name}' exceeds compact cap of {section_cap} lines but is not referenced by final-review-contract.md"
    return None


def error_targets(errors: list[str]) -> set[str]:
    targets: set[str] = set()
    for error in errors:
        for token in error.split():
            cleaned = token.strip(",:")
            if cleaned.endswith(".md"):
                targets.add(cleaned)
    return targets


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("review_root", help="Review artifact root, e.g. code_review/group-project-mr-123")
    parser.add_argument("--root-line-cap", type=int, default=300)
    parser.add_argument("--row-cap", type=int, default=20)
    parser.add_argument("--card-line-cap", type=int, default=120)
    parser.add_argument("--card-count-cap", type=int, default=12)
    parser.add_argument("--shard-line-cap", type=int, default=250)
    parser.add_argument("--batch-checkpoint-cap", type=int, default=6)
    parser.add_argument("--requirement-shard-index-cap", type=int, default=6)
    args = parser.parse_args()

    root = Path(args.review_root).expanduser().resolve()
    errors: list[str] = []
    warnings: list[str] = []

    if not root.exists():
        errors.append(f"review root missing: {root}")
    for rel in ROOT_REQUIRED:
        if not (root / rel).exists():
            errors.append(f"required artifact missing: {rel}")

    review_index = root / "review-index.md"
    batch_plan = root / "batch-plan.md"
    issue_registry = root / "issue-registry.md"
    task_state = root / "TASK_STATE.md"
    review_round_delta = root / "global" / "review-round-delta.md"

    if line_count(review_index) > args.root_line_cap or table_rows(review_index) > args.row_cap:
        if not existing_files(root, "index-shards"):
            errors.append("review-index.md exceeds root cap but index-shards/*.md is missing")

    if line_count(issue_registry) > args.root_line_cap or table_rows(issue_registry) > args.row_cap:
        if not existing_files(root, "issue-shards") and not existing_files(root, "issues"):
            errors.append("issue-registry.md exceeds root cap but issue shards/detail files are missing")

    index_shards = existing_files(root, "index-shards")
    issue_shards = existing_files(root, "issue-shards")
    issue_details = existing_files(root, "issues")
    cards = existing_files(root, "requirement-cards")
    evidence_files = existing_files(root, "evidence")
    requirement_shards = existing_files(root, "global/requirement-shards")
    requirement_shard_index = root / "global" / "requirement-shard-index.md"
    guideline_files = existing_files(root, "guideline-checks")
    guideline_shards = [
        shard
        for path in guideline_files
        for shard in existing_files(root, guideline_shard_folder(path))
    ]

    design_entry_candidates = [
        task_state,
        review_index,
        batch_plan,
        issue_registry,
        review_round_delta,
        requirement_shard_index,
        *index_shards,
        *issue_shards,
        *issue_details,
        *cards,
        *evidence_files,
        *requirement_shards,
        *guideline_files,
        *guideline_shards,
    ]
    seen_design_entry_candidates: set[Path] = set()
    for artifact in design_entry_candidates:
        if not artifact.exists() or artifact in seen_design_entry_candidates:
            continue
        seen_design_entry_candidates.add(artifact)
        disallowed_path = contains_disallowed_design_entry(artifact.read_text(encoding="utf-8"))
        if disallowed_path:
            errors.append(
                f"{artifact.relative_to(root)} references disallowed assembled code design entry path: {disallowed_path}"
            )

    if len(issue_details) > args.row_cap and not issue_shards:
        errors.append("issues/*.md exceeds issue detail count cap but issue-shards/*.md is missing")

    overlarge_cards = [path.name for path in cards if line_count(path) > args.card_line_cap]
    if overlarge_cards:
        warnings.append("requirement cards exceed soft cap: " + ", ".join(overlarge_cards))
    if len(cards) > args.card_count_cap or sum(line_count(path) for path in cards) > 1200:
        if not requirement_shards:
            errors.append("requirement cards exceed final-context cap but global/requirement-shards/*.md is missing")

    for path in cards:
        text = path.read_text(encoding="utf-8")
        dep_count = count_list_items(text, "Upstream dependencies")
        if dep_count is not None and dep_count > 3:
            errors.append(
                f"{path.relative_to(root)} exceeds dependency budget with {dep_count} upstream dependencies"
            )

    batch_rows = first_markdown_table(batch_plan)
    if batch_rows:
        data_rows = batch_rows[2:] if len(batch_rows) >= 2 else []
        for idx, row in enumerate(data_rows, start=1):
            cells = split_table_cells(row)
            if len(cells) < 7:
                errors.append(f"batch-plan.md row {idx} has fewer than 7 columns")
                continue
            (
                batch_name,
                checkpoints,
                prerequisites,
                shared_dependency_surface,
                guideline_scope,
                target_artifacts,
                status,
            ) = cells[:7]
            if not batch_name:
                errors.append(f"batch-plan.md row {idx} is missing Batch")
            checkpoint_count = batch_checkpoint_count(checkpoints)
            if checkpoint_count > args.batch_checkpoint_cap:
                errors.append(
                    f"batch-plan.md row {idx} exceeds checkpoint cap with {checkpoint_count} checkpoints"
                )
            if not prerequisites:
                errors.append(f"batch-plan.md row {idx} is missing Prerequisites")
            if not shared_dependency_surface:
                errors.append(f"batch-plan.md row {idx} is missing Shared Dependency Surface")
            if not guideline_scope:
                errors.append(f"batch-plan.md row {idx} is missing Guideline Scope")
            if not target_artifacts:
                errors.append(f"batch-plan.md row {idx} is missing Target Artifacts")
            if status.lower() not in {"planned", "in progress", "ready", "blocked"}:
                errors.append(f"batch-plan.md row {idx} has invalid Status: {status}")
            surface_count = count_shared_dependency_surfaces(shared_dependency_surface)
            if shared_dependency_surface.lower() != "none" and surface_count > 1:
                errors.append(
                    f"batch-plan.md row {idx} exceeds shared dependency surface cap with {surface_count} surfaces"
                )

    for path in guideline_files:
        if line_count(path) > args.root_line_cap or table_rows(path) > args.row_cap:
            shard_folder = guideline_shard_folder(path)
            if not existing_files(root, shard_folder):
                errors.append(f"{path.relative_to(root)} exceeds cap but {shard_folder}/*.md is missing")

    for folder in ["index-shards", "issue-shards", "global/requirement-shards"]:
        overlarge = [path.name for path in existing_files(root, folder) if line_count(path) > args.shard_line_cap]
        if overlarge:
            errors.append(f"{folder} files exceed shard cap: " + ", ".join(overlarge))
    for path in index_shards:
        if not contains_any(path, ["## Shard Readiness"]):
            errors.append(f"{path.relative_to(root)} missing ## Shard Readiness")
    for path in requirement_shards:
        if not contains_any(path, ["readiness", "eligible", "blocked"]):
            errors.append(f"{path.relative_to(root)} missing readiness/eligible/blocked marker")
    if len(requirement_shards) > args.requirement_shard_index_cap and not requirement_shard_index.exists():
        errors.append(
            "global/requirement-shards/*.md exceeds shard index cap but global/requirement-shard-index.md is missing"
        )
    if requirement_shard_index.exists() and line_count(requirement_shard_index) > args.root_line_cap:
        errors.append("global/requirement-shard-index.md exceeds root line cap")
    for path in guideline_files:
        folder = guideline_shard_folder(path)
        overlarge = [shard.name for shard in existing_files(root, folder) if line_count(shard) > args.shard_line_cap]
        if overlarge:
            errors.append(f"{folder} files exceed shard cap: " + ", ".join(overlarge))

    final_contract = root / "global" / "final-review-contract.md"
    broad_trigger = (
        len(cards) > 1
        or (bool(cards) and bool(guideline_files))
        or bool(index_shards)
        or bool(issue_shards)
        or bool(issue_details)
        or bool(requirement_shards)
        or len(guideline_files) > 1
        or any(existing_files(root, guideline_shard_folder(path)) for path in guideline_files)
    )
    if broad_trigger and not batch_plan.exists():
        errors.append("broad-review trigger detected but batch-plan.md is missing")
    if batch_plan.exists() and line_count(batch_plan) > args.root_line_cap:
        errors.append("batch-plan.md exceeds root line cap")
    if batch_plan.exists() and task_state.exists():
        task_state_text = task_state.read_text(encoding="utf-8")
        if not has_task_state_batch_fields(task_state_text):
            errors.append(
                "TASK_STATE.md is missing bounded batch resume fields required when batch-plan.md exists"
            )
    if broad_trigger and not final_contract.exists():
        errors.append("broad-review trigger detected but global/final-review-contract.md is missing")
    if final_contract.exists() and line_count(final_contract) > args.root_line_cap:
        errors.append("global/final-review-contract.md exceeds root line cap")
    if review_round_delta.exists() and line_count(review_round_delta) > args.root_line_cap:
        errors.append("global/review-round-delta.md exceeds root line cap")
    if final_contract.exists():
        final_contract_text = final_contract.read_text(encoding="utf-8")
        disallowed_path = contains_disallowed_design_entry(final_contract_text)
        if disallowed_path:
            errors.append(
                f"global/final-review-contract.md references disallowed assembled code design entry path: {disallowed_path}"
            )
        referenced_paths = {path.lstrip("./") for path in extract_paths(final_contract_text)}
        for path in referenced_paths:
            if not allowed_contract_path(path):
                errors.append(
                    f"global/final-review-contract.md references disallowed source path: {path}"
                )
                continue
            rules = contract_source_section_rules(path)
            if rules is None:
                continue
            resolved = root / path.lstrip("./")
            if not resolved.exists():
                errors.append(f"global/final-review-contract.md references missing source path: {path}")
                continue
            expected_sections, section_cap = rules
            source_text = resolved.read_text(encoding="utf-8")
            source_sections = split_sections(source_text)
            if "ISSUE" in expected_sections:
                if "ISSUE-" not in source_text:
                    errors.append(f"{path} is missing ISSUE blocks required by final-review-contract.md")
                continue
            found = False
            for section_name in expected_sections:
                if section_name not in source_sections:
                    continue
                found = True
                if section_line_count(source_sections[section_name]) > section_cap:
                    errors.append(
                        f"{path} section '{section_name}' exceeds section cap of {section_cap} lines"
                    )
            if not found:
                expected = ", ".join(expected_sections)
                errors.append(f"{path} is missing expected compact sections: {expected}")

        warning_candidates = [
            *cards,
            *requirement_shards,
            *guideline_files,
            *issue_details,
            *issue_shards,
        ]
        if requirement_shard_index.exists():
            warning_candidates.append(requirement_shard_index)
        if review_round_delta.exists():
            warning_candidates.append(review_round_delta)
        warning_seen: set[str] = set()
        errored_targets = error_targets(errors)
        for candidate in warning_candidates:
            relative = str(candidate.relative_to(root))
            if relative in referenced_paths:
                continue
            if relative in errored_targets:
                continue
            warning = compact_section_warning(candidate, root)
            if warning and warning not in warning_seen:
                warning_seen.add(warning)
                warnings.append(warning)

    for warning in warnings:
        print(f"WARN: {warning}")
    for error in errors:
        print(f"ERROR: {error}")

    if errors:
        return 1
    print("OK: review artifacts satisfy bounded-context structural gates")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
