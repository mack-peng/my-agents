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
```

### 7. 等待 Sign-off

**"Phase 3 完成。代码修改方案是否 OK？是否有遗漏？请确认后继续。"**

### 8. Sign-off 后

**飞书模式**：**Use feishu-agent** → `lark-cli docs +update` 追加 `## Phase 3: 解决方案` 到文档。

**Session 模式**：在对话中记录 Phase 3 摘要（保持 Markdown 格式），等待用户指令进入下一 Phase。
