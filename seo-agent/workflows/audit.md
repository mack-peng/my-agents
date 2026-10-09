# ① SEO 审查（audit）

**这条工作流是什么**：对线上站点 / 本地前端项目做全维度 SEO 审查，输出带证据、评分、分级发现与验证方式的审查报告。

**分几步**：6 步（范围界定 → 线上抓取 → 代码扫描 → 六维评估 → 评分分级 → 报告交付）

**每步做什么**：见下文逐步说明。核心原则：**先证据后结论**——每个判断必须有「观察 / 官方 / 标准 / 研究 / 推断 / 缺口」标记。

**哪几步停下来等你**：第 1 步范围确认（信息缺失时）、第 6 步报告交付后 sign-off。中途不打断。

---

## 输入

| 项 | 必需 | 说明 |
|----|------|------|
| 目标 | ✅ | URL / 本地项目绝对路径 / 两者（推荐两者，代码+线上互证） |
| 范围 | 单页或站点抽样 | 站点抽样默认：首页 + 1 个代表性一级页 + 1 个代表性二级页（说明选择依据） |
| 页面目的 | 建议 | 首页/产品页/文章页/FAQ/落地页/文档页…（影响评估侧重与 schema 选型） |
| 目标市场 | 建议 | Google / 百度 / AI 搜索（影响检查项与平台适配建议） |

**信息缺失规则**：一次最多问 2 个问题；能自行推断的（栈、页面目的）先推断并声明。

## 前置：读知识库

1. `references/google-currency.md` —— **必读**，废弃项不进入建议
2. `references/technical-seo-checklist.md` —— 六维检查项
3. `references/schema-by-page-purpose.md` —— schema 评估对照
4. `references/geo-citability.md` —— GEO 维度方法
5. `../references/Google-SEO.md` —— Google 官方基线（与 currency 冲突时以 currency 为准）

---

## 步骤

### 1. 范围界定

- 确认目标与范围（见上）；站点抽样要声明**选择依据**（模板代表性、流量假设）
- 用户给的是本地项目 → 先确认线上对应 URL（源码与线上不一致时以线上为准，代码用于定位修改点）
- 页面目的判断：看 URL、导航、内容形态；判不准列入开头澄清问题

### 2. 线上抓取（委托 firecrawl-agent / browser-agent）

先 `read firecrawl-agent/AGENTS.md` 确认运行模式（自托管只允许 scrape/crawl/map/search/parse）。

```bash
# 站点 URL 发现（样本选择依据）
firecrawl map <url> --limit 200 --json -o /tmp/opencode/seo-map.json
jq -r '.data.links[].url' /tmp/opencode/seo-map.json | head -50

# 样本页抓取
firecrawl scrape <url> --only-main-content -o /tmp/opencode/seo-home.md   # 正文（内容检查）
curl -s <url> -o /tmp/opencode/seo-home.html                              # 原始 HTML（head 检查，见下方备注）

# robots / sitemap
curl -s <origin>/robots.txt
curl -s <origin>/sitemap.xml | head -100
```

> ⚠️ **工具备注（冒烟验证发现）**：自托管 firecrawl 的 `scrape --html` 返回的是**清洗后 HTML（head/scripts 被剥离）**——title/meta/canonical/JSON-LD 分析**不可**用它，必须用 `curl` 原始 HTML 或 browser-agent 渲染 DOM。`firecrawl map --json` 输出结构为 `{"success":true,"data":{"links":[...]}}`，用 `jq '.data.links[].url'` 解析。
> ⚠️ **head 提取要用属性宽容匹配**：React 站常见 `<title data-rh="true">`、`<meta data-rh="true" ...>`，正则/检索必须允许标签属性。

- **JS 重页面 / 登录态页面 / 需要渲染后 DOM 对比** → 委托 browser-agent（`read browser-agent/AGENTS.md`），渲染后取 `snapshot` 或 `run-code` 提取 head 与正文
- **原始 HTML vs 渲染 DOM 对比**：核心判断 CSR/SSR——初始 HTML 是否含主内容、title、canonical、JSON-LD
- **SERP/排名相关**（如用户要求）→ browser-agent 搜索，或 firecrawl search；注明"第三方观测，非官方数据"
- 大输出一律 `-o` 落盘 + `jq`/grep 解析，不堆在对话里

**抓取产出清单**（落到 `/tmp/opencode/seo-audit-<date>/`）：
- 样本页原始 HTML + 正文 markdown
- robots.txt / sitemap.xml
- head 要素提取（title/meta/canonical/hreflang/robots/JSON-LD/OG）
- 渲染对比结论（如适用）

### 2b. 域名与基础设施检查（冒烟验证沉淀）

站点级问题（域名/Nginx/证书）往往影响面最大，固定执行：

