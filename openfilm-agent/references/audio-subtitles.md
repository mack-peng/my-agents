# 音频与字幕（VO / VTT / 混音 / 字幕 QA）

做片与改片共用的后期规则。AGENTS.md 与 workflow 引用本文件，规则只在这里写一次。

## 音频驱动时长（做片铁律）

分镜表的秒数是**预算**，不是锁定值。有旁白的片子：

0. **分镜阶段的秒数预算**（sign-off 前估算用）：**中文按 5.5 字/秒**（实测 5.1–6.2，均值 5.8，取偏保守值；英文按 ~2.3 词/秒）+ 每镜 0.4s 余量；校准方法：拿既有 VO 的 `ffprobe` 时长 ÷ VTT 正文字数。只用于排分镜表，不写进锁定值
1. 内容/分镜 sign-off 后，**先生成全部 VO**（`openfilm get tts`，一镜一条）
2. **loudnorm 到基线**（见「混音基线」；新文件必须重新 norm）
3. `ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 <wav>` 量每条实际时长
4. **建 cue 表**：有词级 VTT 直接取；fork 返回 none 时跑 `get asr --src` 取时间轴，文字以口播稿校正。每镜记 in/out，页内时刻 = cue + 0.35s 偏移
5. 回填各镜时长：**镜时长 = VO 时长 + 头部提前量（0.1–0.3s）+ 尾部余量（0.2–0.5s）**；结尾镜尾部留 2.5–3s 画面淡出，避免戛然而止
6. 按新时长回填 `content.js` 的 `start`/`dur` 与 film.html 的 `at`，锁定总时长
7. 改 VO / 换音色 = 重走 1–6（旧 VTT 全部失效重做）

**不硬凑时长**：内容多就长（实测周刊 101s），内容少就短；不为凑 60s/8s 裁内容。

## TTS 生成

- 首选 `openfilm get tts --out <name> --text "<文案>" --voice <voiceId>`：返回 `src`/`dur`。**上游 CLI 帮助称 tts 自带词级 VTT（"word timing is kept, so never run asr on it"）；本地 fork 的百炼 provider 实测 transcript 返回 `none`**，此时时间轴走 `get asr --src`、文字以口播稿校正。**以上游同步后的实跑结果为准**（有词级 VTT 就免 asr，返回 none 才跑）
- 文件落 `assets/audio/vo/`；语义化命名 `vo-<序号>-<slug>.wav`
- **TTS 时长漂移与停顿压缩**：同一文本多次生成时长会漂 1–2s（实测 6.96–9.68s）。若 take 超出预算，用 `silenceremove` 压句中停顿到 ~0.12s 再量时长（不改语义节奏）：

  ```bash
  ffmpeg -y -v error -i <raw.wav> -af "silenceremove=stop_periods=-1:stop_duration=0.12:stop_threshold=-38dB" -ac 1 -ar 48000 <norm.wav>
  ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 <norm.wav>
  ```
  压完重新归一（见下），时间轴以压后实测为准。

- **provider 报错先报告用户**（如本地 fork 曾报 `Alibaba Cloud Bailian could not be reached (fetch failed)`），不静默换服务商；用户同意后才走替代方案（如 DashScope 直连 `qwen3-tts-flash`），key 从 `~/.openfilm/providers.json` 读，**绝不打印/落盘 key**
- 手写兜底 VTT：TTS 无词级时间时按口播稿分句手写（见下）

### 读音改写表（TTS 输入稿 ≠ 字幕显示稿）

TTS 会把中文数字按"数值"读错（实测："2026 年"读成"两千零 26 年"）。**喂给 TTS 的文本**与**字幕显示稿**是两份，一份管读音、一份管版面：

| 字幕/画面显示（书面） | TTS 输入（读音改写） | 说明 |
|---|---|---|
| 2026 年 | 二零二六年 | 年份逐位读 |
| 1M | 一兆 | 本工作台口播约定（2026-10 用户确认入档） |
| 10 月 19 日 | 10 月 19 号 | 日期口语，显示保留"日" |
| $0.15 / $0.60 | 0.15 美元、0.60 美元 | 货币补全，首次出现点明"每百万词元"口径 |
| 调研 | 吊研 | 「调」多音字，TTS 默认读 tiáo；「吊」只有 diào 一个读音，强制四声；显示稿仍写「调研」 |
| Astra | Astra | 品牌名直接英文读音，勿写「阿斯特拉」音译 |
| Qwen | 千问 | 用中文品牌名读音；显示稿仍写 Qwen |
| GPT | G P T | 字母逐读；AA → A A |
| Hy4 | H Y 四 flash | H Y 字母读 + 中文数字 |

- VTT 文字按**显示稿**校正（专名/版本号/单位照书面形式），读音靠 TTS 输入稿保证
- 读音改写只动"读法"——数字、事实、结论一个不动

## 口播稿自检（生成 TTS 前念一遍）

付费重录是全链返工（重生成 → 量时长 → 回填 at → VTT 重做 → look），口语问题必须在闸门 2 之前解决：

