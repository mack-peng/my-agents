# figwright 实战踩坑与约定

来源：schulte-web 多端设计稿（Mobile / Tablet / PC + Dark）实战复盘，2026-11-12。

## 1. 批量操作：小批文本，大批属性

- `create_text` 每批最多 **3 个**；4 个以上容易超时。
- 超时后不要假设原子回滚：可能部分生效、重复创建，或某些文本退回默认 **Inter 12**。先截图 / 查节点，删除重复项，再用 `set_text_properties` 修正。
- `set_fills` / `set_strokes` / `resize_nodes` / `move_nodes` 等属性操作可 **10–12 个/批**；`create_frame` / `create_section` 建议 **3–5 个/批**。
- 有父子依赖时拆批：先创建父 Frame（拿到 nodeId），再创建子文本/图形；batch 内不能引用前面 op 的新 nodeId。
- 删除操作不能进 batch；用 `delete_nodes` 单独执行。

## 2. 文本与字体

- 中文统一 **PingFang SC**；可用 `Regular` / `Medium` / `Semibold`。**PingFang SC Bold 不存在**，用 Semibold。
- `create_text` 不传 `fontName` 会落到 **Inter 12**；每个文本都显式给 `fontName`、`fontSize`、`fills`。
- 文本创建没有 width/height；固定宽度、居中、右对齐：创建时给 `textAlignHorizontal`，再用 `resize_nodes` 设置 width/height。
- 多行文本用 `\n`；需要固定宽度换行时创建后 resize，高度给足。
- 字体加载失败会让整个 batch 回滚；先做 1 个文本测试字体，再批量。

## 3. 布局与 auto-layout

- 棋盘/网格单元格：`create_frame` 带 `autoLayout: { layoutMode: 'HORIZONTAL', primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER' }`，再把文本作为子节点创建（不传 x/y），自动居中。
- 需要精确坐标的卡片/按钮：绝对定位 + 文本 resize；不要指望 auto-layout 自动处理所有间距。
- 按钮文本：创建时 `textAlignHorizontal: 'CENTER'`，再 resize 到按钮宽度。
- 右对齐数值：`textAlignHorizontal: 'RIGHT'` + resize 到固定宽度，否则对齐不生效。

## 4. 颜色、主题与对比度

- 文件为 LEGACY / sRGB 时，从代码 hex 写入要带 `space: 'SRGB'`。
- 先建 Figma Variables / Paint Styles 再画；没有变量时，换主题色要逐节点 `set_fills`，极易漏改。至少维护一份「节点 id → 颜色角色」清单。
- `#FF6600` 上白字对比度约 **2.9:1**，小字不达标；橙色承载白字时用深一档 **`#C2410C`**（约 5.2:1），亮橙 `#FF6600` 留给标签 / 趋势条 / 强调。
- `create_ellipse` 默认有填充；只描边的徽标/圆环必须显式 `fills: []`。
- Section 默认填充可能很深；需要浅色分区时 `set_fills` 显式设置。

## 5. 页面组织与间距

- 多 case 交付默认：**一个 case 一个 Frame + 一个 Section**；Section 名称即 case 名。
- Section 间距至少 **100–120px**（横向和纵向），不要紧贴；行与行之间留出标题区。
- `get_screenshot` **不包含 Section 名称**；需要在导出图里看到标签，就在 Section 内加 Text。
- 布局规划先算好：
  - Section 宽 = Frame 宽 + 80（左右各 40）
  - Section 高 = Frame 高 + 120（顶部 80 标签区 + 底部 40）
  - Frame 在 Section 内 `(40, 80)`
- 先移动 Section 再移动内部 Frame；移动 Section 会带走所有子节点。
- 新增行/列后同步调整标题 Frame 宽度，避免与 Section 重叠（常见 4–60px 重叠）。

## 6. 克隆、变体与重设父级

- 做 dark / tablet / PC 变体：clone 原 Frame → reparent 到目标 Section → `set_position(40, 80)` → rename → 逐项改色/改字。
- `reparent_nodes` 后坐标可能变化，必须再 `set_position`。
- clone 后子节点 ID 全变；用 `get_node` 或 `search_nodes(root=cloneId)` 拿新 ID，再做批量属性修改。
- 深色变体不是简单反色：背景 / 卡片 / 描边 / 文字 / 强调色分别映射；参考色板表。

## 7. 验证与恢复

- 每完成一组（一个卡片 / 一个 Section）就 `get_screenshot` 该 Frame/Section；整页截图只用于总览，不适合检查细节。
- 检查项：
  - 文本是否存在、是否退回默认字体
  - 对齐是否正确
  - 描边徽标是否有意外填充
  - 格子是否缺数字
  - Section 是否重叠
  - 页面是否横向溢出
- 超时/异常后：先截图 → 查重复节点 → `delete_nodes` 清理 → `set_text_properties` 修正 → 再继续。
- `get_screenshot` 返回的图片要实际看；不要只根据 ops 成功判断视觉正确。

## 8. 文件与页面

- 开始前 `list_files` + `get_metadata`；多个文件打开时用 `use_file` claim，避免跟随用户前台标签页写错文件。
- 新建页面用 `add_page`，之后 `navigate_to_page` 确认当前页。
- 私有插件下 `fileKey` 可能为 `null`，不要构造 Figma URL；用文件名 + 页面名/nodeId 交付。

## 9. 推荐顺序

1. 规划 Frame / Section 尺寸与间距（先算坐标）。
2. 建 Section + Frame，截图确认空白布局。
3. 建父级 Frame（卡片 / 按钮 / 单元格），再建文本 / 图形。
4. 文本每批 ≤3；属性批量 10 左右。
5. 每批后截图；发现默认字体 / 重复节点立即修。
6. 最后统一做主题色 / 暗色变体，维护节点清单。
7. 交付前整页截图 + 关键 Frame 截图各一遍。
