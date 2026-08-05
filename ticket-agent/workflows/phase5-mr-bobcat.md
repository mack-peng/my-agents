# Phase 5: Bobcat MR

Bobcat 单独变更时提交 MR。

## 前置条件

- Phase 3 代码已完成
- Phase 4 开发分支已推送
- `glab` 已认证

## 流程

### 1. 确认分支状态

```bash
cd $BOBKAT_PATH
git log --oneline -3 <branch-name>
```

### 2. 询问 Reviewer

| Username |
|----------|
| `@chaipengrong` |
| `@walter.huang` |

> **"请选择 Reviewer：1. @chaipengrong  2. @walter.huang"**

### 3. 生成 MR 描述

使用 `references/mr-template.md` 模板生成 MR 描述：**严格保持模板结构不变**，将各 section 的占位提示替换为实际内容，勾选 checklist，表中 `Reviewer` 栏位填入 reviewer username。写入 `/tmp/bobcat-mr-desc.md`。

### 4. 创建 MR

```bash
cd $BOBKAT_PATH
glab mr create \
  --source-branch <branch-name> \
  --target-branch develop \
  --title "<title>" \
  --reviewer <reviewer-username> \
  --description "$(cat /tmp/bobcat-mr-desc.md)"
```

### 5. 输出总结

```
## Phase 5: Bobcat MR

### MR 信息
- **标题**: <title>
- **分支**: <branch-name> → develop
- **Reviewer**: @<reviewer>
- **MR 链接**: <URL>
```

### 6. 等待 Sign-off

> **"Phase 5 完成。Bobcat MR 已创建，等待 review 通过。"**

## 飞书文档追加

```markdown
## Phase 5: Bobcat MR
- **标题**: <title>
- **分支**: <branch-name> → develop
- **Reviewer**: @<reviewer>
- **MR 链接**: <URL>
- **状态**: 等待 review

## Phase 5 TODO
- [x] 创建 bobcat MR。结果：<URL>
```

## MR Review 反馈处理

1. 在开发分支上修改代码
2. 推送新 commit（不 squash，不 force push）
3. 在 MR 中回复 Reviewer
4. Review 通过后 sign-off 结束
