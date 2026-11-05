# ticket-agent scripts

Inline-script / BugSnag 取证工具集。参数化脚本，替代一次性探针；输出默认落 `ticket-agent/tmp/`（gitignored）。

## 已验证语义（2026-11-05，Playwright WebKit 27.2）

- **WebKit inline `<script>` 的 `error.stack` / `window.onerror` 的 line、col 是文档相对坐标**，不是 script 块内坐标。Chrome 对 inline script 同样按文档行号上报。
- 动态注入或 `eval` 的脚本，坐标按注入源码计算；其 `file` 可能是注入时的 `document.URL`，因此同一栈里可能出现两个页面 URL。
- BugSnag `js-html` 分组键为帧 `lineNumber`（无 file/method）；`js-location` 用 file + lineNumber。
- 因此：拿到 `line:col` 后，先用 `web-inline-map.mjs --at` 对当前 HTML 做覆盖校验；列号越界说明事件时的 HTML 与当前抓取不一致（压缩、注入、版本差异）。

## 脚本

| 脚本 | 用途 |
|---|---|
| `bugsnag-range-scan.sh` | 拉取窗口内指定 class 的 open errors → 按 events 排序 → 落盘 → 拉 top N latest-event → 输出每组帧签名 |
| `web-fetch-page.mjs` | 按设备 UA profile 抓页面（fetch 或 WebKit 27.2 真引擎），保存 HTML + headers |
| `web-inline-map.mjs` | 列出 inline script 块（起始文档行、行数、最大行宽），并把文档相对 `line:col` 映射到块内源行，校验列号是否越界 |
| `web-repro.mjs` | WebKit 真引擎打开页面 + 真实点击 + 可选前后台事件周期，捕获 pageerror/console error + 前后 DOM/script 快照 + `document.write`/`innerHTML`/`appendChild`/`eval` 注入的脚本（`injected-scripts.json`） |

依赖：Node >= 18、jq、bugsnag-cli；`web-*.mjs` 默认使用全局 `cssprobe-cli` 自带的 playwright-core（可用 `PLAYWRIGHT_CORE_PATH` 覆盖）。

## 示例（SI-868）

```bash
./ticket-agent/scripts/bugsnag-range-scan.sh --since 2d --class RangeError --top 5

./ticket-agent/scripts/web-fetch-page.mjs \
  --url https://www.stoneage-tw.com/ \
  --out ticket-agent/tmp/bugsnag/stoneage-home.html \
  --ua-profile chrome-ios

./ticket-agent/scripts/web-inline-map.mjs \
  --file ticket-agent/tmp/bugsnag/stoneage-home.html \
  --at 194:41,194:70,201:363,202:201,230:69,230:389,230:415

./ticket-agent/scripts/web-repro.mjs \
  --url https://www.stoneage-tw.com/ \
  --click CROMIE --ua-profile ipad --cycle-visibility \
  --outdir ticket-agent/tmp/repro-stoneage
```

## 判读规则

- `--at` 输出 `OUT-OF-RANGE`：该行/列不属于当前 HTML 的任何 inline script（事件时页面已变化或被压缩/动态注入）。
- `no inline script block covers this document line`：坐标落在非 inline-script 区域，或坐标是脚本内相对值而非文档相对值。
- `web-repro.mjs` 报告里优先看 `pageErrors[].stack` 的 `file:line:col`，再对照 `before/after.scripts` 的行数与 `maxLine`，判断目标脚本是否被 SPA 更新动态注入。
