# Research Agent

独立的深度调研代理。搜索与抓取委托 browser-agent（浏览器模式）或 firecrawl-agent（Firecrawl 模式）执行，LLM 负责搜索决策与报告生成。**零外部依赖**，不需要任何 API Key。

## 触发规则

| 用户输入 | 模式 | 执行文件 |
|---------|------|---------|
| "调研" / "深度调研" / "研究一下" / "deep research" | **深度调研** | `workflows/deep.md` |
| "查一下" / "简单查" / "快速搜索" / "搜一下" | **简单搜索** | `workflows/simple.md` |
| 直接给一个 URL | **页面抓取** | webfetch 直接读 + LLM 总结 |

## 使用入口（首次使用引导，重要）

参考 figma-agent 设计思想：用户说 "use research-agent" / "使用 research-agent" 但**没有指定具体任务**时，不要直接反问"你想研究什么"。先做实时预检（检查机制），再展示三种模式能力并引导用户选择。

### 首次使用判定

- **`research-agent/.env` 不存在或关键项未配置** → 判定为首次使用，走完整引导：展示能力 + 预检 + 逐步配置（一次一步、等用户确认、命令可复制）。
- 配置已完成但缺任务 → 展示能力 + 轻量预检行（已配置项直接标 ✅），引导选模式。
- 用户直接给出明确任务 → 跳过引导直接执行，**懒引导、不打断**；执行前若检测到对应模式依赖缺失，再按需引导。

### 预检命令（展示能力前实时检测，固定用下面这些，不要临时拼命令）

```bash
# .env 是否存在（首次使用判定）
[ -f research-agent/.env ] && echo "env-file: present" || echo "env-file: missing"
# 关键配置是否完整（只输出开关状态，不回显任何 key/敏感值）
grep -q '^USE_FIRECRAWL=' research-agent/.env 2>/dev/null && echo "USE_FIRECRAWL: set" || echo "USE_FIRECRAWL: unset (默认 Firecrawl 模式)"
grep -q '^USE_FEISHU=true' research-agent/.env 2>/dev/null && echo "USE_FEISHU: on (飞书分支)" || echo "USE_FEISHU: off (本地分支)"
# 执行方依赖（USE_FIRECRAWL=true → firecrawl-cli；false → browser-agent）
which firecrawl >/dev/null 2>&1 && echo "firecrawl-cli: present" || echo "firecrawl-cli: missing"
# firecrawl-agent 运行模式（USE_SELF_HOST=true → 自托管；false → 云端；仅输出模式与地址，不回显敏感值）
rg '^USE_SELF_HOST=' firecrawl-agent/.env 2>/dev/null && rg '^FIRECRAWL_SELF_HOST_URL=' firecrawl-agent/.env 2>/dev/null || echo "firecrawl-agent/.env: missing"
# 飞书模式依赖（USE_FEISHU=true 时需要）
which lark-cli >/dev/null 2>&1 && echo "lark-cli: present" || echo "lark-cli: missing"
# 配图依赖（用户需要封面/插图时才用）：生图 + 本地 Word
which bl >/dev/null 2>&1 && echo "aliyun-bl: present" || echo "aliyun-bl: missing"
which officecli >/dev/null 2>&1 && echo "officecli: present" || echo "officecli: missing"
# 报告输出目录（自动创建，避免首次运行报错）
mkdir -p research-agent/output
# 结果解析依赖（firecrawl --json 结果统一用 jq 解析，禁止手写 python 脚本）
which jq >/dev/null 2>&1 && echo "jq: present" || echo "jq: missing (brew install jq)"
```

按此输出填入下方展示模板的预检行。

### 展示模板（终端只渲染 CommonMark，禁止管道表格；用加粗 + 列表）

```
research-agent 能为你做什么

**1. 深度调研** — 知识缺口驱动的多轮搜索，输出结构化调研报告
　示例："调研一下 XX 的技术路线与市场格局"
**2. 简单搜索** — 单轮快速查证，输出要点小结
　示例："查一下 XX 的最新定价"
**3. 页面抓取** — 直接给一个 URL，抓取原文并总结
　示例：粘贴一个链接

---

**当前环境预检**

- 配置文件 research-agent/.env：✅ 已配置 / ❌ 未配置
- 执行方 firecrawl-cli：✅ 就绪 / ❌ 缺失
- 飞书模式 lark-cli：✅ 就绪 / ⬜ 未启用（本地分支）
- 配图 aliyun-bl：✅ 就绪 / ⬜ 不需要生图
- Word officecli：✅ 就绪 / ⬜ 不需要 Word

回复 **1 / 2 / 3**，或直接描述你的任务；预检 ❌ 时回复「配置引导」，逐步完成首次配置（一次一步、等确认、命令可复制）。
```

### 配置引导（缺失即引导，一次一步）

