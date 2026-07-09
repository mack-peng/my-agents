# Phase 2: 调研分析

## 输入

飞书文档 URL

## 核心原则

- **精准搜索，拒绝泛读**：先定位再展开，避免全量代码扫描
- **约束上下文预算**：优先 codegraph，限制 maxFiles=8，禁止盲目 grep
- **分层递进**：代码架构总览 → 关键符号定位 → 精准读码

## 流程

### 1. 读取飞书文档

**Use feishu-agent** → `lark-cli docs +fetch` 读取文档内容。

提取 Phase 1 中的：问题描述、复现步骤、livesite URL、问题类型（样式/逻辑/功能）

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
```

### 4. 分析根因

结合代码调研和 livesite 测试结果，分析：

- **问题链路**：从触发点到出问题的完整路径
- **根因定位**：具体文件、代码段、逻辑
- **影响范围**：哪些组件/页面/流程受影响

### 5. 输出总结

```
## Phase 2: 调研分析

### 调研策略
- 搜索关键词: ...
- 搜索方式: codegraph_explore / cssgraph_explore

### 相关文件
| 文件 | 说明 |
|------|------|
| fe/nextgen/apps/.../file.tsx:123 | 问题根因所在 |
| fe/nextgen/apps/.../style.less:45 | 样式问题 |

### 根因
（完整的根因分析）

### 影响面
- ...
```

### 6. 等待 Sign-off

**"Phase 2 完成。根因分析是否准确？调研是否充分？请确认后继续。"**

### 7. Sign-off 后：追加飞书文档

**Use feishu-agent** → `lark-cli docs +update` 追加 `## Phase 2: 调研分析` 到文档。
