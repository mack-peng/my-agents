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

Phase 2 TODO 至少包含：陈述调研策略并获确认 / 项目 heuristics 适用性判断 / 符号定位 / 根因分析。

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

## 项目 Heuristics（strk-code-guidelines）

以下经验规则提炼自 STRK 共享代码指南（strk-code-guidelines，源：agent-rnd-skills），是**高概率提示，不是硬规则**：

- **判定优先**：每条先对照工单现状、现有代码、repo 惯例和工程 tradeoff 判断是否适用
- 适用 → 纳入调研结论和影响面分析
- 不适用 → 在 Phase 2 输出的 `Heuristics` 一行说明理由，禁止机械套用

### 代码定位（bobcat）

bobcat 迭代多年，同一功能可能存在多个相似的 legacy 实现。**不要因名称、路径或表面结构相似就盲选目标实现。**

确认"当前在用路径"的手段（按优先级）：

1. **技术栈演进**：Rails Haml + Knockout → Haml + Angular → React；缺少反证时，更新技术栈中的实现更可能是在用路径
2. **git 信息**：相关代码块、文件或路由的最近修改时间、作者、commit message、关联 MR
3. **可达性**：路由、入口、feature flag、埋点、API 调用、store/state 连接、模板引用、构建入口
4. **业务归属**：多个候选服务于不同业务模块时，先识别本工单的模块归属，再决定复用、扩展或新增位置

**仍无法确认 → 在 Phase 2 输出中列为不确定点并询问用户，不得随意选一个相似位置作为事实依据。**

### 领域提示

| 领域 | 提示 |
|------|------|
| 颜色 | 优先查 `fe/styles/strikingly_shared/colors.less` 现有变量；新增十六进制色值按现有命名风格加语义化变量；`rgb()` / `rgba()` 可直接用 |
| 基础控件 | Input / Tab / CheckBox / Radio / Button / Card / Carousel / Tag 优先复用 `component-kit`；视觉差异在其上做 CSS 调整而非新增替代组件；复用候选必须看实际实现和调用上下文，禁止凭名称/签名判断 |
| LESS `calc()` | 使用转义写法 `~'calc(100% - 12px)'` |
| 新增前端代码 | 避免引入 Angular.js / Haml（legacy surface），除非修复必须落在现有 legacy 页面内 |
| 监控 | 未知或意外错误接入监控路径（如 Bugsnag），避免泄漏敏感数据 |
| 兼容性 | 除非工单明确排除 mobile，按 375x667 基线检查布局、点击、表单、弹窗和 loading/error/empty；涉及 WMP / 微信时检查体积限制 |
| 前端性能 | 单个 expensive UI 区域 >100 child nodes 检查 re-render / 虚拟化；1 分钟内重复同类请求检查缓存、节流或去重 |
| 依赖体积 | 新增前端依赖 >10KB gzipped 需说明收益、替代方案与 bundle 影响 |
| 后端 IO | 避免 `select *`；join >3 表检查索引或拆查；批量写入用 batch；第三方只读数据非实时则考虑本地 copy/cache；复杂度 >O(n*n) 或内存 >O(n) 需说明数据规模依据 |
| 文件上传 | 参考 S3 presigned URL 模式：后端鉴权 + 生成授权 + 业务元数据，客户端直传对象存储，上传流不经后端 |

> 常见例外（不适用时按同一口径记录理由）：现有页面已用另一套局部组件体系、mockup 明确要求特殊视觉、数据规模有明确上限、强实时一致性是产品要求、现有路径改造收益明显更高。

## 流程

### 1. 获取上下文

**飞书模式**：**Use feishu-agent** → `lark-cli docs +fetch` 读取文档内容。提取 Phase 1 中的：问题描述、复现步骤、livesite URL、问题类型（样式/逻辑/功能）

**Session 模式**：从对话上下文中提取 Phase 1 的摘要和结论。

### 2. 判断问题类型

工单问题涉及 **布局/滚动/高度/溢出/定位/缩放** 时，进入 **Phase 2b: CSS 布局取证**。

触发条件（满足任一即触发）：
- 问题涉及滚动容器（overflow-y:auto 不滚动 / 滚动条不出现）
- 问题涉及高度链（height:100% / vh / auto 行为异常）
- 问题涉及 `position:fixed` + 百分比高度元素
- 问题只在特定视口 / 缩放 / 浏览器下出现
- flex 布局子项撑破 / 溢出容器
- 用户描述 "无法滚动" / "显示不全" / "被截断" / "看不到底部"

**布局类工单** → **必须**进入 Phase 2b（详见 `workflows/phase2b-css-forensics.md`）。Phase 2b 包含 cssprobe-agent 运行时取证（必须步骤），完成后回到步骤 4（分析根因）。

