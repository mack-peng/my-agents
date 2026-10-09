# 技术 SEO 与页面要素审查清单

> 来源：蒸馏自 claude-seo `seo-technical`（MIT）+ yao-geo-skills `page-audit-method`（MIT）+ Google Search Central 官方基线。核对日期 2026-10-09。
> 使用方式：`workflows/audit.md` 第 4 步按本清单逐维评估，每项记录「通过 / 警告 / 失败 / 未测」+ 证据（URL 或 `文件:行号`）。
> 时效性前提：先读 `google-currency.md`，废弃项不进入建议。

---

## A. 可抓取与索引（Crawlability & Indexability）

| # | 检查项 | 通过标准 | 失败影响 |
|---|--------|---------|---------|
| A1 | HTTP 状态 | 目标页 200；**不存在路径返回 404/410**（软 404：未知 URL 用 200 兜底 HTML 会导致索引膨胀）；错误页不承载 SEO 内容 | 非 200 页面 Google 不渲染 JS |
| A2 | robots.txt | 存在、有效、不误屏蔽关键资源/CSS/JS；5xx 视为"全部禁止" | 整站或资源级抓取失败 |
| A3 | sitemap.xml | 存在、有效、只含可索引 URL；robots.txt 中声明 | 发现效率低 |
| A4 | noindex / meta robots | 有意识使用；raw HTML 与 JS 渲染后一致 | JS 移除 noindex 无效（raw HTML 优先） |
| A5 | canonical | 自引用、无冲突、raw HTML 与 JS 注入一致、absolute URL | 重复内容、收录分裂 |
| A6 | 抓取深度 | 重要页面 ≤3 次点击可达首页 | 深层页收录差 |
| A7 | 域名与跳转 | www/apex 解析一致（apex 有 A/AAAA/CNAME，多源 DoH 验证）；80 端口 301 → HTTPS；apex↔www 归一（301 或 canonical）；参数 URL、尾斜杠一致；近重复页面有 canonical 或合并 | 索引膨胀、裸域名失效 |
| A8 | 分页 | 可抓取的 `<a href>`；每页自引用 canonical；load-more/无限滚动背后有分页 URL | 列表页内容不可发现 |
| A9 | hreflang | 多语言/多地区站：双向、自引用、x-default 正确 | 国际站错误语言展示 |
| A10 | 初始 HTML 含核心内容 | 主内容、title、meta、canonical、JSON-LD 在服务端输出的 HTML 中（不依赖 JS 注入） | AI 爬虫多数不执行 JS；JS 注入的结构化数据延迟处理 |
| A11 | Googlebot fetch 上限 | 关键内容 + JSON-LD 在前 2MB HTML 内（警惕内联 base64 图、超大内联 CSS/JS） | 内容被挤出索引 |
| A12 | IndexNow（可选） | 非 Google 引擎（Bing/Yandex/Naver）快速收录 | 次要 |

## B. 页面要素（On-Page）

| # | 检查项 | 通过标准 |
|---|--------|---------|
| B1 | `<title>` | 每页唯一、描述性、无堆砌、含品牌（首或尾+分隔符）；与 h1 一致但不重复 |
| B2 | meta description | 每页唯一、150-160 字符、含意图词、有行动号召（注意：不影响排名，影响点击） |
| B3 | H 结构 | 单 h1；h1→h2→h3 层级不乱跳；问题式标题加分（匹配查询模式） |
| B4 | URL | 描述性、连字符、无参数（内容页）、>100 字符标记、层级合理 |
| B5 | 内链与锚文本 | 重要页面内链充分；锚文本描述性；面包屑可见 |
| B6 | 图片 | 有意义的文件名 + alt；宽高属性；现代格式（WebP/AVIF）；首屏 LCP 图不作懒加载 |
| B7 | 移动端内容对等 | 移动版含等价主内容、等价 meta/结构化数据；主内容不藏在交互后 |
| B8 | 干扰性插页 | 无全屏插页/强制跳转；广告密度不过分 |
| B9 | 安全 | HTTPS 全站、无混合内容；**80 端口强制 301 → HTTPS**；证书 SAN 覆盖 apex 与 www；安全头（CSP/HSTS 等，次要信号） |
| B10 | 反向劫持 | 无 `pushState` 劫持返回键（含第三方脚本注入）→ Critical |

## C. 结构化数据（Structured Data）

| # | 检查项 | 通过标准 |
|---|--------|---------|
| C1 | 存在性与格式 | 主页/关键模板页有 JSON-LD（首选） |
| C2 | 类型-页面匹配 | 类型与页面目的匹配（见 `schema-by-page-purpose.md`） |
| C3 | 有效性 | `@context` 为 https://schema.org；必需属性齐；日期 ISO 8601；无占位符；URL 绝对 |
| C4 | 内容一致性 | schema 与可见正文一致；不声明正文没有的事实（不编造评分/价格/资质） |
| C5 | 实体关系 | 多 block 时用稳定 `@id` 关联（Organization ↔ WebSite ↔ WebPage ↔ Article） |
| C6 | 废弃类型 | 无 HowTo/ClaimReview/EstimatedSalary/LearningVideo/SpecialAnnouncement/VehicleListing/CourseInfo/PracticeProblem；FAQPage 只标 Info |
| C7 | JS 注入风险 | 关键结构化数据（尤其 Product/Article）在初始 HTML 中 |

## D. 性能与 CWV

| # | 指标 | 好 | 需改进 | 差 |
|---|------|-----|--------|-----|
| D1 | LCP | ≤2.5s | 2.5–4.0s | >4.0s |
| D2 | INP | ≤200ms | 200–500ms | >500ms |
| D3 | CLS | ≤0.1 | 0.1–0.25 | >0.25 |

