# BugSnag 错误报告模板

本文件是 bugsnag-agent 报告的骨架事实源。动笔前按报告类型选骨架；报告中所有数字必须能追溯到一次 CLI 调用。

通用规则：

- 首行标题：飞书归档标题见 AGENTS.md「报告持久化」；本地标题同飞书标题
- 第二行元信息：日期 ｜ 项目 ｜ 数据口径（数量窗、sort、filters）
- 每条假设标置信度：`DEFINITE`（CLI 事实或直接可验证结论）/ `PROBABLE`（强形态推断，一处数据即可验证）/ `INDEFINITE`（方向性判断）/ `UNVERIFIABLE`（当前上报缺失无法判断）
- 堆栈注明 `in_project`：`true` = 第一方代码可修；`null` = 第三方/压缩 bundle → 责任抛向前端阈值调整或后端
- 涉及用户邮箱 / IP 一律脱敏后引用
- 文件名遵循 AGENTS.md「报告持久化」：非 `[a-zA-Z0-9._-]` 字符替换为 `-`，同名已存在则追加序号，不覆盖
- 尾部固定一行状态位（本地版本记录飞书归档链接；未归档写 `（未归档）`）

---

## 骨架一：全景报告（triage）

```markdown
# BugSnag 错误报告 | <project-slug> | <窗口> | <YYYY-MM-DD>

> 日期 ｜ 项目：<slug>（<project-id 前 8 位>）｜ 口径：error.status=open + event.since=<窗口>，sort=events

## 1 现象概览

Top N 表格：# / 错误类 / events / users / 触发页 / 一句话描述

## 2 受影响面

- 全量 vs Top N 占比；用户数、浏览器与 OS 分布（error-pivots --summary-size 5）
- release 维度（error-pivots release.seen_in）、版本分布缺口
- **注：pivots 是单错误维度的拆解，全景仅取 Top1-3 抽样，代表性强但不等同全项目全集**

## 3 错误分组

- 同源错误归组（相同 error_class / 相同 bundle / 相同 fetch 层），组内注明编号
- 已知历史报告关联（output/ 既有文件名引用）

## 4 趋势定性（Top1-3）

- error-trend --resolution 2h 相邻桶走势；spike / chronic / 回落

## 5 建议与下一步

- 每条建议哪个团队可执行（前端 / 后端 / 平台）
- 提示下一步：候深入某条错误 → 指明 `#` 编号
```

---

## 骨架二：单错误深度分析（deepdive）

```markdown
# BugSnag 错误报告 | <project-slug> | <error_class> | <YYYY-MM-DD>

> 日期 ｜ 项目：<slug> ｜ 错误：<errorId> ｜ 生命周期：first_seen→last_seen / 全量 events / users

## 1 错误身份

- error_class / message / grouping_reason / heading 状态（open/resolved/regression）
- 同族错误清单（同 error_class 的其他 errorId 与差异一句话）

## 2 数据定性

- 趋势（error-trend）：spike 或 chronic；最近桶数字
- 维度（error-pivots --summary-size 5）：浏览器 / OS / release / 自定义字段分布

## 3 堆栈定位

- error-latest-event 全堆栈摘录（前 3 帧 + 关键帧）
- `in_project` 状态与责任归属划分
- 事件上下文：request.url 样本、breadcrumbs 内容与缺失（缺失本身是发现 → 写入 UNVERIFIABLE）

## 4 假设与置信度

- H1..Hn 每条一行，尾部标（DEFINITE / PROBABLE / INDEFINITE / UNVERIFIABLE）
- 每条假设注明"一处数据即可验证"的验证路径

## 5 建议行动

- 按可执行主体排序：前端 / 后端 / 平台 / 监控配置
- 验证方式（如何用本 CLI 或后端数据复核）

## 结论

2-4 句收束：定性 + 责任划分 + 第一优先动作。

---
飞书归档：（未归档）
```
