# 深度调研流程

ReAct 模式的深度研究代理：LLM 驱动搜索决策，每轮根据已累积发现动态推理知识缺口，逐轮深化直到信息充分。适合需要综合分析、对比多个来源的复杂课题。

## 设计原则

- **知识缺口驱动** — 不预设搜索计划，每轮审查全量 findings+topics 后动态决定下一步
- **双层 LLM 分工** — 搜索决策 LLM（精确、低温度 0.3） + 报告生成 LLM（创造性、高温度 0.7）
- **结构化决策输出** — 每轮 LLM 输出 JSON，容错解析，防止格式偏差导致流程中断
- **防重复搜索** — 每轮决策前显式审查已搜主题，禁止重复
- **流式进度反馈** — 每轮结束即时告知用户进度和新发现
- **最少轮数保障** — 至少执行 `DEFAULT_DEPTH`（默认 3）轮搜索；此后 LLM 自主判断 `shouldContinue`，信息不足则继续追加搜索，**无硬性上限**

## 执行流程

### Phase 0: 入场准备
1. 读取用户提供的调研主题
2. **检查 `.env`**：缺失 → 按 `AGENTS.md`「配置引导」执行 `cp research-agent/.env.example research-agent/.env`，并**主动询问用户是否启用飞书模式**（`USE_FEISHU`，是 → 填 `FEISHU_WIKI_ID`）；其余变量默认值直接可用，不逐项确认
3. 读取 `DEFAULT_DEPTH` 环境变量（默认 3）作为**最少搜索轮数**（不足该轮数不允许终止）
4. 初始化状态：
   - `findings: []` — 所有轮次的发现（完整文本，不截断）
   - `topics: []` — 已搜索的关键词
   - `urls: []` — 已抓取的 URL
   - `round: 0` — 当前轮次计数

### Phase 1: 首轮搜索启动

直接进入搜索，不预先拆解维度（维度应在搜索过程中动态生成和调整）。

#### 1.1 生成首轮搜索词
- LLM 基于用户问题，生成 2-3 个初始搜索词
- 规则：覆盖核心概念的不同表述，互为补充而非重复
- 搜索词加入 `topics[]`

#### 1.2 执行搜索

执行方由 `USE_FIRECRAWL` 配置控制。**不直接调用底层 CLI**：先 read 对应 agent 的 AGENTS.md，按其快捷命令执行。

**若 `USE_FIRECRAWL=true`（Firecrawl 模式）：**
委托 firecrawl-agent 执行：read `firecrawl-agent/AGENTS.md`，按「Search（网页搜索）」快捷命令一条完成搜索 + 抓取全文（带 `--scrape --scrape-formats markdown`，`--limit $MAX_RESULTS_PER_QUERY`，`--json`）。每轮**至少抓取 `MAX_RESULTS_PER_QUERY`（默认 5）篇**。从结果中提取每条结果的标题、URL、markdown 正文，将正文追加到 `findings[]`，将 URL 追加到 `urls[]`，`round += 1`。直接进入 Phase 2。
- **结果解析统一用 `jq`，禁止手写 python 脚本**（大输出用 `-o <文件>` 落盘再解析）：
  ```bash
  firecrawl search "<关键词>" --limit 5 --scrape --scrape-formats markdown --json -o /tmp/fc_round1.json
  # 清点结果（标题 | URL | 正文长度）
  jq -r '.data.web[] | "\(.title) | \(.url) | md=\(.markdown // "" | length)"' /tmp/fc_round1.json
  # 落盘全文供报告阶段细读
  jq -r '.data.web[] | "===== TITLE: \(.title)\nURL: \(.url)\n\n\(.markdown // "")"' /tmp/fc_round1.json > /tmp/fc_findings/round1.txt
  ```
- **抓取兜底**：若某条结果正文为空（scrape 被反爬拦截或页面加载失败），用 webfetch 抓取该 URL 作为替代；webfetch 也失败则委托 browser-agent goto + snapshot 兜底。

**若 `USE_FIRECRAWL=false`（浏览器模式）：**
委托 browser-agent 执行：read `browser-agent/AGENTS.md`，按其工作流打开 Google、输入关键词、执行搜索并 snapshot 结果列表。

