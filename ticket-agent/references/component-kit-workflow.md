# Component-Kit 开发与集成工作流

当 bug 修复涉及 `component-kit` 源码变更时，按以下流程操作。

## 前置条件

- `component-kit` 源码已 clone 到本地
- `$BOBKAT_PATH` 中配置的 bobcat 仓库可用

## 1. component-kit 代码修改

```bash
cd $COMPONENT_KIT_PATH

# 拉取最新 develop
git checkout develop && git pull origin develop

# 创建开发分支（分支名规范：fix-ck-<简短描述>）
git checkout -b fix-component-kit-<short-desc>
```

修改源码后执行构建：

```bash
NODENV_VERSION=<required> yarn build
```

`<required>` 为 `.node-version` 中指定的版本；如该版本未安装 `yarn`，使用最接近的已安装版本。

构建产出在 `es/` 目录，需一并提交。

## 2. 提交与推送

```bash
git add -A
git commit -m "fix(<area>): <简短描述>"
git push -u origin <branch-name>
```

获取 commit hash：

```bash
git rev-parse HEAD
```

## 3. bobcat 集成

```bash
cd $BOBKAT_PATH

git checkout develop && git pull origin develop
git checkout -b <branch-name>
```

更新 `package.json` 中 component-kit 的 commit hash：

```diff
- "component-kit": "https://private-gem:...@cd.i.strikingly.com/.../component-kit.git#v2.0.8",
+ "component-kit": "https://private-gem:...@cd.i.strikingly.com/.../component-kit.git#<new-commit-hash>",
```

执行安装和本地验证：

```bash
yarn && yarn dev-new
```

验证通过后提交：

```bash
git add package.json yarn.lock
git commit -m "fix(deps): update component-kit for <改动摘要>"
git push origin <branch-name>
```

## 4. 推送测试环境

按 bobcat 标准测试流程（详见 `workflows/phase4-commit.md`）：

```bash
git checkout <test-branch> && git pull origin <test-branch>
git cherry-pick <commit-hash>
git push origin <test-branch>
git checkout <branch-name>
```

## 分支命名规范

遵循 ticket-agent Git 规范：
- 前缀：`fix-` / `feat-` / `refactor-`
- 分隔符：`-`（不用 `/`）
- component-kit 分支用 `fix-component-kit-` 前缀以区分直接修改 bobcat 的分支

## Commit 格式

```
<type>(<scope>): <简短描述>
```

只写 title，不写 body。示例：

```
fix(modal): apply body scroll management to all platforms
fix(deps): update component-kit for scrollbar shift fix
```
