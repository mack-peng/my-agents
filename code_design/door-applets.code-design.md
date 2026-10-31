# 有门小程序 — FE Code Design：HumanBench 分享裂变与暗色模式

- 人员：TL（待定）/ 开发（待定）/ Code Reviewer（待定）
- Spec：[humanbench-mini-challenge-dark.spec.md](https://ucniizx1ebgh.feishu.cn/wiki/Gjjdw6Suyi2JLbkIgjLcPUq0nbc)
- 关联文档：BE Code Design（door-applets-bg）— https://ucniizx1ebgh.feishu.cn/wiki/KQa7wHeATi0WzQkIIwdchX8NnKg
- 范围：`door-applets`（packageBench 模块）+ `humanbench-web`（仅 C9 小改）

## Spec Analysis

### R1：分享码扩展分项成绩 `b`（Spec R1）
- 需求：release 生成 shareData 时增加 `b`（ROWS 顺序本人分项成绩数组，elo 取整、其余 1 位小数、未答 null）
- 本次要改：`packageBench/engine/store.ts`（release 内 shareData）、`packageBench/types.ts`（新增 `ChallengeData`）
- 本次不涉及：web 端 shareData（web PK 不在本次范围）、海报/长图
- 待确认：无
- 重点与难点：取值口径与网页版/原版逐字一致；码长 +75 字符（实测：208 → 283），path 总长 317 字符，官方文档未设 path 上限（见 Q2）

### R2：结果页分享带挑战码（Spec R2）
- 需求：`onShareAppMessage` path 带 `?r=<code>`；`onShareTimeline` query 带 `r=<code>`
- 本次要改：`store.ts`（release 增加 `shareCode`）、`types.ts`（`GameState.shareCode`）、`result/index.ts`
- 本次不涉及：海报二维码（保持静态小程序码）、web `/r/` 分享链接生成
- 待确认：无
- 重点与难点：restored（恢复旧结果）场景也要能分享 → `shareCode` 在 release 每次生成、不入存档

### R3–R5：挑战卡接入 / 挑战优先 / 接受挑战（Spec R3–R5）
- 需求：首页解析 `r` → 挑战卡；挑战进入不恢复进度/旧结果；接受挑战 `start('full')`；对手留存 3h
- 本次要改：`index/index.ts`、`index/index.wxml`、`index/index.less`、`store.ts`、`compute.ts`（解码复用）
- 本次不涉及：快速版挑战（本次默认完整版）、动态小程序码
- 待确认：Q1（挑战卡展示时常规 CTA 是否保留「（继续）」标记）
- 重点与难点：档位/人格名按本端常量换算（`ti`/`pi` 口径，`pi='human'` → `HIDDEN_P`）；挑战优先级对齐网页 `boot()` 规则

### R6：归因埋点（Spec R6）
- 需求：`boot(entry)` 支持 `src`（direct/challenge/web）与 `c`（渠道码），`visit` 事件携带
- 本次要改：`store.ts`、`index/index.ts`（onLoad 取 options）、`quiz/index.ts`（深链兜底）
- 本次不涉及：OpenPanel 看板配置
- 待确认：无
- 重点与难点：`boot()` 幂等（`!game.state.booted` 才上报）；不覆盖现有 6 事件口径

### R7–R10：PK 横幅 / PK 分享卡 / 判定降级 / pk 埋点（Spec R7–R10）
- 需求：结果页 PK 横幅 + 分享卡第 1 张 PK 卡（5 张）+ 9 档判定 + 旧码规格表降级 + `pk` 埋点
- 本次要改：`result/index.ts`、`result/index.wxml`、`result/index.less`、`utils/poster.ts`、`utils/canvas-kit.ts`、`engine/compute.ts`（判定函数）
- 本次不涉及：web 端 PK 卡、动态对手回流链接
- 待确认：Q3（clean 版 PK 卡）
- 重点与难点：PK 卡信息密度排布（双方 + 12 项表 + 规格 + 人格 + 贴纸，1080×1440）；分项对比需 `b`（旧码缺失时换规格表）

### R11–R15：暗色模式（Spec R11–R15）
- 需求：4 页跟随系统深色；token 化并参考 `app.less` 明暗色板；修复「白字落在浅底」；导出图不受影响
- 本次要改：`packageBench/styles/bench.less`（token 层 + dark 覆盖 + 字面量收敛）、4 个页面 less 的页面级字面量（`index/quiz/result/captcha`）
- 本次不涉及：canvas 绘制层（poster/canvas-kit 常量保持浅色）、Vant 组件（bench 页未使用）、app 其他页面
- 待确认：无（D2 已确认：跟随系统、参考颜色系统）
- 重点与难点：约 260 处字面量按语义归类；`background:var(--ink); color:#fff` 组合需拆成 `--ink` + `--on-ink` 配对；WeChat 深色下默认文字色反转是「白字」问题根因，须给所有文本显式 token 色

### R22：Web 深链参数（Spec R22，跨仓库）
- 需求：URL Link 请求带 `query: from=web`（预留渠道码）；`VITE_WX_MP_PATH` 指向 `/packageBench/pages/index/index`
- 本次要改：`humanbench-web/src/engine/wx.ts`、`.env`、`.env.example`
- 本次不涉及：web 其余改动（P0-1/P0-3/P0-5 已在飞书记录）
- 待确认：无
- 重点与难点：`VITE_*` 构建期注入 → 改完必须重新构建上传（部署侧执行）

## Changes

### UI / 组件变更（FE）

**C1 首页挑战卡**

Filename: [修改] `packageBench/pages/index/index.wxml`（插入于 `bg-stickers` 与 `kicker` 之间）
```xml
<!-- ++++ 挑战卡：仅挑战链接进入时（区块顺序见 Spec） -->
<view class="challenge box pop" wx:if="{{challenge}}">
  <view class="ch-k">朋友发来一场挑战</view>
  <view class="ch-name">{{challenge.m}}</view>
  <view class="ch-row">
    <text>{{challenge.tier}}</text><text>{{challenge.arch}}</text>
    <text>{{challenge.persona}}</text><text>AA {{challenge.aa}} · 第 {{challenge.k}}/{{challenge.o}}</text>
  </view>
  <text class="ch-tag" wx:if="{{challenge.qm}}">快速版挑战</text>
  <view class="ch-q">你能超过 TA 吗？</view>
  <view class="btn pink small" bindtap="onAcceptChallenge">接受挑战 →</view>
</view>
```
Tech changes: `challenge` 为页面 data（`onLoad` 解析 `r` 后 setData，见 C4 三件套）；接受挑战绑定 `onAcceptChallenge` → `game.start('full')` + `wx.navigateTo` 到 quiz。展示挑战卡时常规 CTA 的「（继续）」标记按 Q1 结论处理。

**C2 结果页 PK 横幅**

Filename: [修改] `packageBench/pages/result/index.wxml`（插入于 `actions-top` 之后、`#poster` 之前）
```xml
<!-- ++++ PK 横幅：仅挑战来源（game.vsGet() 有效且非本人） -->
<view class="pk-banner box pop" wx:if="{{v.pk}}">
  <view class="pk-bk">FRIEND CHALLENGE · 好友 PK</view>
  <view class="pkb-row">
    <view class="pkb-f me">
      <text class="pkb-g" style="background:{{v.pk.meColor}}">{{v.pk.meGlyph}}</text>
      <text class="pkb-size">{{v.T.size}}</text>
      <text class="pkb-name">{{v.modelName}}</text>
      <view class="pkb-hp"><view class="i" style="width:{{v.pk.meW}}%"></view></view>
      <text class="pkb-aa">AA {{v.T.aa}}</text>
    </view>
    <text class="pkb-vs">VS</text>
    <view class="pkb-f">
      <text class="pkb-g" style="background:{{v.pk.themColor}}">{{v.pk.themGlyph}}</text>
      <text class="pkb-size">{{v.pk.themSize}}</text>
      <text class="pkb-name">{{v.pk.themName}}</text>
      <view class="pkb-hp"><view class="i" style="width:{{v.pk.themW}}%"></view></view>
      <text class="pkb-aa">AA {{v.pk.themAA}}</text>
    </view>
  </view>
  <view class="pkb-stamp {{v.pk.cls}}"><text class="tag">{{v.pk.tag}}</text><text class="d">{{v.pk.diffText}}</text></view>
  <text class="pkb-roast">{{v.pk.roast}}</text>
  <text class="pkb-tip">分享卡片第 1 张是 PK 卡，后面照常 4 张</text>
</view>
```
Tech changes: `v.pk` 在 result `build()` 内预算（判定、差值、进度条宽度、人格 glyph/色）；WXML 不做计算。样式类沿用网页 pkBanner 语义，实现见 C6。

**C3 分享卡序列（含 PK 卡）**

Filename: [修改] `packageBench/pages/result/index.ts` · `onGenerate()`（现 L309-323 `cards` 分支）
```ts
// ++++ 挑战来源时：PK 卡（第 1 张）+ 原 4 张；否则维持现状
const pk = this.pkInput() // 有对手才返回非空
const cards = pk ? [{ kind: 'pk' as const }, ...cardNames.map((_, i) => ({ kind: 'card' as const, idx: i }))] : cardNames.map((_, i) => ({ kind: 'card' as const, idx: i }))
for (let i = 0; i < cards.length; i++) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, GEN_W, GEN_H)
  if (cards[i].kind === 'pk') drawPkCard(ctx, input, theme, clean)
  else drawCard(ctx, cards[i].idx, input, theme, clean, cards.length) // ++++ 新增 total 参数（计数 x/N）
  urls.push(await this.exportCanvas(cv, CARD_W, CARD_H))
  names.push(cards[i].kind === 'pk' ? 'PK卡' : clean ? `小红书-${cardNames[i - 1]}` : cardNames[i - 1])
}
```
Tech changes: `drawCard` 增加可选 `total` 参数替换硬编码 `/4`；`input`（PosterInput）增加 `pk` 字段（见 C7）。命名与预览顺序随序列。

### 样式 / CSS 变更（FE）

**C4 挑战卡样式（对齐网页 `.challenge` 视觉）**

Filename: [修改] `packageBench/pages/index/index.less`（`page` 规则之后新增）
```less
/* ++++ 挑战卡（网页 .challenge 移植：box + pop + 粉字标题） */
.challenge{padding:14px 14px 16px;margin-bottom:14px;text-align:center;background:var(--white)}
.ch-k{font:900 12px var(--mono);letter-spacing:1px;color:var(--muted)}
.ch-name{font-family:var(--fun);font-size:26px;margin:6px 0 4px}
.ch-row{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;font-size:12px;color:var(--muted);margin-bottom:8px}
.ch-tag{display:inline-block;font-size:11px;font-weight:900;background:var(--yellow);border:2px solid var(--ink);border-radius:999px;padding:1px 8px;margin-bottom:6px}
.ch-q{font-family:var(--fun);font-size:18px;margin-bottom:10px}
```
Tech changes: 复用 bench.less 既有 `.box`/`.btn`/`.pop` 与 token（暗色自动生效）；颜色一律走 token，不写字面量。

**C5 PK 横幅样式**

Filename: [修改] `packageBench/pages/result/index.less`（`#poster` 规则前新增）
```less
/* ++++ PK 横幅（对照网页 .pk-banner/.pkb-*） */
.pk-banner{padding:14px;margin-bottom:14px;background:var(--white)}
.pkb-row{display:flex;align-items:center;gap:10px}
.pkb-f{flex:1;min-width:0;text-align:center}
.pkb-g{display:inline-flex;width:34px;height:34px;border-radius:10px;border:2px solid var(--ink);align-items:center;justify-content:center;font-weight:900;color:#fff}
.pkb-hp{height:10px;border:2px solid var(--ink);border-radius:999px;overflow:hidden;background:var(--surface-2)}
.pkb-hp .i{height:100%;background:var(--pink)}
.pkb-stamp.win{background:var(--green)} .pkb-stamp.lose{background:var(--red)} .pkb-stamp.tie{background:var(--surface-2)}
```
Tech changes: 与 C2 的 WXML 类名一一对应；`pkb-stamp` 三态配色沿用 token，暗色自动适配。

**C6 暗色 token（bench.less）**

Filename: [修改] `packageBench/styles/bench.less` · `page{}` 变量区（现 L1-10）
```less
page{
  --ink:#141414; --paper:#FFF7E3; --white:#fff; --muted:#6b675e;
  /* ++++ 新增语义 token（浅色值） */
  --on-ink:#fff;          /* --ink 底上的文字（配对使用） */
  --surface-2:#F6F3EA;    /* 次级面板/浅色块 */
  --muted-2:#555;         /* 三级文字（比 --muted 深） */
  --muted-3:#999;         /* 占位/最浅文字 */
  --soft-pink:#FFE3F1; --soft-green:#E6FFF0; --soft-blue:#E3F0FF; --soft-yellow:#FFF7DC;
  --line:3px solid var(--ink);
}
/* ++++ 暗色覆盖（跟随系统；值参考 app.less 色板） */
@media (prefers-color-scheme: dark) {
  page{
    background:var(--paper);
    --paper:#121212; --white:#1a1a1a; --surface-2:#2a2a2a;
    --ink:#FFFFFF; --muted:#999999; --muted-2:#b8b4ac; --muted-3:#777777;
    --on-ink:#121212;
    --soft-pink:#33202b; --soft-green:#1c3026; --soft-blue:#1d2837; --soft-yellow:#33301f;
  }
}
```
Tech changes: 只加变量与 dark 覆盖块，不改选择器结构；`page` 背景仅在 dark 下显式设置（避免动浅色现状；index 页已有 `page{background:var(--paper)}`）。

**C7 字面量收敛映射（bench.less + 4 页 less）**

Filename: [修改] `packageBench/styles/bench.less` 等（按映射表批量替换，不改选择器）

| 场景（现值） | 收敛为 | dark 取值 |
|---|---|---|
| 卡片底 `#fff`（配 `background:`） | `var(--white)` | #1a1a1a |
| `background:var(--ink)` + `color:#fff` | 保留 `--ink`，文字改 `var(--on-ink)` | 白底黑字 |
| 彩色块上文字/描边 `#fff`（红/黄/蓝块内） | 保持 `#fff` | 不变 |
| 次级面板 `#F6F3EA`/`#F4F2EC`/`#EEE9DA`/`#e6e1d4`/`#e3ded1` | `var(--surface-2)` | #2a2a2a |
| 正文灰 `#555`/`#666` | `var(--muted-2)` | #b8b4ac |
| 浅灰 `#999`/`#aaa`/`#bbb` | `var(--muted-3)` | #777777 |
| 浅色强调底 `#FFE3F1`/`#E6FFF0`/`#E3F0FF`/`#FFF7DC` | `var(--soft-*)` | 见 C6 |
| 刻意深色块（`.term` 终端、病毒弹窗渐变、`.logo` 黑底） | 不收敛（保持） | 不变 |
| 无 `color` 的文本节点 | 显式补 `color:var(--ink)` 或 `var(--muted*)` | — |

Tech changes: 按上表逐处替换（`bench.less` 约 260 处字面量、页面 less 若干）；`.c34` 系列类在 mp 内无引用（web 移植遗留）→ **不处理，仅记录**，不夹带删除。WeChat 深色下默认文字反转是白字根因，所有文本显式给 token 色后消除。

### 数据 / Store / 模型变更（FE）

**C8 分享码扩展（b + shareCode）**

Filename: [修改] `packageBench/engine/store.ts` · `release()`（shareData 生成处，现 L752-757）
```ts
const shareData = {
  m: modelName, s: T.size, a: activeStr, d: A.moe ? 0 : 1, t: T.tier, p: P.p.name,
  k: rank, o: AA.length + 1, aa: T.aa, l: 'zh', ti: T.idx, pi: P.p.id,
  // ++++ 分项成绩：口径与原版一致（elo 取整 / 其余 1 位小数 / 未答 null）
  b: ROWS.map((r) => { const v = youByRow.get(r.id); return v == null ? null : r.elo ? Math.round(v) : Math.round(v * 10) / 10 }),
  ...(S.mode === 'quick' ? { qm: 1 } : {})
}
// ++++ 分享码单独入 state（分享 path 只带码；restored 场景同样生成，不入存档）
S.shareCode = encodeResult(shareData)
const shareUrl = `${SITE_URL}r/${S.shareCode}`
```
Filename: [修改] `packageBench/types.ts`
```ts
// ++++ 挑战码（与网页版/原版码协议兼容；未知字段忽略）
export interface ChallengeData { m: string; s?: string; a?: string; d?: number; t?: string; p?: string; k?: number; o?: number; aa?: number; l?: string; ti?: number; pi?: string; qm?: number; b?: (number | null)[] }
// GameState 增加：shareCode?: string
```
Tech changes: `youByRow` 已在 release 内计算，直接复用；`SAVE_FIELDS`/`PROG_FIELDS` 不变（shareCode 由 release 重建）。

**C9 挑战接入与对手留存**

Filename: [修改] `packageBench/engine/store.ts` · `boot()`（现 L258-263）+ 新增方法
```ts
// ++++ 入参：入口归因（URL Link: from=web&c=xxx；挑战: src=challenge）
boot(entry?: { src?: 'direct' | 'challenge' | 'web'; c?: string }) {
  this.tp('visit', entry && (entry.src || entry.c) ? { src: entry.src, c: entry.c } : undefined)
  this.reset()
  this.commit({ booted: true })
}
// ++++ 挑战码解码 + 对手留存（对照原版 humanbench:vs，3h 有效）
const VS_KEY = 'humanbench:vs'
loadChallenge(code: string): ChallengeData | null {
  const r = decodeResult(code) as ChallengeData | null
  if (!r || !r.m) return null
  platform.set(VS_KEY, JSON.stringify({ at: Date.now(), r }))
  return r
}
vsGet(): ChallengeData | null {
  const o = platform.get<{ at: number; r: ChallengeData }>(VS_KEY)
  return o && o.r && Date.now() - o.at < 3 * 3600e3 ? o.r : null
}
```
Filename: [修改] `packageBench/pages/index/index.ts`（onLoad + onAcceptChallenge）
```ts
onLoad(options: Record<string, string | undefined>) {
  ensureBenchFont()
  setTracker((e, d) => op.track(e, d as Record<string, unknown>))
  // ++++ 归因 + 挑战码解析（挑战优先；不显示「（继续）」标记）
  const challenge = options?.r ? game.loadChallenge(options.r) : null
  if (!game.state.booted) game.boot({ src: challenge ? 'challenge' : options?.from === 'web' ? 'web' : 'direct', c: options?.c })
  if (challenge) this.setData({ challenge: challengeView(challenge) })
  this.refreshContinue()
}
// ++++ 接受挑战：完整版（D1）
onAcceptChallenge() { game.start('full'); wx.navigateTo({ url: '/packageBench/pages/quiz/index' }) }
```
Tech changes: `challengeView()` 在页面内做展示换算（`ti`→TIERS 档位名、`pi`→PROFILES/HIDDEN_P 人格名、`d`→MoE/Dense、`qm`→标签）；「继续」标记在有 challenge 时不展示（Q1）。

**C10 PK 判定与结果页数据**

Filename: [修改] `packageBench/engine/compute.ts`（文件末尾新增；文案与网页/原版逐字一致）
```ts
// ++++ 好友 PK：判定 / 差值 / 参数换算 / 对方人格（对照原版 pkTag·vsDiff·sizeNum·vsP）
export const pkDiff = (aa: number, r: ChallengeData) => Math.round((aa - (+r.aa || 0)) * 10) / 10
export const pkSizeNum = (s?: string) => { const m = String(s || '').match(/([\d.]+)\s*([KMBT])/i); return m ? +m[1] * ({ K: 1e-6, M: 1e-3, B: 1, T: 1e3 } as Record<string, number>)[m[2].toUpperCase()] : 0 }
export function pkTag(aa: number, size: string, r: ChallengeData): [string, string, 'win' | 'lose' | 'tie'] {
  const d = pkDiff(aa, r), ms = pkSizeNum(size), ts = pkSizeNum(r.s)
  if (d === 0) return ['平局', '两边发布会各自宣布 SOTA。', 'tie']
  if (d > 0 && ms < ts) return ['以小博大', '参数少一截，分数高一截。这就叫蒸馏。', 'win']
  // …（按原版 9 档顺序补全：参数白长了 / 碾压局 / 被碾压 / 险胜 / 惜败 / 胜利 / 落败）
}
```
Filename: [修改] `packageBench/pages/result/index.ts` · `build()`（现 L88-199）
```ts
// ++++ PK 横幅数据（仅挑战来源且非本人）
const them = game.vsGet()
const pkView = them && !(them.m === K.modelName && them.s === K.T.size) ? buildPkView(K, them) : null
// buildPkView：tag/roast/cls、diffText、双方 AA 条宽度（top=max(aa,them.aa)）、人格 glyph/color
const v = { ...现有字段, pk: pkView }
```
Tech changes: 全部展示值在 JS 侧算好（WXML 无计算）；`pk` 事件在 `release()` 非 restored 且存在对手时上报（字段定义见 Spec R10：`{ res, tag, b, dd }`）。

**C11 PK 卡绘制**

Filename: [修改] `packageBench/utils/poster.ts`（新增 `drawPkCard`，约 250-300 行；结构如下）
```ts
// ++++ 好友 PK 卡（第 1 张；clean 版去二维码/网址）——结构示意
export function drawPkCard(ctx: Ctx, d: PosterInput, theme: [string, string, string, string], clean = false) {
  paperBg(ctx, CARD_W, CARD_H, theme[0])
  // 1) 顶栏（同 drawCard 视觉，计数 1/5）
  // 2) VS 双方：pkSide(ctx, '我', d.name, params, d.K.P.p, true) / pkSide(ctx, 'TA', pk.them)
  // 3) AA 排行图：aaChart(...) 传入 d.K.aaList + 对手（fr 高亮），标出「我/TA」
  // 4) 左栏：分项对比表 —— hasB ? 12 行（我 vs TA 数值，赢格高亮）: 规格表
  // 5) 右栏：规格 6 行（参数量/激活参数/AA/排名/架构/档位）+ 人格对位
  // 6) 底部判定贴纸（tag + roast）与底栏（clean 分支同 drawCard）
}
```
Filename: [修改] `packageBench/utils/canvas-kit.ts` · `aaChart`（现 L305-344）
```ts
// ++++ 支持第二个高亮（对手）：item 增加 fr?: boolean
list: { name: string; score: number; color: string; me: boolean; fr?: boolean }[]
// 绘制：me → 粉底墨框 + “你”；fr → 白底墨框 + 名字；其余保持现状
```
Filename: [修改] `packageBench/utils/poster.ts` · `drawCard`（现 L427）
```ts
// ++++ 计数从硬编码 /4 改为参数（PK 卡入列后为 5 张）
export function drawCard(ctx: Ctx, idx: number, d: PosterInput, theme: [string, string, string, string], clean = false, total = 4) {
  // text(..., `${idx + 1}/${total}`, ...)
```
Tech changes: 绘制函数只消费预算好的 `d.pk`（them/tag/diff/胜场），不做判定；沿用 `box/text/pill/benchTable` 既有原语与 `makeDry` 度量模式；字体与配色沿用 canvas-kit 常量（浅色固定）。

**C12 Web URL Link query（跨仓库）**

Filename: [修改] `humanbench-web/src/engine/wx.ts`
```ts
export interface WxUrlLinkParams {
  path: string; query?: string; expire_type: number; expire_interval: number; env_version: string; expire_time?: number
}
// fetchWxUrlLink 默认参数：{ path: WX_MP_PATH, query: 'from=web', ... }   // ++++
```
Filename: [修改] `humanbench-web/.env`、`.env.example`
```bash
# ++++ 深链直达 bench 模块页（原默认 /pages/index/index 落「有门」首页）
VITE_WX_MP_PATH=/packageBench/pages/index/index
```
Tech changes: 请求体新增 `query` 字段（后端已支持，缓存键修复见 BE C1）；构建期注入 → 改后需重新 `pnpm build` 上传。

## 配置变更（FE）

| 配置键 | 环境 | 默认值 | 值来源 |
|---|---|---|---|
| `VITE_WX_MP_PATH` | humanbench-web | `/pages/index/index` → `/packageBench/pages/index/index` | `.env` / `.env.example`（部署侧 `.env.local` 同步确认） |

小程序侧无新增配置（挑战默认完整版、跟随系统深色均为代码内约定）。

## 第三方依赖（FE）

| 依赖 | 用途 | 核验结论 |
|---|---|---|
| 微信 `onShareAppMessage.path` 带 query | 挑战分享 | 官方文档（Page.html onShareAppMessage）**未规定 `path` 长度上限**，仅要求以 `/` 开头完整路径；本地实测（真实题库 + 12 项分项成绩）：shareCode 283 字符、path 317 字符，余量充足（社区经验值 1024 字节，非官方口径） |
| 微信 URL Link `query` | 深链归因 | 官方文档：`path` 不可携带 query，必须用独立 `query` 字段；`query` ≤1024 字符，仅数字/大小写英文/`!#$&'()*+,/:;=?@-._~%`（`from=web&c=xhs` 合规）；微信内打开跳开放标签，场景值 1167 |
| `@media (prefers-color-scheme: dark)` | 暗色模式 | WXSS 支持；`app.json` 已 `darkmode:true`；注意框架深色下默认文字反白是现状问题根因 |

## 前后端依赖与接口契约

| 需求 | 依赖方 | 状态 | 字段定义 | sign-off |
|---|---|---|---|---|
| R22 深链 query | door-applets-bg（BE C1 缓存键） | 待实施 | `query: "from=web[&c=…]"`；`path: /packageBench/pages/index/index` | 待确认 |
| R1–R10 分享码 | 无外部依赖（码自带） | 就绪 | `ChallengeData`：`{m,s,a,d,t,p,k,o,aa,l,ti,pi,qm,b[]}` | 待确认 |

## 兼容性

- 老码（无 `b`）：PK 卡/横幅自动降级为规格对比（`b` 缺失判定见 C11）；不报错
- 老结果存档（v2，无 shareCode）：release 重新生成，分享能力不受影响
- 旧版小程序客户端收到新版分享 path：打开首页无 `r` → 正常首页（无挑战卡），不报错
- 回滚：分享 path 去掉 `?r=` 即回旧行为；暗色块可整段移除；web 改回 `VITE_WX_MP_PATH` 默认值

## Timeline（总 27.5h）

| 变更组 | 预估工时 |
|---|---|
| C8 分享码扩展（b + shareCode） | 1.5h |
| C9 挑战接入 + 归因 + vs 留存 | 3h |
| C1/C4 挑战卡 UI | 3h |
| C10 PK 判定 + 结果页数据 | 2h |
| C2/C5 PK 横幅 UI | 2h |
| C11 PK 卡绘制（含 aaChart 扩展） | 5h |
| C3 分享卡序列整合 | 1.5h |
| C6/C7 暗色 token + 字面量收敛 | 5h |
| C12 web URL Link query | 1h |
| 联调 + 自测（真机双端 + 深浅色 + 分享回环） | 3.5h |
| 合计 | 27.5h |

## 待确认项（FE）— 已全部确认（2026-09-29）

| # | 问题 | 结论 |
|---|---|---|
| Q1 | 挑战卡展示时常规 CTA | **保留 CTA、隐藏「（继续）」标记**（对齐网页挑战优先语义） |
| Q2 | 分享 path 长度 | **已核验关闭**：官方文档未设上限；实测 path 317 字符（含 `b`） |
| Q3 | 小红书版（clean）PK 卡 | **保留**（去二维码/网址，Spec D5 已定） |
| Q4 | 撒花等页面 canvas 装饰随深色 | **随主题**（导出图固定浅色，二者独立） |

## Self-checklist

- [x] 需求 ↔ 变更点一一对应（R1→C8、R2→C8/C3、R3–R5→C9/C1/C4、R6→C9、R7–R10→C10/C2/C5/C11/C3、R11–R15→C6/C7、R22→C12）
- [x] 每条变更均有 `路径:行号` 依据与三件套
- [x] 新增配置 / 数据库迁移（无）/ 第三方依赖三节无遗漏
- [x] 片段均 ≤30 行，无完整实现代码
- [x] 前后端契约字段名/类型两侧一致（`ChallengeData.b` / `query`）
