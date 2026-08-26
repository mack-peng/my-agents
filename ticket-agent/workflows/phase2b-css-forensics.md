# Phase 2b: CSS 布局取证

## 触发条件

仅当 Phase 2 步骤 2 判断为布局/滚动类工单时适用。**Phase 2 步骤 2 后不自动触发**，由协调器引导用户进入。

触发关键词（满足任一）：
- 问题涉及滚动容器（overflow-y:auto 不滚动 / 滚动条不出现）
- 问题涉及高度链（height:100% / vh / auto 行为异常）
- 问题涉及 `position:fixed` + 百分比高度元素
- 问题只在特定视口 / 缩放 / 浏览器下出现
- flex 布局子项撑破 / 溢出容器
- 用户描述 "无法滚动" / "显示不全" / "被截断" / "看不到底部"

**非布局类工单**（逻辑 bug / API 问题 / 功能缺失）→ 跳过 Phase 2b，Phase 2 直接步骤 3。

## 前置条件

- Phase 2 步骤 1（获取上下文）已完成
- 有可复现的页面 URL（livesite 或编辑器）
- 有登录态（无登录态时标注 UNVERIFIABLE，禁止断言根因）
- `cssprobe-cli` 已安装（`npm install -g cssprobe-cli`）
- cssprobe-cli 运行时取证是**必须步骤**，不可跳过。无登录态时标注 UNVERIFIABLE，禁止仅凭静态分析断言根因

## 流程

### 1. cssprobe-agent 运行时取证（必须）

**首先阅读 `cssprobe-agent/AGENTS.md`**，了解 cssprobe-agent 的角色、诊断能力和对话流程。然后**按 cssprobe-agent 的流程引导用户完成运行时取证**。

**交互步骤**（必须按顺序执行，每步等待用户确认）：

1. **告知用户诊断目标**：
   - 页面 URL：[复现 URL]
   - 检查目标：[问题描述，如"滚动不工作""弹窗显示不全"]
   - 目标元素 selector：[目标选择器]

2. **打开页面**（如需登录，引导用户完成）：
   ```bash
   cssprobe-cli open <url> --state <state-file> --headed
   ```
   等待用户确认页面已加载。

3. **引导用户操作**（如打开弹窗、点击按钮等）：
   > "请在浏览器中打开版本历史对话框，完成后告诉我。"

4. **执行检查**：
   ```bash
   cssprobe-cli inspect <selector>
   cssprobe-cli findings <selector>
   cssprobe-cli layout <selector>
   ```

5. **呈现结果给用户**，用通俗中文解读。

6. **运行时取证 Sign-off**（必须）：
   > **"cssprobe-cli 运行时取证完成。请确认以下结果是否准确：**
   > - [列出关键发现]
   > - [列出 scrollHeight vs clientHeight]
   > **回复 OK 继续，或指出问题重新检查。"**

**从返回结果中提取关键数据**：

从**祖先链**提取：
- 每个节点的 className（用于步骤 2 cssgraph_diagnose）
- 元素尺寸和位置信息

从 **Findings** 提取：
- `id`: finding 类型（如 overflow-clipped, scrollable 等）
- `confidence`: DEFINITE / INDEFINITE / UNVERIFIABLE
- `message`: 问题描述
- `evidence`: computed 值证据（scrollHeight、clientHeight 等）
- `location`: 涉及的 DOM 元素

从**布局图**提取：
- 元素嵌套结构和尺寸
- 溢出标记（⚠）

### 2. cssgraph_diagnose（静态规则）

从步骤 1 的 cssprobe-agent 返回结果中提取祖先链 className，构造完整后代选择器：

```bash
cd $BOBKAT_PATH
cssgraph diagnose ".目标class" \
  ".祖先1 .祖先2" \
  ".祖先1 .祖先2 .祖先3" \
  ".祖先1 .祖先2 .祖先3 .目标class"
```

**提取关键数据**：
- DEFINITE / INDEFINITE / UNVERIFIABLE 分类
- 声明值来源（文件:行号）
- CB modifiers（containing block 修改器）
- 锚点位置

### 3. 对比分析

| cssprobe-cli | cssgraph | 结论 |
|---|---|---|
| 无锚点 | 有锚点(DEFINITE) | 以 cssgraph 的文件定位为准，以 cssprobe-cli 的实际尺寸为准 |
| 可滚动 | UNVERIFIABLE | 以 cssprobe-cli 为准 |
| 不可滚动 | DEFINITE锚点 | 检查 CB 劫持或 overflow 裁切 |
| 无锚点 | 无锚点 | 确认无锚点，需要修复 |

**冲突规则**：cssprobe-cli 与 cssgraph 冲突时，**以 cssprobe-cli（运行时）为准**，cssgraph 补充文件定位。

### 4. 浏览器注入验证

根据对比结论构造修复 CSS，注入浏览器验证。**使用 cssprobe-cli，不使用 playwright-cli**。

1. 构造修复 CSS，通过 `inject-css` 注入：
```bash
cssprobe-cli inject-css "修复 CSS"
```

2. 程序化验证（以滚动问题为例）：
```bash
cssprobe-cli eval "(() => {
  const el = document.querySelector('.滚动容器');
  return JSON.stringify({
    clientHeight: el.clientHeight,
    scrollHeight: el.scrollHeight,
    scrollable: el.scrollHeight > el.clientHeight + 1
  });
})()"
```

3. **等待用户人工验证**：提示用户在浏览器中手动操作（滚动、点击等），确认修复生效。程序化验证通过不等于视觉正确。

4. 验证通过后移除测试样式：
```bash
cssprobe-cli eval "(() => { document.getElementById('cssprobe-injected-style')?.remove(); return 'removed'; })()"
```

