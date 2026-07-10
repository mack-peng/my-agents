# STRK Project Heuristics

这些 heuristics 是 STRK 项目中经常成立的经验规则，不是 universal hard rules。它们用于提醒需要和代码库打交道的 STRK workflow 主动检查高概率适用的实现习惯，减少遗漏常见工程细节。最终决策仍应以 spec、设计稿、现有代码、repository conventions、产品意图、工程 tradeoff 和 agent / reviewer judgement 为准。

使用方式：

- 在搜索、定位、比较、理解现有代码时参考本文件，先把可能相关的项目惯例、legacy surface、共享组件、性能/IO 阈值和兼容性约束纳入调研范围。
- 在 requirement design、implementation planning、write-code、spec review、code review、self review / reviewer pass 中参考本文件。
- 先判断当前 spec、设计稿、现有代码和 repository conventions 是否支持使用某条 heuristic。
- 通常优先考虑适用的 heuristic；如果上下文显示不适合，应基于 judgement 选择更合适的方案，不要强行套用。
- 如果某条 heuristic 看似相关但最终不采用，应在 `design.md`、`spec-analyze.md` 或 `handoff.md` 中用一句短说明记录原因，例如现有代码路径不同、组件无法满足交互、mockup 明确要求特殊视觉、技术栈不是 LESS，或复用会引入更大风险。
- Reviewer 应检查相关 heuristic 是否被考虑过，但不能把未采用 heuristic 自动判定为错误；只有缺少适用性判断、理由明显不成立、或结合具体证据会造成实现风险时才要求修正。

## Codebase Research And Repo Boundaries

### Bobcat Legacy Code Location

`bobcat` 已经迭代多年，代码库中可能存在多个看起来相似的 legacy 代码位置。定位代码时不要只因为名称、路径或表面结构相似就盲选目标实现。

如果无法仅通过代码本身判断哪个模块是正确且当前在用的，通常按以下线索继续确认：

- 前端技术栈演进大致经历过 Rails Haml + Knockout -> Haml + Angular -> React；在缺少反证时，更新技术栈中的实现更可能是当前在用路径。
- 使用 git 信息辅助判断，例如相关代码块、文件或路由最近的修改时间、作者、提交说明和关联 MR。
- 对比路由、入口、实验/feature flag、埋点、API 调用、store / state 连接、模板引用和构建入口，确认代码是否能从真实用户路径到达。
- 如果多个候选实现服务于不同业务模块，应先识别业务归属，再决定复用、扩展或新增位置。
- 如果仍无法确认，应在设计、review 或 handoff 中提出不确定点并询问用户，不要随意选择一个相似位置作为事实依据。

例外示例：

- 用户、spec、code design 或 repository owner 已明确指定目标路径；
- 当前修改是明确的 legacy 页面局部修复，且入口、路由和模板引用已经能证明目标代码仍在使用；
- 代码库已有清晰的 owner 文档、目录约定或自动测试覆盖指向目标实现。

### Bobcat And OpenHands Product Boundary

用户的主要 UI 入口通常仍在 `bobcat`。`openhands` 主要支持 agentic website building 模块。设计、实现或 review 跨 `bobcat` / `openhands` 的需求时，通常要先判断用户入口、状态归属和 handoff 方向。

常见判断：

- 面向用户的主流程入口、导航、权限、账户/site 上下文、运营配置和大多数既有 UI 状态，优先从 `bobcat` 当前路径确认。
- `openhands` 相关设计应重点确认 agentic website building 模块中的接收端、执行端、生成状态、agent session、payload 消费和失败恢复。
- 跨 repo handoff 不能只写“从 bobcat 跳转到 openhands”或“openhands 支持该能力”；需要说明 source / target、payload contract、兼容旧入口、错误处理和两边测试。
- 如果需求实际改变的是用户主入口或既有站点管理体验，不要只在 `openhands` 内完成实现而遗漏 `bobcat` 入口和状态衔接。

例外示例：

- spec 明确限定为 `openhands` 内部能力、内部工具或 agentic website building 子流程；
- 需求只调整 `openhands` 接收后的执行逻辑，不影响 `bobcat` 入口、权限、状态展示或 payload contract；
- 产品已明确迁移入口归属，并在 spec / code design 中说明旧入口兼容策略。

## Frontend Styling And Components

### Colors

需求或 UI 中提到颜色时，优先检查 `fe/styles/strikingly_shared/colors.less`：

- 如果已有变量能表达该颜色或语义，优先使用已有变量。
- 如果是新的十六进制色值，通常在 `fe/styles/strikingly_shared/colors.less` 中按现有命名风格新增语义化变量，再在使用处引入。
- 如果是 `rgb(...)` / `rgba(...)`，通常可以直接使用。

例外示例：

- 当前代码所在应用不使用该 LESS 变量体系；
- 颜色来自第三方 embed / runtime data / canvas / chart library，不能自然映射到共享变量；
- mockup 中的临时视觉值不应扩大成共享变量。

### Component Kit

以下基础 UI 通常优先复用 `component-kit`：

- `Input`
- `Tab`
- `CheckBox`
- `Radio`
- `Button`
- `Card`
- `Carousel`
- `Tag`

如果 UI 与默认组件视觉不同，通常优先在 `component-kit` 组件基础上做 CSS 调整或组合，而不是设计一套替代组件。设计中应提醒实现者先参考当前代码里的 `component-kit` 导入和使用方式。

例外示例：

- 现有页面已经使用另一套局部组件体系，混用会增加复杂度；
- 交互、无障碍语义或 DOM 结构与 `component-kit` 组件能力明显不匹配；
- 需求需要的是业务组件而不是基础控件；
- 复用会导致比新增局部实现更大的样式覆盖和维护成本。

