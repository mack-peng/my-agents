# dify-cli Agent Capabilities

`@orangemust/dify-cli` is a CLI tool that lets you control Dify applications programmatically — chat apps, completion apps, workflow apps, knowledge bases, all from the command line.

Full skill documentation and pitfalls reference at `.agents/skills/dify-cli/SKILL.md`. Use `dify-cli --help` for command discovery — do not memorize all commands.

Install globally:
```bash
npm install -g @orangemust/dify-cli
```

Or run without installing:
```bash
npx @orangemust/dify-cli chat send "hello"
npx @orangemust/dify-cli knowledge list
```

Verify:
```bash
which dify-cli && dify-cli --version
```

If `command not found`, add global bin to PATH:
```bash
export PATH="$(npm root -g)/../bin:$PATH"
```

Permission error on macOS/Linux:
```bash
sudo npm install -g @orangemust/dify-cli
```

---

## Config

Stored at `~/.dify/config.json`. Verify with `dify-cli config path` or `dify-cli config show`.

### Multi-Profile Setup (recommended)

```bash
dify-cli config new app              # Create profile for app key
dify-cli config new kb               # Create profile for dataset key

dify-cli config init --api-key app-xxxx -p app
dify-cli config init --api-key dataset-xxxx -p kb

# Self-hosted
dify-cli config init --api-key app-xxxx --base-url https://dify.example.com/v1 -p self

# Set a user identifier
dify-cli config init --api-key app-xxxx --default-user bot-agent -p app

dify-cli config use app              # Switch active profile
dify-cli --profile kb knowledge list # Use specific profile without switching
```

### Profile Commands

```bash
dify-cli config new <name>           # Create profile
dify-cli config use <name>           # Switch active profile
dify-cli config list                 # List all profiles
dify-cli config show [-p <name>]     # Show config (masked)
dify-cli config path                 # Config file path
dify-cli config get [key] [-p <name>]
dify-cli config set <key> <value> [-p <name>]
```

### Env Vars (skip config entirely)

```bash
export DIFY_API_KEY=app-xxxx
export DIFY_BASE_URL=https://dify.example.com/v1
export DIFY_DEFAULT_USER=bot-agent
export DIFY_PROFILE=app              # Override active profile
```

**Priority:** CLI flags (`--api-key`, `--profile`) > env vars (`DIFY_API_KEY`, `DIFY_PROFILE`) > active profile in config.

Override per command without touching config:
```bash
dify-cli chat send "hello" --api-key app-xxxx
dify-cli --profile kb knowledge list
```

---

## Two Key Types

Keys are **not interchangeable**:

| Operation | Key prefix | Where to get it |
|---|---|---|
| Chat / Completion / Workflow / Conversation / File / Audio | `app-` | Dify app → API Access → API Keys → Create |
| Knowledge base / Documents / Segments | `dataset-` | Dify app → Knowledge → API → Create |

---

## App Key Commands (`app-`)

Output is always JSON. Two response modes:

```bash
dify-cli chat send "message"                     # Blocking (default) — single JSON
dify-cli chat send "message" --mode streaming    # Streaming — SSE events
dify-cli chat send "message" -c <conversation_id> # Continue conversation
dify-cli chat send "message" --inputs '{"k":"v"}' # With variables
echo "long text" | dify-cli chat send            # Stdin pipe (no arg = read stdin)
```

```
dify-cli info
dify-cli chat send "message"
dify-cli chat stop <task_id>
dify-cli chat feedback <message_id> -r like
dify-cli completion send "prompt"
dify-cli chatflow send "message"
dify-cli workflow run
dify-cli workflow run --inputs '{"key":"value"}'
dify-cli workflow logs
dify-cli conversation list
dify-cli file upload ./doc.pdf
dify-cli audio to-text ./a.mp3
dify-cli feedback list --app-type chat
dify-cli annotation list
```

---

## Dataset Key Commands (`dataset-`)

`knowledge` can be abbreviated as `kb`.

```
dify-cli knowledge list                     # List datasets
dify-cli knowledge get <dataset_id>         # Get dataset info
dify-cli knowledge document list <dataset_id>
dify-cli knowledge document create-text <dataset_id> --name "Doc" --text "content"
dify-cli knowledge document create-text <dataset_id> --name "Doc" --text "content" --process-rule-mode custom --max-tokens 500 --overlap 50
dify-cli knowledge document create-file <dataset_id> --file ./file.pdf
dify-cli knowledge document create-file <dataset_id> --file ./file.pdf --process-rule-mode custom --separator "\n" --max-tokens 500 --overlap 50 --remove-extra-spaces
dify-cli knowledge segment list <dataset_id> <document_id>
dify-cli knowledge segment create <dataset_id> <document_id> --content "text"
dify-cli knowledge retrieve <dataset_id> --query "search text"
dify-cli knowledge retrieve <dataset_id> --query "test" --retrieval-model '{"search_method":"hybrid_search","reranking_enable":false,"top_k":5,"score_threshold_enabled":false}'
```

---

## Anti-patterns

- Use `--profile` to switch between app/dataset keys instead of reconfiguring.
- `--mode streaming` outputs SSE, not JSON — parse as SSE events.
- 401 = wrong key or wrong base URL. Check `config show`.
- base-url must end with `/v1`.
- `chat send` without message arg reads from stdin (pipe support).
- Use jq to extract fields from JSON output.
- See `.agents/skills/dify-cli/references/pitfalls.md` for more.

---

## Common Failures

**"Authorization header must be provided and start with 'Bearer'"** — Key is empty. Run `config init` or set `DIFY_API_KEY`.

**"Access token is invalid"** — Key is wrong or expired. Get a fresh one from Dify, or verify profile with `dify-cli config show`.

**"Cannot find module"** — Global install didn't register. Re-run `npm install -g @orangemust/dify-cli`.

**ENOTFOUND / FetchError** — Wrong `--base-url`. Make sure it ends with `/v1`.

**JSON output is messy** — Parse with `jq`:
```bash
dify-cli knowledge list | jq '.data[].name'
```
