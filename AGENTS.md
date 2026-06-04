# Agents monorepo

Each subdirectory is a self-contained OpenCode agent with its own doc.
No build, test, or lint at the root level.

## Directory conventions

- **12 directories use `AGENTS.md`**, **2 use `AGENT.md`** (singular): `dify-agent/` and `morph-agent/`.
- All 14 agent directories on disk have a reference doc.
- Most agents are CLI-tool wrappers — the CLI is installed globally, not per-directory. Commands and auth are documented inside each agent's markdown.
- No `package.json`, root workspace config, or shared dependency management.
- **No `opencode.json`** anywhere in the repo.

## Agents that differ from the wrapper pattern

- **`design-agent/`**, **`code-agent/`**, **`code-design-agent/`** — OpenCode-native agents with no external CLI dependency.
- **`feishu-agent/`** — has 26 sub-skills under `.agents/skills/` (mirrored in `skills/`), tracked via `skills-lock.json` from `open.feishu.cn`.
- **`doc-agent/`** — has a top-level `SKILL.md` for `officecli`. Sub-skills loaded dynamically via `officecli load_skill <name>`.
- **`browser-agent/`** — has `.playwright-cli/` runtime artifacts and `*.state.json` session files for saved browser state (dify, doubao, gitlab, zendesk).
- **`browser-use-agent/`** was deleted — check git history (`main.py`, `pyproject.toml`, `uv.lock`, `DEEPSEEK_API_KEY` in `.env`) if referenced.

## Skills

- Root-level `.agents/`, `skills/`, and `skills-lock.json` are **gitignored** (duplicates of `feishu-agent/`'s copies).
- To add/remove a shared skill, edit `feishu-agent/` — its `.agents/skills/` and `skills/` are the source of truth.

## Auth & secrets

- `.gitignore` hides `acli-agent/login.sh`, `acli-agent/login-confluence.sh`, and `*.state.json` files.
- API keys and tokens live in env vars or global CLI config, never in directory files.
