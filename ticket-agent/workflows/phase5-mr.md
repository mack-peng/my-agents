# Phase 5: 提交 MR

## 输入

飞书文档 URL（飞书模式）或对话上下文（Session 模式） + 用户指定的 Reviewer

## 前置条件

- Phase 4 已完成（代码已推送到开发分支，测试已通过）
- `glab` 已认证（通过 gitlab-agent）

## 流程

### 1. 获取上下文

**飞书模式**：**Use feishu-agent** → `lark-cli docs +fetch` 读取文档。提取：工单标题、Zendesk URL、问题描述、根因、解决方案、影响面、分支名、测试结果

**Session 模式**：从对话上下文中提取 Phase 1-4 的摘要和结论。

### 2. 询问 Reviewer

**"请提供 Reviewer 的名字（@chaipengrong 或 @walter.huang）："**

### 3. 生成 MR 描述

使用 `references/mr-template.md` 模板，从 Phase 1-4 中填充：
- **飞书模式**：从飞书文档提取
- **Session 模式**：从对话上下文提取

| 模板字段 | 数据来源 |
|---------|---------|
| Zendesk ticket | Phase 1 的工单 URL |
| Reviewer | 用户指定 |
| Description | Phase 1 的问题描述 |
| Reason | Phase 2 的根因分析 |
| Solution | Phase 3 的解决方案 |
| Scope Of Impact | Phase 3 的影响面 |
| Test Result | Phase 4 的测试验证结果 |

将填充后的模板写入临时文件 `/tmp/mr_desc.md`。

### 4. 创建 MR

**Use gitlab-agent**。

在 `$BOBKAT_PATH` 下执行：

```bash
# 方式 1：直接创建（推荐）
glab mr create \
  --source-branch <branch-name> \
  --target-branch develop \
  --title "<title>" \
  --description "$(cat /tmp/mr_desc.md)"

# 方式 2：两步法（description 过长时）
glab mr create --source-branch <branch-name> --target-branch develop --title "<title>" --no-editor
glab api projects/<gitlab-project-path>/merge_requests/<iid> -X PUT -f description="$(cat /tmp/mr_desc.md)"
```

### 5. 输出总结

```
## Phase 5: MR 提交

### MR 信息
- **标题**: <title>
- **分支**: <branch-name> → develop
- **Reviewer**: @<reviewer>
- **MR 链接**: <URL>
```

### 6. 等待 Sign-off

**"Phase 5 完成。MR 已创建。全部流程结束。"**

### 7. Sign-off 后

**飞书模式**：**Use feishu-agent** → `lark-cli docs +update` 追加 `## Phase 5: MR` 到文档。

**Session 模式**：在对话中记录 Phase 5 摘要，流程结束。

### 8. 如 Reviewer 反馈需要修改

1. 在开发分支上修改代码
2. 重新 cherry-pick 到测试分支验证
3. 推送新 commit
4. 在 MR 中回复 Reviewer
