#!/usr/bin/env ruby
# validate-dsl.rb — Dify DSL 全量结构校验工具
# 用法: ruby validate-dsl.rb <file.yml>

require 'yaml'
require 'set'

abort "Usage: ruby validate-dsl.rb <file.yml>" unless ARGV[0]

data = YAML.load_file(ARGV[0])
app = data['app'] || {}
mode = app['mode'] || ''
nodes = data.dig('workflow', 'graph', 'nodes') || []
edges = data.dig('workflow', 'graph', 'edges') || []
features = data.dig('workflow', 'features') || {}

node_map = {}
nodes.each { |n| node_map[n['id']] = n }

def valid_ref?(ref_id, node_map)
  %w[sys env conversation].include?(ref_id) || node_map.key?(ref_id)
end

errors = []

# ═══════════════════════════════════════════
# 1. TOP-LEVEL
# ═══════════════════════════════════════════

errors << "version 缺失" unless data['version']
errors << "kind 缺失" unless data['kind'] == 'app'
errors << "app.mode 缺失" unless %w[workflow advanced-chat].include?(mode)
errors << "app.name 缺失" unless app['name']
errors << "nodes 为空" if nodes.empty?
errors << "edges 为空" if edges.empty?
errors << "features 缺失" unless features.is_a?(Hash)

# ═══════════════════════════════════════════
# 2. NODE IDs — 必须为字符串（YAML 引号保护）
# ═══════════════════════════════════════════

node_ids = []
nodes.each do |n|
  id = n['id']
  unless id.is_a?(String)
    errors << "节点 id=#{id.inspect} 类型为 #{id.class}，必须为字符串（加引号）"
  end
  node_ids << id.to_s
end

ids_seen = Set.new
node_ids.each do |id|
  if ids_seen.include?(id)
    errors << "节点 id '#{id}' 重复"
  end
  ids_seen << id
end

# ═══════════════════════════════════════════
# 3. 按节点类型检查
# ═══════════════════════════════════════════

VALID_CODE_TYPES = %w[
  string number integer float boolean object secret file none group
  array[string] array[number] array[object] array[boolean] array[file] array[any]
].to_set

VALID_START_INPUTS = %w[
  text-input paragraph select number url files file file-list json json_object checkbox
].to_set

VALID_COMPARISON_OPS = %w[
  contains not\ contains start\ with end\ with is is\ not empty not\ empty
  = != > < >= <= in not\ in null not\ null
].to_set

# 系统变量前缀，非节点 ID
SYSTEM_REFS = %w[sys env conversation].to_set

VALID_MODEL_MODES = %w[chat completion].to_set
VALID_CODE_LANGS = %w[python3 javascript].to_set