**反爬虫处理**：如果页面 URL 变为 `/sorry/index` 或出现 reCAPTCHA（"I'm not a robot"、"Select all images"），则暂停并提示用户手动在浏览器中完成验证。用户告知"OK"/"好了"后，用 snapshot 确认搜索结果页已加载，继续流程。

#### 1.3 提取 & 抓取（仅浏览器模式）
- 从 snapshot 提取结果：标题、URL、摘要
- 用 webfetch 抓取前 `MAX_RESULTS_PER_QUERY`（默认 5，至少 5 篇）篇全文
- **webfetch 回退**：如果 webfetch 无法访问某 URL（返回 Transport error / 403 / 空内容），则委托 browser-agent 导航到该 URL 并 snapshot 获取页面文本内容作为替代
- 将本轮发现追加到 `findings[]`
- 将抓取的 URL 追加到 `urls[]`
- `round += 1`

### Phase 2: 动态迭代搜索（ReAct 循环）

每轮执行以下步骤，直到终止条件满足：

#### 2.1 搜索决策（LLM — 低温度 0.3）

将以下上下文完整提供给 LLM：
```
你是一个搜索决策代理。你需要基于已有的调研发现，分析知识缺口，决定下一步搜索方向。

## 当前状态
- 调研主题：{用户问题}
- 当前轮次：{round}（最少执行 {DEFAULT_DEPTH} 轮，已满后可自行延长）
- 已有发现（共 {N} 条，全文）：
{findings[] 全量内容，不截断}
- 已搜索主题：
{topics[]}

## 分析要求
1. 审查已有发现，识别哪些维度已充分覆盖
2. 识别知识缺口：哪些重要方面还没涉及？信息是否矛盾？数据是否过时？缺少反面观点？缺少实践案例？
3. 判断：基于已有发现是否能生成全面、高质量的报告？

## 输出要求
只输出一行 JSON，不要添加解释、代码块标记（```json```）或额外文本。

{"nextSearchTopic": "下一步搜索关键词", "shouldContinue": true/false, "reasoning": "一句话说明缺口"}

规则：
- shouldContinue 为 true 时，nextSearchTopic 必须与已搜索主题均不同（防重复）
- nextSearchTopic 需要具体、有针对性，不是宽泛词
- **未满最少轮数（round < DEFAULT_DEPTH）时，shouldContinue 必须为 true**（至少完成 DEFAULT_DEPTH 轮，不允许提前终止）
- 达到最少轮数（round >= DEFAULT_DEPTH）后，由你自主判断：信息充分 → shouldContinue=false、nextSearchTopic=null；信息不足 → 继续追加搜索，**轮数可超过 DEFAULT_DEPTH，无硬性上限**
```

#### 2.2 解析决策 JSON

稳健解析 LLM 输出（参考 Dify app 解析逻辑）：
```
1. 去除所有代码块标记（```json, ```）
2. 在文本中提取第一个完整 JSON 对象
3. json.loads 解析
4. 容错：解析失败 → 若 round < DEFAULT_DEPTH 则视为需要继续（强制续搜一轮，
   取 LLM 缺口分析中最新的未搜方向；无则用"{主题} 最新进展/实践案例/反面观点"兜底）；
   若 round >= DEFAULT_DEPTH 则 shouldContinue=false
```

提取 `nextSearchTopic` 和 `shouldContinue`。

#### 2.3 分支判断

- **需要继续（shouldContinue == true，或 round < DEFAULT_DEPTH 的强制续搜）**：
  - 用 nextSearchTopic 执行搜索（复用 Step 1.2-1.3 的搜索逻辑，含 Firecrawl/浏览器分支）
  - `topics.push(nextSearchTopic)`
  - 将本轮发现追加到 `findings[]`
  - `round += 1`
  - **向用户流式反馈进度**："第 {round} 轮搜索完成（最少 {DEFAULT_DEPTH} 轮）：{nextSearchTopic} — {本轮的简要发现}"
  - **回到 2.1 进入下一轮决策（循环），直至命中终止条件**

