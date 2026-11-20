# 小工具在线契约增量（2026-11-10）

> 来源：<https://miniapp-sandbox.xiaohongshu.com/minitool/doc>
> 抓取时间：2026-11-17；文档最后更新：2026-11-10
> 本地基线：`.agents/skills/minitool-zip-builder/references/js-api.md`（2026-10-30 快照）
> skill 包：`minitool-zip-builder` 1.10.0（源包 2026-11-05，hash `b79d7daafe04b420b721ad790d5bd1072d787b0040d70e1115b8529c50c75442`）
> 优先级：**在线文档 > 本地 skill 基线**。本文只记录增量、冲突和接入口径，不替代 `SKILL.md`。

## 0. 使用规则

- 每个任务开始抓一次在线文档，记录 `last-updated`；同会话可复用。
- 只有在线文档明确对外公开的能力才可接入；内测能力必须标注「内测」。
- 内测能力默认 P2/P3 入口；版本 / 方法 / 运行不可用时**隐藏入口**，不作为核心玩法唯一依赖。
- 受限能力必须有构建开关（`CAP_*`），并在能力 spec 记录默认值与上传通道约束。
- 不手改 vendored skill；从上传页复制最新口令更新 skill，再同步本文。

## 1. 新增平台 API

| API | 最低客户端 | 用途 | 关键限制 | 默认接入 |
| --- | --- | --- | --- | --- |
| `window.xhs.AI.createModel().generateText()` | 内测加白 | 对话 / 文案 / 点评 | 非流式；`deepseek-v4-flash` / `dots-3-note-prev`；最多 40 条 / 12000 字符；`max_output_tokens` ≤2048；`temperature` 0–1.5；每用户每天 100 次；内容审核；**内测 AI 能力暂不能通过第三方 Agent 上传** | P3，`CAP_AI` 默认关 |
| `getWindowInfo()` | 9.49+ | 容器尺寸、安全区、顶部按钮位置 | 逻辑像素；`menuButtons` 可能为 `null`；尺寸变化需重取 | P0 |
| `getLocation({ type })` | 9.49+ | 单次定位 | `wgs84` / `gcj02`；字段可能缺失；不给持续定位；授权由客户端处理 | 按定位接入，默认不接 |
| `vibrateShort({ type })` | 9.50+ | 短振动 | `type` 必填：`heavy` / `medium` / `light`；无马达也可能成功 | P0 |
| `vibrateLong()` | 9.50+ | 长振动 | 无业务参数；不承诺时长 | P0 |
| `startGyroscope({ interval })` / `stopGyroscope()` | 9.50+ | 角速度采集 | `ui` 60ms / `normal` 200ms；单位 rad/s；无陀螺仪 `10002`；后台暂停 | 按玩法接，默认不接 |
| `onGyroscopeChange(cb)` / `offGyroscopeChange(cb?)` | 9.50+ | 角速度监听 | 同步注册；非法回调抛 `TypeError`；同一函数去重 | 随陀螺仪 |
| `followAuthor()` | 9.51+ | 引导关注作者 | `follow_status`：-1 / 0 / 1 / 2；20002 取消；15404 每日 10 次频控；10003 进行中 | P2 |
| `getFollowStatus()` | 9.51+ | 查询关注状态 | 业务失败也 resolve 为 `follow_status: -1` | P2 |
| `share({ type, image_resource? })` | 9.53+ | 分享小工具卡片 / 指定图片 | `type=card` 或 `image`；图片支持 data URI / 本地路径；**仅全屏容器**；每用户每天 10 次；15501 图片失败；15502 非全屏 / 面板失败；15503 频控 | P1 |
| `rewardAuthor()` | 9.53.3+（内测） | 调起赞赏 | 需先开通赞赏能力；成功不含金额；旧客户端可能持续等待 | P3，默认关 |
| `setCloseRetentionEnabled({ enabled })` | 9.53.3+（内测） | 关闭容器时赞赏挽留 | 必须配合赞赏；`enabled` 必须是 boolean；状态仅当前容器；默认 false | 预留，默认不启用 |
| Worker | 9.53+ | Dedicated Worker | 仅包内 classic 脚本；每页最多 1 个；隐藏 30 秒回收；禁止 module / blob / data / 外部 URL / 子 Worker；`onTerminate` / `offTerminate` | 按需，默认不接 |
| §2.7 静态资源优化 | 9.53.3+ | 主包体积优化 | 可优化资源放 `assets/`；入口 HTML / JS / CSS 放该目录之外；可优化资源不要 base64 内联；不保证全部离线可用 | 打包时执行 |

