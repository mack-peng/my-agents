# code-agent — 人机协同开发

基于 OpenCode 的 feature-level 开发助手。接收产品 Spec + FE Code Design，在目标项目中落地实现。

---

## 工具链

### CodeGraph — 语义代码智能

本项目已集成 [CodeGraph](https://github.com/colbymchenry/codegraph)，为 OpenCode 提供语义代码索引和智能查询能力。

**核心能力：**
- `codegraph_explore` — 智能代码探索（主要工具）
- `codegraph_search` — 符号搜索
- `codegraph_callers` — 查找调用者
- `codegraph_callees` — 查找被调用者
- `codegraph_impact` — 影响分析（修改前必查）
- `codegraph_node` — 获取符号详情
- `codegraph_status` — 查看索引状态

**使用原则：**
- **优先使用 CodeGraph** 回答结构性问题 — 它是预建的索引，避免重复的 grep/read 循环
- **修改前查影响** — 使用 `codegraph_impact` 分析改动的影响范围
- **信任返回结果** — 不要再用 grep 验证，注意编辑后的 staleness banner

## 项目初始化流程

进入新代码库时，按以下顺序执行：

### 1. CodeGraph 代码图谱初始化

```bash
# 检查是否已初始化
codegraph status

# 如果未初始化，执行：
codegraph init -i

# 再次确认状态
codegraph status
```

**说明：**
- `codegraph init -i` 会创建 `.codegraph/` 目录并构建初始索引
- 索引完成后，才能使用 `codegraph_explore`, `codegraph_search` 等工具
- 如果项目较大，首次索引可能需要几分钟

### 2. 项目结构探索

```bash
# 查看项目文件结构（从索引中读取，比 ls 更快）
codegraph files --format tree

# 识别技术栈
codegraph explore package.json tsconfig.json vite.config.*
```

### 3. 建立项目上下文

在理解项目结构后，创建项目专属的 AGENTS.md（如果项目本身没有）：
- 记录项目技术栈、目录规范
- 记录已发现的关键组件、工具函数位置
- 记录 CodeGraph 索引状态

---

## 人机协同工作流

```
用户提供设计文档 → AI 理解并规划 → 用户确认 → AI 编码 → 验证交付
```

### 1. 输入

- `.spec.md` — 产品需求文档（PM 产出）
- `*_code_design.md` — 前端代码设计文档（含组件树、数据流、API 定义、样式变更清单）

### 2. 理解与规划

- 从 Code Design 中提取 **Tech Changes** 表格（组件/样式/数据/Hook 变更清单）
- 按 **Page Block Order** 和 **Component Tree** 确定实现顺序
- 识别主要难点（动态表单联动、CTA 滚动、表单提交）
- 创建 Todo List 分步跟踪

### 3. 编码原则

- **不猜测框架** — 先探索项目 `package.json`、`tsconfig.json`、目录结构，确认技术栈
- **遵循既有模式** — 阅读现有组件，模仿其 import 风格、CSS Module 命名、组件库用法
- **集中管理数据** — 所有静态常量（角色列表、证言、FAQ、步骤等）集中在 `constants/index.tsx`
- **代码优先于注释** — 不写注释，用自描述的命名和结构表达意图
- **批量写入** — 同一层的文件（多个新组件）并行写入，减少往返

### 4. 验证

- 类型检查（如 `tsc --noEmit`）
- lint 检查（如 `eslint src/ --fix`）
- 修复所有 error 后交付

## 职责边界

| 负责 | 不负责 |
|------|--------|
| 按 Code Design 创建/修改组件、样式、Hook、Utils | 后端 API 开发（仅对接约定好的接口） |
| 表单验证、动态联动、滚动交互 | 第三方服务配置、Webhook 路由 |
| 静态数据抽取到 constants | SEO / SSR 专项优化 |
| 组件库封装 | 部署、CI/CD |
| 页面区块编排与背景色交替 | 视觉/UX 大改（遵循设计文档） |
