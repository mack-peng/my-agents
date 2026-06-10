# dify-builder-agent

AI agent for reading, manipulating, validating, and generating Dify DSL YAML files (`app.yml`). Uses the `@orangemust/dify-dsl-builder` library.

## Tools

- **dify-dsl-cli** — globally installed CLI (`npm install -g @orangemust/dify-dsl-builder`). Also usable via `npx dify-dsl-cli`.
- **Library API** — `import { DifyDSL } from "@orangemust/dify-dsl-builder"` for scripted manipulation.
- **YAML Patch System** — declarative patch files (19 ops) applied via `dify-dsl-cli apply <patch> -i <in> -o <out>`.

## Workflow

```
用户提供 DSL 文件 + 需求文档 → 分析判定 → 简单/复杂 → 确认 → 执行 → 验证
```

### Step 1: 接收输入

用户将 Dify 应用导出的 `.yml` DSL 文件放到 `input/` 目录，并提供需求文档（要修改什么、达到什么效果）。

### Step 2: 分析判定

先用 `dify-dsl-cli flow <file>` 了解拓扑结构，`dify-dsl-cli node show <file> <id>` 查看关键节点详情，再根据需求判定修改方式：

| 场景 | 判定 | 工具 |
|------|------|------|
| 改标题、描述、位置 | **简单** | `node set-title` / `set-desc` / `set-position` |
| 单条 prompt 替换 | **简单** | `node set-prompt` |
| 单条 code 替换 | **简单** | `node set-code` |
| if-else 条件值修改 | **简单** | `node set-condition` |
| 添加/删除单条边 | **简单** | `edge add` / `edge remove` |
| 涉及多个节点、多条边、增删节点 | **复杂** | **YAML Patch 文件** |
| 批量修改（多个 LLM prompt、多个 code、多个变量） | **复杂** | **YAML Patch 文件** |
| 新增复杂节点（LLM、Knowledge、Tool 等） | **复杂** | **YAML Patch 文件** 或 Library API |
| 全新 DSL 生成 | 程序化 | Library API（TypeScript） |

### Step 3: 执行

- **简单修改**：直接在原文件上执行原子命令（modify in place）
- **复杂修改**：编写 YAML Patch 文件 → **与用户确认** → `dify-dsl-cli apply` 执行

### Step 4: 验证

任何修改后必须验证：`dify-dsl-cli validate <file>`

### CLI reference

```
dify-dsl-cli info       <file>              Print node/edge stats
dify-dsl-cli flow       <file> [--short]    Print workflow topology tree (full IDs default, --short for truncated)
dify-dsl-cli find       <file> <text>       Search text across all node content
dify-dsl-cli node show  <file> <id>         Dump full data of a single node (--json for machine-readable)
dify-dsl-cli node list  <file> [type]       Tabular node listing, optional type filter
dify-dsl-cli edge list  <file> [node-id]    Tabular edge listing
dify-dsl-cli path       <file> <from> <to>  Shortest path between two nodes
dify-dsl-cli diff       <yml1> <yml2>       Semantic diff between two DSL files
dify-dsl-cli roundtrip  <input> [output]    Parse → save, verify round-trip
dify-dsl-cli validate   <file>              Run Ruby DSL validator
dify-dsl-cli apply      <patch> -i <in> -o <out>  Apply YAML patch file
dify-dsl-cli remove     <file> <id>         Remove a node

Atomic commands (modify file in place):
  node set-title      <file> <id> <title>
  node set-desc       <file> <id> <desc>
  node set-prompt     <file> <id> <role> <replace> <with>
  node set-code       <file> <id> <replace> <with>
  node set-condition  <file> <id> <case_id> <field> <value>
  edge add            <file> <src> <tgt> [handle]
  edge remove         <file> <src> <tgt> [handle]
```

### YAML Patch System (19 operations)

Write a `.yml` patch file with a `steps` array. Steps are **executed sequentially** — order matters. Apply with:
```bash
dify-dsl-cli apply my-patch.yml -i input.yml -o output.yml
```

Also usable programmatically:
```ts
import { loadPatch, applyPatch } from "dify-dsl-builder";
const { description, steps } = loadPatch("my-patch.yml");
const dsl = DifyDSL.parse(yamlStr);
applyPatch(dsl, steps);
dsl.save("output.yml");
```

Full operation list (reference: `examples/patch-all-steps.yml` in the source repo):

