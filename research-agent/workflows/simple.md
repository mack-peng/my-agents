# 简单搜索流程

单轮 Google 搜索 → 抓取前几篇 → LLM 整理。适合快速查一个事实、定义、数据或列表。

## 触发条件
- 用户说 "查一下/搜一下/快速搜索" + 具体关键词
- 明显不需要多轮分析的简单问题
- 用户给了一个很具体的搜索词

## 执行流程

### Step 1: 搜索
```bash
playwright-cli open https://www.google.com --headed
playwright-cli snapshot
playwright-cli fill "input[name=q]" "<关键词>"
playwright-cli press Enter
```

### Step 2: 提取
```bash
playwright-cli snapshot
# 从 snapshot 中提取前 3-5 条结果的：
# - 标题
# - URL
# - 摘要
```

### Step 3: 抓取
```bash
# 用 webfetch 逐个抓取感兴趣的结果
webfetch <url1>
webfetch <url2>
```

### Step 4: 整理
- LLM 根据抓取内容回答用户问题
- 格式：简洁直接，引用来源
- 如果信息不够，主动提示用户是否需要深度调研

## 输出
简要回答 + 来源链接，不生成完整报告。