**非布局类工单**（逻辑 bug / API 问题 / 功能缺失）→ 跳过 Phase 2b，直接步骤 3。

### 3. 打开 Livesite（如有）

**Use cssprobe-agent**。如果工单提供了 livesite URL，按 cssprobe-agent 流程交互式完成诊断：

1. 告知用户诊断目标（URL、检查内容、目标 selector）
2. cssprobe-agent 引导用户打开页面、完成登录、执行复现步骤
3. cssprobe-agent 执行检查并用通俗中文解读结果
4. 等待用户确认诊断结果

### 4. 代码调研 — 搜索策略（必须遵守）

#### 4.1 陈述策略（执行前）

在动手搜索之前，先向用户陈述：

> **调研策略**：
> - 关键词/符号：[列出要搜索的关键词]
> - 搜索方式：[codegraph_explore / codegraph_search / cssgraph_diagnose / cssgraph_explore]
> - Heuristics：[对照「项目 Heuristics」列出拟参考的条目，如 bobcat 代码定位 / component-kit 复用 / 后端 IO]
> - 取证手段：[运行时取证/验证方式，如注入 scrollTo 监听抓调用栈、route abort 修改加载时序、dom-report 等]
> - 预期范围：[预估涉及的文件范围]

获得用户确认后再执行。

#### 4.2 搜索约束

| 规则 | 说明 |
|------|------|
| **codegraph_explore 优先** | 一次性获得相关符号和源码，减少 round-trip |
| **maxFiles=8** | explore 的 maxFiles 默认 8，避免上下文爆炸 |
| **禁止全量 grep** | 不执行无路径限制的 grep |
| **先 search 再 explore** | 不确定符号名时，先用 `codegraph_search` 定位，再用 `codegraph_explore` 展开 |
| **布局/滚动问题用 cssgraph_diagnose** | 使用完整 CSS 选择器（如 `.wrapper .modal-body`），分析高度链锚点和 overflow 裁切 |
| **样式覆盖/引用问题用 cssgraph_explore** | 追溯 className → CSS 规则 → 组件引用 |
| **不重复验证 codegraph 结果** | codegraph 结果来自 AST 解析，不要用 grep 重新确认 |

#### 4.3 分层递进路径

```
1. codegraph_explore(query="关键词1 关键词2", maxFiles=8)
   ↓ 信息不足时
2. codegraph_search(query="精确符号名") → codegraph_node(symbol, includeCode=true)
   ↓ 涉及调用链时
3. codegraph_callers(symbol) / codegraph_callees(symbol)
   ↓ 样式问题时
4. cssgraph_diagnose(className=".target", chain=[".wrapper .parent1", ".wrapper .parent2 .target"])
   ↓ 需要样式覆盖/引用信息时
5. cssgraph_explore(query="className") → cssgraph_callers(className)
   ↓ specificity 冲突时
6. cssgraph_cascade(className) → 按 specificity 排序列出所有定义
```

### 5. 分析根因

结合代码调研、取证结果（CSS 布局类）和 livesite 测试结果，分析：

- **问题链路**：从触发点到出问题的完整路径
- **根因定位**：具体文件、代码段、逻辑
- **Heuristics 适用性**：对照「项目 Heuristics」判断适用条目是否改变根因或影响面结论；不适用的条目一句话说明理由
- **影响范围**：哪些组件/页面/流程受影响
- **CSS 布局类**：根因必须与取证结论一致（锚点问题 / 约束问题 / containing block 劫持），不一致时说明原因

### 6. 输出总结

```
## Phase 2: 调研分析

### 调研策略
- 搜索关键词: ...
- 搜索方式: codegraph_explore / cssgraph_diagnose / cssgraph_explore
- Heuristics: 适用条目及结论（不适用时给简短理由）

### 相关文件
| 文件 | 说明 |
|------|------|
| apps/.../file.tsx:123 | 问题根因所在 |
| apps/.../style.less:45 | 样式问题 |

### 取证结果（如有 Phase 2b）
- 引用 Phase 2b 的根因结论
- 修复方向: ...

### 根因
（完整的根因分析）

### 影响面
- ...
```

### 7. 等待 Sign-off

**"Phase 2 完成。根因分析是否准确？调研是否充分？请确认后继续。"**

### 8. Sign-off 后

**飞书模式**：**Use feishu-agent** → `lark-cli docs +update` 追加 `## Phase 2: 调研分析` 到文档。

**Session 模式**：在对话中记录 Phase 2 摘要（保持 Markdown 格式），等待用户指令进入下一 Phase。

### 9. Hard Stop

- Phase 2 完成后停止，不得自动进入 Phase 3
- Sign-off 前确认该 Phase TODO 中 `[ ]` 和 `[~]` 已清零
- 如果 context compression 已开始，先落盘（飞书模式写文档 / Session 模式记录摘要）再停止
