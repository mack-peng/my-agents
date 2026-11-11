# Agents monorepo

AI 工作台 — 常用工作工具封装为独立 agent 目录。人类拆任务、做决策、审结果；AI 读取各 agent 文档后调用对应 CLI 或执行工作流，完成具体产出。

Each subdirectory is a self-contained OpenCode agent with its own doc.
No build, test, or lint at the root level.

## Directory conventions

- **32 directories use `AGENTS.md`**, **1 uses `AGENT.md`** (singular): `dify-agent/`.
- All 33 agent directories on disk have a reference doc (32 × `AGENTS.md` + 1 × `AGENT.md`); the former `test-agent/` (undocumented) no longer exists.
- Most agents are CLI-tool wrappers — the CLI is installed globally, not per-directory. Commands and auth are documented inside each agent's markdown.
- No `package.json`, root workspace config, or shared dependency management.
- **No `opencode.json`** anywhere in the repo.

## Agents that differ from the wrapper pattern

- **`design-agent/`**, **`code-agent/`**, **`code-design-agent/`** — OpenCode-native agents with no external CLI dependency. code-design-agent 产出的 Code Design 文档落 `output/`（与 design-agent 的 `design-agent/output/` 区分）。
- **`develop-agent/`** — 六阶段需求开发协调器。委托 design-agent / code-design-agent / code-agent / ci-lite（`~/ci-lite` 构建部署工作区）/ gitee-agent / feishu-agent 串行执行，每阶段需人工 sign-off。支持飞书持久化（`USE_FEISHU=true`）或 Session 模式，通过 `.env` 配置。`.env` gitignored。
- **`deploy-agent/`** — 构建/部署入口（Dagger 栈已退役）。不直接执行构建，统一走 ci-lite（`~/ci-lite`：读其 `AGENTS.md` 后执行 `scripts/`）；文档含 morph-cli → ci-lite 命令映射。
- **`strk-agent/`** — skill-based STRK development workflow entrypoint. Coordinates `strk-sync-specs`, `strk-review-spec`, `strk-code-design`, `strk-write-code`, and `strk-review-code` skills. Stores repo paths in `strk-agent/.env` (gitignored).
- **`feishu-agent/`** — has 6 sub-skills in `feishu-agent/.agents/skills/` (lark-doc, lark-drive, lark-markdown, lark-shared, lark-sheets, lark-wiki). 全局不再安装任何 `lark-*`：大多数飞书操作直接从 `feishu-agent/AGENTS.md` 的快捷命令抄写执行，仅在复杂操作（XML block、公式、权限管理等）时才读取 agent 自带的 skill 文件。
- **`doc-agent/`** — has a top-level `SKILL.md` for `officecli`. Sub-skills loaded dynamically via `officecli load_skill <name>`.
- **`browser-agent/`** — has `.playwright-cli/` runtime artifacts and `*.state.json` session files for saved browser state (dify, doubao, gitlab, zendesk).
- **`cssprobe-agent/`** — runtime CSS probe for layout/scroll/overflow inspection. Uses `cssprobe-cli` to analyze live pages in a browser. Supports iframe targeting (`--frame`), timeline sampling (`sample` / `wait-stable`), and JSON scenario regression suites (`scenario run`). Produces structured reports with DEFINITE/INDEFINITE/UNVERIFIABLE confidence levels.
- **`seo-agent/`** — OpenCode-native SEO review & design agent. Five workflows: SEO audit / fix design (file-level change groups for code-agent) / page-purpose blueprint / AI-visibility sampling / keyword-intent research. **只出设计不改代码**；抓取委托 firecrawl-agent / browser-agent。Knowledge base in `seo-agent/references/`（含 `google-currency.md` 时效账本），skill 包移植自 yao-geo-skills（MIT，见 `seo-agent/.agents/skills/README.md`）。输出落 `seo-agent/output/`（gitignored）。
- **`image-agent/`** — OpenCode-native still-image agent。封面 / 分享图 / 自由图 / 改图 / 从文档出图；手工排版用 HTML/CSS/SVG 经 Playwright 截图（`scripts/shoot.mjs`），AI 生图/改图委托 aliyun-agent（`bl`）/ volcengine-agent（`ve`），真实摄影素材用已发布的 `unsplash` CLI（`@orangemust/unsplash-cli`，key 存系统 keychain 或 `~/.unsplashrc` / `UNSPLASH_ACCESS_KEY`；备用脚本 `scripts/unsplash.mjs` 依次读环境变量 / `~/.unsplashrc` / 系统 keychain）。输入 `input/`，输出 `output/<slug>/`；字体只保留 URL，按需下载到 `input/brand/fonts/`（不入 git）。
- **`xhs-agent/`** — OpenCode-native 小红书小工具全流程 agent。5+1 工作流：打包合规 zip（平台 skill `minitool-zip-builder` 离线 12 步 + 审计脚本）/ 上架素材（委托 image-agent）/ 推广笔记（骨架池 + 数字回溯）/ 竞品监测 / 数据回流 / Agent 托管（`.agents/skills/redapp-cli/` 登录 / 上传 / 预览 / 送审 / 审核状态，CLI 渐进引导，**不主动装 npm 依赖**）。产物落 `xhs-agent/output/`（gitignored）；token 存 `~/.skillhub-upload/`（自身管理，不入库）。
- **`browser-use-agent/`** was deleted — check git history (`main.py`, `pyproject.toml`, `uv.lock`, `DEEPSEEK_API_KEY` in `.env`) if referenced.
- **`bugsnag-agent/`** — bugsnag-cli wrapper，**默认只读、显式写** 的 BugSnag 错误分析 agent（全景 / 深度分析 / 项目健康 / 发布回归 / 性能排查 / 报告归档）。命令真值在 `bugsnag-agent/.agents/skills/bugsnag-cli/`（`bugsnag-cli skill-install --target opencode --local` 生成，勿手抄）；报告落 `bugsnag-agent/output/`（gitignored），飞书归档按 `bugsnag-agent/.env` 开关。triage 写操作仅允许 `error-update` / `error-bulk-update` 且必须带 `--write`。