| # | Operation | Key | Parameters |
|---|-----------|-----|------------|
| 1 | Remove an edge | `remove-edge` | `source`, `target`, `sourceHandle?` |
| 2 | Add an edge | `add-edge` | `source`, `target`, `handle?` |
| 3 | Add a Code node | `add-code-node` | `id`, `title`, `desc`, `code`, `code_language`, `position`, `variables`, `outputs` |
| 4 | Remove a node | `remove-node` | `id` |
| 5 | Set node title | `set-title` | `id`, `value` |
| 6 | Set node description | `set-desc` | `id`, `value` |
| 7 | Set node position | `set-position` | `id`, `x`, `y` |
| 8 | Replace LLM prompt text | `set-prompt` | `id`, `role`, `replace`, `with`, `replaceAll?` |
| 9 | Set Answer template | `set-answer` | `id`, `answer` |
| 10 | Add classifier class | `add-classifier-class` | `classifier`, `id`, `name` |
| 11 | Replace code text | `set-code` | `id`, `replace`, `with`, `replaceAll?` |
| 12 | Modify Start variable | `set-start-var` | `id`, `variable`, `field`, `value` |
| 13 | Set environment variable | `env-set` | `name`, `value`, `type` |
| 14 | Remove environment variable | `env-remove` | `name` |
| 15 | Set conversation variable | `conv-set` | `name`, `value_type` |
| 16 | Update if-else condition | `update-condition` | `id`, `case_id`, `field`, `value`, `condition_index?` |
| 17 | Remove classifier class | `remove-classifier-class` | `classifier`, `id` |
| 18 | Remove conversation variable | `conv-remove` | `name` |
| 19 | Set features | `set-features` | (feature key/value pairs) |

#### Patch behavior details

- **Edge ID auto-generation**: `add-edge` produces edge ID `{source}-{handle}-{target}-target`; `remove-edge` matches with the same rule.
- **`remove-edge` retries**: tries the specified `sourceHandle`, then `"true"`, then `"false"` — convenient for if-else branches.
- **`set-prompt`** and **`set-code`** use `String.replace()` — **only replaces the first match**, not global. Set `replaceAll: true` for global replacement.
- **`update-condition` field** supports dot-path notation: `value`, `comparison_operator`, `varType`, `variable_selector.0` for nested array elements.
- **`env-set`** value: write numbers as numbers, strings as quoted strings in YAML.
- **`add-edge` requires both nodes to exist**: node insertion/removal order matters in steps.

### Library API — programmatic creation

When patches are insufficient (complex node creation, iteration children, etc.), use the TypeScript API:

```ts
import { DifyDSL, LLMNode, CodeNode, StartNode, AnswerNode } from "@orangemust/dify-dsl-builder";
import * as fs from "fs";

const dsl = DifyDSL.parse(fs.readFileSync("input/app.yml", "utf-8"));

// CRUD — O(1) lookups
dsl.getNode("id");
dsl.findByType("llm");
dsl.getPrevIds("id");
dsl.getNextIds("id");

// Create and add
const code = new CodeNode("new-id", {
  title: "处理数据",
  code: `def main(x: str) -> dict:\n    return {"r": x}`,
  code_language: "python3",
  variables: [{ variable: "x", value_selector: ["upstream", "text"] }],
});
code.addOutput("r", "string");
dsl.addNode(code);
dsl.addEdge("upstream-id", "new-id");

// Serialize
fs.writeFileSync("output.yml", dsl.toYAML());
```

## Architecture

### 7-step pipeline

```
① parse(yamlStr)   → raw JSON (js-yaml.load)
② index()          → NodeIndex (typed nodes + edges)
③ (implicit)       → edges provide connectivity
④ CRUD             → getNode / addNode / removeNode / updateNode
⑤ Node.methods()   → instance modifications
⑥ toJSON()         → Dify DSL JSON plain object
⑦ toYAML()         → yaml.dump(json, {...})
```

### Key design decisions

- **Connectivity is in NodeIndex, not on nodes** — query via `dsl.getPrevIds(id)` / `dsl.getNextIds(id)`. Deleting a node auto-removes related edges.
- **`toJSON()` not `toYAML()`** — each node produces a plain JSON object; final YAML is `yaml.dump(toJSON())`.
- **All node IDs must be strings** (quote in YAML to prevent integer coercion).

## Node types (13)