- **shouldContinue == false 且 round >= DEFAULT_DEPTH**：
  - 进入 Phase 3

### Phase 3: 综合报告（LLM — 高温度 0.7）

1. LLM 汇总所有 `findings`（全量上下文）
2. 按 `templates/report.md` 格式生成结构化报告
3. 写入 `$REPORT_OUTPUT_DIR/{主题}-{YYYY-MM-DD}.md`
4. 输出最终统计和核心发现摘要："共 {N} 轮搜索、{M} 个来源，报告已保存至 $REPORT_OUTPUT_DIR/{主题}-{YYYY-MM-DD}.md"
5. **等待用户审核**：输出报告后暂停，询问用户是否需要修改或补充。用户确认"OK"/"没问题"后，进入 Phase 4 质量检查。

### Phase 4: 质量检查

- [ ] 报告包含所有必需章节（概述、核心发现、详细分析、结论、来源）
- [ ] 每个核心发现有一句话总结 + 支撑数据
- [ ] 来源链接完整可访问
- [ ] 覆盖多个维度/立场，无明显知识缺口
- [ ] 防重复有效：topics 列表无重复搜索词

### Phase 5: 报告发布（双分支 + 配图，按需）

#### 5.0 确认发布方式

报告生成并通过用户审核后，**主动询问发布方式**（不能只看配置静默决定）：
- **飞书文档**：需要 `USE_FEISHU=true` 且 `FEISHU_WIKI_ID` 已填；若未启用但用户选择飞书 → 现场引导填写配置再继续
- **本地 Word + md 双份**：`USE_FEISHU` 未启用时的默认分支
- 用户确认后进入 5.1

#### 5.1 询问配图需求

报告生成并通过用户审核后，询问是否需要配图（**AI 只给建议，不自动生图**）：
- **封面图**（文档顶部 1 张）+ **章节插图**（对应章节后）
- LLM 基于报告全文生成「配图清单」：封面 + 各章节候选插图，每张标注插入位置 + 生图 prompt 建议
- 用户**逐项**保留 / 删除 / 修改 prompt / 调整数量与位置 → 确认后才进入生图
- 用户选择「不要」→ **跳过 5.2 生图与插图**，仍执行 5.3 发布（纯文本版）

#### 5.2 生图（委托 aliyun-agent）

- read `aliyun-agent/AGENTS.md`；前置检查 `which bl` + `bl auth status`
- `bl image generate --prompt "<用户确认的prompt>" --n 1 --watermark false --model z-image-turbo --out-dir "$REPORT_OUTPUT_DIR"`
- **图片与文档同级别存放**，命名 `{主题}-封面.png`、`{主题}-插图-01.png`（按序递增）
- 封面优先 16:9（模型不支持则 1024×1024）；尺寸不确定时 `bl model list --model z-image-turbo --enrich` 查询
- 限流/失败 → 换模型重试一次；仍失败 → 跳过该图并告知用户

#### 5.3 发布分支（按 `USE_FEISHU` 判定）

**分支 A：`USE_FEISHU=true` → 飞书文档**
- read `feishu-agent/AGENTS.md`，按快捷命令在 `FEISHU_WIKI_ID` 知识库内**新建文档**（`lark-cli wiki +node-create --space-id <FEISHU_WIKI_ID> --title "…"`，记录返回的 `obj_token` 作 doc id），再用 `docs +create` / `docs +update --command append` 写入报告全文（本地 `output/` 的 `.md` 仍保留）
- 插图属复杂操作 → 允许读 `lark-doc` skill（`lark-doc-media-insert.md` / `lark-doc-xml.md`）：`docs +media-insert --file <图> --align center --caption "…"` 默认插文档末尾，再用 `docs +update` 的 `block_move_after` / `block_insert_after` 定位（封面 → 标题 block 之后，插图 → 对应章节末）
- 插入后 `docs +fetch` 抽查顺序与显示
- 反馈：飞书文档链接 + 配图清单（每张图位置/内容）

