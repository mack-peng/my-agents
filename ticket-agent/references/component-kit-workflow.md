# Component-Kit 开发与集成工作流

当 bug 修复涉及 `component-kit` 源码变更时，按以下流程操作。

## 前置条件

- `$COMPONENT_KIT_PATH` / `$BOBKAT_PATH` 已在 `.env` 中配置
- 代码已在 Phase 3 中完成修改

## 流程一览

```
Phase 3: 代码完成
  │
  ▼
Phase 4: component-kit 提交
  ├── 从 develop 创建开发分支
  ├── 提交源码 commit（不含构建产物）
  ├── 推送开发分支（仅源码）
  ├── 用户提供公共测试分支名（如 `test`）
  ├── cherry-pick 源码到公共测试分支
  ├── 在公共测试分支上 yarn build → 提交构建产物
  ├── 获取 commit ID
  └── 记录 commit ID（供 bobcat 使用）
  │
  ▼
Phase 4b: bobcat 依赖更新（用户通知后触发）
  ├── 用户提供 bobcat 测试分支名
  ├── 直接拉取测试分支
  ├── 修改 3 个 package.json 的 component-kit 引用为 commit ID
  ├── 用户 yarn → 提交 yarn.lock
  ├── 推送测试分支
  └── 通知用户 build 部署测试环境
  │
  ▼
Phase 5: Component-kit MR
  ├── 从开发分支向 develop 提交 MR
  ├── 生成 MR 描述（参考 mr-template.md）
  ├── glab mr create
  └── 等待 review 通过
  │
  ▼
Phase 5b: 生产 tag + Bobcat MR（review 通过后触发）
  ├── component-kit: fetch tags → develop 切本地构建分支 → yarn build → commit 构建产物 → 打 tag → 推 tag
  └── bobcat: develop 切分支 → 更新 package.json 为生产 tag → yarn → commit → push → glab mr create
```

## 1. component-kit 代码提交（Phase 4）

详见 `workflows/phase4-commit.md`。

### 1a. 创建开发分支

```bash
cd $COMPONENT_KIT_PATH

# 拉取最新 develop
git checkout develop && git pull origin develop

# 创建开发分支（分支名规范：fix-component-kit-<简短描述>）
git checkout -b fix-component-kit-<short-desc>
```

### 1b. 提交源码 commit

**仅提交 src/ 目录，不包含构建产物（es/）。**

```bash
git add src/
git commit -m "fix(<area>): <简短描述>"
```

### 1c. 推送开发分支

```bash
git push origin fix-component-kit-<short-desc>
```

开发分支仅保留源码 commit，不包含构建产物。

### 1d. Cherry-pick 到公共测试分支

用户提供 component-kit 的公共测试分支名（如 `test`、`integration`）：

```bash
git checkout <test-branch> && git pull origin <test-branch>
git cherry-pick <source-commit-hash>
```

如 cherry-pick 有冲突，向用户报告冲突文件和内容。

### 1e. 在公共测试分支上构建

```bash
# 构建
yarn build

# 提交构建产物
git add es/
git commit -m "Build: product"

# 推送到公共测试分支
git push origin <test-branch>

# 获取 commit ID（供 bobcat 引用）
git rev-parse HEAD
```

记录 commit ID，用于 Phase 4b bobcat 依赖更新。

## 2. bobcat 依赖更新（Phase 4b，用户通知后触发）

详见 `workflows/phase4-bobcat-update.md`。

用户直接提供 bobcat 测试分支，不再创建开发分支：

```bash
cd $BOBKAT_PATH
git checkout <test-branch> && git pull origin <test-branch>
```

修改以下 3 个文件中的 component-kit 引用，**使用 Phase 4 的 commit ID：**

| 文件 | 
|------|
| `package.json` |
| `fe-apps/fujian-edu/package.json` |
| `fe-apps/support/package.json` |

```diff
- "component-kit": "https://private-gem:...@cd.i.strikingly.com/.../component-kit.git#<old-tag-or-hash>",
+ "component-kit": "https://private-gem:...@cd.i.strikingly.com/.../component-kit.git#<commit-id>",
```

```bash
git add package.json fe-apps/fujian-edu/package.json fe-apps/support/package.json
git commit -m "fix(deps): update component-kit to <commit-id>"
```

**用户手动操作**：`yarn` → 提交 `yarn.lock`。

```bash
git add yarn.lock
git commit -m "chore(deps): update yarn.lock"
git push origin <test-branch>
```

然后通知用户 build 部署测试环境。

## 3. 提交 Component-kit MR（Phase 5）

详见 `workflows/phase5-mr-component-kit.md`。

从开发分支（`fix-component-kit-*`）向 develop 提交 MR：

```bash
cd $COMPONENT_KIT_PATH
glab mr create \
  --source-branch <branch-name> \
  --target-branch develop \
  --title "<title>" \
  --reviewer <reviewer-username> \
  --description "$(cat /tmp/component-kit-mr-desc.md)"
```

等待 review 通过后进入 Phase 5b。

## 4. 生产 tag + Bobcat MR（Phase 5b）

详见 `workflows/phase5-mr-component-kit.md`。

### 4a. Component-kit 生产 tag

从 develop 切本地构建分支、构建、打 tag：

```bash
cd $COMPONENT_KIT_PATH
git fetch origin --tags
git checkout develop && git pull origin develop
git checkout -b publish-product-YYYYMMDD    # 本地分支，不推送；已存在则接 -01 后缀
yarn build
git add -A && git commit -m 'Build: product'
git tag v<production-version>
git push origin v<production-version>
```

生产版本号 = 最新生产 tag 版本号 +1。Tag 在 https://cd.i.strikingly.com/strikingly/component-kit/tags 查看。

Tag 推送后停下等用户确认，再继续 Bobcat MR。

### 4b. Bobcat MR

从 develop 切分支，更新 3 个 package.json 中 component-kit 引用为生产 tag：

```diff
- "...component-kit.git#<old-ref>",
+ "...component-kit.git#v<production-version>",
```

```bash
cd $BOBKAT_PATH
git checkout develop && git pull origin develop
git checkout -b use-new-component-kit-v<production-version>
# 修改 package.json / fe-apps/fujian-edu/package.json / fe-apps/support/package.json
yarn
git add package.json fe-apps/fujian-edu/package.json fe-apps/support/package.json yarn.lock
git commit -m "feat(component-kit): update component kit version for v<production-version>"
git push origin <branch-name>
glab mr create --source-branch <branch-name> --target-branch develop ...
```



### Git 操作原则

**禁止 force push**：`git push --force` / `git push -f` / `git push origin +<branch>` 一律禁止。推送前可 amend（本地未推送的 commit），推送后如需修改则追加新 commit。

遵循 ticket-agent Git 规范：
- 前缀：`fix-` / `feat-` / `refactor-`
- 分隔符：`-`（不用 `/`）

| 仓库 | 分支前缀 | 示例 |
|------|---------|------|
| component-kit | `fix-component-kit-` | `fix-component-kit-searchable-dropdown-viewport` |
| bobcat（依赖更新） | `fix-deps-` | `fix-deps-component-kit-searchable-dropdown` |
| bobcat（源码修改） | `fix-` | `fix-sxl-landing-page-mobile` |

## Commit 格式

```
<type>(<scope>): <简短描述>
```

只写 title，不写 body。示例：

```
fix(searchable-dropdown): calculate viewport space for fixed positioning
fix(deps): update component-kit to <commit-id>
chore(deps): update yarn.lock
Build: product
```
