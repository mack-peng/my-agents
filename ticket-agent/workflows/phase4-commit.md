# Phase 4: 提交代码

## 输入

飞书文档 URL（Phase 1-3 全部内容） + 用户指定的测试分支名称

## 前置条件

- `$BOBKAT_PATH` 已在 `.env` 中配置
- 代码修改已在 Phase 3 完成并通过 sign-off

## 流程

### 1. 读取飞书文档

**Use feishu-agent** → `lark-cli docs +fetch` 读取文档。

提取：工单标题（用于生成分支名）、修改文件列表

### 2. 询问测试分支

**"请指定 cherry-pick 的目标测试分支名称："**

用户提供后记录。

### 3. 生成分支名

根据工单内容生成分支名：`fix-<简短描述>`（如 `fix-sxl-landing-page-mobile`）

向用户确认分支名。

### 4. Git 操作

**在 `$BOBKAT_PATH` 下执行：**

```bash
# 1. 切换到 develop 并拉取最新
git checkout develop && git pull origin develop

# 2. 创建新分支
git checkout -b <branch-name>

# 3. 暂存修改
git add <files>

# 4. 提交
git commit -m "fix(<area>): <简短描述>"

# 5. 推送
git push origin <branch-name>

# 6. Cherry-pick 到测试分支
git checkout <test-branch> && git pull origin <test-branch>
git cherry-pick <commit-hash>
git push origin <test-branch>

# 7. 切回开发分支
git checkout <branch-name>
```

### 5. 输出总结

```
## Phase 4: 代码提交

### 分支信息
- **开发分支**: <branch-name>
- **测试分支**: <test-branch>
- **Commit**: <hash> — <message>

### Cherry-pick 状态
- ✅ 已 cherry-pick 到 <test-branch>
```

### 6. 等待 Sign-off

**"Phase 4 完成。代码已推送到 <branch-name>，已 cherry-pick 到 <test-branch>。请通知测试验证。验证通过后回复确认继续。"**

### 7. Sign-off 后：追加飞书文档

**Use feishu-agent** → `lark-cli docs +update` 追加 `## Phase 4: 代码提交` 到文档。

### 8. 如测试反馈需要修改

1. 回到 Phase 3，在新的 commit 中修改代码
2. 将新 commit cherry-pick 到测试分支
3. 重新等待测试确认
4. 如有多个 commit，MR 前需要 squash
