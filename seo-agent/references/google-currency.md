# Google 时效账本（google-currency）

> **用途**：`references/Google-SEO.md` 是 Google 官方文档的早期汇总，部分内容已过时。本文件记录所有**已知废弃 / 变更 / 纠正**项，审查与建议前**必须先读本文件**，凡与 `../references/Google-SEO.md` 冲突处，以本文件为准。
>
> **最后核对日期：2026-10-09**（全部条目核对自 developers.google.com 官方源；第三方来源单独标注）

---

## 1. 结构化数据废弃账本

### 1.1 FAQPage 富结果（全站退役）

| 事项 | 日期 | 状态 |
|------|------|------|
| FAQ 富结果停止展示（所有站点） | 2026-05-07 | 已退役，取代 2023-08 的"仅政府/健康站"限制 |
| FAQ 文档移除 | 2026-06-12 | 已移除 |
| Search Console 富结果报告 / 富结果测试 / 外观筛选器移除 | 2026-06 | 已移除 |
| Search Console API 支持移除 | 2026-08 | 已移除 |

**审查口径**：
- 已有 FAQPage → 标为 **Info（提示）**，不是 Critical；**不要建议删除**（Google 明确"未使用的结构化数据不会造成问题"）
- 新增 FAQPage → **不得以 Google 富结果为由推荐**；FAQ 内容本身（可见问答）对用户与 AI 抽取仍有价值，但那是内容层价值，不是 schema 层
- 真实用户提交答案的单问题页 → 用 `QAPage`（仍在支持）

