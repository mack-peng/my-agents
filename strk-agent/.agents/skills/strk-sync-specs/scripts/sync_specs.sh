#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(pwd)"
MANIFEST=""
FORMATS=(storage atlas_doc_format view)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACLI_CONFIG_FILE="${ACLI_CONFIG_FILE:-$HOME/.acli/config.toml}"
VIEW_RENDER_RETRIES=3

force=false
targets=()

while (($#)); do
  case "$1" in
    --force)
      force=true
      ;;
    --project)
      shift
      PROJECT_DIR="$(cd "$1" && pwd)"
      ;;
    --manifest)
      shift
      MANIFEST="$1"
      PROJECT_DIR="$(cd "$(dirname "$MANIFEST")/.." && pwd)"
      ;;
    --help|-h)
      cat <<'USAGE'
Usage: sync_specs.sh [--project PATH] [--manifest PATH] [--force] [slug ...]

Refresh local Confluence specs listed in specs/specs.json.

Default behavior:
- If online_version_checked_at is less than cache_ttl_hours old and local files exist,
  reuse the local cached copy without calling acli.
- If the online version check is stale, query Confluence via acli.
- If the online version is newer than local_version, download and replace local files.

Options:
  --project PATH   Project root containing specs/specs.json. Defaults to cwd.
  --manifest PATH  Explicit manifest path. Defaults to PROJECT/specs/specs.json.
  --force   Ignore the version-check cache and redownload matching specs.
USAGE
      exit 0
      ;;
    *)
      targets+=("$1")
      ;;
  esac
  shift
done

require_tool() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required tool: $1" >&2
    exit 1
  fi
}

manifest_get() {
  local slug="$1"
  local expr="$2"
  jq -r --arg slug "$slug" ".specs[] | select(.slug == \$slug) | $expr" "$MANIFEST"
}

manifest_update() {
  local slug="$1"
  local title="$2"
  local local_version="$3"
  local online_version="$4"
  local checked_at="$5"
  local tmp
  tmp="$(mktemp)"

  jq \
    --arg slug "$slug" \
    --arg title "$title" \
    --argjson local_version "$local_version" \
    --argjson online_version "$online_version" \
    --arg checked_at "$checked_at" \
    '(.specs[] | select(.slug == $slug)) |=
      (.title = $title
       | .local_version = $local_version
       | .online_version = $online_version
       | .online_version_checked_at = $checked_at)' \
    "$MANIFEST" > "$tmp"

  mv "$tmp" "$MANIFEST"
}

has_local_files() {
  local path="$1"
  [[ -s "$path/body.storage.xml" ]] &&
    [[ -s "$path/body.atlas_doc_format.json" ]] &&
    [[ -s "$path/body.view.html" ]] &&
    ! grep -q 'fatal-render-error' "$path/body.view.html" &&
    [[ -s "$path/body.view.local.html" ]] &&
    [[ -s "$path/attachments/manifest.json" ]] &&
    [[ -s "$path/page.storage.raw.json" ]] &&
    [[ -s "$path/page.atlas_doc_format.raw.json" ]] &&
    [[ -s "$path/page.view.raw.json" ]]
}

has_spec_content() {
  local path="$1"
  [[ -s "$path/body.storage.xml" ]] &&
    [[ -s "$path/body.atlas_doc_format.json" ]] &&
    [[ -s "$path/body.view.html" ]] &&
    ! grep -q 'fatal-render-error' "$path/body.view.html" &&
    [[ -s "$path/page.storage.raw.json" ]] &&
    [[ -s "$path/page.atlas_doc_format.raw.json" ]] &&
    [[ -s "$path/page.view.raw.json" ]]
}

write_acli_config_template() {
  local config_dir
  config_dir="$(dirname "$ACLI_CONFIG_FILE")"
  mkdir -p "$config_dir"
  chmod 700 "$config_dir" 2>/dev/null || true

  umask 077
  cat > "$ACLI_CONFIG_FILE" <<'TOML'
[atlassian]
api_token = ""
email = ""
TOML
}

remind_missing_atlassian_token() {
  echo "Missing Atlassian API token in $ACLI_CONFIG_FILE." >&2
  echo 'Fill in [atlassian] api_token = "..." there, then rerun the sync.' >&2
}

remind_missing_atlassian_email() {
  echo "Missing Atlassian email in $ACLI_CONFIG_FILE." >&2
  echo 'Fill in [atlassian] email = "..." there, or set ATLASSIAN_EMAIL, then rerun the sync.' >&2
}

load_atlassian_env() {
  local existing_email="${ATLASSIAN_EMAIL:-}"

  if [[ ! -f "$ACLI_CONFIG_FILE" ]]; then
    write_acli_config_template
    echo "Created Atlassian config template at $ACLI_CONFIG_FILE." >&2
  fi

  local config_exports
  require_tool python3
  config_exports="$(python3 "$SCRIPT_DIR/read_acli_config.py" "$ACLI_CONFIG_FILE")"
  eval "$config_exports"

  [[ -z "$existing_email" ]] || ATLASSIAN_EMAIL="$existing_email"

  if [[ -z "${ATLASSIAN_API_TOKEN:-}" ]]; then
    remind_missing_atlassian_token
    return 1
  fi

  if [[ -z "${ATLASSIAN_EMAIL:-}" ]]; then
    remind_missing_atlassian_email
    return 1
  fi
}

