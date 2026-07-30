# Phase 5: 提交 MR

## 路径判断

| 修改范围 | MR 数量 | 流程 |
|---------|--------|------|
| 仅 bobcat | 1 个 MR | 直接跳到 [bobcat MR](#bobcat-mr) |
| component-kit + bobcat 依赖更新 | 2 个 MR | 先 [component-kit 生产 tag](#component-kit-生产-tag)，再 [bobcat MR](#bobcat-mr) |

---

## Component-kit 生产 tag

### 前置条件

- Phase 4 已完成，测试 tag（如 `v2.0.16.01T`）已推送
- QA 验证通过
- `$COMPONENT_KIT_PATH` 已在 `.env` 中配置

### 流程

#### 1. 确定生产版本号

从 Phase 4 上下文提取 base tag（如 `v2.0.16`），升版本号作为生产 tag：
- `v2.0.16` → `v2.0.17`
- `v2.0.17` → `v2.0.18`

```bash
git tag --sort=-v:refname | head -5
```

#### 2. 打生产 tag

生产 tag 创建在测试 tag 同一个 commit 上（不含 `T` 后缀）：

```bash
cd $COMPONENT_KIT_PATH
git checkout <test-tag>
git tag v<production-version>
git push origin v<production-version>
```

#### 3. 输出

```
## Phase 5: Component-kit 生产 tag

- **测试 tag**: <test-tag>
- **生产 tag**: v<production-version>
- **Tag URL**: https://cd.i.strikingly.com/strikingly/component-kit/tags
- **状态**: 已发布
```

---

## Bobcat MR

### 前置条件

- 测试验证已通过
- Component-kit 生产 tag 已发布
- `glab` 已认证（通过 gitlab-agent）

### 流程

#### 1. 创建 bobcat 开发分支

```bash
cd $BOBKAT_PATH
git checkout develop && git pull origin develop
git checkout -b <branch-name>
```

分支命名：`fix-deps-component-kit-<简短描述>`

#### 2. 更新 component-kit 依赖为生产 tag

将 3 个 package.json 中的 component-kit 引用从测试 tag 改为生产 tag：

```diff
- "component-kit": "...component-kit.git#<test-tag>",
+ "component-kit": "...component-kit.git#v<production-version>",
```

| 文件 |
|------|
| `package.json` |
| `fe-apps/fujian-edu/package.json` |
| `fe-apps/support/package.json` |

```bash
yarn
git add package.json fe-apps/fujian-edu/package.json fe-apps/support/package.json yarn.lock
git commit -m "fix(deps): update component-kit to v<production-version>"
git push origin <branch-name>
```

#### 3. 询问 Reviewer

> **"请提供 Reviewer 的名字："**

#### 4. 生成 MR 描述

使用 `references/mr-template.md` 模板填充 MR 描述。

#### 5. 创建 MR

```bash
cd $BOBKAT_PATH
glab mr create \
  --source-branch <branch-name> \
  --target-branch develop \
  --title "<title>" \
  --description "$(cat /tmp/mr_desc.md)"
```

#### 6. 输出总结

```
## Phase 5: Bobcat MR

### MR 信息
- **标题**: <title>
- **分支**: <branch-name> → develop
- **Reviewer**: @<reviewer>
- **MR 链接**: <URL>
```

#### 7. 等待 Sign-off

> **"Phase 5 完成。MR 已创建。全部流程结束。"**

---

## 飞书模式：组件-tag + MR 追加

每个子阶段完成后追加到飞书文档：
- Component-kit 生产 tag 完成 → 追加 tag 信息
- Bobcat MR 创建 → 追加 MR 链接

---

## MR Review 反馈处理

1. 在开发分支上修改代码
2. 重新 cherry-pick 到测试分支验证
3. 推送新 commit
4. 在 MR 中回复 Reviewer
