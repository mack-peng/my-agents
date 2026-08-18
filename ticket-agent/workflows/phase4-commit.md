# Phase 4: 代码提交

## 路径判断

Phase 3 sign-off 后，根据修改目标自动选择路径：

| 修改目标 | 仓库 | 下一步 |
|---------|------|--------|
| component-kit 源码 | `$COMPONENT_KIT_PATH` | 本流程（component-kit 路径） |
| bobcat 源码 | `$BOBKAT_PATH` | 本流程（bobcat 路径） |
| 两者都改了 | 各自处理 | 先 component-kit，再 bobcat |

---

## component-kit 路径

### 前置条件

- `$COMPONENT_KIT_PATH` 已在 `.env` 中配置且为有效 git 仓库
- Phase 3 代码修改已完成

### 禁止操作

- **禁止 force push**：`git push --force` / `git push -f` / `git push origin +<branch>` 一律禁止
- 推送前可 amend（本地未推送的 commit），推送后如需修改则追加新 commit

### 流程

#### 1. 拉取最新 develop

```bash
cd $COMPONENT_KIT_PATH
git checkout develop && git pull origin develop
```

#### 2. 创建开发分支

分支命名：`fix-component-kit-<简短描述>`（如 `fix-component-kit-searchable-dropdown-viewport`）

```bash
git checkout -b <branch-name>
```

确认分支名后创建。

#### 3. 提交源码 commit

**仅提交源码，不包含构建产物（`es/` 目录）。**

```bash
git add src/
git commit -m "fix(<area>): <简短描述>"
```

#### 4. 推送开发分支

```bash
git push origin <branch-name>
```

#### 5. 获取公共测试分支名

用户提供 component-kit 的公共测试分支名（如 `test`、`integration`）：

> **"请提供 component-kit 的公共测试分支名："**

```bash
git checkout <test-branch> && git pull origin <test-branch>
```

#### 6. Cherry-pick 源码到公共测试分支

```bash
git cherry-pick <source-commit-hash>
```

如 cherry-pick 有冲突，向用户报告冲突文件和内容。

#### 7. 在公共测试分支上构建

```bash
yarn build
```

构建产出在 `es/` 目录。

#### 8. 提交构建产物

```bash
git add es/
git commit -m "Build: product"
git push origin <test-branch>
```

#### 9. 获取 commit ID

```bash
git rev-parse HEAD
```

记录 commit ID，供 Phase 4b bobcat 依赖更新使用。

#### 10. 输出总结

```
## Phase 4: 代码提交（component-kit）

### 分支信息
- **开发分支**: <branch-name>（仅源码）
- **源码 commit**: <hash> — <message>
- **公共测试分支**: <test-branch>
- **构建产物 commit**: <commit-id> — Build: product

### 下一步
等待用户通知是否进入 bobcat 依赖更新，使用 commit ID `<commit-id>` 引用 component-kit。
```

#### 11. 等待 Sign-off

> **"Phase 4 完成。开发分支 `<branch-name>`（仅源码）已推送。构建产物已推送到公共测试分支 `<test-branch>`，commit ID 为 `<commit-id>`。是否进行 bobcat 依赖更新？回复 '跳过' 则直接进入 Phase 5。"**

---

## bobcat 路径（修改仅在 bobcat）

### 前置条件

- `$BOBKAT_PATH` 已在 `.env` 中配置且为有效 git 仓库

### 流程

#### 1. 询问测试分支

> **"请指定 cherry-pick 的目标测试分支名称："**

#### 2. 生成分支名

根据工单内容生成：`fix-<简短描述>`

#### 3. Git 操作

在 `$BOBKAT_PATH` 下执行：

```bash
git checkout develop && git pull origin develop
git checkout -b <branch-name>
git add <files>
git commit -m "fix(<area>): <简短描述>"
git push origin <branch-name>
git checkout <test-branch> && git pull origin <test-branch>
git cherry-pick <commit-hash>
git push origin <test-branch>
git checkout <branch-name>
```

#### 4. 输出总结

```
## Phase 4: 代码提交（bobcat）

### 分支信息
- **开发分支**: <branch-name>
- **测试分支**: <test-branch>
- **Commit**: <hash> — <message>

### Cherry-pick 状态
- ✅ 已 cherry-pick 到 <test-branch>
```

#### 5. 等待 Sign-off

> **"Phase 4 完成。代码已推送到 <branch-name>，已 cherry-pick 到 <test-branch>。请通知测试验证。验证通过后回复确认继续。"**

---

## 飞书模式：Sign-off 后

**Use feishu-agent** → `lark-cli docs +update` 追加 `## Phase 4: 代码提交` 到文档。

Session 模式在对话中记录摘要。
