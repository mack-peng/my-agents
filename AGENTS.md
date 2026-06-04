# Agents monorepo

Each subdirectory is a self-contained OpenCode agent with its own `AGENTS.md` reference doc.
No build, test, or lint at the root level.

## Directory conventions

- **11 directories use `AGENTS.md`**, **2 use `AGENT.md`** (singular): `dify-agent/` and `morph-agent/`.
- **`code-design-agent/` has no reference doc at all** — it only has `input/` and `output/` dirs.
- **`browser-use-agent/` is deleted from disk** but fully tracked in git (`main.py`, `pyproject.toml`, `uv.lock`). If a task refers to it, check git history.
- Most agents are CLI-tool wrappers — the CLI is installed globally, not per-directory. Commands and auth are documented inside each agent's markdown.
- There is no `package.json`, root workspace config, or shared dependency management.
- **No `opencode.json`** anywhere in the repo.

## Agents that differ from the wrapper pattern

- **`design-agent/`** — uses OpenCode's native capabilities with skills for product design workflows (scope, planning, spec generation). No external CLI dependency.
- **`feishu-agent/`** — has 26 sub-skills under `.agents/skills/` (mirrored in `skills/`), tracked via `skills-lock.json` from `open.feishu.cn`.
- **`doc-agent/`** — has a top-level `SKILL.md` for `officecli`. Sub-skills loaded dynamically via `officecli load_skill <name>`.
- **`browser-use-agent/`** (git-only) — real project with `pyproject.toml`, `uv`, Python 3.13. LLM via `DEEPSEEK_API_KEY` in `.env`. Only agent with runnable code (`main.py`).
- **`browser-agent/`** — has `.playwright-cli/` runtime artifacts and `*.state.json` session files for saved browser state (dify, doubao, gitlab, zendesk).

## Skills

- Root-level `.agents/`, `skills/`, and `skills-lock.json` are **gitignored** (duplicates of `feishu-agent/`'s copies).
- To add/remove a shared skill, edit `feishu-agent/` — its `.agents/skills/` and `skills/` are the source of truth.

## Auth & secrets

- `.gitignore` hides `acli-agent/login.sh`, `acli-agent/login-confluence.sh`, and `*.state.json` files.
- API keys and tokens live in env vars or global CLI config, never in directory files.
- `browser-use-agent/.env` (in git) — contains `DEEPSEEK_API_KEY`.
