# dify-cli Pitfalls & Boundaries

## Auth & Config

- Config file location: `~/.dify/config.json` (JSON). Use `config path` to confirm.
- Two non-interchangeable key types: `app-*` for app commands, `dataset-*` for knowledge commands.
- Profile selection: `--profile <name>` → `DIFY_PROFILE` env → `active` field.
- Config value resolution: CLI flags > env vars > active profile.
- 401 errors mean wrong key, missing key, or wrong base-url.

## API Key Types

- `app-*` key: info, chat, completion, chatflow, workflow, conversation, file, audio, feedback, annotation.
- `dataset-*` key: knowledge (datasets, documents, segments, retrieve).
- Using the wrong key type returns 401 or 400. Switch with `--profile` or `--api-key`.

## Output Format

- ALL commands output JSON. Parse with jq or language JSON parser.
- `--mode streaming` returns SSE (Server-Sent Events). Each line is a `data:` prefixed JSON event.
- Errors: thrown as exceptions with `API <status>: <message>`, exit code 1.

## Base URL

- Must end with `/v1`. Examples: `https://api.dify.ai/v1`, `http://dify.example.com/v1`.
- Cloud Dify: `https://api.dify.ai/v1` (default).
- Self-hosted: use custom base URL with `-p <profile>` or `--base-url`.

## Chat stdin piping

- `dify-cli chat send` without a message argument reads from stdin.
- Useful for piping long text: `echo "message" | dify-cli chat send`.

## Knowledge alias

- `dify-cli knowledge` can be written as `dify-cli kb`.

## Process rules (knowledge document creation)

- For `knowledge document create-text` and `create-file`, `--process-rule-mode` can be `automatic` (default) or `custom`.
- Custom mode supports: `--max-tokens`, `--overlap`, `--separator`, `--remove-extra-spaces`.

## Old Config Migration

- Old flat config `{ apiKey, baseUrl, defaultUser }` is auto-migrated to profile format on first read.
- No manual migration needed.