## Skills

**核心原则：skill 只放 `X-agent/.agents/skills/`，根目录和全局永远不装。** opencode 会从 cwd 向上发现 `.agents/skills` / `.claude/skills` / `.opencode/skills`；从仓库根目录调用 agent 时，子目录 skill 不会进入 system prompt，需要时按 `X-agent/AGENTS.md` 的指示读取 `X-agent/.agents/skills/<name>/SKILL.md`。

### 当前保留

| Agent | 已提交 skill | 说明 |
| --- | --- | --- |
| `feishu-agent` | `lark-doc` / `lark-drive` / `lark-markdown` / `lark-shared` / `lark-sheets` / `lark-wiki` | 仅这 6 个，不装飞书目录里的其他 22 个 |
| `strk-agent` | `strk-*`（8 个） | 工作流完整链路，从 `agent-rnd-skills` 同步 |
| `seo-agent` | `yao-geo-*`（5 个） | 5 个 workflow 各一个 |
| `bugsnag-agent` | `bugsnag-cli` | 单一 CLI skill |
| `dify-agent` | `dify-cli` | 单一 CLI skill |
| `code-agent` | `cssgraph` | CSS 检索 / 影响分析 |
| `cssprobe-agent` | `cssprobe-cli` | 运行时 CSS 探针 |
| `aliyun-agent` | `bailian-cli` / `bailian-gen` / `bailian-protocol` | 百炼主入口；从 `~/.bailian/skills` 手工复制，无 lock |
| `image-agent` | `bailian-gen` / `bailian-protocol` / `prompt-images` | 生图 prompt 走 `prompt-images`（Replicate Apache-2.0）；百炼 skill 从 `~/.bailian/skills` 手工复制无 lock，`prompt-images` 有 `skills-lock.json` |
| `xhs-agent` | `minitool-zip-builder`（平台分发） / `redapp-cli`（平台分发） | 两个平台 skill 本体均已提交；对应 CLI（audit 的 Node / Python、redapp 的 npm 包 `redskillhub-upload`）按需使用，不预装 |
| `openfilm-agent` | `scripting-and-storyboarding` / `short-form-video-script` / `explainer-video` / `narrated-product-film` / `silent-product-demo` / `technical-video-script` | 前期创作（脚本/分镜/钩子），全部 MIT、装后剔除 evals；路由见其 `references/preproduction.md`，不跑 `skills update` |

