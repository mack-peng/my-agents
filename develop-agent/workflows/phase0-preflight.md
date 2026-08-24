# Phase 0: Pre-flight

启动协调器前的环境检查和需求收集。

## 执行步骤

### 1. 环境预检

- [ ] 检查 `lark-cli` 可用（如 `USE_FEISHU=true`）：`which lark-cli` + `lark-cli auth status`
- [ ] 检查 `morph-cli` 可用：`which morph-cli`

### 2. 收集项目信息

向用户依次询问：

1. **目标项目路径**（本地绝对路径，如 `/Users/Mack/Develop/official-website`）
2. **确认需求描述**（用户原始输入，如有歧义追问澄清）
3. **是否跳过 Phase 2（Code Design）** — 简单需求（单一文件、纯配置、小范围修改）可直接 Spec → Code
4. 验证项目路径存在且为 git 仓库

### 3. 检查项目就绪

- [ ] `.codegraph/` 存在 → 否则停止，提示：`codegraph init -i`
- [ ] 读取项目 `AGENTS.md`（如存在），了解项目约定（lint 命令、typecheck 命令、分支规范等）
- [ ] 确认当前在 master 分支（或用户指定基础分支）

### 4. 飞书模式：创建任务文档

```
lark-cli wiki +node-create --space-id <FEISHU_DEVELOP_WIKI_ID> --title "<需求标题>"
```

返回 `obj_token` 和 `node_token`，后续 Phase 通过 feishu-agent 追加内容。

### 5. 飞书模式：写入任务上下文

创建文档后，立即写入任务上下文信息（便于跨机器续接）：

```bash
lark-cli docs +update --api-version v2 --doc "<obj_token>" --command append --doc-format markdown --content $'# {需求标题}

## 任务上下文
- **仓库**: {仓库地址}
- **开发分支**: {分支名}
- **测试分支**: {分支名}
- **Spec 文件**: {相对路径}
- **飞书 Spec**: {链接}
'
```

**注意**：
- 仓库地址从 `git remote -v` 获取
- 分支名在 Phase 3 创建开发分支后补充
- 测试分支名在 Phase 4 创建测试分支后补充
- Spec 文件路径在 Phase 1 生成 Spec 后补充
- 飞书 Spec 链接在 Phase 1 上传 Spec 后补充

初始文档可只写入仓库地址，其他字段留空待后续 Phase 补充：

```markdown
## 任务上下文
- **仓库**: {仓库地址}
- **开发分支**: （待 Phase 3 补充）
- **测试分支**: （待 Phase 4 补充）
- **Spec 文件**: （待 Phase 1 补充）
- **飞书 Spec**: （待 Phase 1 补充）
```

### 6. 输出 Phase 0 摘要

```
Phase 0 Pre-flight 完成
- 项目: {path}
- 需求: {summary}
- Code Design: {yes/no/skip}
- 基础分支: master
- 飞书文档: {url}
```

## Sign-off 条件

- [ ] 项目路径确认
- [ ] 需求描述确认
- [ ] 是否跳过 Phase 2 已确认
- [ ] `.codegraph/` 就绪
- [ ] 飞书模式：任务文档已创建

## 产出

- 项目路径 + 基础分支
- 需求描述（用户确认版）
- Phase 2 跳转判定
- 飞书模式：Develop 任务文档 object token