来源：[FAQPage 文档弃用通告](https://developers.google.com/search/docs/appearance/structured-data/faqpage)、[Search Console 变更](https://developers.google.com/search/updates)

### 1.2 2025-06-12 批次退役（7 类）

Google 公告 [Simplifying the search results page](https://developers.google.com/search/blog/2025/06/simplifying-search-results)（2025-06-12）退役以下富结果，**不影响排名**：

| 类型 | 退役 | 替代建议 |
|------|------|---------|
| Book Actions | 2025-06 | 富结果弃用横幅 2025-11-05 移除（仍有 Search 功能使用）；不主动推荐 |
| Course Info | 2025-06 | 改用 Course list（Course + ItemList 轮播，仍支持） |
| Claim Review | 2025-06 | 无 Search 替代；Fact Check Explorer 仍使用该标记，事实核查机构可保留 |
| Estimated Salary | 2025-06 | 改用 `JobPosting` + `baseSalary` |
| Learning Video | 2025-06 | 改用通用 `VideoObject` |
| Special Announcement | 2025-06 | 时间限定用 `Event`；否则 `Article` / `WebPage` |
| Vehicle Listing | 2025-06 | 在线售卖用 `Product` |

**工具时间线**：Search Console 富结果报告 / 富结果测试 / 外观筛选器于 **2025-09-09** 移除这 6 类（不含 Book Actions）；Search Console API 支持延续到 **2025-12**。**不要再让用户去这些工具里验证这些类型。**

### 1.3 其他类型状态

| 类型 | 状态 | 日期 | 说明 |
|------|------|------|------|
| Practice Problem | 退役 | 弃用通告 2025-11-05，工具支持 2026-01 移除 | 文档 2026-01-06 移除 |
| Dataset | **未退役** | 澄清 2025-11-05 | 仅用于 Dataset Search（仍在运行），不产生 Google Search 富结果；不要建议删除 |
| HowTo | 富结果移除 | 2023-09 | 词汇表仍有效但无富结果；不以 SERP 收益为由推荐 |
| QAPage | **仍支持** | — | 真实用户问答页（单问题 + 社区回答）；2026-03-24 增加评论线程属性 |
| Education Q&A (Quiz) | 仍支持 | — | `eduQuestionType=Flashcard`；轮播语言 2026 年扩展 |

### 1.4 活跃类型速查（可放心推荐）

Organization / LocalBusiness / SoftwareApplication / WebApplication / Product / Offer / Service / Article / BlogPosting / NewsArticle / Review / AggregateRating / BreadcrumbList / WebSite / WebPage / Person / ContactPage / VideoObject / ImageObject / Event / JobPosting / Course / DiscussionForumPosting / ProductGroup / ProfilePage / QAPage / Quiz

> 格式偏好：**JSON-LD**（Google 明确推荐，优于 Microdata/RDFA）。
> Schema.org 版本参考：v30.1（2026-09-16）。

---

## 2. 指标与功能变更

| 事项 | 日期 | 要点 |
|------|------|------|
| FID → INP | 2024-03-12 起 INP 取代 FID；2024-09-09 CrUX/PSI 移除 FID | **任何报告不得再引用 FID**；INP 是唯一交互指标 |
| CWV 阈值 | 未变 | LCP ≤2.5s / INP ≤200ms / CLS ≤0.1；75 分位；"阈值收紧""CWV 2.0""VSI 指标"均为第三方谣言 |
| Page Experience 报告 | 已移除 | Search Console 中不再有独立报告；通过 CWV 报告 + HTTPS 报告监控 |
| AMP | 2026-07-01 起 Google Search 直接跳发布者托管 AMP URL | 不再建议 AMP Cache/Viewer/SXG 维护；AMP 按普通页面同等要求审查 |
| 移动优先索引 | 2024 完成 | Googlebot Smartphone 为主爬虫；移动版非硬性要求，但内容/元数据对等是最高价值检查项 |
| 动态渲染 | — | Google 定性为 "workaround, not recommended"；按技术债对待，推荐 SSR/SSG |
| JS SEO（2025-12 更新） | — | ①canonical 原始 HTML 与 JS 注入不一致时 Google 可能任选其一；②raw HTML 里的 noindex 即使被 JS 移除也**可能仍被采信**；③非 200 状态码页面 Google **不渲染 JS**；④JS 注入的结构化数据（尤其商品）可能延迟处理 → 关键 SEO 元素必须在**初始 HTML** 中输出 |
| Googlebot 抓取上限 | 长期不变 | HTML 前 **2MB**、PDF 前 64MB（未压缩）；内联 base64 图片/超大内联 CSS/JS 会把关键内容与 JSON-LD 挤出索引 |
| 抓取速率 | 自动调节 | 无手动抓取速率控制（旧 Search Console 设置 2024-01 移除） |
| 反向劫持（Back-button hijacking） | 2026-04-13 列入垃圾政策；2026-06-15 起执法 | `history.pushState/replaceState` 劫持返回键（含第三方脚本注入）→ 按 **Critical** 处理 |
| Google 爬虫 IP 文件 | 2025-11-20 迁移 | 移至 `developers.google.com/crawling`；`googlebot.json` 更名为 `common-crawlers.json` |

---

## 3. AI 搜索 / GEO 官方立场（重要）

**主源**：[Google AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)（2026-05-15 发布，2026-07-10 更新）、[AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)

Google 官方明确（"依然还是 SEO"）：

1. **AEO/GEO 不是新学科**：AI Overviews / AI Mode 基于同一套核心排名与质量系统；RAG grounding + query fan-out 是叠加技术。
2. **资格底线**：页面须已编入索引 + 有资格展示摘要；站点须在 Search Console 的生成式 AI 设置中"包含"（默认包含）。
3. **官方辟谣清单**（不要向用户推销这些"技巧"）：
   - ❌ 不需要 `llms.txt` 或 AI 专用标记文件（Google Search **忽略**它们）
   - ❌ 不需要为 AI "chunk" 切块内容
   - ❌ 不需要为 AI 重写特定句式或长尾变体
   - ❌ 不要追求不真实的"提及"（inauthentic mentions）
   - ❌ 不要为 AI 功能过度投资结构化数据
4. **官方认为真正重要的**：独特、非商品化、第一手经验内容（"Who / How / Why" 检验）。
5. **AI 内容政策**：生成式 AI 内容只要符合 Search Essentials 即可；用 AI 规模化生产低价值页面属垃圾政策（QRG §4.6.5/4.6.6）。电商：AI 生成商品图必须带 IPTC `DigitalSourceType: TrainedAlgorithmicMedia` 元数据；AI 生成的商品标题/描述必须在 feed 中单独标注。

**`llms.txt` 证据姿态**（claude-seo 蒸馏，2026-09-23 核对）：

- Google Search 忽略 llms.txt（Google 官方文档，2026-06-15 起）；Mueller 称其为 "dead end"
- 独立证据：SE Ranking 300k 域名研究（2025-11）AI 引用 Top50 域名中仅 1 个有 llms.txt；OtterlyAI 服务器日志 0.1% AI bot 流量指向 llms.txt
- **例外价值**：AI 编程工具（Cursor/Claude Code 等）会消费开发者文档站的 llms.txt（Mintlify 自动生成）
- 审查口径：可报告存在性（完整性检查），**不得赋予 Google 排名/引用权重**；非开发者站生成成本为零、纯防御性可选

**品牌提及 vs 外链**（第三方研究，引用需带来源）：Ahrefs 75k 品牌研究（2025-12-12）显示品牌提及与 AI 可见性相关性约为外链的 3 倍；YouTube/Reddit/Wikipedia 提及相关性高，Domain Rating 弱（~0.266）。**平台间重合低**：仅 11% 域名同时被 ChatGPT 与 Google AI Overviews 引用同一查询。

---

## 4. AI 爬虫管理（robots.txt 口径）

| 爬虫 | 归属 | 用途 | 受 robots.txt 约束 |
|------|------|------|------|
| GPTBot | OpenAI | 模型训练（**非** ChatGPT Search） | 是 |
| OAI-SearchBot | OpenAI | ChatGPT Search 可引用性（决定引用的爬虫） | 是 |
| ChatGPT-User | OpenAI | 用户触发的实时浏览 | 基本忽略 |
| ClaudeBot | Anthropic | 模型训练（**非**搜索功能） | 是 |
| Claude-SearchBot | Anthropic | Claude 搜索结果可引用性 | 是 |
| Claude-User | Anthropic | 用户触发浏览 | 是（Anthropic 三爬虫均遵守） |
| PerplexityBot | Perplexity | Perplexity 搜索索引 | 是 |
| Perplexity-User | Perplexity | 用户触发抓取 | 基本忽略 |
| Google-Extended | Google | Gemini/Vertex 训练与 grounding（**不影响** Google Search 收录与排名） | 是 |
| Google-Agent / Google-GeminiNotebook / Google Messages | Google | 用户触发抓取 | **否**（robots.txt 无法阻止；需服务端访问控制） |
| CCBot | Common Crawl | 开放数据集训练 | 是 |
| Bytespider | ByteDance | 豆包/TikTok AI | 是 |
| Applebot-Extended | Apple | Apple Intelligence 训练 opt-out（不影响 Siri/Spotlight/Safari） | 是（本身不抓取，仅标注） |

**审查口径**：判断"可引用性"看 `OAI-SearchBot` / `Claude-SearchBot` / `PerplexityBot` 是否被屏蔽；判断"训练用途"才看 `GPTBot` / `ClaudeBot` / `Google-Extended`。屏蔽 AI 搜索爬虫 = 从该引擎的答案中移除站点，不要承诺开通后的流量。

---

## 5. 维护指引

- **每季度**（或用户报告异常时）核对：本文件顶部日期 + 以下源
  - https://developers.google.com/search/updates（官方变更日志，最高优先级）
  - https://developers.google.com/search/blog
  - https://developer.chrome.com/docs/crux/release-notes（CWV/CrUX 数据）
- 新增废弃项时：更新 §1/§2 表格 + 在相关 references 中同步口径
- 第三方论断（品牌提及相关性、平台统计、llms.txt 研究）必须带来源与日期，且与 Google 官方冲突时以官方为准
- 与 `../references/Google-SEO.md` 的冲突处理：**本文件优先**；Google-SEO.md 保持原样作为历史基线，不做逐条修改