- 评估口径：75 分位**真实用户数据**（CrUX）；lab 数据（Lighthouse/PSI）只用于诊断
- 无 PSI key 时可用免 key 限流档：`curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=URL"`；有 key 时加 `-H "X-Goog-Api-Key: $GOOGLE_API_KEY"`
- 无 CrUX 数据（新站/低流量）→ 标"仅 lab 数据"，不假装 field 结论
- 常见瓶颈速查：
  - LCP → 首屏大图未压缩/未 preload、渲染阻塞 CSS/JS、TTFB >800ms、三方脚本、字体
  - INP → 长任务（>50ms）、重事件处理器、DOM >1500 节点、同步 XHR/localStorage、布局抖动
  - CLS → 图片/iframe 无尺寸、动态注入内容、字体切换、广告位未预留
- SPA 提示：软导航（soft navigation）当前不计入 CrUX 字段数据；SPA 站点 CWV 仅按硬导航测量（Chrome 151 起 Soft Navigations API 可用，但 CrUX 尚未采用）
- **只评测量过的项**：无法测量的维度写"未测"，不给分

## E. GEO / AI 可引用性

> 完整方法见 `geo-citability.md`。快速检查项：

| # | 检查项 | 通过标准 |
|---|--------|---------|
| E1 | 资格底线 | 页面已索引 + 有摘要资格（这是 AI 功能前提） |
| E2 | 可引用段落 | 章节前 40-60 词给出直接、自包含答案；关键信息在页面前 30% |
| E3 | 结构信号 | 表格（对比）、列表（步骤）、Q&A 格式、短段落（2-4 句） |
| E4 | 证据信号 | 作者署名+资历、发布/更新日期、一手来源引用、组织资质 |
| E5 | 新鲜度 | 关键页面 3 个月内有更新（第三方研究：新鲜内容被引用概率更高） |
| E6 | AI 爬虫访问 | `OAI-SearchBot`/`Claude-SearchBot`/`PerplexityBot` 未被屏蔽 |
| E7 | 实体与一致性 | Organization/Product/Person schema + sameAs；全站品牌事实一致 |
| E8 | 多模态 | 相关图片/视频（有助选择，非硬性） |
| E9 | llms.txt | 仅报告存在性；**不作权重**（Google 忽略；开发者文档站有价值） |

## F. 代码层风险（前端项目专查）

| # | 检查项 | 风险 |
|---|--------|------|
| F1 | CSR-only 关键内容 | 首页/商品/文章等内容依赖客户端渲染 → AI 爬虫与弱渲染器不可见 |
| F2 | head 硬编码 | title/description 写死在 `index.html`（SPA）→ 全站重复元信息 |
| F3 | meta 由 JS 注入 | title/canonical/robots 靠 JS 设置 → 延迟或失效 |
| F4 | sitemap/robots 缺失或手工维护 | 路由变化后 sitemap 失同步 |
| F5 | 路由不可达 | hash 路由（`#/path`）不被搜索引擎当独立页面 |
| F6 | 图片懒加载全量应用 | 首屏 LCP 图被懒加载 |
| F7 | i18n 无 hreflang | 多语言站语言版本互不声明 |
| F8 | 环境差异 | staging 的 noindex/robots 误带上生产，或反之 |

## 评分与分级建议

- 六维各自给出 `通过数 / 检查数`，可测量维度才计分；总分 = 加权（可抓取索引 25% / 页面要素 20% / 结构化数据 15% / 性能 15% / GEO 15% / 代码风险 10%），只作为沟通工具，**不是 Google 内部信号**（报告中需声明）
- 优先级：**P0 严重**（阻断收录/索引/渲染，如 noindex 误配置、CSR 主内容、robots 全禁、反向劫持）→ **P1 警告**（显著损失，如缺 canonical、title 重复、CWV 差、AI 爬虫被误屏蔽）→ **P2 优化**（增量收益，如 meta 打磨、图片格式、内链增强）
- 每条发现必填四要素：**证据**（URL 或 `文件:行号`）、**影响**、**修复建议**、**验证方式**（可证伪：怎么确认修好了 / 怎么确认没效果）

## 附录：站点级验证命令速查（冒烟验证沉淀）

```bash
# 多源 DNS 解析（apex 与 www 分别查；本地代理 fake-ip 环境下系统解析不可信）
for prov in "https://dns.google/resolve" "https://dns.alidns.com/resolve" "https://doh.pub/dns-query"; do
  curl -s -H "accept: application/dns-json" "$prov?name=<domain>&type=A" | jq -c '{Status,Answer}'
done
curl -s "https://api.hackertarget.com/dnslookup/?q=<domain>" | grep -E '^A|^AAAA|^CNAME'

# 绕过本地 DNS 直连 origin（--resolve 强制指定 IP）
curl -sI --resolve <host>:443:<origin-ip> "https://<host>/"

# 软 404 / HTTP→HTTPS / 证书 SAN
curl -s -o /dev/null -w "%{http_code}\n" "https://<domain>/nonexistent-$(date +%s)"
curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" "http://<domain>/"
openssl s_client -connect <origin-ip>:443 -servername <host> </dev/null 2>/dev/null | openssl x509 -noout -ext subjectAltName
```

- 判读：apex 无任何 A/AAAA/CNAME（但 MX/TXT/NS 正常）→ A7 失败；随机路径返回 200 → A1 软 404；80 端口 200（非 301）→ B9 未强制 HTTPS。
- **修复后复验**：同一组命令复跑，把报告条目更新为「✅ 已修复 + 验证记录」，不新建报告。
