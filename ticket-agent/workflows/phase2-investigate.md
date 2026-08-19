# Phase 2: 调研分析

## 输入

飞书文档 URL（飞书模式）或对话上下文（Session 模式）

## 工程原则

- **先陈述再执行**：动手搜索前先向用户陈述调研策略并获确认
- **精准定位，拒绝泛读**：先定位再展开，避免全量代码扫描
- **约束上下文预算**：codegraph 优先，限制 maxFiles，禁止盲目 grep
- **先对比数据，后分析代码**：优先找出数据差异点再反向定位代码

## TODO 纪律

开始前维护 `## Phase 2 TODO` 追踪：
- **飞书模式**：在飞书文档中创建 TODO 节
- **Session 模式**：在对话中维护 TODO 列表

按 `[~]` → `[x]` 规则实时更新。Phase 2 sign-off 前确认 `[ ]` 和 `[~]` 已全部清零。

## 差异对比策略

### 当工单描述 "X 正常，Y 异常" 时

不要先钻进共用代码。先找出 X 和 Y 的数据差异点：

1. **列出差异方调用的所有后端 API**（从前端 network 请求或代码中的 api 调用推断）
2. **请求用户提供两方的 API 响应对比**（curl 或浏览器 Network 抓取）
3. **从响应差异反向定位后端 controller/query** — 通常 5 分钟定位根因
4. **只在确认"双方数据相同但行为不同"时才深入前端代码**

### 反例

花费大量时间分析 FilterSelectContent、RecipientSelector 的前端逻辑，但这段代码对 Owner 和 Collaborator 执行路径完全相同。真正的差异在 `/r/v1/membership/tiers` 的返回值 — 如果一开始就对比这个 API 的响应，根因定位只需 5 分钟。

### 关键检查点

| 差异类型 | 优先检查 |
|---------|---------|
| Owner vs Collaborator | `current_user.sites` vs `current_user.page_collaborators` 作用域 |
| 不同站点 | API 参数中的 `site_id` 过滤逻辑 |
| 不同计划/套餐 | `ConfStore` / rollout flag 的 gon 配置值 |

## 流程

### 1. 获取上下文

**飞书模式**：**Use feishu-agent** → `lark-cli docs +fetch` 读取文档内容。提取 Phase 1 中的：问题描述、复现步骤、livesite URL、问题类型（样式/逻辑/功能）

**Session 模式**：从对话上下文中提取 Phase 1 的摘要和结论。

### 2. 打开 Livesite（如有）

**Use browser-agent**。如果工单提供了 livesite URL，打开并测试。

所有 Playwright 命令使用独立 session `-s=ticket-agent`：

1. `playwright-cli -s=ticket-agent tab-new "<livesite URL>"`
2. `playwright-cli -s=ticket-agent snapshot` — 确认页面结构
3. `playwright-cli -s=ticket-agent console` — 检查控制台错误
4. 根据复现步骤操作，验证问题

### 3. 代码调研 — 搜索策略（必须遵守）

#### 3.1 陈述策略（执行前）

在动手搜索之前，先向用户陈述：

> **调研策略**：
> - 关键词/符号：[列出要搜索的关键词]
> - 搜索方式：[codegraph_explore / codegraph_search / cssgraph_explore]
> - 预期范围：[预估涉及的文件范围]

获得用户确认后再执行。

#### 3.2 搜索约束

| 规则 | 说明 |
|------|------|
| **codegraph_explore 优先** | 一次性获得相关符号和源码，减少 round-trip |
| **maxFiles=8** | explore 的 maxFiles 默认 8，避免上下文爆炸 |
| **禁止全量 grep** | 不执行无路径限制的 grep |
| **先 search 再 explore** | 不确定符号名时，先用 `codegraph_search` 定位，再用 `codegraph_explore` 展开 |
| **样式问题用 cssgraph** | 样式相关 bug 使用 `cssgraph_explore` 追溯 className → CSS 规则 → 组件引用 |
| **不重复验证 codegraph 结果** | codegraph 结果来自 AST 解析，不要用 grep 重新确认 |

#### 3.3 分层递进路径

```
1. codegraph_explore(query="关键词1 关键词2", maxFiles=8)
   ↓ 信息不足时
2. codegraph_search(query="精确符号名") → codegraph_node(symbol, includeCode=true)
   ↓ 涉及调用链时
3. codegraph_callers(symbol) / codegraph_callees(symbol)
   ↓ 样式问题时
4. cssgraph_explore(query="className") → cssgraph_callers(className)
   ↓ 样式被覆盖 / specificity 冲突时
5. cssgraph_cascade(className) → 按 specificity 排序列出所有定义
```

### 4. CSS 布局问题取证门（样式类工单必须）

