# dify-cli Agent Capabilities

`dify-cli` is installed globally and configured with an `app-` API key at `https://dify.orangemust.com/v1`.

## Available Commands

### Info & Status
```
dify-cli info                               # App info
dify-cli config get                         # View current config
```

### Chat (app- key)
```
dify-cli chat send "message"                # Chat (blocking)
dify-cli chat send "message" --mode streaming  # Chat (streaming)
dify-cli completion send "prompt"           # Completion
dify-cli chatflow send "message"            # Chatflow
dify-cli workflow run                       # Workflow
```

### Conversation Management
```
dify-cli conversation list                  # List conversations
```

### File & Audio
```
dify-cli file upload ./doc.pdf              # Upload file
dify-cli audio to-text ./a.mp3              # Speech-to-text
```

### Feedback & Annotations
```
dify-cli feedback list --app-type chat      # List feedback
dify-cli annotation list                    # List annotations
```

### Knowledge Base (requires dataset- key)
```
dify-cli knowledge list                     # List datasets
dify-cli knowledge get <dataset_id>         # Get dataset
dify-cli knowledge document list <dataset_id>
dify-cli knowledge segment list <dataset_id> <document_id>
```

## Config Override
Override per command without modifying config:
```
dify-cli chat send "hello" --api-key app-xxxx
dify-cli knowledge list --api-key dataset-xxxx
```

## Env Vars (skip config entirely)
```
export DIFY_API_KEY=app-xxxx
export DIFY_BASE_URL=https://dify.orangemust.com/v1
export DIFY_DEFAULT_USER=bot-agent
```
Priority: CLI flag > env var > config file.

## Verification
```bash
dify-cli info    # Should return JSON with app info
```
