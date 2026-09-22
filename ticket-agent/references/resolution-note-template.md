# Zendesk RESOLUTION NOTE 模版

## 使用规则

- root cause 只保留本工单实际命中的一项，用短句（如 `-Caused by custom code`），删除其余选项
- `Actions required from the user` 默认留空；仅在确需客户操作时填写
- 成功截图内嵌在 `* Please provide screenshots to show that it's resolved` 行下方
- 解决方案写在 MR 链接行下方：如何解决（动作 + 注释掉的用户代码块）+ `user reference`（系统现有实现/参考代码）
- `Submitted by` 填 `zendesk-agent/.env` 的 `SUBMITTED_BY`
- 备注语言英文，以内部备注（private）发送；发送方式（html_body 内嵌 + curl）见 `workflows/phase6-reply.md`

## root cause 选项清单（只保留命中项）

- This is a support and done.
- Data issue and fixed.
- This is a bug and fixed.
- This is a current design bug.
- Caused by custom code, user can remove it and republish
- Data analysis service issue and it has been fixed.
- translation error. We have started the translation repair process, which is expected to be updated next Monday

## 目标格式

```text
RESOLUTION NOTE
* Is the impact on the user side resolved？YES
* Did you verify whether it's resolved? YES
* Please provide screenshots to show that it's resolved
<img src="<upload content_url>">

* Root cause of the issue: 
-<命中的 root cause 短句>

* Actions required from the user:
* Submitted by: <SUBMITTED_BY>

* Please put down the code merge request link here. If there's no code merge request, please explain how you solved the issue.

<如何解决，例如：>
Comment out user-defined code：
/**
 * <被注释掉的客户自定义代码>
 */

user reference，Current system usage, responsive support
<系统现有实现（如响应式 CSS 规则）>
```

## 已发送样例（工单 #26561573，截图已内嵌）

```text
RESOLUTION NOTE
* Is the impact on the user side resolved？YES
* Did you verify whether it's resolved? YES
* Please provide screenshots to show that it's resolved
<img src="https://strikingly.zendesk.com/attachments/token/YTBKuvRH7Jt99xYEXK3KlsH4E/?name=cap-home.png">

* Root cause of the issue: 
-Caused by custom code

* Actions required from the user:
* Submitted by: peng.he

* Please put down the code merge request link here. If there's no code merge request, please explain how you solved the issue.

Comment out user-defined code：
/**
 * .s-navbar-section.navigator.strikingly-fixed {
 *   width: 30% !important;
 * }
*/

user reference，Current system usage, responsive support
.navigator {     width: 22%;}
@media only screen and (min-width: 1025px) and (max-width: 1200px) {
    .navigator {
        width: 26%;
    }
} 
@media only screen and (min-width: 728px) and (max-width: 1024px) {
    .navigator {
        width: 28%;
    }
} 
```
