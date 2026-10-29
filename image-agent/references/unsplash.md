# Unsplash 素材

已发布 CLI：**`@orangemust/unsplash-cli`**（npm: <https://www.npmjs.com/package/@orangemust/unsplash-cli>；GitHub: <https://github.com/mack-peng/unsplash-cli>）。本 agent 首选 `unsplash` 命令；`scripts/unsplash.mjs` 是无安装备用，读同一个 Keychain 项。

## 安装与配置

1. 打开 <https://unsplash.com/oauth/applications> → **New application**，同意 API Guidelines。
2. 复制 **Access Key**（不是 Secret Key）。
3. 安装 CLI 并存入 macOS Keychain（不写 `.env`）：

```bash
npm install -g @orangemust/unsplash-cli
unsplash auth set

# 或从剪贴板读，避免 key 进 shell history
pbpaste | unsplash auth set --stdin
```

`unsplash auth status` 可检查配置，不会打印 key。CI 可用 `UNSPLASH_ACCESS_KEY` 覆盖。不要把 key 贴进对话、日志或提交到 git。

## 命令

```bash
# 搜索（人读）
unsplash search "minimal desk" --orientation landscape --per-page 6

# 搜索（agent 用）
unsplash search "minimal desk" --json

# 搜索并下载前 2 张到工程素材目录
unsplash search "minimal desk" \
  --orientation portrait --download 2 \
  --out-dir output/<slug>/assets/refs/unsplash/

# 按 id 或 unsplash.com 链接下载
unsplash download Dwu85P9SOIk \
  --out output/<slug>/assets/refs/unsplash/desk.jpg --size full
```

- `--size`：`raw | full | regular | small | thumb`，默认 `full`（大画布优先）。
- `--color` / `--orientation` / `--order-by relevant|latest` / `--page`。
- `--download N` 必须配 `--out-dir`。
- 输出：`<id>.jpg` + `<id>.json` sidecar（作者、原图页、query、license、下载时间）。

无全局 CLI 时用备用脚本（参数相同，只是前缀不同）：

```bash
node image-agent/scripts/unsplash.mjs search "minimal desk" --json
```

## 合规与边界

- **署名**：每张图输出 `attribution`；发布时保留 `Photo by <name> on Unsplash` 及带 UTM 的链接。recipe.md 记录作者/原图页。
- **下载上报**：保存图片后会请求 `links.download_location` 上报；失败只警告不中断。
- **License**：可免费商用；不得转售原图、不得用 Unsplash 图搭建同类图库服务。人物/品牌/敏感场景自行判断肖像与商标风险。
- **限流**：读 `X-Ratelimit-*`；401/403/429 不自动重试，直接报错。以实际响应头为准。
- **素材本地化**：渲染只读 `output/<slug>/assets/refs/unsplash/`，不依赖外链。API 指南默认要求 hotlink；本工作流为离线可复现渲染下载到本地，并以 `download_location` 上报 + 署名作为对应合规动作。

## 用在哪个环节

- 封面/分享图需要真实摄影底图时，优先 Unsplash；AI 只做补充或改图。
- 文字、数据、Logo、UI 仍然 HTML 叠加，不交给图库或 AI。
- 选图标准：构图有留白、主体清楚、分辨率 ≥ 目标画布、色调能融进色板。