nodes.each do |n|
  nd = n['data'] || {}
  ntype = nd['type']
  nid = n['id']

  case ntype

  # ── Start ──
  when 'start'
    (nd['variables'] || []).each do |v|
      vt = v['type']
      errors << "#{nid}: start input 类型 '#{vt}' 不合法" unless VALID_START_INPUTS.include?(vt)
    end

  # ── LLM ──
  when 'llm'
    errors << "#{nid}: LLM 缺少 context" unless nd.key?('context')
    errors << "#{nid}: LLM 缺少 vision" unless nd.key?('vision')

    model = nd['model'] || {}
    unless VALID_MODEL_MODES.include?(model['mode'])
      errors << "#{nid}: model.mode '#{model['mode']}' 不合法，应为 chat/completion"
    end

    # prompt_template 中 role 必须合法
    (nd['prompt_template'] || []).each do |pt|
      role = pt['role']
      unless %w[system user assistant].include?(role)
        errors << "#{nid}: prompt_template role '#{role}' 不合法"
      end
    end

    # workflow 模式 LLM 不应有 memory（反之 advanced-chat 应有）
    has_memory = nd.key?('memory')
    if mode == 'workflow' && has_memory
      errors << "#{nid}: workflow 模式 LLM 不应有 memory"
    end

    # 检查 context.variable_selector 引用
    ctx = nd['context'] || {}
    if ctx['enabled'] && ctx['variable_selector'].is_a?(Array) && ctx['variable_selector'].size >= 1
      ref_id = ctx['variable_selector'][0].to_s
      errors << "#{nid}: context 引用了不存在的节点 #{ref_id}" unless valid_ref?(ref_id, node_map)
    end

  # ── Code ──
  when 'code'
    lang = nd['code_language']
    errors << "#{nid}: code_language '#{lang}' 不合法" unless VALID_CODE_LANGS.include?(lang)

    outputs = nd['outputs'] || {}
    unless outputs.is_a?(Hash)
      errors << "#{nid}: code outputs 应为 dict，实际为 #{outputs.class}"
      next
    end
    outputs.each do |name, attrs|
      type = attrs.is_a?(Hash) ? attrs['type'] : attrs
      unless VALID_CODE_TYPES.include?(type)
        errors << "#{nid}: code output '#{name}' type '#{type}' 不合法"
      end
    end

    # 变量引用格式：必须是对象数组
    vars = nd['variables'] || []
    vars.each do |v|
      unless v.is_a?(Hash) && v.key?('variable') && v.key?('value_selector')
        errors << "#{nid}: code variables 必须用对象格式 {variable, value_selector}"
      end
      # 检查引用
      sel = v['value_selector']
      if sel.is_a?(Array) && sel.size >= 1
        ref_id = sel[0].to_s
        errors << "#{nid}: 变量引用了不存在的节点 #{ref_id}" unless valid_ref?(ref_id, node_map)
      end
    end

  # ── Template Transform ──
  when 'template-transform'
    vars = nd['variables'] || []
    vars.each do |v|
      unless v.is_a?(Hash) && v.key?('variable') && v.key?('value_selector')
        errors << "#{nid}: template-transform variables 必须用对象格式"
      end
    end

  # ── Knowledge Retrieval ──
  when 'knowledge-retrieval'
    sel = nd['query_variable_selector']
    unless sel.is_a?(Array)
      errors << "#{nid}: KB 必须用 query_variable_selector 扁平数组，不是 #{sel.class}"
    else
      ref_id = sel[0].to_s if sel.size >= 1
      errors << "#{nid}: KB 引用了不存在的节点 #{ref_id}" if ref_id && !valid_ref?(ref_id, node_map)
    end
    errors << "#{nid}: KB 缺少 dataset_ids" if (nd['dataset_ids'] || []).empty?

  # ── IF/ELSE ──
  when 'if-else'
    (nd['cases'] || []).each do |c|
      cid = c['case_id']
      unless %w[true false].include?(cid)
        errors << "#{nid}: if-else case_id '#{cid}' 不合法，仅支持 true/false"
      end
      lo = c['logical_operator']
      errors << "#{nid}: logical_operator '#{lo}' 不合法" unless %w[and or].include?(lo)
      (c['conditions'] || []).each do |cond|
        op = cond['comparison_operator']
        unless VALID_COMPARISON_OPS.include?(op)
          errors << "#{nid}: comparison_operator '#{op}' 不合法"
        end
        sel = cond['variable_selector']
        if sel.is_a?(Array) && sel.size >= 1
          ref_id = sel[0].to_s
          errors << "#{nid}: if-else 条件引用了不存在的节点 #{ref_id}" unless valid_ref?(ref_id, node_map)
        end
      end
    end

  # ── Variable Aggregator ──
  when 'variable-aggregator'
    va_type = nd['output_type']
    va_vars = nd['variables'] || []

    # 必须是裸嵌套数组 [[id, field], ...]
    va_vars.each do |v|
      unless v.is_a?(Array) && v.size == 2
        errors << "#{nid}: VA variables 必须用裸嵌套数组 [[id, field]]，不是 #{v.class}"
      end
    end

    # 类型一致性
    va_vars.each do |var|
      next unless var.is_a?(Array) && var.size >= 1
      src_id = var[0].to_s
      src_field = var[1]
      src_node = node_map[src_id]
      next unless src_node

      src_type = src_node.dig('data', 'type')

      if src_type == 'knowledge-retrieval' && va_type != 'array'
        errors << "#{nid}: VA output_type=#{va_type}，但 KB #{src_id} 输出 array"
      elsif src_type == 'code'
        code_outputs = src_node.dig('data', 'outputs') || {}
        field_type = code_outputs.dig(src_field, 'type') || code_outputs[src_field]
        if field_type && !field_type.to_s.start_with?('array') && va_type == 'array'
          errors << "#{nid}: VA output_type=array，但 #{src_id}.#{src_field} 类型=#{field_type}"
        end
      elsif src_type == 'llm' && va_type == 'array'
        errors << "#{nid}: VA output_type=array，但 LLM #{src_id} 输出 string"
      end
    end

    # 百度搜索结果（Code）不与 KB 混入同一 VA
    has_kb = false
    has_search_code = false
    va_vars.each do |var|
      next unless var.is_a?(Array)
      src = node_map[var[0].to_s]
      next unless src
      st = src.dig('data', 'type')
      stitle = src.dig('data', 'title') || ''
      has_kb = true if st == 'knowledge-retrieval'
      has_search_code = true if st == 'code' && (stitle.include?('搜索') || stitle.include?('百度'))
    end
    errors << "#{nid}: 百度搜索结果（Code/string）与 KB（array）混入同一 VA" if has_kb && has_search_code

  # ── Document Extractor ──
  when 'document-extractor'
    sel = nd['variable_selector']
    unless sel.is_a?(Array)
      errors << "#{nid}: Document Extractor 必须用 variable_selector 扁平数组"
    end

  # ── Question Classifier ──
  when 'question-classifier'
    sel = nd['query_variable_selector']
    if !sel.is_a?(Array)
      errors << "#{nid}: Question Classifier 必须用 query_variable_selector 扁平数组"
    elsif sel.size >= 1
      ref_id = sel[0].to_s
      errors << "#{nid}: QC 引用了不存在的节点 #{ref_id}" unless valid_ref?(ref_id, node_map)
    end

  # ── Tool ──
  when 'tool'
    unless nd['plugin_unique_identifier'].is_a?(String) && nd['plugin_unique_identifier'].include?('@')
      errors << "#{nid}: Tool 缺少完整 plugin_unique_identifier（含 hash）"
    end
    errors << "#{nid}: Tool tool_node_version 应为 '2'" unless nd['tool_node_version'] == '2'

  # ── Answer ──
  when 'answer'
    ans_vars = nd['variables'] || []
    ans_vars.each do |v|
      unless v.is_a?(Hash) && v.key?('variable') && v.key?('value_selector')
        errors << "#{nid}: Answer variables 必须用对象格式"
      end
      sel = v['value_selector']
      if sel.is_a?(Array) && sel.size >= 1
        ref_id = sel[0].to_s
        errors << "#{nid}: Answer 引用了不存在的节点 #{ref_id}" unless valid_ref?(ref_id, node_map)
      end
    end

  # ── End ──
  when 'end'
    outputs = nd['outputs'] || []
    unless outputs.is_a?(Array)
      errors << "#{nid}: End outputs 应为数组列表，实际为 #{outputs.class}"
    end

  # ── Iteration ──
  when 'iteration'
    errors << "#{nid}: Iteration 缺少 start_node_id" unless nd['start_node_id']
    errors << "#{nid}: Iteration 缺少 iterator_selector" unless nd['iterator_selector'].is_a?(Array)

  # ── Unknown ──
  else
    # Unlisted node types are tolerated (custom plugins, etc.)
  end

  # ── 通用：检查 variables/value_selector 引用 ──
  vars = nd['variables']
  if vars.is_a?(Array)
    vars.each do |v|
      next unless v.is_a?(Hash)
      sel = v['value_selector']
      if sel.is_a?(Array) && sel.size >= 1
        ref_id = sel[0].to_s
        errors << "#{nid}: variables 引用了不存在的节点 #{ref_id}" unless valid_ref?(ref_id, node_map)
      end
    end
  end
