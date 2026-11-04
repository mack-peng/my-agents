# 社区来源与许可

最后核对：2026-11-04。

本 agent 只提交一个外部 skill；其余社区内容按“提炼规则、不整包复制”的方式进入本目录。所有引用保留原始许可与来源链接。

## 已安装 skill

### `prompt-images`

- 来源：<https://github.com/replicate/skills> · <https://skills.sh/replicate/skills/prompt-images>
- 路径：`.agents/skills/prompt-images/`
- 许可：Apache-2.0（见 `.agents/skills/prompt-images/LICENSE`）
- lock：`skills-lock.json`（`source: replicate/skills`，`installMode: copy`，hash `e3faef72484b363f5f4bc726a6f9eabcbc079c40a6bc42024cfa567a7ea1030b`）
- 用途：模型无关的生图/改图提示词方法。上游文件保持原样；使用时按本 agent 的 `references/provider-routing.md` 选模型，忽略其中的 Replicate `find-models` / `compare-models` 路由。

## 提炼来源

### Swiss Poster Design System

- 来源：<https://github.com/adewale/swiss-poster-skill> · <https://skills.sh/adewale/swiss-poster-skill/swiss-poster>
- 许可：MIT（见 `references/licenses/swiss-poster-MIT.txt`）
- 提炼到：`references/art-direction.md` 的 Swiss editorial 方向、`references/design-review.md` 的构图与对比度规则
- 提炼内容：one dominant graphic event、protected reading zone、contrast channels、grid breakout、scale contrast、anti-card 规则。

### No Design Slops

- 来源：<https://github.com/mengto/skills> · <https://skills.sh/mengto/skills/no-ai-design-slop>
- 许可：MIT（见 `references/licenses/no-ai-design-slop-MIT.txt`）
- 提炼到：`references/design-review.md`
- 提炼内容：remove test、taste is contextual、反模板感、排版/颜色/图片反模式。

### Banner Design

- 来源：<https://github.com/nextlevelbuilder/ui-ux-pro-max-skill> · <https://skills.sh/nextlevelbuilder/ui-ux-pro-max-skill/banner-design>
- 许可：MIT（见 `references/licenses/banner-design-MIT.txt`）
- 提炼到：`references/art-direction.md` 的 3-zone hierarchy、safe zone、photo-led / data 方向
- 说明：只借尺寸与 art direction 清单，不安装该 skill。

## 评估过但不集成

- `anthropics/skills@canvas-design`：偏纯艺术/PDF，且上游许可需单独核对，不提交。
- `freestylefly/awesome-gpt-image-2@gpt-image-2-style-library`：GPT-Image2 专用，风格可借鉴，不作为核心。
- `iamyoki/qwen-image-2.1-skill@qwen-image-2-1-prompter`：Qwen 专用且版本偏 2.1，需要时按 provider 文档临时读取。
- `xiaohongshu-cover-generator` / `meitu` / `eachlabs`：依赖第三方 API 与密钥，和现有 provider 路由冲突。
- `impeccable` / `nexu-io/open-design`：偏网页 UI 或模板过浅，不纳入图片工作流。
