# Feishu Agent 项目

## 前置检查

每次使用飞书 Agent 前，先检查 `lark-cli` 是否可用和已登录：

```bash
# 检查 CLI 是否安装
which lark-cli || echo "未安装"

# 检查登录状态
lark-cli auth status
```

如 `lark-cli` 未安装，按以下步骤安装。

## 安装

### 1. Node.js 版本

`lark-cli` 需要 Node.js >= 20.12.0。如使用 nodenv：

```bash
nodenv global 22.13.0   # 或其他 >= 20.12 的版本
```

### 2. 安装 CLI

```bash
npm install -g @larksuite/cli
```

### 3. 安装 Skills

```bash
npx -y skills add https://open.feishu.cn --skill -y
```

## 配置与登录

### 配置应用凭证

```bash
lark-cli config init --new
```

此命令会输出二维码和浏览器链接，用户在浏览器中完成应用创建后，进程会自动完成配置。

### 登录（两步流程）

**第一步：获取授权 URL 和 device_code**

```bash
lark-cli auth login --recommend --no-wait --json
```

输出包含 `device_code` 和 `verification_url`。用 `verification_url` 生成二维码展示给用户：

```bash
# 生成 ASCII 二维码（通用，无需图片支持）
lark-cli auth qrcode --ascii "<verification_url>"
```

将 URL 和二维码一并展示给用户，告知用户扫码授权后回复"完成"。

**第二步：用 device_code 完成登录**

用户确认授权后执行：

```bash
lark-cli auth login --device-code "<device_code>"
```

### 验证

```bash
lark-cli auth status
```

成功时 Bot 和 User 双身份均为 `ready`。

## 已安装的 6 个 Skills

> **⚠️ 快捷命令优先**：云文档、知识库、表格、Markdown、云空间等基础操作使用下方快捷命令，**禁止加载 skill 文件**。仅在需要复杂操作（如 drive 权限管理、wiki 成员管理、sheets 公式/筛选等）时才读取对应的 `SKILL.md` 和 `references/`。

Skills 位于 `feishu-agent/.agents/skills/` 内，仅在使用本 agent 时加载：

| Skill | 功能 | 何时读 SKILL.md |
|-------|------|-----------------|
| lark-doc | 创建、读取、编辑飞书云文档 | 需要 XML block 操作、画板、媒体插入等高级用法 |
| lark-drive | 上传/下载文件、文件夹管理、导入导出 | 权限管理、版本回退、评论等高级操作 |
| lark-sheets | 电子表格：创建表格、读写单元格 | 公式、筛选视图、浮动图片、样式合并 |
| lark-wiki | 管理知识空间、节点层级、成员权限 | 节点移动/复制、成员添加/移除 |
| lark-markdown | 创建、读取、编辑 Markdown 文件 | 复杂 patch 操作、diff 对比 |
| lark-shared | 身份切换、权限问题诊断、CLI 更新 | 遇到 `_notice` 或权限错误时 |

## 快捷命令（直接从本文件复制使用，禁止加载 skill）

### 云文档

```bash
# 创建文档
lark-cli docs +create --api-version v2 --doc-format markdown --content $'# 标题\n\n内容...'
lark-cli docs +create --api-version v2 --doc-format markdown --parent-token <space_id> --content $'# 标题\n\n...'

# 读取文档
lark-cli docs +fetch --api-version v2 --doc "<url或token>"

# 追加内容
lark-cli docs +update --api-version v2 --doc "<url或token>" --command append --doc-format markdown --content $'...'

# 替换内容
lark-cli docs +update --api-version v2 --doc "<url或token>" --command str_replace --pattern "旧文本" --content "新文本" --doc-format markdown
```

### 知识库

```bash
lark-cli wiki +space-list
lark-cli wiki +node-list --space-id <space_id>
lark-cli wiki +node-create --space-id <space_id> --title "文档标题"
lark-cli wiki +node-create --title "个人文档"
```

### 云空间

```bash
lark-cli drive +search --keyword "关键词"
```

### 表格

```bash
lark-cli sheets +spreadsheet-create --title "标题"
lark-cli sheets +spreadsheet-info --spreadsheet "<url或token>"
lark-cli sheets +sheet-list --spreadsheet "<url或token>"
lark-cli sheets +range-read --spreadsheet "<url或token>" --range "Sheet1!A1:C10"
lark-cli sheets +range-write --spreadsheet "<url或token>" --range "Sheet1!A1" --values '[["a","b"]]'
```

### Markdown

```bash
lark-cli markdown +create --title "标题" --content $'# H1\n\n内容'
lark-cli markdown +fetch --file "<url或token>"
lark-cli markdown +update --file "<url或token>" --content $'新内容'
```

> Markdown 写入转义：`\*` `\_` `\[` `\]` `\~` `\$` `\<` `\>`。行首 `#` `-` `+` 需转义。
