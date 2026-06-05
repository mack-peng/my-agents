# dify-builder-agent — Dify DSL 生成器

基于 OpenCode 的 Dify 工作流 DSL 文件生成代理。根据用户描述的需求，输出符合 Dify v0.6.0+ 标准的 `.yml` 工作流定义文件。

## 工作流

```
用户描述需求 → AI 理解并规划流程 → 生成 DSL YAML → 验证结构正确性 → 交付
```

### 1. 理解需求

- 确定 app mode: `workflow`（批处理）还是 `advanced-chat`（对话）
- 确定节点类型和连接顺序（Start → LLM → Answer/End 等）
- 确定输入变量、模型、提示词、条件分支等细节

### 2. DSL 生成

参照 `references/dify-dsl-reference.md` 作为完整 schema 参考，生成包含以下结构的 DSL：

- **Top-level**: `version: "0.5.0"`（实际导出格式）或 `version: "0.6.0"`（DSL 标准）
- **Nodes**: 按节点类型生成完整 schema（start, llm, end, answer, code, knowledge-retrieval, if-else, template-transform, variable-aggregator, iteration, http-request, tool 等）
- **Edges**: 正确连接节点，使用规范 sourceHandle 命名
- **Layout**: 符合 Dify 画布坐标约定

### 3. 生成规范 — 零容错规则

以下规则来自实际导入/运行失败经验，必须严格遵守：

#### 3.1 Tool 节点（百度搜索插件）

**必须以 `references/dify-dsl-reference.md` §8 中的实际格式为准**，不能简化。关键字段：

- `paramSchemas`: 必须包含 5 个参数的完整定义（query, model, temperature, top_p, resource_type_filter），每个参数都要有 `auto_generate`, `default`, `human_description`（多语言）, `label`（多语言）, `llm_description`, `max`, `min`, `options`, `placeholder`, `precision`, `required`, `scope`, `template`, `type`
- `params`: 必须列出全部 5 个参数（model, query, resource_type_filter, temperature, top_p）
- `tool_parameters`: 必须有 5 项，其中 query 的值用 `type: mixed`
- `plugin_unique_identifier`: 必须包含完整 hash

#### 3.2 LLM 节点

- **`context` 和 `vision` 是必填字段**，即使不使用也要写：`context: { enabled: false, variable_selector: [] }` 和 `vision: { enabled: false }`
- 思虑模型加 `thinking: false` 到 `completion_params`

#### 3.3 Code 节点

- `outputs` 中的 `type` 必须用 Dify 校验通过的枚举值：`string`, `number`, `integer`, `boolean`, `object`, `file`, `secret`, `array[string]`, `array[number]`, `array[object]`, `array[boolean]`, `array[file]`, `array[any]`, `none`
- **不能用裸 `array`**，必须是 `array[xxx]` 格式
- Python 代码中的 f-string 不能用 `"` 包裹中文字符（如 `f"[{"学校"}]"`），会导致 SyntaxError。应改用变量替代

#### 3.4 变量引用格式

- Code/LLM/Template 节点的 `variables` 用对象格式：`{ variable, value_selector: [node_id, field] }`
- VariableAggregator 用裸嵌套列表：`[ [node_id, field], [node_id, field] ]`
- Knowledge Retrieval 用 `query_variable_selector: [node_id, field]`（扁平数组）

#### 3.5 Iteration 节点 — 必填字段与内部结构

Iteration 节点有多个容易遗漏的必填/半必填字段，缺少会导致导入失败：

**外层节点对象**：
- `start_node_id` — 必须指向 iteration-start 子节点 ID
- `data.width` / `data.height` — 需要在 `data` 内再写一份（与外层重复）

**iteration-start 子节点**：
- `type: custom-iteration-start`（外层） / `data.type: iteration-start`（内层）
- `parentId` 指向迭代主节点
- `data.isInIteration: true`, `data.iteration_id: "iter_id"`

**迭代内的子节点**（Template Transform, Code, KB 等）：
- 外层加 `parentId: "iteration_id"`
- data 内加 `isInIteration: true`, `iteration_id: "iter_id"`
- KB 节点的 `query_variable_selector` 改为指向迭代内的上游节点

**迭代内边**：
- `zIndex: 1002`（外部边是 `0`）
- `data.isInIteration: true`
- `data.iteration_id: "iter_id"`

