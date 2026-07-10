#!/usr/bin/env python3

import hashlib
import html
import json
import os
import re
import shutil
import sys
from datetime import datetime, timezone
from urllib.parse import unquote, urlparse


IMG_TAG_RE = re.compile(r"<img\b[^>]*>", re.IGNORECASE)
ATTR_RE = re.compile(r'([A-Za-z0-9_:-]+)\s*=\s*"([^"]*)"')


def read_text(path):
    if not os.path.exists(path):
        return ""
    with open(path, encoding="utf-8") as file:
        return file.read()


def write_json(path, data):
    with open(path, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)
        file.write("\n")


def load_json(path, fallback=None):
    if not os.path.exists(path):
        return fallback
    with open(path, encoding="utf-8") as file:
        return json.load(file)


def file_sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_present(path):
    return os.path.isfile(path) and os.path.getsize(path) > 0


def image_attrs(tag):
    return {key: html.unescape(value) for key, value in ATTR_RE.findall(tag)}


def safe_attachment_filename(filename, resource_id):
    safe = re.sub(r"[/:\\?&#=%]", "-", filename)
    safe = re.sub(r"[\x00-\x1f\x7f]", "", safe).strip()
    safe = re.sub(r"-+", "-", safe)
    return safe or f"attachment-{resource_id}"


def filename_from_url(remote_url):
    try:
        path = urlparse(remote_url).path
    except ValueError:
        path = remote_url
    return unquote(os.path.basename(path))


def base_url_from_attrs(attrs, remote_url):
    base_url = attrs.get("data-base-url", "")
    if base_url:
        return base_url

    try:
        parsed = urlparse(remote_url)
    except ValueError:
        parsed = None

    if parsed and parsed.scheme and parsed.netloc:
        return f"{parsed.scheme}://{parsed.netloc}/wiki"
    return "https://strikingly.atlassian.net/wiki"


def extract_image_manifest(page_dir, page_id):
    html_text = read_text(os.path.join(page_dir, "body.view.html"))
    images = []
    seen = set()

    for tag in IMG_TAG_RE.findall(html_text):
        attrs = image_attrs(tag)
        resource_id = str(attrs.get("data-linked-resource-id", ""))
        if not resource_id:
            continue

        content_type = str(attrs.get("data-linked-resource-content-type", ""))
        if content_type and not content_type.startswith("image/"):
            continue

        remote_url = str(attrs.get("data-image-src", "") or attrs.get("src", ""))
        if not remote_url:
            continue

        filename = str(
            attrs.get("data-linked-resource-default-alias", "")
            or attrs.get("alt", "")
            or filename_from_url(remote_url)
        )
        safe_filename = safe_attachment_filename(filename, resource_id)

        if resource_id in seen:
            continue
        seen.add(resource_id)

        base_url = base_url_from_attrs(attrs, remote_url)
        rest_download_url = (
            f"{base_url}/rest/api/content/{page_id}/child/attachment/"
            f"att{resource_id}/download"
        )

        images.append(
            {
                "resource_id": resource_id,
                "filename": filename,
                "content_type": content_type or None,
                "remote_url": remote_url,
                "thumbnail_url": attrs.get("src"),
                "rest_download_url": rest_download_url,
                "local_path": f"attachments/{resource_id}-{safe_filename}",
                "downloaded": False,
                "byte_size": None,
                "sha256": None,
            }
        )

    attachments_dir = os.path.join(page_dir, "attachments")
    os.makedirs(attachments_dir, exist_ok=True)
    manifest = {
        "page_id": page_id,
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "images": images,
    }
    write_json(os.path.join(attachments_dir, "manifest.json"), manifest)


def mark_downloaded_images(page_dir):
    manifest_path = os.path.join(page_dir, "attachments", "manifest.json")
    manifest = load_json(manifest_path)

    for image in manifest.get("images", []):
        full_path = os.path.join(page_dir, image["local_path"])
        if file_present(full_path):
            image["downloaded"] = True
            image["byte_size"] = os.path.getsize(full_path)
            image["sha256"] = file_sha256(full_path)
        else:
            image["downloaded"] = False
            image["byte_size"] = None
            image["sha256"] = None

    write_json(manifest_path, manifest)


