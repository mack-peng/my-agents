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
> - **影响面**: 这些改动会影响哪些功能

### 3b. CSS 改动影响面检查

涉及 CSS 修改时，用 cssgraph 评估爆炸半径：

- **单 class 改动**：`cssgraph_impact(className="target-class")` → 查看受影响文件
- **复合选择器改动**：`cssgraph_rule(selector=".parent .target")` → 含相关选择器 + loose/strict 影响
- **仅代码文件**：`cssgraph_impact_selector(selector=".target")` → 过滤出 .js/.ts/.jsx/.tsx

结果纳入修改方案的影响面说明。注意 `cssgraph_impact` 仅追踪 FTS5 第一匹配，多文件同名 class 需手动补充。

### 4. 编写代码

注意事项：

- **遵循项目代码风格**：阅读周边代码，保持一致的命名、缩进、模式
- **样式修改考虑响应式**：CSS 改动需兼容移动端
- **不添加无关改动**：diff 只包含本次修复
- **复用已有工具/方法**：优先使用项目已有的工具函数

### 5. 自检清单

- [ ] diff 是否只包含必要改动
- [ ] 样式是否兼容移动端
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
