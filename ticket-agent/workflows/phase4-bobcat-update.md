# Phase 4b: bobcat 依赖更新

## 触发条件

仅当 Phase 4 修改了 component-kit 源码时适用。**Phase 4 sign-off 后不自动触发**，等待用户明确通知。

## 前置条件

- Phase 4（component-kit 提交）已完成
- 已有 component-kit 测试 tag（如 `v2.0.16.01T`）
- `$BOBKAT_PATH` 已在 `.env` 中配置

## 流程

### 1. 获取上下文

从飞书文档或对话上下文中提取：Phase 4 的 component-kit **测试 tag**（如 `v2.0.16.01T`）。

### 2. 获取测试分支

用户直接提供 bobcat 测试分支名称：

> **"请提供 bobcat 测试分支名称："**

```bash
cd $BOBKAT_PATH
git checkout <test-branch> && git pull origin <test-branch>
```

### 3. 更新 component-kit 依赖

修改以下 3 个文件中的 component-kit 引用，**使用 Phase 4 的测试 tag（如 `v2.0.16.01T`）：**

| 文件 | 说明 |
|------|------|
| `package.json` | 主仓库依赖 |
| `fe-apps/fujian-edu/package.json` | Fujian Edu 应用依赖 |
| `fe-apps/support/package.json` | Support 应用依赖 |

```diff
- "component-kit": "https://private-gem:...@cd.i.strikingly.com/.../component-kit.git#<old-tag-or-hash>",
+ "component-kit": "https://private-gem:...@cd.i.strikingly.com/.../component-kit.git#<test-tag>",
```

提交：

```bash
git add package.json fe-apps/fujian-edu/package.json fe-apps/support/package.json
git commit -m "fix(deps): update component-kit to <test-tag>"
```

### 4. 用户手动操作

> **"package.json 已更新为 component-kit tag `<test-tag>`。请执行 `yarn` 安装依赖。"**

用户完成 yarn 后，提交 yarn.lock：

```bash
git add yarn.lock
git commit -m "chore(deps): update yarn.lock"
```

### 5. 推送测试分支

```bash
git push origin <test-branch>
```

### 6. 通知用户

> **"测试分支 `<test-branch>` 已推送。请执行 build 部署测试环境并通知测试验证。"**

### 7. 输出总结

```
## Phase 4b: bobcat 依赖更新

### 分支信息
- **测试分支**: <test-branch>
- **依赖 commit**: <hash> — fix(deps): update component-kit to <test-tag>
- **lock  commit**: <hash> — chore(deps): update yarn.lock

### 修改文件
- package.json
- fe-apps/fujian-edu/package.json
- fe-apps/support/package.json
- yarn.lock

### 下一步
用户执行 build 部署测试环境，QA 验证通过后进入 Phase 5。
```

### 8. 等待 Sign-off

> **"Phase 4b 完成。测试分支 `<test-branch>` 已推送。请执行 build 部署测试环境，QA 验证通过后回复确认进入 Phase 5。"**

---

## 飞书模式：Sign-off 后

**Use feishu-agent** → `lark-cli docs +update` 追加 `## Phase 4b: bobcat 依赖更新` 到文档。