- 整稿**念出声**一遍，别扭即改：四字对仗/书面造语（实测错例"不必为发而换"）→ 大白话（"犯不着急着换"）
- 被动句改主动（"价格被压到新低" → "价格直接打到了新低"）；"则/其/之"类书面连接词口语化
- 没发生的事不做镜头、不进口播（"某家没发新品"一句带过或删除，见 `from-doc.md` 提炼原则）
- 改口播后逐条确认读音敏感点（上表），再批量重录

## 字幕引擎行为（Studio 实测，Nº06 入档）

- Studio 字幕是**按词块逐组同声渲染**：一屏显示"当前正在说的词组块"（约 9–12 字），底色框只包当前块——不是整条 cue 同时上屏。样式能调的只有 `pos.y / font.sizePct / box(opacity,padX,padY,radius)`，无法合并为一整段块
- **VTT 词级优先**：`get asr` 原生产物自带词级内嵌时间标记（`词<00:00:00.000>词…`），只改文字、不动时间标签
- **词级导致字幕空档时的回退**：实测某 take 在 2.5s 处字幕消失 ~1s（inline 标签使引擎跳块）。修复方法：**改短语级 cue**（一段一行、无内嵌标签），从 `get asr` 的 cue 起止时间手写。这不是违规，是回退——交付前必须 Studio 抽帧确认短语级 cue 在整个 VO 时长内无空档
- `check-vtt` 报「无内嵌时间标签」为 warning 不是 error——短语级是合法回退
- 专名/型号 ASR 常听错（实测：Ripple→Repo、Hy4→Hi4/H4、版本号拆字符）——用**逐字替换清单**校正；数字按显示稿书面化（二十二→22、二点八万亿→2.8 万亿）
- **位置换算**：`Δpx / 1920` 直接加到 `pos.y`（+50px = +0.026）；整体下移会推进 1620 平台描述安全线（v3 基线 0.82 → 带 ~1502–1646），先看视觉 QA 的安全区再动
- 字幕验证只能靠 Studio API 烧帧（`look` 不含字幕层），抽 4–7 帧 + 390px 手机模拟

## VTT 规则

- 与音频同名同目录：`vo-01-hook.wav` → `vo-01-hook.vtt`
- cue 按停顿分句（≥0.3s 换 cue）；时间轴对准实际音频（`ffprobe` / 听感）
- 文字以口播稿为准（专名/版本号/英文缩写 ASR 常错；TTS 直出则与输入一致）
- 换音频/换音色 = 重做 VTT；改 `speed` 字幕后随（OpenFilm 自动），文字不改

## 混音基线

- **目标：integrated ≈ -19.0 LUFS，true peak ≤ -3.6 dBTP**（当前项目实测基线，用户确认采用）
- 每条 VO 生成后统一 loudnorm 到基线，再进 film.html。**重新生成/改文案 = 新文件，必须重新 norm**。**用两遍法**（单遍 dynamic 模式会在语音停顿处抽动）；zsh 内联拼 `measured_*` 参数会被 ffmpeg 进度符的 `\r` 干坏，必须先 `tr '\r' '\n'` 清洗——实测可跑脚本：

  ```bash
  # 中间文件落工作台根 tmp/（根 AGENTS 约定，禁止系统 /tmp/ 或影片目录内的 tmp/）
  TMP_DIR="$(git rev-parse --show-toplevel)/tmp"
  mkdir -p "$TMP_DIR/ln"
  for src in assets/audio/vo/*.wav; do
    case "$src" in */.norm-*) continue;; esac
    base="$(basename "$src" .wav)"; tmp="assets/audio/vo/.norm-$base.wav"
    ffmpeg -y -v info -i "$src" -af "loudnorm=I=-19:TP=-3.6:LRA=11:print_format=json" -f null /dev/null 2>&1 \
      | tr '\r' '\n' | awk '/^\{$/{flag=1} flag{print} flag && /^\}$/{exit}' > "$TMP_DIR/ln/$base.json"
    MI=$(jq -r '."input_i"' "$TMP_DIR/ln/$base.json");   MT=$(jq -r '."input_tp"' "$TMP_DIR/ln/$base.json")
    ML=$(jq -r '."input_lra"' "$TMP_DIR/ln/$base.json"); MTH=$(jq -r '."input_thresh"' "$TMP_DIR/ln/$base.json")
    MO=$(jq -r '."target_offset"' "$TMP_DIR/ln/$base.json")
    ffmpeg -y -v error -i "$src" \
      -af "loudnorm=I=-19:TP=-3.6:LRA=11:measured_I=${MI}:measured_TP=${MT}:measured_LRA=${ML}:measured_thresh=${MTH}:offset=${MO}:linear=true" \
      -ac 1 -ar 48000 "$tmp" && mv "$tmp" "$src"
  done
  ```

