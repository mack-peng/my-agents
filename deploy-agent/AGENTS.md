# deploy-agent — 构建/部署（ci-lite）

> 本目录为构建/部署入口。原 Dagger 容器栈在 Mac mini（16GB）上因内存限制停用，
> 构建部署统一由 ci-lite（`~/ci-lite`）执行，已覆盖全部四个项目——
> `door-adminpro` / `official-website` / `door-applets-bg` / `door-applets`（小程序上传 2026-09-17 迁入）。
> morph-cli 不再有任何在用能力，本文件只保留命令映射供追溯。

## 命令映射（morph-cli → ci-lite，实际操作请读 `~/ci-lite/AGENTS.md`）

| 旧（morph-cli） | 新（ci-lite） |
|---|---|
| `morph-cli build <project> <branch>` | `./scripts/build.sh <project> [branch]` |
| `morph-cli deploy <project> <buildId>` | `./scripts/deploy.sh <project> <BUILDID> preprod` |
| `morph-cli deploy door-applets <branch> <version>` | `./scripts/deploy.sh door-applets <BUILDID> preprod [uv]`（uv 缺省 `vYY.MM.DDTNN`，robot 2） |
| `morph-cli ps` / `status` / `clean` | `./scripts/ps.sh` / `status.sh` / `clean.sh` |

---

旧版 morph-cli 命令参考与 Troubleshooting（build / deploy / ps / status / clean、Dagger 模块问题等）已随 Dagger 栈退役一并删除；如需追溯见 git 历史。
