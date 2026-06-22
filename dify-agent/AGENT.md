# dify-cli Agent Capabilities

`@orangemust/dify-cli` is a CLI tool that lets you control Dify applications programmatically — chat apps, completion apps, workflow apps, knowledge bases, all from the command line.

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

Stored at `~/.dify/config.json`. One key at a time.

```bash
dify-cli config get              # View current config

# For app operations
dify-cli config init --api-key app-xxxx

# For knowledge base operations
dify-cli config init --api-key dataset-xxxx

# If self-hosted
dify-cli config init --api-key app-xxxx --base-url https://dify.example.com/v1

# Set a user identifier
dify-cli config init --api-key app-xxxx --default-user bot-agent
```

### Env Vars (skip config entirely)

```bash
export DIFY_API_KEY=app-xxxx
export DIFY_BASE_URL=https://dify.example.com/v1
export DIFY_DEFAULT_USER=bot-agent
```

Priority: CLI flag `--api-key` > env var `DIFY_API_KEY` > config file.

Override per command without touching config:
```bash
dify-cli chat send "hello" --api-key app-xxxx
dify-cli knowledge list --api-key dataset-xxxx
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

```
dify-cli info                               # App info
dify-cli chat send "message"                # Chat (blocking)
dify-cli chat send "message" --mode streaming  # Chat (streaming)
dify-cli completion send "prompt"           # Completion
dify-cli chatflow send "message"            # Chatflow
dify-cli workflow run                       # Workflow
dify-cli conversation list                  # Conversations
dify-cli file upload ./doc.pdf              # Upload file
dify-cli audio to-text ./a.mp3              # Speech-to-text
dify-cli feedback list --app-type chat      # Feedback
dify-cli annotation list                    # Annotations
```

---

## Dataset Key Commands (`dataset-`)

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

## Common Failures

**"Authorization header must be provided and start with 'Bearer'"** — Key is empty. Run `config init` or set `DIFY_API_KEY`.

**"Access token is invalid"** — Key is wrong or expired. Get a fresh one from Dify.

**"Cannot find module"** — Global install didn't register. Re-run `npm install -g @orangemust/dify-cli`.

**ENOTFOUND / FetchError** — Wrong `--base-url`. Make sure it ends with `/v1`.

**JSON output is messy** — Parse with `jq`:
```bash
dify-cli knowledge list | jq '.data[].name'
```
