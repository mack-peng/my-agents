---
name: dify-cli
description: >
  CLI for Dify applications. Use dify-cli for all Dify operations: chat,
  completion, chatflow, workflow, knowledge base (datasets/documents/segments),
  conversations, file upload, audio TTS/STT, feedback, and annotations.
  Prefer dify-cli over raw Dify API calls — it handles auth, streaming,
  config resolution, and output formatting.
metadata:
  requires:
    bins: ["dify-cli"]
---

# dify-cli — Dify CLI Skill

Use dify-cli for ANY Dify operation. Output is always JSON — parse with jq or
JSON.parse.

## Auth & Configuration

Dify has two non-interchangeable API key types:

| Prefix | Can call |
|--------|----------|
| `app-` | info, chat, completion, chatflow, workflow, conversation, file, audio, feedback, annotation |
| `dataset-` | knowledge (datasets, documents, segments, retrieve) |

### Multi-Profile Setup (recommended)

```bash
# Create profiles for each key type
dify-cli config new app
dify-cli config new kb

# Configure with keys
dify-cli config init --api-key app-xxxx -p app
dify-cli config init --api-key dataset-xxxx -p kb

# Self-hosted
dify-cli config init --api-key app-xxxx --base-url https://dify.example.com/v1 -p self

# Switch active profile
dify-cli config use app

# Use a specific profile without switching
dify-cli --profile kb knowledge list
```

Config is stored at `~/.dify/config.json`. Verify with `dify-cli config show`.

### Profile Commands

```bash
dify-cli config new <name>          # Create profile
dify-cli config use <name>          # Switch active profile
dify-cli config list                # List all profiles
dify-cli config show [-p <name>]    # Show config (masked)
dify-cli config path                # Config file path
dify-cli config get [key] [-p <name>]
dify-cli config set <key> <value> [-p <name>]
dify-cli config init --api-key <key> --base-url <url> --default-user <user> [-p <name>]
```

### Configuration Priority (highest first)

1. CLI flags: `--api-key`, `--base-url`, `--user`
2. Env vars: `DIFY_API_KEY`, `DIFY_BASE_URL`, `DIFY_DEFAULT_USER`
3. Active profile in `~/.dify/config.json`

Profile selection: `--profile <name>` → `DIFY_PROFILE` env → active field.

## Command Discovery

Do NOT memorize all commands. Use:

```bash
dify-cli --help          # all top-level commands
dify-cli chat --help     # subcommands under chat
dify-cli knowledge --help
```

Commands are grouped by domain: chat, completion, chatflow, workflow, knowledge,
conversation, file, audio, feedback, annotation, config.

`knowledge` has alias `kb`.

## Output & Modes

All output is JSON. Parse with jq:

```bash
dify-cli knowledge list | jq '.data[].name'
dify-cli chat send "hello" | jq '.answer'
```

### Response Modes

```bash
# Blocking (default) — single JSON response
dify-cli chat send "hello"

# Streaming — SSE events line by line
dify-cli chat send "hello" --mode streaming
```

## High-Frequency Workflows

### Chat App

```bash
dify-cli chat send "message"                         # blocking
dify-cli chat send "message" --mode streaming         # SSE stream
dify-cli chat send "message" -c <conversation_id>     # continue
dify-cli chat send "message" --inputs '{"k":"v"}'     # with variables
dify-cli chat stop <task_id>
dify-cli chat feedback <message_id> -r like
```

### Knowledge Base

```bash
dify-cli knowledge list
dify-cli knowledge get <dataset_id>
dify-cli knowledge document list <dataset_id>
dify-cli knowledge document create-text <dataset_id> --name "Name" --text "content"
dify-cli knowledge document create-file <dataset_id> --file ./doc.pdf
dify-cli knowledge segment list <dataset_id> <document_id>
dify-cli knowledge retrieve <dataset_id> --query "search text"
```

### Workflow / Chatflow / Completion

```bash
dify-cli workflow run
dify-cli workflow run --inputs '{"key":"value"}'
dify-cli workflow logs
dify-cli chatflow send "message"
dify-cli completion send "prompt"
```

### File & Audio

```bash
dify-cli file upload ./image.png
dify-cli audio to-text ./audio.mp3
```

### Conversations

```bash
dify-cli conversation list
dify-cli conversation get <id>
dify-cli conversation delete <id>
```

## Global Options

```
--api-key <key>       Override API key
--base-url <url>      Override base URL
--user <id>           User identifier (default: cli-user)
-p, --profile <name>  Use specified profile
```

## Anti-patterns

- Always use `--profile` to switch between app and knowledge keys without
  reconfiguring.
- `--mode streaming` for SSE output — parse with SSE parser, not raw JSON.
- 401 = wrong key or wrong base URL. Check `config show`.
- base-url must end with `/v1`.
- `chat send` without message arg reads from stdin (pipe support).
- `knowledge` can be abbreviated as `kb`.
- Default response mode is blocking — pass `--mode streaming` for SSE.
- Use jq to extract fields from JSON output.