- `.env` 缺失 → 先执行 `cp research-agent/.env.example research-agent/.env` 完成复制，**再询问真正需要用户决策的项**，其余默认值直接可用：
  - **默认值，无需用户确认**（复制即用）：`DEFAULT_DEPTH=3`（最少轮数，信息不足继续追加）、`MAX_RESULTS_PER_QUERY=5`（每轮至少抓 5 篇）、`SEARCH_ENGINE_URL`、`REPORT_OUTPUT_DIR=output`、`SEARCH_DECISION_TEMPERATURE=0.3`、`REPORT_TEMPERATURE=0.7`
  - **需用户选一次**（给默认推荐）：`USE_FIRECRAWL`（推荐 `true` 走 Firecrawl）—— **询问前先检查用户的 firecrawl-agent 配置**：
    1. read `firecrawl-agent/AGENTS.md`，查看 `firecrawl-agent/.env` 的 `USE_SELF_HOST`（自托管 / 云端）与 `FIRECRAWL_SELF_HOST_URL`（API 地址）
    2. 把执行方实际配置展示给用户（如"自托管模式，地址 https://firecrawl.orangemust.com/"），并提示**可以配置**：修改 `firecrawl-agent/.env` 可切换自托管/云端、更换 API 地址，改完立即生效
    3. 用户确认后定案
  - **必须主动询问**：是否启用飞书模式（`USE_FEISHU`）—— 明确问"需要把报告建成飞书文档吗？"；是 → 引导填写 `FEISHU_WIKI_ID`（知识库空间 ID，`lark-cli wiki +space-list` 可查）并校验 `lark-cli` 登录；否 → 保持关闭走本地分支（不填即为关闭）
- firecrawl-cli 缺失（`USE_FIRECRAWL=true` 时）→ read `firecrawl-agent/AGENTS.md`，按其安装/登录引导执行。
- lark-cli 缺失（`USE_FEISHU=true` 时）→ read `feishu-agent/AGENTS.md`「前置检查/安装/配置与登录」引导。
- `bl` 缺失（用户要封面/插图时）→ read `aliyun-agent/AGENTS.md`，按其安装/登录引导执行。
- `officecli` 缺失（本地 Word 分支需要）→ read `doc-agent/AGENTS.md`（`SKILL.md` 为完整能力参考），按其安装引导执行。
- `jq` 缺失 → `brew install jq`（firecrawl `--json` 结果解析必需）。
- 关键原则：**懒引导** — 用户没用到某模式就不引导其依赖；**实时检测** — 每次使用都现场检测，不信任缓存状态；**不预装** — 不主动装 CLI、不改配置，等用户确认。

## 环境配置

复制 `.env.example` 为 `.env` 并按需修改：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DEFAULT_DEPTH` | 3 | 深度调研**最少**搜索轮数（每轮后 LLM 评估是否继续，信息不足则追加搜索，无硬性上限） |
| `MAX_RESULTS_PER_QUERY` | 5 | 每轮搜索**至少**抓取 5 篇文章 |
| `SEARCH_ENGINE_URL` | `https://www.google.com` | 搜索引擎首页 |
| `REPORT_OUTPUT_DIR` | `output` | 报告本地输出目录（相对于 research-agent/，飞书模式下仍保留）；封面/插图直接存本目录、与 `.md`/`.docx` 同级别 |
| `USE_FEISHU` | 空（关闭） | 飞书模式：`true` 时调研报告须在 `FEISHU_WIKI_ID` 知识库内**建立为飞书文档**；空 = 关闭，走本地分支 |
| `FEISHU_WIKI_ID` | 空 | 飞书知识库（空间）ID，`USE_FEISHU=true` 时报告文档的落点 |
| `USE_FIRECRAWL` | `true` | 执行方选择：`true` 委托 firecrawl-agent，`false` 委托 browser-agent |

## 设计理念

采用 **ReAct（Reasoning + Acting）** 模式的深度研究代理：

- **知识缺口驱动** — 不预设搜索计划。每轮搜索后，LLM 审查所有已累积发现 + 已搜索主题，识别知识缺口，动态决定下一步搜索方向。搜索计划在执行过程中逐渐成形，而非提前固化。
- **双层 LLM 分工** — 搜索决策使用低温度（0.3）追求精确性；报告生成使用高温度（0.7）追求创造性和可读性。
- **结构化决策输出** — 每轮搜索决策输出 JSON `{nextSearchTopic, shouldContinue, reasoning}`，配合容错解析，防止 LLM 格式偏差导致流程崩溃。
- **最少轮数保障** — 至少执行 `DEFAULT_DEPTH` 轮搜索；此后 LLM 自主判断信息是否充分（`shouldContinue`），不足则继续追加搜索，**无硬性上限**。

## 工具分工

搜索与抓取**不直接调用底层 CLI**，而是委托对应 agent 目录执行（先 read 其 AGENTS.md，按其快捷命令操作）。

| 执行方 | 用途 | 角色 |
|------|------|------|
| firecrawl-agent | Firecrawl 模式：搜索 + 抓取全文一步完成 | 执行层 |
| browser-agent | 浏览器模式：打开 Google、执行搜索、获取结果列表、兜底抓取 | 执行层 |
| aliyun-agent | 封面/插图生图（`bl image generate`，需用户确认后才生成） | 执行层（配图） |
| feishu-agent | 飞书分支：知识库内新建文档、写入报告全文、插入配图 | 执行层（发布） |
| doc-agent | 本地分支：用 officecli 生成带图 Word（`.docx`） | 执行层（发布） |
| LLM (决策, 0.3) | 审查已有发现、识别知识缺口、决定下一步搜索 | 搜索决策层 |
| LLM (报告, 0.7) | 汇总发现、综合生成结构化调研报告 | 报告生成层 |

## 报告格式

输出文件（本地分支双份，飞书分支保留本地 `.md`）：

- `output/{主题}-{YYYY-MM-DD}.md` — 纯文本报告（标准结构见 `templates/report.md`）
- `output/{主题}-{YYYY-MM-DD}.docx` — 带封面/插图的 Word 版（本地分支）
- 封面/插图图片与文档**同级别**存放：`output/{主题}-封面.png`、`output/{主题}-插图-01.png` …

## 维护

- 修改搜索策略 → 编辑 `workflows/deep.md` 或 `workflows/simple.md`
- 修改输出格式 → 编辑 `templates/report.md`
- 调整默认参数 → 编辑 `.env`
