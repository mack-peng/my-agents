# Phase 5 + 5b: Component-kit MR + 生产 tag + Bobcat MR

仅 component-kit 变更时执行。覆盖 Phase 5 和 Phase 5b 两个阶段。

---

## Part A: Component-kit MR（Phase 5）

### 前置条件

- Phase 3 代码已完成
- Phase 4 开发分支（`fix-component-kit-*`）已推送（仅源码，无构建产物）
- `glab` 已认证

### 流程

#### A1. 确认分支状态

```bash
cd $COMPONENT_KIT_PATH
git log --oneline -3 <branch-name>
```

#### A2. 询问 Reviewer

| Username |
|----------|
| `@chaipengrong` |
| `@walter.huang` |

> **"请选择 Reviewer：1. @chaipengrong  2. @walter.huang"**

#### A3. 生成 MR 描述

使用 `references/mr-template.md` 模板生成 MR 描述：**严格保持模板结构不变**，将各 section 的占位提示替换为实际内容，勾选 checklist，表中 `Reviewer` 栏位填入 reviewer username。写入 `/tmp/component-kit-mr-desc.md`。

#### A4. 创建 MR

```bash
cd $COMPONENT_KIT_PATH
glab mr create \
  --source-branch <branch-name> \
  --target-branch develop \
  --title "<title>" \
  --reviewer <reviewer-username> \
  --description "$(cat /tmp/component-kit-mr-desc.md)"
```

#### A5. 输出总结

```
## Phase 5: Component-kit MR

### MR 信息
- **标题**: <title>
- **分支**: <branch-name> → develop
- **Reviewer**: @<reviewer>
- **MR 链接**: <URL>
```

#### A6. 等待 Sign-off

> **"Phase 5 完成。Component-kit MR 已创建，等待 review 通过后进入 Phase 5b。"**

### 飞书文档追加

```markdown
## Phase 5: Component-kit MR
- **分支**: <branch-name> → develop
- **Reviewer**: @<reviewer>
- **MR 链接**: <URL>
- **状态**: 等待 review

## Phase 5 TODO
- [x] 创建 component-kit MR。结果：<URL>
```

### MR Review 反馈处理

1. 在开发分支上修改代码
2. 推送新 commit（不 squash，不 force push）
3. 在 MR 中回复 Reviewer
4. Review 通过后 sign-off 进入 Part B

---

## Part B: 生产 tag + Bobcat MR（Phase 5b）

**Phase 5 component-kit MR review 通过后触发。用户通知后才执行。**

### Component-kit 生产 tag

#### B1. 拿最新 tag，确定生产版本号

```bash
cd $COMPONENT_KIT_PATH
git fetch origin --tags
git tag --sort=-v:refname | head -10
```

从列表中找到最新生产 tag（如 `v2.0.17`），版本号 +1 得到目标版本（如 `v2.0.18`）。

#### B2. 切到最新 develop

```bash
git checkout develop && git pull origin develop
```

#### B3. 创建本地构建分支（不推送）

```bash
git checkout -b publish-product-YYYYMMDD
```

分支名 date 部分跟随当天日期。如分支已存在则接 `-01` / `-02` 后缀（如 `publish-product-20260730-01`）。**此分支仅本地使用，不推送。**

#### B4. 构建

```bash
yarn build
```

#### B5. 提交构建产物

```bash
git add -A
git commit -m 'Build: product'
```

#### B6. 打生产 tag

```bash
git tag v<production-version>
```

#### B7. 推送 tag

```bash
git push origin v<production-version>
```

#### B8. 停下等用户确认

> **"Component-kit 生产 tag `vX.Y.Z` 已推送。请确认是否继续 Bobcat MR？"**

Tag 可在 https://cd.i.strikingly.com/strikingly/component-kit/tags 查看。

---

### Bobcat 依赖更新 MR

#### B9. 切到最新 develop

```bash
cd $BOBKAT_PATH
git checkout develop && git pull origin develop
```

#### B10. 创建依赖更新分支

```bash
git checkout -b use-new-component-kit-v<production-version>
```

#### B11. 更新 component-kit 依赖为生产 tag

修改 3 个 package.json 中 component-kit 末尾的 tag 版本号：

| 文件 |
|------|
| `package.json` |
| `fe-apps/fujian-edu/package.json` |
| `fe-apps/support/package.json` |

```diff
- "component-kit": "...component-kit.git#<old-ref>",
+ "component-kit": "...component-kit.git#v<production-version>",
```

> **⚠️ 不要单独 commit package.json**：pre-commit 钩子（`precheck`）要求 yarn.lock 与 package.json 同步，单独提交会报 `Please run npm run update`。必须等 yarn 更新 yarn.lock 后（B12）一起提交（B14）。

#### B12. 用户手动执行 yarn

**此步骤由用户手动完成，agent 不执行 `yarn`**：

```bash
cd $BOBKAT_PATH && NODENV_VERSION=12.16.1 yarn
```

- `yarn install` 会从 `cd.i.strikingly.com` 用 HTTPS git 拉取 component-kit，可能偶发 `gnutls_handshake() failed` TLS 握手失败（网络抖动）。重试或转人工执行。
- bobcat 的 Node 版本由 `.node-version`（`12.16.1`）决定，yarn 为 classic 1.x，务必用 `NODENV_VERSION=12.16.1` 前缀。
- 用户 yarn 完成后（yarn.lock 已更新）通知 agent，再继续 B13/B14。

#### B13. 询问 Reviewer 并生成 MR 描述

使用 `references/mr-template.md` 模板生成 MR 描述：**严格保持模板结构不变**，将各 section 的占位提示替换为实际内容，勾选 checklist，表中 `Reviewer` 栏位填入 reviewer username。写入 `/tmp/bobcat-dep-mr-desc.md`。

#### B14. 提交

```bash
git add package.json fe-apps/fujian-edu/package.json fe-apps/support/package.json yarn.lock
git commit -m "feat(component-kit): update component kit version for v<production-version>"
```

#### B15. 推送并创建 MR

```bash
git push origin <branch-name>
```

```bash
cd $BOBKAT_PATH
glab mr create \
  --source-branch <branch-name> \
  --target-branch develop \
  --title "feat(component-kit): update component kit version for v<production-version>" \
  --reviewer <reviewer-username> \
  --description "$(cat /tmp/bobcat-dep-mr-desc.md)"
```

#### B16. 等待 Sign-off

> **"Phase 5b 完成。全部流程结束。"**

---

## 飞书文档追加（Phase 5b）

```markdown
## Phase 5b: 生产 tag + Bobcat MR

### Component-kit 生产 tag
- **构建分支**: publish-product-YYYYMMDD（本地，未推送）
- **生产 tag**: v<production-version>
- **状态**: 已发布

### Bobcat MR
- **分支**: use-new-component-kit-v<production-version> → develop
- **标题**: feat(component-kit): update component kit version for v<production-version>
- **Reviewer**: @<reviewer>
- **MR 链接**: <URL>

## Phase 5b TODO
- [x] 创建 component-kit 生产 tag。结果：v<version>
- [x] 更新 bobcat 依赖为生产 tag。结果：3 个 package.json
- [x] yarn 安装依赖
- [x] 提交推送。结果：<commit-id>
- [x] 创建 bobcat MR。结果：<URL>
```
