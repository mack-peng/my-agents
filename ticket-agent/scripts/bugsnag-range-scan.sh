#!/usr/bin/env bash
set -euo pipefail

PROJECT="strikingly-bobcat-fe"
SINCE="2d"
CLASS_REGEX="RangeError"
TOP=10
LIMIT=1000
OUTDIR=""

usage() {
  cat <<'EOF'
Usage: bugsnag-range-scan.sh [options]

  --project <slug>   BugSnag project slug (default: strikingly-bobcat-fe)
  --since <window>   event.since window (default: 2d)
  --class <regex>    error_class filter, case-insensitive (default: RangeError)
  --top <n>          fetch latest-event for top N groups (default: 10)
  --limit <n>        max errors fetched (default: 1000)
  --outdir <dir>     output directory (default: ticket-agent/tmp/bugsnag/scan-<ts>)

Outputs:
  list.json groups.json groups.tsv latest-<id>.json signatures.tsv
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --project) PROJECT="$2"; shift 2 ;;
    --since) SINCE="$2"; shift 2 ;;
    --class) CLASS_REGEX="$2"; shift 2 ;;
    --top) TOP="$2"; shift 2 ;;
    --limit) LIMIT="$2"; shift 2 ;;
    --outdir) OUTDIR="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

command -v jq >/dev/null 2>&1 || { echo "jq is required" >&2; exit 1; }
command -v bugsnag-cli >/dev/null 2>&1 || { echo "bugsnag-cli is required" >&2; exit 1; }

ts=$(date +%Y%m%d-%H%M)
OUTDIR=${OUTDIR:-"ticket-agent/tmp/bugsnag/scan-$ts"}
mkdir -p "$OUTDIR"

bugsnag-cli --json error-list --project "$PROJECT" --sort unsorted \
  --filter "error.status=open" --filter "event.since=$SINCE" \
  --per-page 100 --limit "$LIMIT" > "$OUTDIR/list.json"

if jq -e 'type == "object" and .isError == true' "$OUTDIR/list.json" >/dev/null 2>&1; then
  jq -r '.error' "$OUTDIR/list.json" >&2
  exit 1
fi

jq --arg re "$CLASS_REGEX" '[.[] | select((.error_class // "") | test($re; "i"))] | sort_by(-.events)' \
  "$OUTDIR/list.json" > "$OUTDIR/groups.json"

{
  printf 'id\tclass\tevents\tusers\tfirst\tlast\tcontext\tgrouping\n'
  jq -r '.[] | [.id, .error_class, .events, .users, .first_seen, .last_seen, (.context // ""), .grouping_reason] | @tsv' "$OUTDIR/groups.json"
} | tee "$OUTDIR/groups.tsv"

n=$(jq 'length' "$OUTDIR/groups.json")
if [ "$n" -eq 0 ]; then
  echo "no matching groups" >&2
  echo "outdir: $OUTDIR"
  exit 0
fi

topn=$(( n < TOP ? n : TOP ))
{
  printf 'id\ttop_file\ttop_line\ttop_col\ttop_method\tsig_count\n'
  jq -r ".[0:$topn][].id" "$OUTDIR/groups.json" | while IFS= read -r id; do
    bugsnag-cli --json error-latest-event "$id" > "$OUTDIR/latest-$id.json" 2> "$OUTDIR/latest-$id.err" || continue
    jq -r --arg id "$id" '
      ([.exceptions[]?.stacktrace[]?] | group_by([.file, .line_number, .column_number, .method])
        | map({file: .[0].file, line: .[0].line_number, col: .[0].column_number, method: .[0].method, n: length})
        | sort_by(-.n)) as $fr
      | [$id, ($fr[0].file // "?"), ($fr[0].line // "?"), ($fr[0].col // "?"), ($fr[0].method // ""), ($fr | length)] | @tsv
    ' "$OUTDIR/latest-$id.json"
  done
} | tee "$OUTDIR/signatures.tsv"

echo "outdir: $OUTDIR"