end

# ═══════════════════════════════════════════
# 4. Answer vs End 模式匹配
# ═══════════════════════════════════════════

has_answer = nodes.any? { |n| n.dig('data', 'type') == 'answer' }
has_end    = nodes.any? { |n| n.dig('data', 'type') == 'end' }

if mode == 'advanced-chat'
  errors << "advanced-chat 模式必须用 Answer 节点" unless has_answer
  errors << "advanced-chat 模式不应有 End 节点" if has_end
elsif mode == 'workflow'
  errors << "workflow 模式必须用 End 节点" unless has_end
  errors << "workflow 模式不应有 Answer 节点" if has_answer
end

# ═══════════════════════════════════════════
# 5. 边检查
# ═══════════════════════════════════════════

edge_ids_seen = Set.new
node_id_set = node_map.keys.to_set
edge_sources = Set.new
edge_targets = Set.new

edges.each do |e|
  src = e['source']
  tgt = e['target']
  sh  = e['sourceHandle']
  eid = e['id']
  ed  = e['data'] || {}

  # 重复边 ID
  if edge_ids_seen.include?(eid)
    errors << "边 ID '#{eid}' 重复"
  else
    edge_ids_seen << eid
  end

  # source/target 存在
  errors << "边 source '#{src}' 对应的节点不存在" unless node_id_set.include?(src)
  errors << "边 target '#{tgt}' 对应的节点不存在" unless node_id_set.include?(tgt)

  # sourceType/targetType 存在
  errors << "边 #{eid}: data.sourceType 缺失" unless ed.key?('sourceType')
  errors << "边 #{eid}: data.targetType 缺失" unless ed.key?('targetType')

  # isInIteration 存在
  errors << "边 #{eid}: data.isInIteration 缺失" unless ed.key?('isInIteration')

  # sourceHandle 与节点类型匹配
  src_node = node_map[src]
  if src_node
    st = src_node.dig('data', 'type')
    case st
    when 'if-else'
      errors << "边 #{eid}: if-else sourceHandle '#{sh}'，只允许 true/false" unless %w[true false].include?(sh)
    when 'question-classifier'
      # class id 都合法
    else
      errors << "边 #{eid}: #{st} sourceHandle '#{sh}'，应为 'source'" unless sh == 'source'
    end
  end

  edge_sources << src
  edge_targets << tgt
