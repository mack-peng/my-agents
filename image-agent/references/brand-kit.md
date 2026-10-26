# 品牌资产与默认视觉语言

## 资产位置

用户把品牌资产放根 `input/brand/`（gitignored），目录建议：

```
input/brand/
├── logo.svg              # 优先 SVG；没有 SVG 用 PNG（透明底、2x）
├── logo-mark.png         # 可选：图形标
├── palette.md            # 或 brand.json：色值 + 用法
├── fonts/                # 字体文件（按需下载，不纳入 git）
└── references/           # 参考图、竞品、喜欢的风格
```

没有资产时不阻塞：使用下方默认语言；**没有 Logo 就不放 Logo，不编造品牌标识**。

## 默认色板

来自工作台现有封面语言：

| 角色 | 色值 | 用法 |
|---|---|---|
| 背景 | `#0B0C0E` | 深色底、满版背景 |
| 主文字 | `#F5F5F0` | 标题、正文 |
| 次要文字 | `#8A8F98` | 副标题、说明 |
| 强调 | `#D7FF3F` | 关键词、数字、引导线、标签 |
| 分割线 | `rgba(245, 245, 240, 0.14)` | 细线、数据卡边界 |
| 暗遮罩 | `rgba(11, 12, 14, 0.78)` | 图片上压字 |

替换规则：用户提供品牌色时，用品牌色替换；仍保持"一个背景 + 一个主文字 + 一个次要 + 一个强调"的结构。

## 字体

- 标题/正文：`PingFang SC`，兜底 `Hiragino Sans GB`、`Noto Sans CJK SC`、`Microsoft YaHei`。
- 元数据/数据/英文标签：`Maple Mono NF CN`，兜底 `SF Mono`、`Menlo`、`Consolas`。
- Maple Mono 上游：<https://github.com/subframe7536/maple-font>（OFL-1.1）。
- **字体不纳入 git**，需要时下载：

```bash
mkdir -p input/brand/fonts
curl -L -o input/brand/fonts/MapleMono-NF-CN-Medium.ttf \
  "https://cdn.orangemust.com/official-website/fonts/maple-mono-cn_7.4/MapleMono-NF-CN-Medium.ttf"
```

- 文件约 18MB；`still.html` 用相对路径引用：

```css
@font-face {
  font-family: "Maple Mono NF CN";
  src: url("../../input/brand/fonts/MapleMono-NF-CN-Medium.ttf") format("truetype");
  font-weight: 500;
  font-display: block;
}
```

- 渲染器静态服务根为仓库根，所以 `output/<slug>/` 能加载 `input/brand/fonts/`。
- 字体缺失时用系统字体兜底，不阻塞；交付前若设计依赖 Maple，再下载复验。
- 保留 OFL 许可文本（下载页/上游仓库）；不要把字体文件提交到 git。

## Logo 规则

- 只用原始 SVG/PNG；**不重绘、不描摹、不让 AI 生成 Logo**。
- 保持原始比例；不拉伸、不裁切、不加奇怪滤镜。
- 留白 ≥ Logo 高度的 0.5 倍；最小展示高度按品牌规范；没有规范时 ≥ 24px（1080 宽输出）。
- 深色 Logo 放浅底，浅色 Logo 放深底；需要反白时用原始反白版本，不自行改色。
- Logo 不压在 busy 背景上；必要时加纯色块/暗遮罩。
- 没有 Logo 时用品牌名文字排版，不画一个"临时 Logo"。

## 语气与文案

- 标题一句话钩子；副标题一句解释；数据卡只放确认过的数字。
- 不用空泛形容词；不用"颠覆/革命/最强"等无证据口号。
- 中英文混排加空格；版本号/日期统一格式。
- 对外内容不写内部项目名、未公开数据、内部人名。

## 覆盖方式

用户说"用我们的品牌色/Logo"时：

1. 读 `input/brand/`；缺什么问什么，不猜。
2. 把用到的资产拷贝到 `output/<slug>/assets/brand/`；`input/` 原样不动。
3. 在 `still.html` 的 `:root` 覆盖色板/字体变量；在 `recipe.md` 记录用了哪些品牌资产。
4. 交付前按 `qa-checklist.md` 检查 Logo 留白、颜色、对比度。
