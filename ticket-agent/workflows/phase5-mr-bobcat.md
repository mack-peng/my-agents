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
| `@lixiang.ding` |

> **"请选择 Reviewer：1. @chaipengrong  2. @walter.huang  3. @lixiang.ding"**

### 3. 生成 MR 描述

使用 `references/mr-template.md` 模板生成 MR 描述：**严格保持模板结构不变**，将各 section 的占位提示替换为实际内容，勾选 checklist，表中 `Reviewer` 栏位填入 reviewer username。**Description、Reason、Solution、Scope Of Impact 部分使用中文填写。** 写入工作台 `tmp/bobcat-mr-desc.md`（禁止系统 `/tmp/`）。

分支包含 `refactor:` commit 时，在 Solution / Scope Of Impact 中单列「重构范围 / 旧→新代码分支清单映射 / 删除分支证明」。

### 4. 创建 MR

```bash
DESC="$(cat tmp/bobcat-mr-desc.md)"   # cwd=工作台，先读入变量（glab 需在 bobcat 目录执行）
cd $BOBKAT_PATH
glab mr create \
  --source-branch <branch-name> \
  --target-branch develop \
  --title "<title>" \
  --reviewer <reviewer-username> \
  --description "$DESC"
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

0. 先按 `references/review-triage.md` 分诊每条评论：事实是否成立、是否本工单范围、是否过度设计；再决定接受 / 部分接受 / 另开票 / 拒绝。**禁止盲改或静默忽略**。
1. 在开发分支上修改代码
2. 推送新 commit（不 squash，不 force push）
3. **逐条行内回复** Reviewer 的每个 discussion thread（禁止只发一条 MR 总评论）：

   ```bash
   # 列出 thread（取 discussion id、首条作者与时间）
   glab api "projects/<ns>%2F<repo>/merge_requests/<iid>/discussions?per_page=100" | \
     jq -r '.[] | select(.notes[0].system != true) | [.notes[0].created_at, .id, .notes[0].author.username, .notes[0].body[0:50]] | @tsv'
   # 在对应 thread 内回复（每条 must / recommend 各一条，注明修复 commit 与对应改动）
   glab api "projects/<ns>%2F<repo>/merge_requests/<iid>/discussions/<disc_id>/notes" -X POST -f body="<修复说明>"
   ```

   - 回复用中文，技术标识（commit SHA、file:line）保持原样
   - reviewer 的独立评论（individual note）无法行内回复（HTTP 400 "Discussion is an individual note."）→ 用 MR 总评论兜底并 @reviewer
4. **重新请求 review**（必做）：`glab mr update <iid> --reviewer <reviewer>`（GitLab 会发出 request review 通知），并提示对比 version diff
5. 若追加的是 `refactor:` commit，reviewer 必须核对旧/新代码分支清单映射，确认没有未映射的删除分支
6. Review 通过后 sign-off 结束
