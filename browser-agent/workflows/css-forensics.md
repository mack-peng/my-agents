# CSS 取证工作流 — DOM Reality Report

当 CSS 布局问题无法从静态代码定位（flex 修复无效、高度链可疑、只出现在真实渲染中）时，用浏览器取证拿到**真实 DOM 结构 + 计算值**，再结合 cssgraph 静态分析交叉验证。

## 何时使用

- 布局 bug 在 devtools 中复现，但代码审阅无法确定根因
- 高度链（height:100% / vh / auto）行为与预期不符
- `position:fixed` + 百分比高度的元素表现异常
- 滚动容器（overflow-y:auto）不滚动、或滚动条不出现
- 同一 CSS 修复方案在多个场景表现不一致（缩放、浏览器差异）

## 两步用法

1. 打开目标页面（真实环境或测试复现页），设置配置：

```bash
playwright-cli -s=<session> open <url> --headed
playwright-cli -s=<session> eval "() => { window.__DOM_REPORT_CFG = { ROOT_SELECTOR: '.site-version-history-dialog-wrapper', ZOOM_DIAGNOSIS: true }; return 'ok'; }"
```

2. 运行脚本：

```bash
playwright-cli -s=<session> run-code --filename scripts/dom-report.js
```

## 配置参数

| 参数 | 默认 | 说明 |
|------|------|------|
| `ROOT_SELECTOR` | `.site-version-history-dialog-wrapper` | 问题根节点（对话框/滚动容器） |
| `UP_TO` | `html` | 祖先链向上走到哪一级（可按工单调整，如 `body`） |
| `DOWN_DEPTH` | `6` | 向下展开层数 |
| `ZOOM_DIAGNOSIS` | `false` | 是否在 1x / 0.5x 各测一次并输出差异 |
| `MAX_NODES` | `60` | 节点数上限防 context 爆炸 |

## 输出解读

报告三层合一（Markdown）：

1. **祖先链**（root 向上到 html）——每级含：
   - `声明height`：源规则配对（`selector→value`，来自 document.styleSheets + inline style），区分 `100%` 与 `auto` 与绝对单位
   - `max-height`：上限约束单独列出（**上限 ≠ 锚点**——仅 max-height 时 % 子级仍解析为 auto）
   - `计算`：used value（px）
   - `CB:transform/filter/...`：containing-block 劫持标记（**关键**：transform 祖先会让 `position:fixed` 的百分比高度相对该祖先解析，而非视口）
   - `rect.bottom`：相对视口的渲染位置

2. **真实 DOM 树**——每节点含 `[position,display,h]`、`rect(W×H)`、`bottom`、`scroll=clientHeight/scrollHeight`、标记：
   - `⚠溢出视口` / `⚠溢出父级`
   - `⚠高度塌陷(0px)`：clientHeight=offsetHeight=0
   - `⚠有溢出(N>M)但overflow=X`：内容溢出但被裁切/不可滚
   - `✔可滚动`：overflow 生效且内容可滚
   - 重复结构聚合成 `×N`（1 代表 + 计数）

3. **判定**——逐滚动容器结论 + 锚点检查：
   - 高度链未受限（锚点问题）：内容溢出被 overflow 裁切、或视区为 0
   - 锚点检查列出链中每级的**声明值**（% vs 绝对单位 vs 无声明）——全链 % 或无声明 → 依赖 containing block 运行时解析

### Zoom 诊断

0.5x 视口重测后对比 rect.bottom：
- **无差异**：布局与视口无关（锚定良好或内容自适应）
- **有差异且 0.5x 不再溢出**：内容尺寸(auto)盒子溢出视口的签名 → 锚点问题

## 症状 → 假设映射

| 症状（报告标记） | 假设 | 修复方向 |
|---|---|---|
| 滚动容器 `clientHeight=0` + `overflow=auto` + 内容溢出 | 锚点问题：高度链全 auto/% → 塌陷为 0 | 给链条某级确定高度（如 `height:100vh`） |
| 滚动容器内容尺寸（scrollHeight==clientHeight）但溢出视口 | 锚点问题：内容撑开代替受限高度 | 同上，或 flex 布局中加 `min-height:0`（约束问题） |
| 有溢出但 `overflow=hidden` 裁切 | 锚点问题或父级 overflow 误设 | 检查裁切点是否应滚 |
| 链中有 `CB:transform` + fixed 根节点 | **containing block 劫持**：% 高度相对 transform 祖先 | 改用视口单位（vh）或去掉 transform |
| flex 子项撑破容器 | 约束问题：`min-height:auto` 默认值 | 子项加 `min-height:0` |

## 验证要点

- 报告自洽：锚点检查与溢出判定应互相印证；若 static 分析（cssgraph）与运行时（本报告）冲突，**以本报告为准**并记入工单
- 修复后重跑本脚本，滚动容器应变为 `✔可滚动` 且链中出现确定性锚点
- 真实编辑器验证：在 striking.ly 编辑器打开版本历史对话框后跑脚本，确认报告与测试页结论一致

## 测试矩阵（dom-report-test.html，本地 http server 托管）

| 场景 | 构造 | 预期判定 |
|---|---|---|
| 塌陷签名 | fixed modal + transform 祖先（containing block 劫持）| 全链 0px，clientHeight=0 无可用视区，`CB:transform` 标记 |
| 内容尺寸签名 | relative modal，祖先无确定高度 | 链为内容尺寸(2264px)，滚动容器 scrollHeight==clientHeight → "永不触发" |
| flex 对照 | flex:1 + overflow-y:auto 子项 | `✔可滚动`（正常） |
| flex 约束签名 | flex 子项无 overflow → min-height:auto 撑破父容器 | 溢出父级但非滚动容器 → 约束问题候选 |
| 修复验证 | 同塌陷场景 + height:100vh 锚 | `✔可滚动` + 锚点检查发现绝对单位声明 |

## 边界与限制

- 需要可交互的浏览器会话（登录态）
- `file://` 协议下部分计算值不可靠，用本地 http server 托管测试页
- playwright-cli 沙箱无 `process/require/setTimeout`，脚本内全部逻辑必须在 `page.evaluate` 回调内，延时用 `page.waitForTimeout`
- 配置必须经 `window.__DOM_REPORT_CFG` 传入（evaluate 内无法引用脚本外部变量）
- `page.viewportSize()` 偶发返回 null（headed 会话）→ 先 `resize` 再跑
- 多场景同页测试时，文档流堆叠会让 fixed 元素 rect 偏移——判定行以 scroll/clientHeight 关系为准，忽略测试页布局伪影
- 声明值配对只扫同源 stylesheet（跨域 sheet 的 cssRules 不可访问），inline style 已并入且优先
