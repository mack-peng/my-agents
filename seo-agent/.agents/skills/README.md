# seo-agent 移植 skill 包说明

本目录包含从开源仓库**精选移植并适配**的 skill 包。移植原则：保留方法论内核（诊断维度、评分规则、证据规则、输出契约），去掉与本工作台不兼容的部分（上游的 Node/Python 脚本、四格式渲染、OpenCLI Browser Bridge 等专用依赖），适配为本工作台的执行栈（firecrawl-agent / browser-agent / LLM）。

## 来源与许可

### yao-geo-skills（https://github.com/yaojingang/yao-geo-skills）

- 许可证：MIT
- 作者：姚金刚（yaojingang）
- 移植日期：2026-10-09
- 移植范围：
  - `yao-geo-page-audit` → 本目录 `yao-geo-page-audit/SKILL.md`（适配）
  - `yao-geo-page-blueprint` → 本目录 `yao-geo-page-blueprint/SKILL.md`（适配）
  - `yao-geo-intent-miner` → 本目录 `yao-geo-intent-miner/SKILL.md`（适配）
  - `yao-deepseek-crawler` / `yao-doubao-crawler` / `yao-chatgpt-crawler` 的采样方法论 → 综合改写为 `yao-geo-ai-visibility/SKILL.md`（适配；执行栈从 OpenCLI Browser Bridge 改为 browser-agent）

- 适配改动：
  1. 输出从四格式（Word/PDF/HTML/Markdown）简化为 Markdown 单格式
  2. 删除上游脚本调用（polish_docx.py、render_*.py 等），改为直接产出 Markdown
  3. 执行栈从上游专用工具改为本工作台的 firecrawl-agent / browser-agent
  4. 平台采样从 OpenCLI 改为 browser-agent 登录态采样（低频人工节奏）
  5. 保留：诊断维度、证据分层、评分权重、质量门、输出契约字段

### claude-seo（https://github.com/AgriciDaniel/claude-seo）

- 许可证：MIT
- 作者：AgriciDaniel
- 使用方式：**未移植 skill 包**，仅蒸馏其 references 方法论（技术 SEO 9 类、schema 类型状态、废弃账本、CWV、E-E-A-T、GEO 可引用性、可证伪方法论）到 `seo-agent/references/`，详见各 references 文件头部的来源声明。
- 蒸馏日期：2026-10-09

### Google 官方文档

- `references/google-currency.md` 与各 references 中的官方口径核对自 developers.google.com（核对日期 2026-10-09）
- 根仓库 `../references/Google-SEO.md` 为 Google 官方文档早期汇总，保持原样作为历史基线；冲突时以 `google-currency.md` 为准

## 使用方式

- 本目录为**按需读取**的资料：执行对应工作流时由 `seo-agent/AGENTS.md` 的路由指向后读取
- 不安装到系统级 `~/.agents/skills/`（避免系统 prompt 膨胀）
- 工作流文档（`workflows/`）负责编排，本目录 skill 负责方法细节，`references/` 负责检查清单与模板

## 更新方式

- 上游更新后重新拉取对应 SKILL.md，对照本文档的「适配改动」清单重新适配（保留适配点，更新方法论部分）
- 更新后同步修改本文件顶部的「移植日期」