extract_image_manifest() {
  local page_dir="$1"
  local page_id="$2"

  python3 "$SCRIPT_DIR/image_utils.py" extract_image_manifest "$page_dir" "$page_id"
}

mark_downloaded_images() {
  local page_dir="$1"

  python3 "$SCRIPT_DIR/image_utils.py" mark_downloaded_images "$page_dir"
}

reuse_existing_images() {
  local page_dir="$1"
  local previous_manifest="$2"

  python3 "$SCRIPT_DIR/image_utils.py" reuse_existing_images "$page_dir" "$previous_manifest"
}

cleanup_unreferenced_attachments() {
  local page_dir="$1"

  python3 "$SCRIPT_DIR/image_utils.py" cleanup_unreferenced_attachments "$page_dir"
}

write_localized_html() {
  local page_dir="$1"

  python3 "$SCRIPT_DIR/image_utils.py" write_localized_html "$page_dir"
}

download_images() {
  local page_dir="$1"
  local page_id="$2"
  local image_count
  local missing_image_count
  local previous_manifest=""

  mkdir -p "$page_dir/attachments"
  if [[ -s "$page_dir/attachments/manifest.json" ]]; then
    previous_manifest="$(mktemp)"
    cp "$page_dir/attachments/manifest.json" "$previous_manifest"
  fi

  extract_image_manifest "$page_dir" "$page_id"
  reuse_existing_images "$page_dir" "$previous_manifest"
  [[ -z "$previous_manifest" ]] || rm -f "$previous_manifest"

  image_count="$(jq -r '.images | length' "$page_dir/attachments/manifest.json")"
  missing_image_count="$(jq -r '[.images[] | select(.downloaded != true)] | length' "$page_dir/attachments/manifest.json")"

  if ((image_count == 0)); then
    cp "$page_dir/body.view.html" "$page_dir/body.view.local.html"
    echo "  images: none"
    return 0
  fi

  if ((missing_image_count == 0)); then
    write_localized_html "$page_dir"
    cleanup_unreferenced_attachments "$page_dir"
    echo "  images: reused $image_count/$image_count"
    return 0
  fi

  load_atlassian_env || {
    echo "Cannot download $missing_image_count missing embedded images for page $page_id without the token." >&2
    return 1
  }

  local index=0 failed=0
  while IFS=$'\t' read -r rest_download_url local_path filename; do
    index=$((index + 1))
    local dest="$page_dir/$local_path"
    mkdir -p "$(dirname "$dest")"

    if curl -fL --retry 3 --connect-timeout 10 --max-time 120 \
      -u "${ATLASSIAN_EMAIL}:${ATLASSIAN_API_TOKEN}" \
      -o "$dest" \
      "$rest_download_url" >/dev/null 2>&1; then
      echo "  images: downloaded $index/$missing_image_count $filename"
    else
      failed=$((failed + 1))
      rm -f "$dest"
      echo "  images: failed $index/$missing_image_count $filename" >&2
    fi
  done < <(jq -r '.images[] | select(.downloaded != true) | [.rest_download_url, .local_path, .filename] | @tsv' "$page_dir/attachments/manifest.json")

  mark_downloaded_images "$page_dir"
  write_localized_html "$page_dir"
  cleanup_unreferenced_attachments "$page_dir"

  if ((failed > 0)); then
    echo "Failed to download $failed of $missing_image_count missing embedded images for page $page_id" >&2
    return 1
  fi
}

cache_is_fresh() {
  local checked_at="$1"
  local ttl_hours="$2"

  [[ -n "$checked_at" && "$checked_at" != "null" ]] || return 1

  local checked_epoch now_epoch ttl_seconds normalized_checked_at
  normalized_checked_at="$(printf '%s' "$checked_at" | sed -E 's/([+-][0-9]{2}):([0-9]{2})$/\1\2/')"
  checked_epoch="$(date -j -f '%Y-%m-%dT%H:%M:%S%z' "$normalized_checked_at" '+%s' 2>/dev/null || true)"
  [[ -n "$checked_epoch" ]] || return 1

  now_epoch="$(date '+%s')"
  ttl_seconds=$((ttl_hours * 3600))
  ((now_epoch - checked_epoch < ttl_seconds))
}

