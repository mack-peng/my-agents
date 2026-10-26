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

**默认必须使用行级评论（inline code-line comment）**：每条 issue 落在对应的新增行/变更行上，便于作者就地查看与回复。只有以下情况才允许降级为 summary note：

- 行映射不可靠（跨文件汇总、删除行无法定位、生成文件等）
- 平台不支持行级 discussion，或行级 API 连续失败

禁止用一条 summary note 代替本可定位到代码行的 issue。行级评论必须含：

- stance + issue 摘要
- 证据（spec/design 引用 + 代码路径或行号）
- 影响与建议动作（不明显时）

### GitLab 行级 discussion payload

```json
{
  "body": "<comment>",
  "position": {
    "position_type": "text",
    "base_sha": "<diff_refs.base_sha>",
    "start_sha": "<diff_refs.start_sha>",
    "head_sha": "<diff_refs.head_sha>",
    "new_path": "<file>",
    "new_line": 123
  }
}
```

- `new_line` 使用 head 版本的行号，且必须是 diff 中新增/变更的行；删除行用 `old_line`。
- SHA 必须取 MR 当前 `diff_refs`（`glab api projects/:id/merge_requests/:iid | jq .diff_refs`）；head 变更后旧行号可能失效，发布前重新核对。
- 发布后用 API 或 `glab mr view` 复核评论是否落在预期行；失败则按上文的降级规则处理，并在 `review.md` 记录失败项。

**Summary note** 仅在降级时使用，且正文必须引用 `file:line` 并说明为何无法行级定位。

---

## 平台适配

| 平台 | 方式 |
|------|------|
| GitHub PR | 委托 github-agent：行级用 `gh api -X POST repos/:owner/:repo/pulls/:n/comments`（`commit_id` / `path` / `line` / `side`）；失败再降级 `gh pr comment` |
| GitLab MR | 委托 gitlab-agent：行级用 `POST /projects/:id/merge_requests/:iid/discussions`（`position` 见上）；失败再降级 `glab mr note` |

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
