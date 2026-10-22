# 音频与字幕（VO / VTT / 混音 / 字幕 QA）

做片与改片共用的后期规则。AGENTS.md 与 workflow 引用本文件，规则只在这里写一次。

## 音频驱动时长（做片铁律）

分镜表的秒数是**预算**，不是锁定值。有旁白的片子：

1. 内容/分镜 sign-off 后，**先生成全部 VO**（`openfilm get tts`，一镜一条）
2. `ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 <wav>` 量每条实际时长
3. 回填各镜时长：**镜时长 = VO 时长 + 头部提前量（0.1–0.3s）+ 尾部余量（0.2–0.5s）**；结尾镜尾部留 2.5–3s 画面淡出，避免戛然而止
4. 按新时长回填 `content.js` 的 `start`/`dur` 与 film.html 的 `at`，锁定总时长
5. 改 VO / 换音色 = 重走 1–4（旧 VTT 全部失效重做）

**不硬凑时长**：内容多就长（实测周刊 101s），内容少就短；不为凑 60s/8s 裁内容。

## TTS 生成

- 首选 `openfilm get tts --out <name> --text "<文案>" --voice <voiceId>`：返回 `src`/`dur`/自带 VTT（词级时间，**不需要再跑 asr**）
- 文件落 `assets/audio/vo/`；语义化命名 `vo-<序号>-<slug>.wav`
- **provider 报错先报告用户**（如本地 fork 曾报 `Alibaba Cloud Bailian could not be reached (fetch failed)`），不静默换服务商；用户同意后才走替代方案（如 DashScope 直连 `qwen3-tts-flash`），key 从 `~/.openfilm/providers.json` 读，**绝不打印/落盘 key**
- 手写兜底 VTT：TTS 无词级时间时按口播稿分句手写（见下）

## VTT 规则

- 与音频同名同目录：`vo-01-hook.wav` → `vo-01-hook.vtt`
- cue 按停顿分句（≥0.3s 换 cue）；时间轴对准实际音频（`ffprobe` / 听感）
- 文字以口播稿为准（专名/版本号/英文缩写 ASR 常错；TTS 直出则与输入一致）
- 换音频/换音色 = 重做 VTT；改 `speed` 字幕后随（OpenFilm 自动），文字不改

## 混音基线

- **目标：integrated ≈ -19.0 LUFS，true peak ≤ -3.6 dBTP**（当前项目实测基线，用户确认采用）
- 每条 VO 生成后统一 loudnorm 到基线（`ffmpeg -af loudnorm=I=-19:TP=-3.6:LRA=11`），再进 film.html
- 音乐床：长度 = 影片总时长，音量压低（`volume="0.15"`–`0.3` 视音乐而定），结尾淡出
- 交付前 `openfilm look` 读输出里的 integrated LUFS / true peak，与基线比对；偏差大则调 `volume` 或重 norm，**不盲调**

## 字幕样式基线（竖屏 1080×1920）

`.film/subtitles.json` 是 Studio 的领域，**禁止文本编辑器直接改**；用户明确要求调整时通过 Studio UI 或 Studio API（等同人在 Studio 操作），改前先读当前配置。

| 字段 | 基线值 | 说明 |
|---|---|---|
| `pos.y` | 0.786 | 相对比例，不写死像素；距底部约 411px |
| `font.sizePct` | 3.8 | 相对画幅高 |
| `box.color` / `box.opacity` | `#000000` / 0.48 | 半透明黑底，亮背景可读 |
| `box.radiusEm` | 0.18 | 圆角 |
| `box.padXEm` / `padYEm` | 0.5 / 0.22 | 内边距 |
| `stroke` / `shadow` | null | 不加描边阴影（box 已保证对比） |

- `pos.x=0.5`、`align=center`、`maxWidthPct=100` 默认不动
- 若压住正文/下一章标题/结尾大字：调 `pos.y`（比例），不在页面里画字幕、不加描边

## 字幕验收（look 看不到字幕）

交付前固定抽 **4 帧**，用 Studio 预览或 Studio API 截图（带字幕叠加层）：

1. 开头（首条字幕出现后，如 t=2）
2. 首个内容镜（如 t=20）
3. 密集信息镜（数字/面板最多的镜，如 t=88）
4. 结尾（淡出前的最后一条，如 t=96）

检查：不压正文关键数字、不压下一章标题、不压结尾大字、box 在安全区内、文字完整不被裁。
