# Dify DSL Generation Guide

This document is a standalone reference for generating valid Dify workflow DSL files (`.dify.yml` / `.dify.json`) for Dify v0.6.0+. It covers the complete schema, all node types, edge conventions, layout rules, and common pitfalls.

---

## Table of Contents

1. [DSL Structure Overview](#1-dsl-structure-overview)
2. [Node Types & Schemas](#2-node-types--schemas)
3. [Edge Rules](#3-edge-rules)
4. [Layout Guidelines](#4-layout-guidelines)
5. [Variable Reference Rules](#5-variable-reference-rules)
6. [Key Pitfalls to Avoid](#6-key-pitfalls-to-avoid)
7. [Template Matching](#7-template-matching)
8. [Complete Examples](#8-complete-examples)

---

## 1. DSL Structure Overview

### Top-Level

```yaml
version: "0.6.0"          # String, required. DSL version.
kind: "app"                # String, required. Must be "app".
app:                       # Map, required. App metadata.
  name: "My Workflow"      # String, required.
  mode: "workflow"         # String, required. "workflow" or "advanced-chat".
  description: ""          # String, optional.
  icon: "\U0001F916"       # String, optional. Emoji or image URL.
  icon_type: "emoji"       # String, optional. "emoji" | "image" | "link".
  icon_background: "#FFEAD5"  # String, optional. Hex color.
workflow:                  # Map, required.
  graph:
    nodes: []              # Array, required. Node objects.
    edges: []              # Array, required. Edge objects.
    viewport:              # Map, optional.
      x: 0
      y: 0
      zoom: 0.7
  features: {}             # Map, required. Feature flags.
  environment_variables: []  # Array, optional.
  conversation_variables: [] # Array, optional. Only in advanced-chat mode.
dependencies: []           # Array, optional. Plugin dependencies.
```

### App Modes

| Mode | Use Case | Nodes | Output |
|------|----------|-------|--------|
| `workflow` | Batch processing, one-shot | Start → ... → **End** | Structured outputs via End node |
| `advanced-chat` | Conversational chatbot | Start → ... → **Answer** | Streamed text via Answer node |

### Features Block (Minimal)

```yaml
features:
  file_upload:
    image:
      enabled: false
      number_limits: 3
      transfer_methods:
        - local_file
        - remote_url
    enabled: false
  opening_statement: ""
  retriever_resource:
    enabled: true
  sensitive_word_avoidance:
    enabled: false
  speech_to_text:
    enabled: false
  suggested_questions: []
  suggested_questions_after_answer:
    enabled: false
  text_to_speech:
    enabled: false
```

For `advanced-chat` mode, add:
- `opening_statement: "Hello! I am your assistant."` — initial bot message
- `suggested_questions: ["Question 1?", "Question 2?"]` — clickable follow-ups
- `suggested_questions_after_answer: { enabled: true }` — show after each answer

---

## 2. Node Types & Schemas

### Node Object Format

Every node follows this structure:

```yaml
- id: "1746000000001"        # String, required. 13-digit timestamp recommended.
  type: custom                # String. Always "custom" for workflow nodes.
  position:
    x: 80                     # Canvas X position.
    y: 282                    # Canvas Y position.
  # Optional (safe to include):
  positionAbsolute:
    x: 80
    y: 282
  width: 244
  height: 90
  selected: false
  sourcePosition: right
  targetPosition: left
  zIndex: 0
  parentId: "iter_node"       # Only when inside an iteration/loop.
  data:
    type: "start"             # Node type (BlockEnum).
    title: "Start"            # Display name.
    desc: ""                  # Description.
    # ... type-specific fields
```

### 2.1 Start Node

```yaml
data:
  type: start
  title: Start
  desc: ""
  variables:                  # Array of input variable definitions.
    - variable: "query"       # Variable key. Referenced as {{#node_id.query#}}.
      label: "Query"          # Display label for the form.
      type: "text-input"      # Input type: text-input | paragraph | select | number | url
                              #   | files | file | file-list | json | json_object | checkbox.
      required: true          # Boolean.
      max_length: 100         # Optional. For text types.
      options: []             # For "select" type: list of option strings.
      placeholder: ""         # Optional. Placeholder text.
      default: ""             # Optional. Default value.
```

**System variables always available:**
- `sys.query` — user's input query (advanced-chat only)
- `sys.files` — uploaded files
- `sys.user_id`, `sys.app_id`, `sys.workflow_id`, `sys.workflow_run_id` — always
- `sys.conversation_id`, `sys.dialogue_count` — advanced-chat only
- `sys.timestamp` — workflow mode only

### 2.2 End Node (workflow mode)

```yaml
data:
  type: end
  title: End
  desc: ""
  outputs:                    # List, at least one entry required.
    - variable: "result"      # Output variable name in the result object.
      value_selector:         # Path to upstream variable.
        - "upstream_node_id"
        - "text"
      value_type: "string"    # string | number | object | array | array[string] | etc.
```

### 2.3 Answer Node (advanced-chat mode)

```yaml
data:
  type: answer
  title: Answer
  desc: ""
  answer: "{{#llm_node_id.text#}}"   # Jinja2 template with variable references.
  variables:                          # Required. Must match all refs in answer.
    - variable: "llm_node_id.text"    # Matches the reference key.
      value_selector:
        - "llm_node_id"
        - "text"
```

### 2.4 LLM Node

```yaml
data:
  type: llm
  title: LLM
  desc: ""
  model:
    provider: "openai"                # e.g., openai, anthropic, deepseek.
    name: "gpt-4o-mini"               # Must be a real, current model name.
    mode: "chat"                      # "chat" or "completion".
    completion_params:
      temperature: 0.7
  prompt_template:
    - role: "system"
      text: "You are a helpful assistant."
    - role: "user"
      text: "{{#sys.query#}}"
  context:                            # Knowledge retrieval context.
    enabled: false
    variable_selector: []
  vision:                             # Image input.
    enabled: false
  memory:                             # Only in advanced-chat mode.
    window:
      enabled: false
      size: 10
    query_prompt_template: "{{#sys.query#}}"
  structured_output:                  # JSON schema output.
    enabled: false
```

**Variable references in prompt text:** use `{{#node_id.variable_name#}}` syntax. For context injection, use `{{#context#}}` (requires `context.enabled: true`).

### 2.5 Code Node

```yaml
data:
  type: code
  title: Code
  desc: ""
  code_language: "python3"            # "python3" or "javascript".
  code: |
    def main(input_var: str) -> dict:
        result = input_var.upper()
        return {"result": result}
  variables:                          # Input mappings.
    - variable: "input_var"           # Parameter name in main() function.
      value_selector:
        - "upstream_node_id"
        - "field"
      value_type: "string"            # Optional type hint.
  outputs:                            # DICT (not list). Keys = output names.
    result:
      type: "string"
      children: null
```

**Output variable types:** `string`, `number`, `integer`, `secret`, `boolean`, `object`, `file`, `array`, `array[string]`, `array[number]`, `array[object]`, `array[boolean]`, `array[file]`, `any`, `array[any]`.

### 2.6 Knowledge Retrieval Node

```yaml
data:
  type: knowledge-retrieval
  title: Search Knowledge
  desc: ""
  query_variable_selector:            # Source of the query text.
    - "start_node_id"
    - "query"
  dataset_ids:                        # Array of knowledge base UUIDs.
    - "a19a8fb2-aadc-445c-b231-540f319dc55d"
  retrieval_mode: "multiple"          # "single" or "multiple".
  multiple_retrieval_config:          # Required when retrieval_mode is "multiple".
    top_k: 4                          # Max chunks to return.
    score_threshold: null             # null = disabled. 0-1 float.
    reranking_enable: false
  single_retrieval_config:            # Required when retrieval_mode is "single".
    model:
      provider: "openai"
      name: "gpt-4o-mini"
      mode: "chat"
      completion_params:
        temperature: 0.3
```

**Output:** `result` (array of chunk objects), each with `content`, `title`, `metadata`, `files`.

### 2.7 IF/ELSE Node

```yaml
data:
  type: if-else
  title: IF/ELSE
  desc: ""
  cases:
    - id: "true"                      # Case ID. "true" for first case.
      case_id: "true"
      logical_operator: "and"         # "and" or "or".
      conditions:
        - id: "uuid"
          variable_selector:
            - "upstream_node"
            - "field"
          comparison_operator: "contains"  # contains | not contains | start with | end with
                                            # | is | is not | empty | not empty | = | !=
                                            # | > | < | >= | <= | in | not in | null | not null.
          value: "some_value"
          varType: "string"
```

**Edge sourceHandles:** `"true"` (first case), `case_id` (additional cases), `"false"` (else branch).

### 2.8 Template Transform Node

```yaml
data:
  type: template-transform
  title: Template
  desc: ""
  template: "{{ input_var }}"          # Jinja2 template.
  variables:                           # Variable mappings for the template.
    - variable: "input_var"            # Name used in Jinja2 template.
      value_selector:
        - "upstream_node"
        - "field"
      value_type: "string"
```

**Output:** `output` (string). Referenced as `{{#template_node.output#}}`.

### 2.9 Variable Aggregator Node

**CRITICAL:** This node uses **bare nested arrays** for `variables`, NOT the standard `{variable, value_selector}` format.

```yaml
data:
  type: variable-aggregator
  title: Merge Results
  desc: ""
  output_type: "array"                 # Must match type of all aggregated vars.
  variables:                           # Array of [node_id, field_name] pairs.
    - - "branch1_node_id"
      - "result"
    - - "branch2_node_id"
      - "result"
```

**Output:** `output` (first available value from the listed variables).

For grouped mode (multiple named outputs):
```yaml
data:
  output_type: "string"
  variables:
    - - "branch1"
      - "result"
    - - "branch2"
      - "result"
  advanced_settings:
    group_enabled: true
    groups:
      - groupId: "uuid1"
        group_name: "Group1"
        output_type: "string"
        variables:
          - - "switch1_on"
            - "output"
          - - "switch1_off"
            - "output"
```

### 2.10 Iteration Node

```yaml
data:
  type: iteration
  title: Iteration
  desc: ""
  iterator_selector:                   # Source array to iterate.
    - "code_node"
    - "result"
  iterator_input_type: "array[number]"    # Must match actual element type.
  output_selector:                     # Which child node's output to collect.
    - "inner_llm"
    - "text"
  output_type: "array[string]"            # Type of collected outputs.
  start_node_id: "iter_id_start"          # ID of the iteration-start child.
  is_parallel: false
  parallel_nums: 10
  error_handle_mode: "terminated"
```

**Child nodes inside iteration must have:**
```yaml
parentId: "iteration_node_id"    # On the node object (not inside data).
data:
  isInIteration: true
  iteration_id: "iteration_node_id"
```

The iteration-start child node:
```yaml
- id: "iter_id_start"
  parentId: "iteration_node_id"
  type: custom-iteration-start     # Special type, NOT "custom".
  data:
    type: iteration-start
    title: ""
    desc: ""
    isInIteration: true
  draggable: false
  selectable: false
```

### 2.11 HTTP Request Node

```yaml
data:
  type: http-request
  title: HTTP Request
  desc: ""
  method: "GET"                       # GET | POST | PUT | DELETE | PATCH | HEAD.
  url: "{{#start.url#}}"
  authorization:
    type: "no-auth"                   # no-auth | api-key | custom.
  headers: ""
  params: ""
  body:
    type: "none"                      # none | form-data | x-www-form-urlencoded | raw-text | json.
    data: ""
  timeout:
    connect: 10
    read: 30
    write: 30
```

**Outputs:** `status_code` (number), `body` (string), `headers` (string).

### 2.12 Tool Node

```yaml
data:
  type: tool
  title: Tool
  desc: ""
  provider_id: "builtin"
  provider_type: "builtin"
  provider_name: "Builtin Tools"
  tool_name: "json_parse"
  tool_label: "JSON Parse"
  tool_configurations: {}
  tool_parameters:
    json_string: "{{#http_node.body#}}"
```

### 2.13 Other Node Types (Quick Reference)

| Node Type | data.type | Key Fields |
|-----------|-----------|------------|
| Document Extractor | `document-extractor` | `variable_selector` (flat array, not list), `is_array_file` |
| List Operator | `list-operator` | `filter_conditions`, `order_by`, `limit` |
| Parameter Extractor | `parameter-extractor` | `query`, `model`, `parameters`, `reasoning_mode` |
| Question Classifier | `question-classifier` | `query_variable_selector`, `model`, `classes` |
| Agent | `agent` | `agent_strategy`, `tools`, `instruction`, `model` |
| Loop | `loop` | Similar to iteration but with break condition |

---

## 3. Edge Rules

### Edge Object Schema

```yaml
- id: "source_node-sourceHandle-target_node-targetHandle"
  source: "source_node_id"
  sourceHandle: "source"             # Depends on node type (see below).
  target: "target_node_id"
  targetHandle: "target"             # Always "target".
  type: custom
  zIndex: 0
  data:
    sourceType: "start"              # BlockEnum of source node.
    targetType: "llm"                # BlockEnum of target node.
    isInIteration: false
    isInLoop: false
```

### sourceHandle Naming

| Node Type | sourceHandle Value |
|-----------|-------------------|
| Standard (Start, LLM, Code, KB, HTTP, Template, Tool, Answer, End, etc.) | `"source"` |
| IF/ELSE — first case | `"true"` |
| IF/ELSE — additional cases | `case_id` (UUID string) |
| IF/ELSE — else branch | `"false"` |
| Question Classifier | `topic.id` (each class ID) |
| Error/failure branch | `"fail-branch"` (when `error_strategy: "fail-branch"`) |

### Edge ID Convention

Format: `{source_node_id}-{sourceHandle}-{target_node_id}-{targetHandle}`

Examples:
- `start-1-source-llm-1-target`
- `if-else-1-true-code-1-target`
- `if-else-1-false-llm-2-target`

### zIndex Rules

- Root-level edges: `0`
- Inside iteration/loop containers: `1002`

### Connection Validation

- Start, DataSource, Trigger nodes **cannot have predecessors** (no incoming edges)
- End, LoopEnd, KnowledgeBase (knowledge-index) **cannot have successors** (no outgoing edges)
- No cross-level connections (both nodes must share the same `parentId`)
- No cycles (DFS cycle detection is enforced)
- No duplicate edges (same source + sourceHandle + target + targetHandle)

---

## 4. Layout Guidelines

### Default Positioning

- **Start node**: `{x: 80, y: 282}`
- **Horizontal spacing**: 300px between columns (244px node width + 60px padding)
- **Vertical spacing**: 200px between parallel branches
- **Simple linear chain**: `Start(80,282) → Node1(380,282) → Node2(680,282) → End(980,282)`

### Branching Layout

```
        +-> UpperBranch (680, 182) -> ...
IfElse (380, 282) --+
        +-> LowerBranch (680, 382) -> ...
```

- True/first branch upward (subtract 100-200 from y)
- False/else branch downward (add 100-200 to y)
- Variable Aggregator or downstream merge at original y level

### Node Dimensions

- Default width: 244px
- Default height: varies by node type (54-280px typical)
- Start node: ~168-210px (depends on number of variables)
- Code node: ~186px (depends on code length)
- LLM node: ~200-300px (depends on prompt complexity)

---

## 5. Variable Reference Rules

### Syntax by Context

| Context | Syntax | Example |
|---------|--------|---------|
| Prompt text, answer text, templates | `{{#node_id.field#}}` | `{{#start.query#}}` |
| Structured fields (value_selector) | Array `[node_id, field]` | `["start", "query"]` |
| System variables | `sys.var_name` | `{{#sys.user_id#}}` |
| Environment variables | `env.var_name` | `{{#env.API_KEY#}}` |
| Conversation variables | `conversation.var_name` | `{{#conversation.counter#}}` |

### Variable Shape by Node Type (CRITICAL)

**Different node types use different variable shapes. This is the #1 source of import errors.**

1. **Code, LLM, Template Transform, Parameter Extractor** — use **objects**:
   ```yaml
   variables:
     - variable: my_arg
       value_selector: ["upstream_id", "field"]
       value_type: string
   ```

2. **Variable Aggregator** — uses **bare nested lists**:
   ```yaml
   variables:
     - - "branch1_id"
       - "result"
     - - "branch2_id"
       - "result"
   ```

3. **Document Extractor** — uses a singular `variable_selector` (flat array), not a list:
   ```yaml
   variable_selector: ["upstream_id", "field"]
   ```

4. **End node outputs** — is a **list** of `{variable, value_selector, value_type}` items:
   ```yaml
   outputs:
     - variable: result
       value_selector: ["llm_node", "text"]
       value_type: string
   ```

5. **Code node outputs** — is a **dict** keyed by variable name:
   ```yaml
   outputs:
     result:
       type: string
       children: null
   ```

6. **Knowledge Retrieval** — uses `query_variable_selector` (flat array), not a list:
   ```yaml
   query_variable_selector: ["upstream_id", "field"]
   ```

---

## 6. Key Pitfalls to Avoid

### 1. `memory` belongs only to advanced-chat LLM nodes
In `workflow`-mode apps, `sys.query` does not exist and LLM nodes must omit the `memory` block. Same applies for LLM nodes inside an iteration in a workflow-mode app.

### 2. Iteration containers need dimensions in two places
Set `width` and `height` both inside `data` AND at the outer node level.

### 3. `iterator_input_type` must match real element type
- For files: `"array[file]"`
- For numbers: `"array[number]"`
- Mismatch breaks runtime variable resolution.

### 4. Model names must be real and current
Fictional model names like `deepseek-v4-pro` will fail provider validation. Use real, shipping model names (e.g., `gpt-4o-mini`, `deepseek-chat`, `claude-sonnet-4-20250514`).

### 5. All node IDs must be quoted in YAML
To prevent type coercion (e.g., `1711536487001` being parsed as an integer instead of string):
```yaml
id: '1711536487001'   # Always quote node IDs.
```

### 6. Variable Aggregator variables must be bare nested arrays
DO NOT use `{variable: ..., value_selector: ...}` format. Use:
```yaml
variables:
  - - "node_id"
    - "field"
```

### 7. Edge `data` block should include sourceType and targetType
```yaml
data:
  sourceType: start
  targetType: llm
  isInIteration: false
```

### 8. Document Extractor uses singular selector
```yaml
# CORRECT:
variable_selector: ["upstream_id", "result"]

# WRONG:
variables:
  - variable: doc
    value_selector: ["upstream_id", "result"]
```

### 9. End node vs Answer node
- `workflow` mode: use **End** node with `outputs` list
- `advanced-chat` mode: use **Answer** node with `answer` template

### 10. Suggested questions in features
For `advanced-chat` mode, you can add `suggested_questions` and `suggested_questions_after_answer` for better UX:
```yaml
suggested_questions:
  - "What can you help me with?"
  - "Tell me more about option A"
suggested_questions_after_answer:
  enabled: true
```

### 11. Code node output type enum values (verified against Dify runtime validation)

**VALID values**: `string`, `number`, `integer`, `float`, `boolean`, `object`, `secret`, `file`, `array[string]`, `array[number]`, `array[object]`, `array[boolean]`, `array[file]`, `array[any]`, `none`, `group`

**INVALID**: bare `array` — Dify rejects this with: `Input should be 'number', 'integer', ..., 'array[any]', 'array[string]', ...`

### 12. LLM node context and vision ARE required fields

All LLM nodes MUST include both `context` and `vision` blocks, even when disabled:

```yaml
context:
  enabled: false
  variable_selector: []
vision:
  enabled: false
```

Omitting either field causes: `LLMNodeData.context Field required [type=missing]`

### 13. Python f-string + Chinese characters = SyntaxError

When writing Python code nodes, avoid nesting `"` quotes inside f-strings that contain Chinese characters:

```python
# BROKEN — SyntaxError: f-string: expecting '}'
f"[{"学校" if cond else "参考"}]{title}"

# CORRECT — use a variable
label = "学校" if cond else "参考"
f"[{label}]{title}"
```

### 14. Node deletion checklist (when modifying existing DSL)

Deleting a node requires checking ALL of these:
1. **edges:** list — remove all edges referencing the deleted node ID (as source or target)
2. **Other nodes' `variables`** — orphaned `value_selector` pointing to deleted node will cause runtime errors
3. **KB nodes' `query_variable_selector`** — commonly points to upstream node
4. **VariableAggregator's `variables`** — bare nested lists referencing the node
5. **Answer node's `variables`** — value_selector references
6. **LLM node's `context.variable_selector`** — if context was pointing to the deleted node

---

## 7. Template Matching

Use these templates as starting points for common patterns.

### Simple Chatbot (advanced-chat)

```
Start (no variables) → LLM (with memory) → Answer
```

### RAG Q&A (advanced-chat)

```
Start (query input)
  → Knowledge Retrieval
    → LLM (with context injection)
      → Answer
```

### Translation Workflow (workflow)

```
Start (source_text, source_lang, target_lang, country)
  → LLM (直译)
    → IF/ELSE (quality check)
      ├→ true → LLM (意译)
      └→ false → Variable Aggregator
        → LLM (final polish)
          → End
```

### Agent (advanced-chat)

```
Start (query)
  → Parameter Extractor or Question Classifier
    → Tool Node (API call)
      → LLM (format response)
        → Answer
```

### Data Processing Pipeline (workflow)

```
Start (input data)
  → Code (transform)
    → HTTP Request (fetch external data)
      → Code (merge & analyze)
        → Template Transform (format output)
          → End
```

---

## 8. Complete Examples

### Minimal Workflow Mode

```yaml
version: "0.6.0"
kind: app
app:
  name: "Simple Echo"
  mode: workflow
  icon: "\U0001F916"
  icon_background: "#FFEAD5"
  icon_type: emoji
  description: "Echoes the input query"
  use_icon_as_answer_icon: false
dependencies: []
workflow:
  environment_variables: []
  conversation_variables: []
  features:
    file_upload:
      image:
        enabled: false
        number_limits: 3
        transfer_methods:
          - local_file
          - remote_url
      enabled: false
    opening_statement: ""
    retriever_resource:
      enabled: false
    sensitive_word_avoidance:
      enabled: false
    speech_to_text:
      enabled: false
    suggested_questions: []
    suggested_questions_after_answer:
      enabled: false
    text_to_speech:
      enabled: false
  graph:
    edges:
      - id: start-to-end
        source: "start_node"
        sourceHandle: source
        target: "end_node"
        targetHandle: target
        type: custom
        data:
          sourceType: start
          targetType: end
          isInIteration: false
          isInLoop: false
    nodes:
      - id: "start_node"
        type: custom
        position:
          x: 80
          y: 282
        data:
          type: start
          title: Start
          desc: ""
          variables:
            - variable: query
              label: query
              type: text-input
              required: true
              max_length: null
              options: []
      - id: "end_node"
        type: custom
        position:
          x: 384
          y: 282
        data:
          type: end
          title: End
          desc: ""
          outputs:
            - variable: result
              value_selector:
                - "start_node"
                - query
              value_type: string
    viewport:
      x: 0
      y: 0
      zoom: 0.7
```

### Minimal Advanced-Chat Mode

```yaml
version: "0.6.0"
kind: app
app:
  name: "Simple Chat"
  mode: advanced-chat
  icon: "\U0001F916"
  icon_background: "#FFEAD5"
  icon_type: emoji
  description: "Simple chatflow with LLM"
  use_icon_as_answer_icon: false
dependencies: []
workflow:
  environment_variables: []
  conversation_variables: []
  features:
    file_upload:
      enabled: false
    opening_statement: "Hello! How can I help you?"
    retriever_resource:
      enabled: false
    sensitive_word_avoidance:
      enabled: false
    speech_to_text:
      enabled: false
    suggested_questions: []
    suggested_questions_after_answer:
      enabled: false
    text_to_speech:
      enabled: false
  graph:
    edges:
      - id: start-to-llm
        source: "start_node"
        sourceHandle: source
        target: "llm_node"
        targetHandle: target
        type: custom
        data:
          sourceType: start
          targetType: llm
          isInIteration: false
      - id: llm-to-answer
        source: "llm_node"
        sourceHandle: source
        target: "answer_node"
        targetHandle: target
        type: custom
        data:
          sourceType: llm
          targetType: answer
          isInIteration: false
    nodes:
      - id: "start_node"
        type: custom
        position:
          x: 80
          y: 282
        data:
          type: start
          title: Start
          desc: ""
          variables: []
      - id: "llm_node"
        type: custom
        position:
          x: 380
          y: 282
        data:
          type: llm
          title: LLM
          desc: ""
          model:
            provider: openai
            name: gpt-4o-mini
            mode: chat
            completion_params:
              temperature: 0.7
          prompt_template:
            - role: system
              text: "You are a helpful assistant."
          context:
            enabled: false
            variable_selector: []
          vision:
            enabled: false
          memory:
            window:
              enabled: true
              size: 10
            query_prompt_template: "{{#sys.query#}}"
      - id: "answer_node"
        type: custom
        position:
          x: 680
          y: 282
        data:
          type: answer
          title: Answer
          desc: ""
          answer: "{{#llm_node.text#}}"
          variables:
            - variable: llm_node.text
              value_selector:
                - "llm_node"
                - text
    viewport:
      x: 0
      y: 0
      zoom: 0.7
```

---

## Quick Reference Card

### Node ID generation
Use 13-digit Unix timestamps in milliseconds as IDs. Increment by a few thousand between nodes:
```python
import time
node_id = str(int(time.time() * 1000))  # e.g., "1746000000001"
```

### Common model providers
- `openai` — gpt-4o, gpt-4o-mini, gpt-4.1, o3-mini
- `anthropic` — claude-sonnet-4-20250514, claude-3.5-haiku
- `deepseek` — deepseek-chat, deepseek-reasoner
- `langgenius/openai/openai` — alternative Dify-internal format

### Node output variable names
| Node Type | Output Variable(s) |
|-----------|-------------------|
| LLM | `text`, `reasoning_content` |
| Code | Custom (as defined in `outputs`) |
| Knowledge Retrieval | `result` (array of chunks) |
| Template Transform | `output` |
| HTTP Request | `status_code`, `body`, `headers` |
| Variable Aggregator | `output` |
| Iteration | Custom (as defined in `output_selector`) |
| Document Extractor | `text` |
| Parameter Extractor | Custom (as defined in `parameters`) |

### Edge data block fields
```yaml
data:
  sourceType: start              # Required
  targetType: llm                # Required
  isInIteration: false           # Required
  iteration_id: "iter_id"        # Only when isInIteration is true
  isInLoop: false                # Optional
  loop_id: "loop_id"             # Only when isInLoop is true
```

---

## Baidu AI Search Plugin — Complete Tool Node Reference

This is the **only validated working format** for the `qianfan/baidu_ai_search` plugin. Do not simplify the `paramSchemas` — Dify requires every field shown below.

### Tool Node

```yaml
- data:
    is_team_authorization: true
    paramSchemas:
    - auto_generate: null
      default: null
      form: llm
      human_description:
        en_US: Search query keywords or phrases.
        zh_Hans: 搜索查询关键词或短语
      label:
        en_US: Search query
        zh_Hans: 搜索查询
      llm_description: ''
      max: null
      min: null
      name: query
      options: []
      placeholder: null
      precision: null
      required: true
      scope: null
      template: null
      type: string
    - auto_generate: null
      default: null
      form: llm
      human_description:
        en_US: Specify the model for result summarization.
        zh_Hans: 指定用于结果总结的模型
      label:
        en_US: Model selection
        zh_Hans: 模型选择
      llm_description: ''
      max: null
      min: null
      name: model
      options: []
      placeholder: null
      precision: null
      required: false
      scope: null
      template: null
      type: string
    - auto_generate: null
      default: 0.8
      form: llm
      human_description:
        en_US: Controls output randomness, range 0-1.0.
        zh_Hans: 输出随机性控制，范围0-1.0，默认0.8
      label:
        en_US: Temperature
        zh_Hans: 随机性控制
      llm_description: ''
      max: 1
      min: 0
      name: temperature
      options: []
      placeholder: null
      precision: null
      required: false
      scope: null
      template: null
      type: number
    - auto_generate: null
      default: 0.8
      form: llm
      human_description:
        en_US: Controls output diversity, range 0-1.0.
        zh_Hans: 多样性控制，范围0-1.0，默认0.8
      label:
        en_US: Top-P
        zh_Hans: 多样性控制
      llm_description: ''
      max: 1
      min: 0
      name: top_p
      options: []
      placeholder: null
      precision: null
      required: false
      scope: null
      template: null
      type: number
    - auto_generate: null
      default: '[{"type": "web", "top_k": 10}]'
      form: llm
      human_description:
        en_US: The top_k range for each resource type is 1~10.
        zh_Hans: 每种资源类型（web、image、video等）的top_k取值范围为1~10。
      label:
        en_US: Resource filter
        zh_Hans: 资源过滤
      llm_description: ''
      max: null
      min: null
      name: resource_type_filter
      options: []
      placeholder: null
      precision: null
      required: false
      scope: null
      template: null
      type: array
    params:
      model: ''
      query: ''
      resource_type_filter: ''
      temperature: ''
      top_p: ''
    plugin_id: qianfan/baidu_ai_search
    plugin_unique_identifier: qianfan/baidu_ai_search:0.0.1@97821ba294ff49a4d7fabb6746bfd7993373e27c2a110efd684865bf21f2ff6e
    provider_icon: /console/api/workspaces/current/plugin/icon?tenant_id=18391616-0974-43c4-aa36-0f1db84ba9b2&filename=6abf3075b001f405d82db8b68d08722a9fd9014c79877c7177204e8fea22fb1e.png
    provider_id: qianfan/baidu_ai_search/baidu_ai_search
    provider_name: qianfan/baidu_ai_search/baidu_ai_search
    provider_type: builtin
    selected: true
    title: 智能搜索生成
    tool_configurations: {}
    tool_description: 提供AI增强的智能语义搜索工具
    tool_label: 智能搜索生成
    tool_name: smart_search
    tool_node_version: '2'
    tool_parameters:
      model:
        type: mixed
        value: ''
      query:
        type: mixed
        value: '{{#upstream_node.field#}}'
      resource_type_filter:
        type: constant
        value: '[{"type": "web", "top_k": 10}]'
      temperature:
        type: constant
        value: 0.8
      top_p:
        type: constant
        value: 0.8
    type: tool
  height: 52
```

### Code Node (Search Result Formatting)

The companion Code node that formats Baidu search results. Variable name MUST be `searchJson`, output type MUST be `string`:

```yaml
- data:
    code: "function main({ searchJson }) {\n    const references = searchJson[0].references;\n    let combinedText = \"\";\n    references.forEach((ref, index) => {\n        combinedText += `【参考资料 ${index + 1}】\\n`;\n        combinedText += `标题: ${ref.title}\\n`;\n        combinedText += `内容: ${ref.content}\\n\\n`;\n    });\n    return { result: combinedText };\n}"
    code_language: javascript
    desc: 格式化百度搜索结果
    outputs:
      result:
        children: null
        type: string
    selected: false
    title: 格式化搜索结果
    type: code
    variables:
    - value_selector:
      - '<TOOL_NODE_ID>'
      - json
      value_type: array[object]
      variable: searchJson
  height: 52
```

### Search + Knowledge Retrieval Merge Pattern

When adding web search alongside Knowledge Retrieval, the search Code node outputs `string`, which is incompatible with the VariableAggregator's `output_type: array` (used for KB results). Solution:

1. Keep the existing VA for KB results only
2. Inject search text as a separate input to the downstream Code node
3. The Code node concatenates KB text + search text

```python
def main(raw_results: list, search_text: str) -> dict:
    # ... KB dedup logic produces kb_text ...
    if search_text:
        kb_text += "\n\n## 网络搜索结果\n" + search_text
    return {"count": len(deduped), "text": kb_text}
```

---

## Sources & References

This guide is compiled from reverse-engineering the Dify source code and the [`workflow-skill`](https://github.com/twwch/workflow-skill) project (also forked at [`LingyiChen-AI/workflow-skill`](https://github.com/LingyiChen-AI/workflow-skill)).

### Primary Reference Repositories

| Resource | URL | Purpose |
|----------|-----|---------|
| workflow-skill (upstream) | `https://github.com/twwch/workflow-skill` | Original skill for generating Dify/Coze/ComfyUI workflows from NL |
| workflow-skill (fork) | `https://github.com/LingyiChen-AI/workflow-skill` | Active fork with per-node-type schema references |
| Dify official | `https://github.com/langgenius/dify` | Dify main repo — source code for DSL version 0.6.0 |
| Awesome-Dify-Workflow | `https://github.com/svcvit/Awesome-Dify-Workflow` | 10.5k-star collection of real Dify DSL examples |

### Node Schema Files (in workflow-skill)

All node schemas are at `skills/dify-workflow/references/nodes/` in the workflow-skill repo:
```
answer.md · code.md · document-extractor.md · end.md · http-request.md
if-else.md · iteration.md · knowledge-retrieval.md · llm.md
parameter-extractor.md · question-classifier.md · start.md
template-transform.md · tool.md · variable-aggregator.md
```

### DSL Format & Edge Rules

```
skills/dify-workflow/references/dsl-format.md
skills/dify-workflow/references/edge-and-layout.md
```
