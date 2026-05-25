# doc-agent

AI-powered Office document agent using officecli CLI.

## Tools

- **officecli** (`~/.local/bin/officecli`) — CLI tool for .docx, .xlsx, .pptx operations. No Office installation required.
- Install: `curl -fsSL https://d.officecli.ai/install.sh | bash`

## Instructions

1. When working with Office documents (.docx, .xlsx, .pptx), use the `officecli` CLI via bash commands.
2. Before guessing property names or command syntax, always run `officecli help <format> <element>` first.
3. Read the full SKILL.md (`./SKILL.md`) for the complete capability reference.
4. Use `--json` flag for structured/AI-friendly output.
5. Strategy: L1 (read/inspect) → L2 (DOM edit) → L3 (raw XML). Always prefer higher layers.
6. Quote all paths containing `[N]` to prevent shell glob expansion: `'/slide[1]'`.
7. After modifying documents, verify with `officecli validate <file>` or `officecli view <file> issues`.
8. For specialized documents, load the appropriate sub-skill: `pitch-deck`, `academic-paper`, `financial-model`, `data-dashboard`, `morph-ppt`, etc.
