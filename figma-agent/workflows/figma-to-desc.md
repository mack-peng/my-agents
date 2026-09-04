# Figma → 结构化描述（供 AI 生成前端代码）

把 Figma 文件/帧/组转换成**结构化的布局与样式描述**（YAML/tree），可直接交给 design-agent / code-agent 生成对应项目的前端代码。

## 流程
```
用户给 Figma 链接 → figma-developer-mcp fetch → output/*.tree.yaml → 交给 code-agent 生成代码
```

## 前置依赖 blocks（按序实时检测，缺失即引导）

**Block D1：FIGMA_API_KEY 已配置（环境变量或 .env）**
- 检测（只检测、不回显）：
  ```bash
  zsh -c 'source ~/.zshrc 2>/dev/null; [ -n "$FIGMA_API_KEY" ]' && echo present || echo missing
  ```
  或检查兜底文件：`grep -q '^FIGMA_API_KEY=figd_' figma-agent/.env && echo present || echo missing`
- 缺失引导（**由用户自己写，key 不经过对话**）：
  1. 打开 https://www.figma.com → 左上角头像 → **Settings** → **Security**
  2. 找到 **Personal access tokens** → **Generate new token**
  3. 命名 token，权限勾选 **File content (Read)** 和 **Dev resources (Read)** → **Generate token**
  4. 复制 `figd_` 开头的 token
  5. 打开终端执行（把 `figd_你的key` 换成你的 token）：
     ```zsh
     echo 'export FIGMA_API_KEY="figd_你的key"' >> ~/.zshrc && source ~/.zshrc
     ```
  6. 完成后告诉我，我再检测一次
- 兜底：也可手动写 `figma-agent/.env` 一行 `FIGMA_API_KEY=figd_xxx`

**Block D2：读工具可用（npx figma-developer-mcp）**
- 检测：`npx -y figma-developer-mcp --version`，能输出版本号即通过（npx 会自动拉取，无需手动安装）

## 执行步骤

1. 获取 Figma 链接（file key 与 node-id）。
2. 读取结构化描述：
   ```bash
   zsh -c 'source ~/.zshrc 2>/dev/null; npx -y figma-developer-mcp fetch "<figma-url>" --format=tree'
   ```
   - 或从 `figma-agent/.env` 兜底加载：`set -a; source figma-agent/.env; set +a; npx -y figma-developer-mcp fetch "<figma-url>" --format=tree`
   - URL 含 `&` 必须加引号。
   - 输出较大时保存到文件（推荐）：
     ```bash
     zsh -c 'source ~/.zshrc 2>/dev/null; npx -y figma-developer-mcp fetch "<figma-url>" --format=tree' > figma-agent/output/<name>.tree.yaml
     ```
3. 产物规范：`figma-agent/output/` 下存 `<name>.tree.yaml`（或 json），文件名用语义化英文。
4. 把产物交给 code-agent / design-agent 生成对应项目的前端代码；如需让模型复用项目真实组件，可改用官方 Figma MCP 的 Code Connect（见 references/Figma-Agent-Tools.md）。

## 快捷命令速查
```bash
# 读全文件（tree 格式，最省 token）
npx -y figma-developer-mcp fetch "<figma-url>" --format=tree

# 读全文件（json，方便管道）
npx -y figma-developer-mcp fetch "<figma-url>" --format=json | jq '.nodes[0]'

# 只取某个节点 + 限制深度
npx -y figma-developer-mcp fetch --file-key <KEY> --node-id <NODE_ID> --depth 3

# 保存到文件
npx -y figma-developer-mcp fetch "<figma-url>" --format=tree > output/<name>.tree.yaml
```

## 注意
- Figma 免费版 REST API 限流约 6 次/月，读之前先确认目标文件属于付费团队，或复制到自己的付费工作区（见 references/Framelink-MCP-Figma-Use-Doc.md Troubleshooting 章节）。
- 一次只取一个 section 的 node，控制描述体积，AI 生成质量更高。