- 归一化只改响度不改时长（VTT 时间轴不动）；**重录的 VO 是新文件，必须重新归一**
- **音乐床配方**（`get music` 未连服务商 ≠ 没有音乐——库里有免版权素材可直接复用：Mixkit "Close Up"（免费可商用、无需署名），已在上期工程 `assets/audio/music/`，License README 随素材走）：

  ```bash
  # 1) VO 混合轨（侧链键）：每条 adelay 到各自 at（毫秒），amix 不归一
  mkdir -p tmp   # 中间文件落工作台 tmp/
  ffmpeg -y -v error -i vo1.wav -i vo2.wav … \
    -filter_complex "[0]adelay=150|150[a0];[1]adelay=6550|6550[a1];…;[a0][a1]…amix=inputs=N:normalize=0" tmp/vo-mix.wav
  # 2) 音乐床：截到总时长、-5dB（volume 0.56）、淡入淡出、按 VO 闪避
  ffmpeg -y -v error -i close-up.mp3 -i tmp/vo-mix.wav \
    -filter_complex "[0:a]atrim=0:<总时长>,asetpts=PTS-STARTPTS,volume=0.56,afade=t=in:d=1.5,afade=t=out:st=<总时长-2>:d=2[bed];[1:a]volume=1.6,apad=whole_dur=<总时长>[duck];[bed][duck]sidechaincompress=threshold=0.02:ratio=6:attack=80:release=600" \
    -ac 2 -ar 48000 assets/audio/music/music-bed.wav
  ```

  **实测坑**：
  - sidechain 输出长度 = 两个输入的较短者——VO 混合轨比全片短（最后一条 VO 结束即止），音乐床会被截短；必须给侧链链路加 `apad=whole_dur=<总时长>` 补静音
  - **音乐独立 `<section>` 轨道**：`<section>` = 时间线轨道，音乐放 VO 同轨会报 `clips overlap on a track`；音乐单独一个 `<section>` 放最后
  - **bed 响度目标 ~-25 LUFS**：`volume 0.56 / threshold 0.02 / ratio 6` 实测 bed 只有 -35 LUFS（几乎听不见）；改 `volume 0.8 / threshold 0.05 / ratio 4` → bed -25.4，mix -18.4（比 VO 基线 +0.6 dB）；目标 mix ≈ -19 ±0.6
  - Mixkit 直链 `https://assets.mixkit.co/music/1167/1167.mp3`（上期工程素材可能被删，直链可重新下载）
- 交付前 `openfilm look` 读输出里的 integrated LUFS / true peak，与基线比对；偏差大则调 `volume` 或重 norm，**不盲调**

## 字幕样式基线（竖屏 1080×1920）

`.film/subtitles.json` 是 Studio 的领域，**禁止文本编辑器直接改**；用户明确要求调整时通过 Studio UI 或 Studio API（等同人在 Studio 操作），改前先读当前配置。

**权宜例外（2026-11 实测）**：没有浏览器会话、消息里也无法走 Studio API 时，可按当前配置直接编辑 `.film/subtitles.json`——先备份原文件，只改 `pos.y` / `box` 等样式字段，改完在 Studio 预览抽帧确认。有会话时仍优先 Studio API/UI（人的改动不会被覆盖）。

**新项目默认不是基线**：Studio 竖屏默认 `pos.y=0.72`（字幕带 ~1345–1420），会压到内容。系列基线 0.82（带 ~1502–1646）必须显式应用：`PUT /api/projects/<id>/subtitles`，body 用 `{style: …}`（拿一个已用基线的工程 `.film/subtitles.json` 作模板），或 Studio UI。新片默认先应用基线，人的后续调整优先。

| 字段 | 基线值 | 说明 |
|---|---|---|
| `pos.y` | 0.82 | 相对比例，不写死像素；带 ~1502–1646 |
| `font.sizePct` | 3.8 | 相对画幅高 |
| `box.color` / `box.opacity` | `#000000` / 深色片 0.25、浅色片 0.62 | 深色片轻框不压画面（2026-11 红框校准）；亮背景用 0.62 保可读 |
| `box.radiusEm` | 0.22 | 圆角 |
| `box.padXEm` / `padYEm` | 0.55 / 0.24 | 内边距 |
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

**Studio API 抽帧**（自动化验收用）：

```bash
# POST /api/projects/<projectId>/exports，folder 必须用 jobs 形式传——
# 单个 ask 里的 folder 会被忽略，落到默认导出目录（Desktop，TCC 限制还删不掉）
curl -s -X POST "http://127.0.0.1:4747/api/projects/<id>/exports" \
  -H "x-studio-key: <openfilm open 打印的 key>" -H "Content-Type: application/json" \
  -d '{"jobs":[{"kind":"stills","format":"png","at":[2,20,88,96],"burnSubtitles":true,"name":"subtitles-qa"}],"folder":"<影片工程绝对路径>/.film/qa"}'
# 轮询 GET /api/projects/<id>/exports 看 status=done，解包 zip 后全尺寸 Read
```

- `x-studio-key` 用 `openfilm open` 打印地址里的 key（不回显到交付物）
- QA 完删除 `.film/qa`（工具目录里不留我的中间产物）
