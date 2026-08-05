# Phase 5: 提交 MR

根据变更类型分发到对应的 MR 流程。

## 变更类型判断

| 修改文件在 | 流程 |
|-----------|------|
| 仅在 `$BOBKAT_PATH` | `phase5-mr-bobcat.md` |
| 仅在 `$COMPONENT_KIT_PATH` | `phase5-mr-component-kit.md`（覆盖 Phase 5 + Phase 5b） |
| 两个仓库都有 | 先执行 `phase5-mr-component-kit.md`（Phase 5 component-kit MR），review 通过后再执行其中 Phase 5b（bobcat 依赖 MR） |

## Reviewer 列表

两个项目共用同一 reviewer 列表：

| Username |
|----------|
| `@chaipengrong` |
| `@walter.huang` |

> 创建 MR 前必须询问用户选择 reviewer。

## 子流程

- **Bobcat-only MR**：见 `phase5-mr-bobcat.md`
- **Component-kit MR + 生产 tag + Bobcat 依赖 MR**：见 `phase5-mr-component-kit.md`