### LESS `calc(...)`

如果在 LESS/CSS 文件中需要写 `calc(...)`，通常使用 LESS 可解析的转义字符串形式：

```less
width: ~'calc(100% - 12px)';
```

例外示例：

- 当前样式文件不是 LESS；
- 现有同文件写法已经稳定使用另一种可编译形式；
- `calc(...)` 位于 CSS-in-JS、inline style 或其它不需要 LESS 转义的环境。

## Project Technology And Monitoring

### Legacy Frontend Technology

新增前端代码通常避免引入 Angular.js 或 Haml。它们在当前项目里更多属于 legacy surface，除非 spec、现有文件边界、code design 或 reviewer sign-off 明确要求继续在该技术栈内完成。

例外示例：

- 当前改动必须落在现有 Angular.js / Haml 页面内，局部改动比迁移更安全；
- 需求是修复 legacy 页面的小问题，不适合顺手迁移；
- 团队已经决定当前范围继续维护该 legacy surface。

### Monitoring Path

当前项目中，未知或意外的前后端错误通常应接入合适的监控路径，例如 Bugsnag，同时避免泄漏敏感数据。

例外示例：

- 代码路径已有更合适的 domain-specific monitoring / alerting；
- 错误已经在更上层统一捕获并上报；
- 本次改动只处理用户可恢复的校验错误，不需要异常监控。

## Frontend Runtime And Compatibility Thresholds

这些阈值是 review 提醒线，不是绝对红线。超过阈值时通常需要解释、优化或补充验证。

- Expensive UI：如果单个 expensive UI 区域超过约 100 个 child nodes，检查是否有不必要 re-render 或虚拟化/拆分机会。
- Network polling：同一页面或组件在 1 分钟内重复发起同类网络请求时，检查是否有缓存、节流、去重或明确产品理由。
- Mobile baseline：除非 spec 明确排除 mobile，通常至少按 375x667（iPhone 6/7/8 基线）检查布局、点击、表单、弹窗和 loading/error/empty 状态。
- WMP / WeChat：涉及 WMP 代码或资源体积时，检查是否仍满足 WeChat 限制，并优先考虑更小或已有替代方案。
- Frontend dependency size：新增或变更前端依赖时，如果新增库超过约 10 KB gzipped，通常需要明确收益、替代方案、bundle 影响和 reviewer sign-off。

例外示例：

- feature 明确不支持 mobile 或 WMP；
- 性能热点经测量不在该路径；
- 网络请求是实时协作、支付状态、上传进度等产品要求；
- 依赖体积已经通过 code splitting、lazy loading 或现有 chunk 策略隔离。

## Backend IO And Data Thresholds

这些阈值是 backend review 的经验提醒线，应结合数据规模、索引、调用频率和产品实时性判断。

- Complexity：高于 `O(n*n)` 的时间复杂度或高于 `O(n)` 的内存占用通常需要解释和数据规模依据。
- Broad reads：避免 `select *` 或大批量读取后只使用少数字段；优先读取所需字段。
- Repeated writes：短时间内多次写同一记录且只需要最终状态时，通常考虑合并、去重、延迟写或缓存最新状态。
- Joins：单个 query join 超过 3 张表时，通常检查索引、cardinality、拆分查询或缓存方案。
- Batch writes：大量 insert 通常优先考虑 batch insertion，而不是短时间逐条写入。
- Third-party read-only data：如果实时性不是必须，且产品能接受 fallback，通常考虑本地 copy/cache，而不是每次 request path 实时拉取第三方数据。

例外示例：

- 数据规模有明确上限且远低于风险阈值；
- 查询路径低频、异步、或已有 production evidence；
- 强实时一致性是产品核心要求；
- repository 已有成熟模式与这些提醒线不同，且适用于当前路径。

## File Upload Architecture

### Presigned Object Storage Uploads

文件上传功能通常优先参考 AWS S3 presigned URL 的设计：后端负责鉴权、生成上传授权和记录业务元数据，客户端使用 presigned URL 直接上传到 S3，上传数据流不经过后端服务。类似 S3 的 object storage 服务也通常可以参考这一模式。

这种设计通常有利于：

- 避免大文件上传占用后端 request worker、内存、带宽或连接池；
- 减少后端服务阻塞，提高上传稳定性和吞吐；
- 让 object storage 处理断点、分片、地域、带宽和对象存储层面的能力；
- 把后端职责聚焦在权限、对象 key 策略、内容类型/大小限制、上传完成确认、业务记录和安全校验。

设计或 review 上传方案时，通常需要确认：

- presigned URL 的权限范围、过期时间、object key 命名和用户/site 归属是否安全；
- 文件大小、类型、数量、并发、重试、取消、进度、失败恢复和完成回调是否覆盖；
- 上传完成后如何通知后端、校验对象存在性、落业务记录、触发后续处理或清理失败/过期对象；
- 是否需要 multipart upload、病毒扫描、图片处理、转码、CDN、ACL / bucket policy 或服务端 copy；
- 不要把文件内容经后端转发上传，除非有明确安全、合规、加工或第三方 API 限制理由。

例外示例：

- 上传内容必须先经过后端同步加工、合规扫描、加密、转码或第三方接口代理，且不能异步处理；
- 文件很小、频率低，现有后端上传路径已经成熟且改造成本明显高于收益；
- object storage 或目标第三方服务不支持可接受的 presigned / direct upload 模式；
- 产品需要强事务语义，必须在单个后端流程内完成内容接收和业务写入，并已有容量评估。