**飞书发布踩坑记录（已实测，避免重新摸索）：**
1. **`--content @file` 只接受相对路径**：`@/tmp/xxx.md` 报 `invalid file path`——先 `cd` 到文件所在目录，用 `@./xxx.md`
2. **markdown 写入 `$` 必须转义**：`$0.75` 之类会触发数学公式渲染——写入前 `sed 's/\$/\\$/g'` 预处理（`\$`）
3. **block 定位完整链路**：
   - `docs +fetch --api-version v2 --doc <doc_id> --detail with-ids` 输出含各标题的 `block_id`（如 `<h1 id="doxcn…">`）
   - 把图片 block（`media-insert` 返回的 `block_id`）移动到目标标题之后：`docs +update --doc <doc_id> --command block_move_after --block-id <目标标题id> --src-block-ids <图片id>`
   - 验证：`docs +fetch --detail with-ids` 后按序检查 `<h[1-4]>` 与 `<img>` 相邻关系（标题后紧跟对应图）

**分支 B：`USE_FEISHU` 非 true → 本地 output/（Word + md 双份，默认直接生成不询问）**
- `.md` 纯文本报告已写入 `$REPORT_OUTPUT_DIR/{主题}-{date}.md`（保留）
- read `doc-agent/AGENTS.md`（`SKILL.md` 完整参考），用 `officecli` 生成带图 Word `$REPORT_OUTPUT_DIR/{主题}-{date}.docx`：
  - 每次操作前先 `officecli help <format> <element>` 确认语法
  - `officecli create` 建文档 → 按章节 `add /body --type paragraph` 写正文 → `--after find:X` 文本锚点插入图片（封面放开头）→ `officecli validate <file>` 校验
- 反馈：本地文件路径（`.md` + `.docx` + 图片）

#### 5.4 后补配图

两分支均支持随时补图：用户后续提出 → 回到 5.1 询问 → 5.2 生图 → 5.3 对应分支插入（文档已存在时**直接插入，不重建**；询问插入位置）。

## 终止条件（优先级从高到低）

1. **已满最少轮数（round >= DEFAULT_DEPTH）且 LLM 判断信息充分**（`shouldContinue=false`）→ **主要终止条件**
2. 搜索决策 JSON 解析失败 → 已满最少轮数时终止，未满则强制续搜（容错，见 2.2）
3. 用户手动中断 → 立即终止

> 说明：`DEFAULT_DEPTH` 是**最少轮数下限**，不是上限；LLM 判断信息不足时允许在达到 `DEFAULT_DEPTH` 后继续追加搜索，直到信息充分为止。

## 注意事项
- 每次浏览器操作前先 snapshot 确认页面状态
- Google 可能弹出 cookie 弹窗，先用 snapshot 检查并处理
- 搜索关键词使用 Google 高级搜索语法时需转义
- 报告中的引用必须附带来源 URL
- 搜索决策 LLM 的 instruction 使用低温度（0.3），报告生成 LLM 使用高温度（0.7）
- findings 必须全量传给搜索决策 LLM，不要截断 — 信息越完整决策越准
- 遇到 reCAPTCHA 反爬虫时，不要自行尝试绕过，等待用户手动完成验证后继续
- **禁止使用 Google AI Overview 内容**：不引用、不采信搜索结果页中的 "AI Overview" 归纳，只使用实际抓取到的文章原文
- 搜索结果的 snippet 摘要（非 AI Overview）可作为初步筛选参考，但具体数据和事实必须以 webfetch/browser-agent 抓取的原文为准
- webfetch 无法访问的链接，委托 browser-agent goto + snapshot 兜底抓取
- 报告生成后必须等待用户审核通过才算完成，不要自动跳过
- 每轮搜索至少抓取 `MAX_RESULTS_PER_QUERY`（默认 5）篇全文，结果不足 5 条时才允许少抓
- 配图必须逐项确认后才生成（AI 只给建议，不自动生图）；生图委托 aliyun-agent、插图分别委托 feishu-agent / doc-agent，均先 read 其 AGENTS.md
- 图片与报告文档**同级别**存放于 `REPORT_OUTPUT_DIR`，命名 `{主题}-封面.png` / `{主题}-插图-NN.png`
- 飞书发布/配图仅为按需操作，需用户主动确认