`design-agent` 的 `web-design-guidelines` 为本地安装、不提交（上游未声明 license），仅提交 `design-agent/skills-lock.json`。

不提交、按需读取：`bailian-docs-llm-wiki`（32M，canonical 在 `~/.bailian/skills/`，只读 `models/` + `wiki/` + `llms.txt`）；`bailian-finetune` / `managed-agent` / `sandbox` / `train-deploy`（少用，需要时从 `~/.bailian/skills/` 复制单个）。

### 新增 skill 的决策流程

1. **先判断是否需要 skill**：只是 3–5 行 CLI 命令 → 写进对应 `X-agent/AGENTS.md`，不装 skill。
2. **先看目录再选**：`skills add <source> -l`，只挑需要的；读一遍 `SKILL.md` 和 `scripts/`，不要整包 `--all`。
3. **一个 skill 只放一个 agent**：`cd X-agent && skills add <source> -s <skill> -a opencode -y`。禁止 `-g` / `--global`、`-a '*'`、`--all`、在仓库根目录执行。
4. **决定是否提交**：
   - 核心、小（< 1M）、稳定、离线要用 → 提交 `X-agent/.agents/skills/` + `skills-lock.json`。
   - 大（如 32M 文档）、少用、社区 / 实验性 → 不提交；在 `X-agent/AGENTS.md` 写预检：
     ```md
     使用前检查 `.agents/skills/<name>/SKILL.md`；缺失时在本目录执行：
     skills add <source> -s <name> -a opencode -y
     ```
     百炼的少用 skill 不用 `bl skill add`（它会装全局），改为：
     `cp -R ~/.bailian/skills/<name> .agents/skills/`
5. **验证**：`cd X-agent && skills list`；`skills list -g` 必须没有社区 skill；`/Users/mack/Agents/.agents/skills/` 必须为空；重启 opencode 后从根目录看不到子目录 skill。
6. **清理**：任何 provider 的批量安装（`bl skill init`、`skills add --all`、`-a '*'`）之后，删除它在全局目录创建的软链，只保留目标 agent 目录。

> Provider 的 skill 目录是按产品面铺开的（飞书 28 个、百炼 10+ 个），不是按你的工作流打包；只装当前 agent 真正用到的，其余不装。

## Reference docs

- `references/` — tool usage docs and templates (Dagger, Dify, Opnform, Google-SEO, bobcat MR templates: bugfix / final-review × BE / FE). Shared reference material, not agent-specific.
- `specs/` — reserved for spec-syncing workflows (e.g. strk-agent).
- **飞书 reference 知识库**（space_id `7686073741683510471`）— 日常工作中提取的**可复用参考文档**归档处（例：开源项目推广 Playbook）。新产出可复用资料时优先归档到这里（`lark-cli wiki +node-create --space-id 7686073741683510471`）。

## Non-agent directories

- `tmp/` — temporary working scripts, probe scripts, captured HTML/JSON, MR body drafts and test artifacts. Gitignored.
  - **所有临时文件一律写入本仓库（AGENTS.md 所在目录）下的 `tmp/`，禁止使用系统 `/tmp/`**；产生的中间文件及时归位到 `tmp/`，避免散落。

## Working assets (do not commit)

- `input/` — inbound work files (DSL exports, user-provided YAML, reference data). Gitignored.
- `output/` — outbound artifacts (generated DSL, specs in progress, code-design-agent 的 Code Design 文档). Gitignored.
- `design-agent/output/` and `design-agent/projects/` — agent-scoped working directories. Gitignored.
- These are local working assets, not source code. They should never be pushed to GitHub.
- All agents read from and write to these directories freely.

## Agent interaction patterns