end

# 重复边（同 source + sourceHandle + target + targetHandle）
edge_sigs = Set.new
edges.each do |e|
  sig = [e['source'], e['sourceHandle'], e['target'], e['targetHandle']]
  if edge_sigs.include?(sig)
    errors << "重复边: #{e['source']} --[#{e['sourceHandle']}]--> #{e['target']}"
  end
  edge_sigs << sig
end

# ═══════════════════════════════════════════
# 6. 连通性
# ═══════════════════════════════════════════

# Start 不得有入边；End/Answer/KB 不得有出边
nodes.each do |n|
  id = n['id']
  nt = n.dig('data', 'type')
  is_in_iter = n.dig('data', 'isInIteration') || false

  # 无入边
  unless edge_targets.include?(id) || nt == 'start' || nt == 'iteration-start'
    errors << "#{id}: #{nt} 节点无入边"
  end

  # 无出边（迭代内部的末梢节点不需要出边，输出由 iteration output_selector 收集）
  unless edge_sources.include?(id) || %w[end answer].include?(nt) || is_in_iter
    errors << "#{id}: #{nt} 节点无出边"
  end

  # Start 不能有入边
  if nt == 'start' && edge_targets.include?(id)
    errors << "#{id}: Start 节点不应有入边"
  end
end

# (KB→VA 是标准 RAG 连接模式，允许出边)

# ═══════════════════════════════════════════
# 7. 循环检测 (DFS)
# ═══════════════════════════════════════════

adj = Hash.new { |h, k| h[k] = [] }
edges.each { |e| adj[e['source']] << e['target'] }

WHITE = 0; GRAY = 1; BLACK = 2
color = Hash.new(WHITE)
has_cycle = false

dfs = lambda do |u|
  color[u] = GRAY
  adj[u].each do |v|
    if color[v] == GRAY
      has_cycle = true
    elsif color[v] == WHITE
      dfs.call(v)
    end
  end
  color[u] = BLACK
end

node_id_set.each { |u| dfs.call(u) if color[u] == WHITE }
errors << "图中存在循环" if has_cycle

# ═══════════════════════════════════════════
# 8. VA variables 与边一致性
# ═══════════════════════════════════════════

nodes.select { |n| n.dig('data', 'type') == 'variable-aggregator' }.each do |va|
  va_var_sources = (va.dig('data', 'variables') || [])
    .select { |v| v.is_a?(Array) && v.size >= 1 }
    .map { |v| v[0].to_s }
    .to_set
  edge_srcs_to_va = edges.select { |e| e['target'] == va['id'] }.map { |e| e['source'] }.to_set

  (va_var_sources - edge_srcs_to_va).each do |src|
    errors << "#{va['id']}: variables 引用 #{src}，但无边连接"
  end
  (edge_srcs_to_va - va_var_sources).each do |src|
    errors << "#{va['id']}: 边 #{src}→#{va['id']} 存在，但 variables 未引用"
  end
end

# ═══════════════════════════════════════════
# 9. 输出
# ═══════════════════════════════════════════

puts "════════════════════════════════════════"
puts "  Dify DSL 校验: #{ARGV[0]}"
puts "  mode: #{mode}, #{nodes.size} nodes, #{edges.size} edges"
puts "════════════════════════════════════════"

if errors.empty?
  puts "  ✅ 全部通过（CRITICAL 级别）"
else
  errors.each { |e| puts "  ❌ #{e}" }
  puts "\n  #{errors.size} errors"
end

exit errors.empty? ? 0 : 1
