# Agents monorepo

AI 工作台 — 常用工作工具封装为独立 agent 目录。人类拆任务、做决策、审结果；AI 读取各 agent 文档后调用对应 CLI 或执行工作流，完成具体产出。

Each subdirectory is a self-contained OpenCode agent with its own doc.
No build, test, or lint at the root level.

## Directory conventions

- **22 directories use `AGENTS.md`**, **1 uses `AGENT.md`** (singular): `dify-agent/`.
- All 23 documented agent directories on disk have a reference doc (`test-agent/` has none — effectively abandoned).
- Most agents are CLI-tool wrappers — the CLI is installed globally, not per-directory. Commands and auth are documented inside each agent's markdown.
- No `package.json`, root workspace config, or shared dependency management.
- **No `opencode.json`** anywhere in the repo.

## Agents that differ from the wrapper pattern

- **`design-agent/`**, **`code-agent/`**, **`code-design-agent/`** — OpenCode-native agents with no external CLI dependency.
- **`develop-agent/`** — 六阶段需求开发协调器。委托 design-agent / code-design-agent / code-agent / morph-agent / gitee-agent / feishu-agent 串行执行，每阶段需人工 sign-off。支持飞书持久化（`USE_FEISHU=true`）或 Session 模式，通过 `.env` 配置。`.env` gitignored。
- **`strk-agent/`** — skill-based STRK development workflow entrypoint. Coordinates `strk-sync-specs`, `strk-review-spec`, `strk-code-design`, `strk-write-code`, and `strk-review-code` skills. Stores repo paths in `strk-agent/.env` (gitignored).
- **`feishu-agent/`** — has 6 sub-skills in `feishu-agent/.agents/skills/` (lark-doc, lark-drive, lark-markdown, lark-shared, lark-sheets, lark-wiki). **禁止加载系统级 skill 文件（`~/.agents/skills/lark-*`）**：大多数飞书操作直接从 `feishu-agent/AGENTS.md` 的快捷命令抄写执行，仅在复杂操作（XML block、公式、权限管理等）时才读取 agent 自带的 skill 文件。
- **`doc-agent/`** — has a top-level `SKILL.md` for `officecli`. Sub-skills loaded dynamically via `officecli load_skill <name>`.
- **`browser-agent/`** — has `.playwright-cli/` runtime artifacts and `*.state.json` session files for saved browser state (dify, doubao, gitlab, zendesk).
- **`browser-use-agent/`** was deleted — check git history (`main.py`, `pyproject.toml`, `uv.lock`, `DEEPSEEK_API_KEY` in `.env`) if referenced.

## Skills

- 飞书 skills 仅位于 `feishu-agent/.agents/skills/`，通过 `npx -y skills add https://open.feishu.cn --skill -y` 安装/更新。**不要安装到 `~/.agents/skills/`**（会导致系统 prompt 中 available_skills 膨胀），feishu-agent 的 AGENTS.md 已自带快捷命令覆盖常用操作。
- STRK skills 位于 `strk-agent/.agents/skills/`（仅 strk-agent 使用），从 `agent-rnd-skills` 仓库同步。

## Reference docs

- `references/` — tool usage docs and templates (Dagger, Dify, Opnform, Google-SEO, bobcat MR template). Shared reference material, not agent-specific.
- `specs/` — reserved for spec-syncing workflows (e.g. strk-agent).

## Non-agent directories

- `code_design/` — project workspace for code-design-agent on a specific project (agro-mall-c-end). Not an agent itself.
- `tmp/` — temporary working scripts and test artifacts. Gitignored.

## Working assets (do not commit)

- `input/` — inbound work files (DSL exports, user-provided YAML, reference data). Gitignored.
- `output/` — outbound artifacts (generated DSL, specs in progress). Gitignored.
- `design-agent/output/` and `design-agent/projects/` — agent-scoped working directories. Gitignored.
- These are local working assets, not source code. They should never be pushed to GitHub.
- All agents read from and write to these directories freely.

## Agent interaction patterns

- When user says "use X-agent", read X-agent's AGENTS.md first — each agent defines its own workflow, CLI tools, and conventions.
- **dify-builder-agent** (`dify-dsl-cli`) — manipulates Dify DSL YAML files. Used for editing nodes, edges, prompts, etc. within a DSL.
- **dify-agent** (`dify-cli`) — runtime Dify API operations (chat send, knowledge list, file upload). Separate CLI, separate agent from dify-builder-agent.
- **design-agent** — produces structured `.spec.md` files in `design-agent/output/`. Its output format uses `## Problem`, `## Solution`, `## Sign-off` sections with table-driven requirements. Do not output implementation specs as YAML — use the design-agent `.spec.md` format instead.
- Agents have clear boundaries: dify-builder-agent executes modifications; design-agent only reviews and outputs specs, never implements.
- **develop-agent** — 需求研发入口。输入需求描述，自动串联全流程。协调器本身不执行具体操作，只分派给子 agent 并逐阶段等待 sign-off。

## Git commit conventions

- Commit message 一律使用英文，格式 `<type>(<scope>): <简短描述>`，禁止中文 commit message。
- 禁止 force push。如需修改已推送的 commit，追加新 commit。

## Dify DSL app conventions

- `input/` holds exported Dify `.yml` DSL files sourced from `https://dify.orangemust.com`.
- `design-agent/output/` holds structured `.spec.md` files for DSL modification specs.
- `dify-dsl-cli flow <file>` and `dify-dsl-cli node show <file> <id>` are the first commands to run when analyzing a DSL.
- After any DSL modification, always validate: `dify-dsl-cli validate <file>`.
- Test runtime behavior via `dify-cli chat send "..." --inputs '{...}'`.

## Auth & secrets

- `.gitignore` hides `acli-agent/login.sh`, `acli-agent/login-confluence.sh`, and `*.state.json` files.
- API keys and tokens live in env vars or global CLI config, never in directory files.
