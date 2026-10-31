# 有门后端（doors）— BE Code Design：HumanBench 挑战链接 OG 与深链归因

- 人员：TL（待定）/ 开发（待定）/ Code Reviewer（待定）
- Spec：[humanbench-mini-challenge-dark.spec.md](https://ucniizx1ebgh.feishu.cn/wiki/Gjjdw6Suyi2JLbkIgjLcPUq0nbc)
- 关联文档：FE Code Design（door-applets）— https://ucniizx1ebgh.feishu.cn/wiki/DUXvwQMytiJce7kZ29xcltWQnVc
- 范围：`door-applets-bg`（部署于 doors.orangemust.com）

## Spec Analysis

### R16：`/r/<code>` 动态 meta（Spec R16）
- 需求：返回注入个性化分享 meta 的站点 HTML（爬虫不执行 JS），`no-store`
- 本次要改：新增 `BenchShareController`、`BenchShareService(+Impl)`、`BenchShareProperties`、Redis 缓存配置
- 本次不涉及：web SPA 本身（渲染仍由前端接管）
- 待确认：Q1（模板来源）
- 重点与难点：模板与站点构建产物的同步策略（避免副本漂移）；注入必须容错（模板结构变化不 500）

### R17：`/og/<code>.png` 个性化预览图（Spec R17）
- 需求：1200×630 PNG，含模型名/参数量/档位/AA 排名/人格主题色；生成后长缓存；失败回落静态图
- 本次要改：`BenchShareService` 内渲染方法 + Redis 缓存 + 字体资源
- 本次不涉及：小程序分享卡（FE 侧 canvas）
- 待确认：Q2（字体体积）、Q3（缓存介质）、Q4（兜底方式）
- 重点与难点：服务端 Java2D 中文字形渲染（字体内置、无系统字体依赖）；参数大字/档位贴纸/人格色的版式

### R18：码解析与安全（Spec R18）
- 需求：base64url→JSON（补 padding）、≤1KB、字段容错、失败回落默认 meta（不 500）
- 本次要改：`BenchShareServiceImpl.parseCode()`
- 本次不涉及：码生成（前端 encodeResult 已定）
- 待确认：无
- 重点与难点：URL 安全字符与 Spring 路径匹配（`[\w-]+`）；异常吞掉只降级不抛错

### R19：反向代理与部署（Spec R19）
- 需求：`bench.orangemust.com` 上 `/r/`、`/og/` 反代 doors 后端；同步部署文档
- 本次要改：`humanbench-web/deploy/nginx.conf.example`、`door-applets-bg/README.md`（部署说明）
- 本次不涉及：`/wx-api` 现有配置
- 待确认：Q5（运维发版配合）
- 重点与难点：`proxy_pass` 必须**保留 URI**（不能带结尾 `/`，否则 `/r/` 前缀被剥掉）

### R20：字体资源（Spec R20）
- 需求：内置 CJK 字体 + 数字字体；OFL 许可说明
- 本次要改：`src/main/resources/fonts/`（新增资源）
- 本次不涉及：小程序端字体（已有 ZCOOL KuaiLe / Noto Sans SC 加载逻辑）
- 待确认：Q2
- 重点与难点：jar 体积；启动预加载失败要降级（不阻塞服务）

### R21：URL Link 缓存键修复（Spec R21）
- 需求：`@Cacheable key` 加入 `#request.query`（现在不同 query 命中同一条链接）
- 本次要改：`WxPublicUrlServiceImpl`
- 本次不涉及：`WxPublicUrlRequest/Controller/Client`（`query` 字段已存在，无需改）
- 待确认：无
- 重点与难点：无（单行修复）；注意旧缓存条目自然过期（24h TTL）

### R23：落点验收（Spec R23，与 FE 联调）
- 需求：URL Link 直达 `/packageBench/pages/index/index`，小程序内 `visit` 可见 `src=web`
- 本次要改：无代码；联调与验收步骤
- 本次不涉及：小程序页面本身（FE C9）
- 待确认：无
- 重点与难点：微信内/外各验一次；`ben` 页面需为已发布版本（`env_version=release`）

## Changes

### Controller / 接口变更（BE）

**C1 挑战分享接口（`/r/{code}`、`/og/{code}.png`）**

Filename: [新增] `src/main/java/com/orangemust/doors/controller/common/BenchShareController.java`
```java
// ++++ 挑战链接：服务端注入个性化 meta（微信/X/小红书抓取不执行 JS）
@RestController
public class BenchShareController {
    @Resource private BenchShareService benchShareService;

    @GetMapping(value = "/r/{code:[\\w-]+}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> share(@PathVariable String code) {
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .contentType(MediaType.TEXT_HTML)
            .body(benchShareService.renderShareHtml(code));
    }

    @GetMapping(value = "/og/{code:[\\w-]+}.png", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> og(@PathVariable String code) {
        return ResponseEntity.ok()
            .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000, immutable")
            .contentType(MediaType.IMAGE_PNG)
            .body(benchShareService.renderOgImage(code));
    }
}
```
Tech changes: 两类响应均自带 Cache-Control（HTML no-store / PNG immutable）；`[\w-]+` 匹配 base64url 码，超长或非法直接 404/回落（由 Service 处理）；不经过统一 `Result` 包装（`ResponseEntity` 直出）。

### Service / 业务逻辑变更（BE）

**C2 分享渲染服务**

Filename: [新增] `src/main/java/com/orangemust/doors/service/impl/BenchShareServiceImpl.java`
```java
// ++++ 三段职责：码解析 / 模板+meta 注入 / OG 图渲染（缓存见 C4）
@Service
public class BenchShareServiceImpl implements BenchShareService {
    @Override public String renderShareHtml(String code) {
        Map<String, Object> r = parseCode(code);                    // 失败 → 空 map → 默认 meta
        String html = templateHtml();                                // 见 templateHtml()：拉站点 + 缓存
        return injectMeta(html, r, code);                            // 替换 title/og/twitter，容错注入
    }
    @Override @Cacheable(cacheNames = "benchShareOg", key = "#code", unless = "#result == null")
    public byte[] renderOgImage(String code) { /* Java2D 1200×630，失败返回 null → 兜底静态图 */ }

    private Map<String, Object> parseCode(String code) { /* base64url + padding → JSON；code.length()>1024 → 空 */ }
    @Cacheable(cacheNames = "benchShareTemplate", key = "'index'", unless = "#result == null")
    public String templateHtml() { /* Hutool HttpUtil.get(properties.getSiteUrl() + "/index.html")，失败用内置兜底模板 */ }
    private String injectMeta(String html, Map<String, Object> r, String code) { /* <title>/og:title/og:description/og:image/twitter:*；缺失则 </head> 前插入 */ }
}
```
Tech changes: 模板来自线上 `index.html`（TTL 缓存，见 Q1），注入用「按标签替换 + `</head>` 兜底插入」；OG 渲染在 `BenchShareController` 层捕获 null 后 302/直出 `/og.png`（Q4）；所有异常只降级不 500。

**C3 URL Link 缓存键修复**

Filename: [修改] `src/main/java/com/orangemust/doors/service/impl/WxPublicUrlServiceImpl.java`（现 L39-45）
```java
@Cacheable(
    value = "wxPublicUrl",
    // ++++ query 纳入缓存键：不同渠道参数（from=web&c=xhs）必须生成各自的链接
    key = "{#request.path, #request.query, #request.expireType, #request.envVersion}",
    unless = "#result?.errcode != 0"
)
@Override
public WxPublicUrlResponse getWxPublicUrl(WxPublicUrlRequest request) { … }
```
Tech changes: 单行 key 变更；`query` 为空时与原键等价（老缓存可自然复用至 24h 过期）；无需改动 Controller/Client（`query` 字段与 `@JSONBody` 透传已就绪）。

### 配置变更（BE）

**C4 新增配置项与缓存**

Filename: [新增] `src/main/java/com/orangemust/core/properties/BenchShareProperties.java`
```java
@Component
@ConfigurationProperties(prefix = "bench.share")
@Data
public class BenchShareProperties {
    private String siteUrl;                 // 站点根地址（拉 index.html 模板与拼 og:image）
    private int templateTtlMinutes = 10;    // 模板缓存 TTL（分钟）
}
```
Filename: [修改] `src/main/resources/application.yml`（文件末尾新增）
```yaml
bench:
  share:
    site-url: ${BENCH_SITE_URL:https://bench.orangemust.com}
    template-ttl-minutes: ${BENCH_TEMPLATE_TTL_MINUTES:10}
```
Filename: [修改] `src/main/java/com/orangemust/doors/config/RedisConfiguration.java`（`cacheManager` 内，现 L72-96）
```java
RedisCacheConfiguration benchShareOgConfig = RedisCacheConfiguration.defaultCacheConfig()
    .entryTtl(Duration.ofDays(30))
    .serializeKeysWith(…StringRedisSerializer…)
    .serializeValuesWith(…GenericJackson2JsonRedisSerializer…);   // byte[] 序列化为 base64，可接受
RedisCacheConfiguration benchShareTplConfig = RedisCacheConfiguration.defaultCacheConfig()
    .entryTtl(Duration.ofMinutes(10)) …;
cacheConfigurations.put("benchShareOg", benchShareOgConfig);
cacheConfigurations.put("benchShareTemplate", benchShareTplConfig);
```
Tech changes: 新缓存 `benchShareOg`（30 天，PNG base64 值）/ `benchShareTemplate`（10 分钟，HTML 值）；沿用现有序列化与 key 策略，与 `wxPublicUrl` 并列。

### 第三方依赖（BE）

| 依赖 | 用途 | 核验结论 |
|---|---|---|
| 微信 `generate_urllink.query` | 深链归因参数 | 官方文档原文：`path` 不可携带 query，须用独立 `query` 字段；`query` ≤1024 字符，仅数字/大小写英文/`!#$&'()*+,/:;=?@-._~%`；错误码 40212 invalid query、40165 invalid weapp pagepath；微信内打开转开放标签（场景值 1167） |
| `java.awt`（Java2D） | OG 图渲染 | JDK 17 内置；服务器 headless 无系统字体依赖，全部走内置字体文件 |
| 字体文件 | 中文/数字渲染 | Noto Sans SC（SIL OFL，允许嵌入与再分发）+ 数字展示字体；随 jar 分发（Q2 体积） |
| Hutool `HttpUtil` | 拉取站点模板 | 项目已依赖 hutool 5.8.34，无需新增 |

### 资源变更（BE）

**C5 字体资源**

Filename: [新增] `src/main/resources/fonts/NotoSansSC-Bold.ttf`、`fonts/LilitaOne-Regular.ttf`、`fonts/LICENSE.txt`
```java
// ++++ 启动预加载（失败仅告警，不阻塞服务；渲染时回退默认字体）
@PostConstruct
void loadFonts() {
    this.cjk = load("fonts/NotoSansSC-Bold.ttf");
    this.num = load("fonts/LilitaOne-Regular.ttf");
}
```
Tech changes: `Font.createFont(Font.TRUETYPE_FONT, is)` 注册到 `Font` 集合或持有实例；OG 渲染全程显式字体（不依赖系统字体）；`LICENSE.txt` 记录 OFL 来源与版本。

### 部署变更（BE）

**C6 反向代理（`bench.orangemust.com`）**

Filename: [修改] `humanbench-web/deploy/nginx.conf.example`（与 `/wx-api` 段并列）
```nginx
# ++++ /r/ 与 /og/ 反代 doors 后端；注意 proxy_pass 不带结尾斜杠，保留 URI
location /r/ {
    proxy_pass https://doors.orangemust.com;
    proxy_set_header Host doors.orangemust.com;
    proxy_ssl_server_name on;
}
location /og/ {
    proxy_pass https://doors.orangemust.com;
    proxy_set_header Host doors.orangemust.com;
    proxy_ssl_server_name on;
}
```
Filename: [修改] `door-applets-bg/README.md`（部署章节同步同样两条 location 说明）
Tech changes: 保留原始 URI（与 `/wx-api` 剥前缀的写法不同）；后端侧无端口/域名假设；SPA 现有 `try_files` 不受影响（`/r/` 有 real 后端时优先匹配 location）。

### 数据库迁移

无（本需求不涉及表结构变更）。

## 前后端依赖与接口契约

| 需求 | 依赖方 | 状态 | API 文档 / 字段定义 | sign-off |
|---|---|---|---|---|
| R21 ↔ FE C12 | humanbench-web | 待实施 | 请求体：`{ path, query:"from=web[&c=…]", env_version, expire_type, expire_interval }`；`query` ≤1024、字符集受限 | 待确认 |
| R16 | web nginx → 后端 | 待配置 | `GET /r/{code}` → `text/html`，`Cache-Control: no-store` | 待确认 |
| R17 | web nginx → 后端 | 待配置 | `GET /og/{code}.png` → `image/png` 1200×630，`max-age=31536000, immutable`；失败 → 302 `/og.png` | 待确认 |
| R18 | 前端码格式 | 就绪 | `code = base64url(JSON)`，字段 `{m,s,a,d,t,p,k,o,aa,l,ti,pi,qm,b[]}`；未知字段忽略 | 待确认 |
| R23 | 小程序（FE C9） | 待实施 | URL Link 打开后小程序 `onLoad` 收到 `from/c`；`visit.src=web` 可查 | 待确认 |

## 兼容性

- 老 URL Link 缓存：键变更后自然过期（24h）；期间新旧链接均可用
- 老分享码：缺字段的码 → OG/HTML 降级（用默认值或静态图），不报错
- 灰度：`/r/`、`/og/` 未加 nginx 路由时行为与现状一致（SPA 兜底），可先发后端再加路由
- 回滚：删除两条 nginx location 即回退；`wxPublicUrl` key 变更回滚后旧行为恢复（缓存自然过期）

## Timeline（总 17h）

| 变更组 / 步骤 | 预估工时 |
|---|---|
| C3 缓存键修复 | 0.5h |
| C1 Controller + C2 码解析 | 2h |
| C2 模板拉取 + meta 注入 | 3h |
| C2 OG 图 Java2D 渲染（版式 + 中文字形） | 6h |
| C4 配置 + Redis 缓存 | 1h |
| C5 字体资源与预加载 | 1h |
| C6 nginx + 部署文档 | 1h |
| 联调 + 自测（含微信内/外 URL Link 验收 R23） | 2.5h |
| 合计 | 17h |

## 待确认项（BE）— 已全部确认（2026-09-29）

| # | 问题 | 结论 |
|---|---|---|
| Q1 | 站点 `index.html` 模板来源 | **HTTP 拉取线上（TTL 缓存）**；失败回落内置兜底模板 |
| Q2 | Noto Sans SC Bold 全量进 jar（约 +10MB） | **接受**（动态模型名含任意汉字，子集不可行） |
| Q3 | OG 图缓存介质 | **Redis 30 天**（与现有缓存基建一致） |
| Q4 | `/og/` 失败兜底 | **302 到静态 `/og.png`** |
| Q5 | nginx 发版 | **运维配合**，在 `bench.orangemust.com` 增加两条 location |

## Self-checklist

- [x] 需求 ↔ 变更点一一对应（R16→C1/C2、R17→C2/C4/C5、R18→C2、R19→C6、R20→C5、R21→C3、R23→联调）
- [x] 每条变更均有 `路径:行号` 依据与三件套
- [x] 新增配置 / 数据库迁移（无）/ 第三方依赖三节无遗漏
- [x] 片段均 ≤30 行，无完整实现代码
- [x] 前后端契约字段名/类型两侧一致（`query` / `code` 字符集 / `og:image` URL 形态）
