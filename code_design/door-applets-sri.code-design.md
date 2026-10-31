# 有门小程序 — FE Code Design：SRI 性压抑指数计算器小程序原生化

- 人员：TL（待定）/ 开发（待定）/ Code Reviewer（待定）
- Spec：[SRI 性压抑指数计算器小程序原生化 Spec](https://ucniizx1ebgh.feishu.cn/wiki/DIUTwasXPiZMKCkEXY3cjUOknkc)
- 关联文档：**BE Code Design 不适用** —— 本需求无服务端改动：web 端 100% 本地计算（无 API），分享走微信平台能力（无后端），数据仅存本机。故仅产出 FE 单份。
- 范围：`door-applets`（`packageLife/sri/` 模块 + `packageLife/pages/sri/*` 8 页 + 宿主集成）；数据源只读参照 `/Users/mack/Projects/sri`；实现范式参照 `packageBench`（humanbench 移植）

## Spec Analysis

### R1–R6：模块骨架与宿主集成（Spec R1–R6）
- 需求：入口 `packageLife/pages/sri/main/index` 去 web-view 原生化（R1）；8 页 + `packageLife/sri/` 模块结构（R2）；免登录浏览 / 动作时校验登录（R3）；暗黑跟随系统（R4）；埋点 visit/start/prog/finish/share（R5）；`show_sri_model` 语义与无后端约束不变（R6）
- 本次要改：`app.json`（packageLife.pages 增 7 页）、`packageLife/pages/sri/{main,consent,demographics,quiz,result,history,guide,science}/`、新增 `packageLife/sri/`
- 本次不涉及：`function_menu.ts`（入口已存在且路径不变）、`theme.json`、tabBar/window 配置
- 待确认：无
- 重点与难点：web-view 壳下线后旧分享路径（`?shareID=`）不能报错（落地页忽略未知参数）；`show_sri_model` 灰度语义保持，不做额外开关

### R7–R11：测评数据与算法（Spec R7–R11）
- 需求：题库/量表/选项逐字移植且脚本化不手抄（R7）；按年龄/性经验自适应选题（R8）；评分与 web 逐函数一致且不修 web 口径（R9）；会话 + 草稿本地存储（R10）；结果分享码 b64url（R11）
- 本次要改：新增 `packageLife/sri/lib/{types,scales,adaptive-scales,calculator}.ts`（由同步脚本生成）、`packageLife/sri/engine/{platform,base64,share-code,store}.ts`
- 本次不涉及：web 端任何修改（含其计分口径与文案文案 bug）；web localStorage 数据迁移
- 待确认：无
- 重点与难点：web 源为 TS（非 JSON），同步策略取「拷贝 + import 改写 + 构建期校验」而非序列化，保证与源码逐字一致（见 C11）；差分测试必须同时覆盖 3 类分流 × 快/完整 × 全档/随机作答

### R12–R17：测评流程页面（Spec R12–R17）
- 需求：落地页双入口（R12）；同意书（R13）；基本信息 5 题（R14）；问卷（快测分组单列表 / 完整每页 15 题、进度卡、必答阻断）（R15）；草稿恢复弹窗（R16）；处理中 2s → Result redirect（R17）
- 本次要改：`pages/sri/main|consent|demographics|quiz` 四页；`engine/store.ts`（会话/草稿/进度）
- 本次不涉及：web 单题卡片模式（`questionnaire-section.tsx` 注释块死代码）、未成年人同意分支（web 不可达，对齐不实现）
- 待确认：Q1（快测单列表在 33-42 题下的滚动体验确认）
- 重点与难点：完整 126 题在 WXML 的渲染量（分页 15 题控制单页节点数）；必答未答定位滚动（不用 `pageScrollTo.selector`，用 boundingClientRect + scrollTop，无版本依赖）；草稿节流写与 onHide/onUnload flush

### R18–R21：结果页（Spec R18–R21）
- 需求：本人结果视图（hero/解释/建议/四维度/详细分数/评估信息/声明）（R18）；操作区（分享/生成图/复制文案/重测/历史）（R19）；好友分享视图（`?d=` 降级展示 + 开始我的评估 CTA）（R20）；结果写入历史可回看（R21）
- 本次要改：`pages/sri/result/*`（同页双视图）、`engine/store.ts`（结果持久化）、`utils/view.ts`（view-model）
- 本次不涉及：web 的「下载报告」按钮文案（小程序改为 JSON 导出，见 R31）、量表原始回答在结果页展示
- 待确认：无
- 重点与难点：同页双视图的状态分派（`?d=` 分享视图 / `?session=` 历史 / 无参取 store 当前结果）与 finish 埋点去重（restored/历史进入不重复上报）

### R22–R29：分享体系（Spec R22–R29）
- 需求：结果分享（按钮 + 菜单 → `?d=<code>`）（R22）；朋友圈 `onShareTimeline`（R23）；邀测分享 → 模块首页（R24）；5 档分享文案（R25）；海报长图 + 分享卡生成与存相册（R26）；分享图隐私口径（R27）；分享封面 + 小程序码（R28）；分享引导卡（R29）
- 本次要改：`pages/sri/result/*`（双分享入口 + canvas）、`utils/poster.ts`、`utils/share-text.ts`、`utils/canvas-kit.ts`（复制自 packageBench）、`modules/constants/images.ts`（`sriShareCover`、`sriWechatQrCode`）
- 本次不涉及：web 端分享文案/二维码逻辑、动态小程序码生成（用静态小程序码图片）
- 待确认：Q2（小程序码资源）、Q3（分享封面文案）
- 重点与难点：同页两个 `open-type="share"` 按钮走同一 `onShareAppMessage`，需按 `res.target.dataset.kind` 区分「结果码 / 邀测路径」（菜单分享默认结果码）；离屏画布尺寸固定（CSS=背板），导出显式传 width/height（bench `result/index.less:62` 的坑）

### R30–R34：历史 / 指南 / 科学依据（Spec R30–R34）
- 需求：历史列表 + 统计 + 删除/清空 + 继续测评（R30）；JSON 导出（R31，CSV 裁剪）；指南页（R32）；科学依据页（R33）；隐私承诺展示（R34）
- 本次要改：`pages/sri/history|guide|science` 三页、`engine/export-report.ts`、`data/content.ts`
- 本次不涉及：CSV 导出（Spec 明确裁剪）、web 历史页的统计口径扩展
- 待确认：无
- 重点与难点：导出文件写 `wx.env.USER_DATA_PATH` 后 `wx.shareFileMessage`（基础库 2.16.1+，需在用户点击回调内调用）；静态长文从 web JSX 提取为 TS 常量并分节渲染

### R35–R39：质量保障与验收（Spec R35–R39）
- 需求：评分差分测试（R35）；类名/样式守卫（R36）；typecheck（R37）；真机验收（R38，Phase 4 暂缓）；视觉还原（R39）
- 本次要改：新增 `scripts/sri/`（同步/差分/守卫/封面脚本）
- 本次不涉及：Phase 4 部署与真机复测（ci-lite 就绪后另约）、humanbench 既有脚本（保持不动）
- 待确认：无
- 重点与难点：在 Node 中跑小程序 TS（复用 `scripts/humanbench/register-ts.mjs` 模式）并让 web 源与 MP 源「同输入同断言」

## Changes

### UI / 组件变更（FE）

**C1 模块骨架与页面注册**

Filename: [修改] `app.json`（`packageLife` 分包 pages，现 L70 为 `"pages/sri/main/index"`）
```jsonc
// ++++ 在 "pages/sri/main/index" 之后追加 7 页（同分包）
"pages/sri/main/index",
"pages/sri/consent/index",
"pages/sri/demographics/index",
"pages/sri/quiz/index",
"pages/sri/result/index",
"pages/sri/history/index",
"pages/sri/guide/index",
"pages/sri/science/index",
```
Filename: [新增] `packageLife/sri/` 模块目录（结构见 C11–C16）；`packageLife/pages/sri/{consent,demographics,quiz,result,history,guide,science}/index.{ts,wxml,less,json}`（各页 4 件套）
Tech changes: 路径与别名 `~packageLife/*` 均已存在（`app.json:177`、`tsconfig.json:24`），不新增配置；各页 `index.json` 设 `navigationBarTitleText`（性压抑指数/知情同意/基本信息/快速测评/测评结果/历史记录/使用指南/科学依据）。模块内**不新增自定义组件**（页面 WXML 直接渲染，避免不必要抽象）

**C2 落地页（main）**

Filename: [修改] `packageLife/pages/sri/main/index.wxml`（现为 1 行 web-view，整页替换）
```xml
<!-- ++++ hero / 双入口 / 对比卡 / 科学依据 / 隐私 / 底部链接（区块顺序见 Spec） -->
<view class="sri-page">
  <view class="hero">
    <view class="hero-title">性压抑指数计算器</view>
    <view class="hero-sub">基于科学量表的性心理健康自评</view>
    <view class="hero-privacy">数据仅保存在本机</view>
  </view>
  <view class="cta-main box" data-mode="quick" bindtap="onStart">
    <text class="cta-t">开始快速测评</text><text class="cta-s">33-42 题 · 约 5-8 分钟</text>
  </view>
  <view class="cta-sub box" data-mode="full" bindtap="onStart">
    <text class="cta-t">完整版测评</text><text class="cta-s">58-126 题 · 约 20-40 分钟</text>
  </view>
  <!-- version-compare ×2 / science-cards ×4 / privacy / cta-foot / links-row -->
  <view class="links-row">
    <text data-url="/packageLife/pages/sri/history/index" bindtap="onNav">历史记录</text>
    <text data-url="/packageLife/pages/sri/guide/index" bindtap="onNav">使用指南</text>
    <text data-url="/packageLife/pages/sri/science/index" bindtap="onNav">科学依据</text>
  </view>
</view>
```
Filename: [修改] `packageLife/pages/sri/main/index.ts`（现 L1-19 web-view 壳，整页替换）
```ts
// ++++ onLoad: 忽略旧分享参数 shareID（兼容旧链接），仅解析 src 归因
onLoad(options: Record<string, string | undefined>) {
  op.track('visit', { src: options.src === 'invite' ? 'invite' : options.src === 'share' ? 'share' : 'menu' })
}
// ++++ CTA：校验登录 → 进入同意页（携带 mode；登录后回本页再点一次）
onStart(e: WechatMiniprogram.TouchEvent) {
  if (getApp().isNotLoginAndToLoginPage()) return
  const mode = e.currentTarget.dataset.mode === 'full' ? 'full' : 'quick'
  game.start(mode)
  wx.navigateTo({ url: `/packageLife/pages/sri/consent/index?mode=${mode}` })
}
// ++++ 落地页分享 → 模块首页（邀测）
onShareAppMessage() {
  return { title: '性压抑指数计算器 · 33-42 题测出你的 SRI', path: '/packageLife/pages/sri/main/index?src=share', imageUrl: sriShareCover }
}
```
Tech changes: `op` 从 `~/app` 导入（bench 先例 `packageBench/pages/index/index.ts:5`）；`game` 为 SRI store 单例（C12）；`onNav` 用 `wx.navigateTo` 跳静态页；旧参数 `shareID` 不读不报错

**C3 知情同意页（consent）**

Filename: [新增] `packageLife/pages/sri/consent/index.wxml`（对齐 web `consent-form.tsx:140-210`；4 条必选 + 危机提醒 + 双按钮）
```xml
<view class="sri-page">
  <view class="consent-title">性压抑指数评估 · 知情同意书</view>
  <view class="checks">
    <view class="check" wx:for="{{items}}" wx:key="id" data-i="{{index}}" bindtap="onToggle">
      <view class="box-ic {{item.on ? 'on' : ''}}">{{item.on ? '✓' : ''}}</view>
      <text>{{item.text}}</text>
    </view>
  </view>
  <view class="alert">重要提醒：如果您目前正在经历严重的心理困扰…（对齐 web 原文）</view>
  <view class="btns">
    <view class="btn white" bindtap="onDecline">我不同意</view>
    <view class="btn {{ok ? '' : 'disabled'}}" bindtap="onAgree">我同意并开始评估</view>
  </view>
</view>
```
Tech changes: `items` 4 条文案从 web 逐字移植（`consent-form.tsx:156-199` 的 4 条必选）；在本页完成同意后才 `wx.navigateTo` 到 demographics；「我不同意」`wx.navigateBack`；本页不写库（R13 不落数据）

**C4 基本信息页（demographics）**

Filename: [新增] `packageLife/pages/sri/demographics/index.wxml`（5 题单选卡片；数据源 `lib/scales.ts` 的 `DEMOGRAPHICS_QUESTIONS`）
```xml
<view class="sri-page">
  <view class="q-group" wx:for="{{groups}}" wx:key="id">
    <view class="q-title">{{item.text}}{{item.required ? '' : '（可选）'}}</view>
    <view class="opts">
      <view class="opt {{o.sel ? 'on' : ''}}" wx:for="{{item.options}}" wx:for-item="o" wx:key="value"
            data-qid="{{item.id}}" data-val="{{o.value}}" bindtap="onPick">{{o.label}}</view>
    </view>
  </view>
  <view class="btn {{ok ? '' : 'disabled'}}" bindtap="onSubmit">下一步</view>
</view>
```
Tech changes: `groups` 由 `DEMOGRAPHICS_QUESTIONS` + 已选值构建（含 `sel` 布尔，WXML 不做比较逻辑）；`onSubmit` 调 `game.saveDemographics(d)`（创建会话写历史 + 草稿）后 `wx.navigateTo` 问卷页；4 必填未齐时按钮禁用态

**C5 问卷页（quiz）**

Filename: [新增] `packageLife/pages/sri/quiz/index.ts`（核心：build 视图 + 分页 + 恢复）
```ts
// ++++ sync(): 构建「分组题目 + 选中态 + 进度 + 分页」视图（WXML 只渲染，不做计算）
function buildQuizView(st: SriState): QuizView {
  const scales = st.selectedScales            // R8 自适应结果（store 内缓存）
  const list = flatten(scales, st.responses)  // 每题 {id,text,opts:[{value,label,sel}]}
  const pages = st.mode === 'quick' ? [list] : chunk(list, PAGE_SIZE /* 15 */)
  const answered = Object.keys(st.responses).length
  const requiredLeft = list.filter(q => q.required && st.responses[q.id] == null).length
  return { pages, page: st.page, answered, total: list.length, requiredLeft, savedAt: st.savedAt, firstUnanswered: ... }
}
onLoad() { this.unsub = game.subscribe(() => this.setData({ v: buildQuizView(game.state) })) }
onPick(e) { game.answer(e.currentTarget.dataset.qid, Number(e.currentTarget.dataset.val)) }
onDone() { const r = game.canFinish(); if (!r.ok) return this.scrollTo(r.firstUnanswered); game.finish() }
```
```xml
<!-- ++++ 进度卡 + 分组题卡 + 底部「查看结果」；完整版底部分页条 -->
<view class="prog-card">已答 {{v.answered}}/{{v.total}} · 必答未答 {{v.requiredLeft}} · 已保存 {{v.savedAt}}</view>
<view class="group" wx:for="{{v.cur}}" wx:key="id">
  <view class="q" id="q-{{item.id}}" wx:for="{{item.questions}}" wx:for-item="q" wx:key="id">
    <text class="q-text">{{q.text}}</text><view class="opts">…{{q.opts}}…</view>
  </view>
</view>
```
Tech changes: 快测单列表（分组长滚动）、完整每页 15 题（`data-page` 翻页，store 记 `page` 入草稿）；`scrollTo` 用 `createSelectorQuery().boundingClientRect` + `wx.pageScrollTo({scrollTop})`；处理中阶段在本页 overlay（2s 定时 → `game.finish()` → `wx.redirectTo` 结果页）；`onUnload/onHide` flush 草稿

**C6 结果页 · 本人视图（result）**

Filename: [新增] `packageLife/pages/sri/result/index.ts`（视图分派 + 维度行预算）
```ts
// ++++ build(): 结果 → view-model（维度行/等级色/量表分数/信息行）
function buildResultView(r: AssessmentResults, mode: Mode, when: Date): RView {
  const D = r.sri.dimensionScores
  const dims = [
    { k: 'sosReversed', label: '性观感反向 (SOS)', z: D.sosReversed },
    { k: 'sexGuilt', label: '性内疚 (Guilt)', z: D.sexGuilt },
    { k: 'sexualShame', label: '性羞耻 (Shame)', z: D.sexualShame },
    { k: 'sisOverSes', label: '抑制优势 (SIS/SES)', z: D.sisOverSes }
  ].map(d => ({ ...d, zText: d.z.toFixed(2), bar: Math.min(100, Math.abs(d.z) * 20), cls: d.z >= 0 ? 'pos' : 'neg' }))
  return { score: r.sri.totalScore, level: levelView(r.sri.level), dims, scales: r.sri.scaleScores.filter(s => s.rawScore > 0), interp: r.interpretation, recs: r.recommendations, info: {...} }
}
// ++++ 视图分派：?d= → 分享视图；?session= → 历史；无参 → store 当前结果
onLoad(q) {
  if (q.d) { const ok = game.loadShared(q.d); this.setData({ shared: true, v: ok ? buildSharedView() : null, bad: !ok }); return }
  const s = q.session ? game.getSession(q.session) : null
  this.setData({ v: buildResultView(s ?? game.state.result) })
  if (!q.session) game.emit('finish', {...}) // 仅本人首次完成上报（历史/分享进入不报）
}
```
Tech changes: 详细分数仅显示 `rawScore>0`；等级标签/颜色取 `lib/types.ts` `SRI_LEVELS`；「重新测评」= `game.start(mode)` + 跳同意页；「查看历史」跳 history；分享引导卡（R29）置于 hero 之后

**C7 结果页 · 好友分享视图（result `?d=`）**

Filename: [修改] `packageLife/pages/sri/result/index.wxml`（分享视图分支）
```xml
<!-- ++++ ?d= 进入：TA 的结果 + 通用邀请区（不展示评估信息/个性化建议） -->
<block wx:if="{{shared && v}}">
  <view class="hero shared"><text class="hero-k">TA 的性压抑指数 (SRI)</text><text class="hero-score">{{v.score}}</text><text class="hero-lv">{{v.levelText}}</text></view>
  <view class="dims">…四维度（同 C6 渲染）…</view>
  <view class="invite box"><text>这是一个由朋友分享的评估结果。想要获得属于自己的专业心理分析吗？</text>
    <view class="btn" bindtap="onStartMine">开始我的评估</view>
    <navigator class="btn white" url="/packageLife/pages/sri/guide/index">了解更多</navigator>
  </view>
</block>
<block wx:elif="{{bad}}"><view class="empty">分享链接已失效<view class="btn" bindtap="onStartMine">开始我的评估</view></view></block>
```
Tech changes: 分享视图的「开始我的评估」校验登录后进同意页；本页 `onShareAppMessage` 在分享视图下重发同一 `?d=` 码（转发回流）；无评估信息（题数/会话 ID）与个性化建议（R20）

**C8 历史页（history）**

Filename: [新增] `packageLife/pages/sri/history/index.ts`（统计 + 列表 + 删除/清空 + 继续）
```ts
// ++++ build(): sessions → 统计（次数/平均分/最高分）+ 列表行（等级色点/时间/分数/可继续）
function buildHistory() {
  const rows = game.sessions().map(s => ({ id: s.id, type: s.type, when: fmtDate(s.endTime || s.startTime), score: s.results ? s.results.sri.totalScore : null, lv: s.results ? s.results.sri.level : '', done: s.completed, pct: s.responses.length }))
  return { rows, stat: { n: rows.length, avg: …, max: … } }
}
onRow(e) { const s = game.getSession(e.currentTarget.dataset.id); s.completed ? wx.navigateTo({ url: `/packageLife/pages/sri/result/index?session=${s.id}` }) : this.onResume(s) }
onResume(s) { if (getApp().isNotLoginAndToLoginPage()) return; game.resumeDraft(s.type); wx.navigateTo({ url: `/packageLife/pages/sri/quiz/index?mode=${s.type}` }) }
```
Tech changes: 删除/清空二次确认（`wx.showModal`）；「继续测评」进入问卷页走 C5 的恢复弹窗；JSON 导出按钮调 C15

**C9 指南 / 科学依据页（guide / science）**

Filename: [新增] `packageLife/sri/data/content.ts`（从 web `guide.tsx` / `science.tsx` 提取分节文案）
```ts
// ++++ 静态内容 → 分节常量（供两页 wx:for 渲染；只搬文案，不搬 JSX 结构）
export const GUIDE_SECTIONS: Section[] = [
  { title: '评估流程', items: ['选择快速或完整版本…', '…'] },
  { title: '版本区别', items: ['快速版 33-42 题…', '完整版 58-126 题…'] },
  { title: '隐私与数据', items: ['所有数据仅保存在本机…'] }
]
export const SCIENCE_SECTIONS: Section[] = [ { title: '量表来源', items: ['SIS/SES…', 'Mosher…'] }, … ]
```
Filename: [新增] `packageLife/pages/sri/guide/index.wxml` / `science/index.wxml`（分节标题 + 内容卡）
Tech changes: 单页 `wx:for` 渲染；题量/时长文案按 R8 实际值（修正 web 39/117 口径）；底部补「隐私声明」段（R34）

### 样式 / CSS 变更（FE）

**C10 SRI 样式体系（sri.less，tokens + 暗色 + 页面样式）**

Filename: [新增] `packageLife/sri/styles/sri.less`（对齐 web `tailwind.config.ts:67-76` 色板 + `globals.css` 卡片语义）
```less
page{
  --sri-primary:#2F6FEF;      /* web psychology blue hsl(220,90%,56%) */
  --sri-cyan:#0BA5DC;         /* cyan hsl(200,95%,45%) */
  --sri-accent:#B06CFF;       /* purple accent hsl(280,100%,70%) */
  --sri-bg:#F7F9FC; --sri-card:#FFFFFF; --sri-card-2:rgba(255,255,255,.92);
  --sri-text:#111827; --sri-muted:#6B7280; --sri-line:#E5E7EB;
  --lv-1:#16A34A; --lv-2:#65A30D; --lv-3:#CA8A04; --lv-4:#EA580C; --lv-5:#DC2626; /* 绿→黄→橙→红 */
  --sri-radius:14px; --sri-shadow:0 8px 24px rgba(17,24,39,.06);
  color:var(--sri-text);
}
@media (prefers-color-scheme: dark){ page{ background:#0F1115; --sri-bg:#0F1115; --sri-card:#1A1D24; --sri-card-2:#1A1D24; --sri-text:#EDEFF3; --sri-muted:#9AA1AD; --sri-line:#2A2E37; --sri-shadow:none; } }
.sri-page{min-height:100vh;background:linear-gradient(180deg,#EEF4FF 0%,var(--sri-bg) 32%,#FFF7F0 100%);padding:16px}
.box{background:var(--sri-card);border:1px solid var(--sri-line);border-radius:var(--sri-radius);box-shadow:var(--sri-shadow)}
```
Tech changes: 每页 `index.less` 首行 `@import "../../../sri/styles/sri.less";`（页面样式隔离，须各自引入；参照 `packageBench/styles/bench.less:24-34` 暗色 remap 模式）；web 的 `backdrop-blur` 在 WXSS 不可用 → 以 `--sri-card-2` 半透明近似；渐变进度条用 `linear-gradient(90deg,var(--sri-primary),var(--sri-cyan))`；问卷选项卡片选中态（描边 + 浅蓝底）

### 数据 / Store / 模型变更（FE）

**C11 web 题库同步（scripts/sri/sync-lib.mjs + 生成 lib/）**

Filename: [新增] `scripts/sri/sync-lib.mjs`
```js
// ++++ 与 scripts/humanbench/gen-data.mjs 同模式：读 web 源 → 改写 import → 加「勿手改」头 → 写 lib/
const FILES = [
  ['src/types/index.ts', 'types.ts', {}],
  ['src/lib/scales/index.ts', 'scales.ts', {}],
  ['src/lib/scales/adaptive-scales.ts', 'adaptive-scales.ts', {}],
  ['src/lib/calculator/index.ts', 'calculator.ts', {}]
]
// 改写规则：'@/types' → './types'；'@/lib/scales' → './scales'
// 校验：ALL_SCALES 共 11 个量表 / 题目合计 154 / DEMOGRAPHICS_QUESTIONS === 5 / 每题 options ≥ 2；失败 exit 1
// 另导出 counts.json 供差分测试断言（题量、量表 id 列表）
```
Tech changes: 为什么不是「序列化生成」——web 源是带逻辑（自适应选题、spread 复用）的 TS，逐字拷贝 + import 改写才能保证与源码一致；输出头 `⚠️ 由 scripts/sri/sync-lib.mjs 生成，勿手改`；`packageLife/sri/lib/` 4 个文件直接参与 `npm run typecheck`

**C12 测评 Store（engine/store.ts）**

Filename: [新增] `packageLife/sri/engine/store.ts`（单例 + 订阅 + 会话/草稿；存储走 platform）
```ts
export class SriStore {
  state: SriState
  subscribe(fn: () => void): () => void { /* bench store.ts:115-120 同款 */ }
  commit(patch?: Partial<SriState>) { /* 浅合并 + 通知 */ }
  // 生命周期
  start(mode: Mode)                        // main → 同意：记 mode，清旧态（不动历史）
  saveDemographics(d: Demographics)        // 创建会话 {id,type,demographics,responses:[],completed:false} 写 sessions + draft
  answer(qid: string, v: number)           // 更新 responses；节流(1s)写 draft；命中里程碑发 prog 埋点
  canFinish(): { ok: boolean; firstUnanswered?: string }
  finish()                                 // 计算 → 写会话 completed:true + results；清 draft；state.result 供结果页
  resumeDraft(mode) / discardDraft()       // 恢复弹窗与「重新开始」
  loadShared(code) / shareCode()           // 分享码（C13）
  sessions() / getSession(id) / removeSession(id) / clearSessions()
}
export const game = new SriStore()
export type Tracker = (e: string, d?: Record<string, unknown>) => void
export const setTracker = (fn: Tracker | null) => { tracker = fn }   // 页面注入 op.track（bench store.ts:100-105）
```
Tech changes: 存储键 `sri:sessions` / `sri:draft`（`platform.ts`：wx.getStorageSync，Node 下 Map 兜底——差分测试可跑）；`id = 'sri_' + Date.now() + '_' + rand`；会话上限 50 条裁旧；草稿 `{ v:1, mode, demographics, responses, page, at }`；`prog` 里程碑 quick `[1,5,10,20,30]` / full `[1,10,30,60,90]`（最后一题在 finish 不计）

**C13 分享码（engine/share-code.ts + base64 + platform）**

Filename: [新增] `packageLife/sri/engine/base64.ts`（复制 `packageBench/engine/base64.ts`：UTF-8 shim + bytes↔base64 + b64url）、`engine/platform.ts`（复制并按 `sri:` 前缀改键）
Filename: [新增] `packageLife/sri/engine/share-code.ts`
```ts
// ++++ 分享码 v1（字段极简；跨版本兼容：未知字段忽略、缺 v 视为 1）
export interface ShareCode { v: 1; s: number; l: string; d: [number, number, number, number]; m: 'quick' | 'full'; t: string }
export const encodeShare = (r: SRIResult, m: Mode, at: Date): string =>
  b64urlEncode(JSON.stringify({ v: 1, s: r.totalScore, l: r.level, d: [r.dimensionScores.sosReversed, r.dimensionScores.sexGuilt, r.dimensionScores.sexualShame, r.dimensionScores.sisOverSes].map(n => Math.round(n * 100) / 100), m, t: fmtDate(at) }))
export const decodeShare = (code: string): ShareCode | null => { /* JSON.parse + 基本校验（s 为 0-100 数、l 合法、d 为 4 元数组）；失败 null */ }
```
Tech changes: z 值保留 2 位小数控长（码长约 180-220 字符，远小于 path 承载）；解码失败由结果页渲染「分享链接已失效」视图（C7）

**C14 分享文案（utils/share-text.ts）**

Filename: [新增] `packageLife/sri/utils/share-text.ts`（移植 web `share-utils.ts:14-55` 的 5 档模板）
```ts
// ++++ 5 档标题模板逐条移植；随机取一条（缓存于页面，避免重进变化）
export function shareTitleOf(level: LevelKey, score: number): string {
  const list = SHARE_TITLES[level] || SHARE_TITLES.default
  return list[hash(Date.now()) % list.length].replace('{score}', String(score))
}
export function copyTextOf(r: SRIResult): string { /* web 分享文案 + 品牌/话题词 */ }
```
Tech changes: 5 档模板块（很低/偏低/中等/偏高/很高）与 web 同调性；标题带分数与品牌词；`share` 埋点 `how` 区分 link/timeline/poster/invite

**C15 JSON 导出（engine/export-report.ts）**

Filename: [新增] `packageLife/sri/engine/export-report.ts`
```ts
// ++++ web ExportData 口径移植（会话脱敏：id→btoa 前 8 位）；写 USER_DATA_PATH 后 shareFileMessage
export async function exportReport(): Promise<void> {
  const data = { version: '1.0.0', exportedAt: new Date().toISOString(), sessions: game.sessions().map(maskSession) }
  const fs = wx.getFileSystemManager()
  const path = `${wx.env.USER_DATA_PATH}/SRI报告-${stamp()}.json`
  await promisify(fs.writeFile)({ filePath: path, data: JSON.stringify(data, null, 2), encoding: 'utf8' })
  await promisify(wx.shareFileMessage)({ filePath: path, fileName: `SRI报告-${stamp()}.json` })   // 基础库 2.16.1+
}
```
Tech changes: 必须在用户点击回调内调用 `shareFileMessage`；低版本/失败 `wx.showToast('当前微信版本不支持文件分享')`；导出内容含 demographics/responses/results（用户主动导出，对齐 web）

### 分享图与相册（FE）

**C16 海报与分享卡（utils/poster.ts + result 页 canvas）**

Filename: [复制] `packageBench/utils/canvas-kit.ts` → `packageLife/sri/utils/canvas-kit.ts`（框架无关绘图原语，原样复用：`text/box/pill/wrapLines/measure/CanvasImage/loadImage`）
Filename: [新增] `packageLife/sri/utils/poster.ts`（移植 `packageBench/utils/poster.ts` 的 makeDry/section 模式）
```ts
// ++++ 长图（1080 宽，高度实测后裁剪）：hero 分数/等级 → 四维度条 → 解读摘要 → 小程序码 + 品牌页脚
export function drawPoster(ctx: Ctx, d: PosterInput): number {
  let y = drawHero(ctx, d); y = section(ctx, dry, secDims, y, d); y = section(ctx, dry, secInterp, y, d)
  drawQr(ctx, d.qrImage, y); return y + FOOT_H
}
// ++++ 分享卡 3 张（1080×1440）：分数卡 / 四维度卡 / 解读卡（角标小程序码）
export function drawCard(ctx: Ctx, idx: number, d: PosterInput): void { … }
```
Filename: [新增] `packageLife/pages/sri/result/index.wxml`（离屏画布，尺寸固定 = 背板）
```xml
<!-- ++++ CSS 尺寸 = 背板尺寸（bench pages/result/index.less:62 口径），导出显式传参 -->
<canvas type="2d" id="genCanvas" class="gen-canvas"></canvas>
```
Tech changes: `GEN_W=1080`、`GEN_H=3200`（长图与卡片的最大包络）；`cv.width/height` 与 CSS 一致，`setTransform/clearRect/scale` 后绘制；`wx.canvasToTempFilePath({ canvas, x, y, width, height, destWidth, destHeight })`（bench `result/index.ts:324-340`）；预览弹窗 →「保存到相册」`saveImageToPhotosAlbum` + `scope.writePhotosAlbum` 拒绝 → `wx.openSetting`（bench `result/index.ts:469-515`）；分享图仅绘制分数/等级/四维度/通用解读（R27）

**C17 分享入口（result 页 onShareAppMessage / onShareTimeline）**

Filename: [新增] `packageLife/pages/sri/result/index.ts`（分享 payload；双按钮 + 菜单三态）
```ts
// ++++ onShareAppMessage(res)：按按钮 dataset.kind 区分「结果码 / 邀测」；菜单分享默认结果码
onShareAppMessage(res: WechatMiniprogram.Page.ICustomShareContent) {
  const kind = (res && res.target && res.target.dataset && res.target.dataset.kind) || 'result'
  if (kind === 'invite') return { title: '来测测你的性压抑指数（33-42 题）', path: '/packageLife/pages/sri/main/index?src=invite', imageUrl: sriShareCover }
  const code = game.shareCode()
  return { title: shareTitleOf(level, score), path: `/packageLife/pages/sri/result/index?d=${code}`, imageUrl: sriShareCover }
}
onShareTimeline() { const code = game.shareCode(); return { title: shareTitleOf(level, score), query: `d=${code}` } }
```
```xml
<!-- ++++ 结果页两个原生分享钮：kind=result（分享结果）/ kind=invite（将测评分享给朋友） -->
<button class="btn" open-type="share" data-kind="result" bindtap="onShareTap">分享结果</button>
<button class="btn white" open-type="share" data-kind="invite" bindtap="onShareTap">将测评分享给朋友</button>
```
Tech changes: 菜单分享（`res.from==='menu'`，无 target）走结果码；`share` 埋点在 `onShareTap`/生成图/复制时上报（`how`）；分享视图下重发同一码

### 工程脚本（FE）

**C18 同步 / 差分 / 守卫 / 封面脚本（scripts/sri/）**

Filename: [新增] `scripts/sri/{register-ts.mjs, ts-resolve.mjs}`（按 `scripts/humanbench/` 同名脚本拷贝并扩展：别名表已含 `~packageLife/`；新增 web 源解析：`parentURL` 含 `/Users/mack/Projects/sri` 时 `@/x` → `<web>/src/x`，参照 `ts-resolve.mjs:51-61` 的 humanbench-web 拦截写法）
```js
// scripts/sri/simulate.mjs — 评分差分（R35）
// 场景：3 类分流（未成年 / 从未性行为 / 默认）× 快/完整 × 作答策略（全 1 / 全 5 / 递增 / 种子随机）
// 断言：① 自适应题集 id 序列一致 ② 每量表 rawScore 一致 ③ 4 维 z（2 位小数）一致
//      ④ totalScore/level 一致 ⑤ interpretation/recommendations 数组逐条一致
for (const demo of DEMOS) for (const mode of ['quick', 'full']) for (const policy of POLICIES) {
  const web = webAssess(demo, mode, policy); const mp = mpAssess(demo, mode, policy)
  check(JSON.stringify(web) === JSON.stringify(mp), `${demo.age}-${mode}-${policy}`)
}
```
Filename: [新增] `scripts/sri/check-classes.mjs`（按 `scripts/humanbench/check-classes.mjs` 适配：扫描 `packageLife/pages/sri/*` + `packageLife/sri/**`；校验四件套齐全、每页/组件 less `@import` sri.less、未定义类告警）
Filename: [新增] `scripts/sri/gen-share-cover.mjs`（按 `scripts/humanbench/gen-share-cover.mjs` 适配：渲染 SRI 分享封面 5:4 → 上传 CDN `/door-applets/images/share/`）
Tech changes: 不改动 `scripts/humanbench/` 任何文件（surgical）；脚本产物为模块源码/资源，均有序提交（除封面图上传 CDN）

## 配置变更（FE）

| 位置 | 变更 | 值来源 |
|---|---|---|
| `app.json` · packageLife.pages | +7 页（C1） | 本设计 |
| `modules/constants/images.ts` | 新增 `sriShareCover`（5:4 封面） | CDN `/door-applets/images/share/sri-share-cover.jpg`（C18 生成上传） |
| `modules/constants/images.ts` | 新增 `sriWechatQrCode` | 复用现有小程序码资源（Q2 确认；专用码则替换 URL） |

无环境变量、无后端配置。

## 第三方依赖（FE）

| 依赖 | 用途 | 核验结论 |
|---|---|---|
| `onShareTimeline` | 朋友圈分享 | 官方 Page 生命周期（基础库 2.11.3+）；本仓 libVersion 3.5.6；`packageBench/pages/result/index.ts:532` 已有同款实现 |
| `wx.shareFileMessage` | JSON 报告导出 | 官方文档：**基础库 2.16.1 起支持；`filePath` 必须为本地/临时路径**；本仓无既有使用，失败兜底 toast；libVersion 3.5.6 满足 |
| `wx.saveImageToPhotosAlbum` + `scope.writePhotosAlbum` | 分享图存相册 | 本仓既有实现（`packageTool/pages/qr_code/result/index.ts:65`、`packageBench/pages/result/index.ts:469-515` 含授权拒绝引导） |
| canvas 2D + `wx.canvasToTempFilePath` | 海报/卡片生成 | 本仓既有实现（`packageBench/pages/result/index.ts:324-340`、`packageTool/pages/qr_code/index.ts:429`） |
| `wx.pageScrollTo` + `boundingClientRect` | 未答题定位 | 两者均为长期稳定 API，不依赖新版本参数（规避 `pageScrollTo.selector` 的版本要求） |
| `lodash` / `text-encoding-shim` | canvas-kit / b64url | 均已在 `package.json` 依赖；无需新增 |
| `qrcode-generator` | （不使用） | 海报走小程序码图片 + 失败占位块，不引入动态 QR |

无新增 npm 依赖。

## 前后端依赖与接口契约

无前后端接口（BE 不适用）。唯一跨版本契约是**分享码**：

| 需求 | 依赖方 | 状态 | 字段定义 | sign-off |
|---|---|---|---|---|
| R11/R20/R22 | 分享码（自包含，跨小程序版本） | 就绪 | `v:1` · `s` 分数 0-100 · `l` 等级 key（very-low/low/moderate/high/very-high）· `d` 四维 z（2 位小数，数组顺序 sosReversed/sexGuilt/sexualShame/sisOverSes）· `m` quick/full · `t` 完成日期 | 待确认 |
| R1/R6 | 宿主 `function_menu` / `show_sri_model` | 就绪（不改） | path 不变 | — |
| R3 | 登录：`getApp().isNotLoginAndToLoginPage()` | 就绪（`app.ts:196`） | — | — |

## 兼容性

- 老数据：web-view 时代浏览器 localStorage 数据无法迁移（跨端不可达），小程序内从零开始；无小程序侧旧数据结构，不存在迁移
- 旧分享链接：`/packageLife/pages/sri/main/index?shareID=<id>`（web-view 版）→ 落地页忽略未知参数正常展示，不报错
- 旧客户端收到新分享 path（`result?d=`）：旧版 SRI 页是 web-view 壳，参数被忽略、正常打开原网页 → 降级可用
- 分享码演进：新增字段旧端忽略；`v` 递增时新端按版本分支解码（当前仅 v1）
- 低版本微信：`shareFileMessage`/`onShareTimeline` 不满足时功能级降级（toast/不展示朋友圈入口），不阻断主流程
- 回滚：后台隐藏 `show_sri_model` 入口，或 revert `feat-sri-native` 分支；**不恢复 web-view 壳**（Spec R6）

## Timeline（总 46h，>40h 建议分批合入）

| 变更组 | 预估工时 |
|---|---|
| C11 题库同步脚本 + lib 生成 + 校验 | 2h |
| C12 测评 Store（会话/草稿/进度） | 3h |
| C13 分享码 + platform/base64 | 1.5h |
| C1 骨架与页面注册 | 1h |
| C2 落地页 | 3h |
| C3 同意页 | 1.5h |
| C4 基本信息页 | 2h |
| C5 问卷页（分页/恢复/处理中） | 4.5h |
| C6 结果页本人视图 | 3.5h |
| C7 分享结果视图 | 2h |
| C16 海报/分享卡/存相册 | 5.5h |
| C17 分享 payload + C14 文案 | 2h |
| C8 历史 + C15 JSON 导出 | 3h |
| C9 指南/科学依据（含 R34 隐私文案） | 3h |
| C10 样式体系（tokens/暗色/4 页打磨） | 3.5h |
| C18 差分测试 + 类名守卫 + 封面脚本 | 4h |
| 联调 + 自测（快/完整 × 明/暗 × 分享回环） | 3h |
| 合计 | 46h |

> **分批建议**（仅指合入顺序，需求范围不裁剪）：批 1 = C11–C18 + C1–C7（核心测评闭环 + 分享，≈36h）；批 2 = C8/C9（历史/指南/科学依据，≈10h，独立无耦合）。

## 待确认项（FE）

| # | 问题 | 建议 |
|---|---|---|
| Q1 | 快测（33-42 题）用单页分组长列表（对齐 web）还是每 15 题分页？ | 建议对齐 web 单列表（分组清晰、滚动流畅）；若真机体验差改分页仅需调整 C5 的 `chunk` 粒度 |
| Q2 | 小程序码资源：复用现有通用码（`humanbenchWechatQrCode` 同资源）还是提供 SRI 专用码？ | 建议先复用通用码占位；专用码由用户生成后替换 `sriWechatQrCode` URL 即可（1 行改动） |
| Q3 | 分享封面文案与视觉（5:4） | 建议：「你的性压抑指数是多少？33-42 题 · 科学量表」+ 蓝紫渐变；C18 脚本出图后请审 |
| Q4 | 分享卡张数 3 张（分数/四维度/解读）是否够？ | 建议 3 张（Spec 允许 2-4）；如需「小程序码卡」独立成第 4 张，+0.5h |

## Self-checklist

- [x] 需求 ↔ 变更点一一对应：R1→C1、R2→C1、R3→C2/C5/C7/C8、R4→C10、R5→C12/C14、R6→C1/C12、R7→C11、R8→C11/C12、R9→C11/C18、R10→C12、R11→C13/C7、R12→C2、R13→C3、R14→C4/C12、R15→C5、R16→C5/C12、R17→C5、R18→C6、R19→C6/C17、R20→C7、R21→C12/C6、R22→C17、R23→C17、R24→C17/C2、R25→C14/C17、R26→C16/C6、R27→C16、R28→C18/C16、R29→C6、R30→C8、R31→C15/C8、R32→C9、R33→C9、R34→C3/C6/C9、R35→C18、R36→C18、R37→C18、R38→Phase 4（暂缓）、R39→C10
- [x] 每条变更均有 `路径:行号` 依据与三件套（web 源行号 / bench 先例行号均已核实）
- [x] 新增配置、数据库迁移（无）、第三方依赖三节无遗漏
- [x] 片段均 ≤30 行，无完整实现代码
- [x] 前后端契约：无 BE；分享码字段名/类型在 C13 与「契约表」两侧一致
