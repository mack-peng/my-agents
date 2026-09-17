# Phase 4: Verify

使用 ci-lite（`~/ci-lite`）构建测试分支并部署到 preprod 环境，然后验证线上效果。

## 执行步骤

### 1. 收集上下文

从 Phase 3 获取：
- 开发分支名
- commit hash 列表
- 修改范围摘要

向用户确认：
- 部署目标（preprod）
- 测试分支名称（若不存在则新建）

### 2. 创建测试分支并 cherry-pick

**注意：不要直接在开发分支上构建。** 应从 master 创建专用测试分支，将开发分支的 commits cherry-pick 上去。

```bash
git checkout master
git pull origin master
git checkout -b <test-branch>
git cherry-pick <commit1> <commit2> ...   # Phase 3 的所有 commits
git push origin <test-branch>
```

> 若测试分支已存在，先拉到最新，再 cherry-pick 增量 commits。

### 3. 使用 ci-lite 构建

**使用上下文切换模式：读取 `~/ci-lite/AGENTS.md` 作为操作指令。**

```bash
cd ~/ci-lite
./scripts/build.sh <project> <test-branch>
```

- project：`door-adminpro` / `official-website` / `door-applets-bg` / `door-applets`（从项目 AGENTS.md 或用户确认）
- 返回 BUILD ID（10 位大写 hex）
- 构建日志：`{project}/output/{BUILDID}/build.log`

### 4. 使用 ci-lite 部署

```bash
cd ~/ci-lite
./scripts/deploy.sh <project> <BUILDID> preprod [version]
```

- 返回 DEPLOY ID
- 确认重启成功（official-website：`pm2 restart official-ssr`；door-applets-bg：重启脚本）
- 生产通道未配置，仅支持 preprod

**小程序（door-applets）**：deploy 即上传微信平台（robot 2），不是服务器部署。
- 版本号缺省自动生成 `vYY.MM.MMDTNN`（如 `v26.09.17T01`）；日志见 `{project}/output/{BUILDID}/upload.log`
- 上传后在微信公众平台「版本管理 → 开发版本」手动「选为体验版」
- 小程序无法由协调器自动验证，验收依赖真机复测

### 5. 线上验证

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
- 飞书文档追加 `✅ Phase 4 Sign-off`（含验证结果）

### 6. 归档（飞书模式）

通过 feishu-agent 更新 Develop 任务文档：

**更新任务上下文**（补充测试分支信息）：
- 使用 `str_replace` 更新 `**测试分支**: （待 Phase 4 补充）` 为实际分支名

**追加 Phase 4 章节**：

首次构建部署：
```markdown
## Phase 4: Verify

### 第 1 轮
- **测试地址**: {url}
- **测试结果**: ✅/❌

## Phase 4 TODO
- [x] 创建测试分支并 cherry-pick
- [x] ci-lite 构建（BUILD ID: {bid}）
- [x] ci-lite 部署（DEPLOY ID: {did}）
- [x] 线上验证
✅ Phase 4 Sign-off: 已确认
```

如发现问题需要修复，追加修复记录：
```markdown
### 修复记录
1. {问题描述} — {修复方案}
2. {问题描述} — {修复方案}

### 第 {n} 轮（最终）
- **测试地址**: {url}
- **测试结果**: ✅ 全部通过
```

**注意**：每轮修复后，将新的 commit 记录追加到 Phase 3 的 Commit 记录中，保持代码变更历史完整。

## Sign-off 条件

- [ ] Build 成功，有 Build ID
- [ ] Deploy 成功，PM2 online
- [ ] 线上验证完成（关键检查项通过）
- [ ] 飞书文档已追加 Phase 4 章节

## 产出

- Build ID + Deploy ID
- 验证结果表格
- 线上可访问的 preprod URL