download_spec() {
  local slug="$1"
  local page_id="$2"
  local source_url="$3"
  local local_path="$4"
  local page_dir="$PROJECT_DIR/$local_path"

  mkdir -p "$page_dir"
  printf '%s\n' "$source_url" > "$page_dir/source.url"

  for format in "${FORMATS[@]}"; do
    local raw_json="$page_dir/page.$format.raw.json"
    local retry_count=0

    while true; do
      acli confluence page view --id "$page_id" --json --body-format "$format" > "$raw_json"

      if [[ "$format" != "view" ]]; then
        break
      fi

      if ! jq -e '.body.view.value | contains("fatal-render-error")' "$raw_json" >/dev/null; then
        break
      fi

      if ((retry_count >= VIEW_RENDER_RETRIES)); then
        echo "Confluence view rendering still failed after $VIEW_RENDER_RETRIES retries for page $page_id; body.view.html contains fatal-render-error" >&2
        return 1
      fi

      retry_count=$((retry_count + 1))
      echo "  view render failed with fatal-render-error; retrying ($retry_count/$VIEW_RENDER_RETRIES)" >&2
      sleep 2
    done

    jq 'del(.body)' "$raw_json" > "$page_dir/metadata.$format.json"

    case "$format" in
      storage)
        jq -r '.body.storage.value' "$raw_json" > "$page_dir/body.storage.xml"
        ;;
      atlas_doc_format)
        jq '.body.atlas_doc_format.value' "$raw_json" > "$page_dir/body.atlas_doc_format.json"
        ;;
      view)
        jq -r '.body.view.value' "$raw_json" > "$page_dir/body.view.html"
        ;;
    esac
  done

  download_images "$page_dir" "$page_id"

  local title version checked_at
  title="$(jq -r '.title' "$page_dir/page.storage.raw.json")"
  version="$(jq -r '.version.number' "$page_dir/page.storage.raw.json")"
  checked_at="$(date '+%Y-%m-%dT%H:%M:%S%z' | sed -E 's/([+-][0-9]{2})([0-9]{2})$/\1:\2/')"

  printf '%s\n' "$title" > "$page_dir/title.txt"
  manifest_update "$slug" "$title" "$version" "$version" "$checked_at"
}

require_tool jq
require_tool python3

if [[ -z "$MANIFEST" ]]; then
  if [[ -f "$PROJECT_DIR/specs/specs.json" ]]; then
    MANIFEST="$PROJECT_DIR/specs/specs.json"
  elif [[ "$(basename "$PROJECT_DIR")" == "specs" && -f "$PROJECT_DIR/specs.json" ]]; then
    MANIFEST="$PROJECT_DIR/specs.json"
    PROJECT_DIR="$(cd "$PROJECT_DIR/.." && pwd)"
  else
    echo "Missing manifest: expected $PROJECT_DIR/specs/specs.json" >&2
    exit 1
  fi
fi

if [[ ! -f "$MANIFEST" ]]; then
  echo "Missing manifest: $MANIFEST" >&2
  exit 1
fi

ttl_hours="$(jq -r '.cache_ttl_hours // 24' "$MANIFEST")"
slugs=()
while IFS= read -r slug; do
  slugs+=("$slug")
done < <(jq -r '.specs[].slug' "$MANIFEST")

if ((${#targets[@]})); then
  slugs=("${targets[@]}")
fi

for slug in "${slugs[@]}"; do
  if ! jq -e --arg slug "$slug" '.specs[] | select(.slug == $slug)' "$MANIFEST" >/dev/null; then
    echo "Unknown spec slug: $slug" >&2
    exit 1
  fi

  page_id="$(manifest_get "$slug" '.page_id')"
  source_url="$(manifest_get "$slug" '.source_url')"
  local_path="$(manifest_get "$slug" '.local_path')"
  local_version="$(manifest_get "$slug" '.local_version // 0')"
  checked_at="$(manifest_get "$slug" '.online_version_checked_at // ""')"
  page_dir="$PROJECT_DIR/$local_path"

  if [[ "$force" == false ]] && has_local_files "$page_dir" && cache_is_fresh "$checked_at" "$ttl_hours"; then
    echo "$slug: using local cache (local v$local_version, checked $checked_at)"
    continue
  fi

  require_tool acli

  if [[ "$force" == false ]]; then
    remote_json="$(acli confluence page view --id "$page_id" --json)"
    online_version="$(jq -r '.version.number' <<< "$remote_json")"
    title="$(jq -r '.title' <<< "$remote_json")"
    checked_at="$(date '+%Y-%m-%dT%H:%M:%S%z' | sed -E 's/([+-][0-9]{2})([0-9]{2})$/\1:\2/')"

    if has_local_files "$page_dir" && ((online_version <= local_version)); then
      manifest_update "$slug" "$title" "$local_version" "$online_version" "$checked_at"
      echo "$slug: local copy is current (v$local_version)"
      continue
    fi

    if has_spec_content "$page_dir" && ((online_version <= local_version)); then
      echo "$slug: local spec content is current (v$local_version); syncing images only"
      download_images "$page_dir" "$page_id"
      manifest_update "$slug" "$title" "$local_version" "$online_version" "$checked_at"
      continue
    fi

    echo "$slug: downloading v$online_version (local v$local_version)"
  else
    echo "$slug: force downloading"
  fi

  download_spec "$slug" "$page_id" "$source_url" "$local_path"
done