**反模式**：
- ❌ 不等待用户验证就进入 Phase 3
- ❌ 忘记移除测试样式
- ❌ 使用 playwright-cli 注入 CSS（应使用 cssprobe-cli inject-css / eval）

### 4.5 高度链锚点分析

**在提出修复方案前，必须先追溯高度链，确认锚点位置。** 从问题元素向上追溯到根节点，标记每一级的 height 声明值和解析方式：

```
问题元素 (.version-history)
  ↑ overflow-y: auto，但需要父级有约束高度
父级 (.version-container)
  ↑ height: 100%，依赖父级
祖父级 (.site-version-history-panel)
  ↑ height: 100%，依赖父级
...一直追溯到链条顶端
```

**锚点判断规则**：

| height 声明 | 是否锚点 | 原因 |
|---|---|---|
| `100vh` / `vh` 单位 | ✔ 锚点 | 视口相对，不依赖父级 |
| `px` 固定值 | ✔ 锚点 | 绝对值，不依赖父级 |
| `100%` | ❌ 不是锚点 | 依赖父级高度，链式塌陷 |
| `auto` / 无声明 | ❌ 不是锚点 | 由内容决定 |
| `flex: 1` | ❌ 不是锚点 | 分配空间，但需要容器有约束高度 |
| `min-height: 0` | ❌ 不是锚点 | 允许收缩，但需要容器有约束高度 |

**核心规则**：
- 链条中有锚点 → 可以用 flex/min-height 等布局技巧分配空间
- 链条中无锚点 → **必须在某一级提供锚点**（vh 或 px），否则任何布局技巧都无效
- 修复方案必须在**链条上游**提供锚点，而不是在下游用 flex/min-height

### 5. 根因结论

综合步骤 1~4.5 的数据，输出根因结论：

| 报告标记 | 假设 | 修复方向 |
|---|---|---|
| 滚动容器 `clientHeight=0` + 溢出 | 锚点问题：高度链全 auto/% → 塌陷 | 链条某级确定高度（`height:100vh`） |
| 滚动容器内容尺寸（scrollHeight==clientHeight） | 锚点问题：内容撑开代替受限高度 | 链条某级确定高度（`height:100vh`） |
| 有溢出但 `overflow=hidden` 裁切 | 锚点问题或父级 overflow 误设 | 检查裁切点是否应滚 |
| 链中有 `CB:transform` + fixed 根节点 | **containing block 劫持**：% 高度相对 transform 祖先 | 视口单位（vh）或去掉 transform |
| flex 子项撑破容器 | 约束问题：`min-height:auto` 默认值 | 子项 `min-height:0`（需链条有锚点） |
| 仅有 `max-height` 无 `height` | 上限 ≠ 锚点，% 子级解析 auto | 给明确 height |

### 6. 输出总结

```
## Phase 2b: CSS 布局取证

### cssprobe-cli 报告
- 根节点: .xxx
- 可滚动: ✔/⚠
- scrollHeight: Xpx, clientHeight: Ypx
- 溢出节点: ...
- 置信度: DEFINITE N | INDEFINITE N | UNVERIFIABLE N

### cssgraph_diagnose
- 锚点: 有/无 (DEFINITE/UNVERIFIABLE)
- 声明值来源: file.less:123
- CB modifiers: ...

### 对比结论
- 冲突: 是/否
- 以 cssprobe-cli/cssgraph 为准

### 修复方案
- 修改文件: ...
- 修改内容: ...
- 注入验证: ✔/⚠

### 根因
（完整根因分析）

### 置信度
真实渲染取证 / UNVERIFIABLE（阻塞原因: ...）
```

### 7. 等待 Sign-off

> **"Phase 2b 完成。CSS 布局取证结果是否准确？修复方案是否可行？请确认后继续。"**

---

## 飞书模式：Sign-off 后

**Use feishu-agent** → `lark-cli docs +update` 追加 `## Phase 2b: CSS 布局取证` 到文档。

## Session 模式：Sign-off 后

在对话中记录 Phase 2b 摘要（保持 Markdown 格式），等待用户指令回到 Phase 2 步骤 4。

## 硬规则

- Phase 2b 完成后停止，不得自动回到 Phase 2
- Sign-off 前确认该 Phase TODO 中 `[ ]` 和 `[~]` 已清零
- cssprobe-cli 与 cssgraph 冲突时，以 cssprobe-cli 为准
- 无登录态时根因标注 UNVERIFIABLE，禁止断言

## 反模式

### ❌ 无锚点时用 flex/min-height 修复高度问题

`flex: 1` 和 `min-height: 0` 是**空间分配技巧**，不是**锚点**。它们需要父级有约束高度才能生效。

错误示例：
```css
/* 父级链全是 height: 100%，无锚点 */
.container { height: 100%; }
.child { height: 100%; }
.scroll-area { flex: 1; min-height: 0; } /* ❌ 无效，容器无约束高度 */
```

正确示例：
```css
/* 在链条某级提供锚点 */
.container { height: 100vh; } /* ✔ 视口锚点 */
.child { height: 100%; }      /* 解析为 100vh */
.scroll-area { overflow-y: auto; } /* 有约束高度，滚动生效 */
```

### ❌ 使用 playwright-cli 注入 CSS

ticket-agent 不直接使用 playwright-cli。CSS 注入使用 `cssprobe-cli inject-css`，验证使用 `cssprobe-cli eval`。

### ❌ 不做高度链锚点分析就提出修复方案

必须先追溯高度链（Step 4.5），确认锚点位置，再提出修复方案。跳过锚点分析容易提出无效方案。