- When user says "use X-agent", read X-agent's AGENTS.md first — each agent defines its own workflow, CLI tools, and conventions.
- **dify-builder-agent** (`dify-dsl-cli`) — manipulates Dify DSL YAML files. Used for editing nodes, edges, prompts, etc. within a DSL.
- **dify-agent** (`dify-cli`) — runtime Dify API operations (chat send, knowledge list, file upload). Separate CLI, separate agent from dify-builder-agent.
- **design-agent** — produces `output/{内容}.review.md` (findings / evidence / priority) and `output/{内容}.spec.md` (confirmed requirements) in `design-agent/output/`. Spec format uses `## Context & Assumptions`, `## Problem`, `## Solution`, `## Sign-off` with table-driven requirements. Do not output implementation specs as YAML — use the design-agent `.spec.md` format instead.
- Agents have clear boundaries: dify-builder-agent executes modifications; design-agent only reviews and outputs specs, never implements.
- **develop-agent** — 需求研发入口。输入需求描述，自动串联全流程。协调器本身不执行具体操作，只分派给子 agent 并逐阶段等待 sign-off。
- **openfilm-agent** — 网页做片（`film.html` + Studio 人机共编）。读其 `AGENTS.md` 后按 workflow 索引执行；写页面前先走「前期创作」（脚本/分镜，规则在其 `references/preproduction.md`，片型 skill 在其 `.agents/skills/`）；**默认不导出**，导出由用户在 Studio 操作；禁止 `openfilm update`（本地 fork）。**系列化周报**（AI 调研周刊 Nº06 起）复制上期工程 + `recipe.md` 基线复用；Studio 字幕按词块渲染、VTT 必须保留词级时间标记，画面/素材/字幕 QA 规则见其 `references/visual-qa.md` 与 `audio-subtitles.md`。
- **image-agent** — 用网页做图（HTML 画布 + `scripts/shoot.mjs`）。先按 `references/art-direction.md` 选视觉方向（Swiss editorial / Photo-led / Data / Warm humanist / Brutalist），封面常用混合：AI 出背景、HTML 叠文字；真实摄影素材走 Unsplash（`unsplash` CLI / `@orangemust/unsplash-cli`，key 在系统 keychain 或 `~/.unsplashrc` / `UNSPLASH_ACCESS_KEY`）。生图 prompt 走 `.agents/skills/prompt-images/`；最终稿用 `qwen-image-3.0` / `wan2.7-image` / 即梦 Seedream，`z-image-turbo` 只做草稿。文字/Logo/数据永远 HTML。输入 `input/`，输出 `output/<slug>/`；字体按需下载到 `input/brand/fonts/`（不入 git）。
- **xhs-agent** — 小红书小工具工作台入口。读其 AGENTS.md 后按 workflow 索引执行；打包合规件走平台 skill（`minitool-zip-builder`，含在线文档比对 + 双审计脚本）；Agent 托管走 `redapp-cli`（登录 / 上传 / 预览 / 送审 / 状态，渐进引导）。上线素材与推广图委托 `use image-agent`。产物落 `xhs-agent/output/`；`redapp` CLI 的 npm 包不主动装，只在用户显式触发时 ensure-cli。

## JSON 处理约定

- CLI 的 `--json` 输出（如 `firecrawl search --json`）**统一用 `jq` 解析**，禁止手写 python 内联脚本。
- 大输出先用 `-o <文件>` 落盘，再 `jq` 读取，避免 stdout 被 shell/agent 环境截断。
- 常用：清点 `jq -r '.data.web[] | "\(.title) | \(.url)"' <file>`；按字段提取 `jq -r '...' <file>`。
- `jq` 缺失时 `brew install jq`。

## Git commit conventions

- Commit message 一律使用英文，格式 `<type>(<scope>): <简短描述>`，禁止中文 commit message。
- 禁止 force push。如需修改已推送的 commit，追加新 commit。

## Dify DSL app conventions

- `input/` holds exported Dify `.yml` DSL files sourced from `https://dify.orangemust.com`.
- `design-agent/output/` holds `.review.md` (findings) and `.spec.md` (confirmed requirement specs); `design-agent/projects/` holds cognition files.
- `dify-dsl-cli flow <file>` and `dify-dsl-cli node show <file> <id>` are the first commands to run when analyzing a DSL.
- After any DSL modification, always validate: `dify-dsl-cli validate <file>`.
- Test runtime behavior via `dify-cli chat send "..." --inputs '{...}'`.

## Auth & secrets

- `.gitignore` hides `acli-agent/login.sh`, `acli-agent/login-confluence.sh`, and `*.state.json` files.
- API keys and tokens live in env vars or global CLI config, never in directory files.
