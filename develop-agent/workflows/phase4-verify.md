# Phase 4: Verify

验证默认在本地执行。**无 preprod / 测试环境的项目（如静态小游戏、个人项目）直接本地验证，不使用也不询问 ci-lite**；只有受 ci-lite 支持且存在测试环境的项目，才在用户确认后使用。ci-lite 只服务部分项目，`~/ci-lite` 不一定存在，禁止默认假定可用。

## 0. 验证路径判断

- **项目无 preprod / 测试环境**（如 Minesweeper 这类静态小游戏、个人项目）→ 走 A 本地验证，**不询问 ci-lite**
- **项目受 ci-lite 支持且存在 preprod** → 询问用户是否使用 ci-lite；确认后走 B
- **用户明确要求使用 ci-lite** → 先检查 `~/ci-lite` 是否存在、项目是否受支持；缺失/不支持则回 A

Minesweeper 这类项目没有测试环境，直接走 A。

## A. 本地验证（默认）

### 1. 收集上下文

从 Phase 3 获取：
- 开发分支名
- commit hash 列表
- 修改范围摘要

### 2. 构建

执行项目对应的构建命令（Minesweeper：`npm run build`）。构建失败 → 回 Phase 3 修复并追加 commit。

### 3. 浏览器回归

启动 `npm run dev` 或 `npm run preview`，加载 browser-agent 的 AGENTS.md，用 `playwright-cli` 验证：

- **响应式矩阵**：320×568 / 390×844 / 568×320 / 667×375 / 768×1024 / 1024×768 / 1440×900；无横向/纵向溢出；HUD、棋盘、Toast 不越界
- **玩法**：首击 3×3 安全、翻开全部安全格胜利、插满旗不胜利、踩雷失败、计时起停、重开、换难度
- **状态**：胜负结算卡片、Toast 堆叠（上限 3、8px 间距、不拦截点击）、超旗负数、插旗模式
- **控制台**：无 console error / pageerror

记录关键断言输出与截图。

### 4. 结果确认

展示验证结果表格（检查项 + 预期 + 实际 + 状态）。失败项记录阻塞原因并讨论。用户确认后 sign-off。

### 5. 归档（飞书模式）

通过 feishu-agent 更新 Develop 任务文档：

- 更新任务上下文：`**测试分支**: 本地验证（未使用 ci-lite）`
- 追加 Phase 4 章节：记录本地构建结果、浏览器回归结果、截图路径（无 BUILD / DEPLOY ID）
- 追加 `✅ Phase 4 Sign-off`

## B. ci-lite 路径（用户确认后）

### 1. 前置检查

```bash
ls ~/ci-lite
```

- 不存在 → 回到 A 本地验证，或请用户提供 ci-lite 路径
- 项目需在支持列表：`door-adminpro` / `official-website` / `humanbench-web` / `door-applets-bg` / `door-applets`
- 不在列表 → 回到 A 本地验证

### 2. 确定测试分支

默认沿用**上次部署的分支**：

```bash
cd ~/ci-lite && ./scripts/status.sh <project>
# 输出按时间倒序，第一行的 BRANCH 即上次部署分支
# 无部署记录 → 按新建处理，需用户确认分支名
```

### 3. cherry-pick 到测试分支

**不要直接在开发分支上构建。** 测试分支已存在是常态，拉到最新后 cherry-pick 增量 commits；仅当确认需要新建时，才从 master 创建：

```bash
# 复用（默认路径）
git checkout <test-branch>
git pull origin <test-branch>
git cherry-pick <commit1> <commit2> ...   # Phase 3 的所有 commits
git push origin <test-branch>

# 新建（需用户确认分支名）
git checkout master
git pull origin master
git checkout -b <test-branch>
git cherry-pick <commit1> <commit2> ...
git push origin <test-branch>
```

冲突时优先 `git checkout --theirs <file>` 接受开发分支版本，再 `git cherry-pick --continue`。

### 4. 使用 ci-lite 构建

读取 `~/ci-lite/AGENTS.md` 作为操作指令：

```bash
cd ~/ci-lite
./scripts/build.sh <project> <test-branch>
```

- 返回 BUILD ID（10 位大写 hex）
- 构建日志：`{project}/output/{BUILDID}/build.log`

### 5. 使用 ci-lite 部署

```bash
cd ~/ci-lite
./scripts/deploy.sh <project> <BUILDID> preprod [version]
```

- 返回 DEPLOY ID
- 确认重启成功（official-website：`pm2 restart official-ssr`；door-applets-bg：重启脚本）
- 生产通道未配置，仅支持 preprod

**小程序（door-applets）**：deploy 即上传微信平台（robot 2），不是服务器部署。
- 版本号缺省自动生成 `vYY.MM.DDTNN`；日志见 `{project}/output/{BUILDID}/upload.log`
- 上传后在微信公众平台「版本管理 → 开发版本」手动「选为体验版」
- 小程序无法由协调器自动验证，验收依赖真机复测

**Web（humanbench-web）**：strategy `rsync-dir`，纯静态 dist 同步到站点目录（宝塔 Node/PM2 服务读磁盘即生效，无需重启）。
- 构建期 env 见 `config/env/humanbench-web.env`（`VITE_*`，改后需重新构建）
- 站点 nginx 反代（`/wx-api/` `/r/` `/og/`）不属于 ci-lite 产物，需在站点配置中维护

### 6. 线上验证

- 首页与目标页面可访问（HTTP 200）
- SEO（如适用）：JSON-LD、title/description/Twitter Card/OG、sitemap、OG 图片
- 功能（如适用）：新组件渲染、iframe、表单

展示验证结果表格（检查项 + 预期 + 实际 + 状态）。

### 7. 归档（飞书模式）

- 更新任务上下文：`**测试分支**: {test-branch}`
- 追加 Phase 4 章节：BUILD ID / DEPLOY ID / 测试地址 / 验证结果 / 修复记录
- 追加 `✅ Phase 4 Sign-off`

## Sign-off 条件

**本地验证（A）**
- [ ] 构建成功
- [ ] 浏览器回归清单通过（失败项已记录阻塞原因）
- [ ] 飞书文档已追加 Phase 4

**ci-lite（B）**
- [ ] Build 成功，有 BUILD ID
- [ ] Deploy 成功，PM2 online
- [ ] 线上验证完成（关键检查项通过）
- [ ] 飞书文档已追加 Phase 4

## 产出

- **A**：本地构建结果 + 浏览器回归证据（截图 / 关键断言）
- **B**：BUILD ID + DEPLOY ID + preprod URL + 验证结果表格
