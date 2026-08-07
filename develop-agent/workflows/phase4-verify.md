# Phase 4: Verify

委托 morph-agent 构建并部署到 preprod 环境，然后验证线上效果。

## 执行步骤

### 1. 收集上下文

从 Phase 3 获取：
- 分支名
- commit hash
- 修改范围摘要

向用户确认：
- 部署目标（preprod / 其他环境）
- 分支名（默认 Phase 3 的推送分支）

### 2. 委托 morph-agent 构建

```
use morph-agent build
```

morph-agent 执行：
- 环境预检（Docker 磁盘、morph-cli 可用）
- `morph-cli build <project> <branch>`
- 返回 Build ID

### 3. 委托 morph-agent 部署

```
use morph-agent deploy
```

morph-agent 执行：
- `morph-cli deploy <project> <buildId>`
- 返回 Deploy ID
- 确认 PM2 重启成功

### 4. 线上验证

协调器自动执行以下验证：

**基础检查：**
- 首页可访问（HTTP 200）
- 目标页面可访问（如有特定页面）

**SEO 相关验证（如适用）：**
- JSON-LD 结构化数据正确
- Meta 标签（title、description、Twitter Card、OG）存在
- Sitemap URL 可访问
- OG 图片 HTTP 200

**功能验证（如适用）：**
- 新组件渲染正常
- iframe 可加载
- 表单可提交

向用户展示验证结果表格（检查项 + 预期 + 实际 + 状态）。

### 5. 协调器确认流程

- 展示验证结果
- 如有失败项，记录阻塞原因并讨论
- 用户确认后 sign-off
- 飞书文档追加 `✅ Phase 4 Sign-off`（含 Build ID + Deploy ID + 验证结果）

## Sign-off 条件

- [ ] Build 成功，有 Build ID
- [ ] Deploy 成功，PM2 online
- [ ] 线上验证完成（关键检查项通过）
- [ ] 飞书文档已追加 Phase 4 章节

## 产出

- Build ID + Deploy ID
- 验证结果表格
- 线上可访问的 preprod URL
