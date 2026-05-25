# GitHub CLI (gh) — Quick Reference

## 认证 & 配置

```bash
gh auth login              # 登录 GitHub
gh auth status             # 查看登录状态
gh auth switch             # 切换账号
gh config set editor "code -w"   # 设置编辑器
```

## 仓库操作

```bash
gh repo view OWNER/REPO            # 查看仓库
gh repo clone OWNER/REPO           # 克隆仓库
gh repo create [name] [--public|--private] [--clone]  # 创建仓库
gh repo fork OWNER/REPO            # fork 仓库
gh repo sync [OWNER/REPO]          # 同步上游
gh repo edit --description "..."   # 编辑仓库信息
gh repo list USER                  # 列出用户的仓库
gh repo set-default OWNER/REPO     # 设置默认仓库
```

## Issue

```bash
gh issue list              # 列出 open issues
gh issue create            # 创建 issue
gh issue view NUMBER       # 查看 issue
gh issue close NUMBER      # 关闭 issue
gh issue reopen NUMBER     # 重新打开
gh issue comment NUMBER -b "body"  # 评论
gh issue status            # 查看我的 issue 状态
gh issue list --assignee "@me"     # 分配给我的
gh issue list --author monalisa    # 某人创建的
gh issue list --label bug          # 按标签筛选
gh issue develop NUMBER    # 基于 issue 创建分支
```

## Pull Request

```bash
gh pr list                 # 列出 open PRs
gh pr create               # 创建 PR
gh pr view NUMBER          # 查看 PR
gh pr checkout NUMBER      # 切换到 PR 分支
gh pr diff                 # 查看 diff
gh pr review NUMBER -a     # 批准 review
gh pr review NUMBER -c -b "comments"  # 评论
gh pr merge NUMBER         # 合并 PR
gh pr close NUMBER         # 关闭 PR
gh pr reopen NUMBER        # 重新打开
gh pr ready NUMBER         # 标记为 ready
gh pr revert NUMBER        # 还原 PR
gh pr checks               # 查看 CI 状态
gh pr status               # 查看 PR 状态概览
gh pr list --review-requested=@me  # 待我 review
gh pr list --label "bug"          # 按标签筛选
gh pr list --author "@me"         # 我创建的
```

## GitHub Actions

```bash
gh run list                # 列出最近的 workflow runs
gh run view RUN_ID         # 查看 run 详情
gh run view RUN_ID --log   # 查看日志
gh run watch RUN_ID        # 实时查看运行
gh run rerun RUN_ID        # 重新运行
gh run cancel RUN_ID       # 取消运行
gh run download RUN_ID     # 下载 artifacts
gh workflow list           # 列出 workflows
gh workflow run WORKFLOW   # 触发 workflow
gh workflow enable/disable # 启用/禁用
gh cache list              # 列出缓存
gh cache delete KEY        # 删除缓存
```

## Release

```bash
gh release list            # 列出 releases
gh release create TAG      # 创建 release
gh release view TAG        # 查看 release
gh release download TAG    # 下载 assets
gh release upload TAG FILES  # 上传 assets
gh release edit TAG        # 编辑
gh release delete TAG      # 删除
```

## Gist

```bash
gh gist list               # 列出 gists
gh gist create FILE        # 创建 gist
gh gist view ID            # 查看 gist
gh gist edit ID            # 编辑
gh gist clone ID           # 克隆
gh gist delete ID          # 删除
```

## 搜索

```bash
gh search repos "keyword"              # 搜索仓库
gh search issues "keyword"             # 搜索 issues
gh search prs "keyword"                # 搜索 PRs
gh search code "keyword" --repo OWNER/REPO  # 搜索代码
gh search commits "keyword"            # 搜索提交
```

## 项目 (Projects)

```bash
gh project list                   # 列出项目
gh project view NUMBER            # 查看项目
gh project create --title "T"     # 创建项目
gh project item-add PROJECT_ID --url ISSUE_URL  # 添加卡片
gh project item-list PROJECT_ID   # 项目卡片列表
```

## Codespace

```bash
gh codespace list           # 列出 codespaces
gh codespace create         # 创建 codespace
gh codespace code -w        # 在 web VS Code 中打开
gh codespace ssh            # SSH 连接
gh codespace cp FILE :DEST  # 复制文件到 codespace
gh codespace stop           # 停止
gh codespace delete         # 删除
gh codespace logs           # 查看日志
gh codespace ports forward  # 端口转发
```

## 密钥 & 变量

```bash
gh secret list                   # 列出 secrets
gh secret set NAME               # 设置 secret
gh secret delete NAME            # 删除 secret
gh variable list                 # 列出变量
gh variable set NAME             # 设置变量
gh variable get NAME             # 查看变量值
gh variable delete NAME          # 删除变量
```

## 其他

```bash
gh api /repos/OWNER/REPO         # 调用 GitHub API
gh api graphql -f query='...'    # GraphQL 查询
gh status                        # 跨仓库工作概览
gh browse                        # 在浏览器中打开
gh label list                    # 标签管理
gh label create NAME -c "COLOR"  # 创建标签
gh alias set NAME "command"      # 设置别名
gh extension install OWNER/REPO  # 安装扩展
gh skill install OWNER/REPO      # 安装 AI agent skill
```

## 常用快捷组合

```bash
# 查看当前仓库我待 review 的 PR
gh pr list --review-requested=@me --state=open

# 查看当前仓库分配给我的 issue
gh issue list --assignee "@me"

# 基于最新 main 创建 PR
git checkout -b feat/xxx && git push -u origin HEAD && gh pr create --fill

# 以 draft 模式快速创建 PR
gh pr create --draft

# 查看所有在我的组织中的开放 PRs
gh search prs --review-requested=@me --state=open

# 查看 CI 状态
gh pr checks --watch
```

> 完整手册: `gh --help` 或 `gh COMMAND --help`  
> 在线手册: https://cli.github.com/manual/gh
