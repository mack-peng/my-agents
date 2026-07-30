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
  ├── 用户提供 base tag → git checkout <base-tag>（游离 HEAD）
  ├── cherry-pick 源码 commit
  ├── yarn build → 提交构建产物 commit
  ├── 打测试 tag（v2.0.16 → v2.0.16.01T）
  └── 推送测试 tag
  │
  ▼
Phase 4b: bobcat 依赖更新（用户通知后触发）
  ├── 用户提供 bobcat 测试分支名
  ├── 直接拉取测试分支
  ├── 修改 3 个 package.json 的 component-kit 引用为测试 tag
  ├── 用户 yarn → 提交 yarn.lock
  ├── 推送测试分支
  └── 通知用户 build 部署测试环境
  │
  ▼
Phase 5: MR
  ├── component-kit: 基于 base tag 升版本号 → 打生产 tag（v2.0.16 → v2.0.17）
  └── bobcat: package.json 改生产 tag → yarn → commit → glab mr create
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

### 1d. 切换到 base tag 并 cherry-pick

用户提供生产 base tag（如 `v2.0.16`）：

```bash
git fetch --tags
git checkout <base-tag>        # 进入 detached HEAD 状态
git cherry-pick <source-commit-hash>
```

### 1e. 构建并打测试 tag

```bash
# 构建
NODENV_VERSION=<required> yarn build

# 提交构建产物
git add es/
git commit -m "Build: product"

# 打测试 tag（v2.0.16 → v2.0.16.01T，v2.0.16.01T → v2.0.16.02T）
git tag <test-tag>
git push origin <test-tag>
```

测试 tag 末尾带 `T` 后缀，区别于生产 tag。

## 2. bobcat 依赖更新（Phase 4b，用户通知后触发）

详见 `workflows/phase4-bobcat-update.md`。

用户直接提供 bobcat 测试分支，不再创建开发分支：

```bash
cd $BOBKAT_PATH
git checkout <test-branch> && git pull origin <test-branch>
```

修改以下 3 个文件中的 component-kit 引用，**使用 Phase 4 的测试 tag（如 `v2.0.16.01T`）：**

| 文件 | 
|------|
| `package.json` |
| `fe-apps/fujian-edu/package.json` |
| `fe-apps/support/package.json` |

```diff
- "component-kit": "https://private-gem:...@cd.i.strikingly.com/.../component-kit.git#<old-tag-or-hash>",
+ "component-kit": "https://private-gem:...@cd.i.strikingly.com/.../component-kit.git#<test-tag>",
```

```bash
git add package.json fe-apps/fujian-edu/package.json fe-apps/support/package.json
git commit -m "fix(deps): update component-kit to <test-tag>"
```

**用户手动操作**：`yarn` → 提交 `yarn.lock`。

```bash
git add yarn.lock
git commit -m "chore(deps): update yarn.lock"
git push origin <test-branch>
```

然后通知用户 build 部署测试环境。

## 3. 提交 MR（Phase 5）

### 3a. Component-kit 生产 tag

基于 Phase 4 的 base tag 升版本号（如 `v2.0.16` → `v2.0.17`），打生产 tag（不带 `T` 后缀）：

```bash
cd $COMPONENT_KIT_PATH
git tag v<production-version>
git push origin v<production-version>
```

Tag 可在 https://cd.i.strikingly.com/strikingly/component-kit/tags 查看。

### 3b. Bobcat MR

将 package.json 中的 component-kit 引用从测试 tag 改为生产 tag：

```diff
- "component-kit": "...component-kit.git#<test-tag>",
+ "component-kit": "...component-kit.git#v<production-version>",
```

```bash
yarn
git add package.json fe-apps/fujian-edu/package.json fe-apps/support/package.json yarn.lock
git commit -m "fix(deps): update component-kit to v<production-version>"
git push origin <branch-name>
```

然后 `glab mr create` 创建 MR。

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
fix(deps): update component-kit to v2.0.16.01T
chore(deps): update yarn.lock
Build: product
```
