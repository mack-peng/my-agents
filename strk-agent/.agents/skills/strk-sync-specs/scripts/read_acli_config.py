#!/usr/bin/env python3

import shlex
import sys


def strip_inline_comment(value):
    quote = None
    escaped = False
    for index, char in enumerate(value):
        if escaped:
            escaped = False
            continue
        if char == "\\" and quote == '"':
            escaped = True
            continue
        if char in ("'", '"'):
            if quote == char:
                quote = None
            elif quote is None:
                quote = char
            continue
        if char == "#" and quote is None:
            return value[:index].rstrip()
    return value.strip()


def parse_toml_value(raw):
    value = strip_inline_comment(raw.strip())
    if len(value) >= 2 and value[0] == value[-1] == '"':
        return bytes(value[1:-1], "utf-8").decode("unicode_escape")
    if len(value) >= 2 and value[0] == value[-1] == "'":
        return value[1:-1]
    return value


def read_values(config_path):
    section = None
    values = {}

    with open(config_path, encoding="utf-8") as config_file:
        for line in config_file:
            stripped = line.strip()
            if not stripped or stripped.startswith("#"):
                continue

            if stripped.startswith("[") and stripped.endswith("]"):
                section = stripped[1:-1].strip().lower()
                continue

            if "=" not in stripped:
                continue

            key, raw_value = stripped.split("=", 1)
            normalized_key = key.strip().replace("-", "_").lower()
            full_key = f"{section}.{normalized_key}" if section else normalized_key
            values[full_key] = parse_toml_value(raw_value)

    return values


def first_present(values, keys):
    for key in keys:
        value = values.get(key)
        if value:
            return value
    return None


values = read_values(sys.argv[1])
token = first_present(
    values,
    (
        "atlassian.api_token",
        "atlassian.api_key",
        "atlassian.token",
        "atlassian_api_token",
        "api_token",
    ),
)
email = first_present(values, ("atlassian.email", "atlassian_email"))

if token:
    print(f"ATLASSIAN_API_TOKEN={shlex.quote(token)}")
if email:
    print(f"ATLASSIAN_EMAIL={shlex.quote(email)}")
