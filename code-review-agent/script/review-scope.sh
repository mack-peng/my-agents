#!/usr/bin/env bash
# review-scope.sh — 确定性评审面计算（code-review-agent）
#
# 用途：计算“有效评审面”并给出 batch / fast 判定（口径见 AGENTS.md「有效评审面」）。
# 在目标项目 git 仓库根目录执行。输出 JSON 到 stdout。
#
# 用法:
#   review-scope.sh --from <ref> [--to <ref>]   # 范围 diff（默认 --to HEAD）
#   review-scope.sh --commit <hash>             # 单 commit
#   review-scope.sh                             # 未提交变更（相对 HEAD）
set -euo pipefail

DATA_PATTERNS=(spec/fixtures/vcr_cassettes/ __snapshots__/ snapshots/)
FAST_MAX_FILES=8
FAST_MAX_LINES=300

FROM=""; TO=""; COMMIT=""; MODE="workspace"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --from) FROM="${2:-}"; MODE="range"; shift 2 ;;
    --to) TO="${2:-}"; shift 2 ;;
    --commit) COMMIT="${2:-}"; MODE="commit"; shift 2 ;;
    -h|--help) sed -n '2,10p' "$0"; exit 0 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

case "$MODE" in
  range)
    [[ -n "$FROM" ]] || { echo "--from required" >&2; exit 2; }
    RANGE_DESC="${FROM}..${TO:-HEAD}"
    DIFF_ARGS=("$RANGE_DESC") ;;
  commit)
    [[ -n "$COMMIT" ]] || { echo "--commit required" >&2; exit 2; }
    RANGE_DESC="${COMMIT}^..${COMMIT}"
    DIFF_ARGS=("$RANGE_DESC") ;;
  workspace)
    RANGE_DESC="workspace (vs HEAD)"
    DIFF_ARGS=("HEAD") ;;
esac

DATA_CSV="$(IFS=,; echo "${DATA_PATTERNS[*]}")"

git diff --numstat -M -C "${DIFF_ARGS[@]}" | awk -v range="$RANGE_DESC" -v data="$DATA_CSV" \
  -v maxf="$FAST_MAX_FILES" -v maxl="$FAST_MAX_LINES" '
function esc(s) { gsub(/\\/, "\\\\", s); gsub(/"/, "\\\"", s); return s }
function is_data(p,   i, n, pats) {
  n = split(data, pats, ",")
  for (i = 1; i <= n; i++) if (length(pats[i]) && index(p, pats[i]) > 0) return 1
  return 0
}
function resolve(p,   i, j, k, pre, inner, post) {
  i = index(p, "{"); j = index(p, " => ")
  if (i > 0 && j > 0) {
    k = index(p, "}")
    pre = substr(p, 1, i - 1)
    inner = substr(p, i + 1, k - i - 1)
    post = substr(p, k + 1)
    j = index(inner, " => ")
    return pre substr(inner, j + 4) post
  }
  if (j > 0) return substr(p, j + 4)
  return p
}
function scope(p) {
  if (p ~ /\.(rb|haml|jbuilder|rake)$/ || p ~ /^(app|lib|config|spec|db|script)\//) return "backend"
  if (p ~ /\.(ts|tsx|js|jsx|less|css|scss|coffee)$/ || p ~ /^(fe|common|miniprogram|native|user_native|r-jaguar|serverless)\//) return "frontend"
  return "other"
}
BEGIN { FS = "\t"; rows = ""; nfiles = 0 }
{
  path = resolve($3); add = $1 + 0; del = $2 + 0
  bin = ($1 == "-" || $2 == "-")
  total++
  cls = "code"
  if (!bin && add + del == 0) { zero_n++; cls = "zero_change" }
  else if (is_data(path)) { data_n++; cls = "data" }
  else {
    if (bin) { bin_n++; cls = "binary" }
    eff++; eff_lines += add + del
    s = scope(path)
    if (s == "backend") has_b = 1
    if (s == "frontend") has_f = 1
    if (s == "other") has_o = 1
  }
  if (nfiles > 0) rows = rows ",\n"
  rows = rows sprintf("    {\"path\": \"%s\", \"added\": %s, \"deleted\": %s, \"class\": \"%s\"}",
                      esc(path), (bin ? "null" : add), (bin ? "null" : del), cls)
  nfiles++
}
END {
  mode = (eff == 0) ? "none" : ((eff <= maxf && eff_lines <= maxl && !(has_b && has_f)) ? "fast" : "batch")
  adv = ""
  if (eff > maxf)           adv = adv (adv ? ", " : "") sprintf("\"effective files %d > %d\"", eff, maxf)
  if (eff_lines > maxl)     adv = adv (adv ? ", " : "") sprintf("\"effective lines %d > %d\"", eff_lines, maxl)
  if (has_b && has_f)       adv = adv (adv ? ", " : "") "\"backend + frontend => batch (multi guideline scope)\""
  if (eff > 0 && !has_b && !has_f && !has_o) adv = adv (adv ? ", " : "") "\"no classified files; confirm scope manually\""
  if (eff > 0 && has_o && !has_b && !has_f)  adv = adv (adv ? ", " : "") "\"unclassified file paths present; confirm scope manually\""
  printf "{\n  \"range\": \"%s\",\n  \"total_files\": %d,\n  \"effective_files\": %d,\n  \"effective_lines\": %d,\n  \"excluded\": {\"zero_change_or_rename\": %d, \"data_snapshot\": %d},\n  \"binary_files\": %d,\n  \"guideline_scopes\": {\"backend\": %s, \"frontend\": %s},\n  \"review_mode\": \"%s\",\n  \"advisory\": [%s],\n  \"files\": [\n%s\n  ]\n}\n",
         esc(range), total, eff, eff_lines, zero_n, data_n, bin_n,
         (has_b ? "true" : "false"), (has_f ? "true" : "false"), mode, adv, rows
}
'
