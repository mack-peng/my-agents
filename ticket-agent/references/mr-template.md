# Bug 修复 Code Review

|                | **References** |
| -------------- | -------------- |
| Jira Ticket    | REPLACE_URL    |
| Zendesk ticket | REPLACE_NAME   |
| Reviewer       | REPLACE_NAME   |

> **⚠️ 上表中 `REPLACE_NAME` / `REPLACE_URL` 必须替换为实际值。尤其是 Reviewer 栏位，填入用户选择的 reviewer username（如 `@walter.huang`），不可留空。**

## 问题解决过程

### 问题描述

用简短的语句清晰描述问题，附上截图或问题链接

### 原因

简要说明问题的真正原因是什么

### 解决方案

详细阐述解决问题的方法和思路

### 影响范围

通过清单列出代码变更的影响范围，并通知 QA

### 测试结果

请提供修复后的截图或链接

## 代码提交自检清单

### 通用

- [ ] 我已完成全量 diff 自审
- [ ] 代码可**回滚**，不会对现有用户造成影响

### 可复用性 / 可维护性

- [ ] 代码遵循 **DRY** 原则，优先复用了已有实现
- [ ] 非常规写法已添加注释说明原因
- [ ] diff 不含与本次修复无关的代码
- [ ] diff 不含调试代码
- [ ] 已通过 lint 检查，符合代码规范
- [ ] commit 已压缩为原子步骤
- [ ] 使用了有意义的 commit message 描述变更
- [ ] 所有 CSS 符合规范: https://cd.i.strikingly.com/strikingly/Bobcat/wikis/CSS-Quality

### 兼容性

- [ ] 代码不会导致已有用户数据异常
- [ ] 代码不会对已打开的客户端造成问题（如浏览器 tab、旧版 iOS APP）
- [ ] 样式变更兼容移动端

### 引入新三方库

如果引入了新的第三方库，请填写此部分；否则替换为"不涉及"

- [ ] 协议是否为 MIT 或 Apache？如否，请让 @dafeng 审核
- [ ] 未有功能相似的已有库

### 其他

- [ ] 理解只有 reviewer 应该 resolve 评论
- [ ] 理解 review 反馈的修改将以独立 commit 提交，不 squash（squash 会清掉所有评论）
- [ ] 会仔细阅读并回复每一条评论
