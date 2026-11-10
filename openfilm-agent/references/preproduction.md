# 前期创作（pre-production）：脚本与分镜

写页面之前先出脚本与分镜。规则只在这里写一次；`workflows/build-film.md`、`workflows/from-doc.md`、`workflows/edit-film.md` 的前期步骤都指向本文件。
已装 skill 在 `.agents/skills/`（只读、整篇读完照做）；与 AGENTS.md 或 openfilm 铁律冲突时，以 AGENTS.md / 铁律为准。

## 路由（按片型选 skill）

- **产品片** → `narrated-product-film`（有口播）/ `silent-product-demo`（无口播）；30–90s 解释型再加 `explainer-video`
- **技术讲解** → `technical-video-script`
- **新闻类** → 本文件「新闻类制作规则」+ `workflows/from-doc.md` 的闸门（无专属 skill）
- **通用方法**（所有片型的 AV 脚本与镜头表）→ `scripting-and-storyboarding`
- **短竖版钩子**（≤60s 竖版必读）→ `short-form-video-script`

读法：按路由读整篇照做；上游 skill 里与本文件重复的部分以本文件为准，冲突部分忽略。

## 模式（按时长与旁白）

- **轻量**（≤15s、单信息、无 VO 或一句 VO）：一句话 promise + 3–5 行镜头表，不写完整脚本
- **标准**（15–60s 或有 VO）：闸门 1 → 2 → 3 全走
- **完整**（>60s、多条新闻、多场景）：标准 + cut list + 每条素材清单

## 闸门（未确认不动手，对齐 AGENTS.md「编排纪律 · Sign-off 协议」）

1. **brief**：一句话 promise（看完记住什么）、受众与平台、时长与形态、素材与事实边界、默认假设
2. **beats**：每拍 = 职责 + 新增信息 + 证明画面；数字与事实只来自用户确认过的材料
3. **AV 脚本 + 镜头表**：sign-off 后转 TODO 清单，才开始写页面

**产物落点**：闸门中间稿先落 `input/<slug>-preproduction.md`（与长文档同处，遵循 Context 隔离）；sign-off 后的定稿写进**影片工程** `preproduction/`（`script.md` + `shotlist.md`；轻量模式合并为 `plan.md`），交付说明引用工程内路径，改片先读它。

## AV 脚本（双栏）

声音列（口播原句 / 音效）｜画面列（这拍屏幕上是什么）。

- 画面没写 = 会拍成"干讲"（只是我在说话）；每句口播映射一个视觉意图
- 屏幕字独立成篇：静音播放时只看屏幕字也能看懂
- 口播语言：一呼吸一句、具体名词、指代句改全称；整稿先念一遍（见 `audio-subtitles.md`「口播稿自检」）

## 镜头表（分镜是决策文档，不是画）

列：`page(scene-NN.html)` ｜ `at` ｜ `duration`（预算）｜ 画面/构图 ｜ 动效意图 ｜ VO ｜ 屏幕字 ｜ 声音 ｜ starting state ｜ core/cut

- **一拍一个念头**：装不下就拆镜，不硬塞
- **starting state**：这页 `frame(0)` 的初始状态（DOM/数据/位置），帧一即可读、可独立重看
- **core / cut 每拍标好**：cut list 在脚本里定，不留给后期吵；砍光 cut 拍仍要交付 promise
- **构图**：一镜一焦点（大小 > 对比 > 颜色定层级）；每拍只给一个机位动作；元素进出方向有语义
- **时长是预算不是锁定值**：中文 VO 实测 ~5.1–6.2 字/秒（本系列 6 条实测均值 5.8），预算取 **5.5 字/秒**（偏保守）；英文按 ~2.3 词/秒。镜时长 = 口播量 ÷ 速率 + 每镜 0.4s 余量；最终以 VO 实测回填，见 `audio-subtitles.md`

## openfilm 映射（写页面时遵守）

- 一镜一页（`scene-NN.html`）；全部镜头放同一个 section 顺序 `at` 硬切；音乐、VO 各自独立 section
- page `duration` = VO 实测 + 头尾余量；`frame(t)` 只依赖 t；starting state 落成页面初始 DOM
- 构图/安全区/字幕基线 → `visual-qa.md`、`audio-subtitles.md`；**新片先经 Studio API 应用字幕基线**（默认 0.72 会压内容）

