# GitLab MR Workflow

当用户说"帮我提MR"、"提交 MR"、"创建 MR"并提供上下文时，执行对应的操作。

## 用户输入模式

用户会提供：
- **MR 链接**（必须）— 完整的 MR URL，branch 已在 URL 中
  - 格式：`https://cd.i.strikingly.com/strikingly/Bobcat/merge_requests/new?merge_request[source_branch]=<branch>`
- **描述内容**（必须）— 一个已基本填写完整的 MR 描述文本

从描述中提取以下字段（用户可能在描述中以任意格式提供）：
- **Zendesk Ticket URL** 或 **Jira Ticket URL**（二选一，互斥，看 URL 含 `zendesk` 还是 `atlassian`）
  - Zendesk：`https://strikingly.zendesk.com/agent/tickets/<id>`（纯 URL，不要用 markdown link）
  - Jira：`https://strikingly.atlassian.net/browse/<issue>`
- **Reviewer** — 如果用户的描述中写的是 `REPLACE_NAME`，则询问用户选 `@chaipengrong` 还是 `@walter.huang`
- **Description** — 问题描述
- **Reason** — 根本原因
- **Solution** — 解决方案
- **Scope of Impact** — 影响范围
- **Test Result** — 留空

缺失的内容询问用户后再继续。不要修改用户提供的描述文本结构——保持原文，只填充缺失字段。

## 浏览器操作流程

1. `close` → 关闭已有浏览器
2. `open https://cd.i.strikingly.com --headed` → 启动浏览器
3. `state-load gitlab.state.json` → 加载登录态
4. `goto <用户提供的完整 MR URL>` → 跳转 MR 页面
5. `click "role=button[name='Choose a template']"` → 打开模板下拉
6. `click "role=link[name='Bugfix-FE']"` → 选择 Bugfix-FE 模板
7. 用 Python subprocess 运行 eval JS 填充 Description（见下方）
8. `snapshot` → 用 snapshot 展示给用户确认
9. **不要关闭浏览器** — 等用户检查后自行提交

## 步骤 7：填充 Description

**由于 shell 转义问题（内容含 `$`、反引号、中文等），必须用 Python subprocess 传参**，不能直接在 bash 中调 `playwright-cli eval`。

方法：写一个临时 Python 脚本 `/tmp/fill_mr.py`，内容如下（替换所有 `<...>` 占位符为实际值），然后 `python3 /tmp/fill_mr.py`：

```python
import subprocess

code = """() => {
  const ta = document.getElementById('merge_request_description');
  const zendesk = '<Zendesk URL，没有则填 N/A>';
  const jira = '<Jira URL，没有则填 N/A>';
  const reviewer = '<@chaipengrong 或 @walter.huang>';
  const description = '<Description 原文>';
  const reason = '<Reason 原文>';
  const solution = '<Solution 原文>';
  const scope = '<Scope of Impact 原文>';
  const testResult = '';

  const md = `# Code Review for Bug Fix

|                | **References** |
| -------------- | -------------- |
| Jira Ticket    | ${jira}    |
| Zendesk ticket | ${zendesk}   |
| Reviewer       | ${reviewer}   |

## Problem Solving Process

### Description

${description}

### Reason

${reason}

### Solution

${solution}

### Scope Of Impact

${scope}

### Test Result

${testResult}

## Self-checklist for Code Submitter

### General

- [x] I have read through the entire diff myself.
- [x] The code can be **rolled back** without causing any issue to users.

### Reusability/Maintainability

- [x] I have ensured that code is **DRY** and reused what others have written as much as possible.
- [x] For code that's unconventional, I have added comments to explain the reason for the change.
- [x] The diff does not include unrelated code to the overall purpose of the changes.
- [x] The diff does not contain any debugging code.
- [x] The diff has been linted to conform to code conventions.
- [x] I have squashed the commits into atomic steps before submitting for review.
- [x] I have made sure to use meaningful commit messages to describe the changes.
- [x] All CSS complies with these guidelines: https://cd.i.strikingly.com/strikingly/Bobcat/wikis/CSS-Quality

### Compatibility

- [x] The code will not cause any issue with existing user data.
- [x] The code will not cause any issue with existing opened clients (such as opened browser tab or older version of iOS mobile APP).
- [x] The style change is compatible with mobile clients.

### Adding a New Third-party Library

not applicable

### Others

- [x] I understand that only reviewers should resolve comments.
- [x] I understand that I will push commits based on earlier rounds of comment/feedback as isolated commits to the branch. I will not squash until the branch is ready to merge. (squashing will remove all comments)
- [x] I will be thorough and respond to every comment.`;

  ta.value = md;
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  ta.dispatchEvent(new Event('change', { bubbles: true }));
  return 'done';
}"""

result = subprocess.run(['playwright-cli', 'eval', code], capture_output=True, text=True)
print(result.stdout, end='')
if result.stderr: print(result.stderr, end='')
```

## 内容转义注意事项

写入 Python 脚本时必须处理：
- 中文原文直接粘贴，无需转义
- 描述中含 `\n` 换行的，写为 `\\n`（Python 字面量 → 传到 JS 变为真正的 `\n`）
- 代码块 `` ``` `` 在单引号 JS 字符串中无需转义
- 含 `${}` 的代码（如 `` `#${hashName}` ``）放单引号字符串中不会被 JS 模板插值
- 如果用户原文含 ASCII 单引号 `'`，需替换为 Unicode `'`（U+2019）

## 注意事项

- **不要在 bash 中直接传包含 `$`、反引号、中文的 eval 参数** — shell 会错误转义
- GitLab 的 Description 编辑器是 `<textarea id="merge_request_description">`，直接 JS 设置 `.value` + dispatch `input`/`change` 即可
- 模板选择器展开后，"Bugfix-FE" 是一个 `<a href="#">` 链接
- 复选框在 markdown 源中预设为 `- [x]`，无需点击页面元素
- `state-load` 必须在 `open` 之后、`goto` 之前执行
- 如果 `gitlab.state.json` 过期（跳转到 sign_in），提示用户提供新的 Netscape 格式 cookie
- **填充完成后不要关浏览器**，用户自行检查后点击 Submit
