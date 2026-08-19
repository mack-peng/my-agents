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

## 流程

### 1. DOM Reality Report（运行时真相）

**Use browser-agent**。命令在 `browser-agent/` 目录执行（session `-s=ticket-agent`）：

```bash
# 1. 打开复现页面（livesite 或编辑器；无登录态时请求用户提供 cookie / 登录）
playwright-cli -s=ticket-agent goto "<复现 URL>"

# 2. 设置报告配置（ROOT_SELECTOR 指向问题根节点，如对话框 / 滚动容器）
playwright-cli -s=ticket-agent eval "() => { window.__DOM_REPORT_CFG = { ROOT_SELECTOR: '.xxx', ZOOM_DIAGNOSIS: false }; return 'ok'; }"

# 3. 运行取证脚本（构建产物，源码在 /Users/mack/Open-projects/dom-report/）
playwright-cli -s=ticket-agent run-code --filename scripts/dom-report.js
```

**提取关键数据**：
- 祖先链中每个节点的 className（用于步骤 2）
- scrollHeight vs clientHeight（判断是否可滚动）
- overflow flags（标记溢出节点）
- bottom 位置（判断元素是否在可视区外）

### 2. cssgraph_diagnose（静态规则）

从步骤 1 的 dom-report 输出中提取祖先链 className，构造完整后代选择器：

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

| dom-report | cssgraph | 结论 |
|---|---|---|
| 无锚点 | 有锚点(DEFINITE) | 以 cssgraph 的文件定位为准，以 dom-report 的实际尺寸为准 |
| 可滚动 | UNVERIFIABLE | 以 dom-report 为准 |
| 不可滚动 | DEFINITE锚点 | 检查 CB 劫持或 overflow 裁切 |
| 无锚点 | 无锚点 | 确认无锚点，需要修复 |

**冲突规则**：dom-report 与 cssgraph 冲突时，**以 dom-report（运行时）为准**，cssgraph 补充文件定位。

### 4. 浏览器注入验证

根据对比结论构造修复 CSS，注入浏览器验证：

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
- ❌ 不等待用户验证就进入 Phase 3
- ❌ 忘记移除测试样式

### 5. 根因结论

综合步骤 1~4 的数据，输出根因结论：

| 报告标记 | 假设 | 修复方向 |
|---|---|---|
| 滚动容器 `clientHeight=0` + 溢出 | 锚点问题：高度链全 auto/% → 塌陷 | 链条某级确定高度（`height:100vh`） |
| 滚动容器内容尺寸（scrollHeight==clientHeight） | 锚点问题：内容撑开代替受限高度 | 同上，或 flex 中加 `min-height:0` |
| 有溢出但 `overflow=hidden` 裁切 | 锚点问题或父级 overflow 误设 | 检查裁切点是否应滚 |
| 链中有 `CB:transform` + fixed 根节点 | **containing block 劫持**：% 高度相对 transform 祖先 | 视口单位（vh）或去掉 transform |
| flex 子项撑破容器 | 约束问题：`min-height:auto` 默认值 | 子项 `min-height:0` |
| 仅有 `max-height` 无 `height` | 上限 ≠ 锚点，% 子级解析 auto | 给明确 height |

### 6. 输出总结

```
## Phase 2b: CSS 布局取证

### DOM Reality Report
- 根节点: .xxx
- 可滚动: ✔/⚠
- scrollHeight: Xpx, clientHeight: Ypx
- 溢出节点: ...

### cssgraph_diagnose
- 锚点: 有/无 (DEFINITE/UNVERIFIABLE)
- 声明值来源: file.less:123
- CB modifiers: ...

### 对比结论
- 冲突: 是/否
- 以 dom-report/cssgraph 为准

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
- dom-report 与 cssgraph 冲突时，以 dom-report 为准
- 无登录态时根因标注 UNVERIFIABLE，禁止断言