## Hook（短竖版前三秒）

- 画面 + 屏幕字 + 口播三层同拍；不铺垫、不自我介绍、不解释栏目
- promise 必须兑现：over-promise 会造成中途划走，不如"真承诺、真兑现"
- 结尾 loop（回到第一帧的暗示）或一个 CTA，不叠多个

## 新闻类制作规则（from-doc 使用）

- **4–5 条 / 60–90s** 甜点位；单条标题 ≤20 字；**数量是承诺不是目标**，最弱一条拉低整片，不硬凑
- **真实素材硬门槛**：每条新闻必须有真实截图（官方公告 / 报道页 / 真实产品界面），优先级 官方截图 > 报道截图 > 真实产品界面 > 图库辅助图；找不到可用素材就换题或明确说明，不用假界面、纯图标、AI 编造截图糊弄
- **每条换一种视觉结构**（动画隐喻/信息卡/数据条…），不复制同一张卡五遍
- **固定短开头**一句进第一条；**不加片尾总结、关注引导**（讲完最后一条即收）
- **例外：系列化周刊**——固定 end card（选型建议/下期看点）+ **一句口播结束语**（如"这就是十一月第一周，我们下周见"），结束语属片尾收束，不新增信息章节；结束语缺失会被当成"没做完"（Nº06 实测）
- 字幕每屏 1–2 行、每行 ≤22 中文字（竖屏位置按 `audio-subtitles.md` 基线）

## Story QA（`look` 干净之后、交付之前）

- 前 3 秒钩子成立（三层同拍）；promise 到结尾兑现
- 每个 claim 有画面或素材证明；事实与数字可回溯到确认过的材料
- 一镜一信息；视觉变化 2–4s 一次，或有明确理由的停顿
- **手机可读**：正文 ≥28px、辅助 ≥20px（1080 宽）；一屏只讲一件事；整页截图/密集表格不上屏，改自绘大字/图表
- **边距**：左右 ≥84px；内容底 ≤1400（字幕带 1465–1607）
- **图表优先**：数字用柱/条/点阵/大字，不把原文图缩成缩略图
- 静音可读（屏幕字独立成篇）；cut list 覆盖超时方案
- **开头**：前 3 秒有钩子（画面+屏幕字+口播）；**结尾**：有结论或署名 end card，不空收
- 交付前把成片缩到 390px 宽看一遍（手机模拟）
- 执行结果写进交付说明（对照镜头表逐拍过，不凭印象）

## structure diagnosis（改片 · 结构性改动前）

三问，结论写给用户确认后才进闸门：

1. 片子的 **promise** 还成立吗（改动后观众看完记住的还是那句吗）
2. 逐 **beat** 哪里断了 / 重复了（哪拍没有新增信息、哪拍信息说了两遍）
3. **cut list** 该砍哪几拍（砍光 cut 拍是否仍交付 promise）

## skill 边界（上游缺失兄弟 skill 的替代）

- `brand-profile` / `voice-builder` → 输入 brief + `input/` 里的品牌素材（logo/色/字）
- `hook-writer` → 本文件「Hook」+ `short-form-video-script` 的钩子段
- `idea-generation-and-ideation` → 用户 brief / `from-doc.md` 闸门 1 的选取表
- `design-and-templates` → `openfilm skill <片型>` + 影片公共 `styles.css`
- `technical-video-script` 的 devrel 路由兄弟（live-streaming、conference 等）不适用本 agent
- 上游输出格式（Remotion 合成、GSAP 实时动画、HyperFrames/edge-tts 工具链）一律翻译成 `frame(t)` 确定性绘制：不留定时器、不自动播放、同一 t 同一画面

## 维护

- **不跑 `skills update`**；上游变更 = 单独任务：重新点名安装 + diff 审阅后再替换
- 只装点名 skill，禁止 `--all` / `-g` / 装整仓；装后删除 `evals/` 等非运行时文件，并同步重算 `skills-lock.json` 的 `computedHash`（算法：文件按相对路径排序，sha256(相对路径 + 内容) 逐个喂入）
- 来源与许可（方法摘要改写，非原文搬运）：`social-media-skills/skills`（MIT）、`iart-ai/explainer-video-skills`（MIT）、`adamperlis/video-skills`（MIT）、`samber/developer-relations-skills`（MIT）
