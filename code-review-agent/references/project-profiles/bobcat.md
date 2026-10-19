# Project Verification Profile: bobcat

**用途**：code-review-agent 各批 reviewer 的验证环境速查。随评审发现持续更新（新怪癖回写）。
上游约定见目标项目 `/home/penghe/bobcat/AGENTS.md`。

## Runtime

- Ruby 2.7.5 / Rails 4.2.11.1；Node 12.16.1（jest / miniprogram 链路）；本机默认 node 24.x，跑老 jest 需 `NODENV_VERSION=12.16.1` 前缀
- 本地依赖：PostgreSQL（`strikingly-bobcat-test` 已建）、Redis（6379）。单测无需 VPN

## 命令前缀（必带）

- rspec: `RBENV_VERSION=2.7.5 RAILS_ENV=test RUBYOPT='-W0' bundle exec rspec <spec>`
  - `RUBYOPT=-W0` 抑制 json 1.8 弃用告警刷屏；单文件启动 ~20s
  - 同一测试库不支持并发 rspec（逐个跑，避免数据争用假失败）
- jest: `NODENV_VERSION=12.16.1 ./node_modules/.bin/jest --config jest-config.json <path> --runInBand`
- 全量 test_unit / test_integration 在 CI 各约 46–63 分钟；本地不做全量

## 已知 flake / 基建问题（勿误判为本次变更引入）

- webpack 构建 OOM（miniprogram / site 配置，`Killed` / exit 137）——基建容量
- r-jaguar SSR e2e（`site.e2e.test.js` / `image.e2e.test.js`）偶发 5s 超时——脚本竞态
- Vero 事件经 SuckerPunch 异步线程发送，HTTP 可能泄漏进任意活跃 VCR cassette（追加记录新交互），与断言无关
- Rails cache 与 `$aws_redis` 跨 run 留存，影响「每次运行一致性」假设

## 目录 → 领域映射（判 guideline scope）

- 后端: `app/`、`lib/`、`config/`、`db/`、`spec/{controllers,models,services,...}`（`.rb`）
- 前端: `fe/`、`common/`、`miniprogram/`、`native/`、`user_native/`、`r-jaguar/`、`serverless/`（`.ts/.tsx/.js/.less/...`）