## 2. 能力更新 / 修正

- `postNote.mediaInfo.live_photo_resources`：在线文档字段名为 `live_photo_resources`，本地 `js-api.md` 写的是 `live_photo_sources`，以在线为准。
- `saveImageToPhotosAlbum` 最低客户端 9.42+；`filePath` 支持 data URI 或本地路径，不支持网络地址。
- Storage JS API 最低客户端 9.46+；单个 key 1 MB，总缓存 10 MB；`data` 只支持 JSON 字符串。
- 文件系统 9.49+；目录根来自 `miniToolEnv.userDataPath`。
- `interactionOpenApi` 9.49+；仅支持图片，媒体必须是本地文件句柄，不支持网络 URL / `data:` URI / 绝对路径。
- 云存储 / 排行榜 9.51+，仍为内测；排行榜使用 `submitScore` 时必须勾选「用户头像昵称授权」，否则 1005。
- 排行榜按「小工具 × 接口」限频 150 QPS；榜单结果本地缓存 30–60 秒；`2002` 做有限退避，`data: []` 才是空榜。
- `share` 仅全屏容器可用；`type=image` 的图片仅用于站内私信，站外渠道使用平台根据当前页面截图生成的 H5 海报。
- `rewardAuthor` / `setCloseRetentionEnabled` 需要客户端 9.53.3+，且方法存在不代表客户端已支持；旧客户端静默忽略未知事件时可能持续等待，必须加超时并允许隐藏入口。
- JS / CSS 基线仍为 Chrome 61 / ES2017；iOS 最低 18.4，iOS 额外能力只做增强。

## 3. 与本地 skill 基线的冲突（在线优先）

| 本地文件 | 本地写法 | 在线文档 | 处理 |
| --- | --- | --- | --- |
| `device-capabilities.md` | Web Worker / SharedWorker / Service Worker 全部移除 | Dedicated Worker 9.53+ 可用，受包内 classic 脚本、单实例、回收限制 | Web Worker 仍禁用；平台 Worker 按 9.53+ 能力检测接入 |
| `device-capabilities.md` | `Gyroscope` / `DeviceOrientationEvent` 等传感器移除 | 平台 `startGyroscope` / `onGyroscopeChange` 9.50+ 可用 | Web 传感器仍禁用；平台陀螺仪按玩法可选 |
| `device-capabilities.md` | `navigator.geolocation` 移除 | 平台 `getLocation` 9.49+ 可用 | Web 定位仍禁用；平台定位按产品需要接入 |
| `device-capabilities.md` | 浏览器本地存储「允许」 | 仅作为 Storage JS API 不满足版本条件时的降级方案，必须处理异常 | 优先 Storage 9.46+，浏览器存储仅回退 |
| `js-api.md` | `live_photo_sources` | `live_photo_resources` | 用在线字段名 |
| `zip-artifact-spec.md` | JS / CSS 可放 `assets/` | §2.7：入口 HTML / JS / CSS 放在 `assets/` 之外 | 入口文件放 zip 根目录；图片 / 字体放 `assets/` |
| `js-api.md` | 版本门禁零散 | 各 API 有明确最低客户端版本 | 以本文版本表为准 |

## 4. 能力 × 产品定位矩阵