**KB 在迭代内的输出类型问题**：
- KB 输出 `result` 类型为 `array[object]`（0~N 个 chunks）
- Iteration 收集后得到 `array[array[object]]`，不是 `array[object]`
- **解决方案**：迭代内加一个扁平化 Code 节点，将 `array[object]` 转成 `string`，Iteration 的 `output_selector` 指向该 Code 节点，`output_type` 改为 `array[string]`

**Template Transform 中引用当前迭代项**：
```yaml
template: '{{#iteration_start_id.item#}} {{#upstream_id.field#}}'
variables:
  - variable: item
    value_selector: ["iteration_start_id", "item"]
```

#### 3.6 validate-dsl.rb 的迭代兼容

验证脚本对迭代结构做了特判，如果手动修改了脚本，请确认以下豁免逻辑保留：

- `iteration-start` 节点免于"无入边"检查（数据来自 `iterator_selector`）
- 迭代内部末梢节点（`data.isInIteration: true`）免于"无出边"检查（输出由 `output_selector` 收集）

#### 3.7 修改现有 DSL 时的安全检查

- 删除节点时，同步检查并更新：
  - `edges:` 中所有引用该节点 ID 的边
  - 其他节点 `variables` / `query_variable_selector` 中对已删节点 ID 的引用
  - VariableAggregator 的 `variables` 列表
- 删除边时，确保不会破坏流程连通性

### 4. 修改现有 DSL 的工作方法

修改现有 `.yml` 时，必须遵守以下流程，避免反复出错：

#### 4.1 用 YAML 库操作，禁止字符串替换

字符串 `replace` 在 YAML 文本上操作会导致缩进错位、游离行、删错边等结构性 bug。必须用标准 YAML 库：

```python
import yaml
with open('input.yml') as f:
    data = yaml.safe_load(f)

# 修改内存中的 dict
data['workflow']['graph']['nodes'].append(new_node)
data['workflow']['graph']['edges'].append(new_edge)

with open('output.yml', 'w') as f:
    yaml.dump(data, f, allow_unicode=True, default_flow_style=False)
```

#### 4.2 变更前先跑约束对照

生成一份变更清单，逐条对照 `references/dify-dsl-reference.md` 的 pitfall 章节验证。也可直接用内置脚本：

```bash
ruby scripts/validate-dsl.rb <file.yml>
```

脚本自动检查以下全部约束，不通的变更不执行：

- VA `output_type` 与 `variables` 类型是否一致（`array` 不兼容 `string`）
- if-else 只支持 `true`/`false` case_id
- Code outputs `type` 枚举值（禁止裸 `array`）
- LLM 节点 `context`、`vision` 必填
- 边 `sourceHandle` 与源节点类型匹配
- 百度搜索结果只能通过单独参数传入下游 Code 节点，不可与 KB 结果混入同一个 VA

不通的变更不执行。

#### 4.3 Git 工作分支

在 repo 内切临时分支操作，每次原子改动后 commit，验证失败立即回滚，最终只保留产物文件，分支用完删除：

```bash
git checkout -b temp-dify-work

# 改一个原子步骤 → 验证
git add -A && git commit -m "step 1: xxx"
ruby -ryaml -e "YAML.load_file('output.yml')"

# 出错回滚到上一个 commit
git reset --hard HEAD~1
```

验证通过后，切回原分支，只把最终产物文件带回来：

```bash
git checkout main
git checkout temp-dify-work -- output/最终文件.yml
git branch -D temp-dify-work
```

中间 commit 随分支一起删除，主分支历史不受影响。

**命名规范**：临时分支统一用 `temp-` 前缀（不是 `temp/`），避免与目录名冲突。

### 5. 交付

- 输出 `.yml` 文件，文件名反映功能
- 交付前用 Ruby 做最终验证：
  ```bash
  ruby -ryaml -e '
  data = YAML.load_file("output.yml")
  nodes = data["workflow"]["graph"]["nodes"]
  edges = data["workflow"]["graph"]["edges"]
  # 连通性、VA 一致性、orphan 检查等
  '
  ```
- 已输出的最终文件同步到 `output/` 目录

## 参考

- DSL schema: `references/dify-dsl-reference.md`
- 百度智能搜索插件格式: `references/dify-dsl-reference.md` §8 Baidu AI Search Plugin（已合并入参考文档）
- 验证脚本: `scripts/validate-dsl.rb`（已兼容 Iteration 内部结构）
