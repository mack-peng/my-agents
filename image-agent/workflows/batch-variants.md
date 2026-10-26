# 批量方案 / 多尺寸

适用：一次出多个风格方向、A/B 标题、同内容多平台尺寸、给用户挑图。
原则：**先定变量 → 小图对比 → 选定后再精修 → 不批量浪费钱**。

## Step 0 定变量

- **方向变量**：构图（左对齐/居中/满版/数据卡）、图像（AI/摄影/纯色/拼贴）、语气（理性/温暖/锋利）。
- **色板变量**：默认深色科技 / 明亮杂志 / 品牌色。
- **文案变量**：标题 A/B（只改标题，不改事实）。
- **尺寸变量**：同一内容多平台（每个尺寸独立重排版）。
- **数量上限**：默认 3 个方向 × 2 个色板 = 6 张；先确认再批量。
- **AI 成本**：背景图可复用；不要每个变体都重新抽卡。

## Step 1 生成候选

### 纯手工/混合

- 以 `templates/still.html` 为骨架，复制成 `v-a.html`、`v-b.html`…；只改变量。
- 共用 `styles.css`/色板变量，避免 6 份完全独立的 CSS。
- AI 背景只生成 1–2 张，多个变体复用/裁切/换遮罩。

### AI 候选

```bash
bl image generate --prompt "<prompt>" --model z-image-turbo \
  --size 3:4 --n 4 --watermark false --out-dir output/<slug>/assets/ai/
```

或火山多 seed：

```bash
node image-agent/scripts/ve-image.mjs t2i --prompt "<prompt>" --size 1536x2048 --seed 1 --out output/<slug>/assets/ai/a.png
node image-agent/scripts/ve-image.mjs t2i --prompt "<prompt>" --size 1536x2048 --seed 2 --out output/<slug>/assets/ai/b.png
```

- 批量前确认费用；失败不自动重试。
- 每张记录 prompt/seed/task_id。

## Step 2 Contact sheet

用 `templates/contact-sheet.html`：

1. 复制到 `output/<slug>/contact-sheet.html`。
2. 把每个 `.thumb` 替换为 `<img src="...">`（候选图路径）。
3. 改 caption 为方向名/色板/标题。
4. 渲染：

```bash
node image-agent/scripts/shoot.mjs output/<slug>/contact-sheet.html \
  --out output/<slug>/contact-sheet.png --json
```

5. 给用户看 contact sheet，先选方向，不看全尺寸细节。

## Step 3 选定与精修

- 用户选 1 个方向（或组合：A 的构图 + B 的色板）。
- 只对选定方向出最终尺寸；需要多平台时每个比例独立重排版。
- 精修：文案断行、数据核对、安全区、对比度、Logo 留白。
- 最终按 `qa-checklist.md` 验收。

## Step 4 交付

- 最终成品（按平台命名）。
- `contact-sheet.png` 作为决策记录。
- `recipe.md` 记录：哪些变体、为什么选这个、AI 用了哪些图/seed。
- 未选中的候选图清理或放 `archive/`，不留在 `assets/`。

## 成本控制

- 先小图/低分辨率选方向，再出最终尺寸。
- AI 背景复用；不要每个变体重新生成。
- 默认 3 方向 × 1 色板；用户明确要 6 张再做。
- 4K/组图/批量前确认。

## 反模式

- ❌ 6 个变体都从零写 6 份 HTML，无法维护。
- ❌ 每个变体都重新抽 AI 图，费用失控。
- ❌ 用 contact sheet 代替全尺寸验收。
- ❌ 多尺寸直接缩放，不重排版。
- ❌ 未选中的图留在 `assets/`，交付混乱。
