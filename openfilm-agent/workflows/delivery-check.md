# 交付检查（look 干净之后、交付之前）

适用：任何影片交付（菜单 6「检查 / 交付」、`build-film.md` / `from-doc.md` 的后期验收、`edit-film.md` 收尾）。检查项与交付说明模板只在这里写一次，各 workflow 指向本文件。

## 前置（不满足不进入）

- 影片目录内 `openfilm look` 已跑到干净（确定性 + 报错 + 响度）
- `node openfilm-agent/scripts/probe-safe-area.mjs output/<film-dir> --overlap --strict` 无越界、无成对重叠（或已向用户说明豁免理由）

## 检查清单（逐项过，不凭印象）

1. **Story QA**：对照镜头表逐拍过（`references/preproduction.md`「Story QA」）
2. **手机可读**：缩到 390px 宽看一遍（字够大、不贴边、一屏一信息）
3. **字幕**：有字幕时抽 4 帧（开头 / 首个内容镜 / 密集信息镜 / 结尾），不压正文 / 下一章标题 / 结尾大字；`look` 不校验字幕层
4. **混音**：记录 `look` 输出的 integrated LUFS / true peak，与 `references/audio-subtitles.md` 基线比对
5. **封面与发布文案**：按 `workflows/publish-kit.md`（小红书默认 3:4）
6. **TODO 清零**：镜头表转的 TODO 清单 `[ ]` / `[~]` 全部处理完（`[x]` 带结果）
7. **目录卫生**：`assets/` 只留影片用到的媒体；`.film/qa` 等中间产物删除；不写 Desktop / Downloads

## 交付说明模板

- 构思与贴题理由（一两句）
- 成片：Studio 预览（工程路径）；**默认不导出**——导出由用户在 Studio 操作，带字幕走「烧录字幕」，`render` 不含字幕
- 前期产物：工程 `preproduction/script.md` + `shotlist.md`（用户改文案从这里改；轻量模式为 `plan.md`）
- Story QA 结果（逐拍过的结果，不凭印象）
- 每个数字 / 事实的来源
- 字幕：抽帧结果（4 帧）
- 混音：integrated LUFS / true peak 与基线比对
- 封面 / 发布文案：路径 + 标题 / 正文 / 标签（如做了）
- 可改点：哪些文字 / 数字在页面里可直接改
- 用户下一步能提供什么（logo / 真实截图 / 定稿文案）
