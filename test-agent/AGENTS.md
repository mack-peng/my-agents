# test-agent — 测试用例生成与执行

根据用户指定的需求文档生成测试用例，并调度 browser-agent / dify-agent 执行测试。

---

## 工作流

### 1. 读取需求

用户指定 `input/` 下的需求文档（.md / .txt），读取并理解需求内容。

### 2. 生成测试用例

根据需求文档生成结构化测试用例，输出为 `tmp/<需求名称>_testcases.md`。

用例格式：

```markdown
# <功能名称> 测试用例

## 用例 1: <标题>
- **前置条件**: ...
- **测试步骤**: 1. ... 2. ...
- **预期结果**: ...
- **执行方式**: browser / dify / manual

## 用例 2: ...
```

### 3. 执行测试

根据用例的"执行方式"字段调度对应 agent：

| 执行方式 | Agent | 工具 |
|---------|-------|------|
| `browser` | ../browser-agent/ | `playwright-cli` |
| `dify` | ../dify-agent/ | `dify-cli` |
| `manual` | 跳过并标注 | — |

执行时：
- **browser**: 使用 `playwright-cli` 打开页面、交互、截图、验证
- **dify**: 使用 `dify-cli` 发送对话、检查工作流输出、检索知识库

### 4. 执行规则

- 每次只执行一个用例，按编号顺序执行
- 每执行完一个用例，立即将结果写入 `tmp/<需求名称>_testcases.md`
- 除非用户明确要求并发测试，否则不得批量执行
- 用例执行结果保留历史记录，不得覆盖之前的结果

### 5. 输出结果

测试结果追加到 `tmp/<需求名称>_testcases.md` 中每个用例后：

```markdown
#### 执行结果
- **状态**: ✅ PASS / ❌ FAIL / ⚠️ SKIP
- **实际结果**: ...
- **备注**: ...
```

---

## 跨 Agent 调度

本 agent 可读取同仓库下其他 agent 的 AGENTS.md 获取工具用法：

- `browser-agent/AGENTS.md` — playwright-cli 完整命令参考
- `dify-agent/AGENT.md` — dify-cli 配置与命令参考

调度时切换工作目录到对应 agent 目录执行命令。

---

## 目录约定

| 路径 | 用途 |
|------|------|
| `input/` | 用户提供的需求文档（共享，gitigored） |
| `tmp/` | 生成的测试用例及结果（临时，gitigored） |
