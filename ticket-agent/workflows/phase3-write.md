# Phase 3: 代码编写

## 输入

飞书文档 URL（飞书模式）或对话上下文（Session 模式）

## 流程

### 1. 获取上下文

**飞书模式**：**Use feishu-agent** → `lark-cli docs +fetch` 读取文档。提取：问题描述、livesite URL、根因、相关文件列表

**Session 模式**：从对话上下文中提取 Phase 1-2 的摘要和结论。

### 2. 阅读需要修改的文件

从 Phase 2 的根因分析中，确认需要修改的具体文件和行号。使用 Read 工具读取代码。

### 3. 制定修改方案

向用户陈述：

> **修改方案**：
> - **文件**: `path/to/file.tsx:123`
> - **改动**: 具体修改内容
> - **理由**: 对应 Phase 2 的根因
> - **Heuristics**: [适用条目及处理，如 colors.less 变量 / component-kit 复用 / LESS calc 转义]
> - **影响面**: 这些改动会影响哪些功能

**数据类 bug 修复范围**：根因是脏数据时，先列出该数据的全部写路径与副作用消费链路（cookie / job / callback），逐条确认是否需要同等防御或兜底；只修报错堆栈帧视为方案遗漏。

### 3b. CSS 改动影响面检查

涉及 CSS 修改时，用 cssgraph 评估爆炸半径：

- **单 class 改动**：`cssgraph_impact(className="target-class")` → 查看受影响文件
- **复合选择器改动**：`cssgraph_rule(selector=".parent .target")` → 含相关选择器 + loose/strict 影响
- **仅代码文件**：`cssgraph_impact_selector(selector=".target")` → 过滤出 .js/.ts/.jsx/.tsx

结果纳入修改方案的影响面说明。注意 `cssgraph_impact` 仅追踪 FTS5 第一匹配，多文件同名 class 需手动补充。

### 3c. 重构准入（仅用户明确要求整理代码时）

**AI 不得自动重构**。用户明确要求时，先读 `references/refactor-admission.md`，并在动手前完成：

1. **范围与非目标**：复述"写法乱"具体指什么（命名 / 结构 / 去重 / 死代码），列出不改的语义与文件
2. **改动前代码分支清单**（代码条件分支，不是 git 分支）：

   | # | 文件:行 | 条件 | 返回/行为 |
   |---|---------|------|-----------|

3. **意图考古**：对每个将被删除/合并的分支执行 `git log -L <start>,<end>:<file>` / `git blame`；24 小时内新增的防御代码默认保留
4. **改动后分支清单与映射**：

   | # | 旧分支 | 新分支对应 | 处理（保留/合并/删除） | 证据 |
   |---|--------|------------|------------------------|------|

   旧清单每条必须有映射；删除项必须给出输入不可达证明；新清单不得出现清单外的新行为
5. **等价性矩阵**：至少覆盖正常值 / `undefined` / `null` / `''` / SSR / CSR / 特殊页 / 普通页
6. **用户确认后动手**；commit 用 `refactor:` 前缀，建议新开分支，当前任务分支亦可但不得与 fix/feat 混合

禁止：三元 / `&&` / optional chaining 吞掉 early-return 守卫；合并语义不同的分支；以"看起来冗余"为由删除无注释判空。

### 3d. 异常处理设计（改动包含 try/catch / rescue / error boundary / 异步错误处理时必做）

编码前先输出「失败模式表」，再决定 rescue 边界：

| # | 受保护语句 | 可能异常 | 是否预期 | 处理方式 | 吞掉后果 | 是否上报 |
|---|-----------|---------|---------|---------|---------|---------|

规则：

- **按失败点划边界**：只包可能抛预期异常的调用；禁止为了少改几行把整段 block 包住。rescue 的范围就是可观测性的边界，也是未来新增代码的误伤范围。
- **禁止异常大类兜底**：`rescue => e` / `rescue ActiveRecord::RecordInvalid` / `catch (e)` 必须收窄到具体调用、record / 字段 / 错误码，或只包具体调用。
- **吞异常必须说明影响**：状态是否一致、后续是否重试、是否需要 Bugsnag / 日志；不能只写"跳过"。
- **对齐同级实现**：先找同目录 / 同类型的错误处理范式（如 `CheckStatusJob` 的窄 rescue + `ExceptionGateway.alert`），再动手。
- 有意的宽捕获必须在 Phase 3 sign-off 前单独列出并获用户确认。

### 3e. Rails 后端影响面检查（仅 bobcat 后端/全栈改动）

改动后端文件前，用 RailsInsight 核对 Rails 语义与影响面：

- **影响面**：优先 `railsinsight_bobcat_get_review_context(files=[...])` 拿受控摘要；需要完整风险分级/受影响测试时用 `railsinsight_bobcat_get_blast_radius(files=[...], max_depth=1)`（大输出易挤爆上下文，预算见 `references/railsinsight-tools.md`）。用 `codegraph_impact` 交叉符号级影响
- **model**：`railsinsight_bobcat_get_model(name)` → 确认 associations、validations、callbacks、concerns、columns；不要漏掉 through / polymorphic 关联（大 model 只摘关键字段）
- **controller**：`railsinsight_bobcat_get_controller(name)` → 确认 actions、filters、strong params、rescue；继承 filter 需沿父 controller 链核对（如 `Admin::ApplicationController`）
- **跨模块**：涉及鉴权 / Job / 邮件 / 存储 / API 时，用 `railsinsight_bobcat_get_subgraph` 或 `get_deep_analysis` 补上下文
- **测试**：需要新增/调整 spec 时，`get_test_conventions` + `get_factory_registry`；需要范例时 `get_well_tested_examples`
- **刷新**：改完代码后、最终验证前调 `railsinsight_bobcat_index_project`；再复查 `get_review_context`

