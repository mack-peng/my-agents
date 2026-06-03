# Agents monorepo

Each subdirectory is a self-contained OpenCode agent with its own `AGENTS.md` reference doc.
No build, test, or lint at the root level.

## Directory conventions

- **11 directories use `AGENTS.md`**, but two use `AGENT.md` (singular): `dify-agent/` and `morph-agent/`.
- Most agents are CLI-tool wrappers — CLI is installed globally, not per-directory. The relevant commands and auth are documented inside each agent's markdown.
- There is no `package.json`, root workspace config, or shared dependency management.

## Agents that differ from the wrapper pattern

- **`design-agent/`** — uses OpenCode's native capabilities with skills for product design workflows (scope, planning, spec generation). No external CLI dependency.
- **`feishu-agent/`** — has 25 sub-skills under `.agents/skills/` (also mirrored in `skills/`). There is a `skills-lock.json` tracking installs from `open.feishu.cn`.
- **`doc-agent/`** — has a top-level `SKILL.md` for `officecli`. Sub-skills are loaded via `officecli load_skill <name>`.
- **`browser-use-agent/`** — real project with `pyproject.toml`, `.venv/`, and `uv` for deps. Python 3.13. LLM via `DEEPSEEK_API_KEY` in `.env`. Only agent with actual code (`main.py`).
- **`browser-agent/`** — has `.playwright-cli/` runtime artifacts and `*.state.json` session files for saved browser state (dify, doubao, gitlab, zendesk).

## Auth & secrets

- `.gitignore` hides `acli-agent/login.sh`, `acli-agent/login-confluence.sh`, and `*.state.json` files.
- API keys and tokens live in env vars or global CLI config, never in directory files.
- `browser-use-agent/.env` is not gitignored — contains `DEEPSEEK_API_KEY`.