def reuse_existing_images(page_dir, previous_manifest_path):
    manifest_path = os.path.join(page_dir, "attachments", "manifest.json")
    manifest = load_json(manifest_path)
    previous_by_id = {}

    if previous_manifest_path and os.path.isfile(previous_manifest_path):
        previous_manifest = load_json(previous_manifest_path, {"images": []})
        for image in previous_manifest.get("images", []):
            previous_by_id[str(image.get("resource_id", ""))] = image

    for image in manifest.get("images", []):
        current_path = os.path.join(page_dir, image["local_path"])
        reusable = file_present(current_path)

        if not reusable:
            previous = previous_by_id.get(str(image.get("resource_id", "")))
            if previous:
                previous_path = str(previous.get("local_path", ""))
                full_previous_path = os.path.join(page_dir, previous_path)
                if file_present(full_previous_path):
                    os.makedirs(os.path.dirname(current_path), exist_ok=True)
                    shutil.copyfile(full_previous_path, current_path)
                    reusable = True

        if not reusable:
            continue

        image["downloaded"] = True
        image["byte_size"] = os.path.getsize(current_path)
        image["sha256"] = file_sha256(current_path)

    write_json(manifest_path, manifest)


def cleanup_unreferenced_attachments(page_dir):
    attachments_dir = os.path.join(page_dir, "attachments")
    manifest_path = os.path.join(attachments_dir, "manifest.json")
    if not os.path.isfile(manifest_path):
        return

    manifest = load_json(manifest_path)
    keep = {"manifest.json"}
    for image in manifest.get("images", []):
        local_path = str(image.get("local_path", ""))
        if local_path.startswith("attachments/"):
            keep.add(local_path[len("attachments/") :])

    for filename in os.listdir(attachments_dir):
        path = os.path.join(attachments_dir, filename)
        if os.path.isdir(path):
            continue
        if filename not in keep:
            os.remove(path)


def replace_or_insert_attr(tag, attr_name, value):
    escaped = html.escape(value, quote=True)
    attr_re = re.compile(rf'\s{re.escape(attr_name)}="[^"]*"')
    replacement = f' {attr_name}="{escaped}"'
    if attr_re.search(tag):
        return attr_re.sub(replacement, tag)
    return re.sub(r"<img\b", f"<img{replacement}", tag, count=1, flags=re.IGNORECASE)


def write_localized_html(page_dir):
    html_path = os.path.join(page_dir, "body.view.html")
    local_html_path = os.path.join(page_dir, "body.view.local.html")
    manifest_path = os.path.join(page_dir, "attachments", "manifest.json")

    html_text = read_text(html_path)
    manifest = load_json(manifest_path, {"images": []})
    by_id = {
        str(image.get("resource_id", "")): image
        for image in manifest.get("images", [])
        if image.get("downloaded")
    }

    def rewrite_tag(match):
        tag = match.group(0)
        resource_match = re.search(r'data-linked-resource-id="([^"]+)"', tag)
        resource_id = resource_match.group(1) if resource_match else ""
        image = by_id.get(resource_id)
        if not image:
            return tag

        local_path = image["local_path"]
        rewritten = replace_or_insert_attr(tag, "src", local_path)
        rewritten = replace_or_insert_attr(rewritten, "data-image-src", local_path)
        if re.search(r'\ssrcset="', rewritten):
            escaped = html.escape(local_path, quote=True)
            rewritten = re.sub(r'\ssrcset="[^"]*"', f' srcset="{escaped} 1x"', rewritten)
        rewritten = replace_or_insert_attr(rewritten, "data-local-image-src", local_path)
        return rewritten

    localized = IMG_TAG_RE.sub(rewrite_tag, html_text)
    with open(local_html_path, "w", encoding="utf-8") as file:
        file.write(localized)


COMMANDS = {
    "extract_image_manifest": extract_image_manifest,
    "mark_downloaded_images": mark_downloaded_images,
    "reuse_existing_images": reuse_existing_images,
    "cleanup_unreferenced_attachments": cleanup_unreferenced_attachments,
    "write_localized_html": write_localized_html,
}


if len(sys.argv) < 3 or sys.argv[1] not in COMMANDS:
    commands = ", ".join(sorted(COMMANDS))
    print(f"Usage: image_utils.py <{commands}> <args...>", file=sys.stderr)
    sys.exit(2)

COMMANDS[sys.argv[1]](*sys.argv[2:])