```bash
# DNS 记录：多源 DoH（避免单点结论），apex 与 www 都查
for prov in "https://dns.google/resolve" "https://dns.alidns.com/resolve" "https://doh.pub/dns-query"; do
  curl -s -H "accept: application/dns-json" "$prov?name=<domain>&type=A" | jq -c '{Status,Answer}'
done
curl -s "https://api.hackertarget.com/dnslookup/?q=<domain>" | grep -E '^A|^AAAA|^CNAME'   # 第三方服务器端解析

# 软 404：随机不存在路径应返回 404/410 而不是 200
curl -s -o /dev/null -w "%{http_code}\n" "https://<domain>/nonexistent-$(date +%s)"

# HTTP→HTTPS 跳转（两 host 都查）
curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" "http://<domain>/"

# 证书 SAN 覆盖（apex/www 都要）
openssl s_client -connect <origin-ip>:443 -servername <host> </dev/null 2>/dev/null | openssl x509 -noout -ext subjectAltName
```

- **本地 DNS 被代理劫持（fake-ip，如 Clash）时**：系统解析结果不可信，DoH（HTTPS 通道）结果可信；验证 origin 行为用 `curl --resolve <host>:443:<origin-ip> https://<host>/` 绕过 DNS 直连
- 结论落对应检查项：DNS/跳转 → A7；软 404 → A1；证书与 HTTP 强制跳转 → B9
- **修复验证**：用户修复后（如补 DNS 记录）用同一组命令复验，并在同一报告中把条目更新为「✅ 已修复 + 验证记录」（复审约定见 `templates/audit-report.md`）

### 3. 本地代码扫描（有项目路径时）

1. 读 `package.json` / 构建配置 → 识别栈（对照 `frontend-fix-patterns.md` §1 速查表）
2. 定位：head 管理入口、路由表、渲染模式（SSR/SSG/CSR）、sitemap/robots 生成、JSON-LD 组件、图片组件、i18n 配置
3. 项目有 `.codegraph/` → 用 `codegraph_explore` 定位相关符号（head 组件、layout、路由、SEO 工具函数）
4. 记录**文件:行号**级别的证据（供 fix-design 与 F 维评估使用）

### 4. 六维评估

按 `technical-seo-checklist.md` 逐项评估，记录「通过 / 警告 / 失败 / 未测 + 证据」：

| 维度 | 权重 | 内容 |
|------|------|------|
| A 可抓取与索引 | 25% | robots/sitemap/canonical/noindex/初始 HTML 内容/2MB 上限 |
| B 页面要素 | 20% | title/description/H 结构/URL/内链/图片/移动对等/插页/反向劫持 |
| C 结构化数据 | 15% | 存在/匹配/有效/一致性/实体组网/废弃类型/JS 注入 |
| D 性能与 CWV | 15% | LCP/INP/CLS（有 PSI 数据用 field，否则 lab 并声明） |
| E GEO 可引用性 | 15% | 五链路 + 五维（`geo-citability.md`） |
| F 代码层风险 | 10% | CSR/head 硬编码/路由/sitemap 维护/懒加载/hreflang |

**未测维度写"未测"，不给分。** 无法前台判断的标「缺口」。

### 5. 评分与分级

- 各维度得分 = 该维度通过检查项 / 已测检查项（按严重度调整）
- 总分 = 加权求和 → 等级（A ≥90 / B 75-89 / C 60-74 / D <60）；报告中声明**这是沟通工具，不是 Google 内部信号**
- 发现分级：**P0 严重**（阻断收录/渲染）/ **P1 警告**（显著损失）/ **P2 优化**（增量）
- **每条发现四要素**：证据（URL 或 `文件:行号`）、影响、修复建议、验证方式（可证伪）
- 高杠杆优先：先写"当前最高杠杆约束"（通常是单一技术缺陷卡住一切）

### 6. 报告交付

- 按 `templates/audit-report.md` 输出到 `output/{YYYY-MM-DD}-{domain或项目名}-seo-audit.md`
- 报告结尾给"建议下一步"：进入 `② 修改设计`（推荐）/ 看页面目的方案 / 跑 AI 可见性
- **Sign-off**：交付后停下，等用户确认

---

## 输出约定

- 报告语言中文；表格 ≤5 列（超宽拆表或转列表）；来源用短链接文字
- 每个 P0/P1 发现至少对应一条代码层或 CMS 字段层的动作（无代码访问时给"字段/配置级"动作）
- 报告保留"无法判断项"章节（日志/CMS/平台数据缺口），不猜测填充

## 与其他工作流的关系

```
① audit ──确认后──▶ ② fix-design（文件级修改设计）
   │
   ├─ 页面目的不明确 ──▶ ③ page-blueprint（先定结构再改）
   └─ 用户要 AI 平台表现 ──▶ ④ ai-visibility（需问题集，可先走 ⑤）
```

## Hard Stop

- 审查报告未完成前不进入修改设计
- 数据缺失时不用猜测填补；抓取失败记录阻塞原因（URL、报错、已尝试方式）
- 不修改目标项目任何文件