工单问题涉及 **布局/滚动/高度/溢出/定位/缩放** 时，静态代码分析（cssgraph / 代码审阅）不足以定根因。**必须先跑 DOM Reality Report 取证，拿到真实 DOM 结构 + 计算值，再下根因结论。**

#### 4.1 触发条件（满足任一即触发）

- 问题涉及滚动容器（overflow-y:auto 不滚动 / 滚动条不出现）
- 问题涉及高度链（height:100% / vh / auto 行为异常）
- 问题涉及 `position:fixed` + 百分比高度元素
- 问题只在特定视口 / 缩放 / 浏览器下出现
- 静态分析结论与用户观察冲突（如 cssgraph 判定"锚定良好"但实际不滚）
- flex 布局子项撑破 / 溢出容器

#### 4.2 取证步骤

**Use browser-agent**，命令在 `browser-agent/` 目录执行（session `-s=ticket-agent`）：

```bash
# 1. 打开复现页面（livesite 或编辑器；无登录态时请求用户提供 cookie / 登录）
playwright-cli -s=ticket-agent goto "<复现 URL>"

# 2. 设置报告配置（ROOT_SELECTOR 指向问题根节点，如对话框 / 滚动容器）
playwright-cli -s=ticket-agent eval "() => { window.__DOM_REPORT_CFG = { ROOT_SELECTOR: '.xxx', ZOOM_DIAGNOSIS: true }; return 'ok'; }"

# 3. 运行取证脚本
playwright-cli -s=ticket-agent run-code --filename scripts/dom-report.js
```

#### 4.2b 静态诊断（cssgraph_diagnose）

dom-report.js 拿到 ancestor chain 后，用 `cssgraph_diagnose` 做静态规则分析：

```
cssgraph_diagnose(className="目标class", chain=["div.wrapper", "div.modal", "div.target"])
```

- dom-report.js = **运行时真相**（计算值、实际尺寸）
- cssgraph_diagnose = **静态规则**（声明值分类：DEFINITE / INDEFINITE / UNVERIFIABLE）
- 两者互补：静态分析预判锚点链，运行时验证实际解析结果
- **冲突时以 dom-report.js 为准**，并记入工单

#### 4.2c 浏览器注入验证（CSS 布局类工单必须）

确认根因后、进入 Phase 3 前，**用 `playwright-cli eval` 注入修复样式到浏览器**，实时验证方案是否生效。

**步骤**：

1. 构造修复 CSS，通过 `eval` 注入 `<style>` 标签：
```bash
playwright-cli -s=ticket-agent eval "() => {
  const style = document.createElement('style');
  style.id = 'test-fix';
  style.textContent = \`修复 CSS\`;
  document.head.appendChild(style);
  return 'injected';
}"
```

2. 程序化验证（以滚动问题为例）：
```bash
playwright-cli -s=ticket-agent eval "() => {
  const el = document.querySelector('.滚动容器');
  return JSON.stringify({
    clientHeight: el.clientHeight,
    scrollHeight: el.scrollHeight,
    scrollable: el.scrollHeight > el.clientHeight + 1
  });
}"
```

3. **等待用户人工验证**：提示用户在浏览器中手动操作（滚动、点击等），确认修复生效。程序化验证通过不等于视觉正确。

4. 验证通过后移除测试样式：
```bash
playwright-cli -s=ticket-agent eval "() => { document.getElementById('test-fix')?.remove(); return 'removed'; }"
```

**反模式**：
- ❌ 不等待用户验证就进入 Phase 3（程序化验证可能遗漏视觉问题）
- ❌ 忘记移除测试样式（影响后续操作）

#### 4.3 取证结论规则

- **以真实渲染为准**：报告判定（`✔可滚动` / `⚠高度塌陷` / `⚠内容尺寸永不触发` / `⚠锚点问题`）优先于静态分析。冲突时以报告为准并记入工单。
- **声明值 vs 计算值**：`getComputedStyle().height` 是 used value（px），无法区分 `100%` 与 `2264px`。必须看报告的 **声明值配对**（stylesheets + inline）判断锚点。`max-height` 是上限不是锚，% 子级仍解析为 auto。
- **锚点问题 vs 约束问题**：报告会给出两类判定，修复方向不同：
  - 锚点问题（高度链未受限）→ 给链条某级确定高度（如 `height:100vh`）
  - 约束问题（flex 子项撑破）→ 子项加 `min-height:0`
- **无法取证时**：无登录态 / 页面不可达 → 根因标注 **UNVERIFIABLE**，列出待验证项，禁止断言根因。

#### 4.4 症状 → 假设 → 修复映射（取证后对照）