| Type string | Class | Key methods |
|-------------|-------|-------------|
| `start` | `StartNode` | `addVariable(v)`, `removeVariable(n)`, `updateVariable(n,p)` |
| `answer` | `AnswerNode` | `setAnswer(tpl)`, `addVariableRef(id,f)` |
| `llm` | `LLMNode` | `setModel(p,n)`, `setTemperature(t)`, `addPromptMessage(m)`, `setMemory(n)` |
| `code` | `CodeNode` | `setCode(lang,code)`, `addVariable(v)`, `addOutput(name,type)` |
| `knowledge-retrieval` | `KnowledgeNode` | `addDataset(id)`, `setQuerySelector(id,f)`, `setTopK(n)` |
| `if-else` | `IfElseNode` | `addCase(c)`, `updateCondition(caseId,idx,patch)` |
| `template-transform` | `TemplateNode` | `setTemplate(tpl)`, `addVariable(v)` |
| `variable-aggregator` | `AggregatorNode` | `addSource(id,f)`, `removeSource(id)`, `setOutputType(t)` |
| `iteration` | `IterationNode` | `addChild(n)`, `removeChild(id)`, `setIterator(id,f)` |
| `tool` | `ToolNode` | `setPlugin(id,uid)`, `setToolParam(k,v)`, `setToolConfig(k,v)` |
| `question-classifier` | `ClassifierNode` | `addClass(c)`, `setModel(p,n)`, `setInstructions(s)` |
| `http-request` | `HTTPNode` | `setMethod(m)`, `setUrl(u)`, `setBody(type,data)` |
| `document-extractor` | `DocNode` | `setVariableSelector(id,field)` |

## DSL schema quick reference

### App modes
- `workflow` — Start → ... → **End** (structured outputs)
- `advanced-chat` — Start → ... → **Answer** (streamed text)

### Variable reference syntax
| Context | Syntax | Example |
|---------|--------|---------|
| Prompt/answer text | `{{#node_id.field#}}` | `{{#start.query#}}` |
| Structured fields (value_selector) | `[node_id, field]` | `["start", "query"]` |
| System variables | `{{#sys.var#}}` | `{{#sys.query#}}` |
| Environment variables | `{{#env.NAME#}}` | `{{#env.API_KEY#}}` |

### Edge conventions
- Standard nodes → `sourceHandle: "source"`
- IF/ELSE true branch → `"true"`, false branch → `"false"`
- Question Classifier → `topic.id`
- Edge ID: `{source}-{sourceHandle}-{target}-{targetHandle}`
- Cross-level connections (different parentId) are invalid

### if-else condition variable constraints

- `variable_selector` supports **workflow node** variables only (e.g. `["start", "field"]`)
- Environment variables (`["env", "VAR"]`) are **NOT** supported in if-else conditions — Dify rejects them with "value cannot be empty"
- `conversation_variables` may work but untested in if-else conditions
- Workaround: use a Code node to read `{{#env.VAR#}}` and output as a normal variable, then reference in if-else

### Critical pitfalls
1. **Variable Aggregator** uses bare nested arrays: `[["node", "field"]]`, NOT `{variable, value_selector}`
2. **Document Extractor** uses singular `variable_selector: ["node", "field"]`
3. **Code outputs** is a dict (not list): `{ result: { type: "string" } }`
4. **LLM nodes require `context` and `vision`** blocks even when disabled
5. **`memory` only in advanced-chat** LLM nodes, omit in workflow mode
6. **Iteration children** need `parentId` at outer level + `isInIteration: true` in data
7. Model names must be real, current names (not fictional)
8. All node IDs quoted in YAML to prevent integer coercion

## Input/output conventions

- `input/` — source DSL YAML files (gitignored)
- `output/` — generated/patched DSL YAML files (gitignored)
- `patches/` — project-specific YAML patch files (gitignored, node IDs are DSL-specific)

## Patch patterns

### Replace a node (remove old, insert new, rewire)

```yaml
description: 用 Code 节点替换旧模板节点
steps:
  - remove-edge: { source: "prev", target: "old-node" }
  - remove-edge: { source: "old-node", target: "next" }
  - remove-node:  { id: "old-node" }
  - add-code-node:
      id: "new-code"
      title: "替换节点"
      code: |
        def main(input: str) -> dict:
            return {"result": input}
      position: { x: 2000, y: 500 }
  - add-edge: { source: "prev", target: "new-code" }
  - add-edge: { source: "new-code", target: "next" }
```

### Batch modify prompts

```yaml
description: 统一修改多个 LLM 节点的 system prompt
steps:
  - set-prompt: { id: "llm-1", role: "system", replace: "旧指令", with: "新指令 v2" }
  - set-prompt: { id: "llm-2", role: "system", replace: "旧指令", with: "新指令 v2" }
```

## Validation

After any modification, validate the DSL:
```bash
dify-dsl-cli validate output/my-workflow.yml
```

The `apply` command auto-validates after patching and exits non-zero on errors.

## Reference documentation

Fetch the latest guides:
```bash
curl -s https://raw.githubusercontent.com/mack-peng/dify-dsl-builder/main/docs/guide/installation.md
curl -s https://raw.githubusercontent.com/mack-peng/dify-dsl-builder/main/docs/guide/patch.md
```
