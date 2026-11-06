# ① 打包改造（monitor → audit → zip）

进入条件：给出项目路径或产物目录（`~/Projects/<slug>`），想要「打包 / zip / 上传前检查」。项目侧产物形态可任选：

| 形态 | 处理 |
| --- | --- |
| 已有现成 H5 三件套 | 直接进 ref-guide 十一步 |
| Vite / Webpack 有构建链 | 先跑项目自身 build；产物目录为目标 |
| Codex / Claude Code / Cursor 项目 | 按相应 agent 的 conventional 目录找 |

## 监管链

1. 读 `.agents/skills/minitool-zip-builder/SKILL.md` 十一/十二节指南；
2. 在线文档比对：`webfetch https://miniapp-sandbox.xiaohongshu.com/minitool/doc`，与本地基线（`.agents/skills/minitool-zip-builder/references/js-api.md`）做语义对比，产出「新增能力 / 能力更新」摘要；比值规则见 `references/online-doc-audit.md`；8 秒超时则用本地基线兜底并标注「未核验在线契约」；
3. 按在线文档改写禁用 API / 行为（若改写的是别人项目，只替换禁用模式，不碰业务逻辑）；
4. 产出 zip 前跑 audit：
   - `node .agents/skills/minitool-zip-builder/scripts/audit_artifact.mjs <dist|zip>`
   - `python3 .agents/skills/minitool-zip-builder/scripts/audit_artifact.py <dist|zip>`
   - audit 报 ERROR 必须修；不因运行时缺失跳过审计门禁（Node 或 Python 任一即可，全缺则人工审计并明确标注）；
5. `cd <dist> && zip -r ../<slug>-v<version>.zip . -x '*.DS_Store'`；解压顶层直接 index.html，不多套目录；
6. 产物落 `output/{YYYY-MM-DD}-{slug}-minitool-v{version}.zip`，配 `output/{...}-audit.json` 与「未核验」标记。

## 交付

- zip 路径 + SHA256 + audit 摘要（0 errors / warnings）
- 引导语（写死）：

> 请将该 zip 上传创服平台并在模拟器完整验证，再分别用 Android / iOS 真机扫码验证同一产物；Chrome 61 / 真机兼容性尚未实测（标注「兼容性未实测」）。

## Hard Stop

- audit 报错不修不交付；团队项目未确认项目根路径时不猜
- 在线文档未获取时不得声称发现新增能力
- 不上传创服平台（发包/上传只能通过 workflow ⑥ 显式触发）

## 类似经验

- 2026-11-06「扫雷」项目实测通过：Vite5 + Vue2.7 → es2017/chrome61；关键变更记录在该项目 branch 的 `c600c50` commit。

## 修改记录

- 2026-11-06 初版
