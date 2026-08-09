# 深度调研流程

多轮迭代搜索 → 抓取内容 → 评估缺口 → 综合报告。适合需要综合分析、对比多个来源的复杂课题。

## 执行流程

### Phase 0: 入场准备
1. 读取用户提供的调研主题
2. 询问用户确认搜索深度（默认 `DEFAULT_DEPTH` 轮）
3. 初始化：`findings=[]`, `topics=[]`, `urls=[]`

### Phase 1: 问题拆解
1. LLM 分析用户问题，拆解维度：
   - 核心概念/定义
   - 不同立场/观点
   - 数据/案例
   - 时间线/发展趋势
2. 为每个维度生成 1-2 个搜索关键词
3. 初始化 todo 追踪

### Phase 2: 多轮搜索

每轮执行以下步骤（最多 `DEFAULT_DEPTH` 轮）：

#### 2.1 执行搜索
```bash
# 打开 Google（首次需加 --headed）
playwright-cli open https://www.google.com --headed
# 后续轮次直接 reload + fill
playwright-cli fill "input[name=q]" "<搜索关键词>"
playwright-cli press Enter
```

#### 2.2 提取结果
```bash
# 获取搜索结果页 snapshot
playwright-cli snapshot
# 从 snapshot 输出中提取：
# - 前 N 条结果的标题和链接
# - 每条结果的摘要片段
```

#### 2.3 抓取内容
```bash
# 对前 MAX_RESULTS_PER_QUERY 条结果，用 webfetch 抓取全文
webfetch <url1>
webfetch <url2>
webfetch <url3>
```

#### 2.4 分析缺口
- LLM 分析本轮获取的信息
- 判断：信息是否充分？还有哪些未覆盖的角度？
- 输出：`continue: true/false` + 下一轮搜索词
- 如果 continue=false 或已达最大轮次 → 进入 Phase 3

#### 2.5 记录进度
- 将关键发现追加到 `findings[]`
- 记录已搜索关键词到 `topics[]`
- 记录已抓取 URL 到 `urls[]`

### Phase 3: 综合报告
1. LLM 汇总所有轮次的 `findings`
2. 按 `templates/report.md` 格式生成结构化报告
3. 写入 `output/{主题}-{YYYY-MM-DD}.md`

### Phase 4: 质量检查
- [ ] 报告包含所有必需章节（概述、核心发现、详细分析、结论、来源）
- [ ] 每个核心发现有一句话总结
- [ ] 来源链接完整可访问
- [ ] 没有明显的知识缺口

## 终止条件
- LLM 判断信息充分 → 提前终止
- 达到 `DEFAULT_DEPTH` 轮次 → 强制终止
- 连续两轮无新信息 → 提前终止
- 用户手动中断

## 注意事项
- 每次浏览器操作前先 snapshot 确认页面状态
- Google 可能弹出 cookie 弹窗，先用 snapshot 检查并处理
- 搜索关键词使用 Google 高级搜索语法时需转义
- 报告中的引用必须附带来源 URL