| 报告标记 | 假设 | 修复方向 |
|---|---|---|
| 滚动容器 `clientHeight=0` + 溢出 | 锚点问题：高度链全 auto/% → 塌陷 | 链条某级确定高度（`height:100vh`） |
| 滚动容器内容尺寸（scrollHeight==clientHeight） | 锚点问题：内容撑开代替受限高度 | 同上，或 flex 中加 `min-height:0` |
| 有溢出但 `overflow=hidden` 裁切 | 锚点问题或父级 overflow 误设 | 检查裁切点是否应滚 |
| 链中有 `CB:transform` + fixed 根节点 | **containing block 劫持**：% 高度相对 transform 祖先 | 视口单位（vh）或去掉 transform |
| flex 子项撑破容器 | 约束问题：`min-height:auto` 默认值 | 子项 `min-height:0` |
| 仅有 `max-height` 无 `height` | 上限 ≠ 锚点，% 子级解析 auto | 给明确 height |

#### 4.5 cssgraph 使用约束

| 工具 | 约束 |
|------|------|
| `cssgraph_diagnose` chain 参数 | 用完整后代选择器（如 `.wrapper .modal`），单类宽匹配会命中无关规则 |
| `cssgraph_impact` / `cssgraph_callers` | 仅追踪 FTS5 排名第一的匹配，多文件同名 class 时需手动补充 |
| `cssgraph_explore` | 不支持复合选择器（`.a.b` / `.a > .b`），复合用 `cssgraph_rule` |
| 跨文件覆盖 | overrides 仅限同文件内，跨文件优先级靠 specificity 排序，不代表实际 cascade |

#### 4.6 高度链推理（CSS 布局类工单必须）

当 dom-report 显示 `height: 100%` 链回退为 content-sized 时，执行以下推理：

**Step 1：列出祖先链高度声明**
从问题节点向上，记录每层：
- height 声明（% / px / vh / auto / 无）
- max-height 声明
- computed height

**Step 2：定位 definite height 断点**
- definite height = 显式 `height` 声明（px / vh / vw）
- **`max-height` ≠ definite height**（CSS 规范：`height:100%` 不依据 `max-height` 解析）
- 无 definite height → `height:100%` = auto = 内容高度
- 找到第一个无 definite height 的祖先 → 断点

**Step 3：修复策略**
- 断点处建立 definite height（`height:100vh`）→ 下游 `height:100%` 恢复传递
- 或用 flex 替代 `height:100%` 链（`flex:1` + `min-height:0`）
- 或两者结合

**反模式（禁止）**：
- ❌ `overflow: hidden` 不能约束 `height:100%` 解析（只裁切内容）
- ❌ `max-height` 不能作为 `height:100%` 的解析基准
- ❌ 在无 definite height 的容器上期望 `height:100%` 生效

### 5. 分析根因

结合代码调研、取证结果（CSS 布局类）和 livesite 测试结果，分析：

- **问题链路**：从触发点到出问题的完整路径
- **根因定位**：具体文件、代码段、逻辑
- **影响范围**：哪些组件/页面/流程受影响
- **CSS 布局类**：根因必须与取证结论一致（锚点问题 / 约束问题 / containing block 劫持），不一致时说明原因

### 6. 输出总结

```
## Phase 2: 调研分析

### 调研策略
- 搜索关键词: ...
- 搜索方式: codegraph_explore / cssgraph_explore

### 相关文件
| 文件 | 说明 |
|------|------|
| apps/.../file.tsx:123 | 问题根因所在 |
| apps/.../style.less:45 | 样式问题 |

### 取证结果（CSS 布局类工单）
- 报告摘要: 滚动容器 xxx 内容尺寸(1280px) → overflow 永不触发 → 锚点问题
- 锚点链: 声明值逐级（% / 绝对单位 / max-height 上限）→ 计算值
- 修复方向: 链条某级 height:100vh（锚点问题）或 min-height:0（约束问题）
- 置信度: 真实渲染取证 / UNVERIFIABLE（阻塞原因: ...）

### 根因
（完整的根因分析）

### 影响面
- ...
```

### 6. 等待 Sign-off

**"Phase 2 完成。根因分析是否准确？调研是否充分？请确认后继续。"**

### 7. Sign-off 后

**飞书模式**：**Use feishu-agent** → `lark-cli docs +update` 追加 `## Phase 2: 调研分析` 到文档。

**Session 模式**：在对话中记录 Phase 2 摘要（保持 Markdown 格式），等待用户指令进入下一 Phase。

### 8. Hard Stop

- Phase 2 完成后停止，不得自动进入 Phase 3
- Sign-off 前确认该 Phase TODO 中 `[ ]` 和 `[~]` 已清零
- 如果 context compression 已开始，先落盘（飞书模式写文档 / Session 模式记录摘要）再停止