结果写入修改方案的「影响面」；RailsInsight 为实验性 regex 结果，关键结论用 codegraph / Read 复核。工具手册见 `references/railsinsight-tools.md`。

### 4. 编写代码

注意事项：

- **遵循项目代码风格**：阅读周边代码，保持一致的命名、缩进、模式
  - 普通 TS/Jest 测试模块命名用 snake_case（如 `is_section_hidden.test.ts`）；Jest `__tests__/**/*.test.ts?(x)` 仍匹配，生产模块路径无需改动
  - 模块命名空间 import 用 lowerCamelCase（如 `import * as editorStore`），不用 PascalCase；`jest.mock` 路径保持不变，引用同步改小驼峰
- **应用项目 Heuristics**：对照 `phase2-investigate.md` 的「项目 Heuristics」全表，编写前逐条判断适用性
  - 颜色优先 `fe/styles/strikingly_shared/colors.less` 现有变量，不新增硬编码色值
  - 基础控件（Input / Tab / CheckBox / Radio / Button / Card / Carousel / Tag）先查 `component-kit` 复用
  - LESS 文件中的 `calc()` 用转义写法 `~'calc(100% - 12px)'`
  - 不在 Angular.js / Haml 中新增代码，除非修复必须落在现有 legacy 页面内
- **样式修改考虑响应式**：CSS 改动需兼容移动端
- **不添加无关改动**：diff 只包含本次修复
- **复用已有工具/方法**：优先使用项目已有的工具函数

### 4.1 测试契约（行为变更 / 异常处理必做）

测试必须证明行为，不镜像实现：

- **副作用断言**：被处理的后续对象真实写入预期字段 / 发起预期调用（如 `site.update!`、enqueue）。
- **负向断言**：被跳过的对象没有写入 / 入队。
- **异常传播断言**：非预期异常没有被吞掉，能抛到上层（Sidekiq / Bugsnag / 调用方）。
- **fixture 独立**：不同连接 / 对象使用独立替身，避免共享状态掩盖分支。
- **覆盖状态机分支**：至少覆盖正常分支和异常分支，不要只测 rescue 本身。
- 每个测试自问："如果实现写错了，这个测试会不会红？"

### 5. 自检清单

- [ ] diff 是否只包含必要改动
- [ ] 是否存在自动重构 / 顺手清理（应为 0）
- [ ] 若含重构：改动前代码分支清单已确认
- [ ] 若含重构：旧/新分支清单逐条对上，删除项有不可达证明
- [ ] 若含重构：等价性矩阵已执行（含 undefined / null / '' / SSR / CSR）
- [ ] "No behavior change" 是否有证据支撑
- [ ] SSR 改动是否列出 payload 字段缺失时的行为
- [ ] 样式是否兼容移动端
- [ ] 颜色是否复用 `colors.less` 变量（无新增硬编码色值）
- [ ] 基础控件是否检查过 `component-kit` 复用
- [ ] LESS 文件中的 `calc()` 是否使用 `~'calc(...)'` 转义写法
- [ ] 是否存在硬编码值
- [ ] 是否复用了已有代码
- [ ] 是否考虑了边界情况
- [ ] 若含异常处理：失败模式表已完成，rescue 边界按失败点划定
- [ ] 若含异常处理：异常类型已收窄，未用大类兜底，吞掉后果已说明
- [ ] 若含异常处理：已对齐同级实现的错误处理范式
- [ ] 测试包含副作用 / 负向 / 异常传播断言，fixture 独立
- [ ] spec 引用的常量 / gem 在 test 环境可用（核对 Gemfile 分组；环境不加载时注入替身而非直接引用，如 Bugsnag 仅 staging / production / uat 组）
- [ ] bobcat 后端改动已用 `railsinsight_bobcat_get_review_context` / `railsinsight_bobcat_get_blast_radius` 核对影响面与受影响测试，改完后已 `railsinsight_bobcat_index_project` 刷新
- [ ] 已用工作台根 `references/bobcat-mr-final-review-be-template.md` 的 System Robustness 自审（如适用）
- [ ] lint 不可用时已执行行宽 / 对齐 / `git diff --check` 人工兜底；未执行项未勾选
- [ ] 已用 review 分诊标准自审 diff：是否超出工单范围、是否过度设计、是否引入历史问题

### 6. 输出总结

```
## Phase 3: 解决方案

### 修改文件

| 文件 | 改动说明 |
|------|---------|
| fe/nextgen/apps/.../file.tsx | 修改xxx |
| fe/nextgen/apps/.../style.less | 添加xxx样式 |

### 方案描述
（代码修改的具体思路）

### 影响面
- 功能影响: ...
- 页面/组件影响: ...
- 回归风险: ...

### 异常处理设计（如有）
| 失败点 | 异常 | 处理 | 吞掉后果 | 上报 |
|--------|------|------|----------|------|

### 测试契约
- 副作用:
- 负向:
- 异常传播:
```

### 7. 等待 Sign-off

**"Phase 3 完成。代码修改方案是否 OK？是否有遗漏？请确认后继续。"**

### 8. Sign-off 后

**飞书模式**：**Use feishu-agent** → `lark-cli docs +update` 追加 `## Phase 3: 解决方案` 到文档。

**Session 模式**：在对话中记录 Phase 3 摘要（保持 Markdown 格式），等待用户指令进入下一 Phase。