| 品类 | 优先接入 | 可选 | 不优先 / 不接 |
| --- | --- | --- | --- |
| 技巧 / 分数驱动（如 flappy-bird） | 震动、安全区、分享成绩图、发笔记、评论、排行榜、关注 | AI 点评、赞赏 | 定位、Worker、云存储 |
| 解谜 / 关卡 | 安全区、震动、分享通关图、关注 | 排行榜、AI 提示 | 定位、陀螺仪 |
| 工具 / 生成器 | 安全区、保存相册、发笔记、分享 | 关注 | 排行榜、震动、陀螺仪 |
| 经营 / 养成 | 安全区、分享成就、排行榜 | 云存储、AI、赞赏 | 陀螺仪、定位 |
| 社交 / 互动 | 关注、分享、评论、排行榜 | AI、赞赏 | 陀螺仪、Worker |
| 超休闲 / 单局极短 | 震动、分享、排行榜 | 关注、AI | 云存储、Worker |

定位落点写在能力 spec 的 `Context & Assumptions`，每个能力必须写「接入」或「不接原因」。

## 5. 构建开关与上传约束

| 开关 | 默认 | 说明 |
| --- | --- | --- |
| `CAP_HAPTICS` | `true` | 震动；API 缺失自动隐藏开关 |
| `CAP_SHARE` | `true` | 分享 / 发笔记 / 存图 / 评论 |
| `CAP_RANKING` | `true` | 排行榜；上传必须勾选「用户头像昵称授权」 |
| `CAP_AI` | `false` | 内测 AI；第三方 Agent 上传构建默认关闭，并在构建期移除 AI 模型字符串与调用（不是仅隐藏入口） |
| `CAP_REWARD` | `false` | 赞赏；确认开通赞赏能力后再开 |
| `CAP_RETENTION` | `false` | 关闭挽留；默认不启用，避免打断 |

- 分享仅全屏容器可用；半屏容器不展示分享入口。
- AI 内测能力暂不能通过第三方 Agent 上传；需要 AI 时改手动上传 / 已加白构建。
- 赞赏入口展示前需确认发布配置已开通赞赏；`SDK 方法存在`不等于客户端支持。

## 6. 刷新流程

1. 从小工具上传页复制最新「改写口令」。
2. 按口令更新 `.agents/skills/minitool-zip-builder/`，核对 `skills-lock.json` 的 version / hash。
3. 重新抓在线文档，比较 `last-updated`；有变化就更新本文件。
4. 跑 ① 重新打包与 audit；交付说明标注「在线契约版本 + 未实测项」。

## 7. 全屏容器与安全区（2026-11-17 实测）

- 小红书默认全屏展示：手机状态栏不占位，**返回 / 更多 icon 浮在页面内容之上**，位于状态栏下方。
- 不能只用 `safeArea.top` 当顶部 inset：它通常只覆盖状态栏，不包含浮层 icon。
- 顶部 inset 口径：
  - 优先：`max(safeArea.top, menuButtons.back/me/share 的 bottom)`；
  - `menuButtons` 缺失：`max(safeArea.top + 44, 104)`；
  - `getWindowInfo` 不可用或失败：平台内 fallback 至少 104px（有容器注入的 `--safe-area-inset-top` 时用 `max(injected + 44, 104)`）。
- HUD 顶部 padding 使用该 inset；`game_layout` / 主内容 `max-height` 同步减去同一个值，避免页面被顶出滚动。
- 验收：平台模拟器 + 真机确认标题、得分、难度、震动/分享入口全部在返回/更多 icon 下方。

## 修改记录

- 2026-11-17 初版：基于在线文档 2026-11-10 与本地 skill 1.10.0 差异整理；补产品定位矩阵、构建开关、上传通道约束。
- 2026-11-17 补全屏容器安全区实测：状态栏不占位 + 返回/更多浮层，`safeArea.top` 不足，需用 `menuButtons.bottom` 或 104px fallback。
