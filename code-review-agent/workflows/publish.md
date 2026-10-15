# 发布阶段（Publish，可选）

**这条工作流是什么**：把本地评审报告的结论与发现发布到 PR / MR 评论（GitHub / GitLab）。**默认不发布**——评审默认只产出本地报告。

**哪几步停下来等你**：发布前必须获得用户显式确认。

---

## 发布门禁（全部满足才发布）

1. 本地报告已存在
2. 用户明确要求发布评论
3. agent 已重读将要发布的确切评论内容
4. 每条评论包含问题简述 + 作者可复核的关键证据
5. 评论不暴露 token、私有配置、无关本地路径，不把推测当作事实

默认 review 阶段不发布任何内容。

---

## 发布模式

- **Summary note**：一条评论，含结论与选定发现（默认、最稳）
- **Inline candidates**：仅对文件/行映射可靠的评论尝试行级评论；评论简洁但必须含：
  - stance + issue 摘要
  - 证据（spec/design 引用 + 代码路径或行号）
  - 影响与建议动作（不明显时）

行级评论与位置 payload 视平台而定；**行级发布失败或行映射不确定时降级为 summary note**，在正文引用文件路径与行号。

---

## 平台适配

| 平台 | 方式 |
|------|------|
| GitHub PR | 委托 github-agent（`gh pr comment` / `gh api` 行级评论） |
| GitLab MR | 委托 gitlab-agent（`glab mr note`；行级 discussion 视实例版本，失败降级 summary） |

---

## 评论结构（建议）

```md
### ISSUE-xxx - P1/P2/P3 - <标题>

- Stance: [must] / [recommend] / [non-blocking]
- Evidence: <spec/design 引用 + 代码路径:行号>
- Impact:
- Recommendation:
```

---

## 发布后

- 在 `review.md` 的「发布计划」节回填已发布内容与失败项
- 不改动 issue-registry 的状态语义（发布 ≠ 修复）；已解决问题由作者提交新版本后走重复评审（见 `workflows/review-phases.md` 的 round delta）
