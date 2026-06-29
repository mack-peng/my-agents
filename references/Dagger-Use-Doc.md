# Dagger 使用文档

> 来源: https://docs.dagger.io/ | 版本: v0.21.4
> 整理日期: 2026-06-29

---

## 1. Overview
> 来源: https://docs.dagger.io/

Dagger 是一个自动化软件交付平台，可可靠地、大规模地构建、测试和交付任何代码库。Dagger 可在本地、CI 服务器或云端运行。

### Why Dagger?

- **Programmable（可编程）**：完整的执行引擎和系统 API；支持 8 种语言的 SDK；交互式 REPL；丰富的可复用模块生态
- **Local-first（本地优先）**：唯一依赖是容器运行时（如 Docker），可在笔记本、AI 沙箱、CI 服务器或云基础设施上运行
- **Repeatable（可重复）**：工具在容器中运行，由沙箱函数编排。操作默认增量执行，支持高级缓存控制
- **Observable（可观测）**：每个操作发出完整的 OpenTelemetry trace，可在终端 TUI 或 Web 视图中可视化

### Features

- **System API**：跨语言 API，编排容器、文件系统、secrets、git 仓库、网络隧道等
- **8 语言 SDK**：Go、Python、TypeScript、PHP、Java、.NET、Elixir、Rust
- **Toolchains**：预构建模块，无需编码即可使用（如 linter、formatter、test runner），`dagger toolchain install` 即可
- **Typed artifacts**：自定义对象类型，内容寻址，可跨语言/模块边界传递
- **Incremental execution**：每个操作按输入键值化，只重运行受影响的部分
- **Runs anywhere**：只需 Linux 容器运行时
- **Built-in tracing**：OpenTelemetry，CLI 含实时 TUI

### Get Started

- Installation
- Core Concepts（Toolchains、Checks、Functions）
- Toolchain 快速入门
- CI 快速入门

### Dagger 平台组成

| 组件 | 说明 |
|------|------|
| **Types** | 基本构建块（容器、目录、文件、LLM 等），持有数据和操作方法 |
| **Functions** | 计算单元，组合类型操作和自定义逻辑，用 SDK 编写，打包在 Modules 中 |
| **Modules** | 函数的打包和复用单元，加载后动态扩展 Dagger API |
| **CLI** | 主要入口，含实时 TUI，可交互式或非交互式使用 |
| **Engine & API** | 核心运行时，基于 GraphQL 的统一接口，含执行引擎、类型系统、数据层、模块系统 |
| **SDKs** | 提供 client generator（消费 API）和 server generator（扩展 API） |
| **Dagger Cloud** | 托管控制平面：Checks（托管 CI）、Traces（遥测）、Modules（集中管理） |


---

## 2. Use Cases
> 来源: https://docs.dagger.io/use-cases

Dagger 的主要应用场景：

### 2.1 Portable CI（可移植 CI）

解决"在我机器上能跑"问题。Dagger 通过在隔离容器中运行工作流每个部分来确保执行环境一致，无论在哪运行。

**收益：**
- 平台工程师可在本地定义和验证 CI 工作流，无需推送到远程 CI 测试
- 应用开发者可在笔记本上执行 CI，无需先推送代码等待反馈（"push and pray"终结者）
- 解耦特定 CI 系统，消除厂商锁定，轻松迁移 CI 提供商

### 2.2 Monorepo CI

处理包含多个独立项目的 monorepo，每个项目有不同测试、构建和部署要求。

**收益：**
- 将工作流封装为可复用模块，减少代码重复，确保一致性
- 准确建模项目间依赖，包括跨语言依赖
- 利用编程语言原生并发特性加速执行
- 分离业务逻辑，便于调试

### 2.3 Agentic CI（AI 代理 CI）

将 LLM 集成到 CI 工作流中，让 AI 代理自动处理代码审查、安全检查、测试诊断等任务。

**收益：**
- 加速开发周期，自动识别和修复 bug、安全漏洞、性能问题
- 开发者可专注于高价值任务（架构设计、新功能）
- 随 AI 生成代码量增加而弹性扩展

**Dagger 的 AI 能力：**
- 内置 `LLM` 类型，原生集成 LLM，支持 tool use（LLM 可自动发现和使用任何可用的 Dagger 函数）
- 内置 MCP 支持，可将 Dagger 模块暴露为 MCP 服务器
- Dagger Shell 支持自然语言交互
- 支持 OpenAI、Anthropic、Google 等模型，可通过云端 API 或本地（Docker Model Runner、Ollama）使用
- 端到端 tracing，所有 agent 状态变更实时可见

---

## 3. FAQ
> 来源: https://docs.dagger.io/faq

### 3.1 General

**Q: Dagger Platform 是什么？**
DevOps 操作系统——集成平台，包括 Dagger Engine、Dagger Cloud 和 Dagger SDKs。

**Q: 如何安装/更新/卸载？**
参见 [Installation](https://docs.dagger.io/getting-started/installation)。

**Q: Dagger 会发送遥测吗？**
默认发送匿名遥测到 dagger.io（版本、平台信息、命令、匿名设备 ID）。开源实现，可设置 `DO_NOT_TRACK=1` 禁用。

**Q: 可以配置 Dagger Engine 吗？**
可以。详见 [operator manual](https://github.com/dagger/dagger/blob/main/core/docs/d7yxc-operator_manual.md)。

**Q: 能用 Dagger 构建 Windows 容器吗？**
目前不能。Dagger 运行在 BuildKit 上，Windows 容器支持仍处于实验阶段。

**Q: 为什么 Dagger Engine 需要特权容器？**
因为 overlayfs 需要特权模式（rootless 方式有性能降级问题），且网络管理需要移动网络设备（slirp 方案比特权网络慢 5 倍以上）。安全方面的建议是像对待 Docker/Kubernetes 一样将宿主机作为安全边界。

**Q: 遇到问题如何求助？**
加入 [Discord](https://discord.com/invite/dagger-io) 的 help 频道。

### 3.2 Dagger Cloud

**Q: Dagger Cloud 是什么？**
Dagger Engine 的生产级控制平面，提供工作流可视化和运营洞察。

**Q: Dagger Cloud 是否托管 Dagger Engine？**
不是，Dagger Cloud 是"自带计算"服务。任何能运行 Dagger Engine 的机器都可以。

**Q: 支持哪些 CI 提供商？**
几乎所有：GitLab、CircleCI、GitHub Actions、Jenkins、Tekton 等。

**Q: 什么是工作流可视化？**
Traces——基于浏览器的界面，显示工作流每一步的执行信息、日志、耗时、是否缓存命中。

**Q: 什么是 orphaned Traces？**
CI 上下文中缺少或不完整的 Git 元数据的 Traces。通常在 CI 中没有正确设置 Git 上下文时出现。

**Q: CI 提供商不被支持怎么办？**
设置 `CI=true` 环境变量可以发送 Traces，但需确保 Git 上下文正确。

### 3.3 Dagger SDKs

**Q: 支持哪些语言 SDK？**
三种类型：Official（Go、TypeScript、Python）、Community（PHP）、Experimental（Java）。社区 SDK 升级需满足社区支持、版本兼容、文档维护、开放贡献等要求。

**Q: 如何在 SDK 中登录容器仓库？**
两种方式：`Container.withRegistryAuth()` API 方法，或直接使用宿主机的 `docker login` 凭据。

### 3.4 Dagger API

**Q: Dagger 用什么查询语言？**
GraphQL。

**Q: 需要懂 GraphQL 才能用 Dagger 吗？**
不需要。只需懂一种 SDK 语言，SDK 内部处理 GraphQL 转换。

**Q: 没有对应语言的 SDK 还能用吗？**
可以。可以从任何支持 GraphQL 的语言直接调用 Dagger GraphQL API，或使用 Dagger CLI。

---

## 4. Getting Started - Overview
> 来源: https://docs.dagger.io/getting-started

入门指南分为以下几个部分：

- **Installation**：安装、卸载和更新 Dagger
- **Learn key concepts**：理解 Dagger 的基本构建块——类型、函数、模块
- **Build a CI workflow**：通过 CI quickstart 创建第一个 CI 工作流
- **Validate commits with checks**：使用 checks 自动验证代码质量、安全性和标准
- **Build an AI agent**：通过 AI agent quickstart 构建在沙箱环境中运行的 AI 代理
- **Add an AI agent to your existing workflows**：将 AI 代理集成到现有 CI 工作流
- **Explore features**：探索 Dagger 全部特性

---

## 5. Installation
> 来源: https://docs.dagger.io/getting-started/installation

### 前置条件
需要容器运行时（Docker 或兼容系统，详见 [Container runtimes](https://docs.dagger.io/reference/container-runtimes/)）。

### Stable Release

**macOS:**
```bash
# Homebrew
brew install dagger/tap/dagger

# 或使用安装脚本
curl -fsSL https://dl.dagger.io/dagger/install.sh | BIN_DIR=/usr/local/bin sh
```
安装路径：macOS ARM `/opt/homebrew/bin/dagger`，Intel `/usr/local/bin/dagger`

**指定版本：**
```bash
curl -fsSL https://dl.dagger.io/dagger/install.sh | DAGGER_VERSION=0.21.4 BIN_DIR=/usr/local/bin sh
```

**查看版本：**
```bash
./bin/dagger version
# dagger v0.21.4 (registry.dagger.io/engine:v0.21.4) darwin/amd64
```

### Development Release（注意：未完成版本）
```bash
curl -fsSL https://dl.dagger.io/dagger/install.sh | DAGGER_COMMIT=head sh
```
运行 dev CLI 会默认停止并替换稳定版 Engine，建议隔离环境使用。

### 更新
使用安装时相同的方法即可。Homebrew 用户可用：
```bash
brew update && brew upgrade dagger
```

### 卸载
```bash
# 移除 CLI
sudo rm /usr/local/bin/dagger
# 或 brew uninstall dagger

# 移除 Dagger 容器
docker rm --force --volumes "$(docker ps --quiet --filter='name=^dagger-engine-')"

# 清理缓存和配置 (macOS)
rm -rf ~/Library/Caches/dagger
rm -rf ~/Library/Application\ Support/dagger
```

### 版本说明
- CLI 和 Engine 共享版本号，同步发布
- SDK 自动配置兼容版本的 Engine
- Engine 镜像位于 `registry.dagger.io/engine`，标签为版本号

---

## 6. Core Concepts
> 来源: https://docs.dagger.io/core-concepts

Dagger 围绕三个核心概念构建：

### 6.1 三大概念

| 概念 | 说明 | 适用人群 |
|------|------|----------|
| **Toolchains** | 安装预构建的工具和检查，无需编码 | 应用开发者（想要更好的 CI/测试但不想写基础设施代码） |
| **Checks** | 自动化验证代码质量、安全、标准的检查 | 确保代码质量的团队 |
| **Functions** | 创建自定义工作流的基本构建块 | 平台工程师和构建自定义自动化的开发者 |

### 6.2 Toolchains
安装即可获得 linting、testing、security scanning 等功能：
```bash
dagger toolchain install github.com/dagger/jest
dagger check
```

### 6.3 Checks
无需参数的验证函数，本地和 CI 行为一致：
```bash
dagger check              # 并发运行所有检查
dagger check lint         # 运行单个检查
dagger check security-*   # 运行匹配的检查
```

### 6.4 Functions
Dagger 的基本计算单元，接受输入、执行操作（通常在容器中）、返回输出。可组合构建复杂工作流。

**Go 示例：**
```go
func (m *MyModule) Build() *Container {
    return dag.Container().
        From("golang:1.21").
        WithDirectory("/src", m.Source).
        WithWorkdir("/src").
        WithExec([]string{"go", "build", "-o", "app"})
}
```

### 6.5 三者协作
- **Toolchains** 打包 Functions 和 Checks 以供复用
- **Checks** 是无必填参数的 Functions
- **Functions** 可以调用其他 Functions，包括来自 Toolchains 的

**完整工作流示例：**
```bash
dagger toolchain install github.com/example/node-toolchain
dagger call node build          # 使用 toolchain 函数
dagger check node:test         # 运行测试
dagger check                   # 运行所有验证检查
dagger develop --sdk=typescript # 添加自定义函数
```

---

## 7. Toolchains
> 来源: https://docs.dagger.io/core-concepts/toolchains

Toolchains 是提供即用函数和检查的 Dagger 模块，无需编写代码即可为项目添加强大的 CI/CD 能力。

### 7.1 什么是 Toolchain？

Toolchain 是为直接消费设计的 Dagger 模块。安装后直接通过 `dagger call` 或 `dagger check` 使用其函数。

**关键特征：**
- 提供即用函数（build、test、lint 等）
- 包含验证检查
- 自动与项目源代码协作
- 无需编写 Dagger 代码

### 7.2 安装 Toolchain

```bash
dagger toolchain install github.com/dagger/jest  # 从 GitHub 安装
dagger functions                                    # 查看可用函数
dagger call jest test                               # 调用函数
dagger check                                        # 运行所有检查
```

**安装来源：**
- GitHub 仓库：`github.com/user/repo/path`
- 本地路径：`./path/to/toolchain` 或 `/absolute/path`
- Git URL：任意有效 Git URL，可选版本标签

**自定义名称：**
```bash
dagger toolchain install github.com/example/toolchain --name mytool
dagger call mytool build
```

**安装多个：**
```bash
dagger toolchain install github.com/example/hello
dagger toolchain install github.com/example/builder
dagger toolchain install github.com/example/tester
dagger call hello message && dagger call builder build && dagger call tester test
```

### 7.3 常见用例

**工具专用 Toolchains（推荐）：**
每个 toolchain 专注单一工具，不搞"大杂烩"：
```bash
dagger toolchain install github.com/example/black   # 格式化
dagger toolchain install github.com/example/pylint  # Linting
dagger toolchain install github.com/example/pytest  # 测试
dagger check 'pytest:*'
dagger check  # 全部运行
```

**团队标准化：**
```bash
dagger toolchain install github.com/myorg/security-scanner
dagger toolchain install github.com/myorg/license-checker
dagger check  # 运行全局验证
```

### 7.4 自定义 Toolchain

**可选参数：**
```bash
dagger functions                    # 查看可用函数和参数
dagger call build --help
dagger call build --output-dir=./dist
dagger call test --pattern="integration/*"
dagger call publish --registry=ghcr.io --image-name=myapp
```

**在 dagger.json 中覆盖默认参数：**
```json
{
  "toolchains": [{
    "name": "greeter",
    "source": "github.com/example/greeter",
    "customizations": [{
      "function": ["greet"],
      "argument": "message",
      "default": "hola"
    }]
  }]
}
```

**覆盖 defaultPath：**
```json
{
  "toolchains": [{
    "name": "linter",
    "source": "github.com/example/linter",
    "customizations": [{ "argument": "source", "defaultPath": "/my-subdirectory" }]
  }]
}
```

**过滤 Checks（支持 glob 模式）：**
```json
{ "toolchains": [{ "name": "linter", "source": "...", "ignoreChecks": ["failing-check", "experimental-*"] }] }
```
查看当前启用的检查：`dagger check -l`

### 7.5 Toolchains 与 CI

本地和 CI 行为一致，相同命令两处通用：
```yaml
# .github/workflows/ci.yml
steps:
  - uses: actions/checkout@v4
  - uses: dagger/dagger-for-github@v6
  - run: dagger check
```

---

## 8. Checks
> 来源: https://docs.dagger.io/core-concepts/checks

Checks 是每次提交时运行的自动化验证，确保代码质量、安全性和标准合规。**Check 是一个无需必填参数即可验证代码的函数。**

### 8.1 运行 Checks

```bash
dagger check              # 并发运行所有检查
dagger check -l           # 列出可用检查
dagger check lint-*       # 使用模式匹配运行
dagger check security-scan
```

Checks 自动并行执行以最大化性能。任何检查失败都会返回非零退出状态：
```yaml
# GitHub Actions 示例
- name: Run checks
  run: dagger check
```

### 8.2 来自 Toolchains 的 Checks

最简单的方式是安装提供 Checks 的 toolchains，它们的检查会自动可用：
```bash
dagger toolchain install github.com/example/black
dagger toolchain install github.com/example/pytest
dagger toolchain install github.com/example/security-scanner
dagger check -l
# black:format
# pytest:test
# security-scanner:scan
# security-scanner:dependency-check
```

命名空间的形式运行：
```bash
dagger check pytest:*              # 运行 pytest 的所有检查
dagger check security-scanner:scan # 运行特定检查
```

### 8.3 过滤和忽略 Checks

**过滤：** 使用 glob 模式
```bash
dagger check lint-*      # 所有 lint 检查
dagger check security-*  # 安全相关检查
dagger check code-style  # 指定检查
```

**忽略：** 在 `dagger.json` 中配置
```json
{
  "toolchains": [{
    "name": "scanner",
    "source": "github.com/example/security-scanner",
    "ignoreChecks": ["dependency-scan", "container-*"]
  }]
}
```

### 8.4 创建 Checks

使用 `+check` 注解标记 Dagger Function。Check 不得有必填参数（可选参数可以），可返回 error 或 container。

**Go 示例：**
```go
// Runs linting checks on the code
// +check
func (m *MyModule) LintCode(ctx context.Context) error {
    _, err := dag.Container().
        From("golangci/golangci-lint:latest").
        WithExec([]string{"golangci-lint", "run"}).
        Sync(ctx)
    return err
}

// Runs security scan with optional severity filter
// +check
func (m *MyModule) SecurityScan(
    ctx context.Context,
    // +optional
    // +default="HIGH,CRITICAL"
    severity string,
) error {
    _, err := dag.Container().
        From("aquasec/trivy:latest").
        WithExec([]string{"trivy", "fs", "--severity", severity, "."}).
        Sync(ctx)
    return err
}
```

---

## 9. Functions
> 来源: https://docs.dagger.io/core-concepts/functions

Functions 是 Dagger 工作流的基本构建块。它们是接受输入、执行操作（通常在容器中）、返回输出的计算单元。

### 9.1 什么是 Functions？

Dagger Function 是你编写的代码，能够：
- 接受类型化输入（字符串、容器、目录等）
- 使用 Dagger API 执行操作
- 返回类型化输出

### 9.2 使用者角色

**Toolchain Consumers（消费者）：** 使用 toolchains 时无需编写函数，直接调用现成的即可：
```bash
dagger call go build    # 调用 toolchain 的 build 函数
dagger call go test     # 调用 toolchain 的 test 函数
```

**Toolchain Builders & Customizers（构建者）：** 创建或自定义 toolchain 时编写函数。

### 9.3 常见函数模式

**Build Functions：** 将源码转换为制品
```go
func (m *MyModule) Build() *Container {
    return dag.Container().
        From("node:20").
        WithDirectory("/app", m.Source).
        WithWorkdir("/app").
        WithExec([]string{"npm", "install"}).
        WithExec([]string{"npm", "run", "build"})
}
```

**Test Functions：** 执行测试并返回结果
```go
func (m *MyModule) Test(ctx context.Context) (string, error) {
    return dag.Container().
        From("python:3.11").
        WithDirectory("/app", m.Source).
        WithWorkdir("/app").
        WithExec([]string{"pytest", "--verbose"}).
        Stdout(ctx)
}
```

**Generate Functions：** 运行生成工具并返回 Changeset（应用于源码目录）
```go
func (m *MyModule) Generate() *Changeset {
    generated := dag.Container().
        From("golang:1.21").
        WithDirectory("/app", m.Source).
        WithWorkdir("/app").
        WithExec([]string{"go", "generate"}).
        Directory("/app")
    return generated.Changes(m.Source)
}
```

### 9.4 Functions 在 Toolchains 中

安装 toolchain 后可访问其所有函数：
```bash
dagger toolchain install github.com/dagger/jest
dagger functions              # 查看可用函数
dagger call jest test
dagger call jest list
dagger check jest:*
```

---

## 10. Quickstart - Basics
> 来源: https://docs.dagger.io/getting-started/quickstarts/basics

Dagger 是一个通用组合引擎，用于容器化工作流。本快速入门约需 10 分钟，需熟悉 Go/Python/TypeScript/PHP/Java 中任一语言。

### 10.1 前置条件
- 已安装 Dagger CLI
- 容器运行时（Docker、Podman、nerdctl、Apple Container 等）
- GitHub 账户（可选，配置 Dagger Cloud 时需要）

### 10.2 Dagger Shell

```bash
dagger  # 启动 Dagger Shell（交互式客户端）
```

**创建容器：**
```bash
container | from alpine
```

**交互式终端：**
```bash
container | from alpine | terminal
```

**执行命令：**
```bash
container | from alpine | with-exec uname | stdout
container | from alpine | with-exec apk add curl | with-exec curl https://dagger.io | stdout
```

**获取帮助：**
```bash
container | from alpine | .help
container | from alpine | .help with-directory
```

### 10.3 添加文件和目录

```bash
container | from alpine | with-directory /src https://github.com/dagger/dagger
container | from alpine | with-new-file /hi.txt "Hello from Dagger!"
```

### 10.4 函数链式调用

```bash
container | from alpine | with-new-file /hi.txt "Hello from Dagger!" |
  with-entrypoint cat /hi.txt | publish ttl.sh/hello
```

### 10.5 编写自定义 Functions

```go
// dagger init --sdk=go --name=basics
func (m *Basics) Publish(ctx context.Context) (string, error) {
    return dag.Container().
        From("alpine:latest").
        WithNewFile("/hi.txt", "Hello from Dagger!").
        WithEntrypoint([]string{"cat", "/hi.txt"}).
        Publish(ctx, "ttl.sh/hello")
}
```

### 10.6 链式调用（代码 vs Shell 等效）

**Go:**
```go
func (m *Basics) Base() *dagger.Container {
    return dag.Container().From("cgr.dev/chainguard/wolfi-base")
}
func (m *Basics) Build() *dagger.Container {
    return m.Base().WithExec([]string{"apk", "add", "bash", "git"})
}
func (m *Basics) BuildAndPublish(ctx context.Context) (string, error) {
    return m.Build().Publish(ctx, "ttl.sh/bar")
}
```

函数名约定：所有名称自动转换为 kebab-case 风格（`FooBar` → `foo-bar`）。

### 10.7 参数和返回值

```go
func (m *Basics) Build(
    // +default "alpine:latest"
    image string,
) *dagger.Container {
    return dag.Container().
        From(image).
        WithNewFile("/hi.txt", "Hello from Dagger!")
}

func (m *Basics) Publish(
    ctx context.Context,
    // +default "alpine:latest"
    image string,
) (string, error) {
    return m.Build(image).
        WithEntrypoint([]string{"cat", "/hi.txt"}).
        Publish(ctx, "ttl.sh/hello")
}
```

注意：Dagger Functions 完全沙箱化，宿主机资源必须显式传入。

### 10.8 安装其他模块

使用 [Daggerverse](https://daggerverse.dev) 搜索公共模块：
```go
func (m *Basics) Check(ctx context.Context) (string, error) {
    ctr := dag.Wolfi().Container()
    return dag.Trivy().ScanContainer(ctx, ctr)
}
```

跨语言协作：Python 函数可调用 Go 函数，Go 可调用 TypeScript 等。

### 10.9 缓存加速

Dagger 缓存两类数据：Layers（构建指令）和 Volumes（文件系统卷内容）。

```go
func (m *Basics) Env(ctx context.Context) *dagger.Container {
    aptCache := dag.CacheVolume("apt-cache")
    return dag.Container().
        From("debian:latest").
        WithMountedCache("/var/cache/apt/archives", aptCache).
        WithExec([]string{"apt-get", "update"}).
        WithExec([]string{"apt-get", "install", "--yes", "maven", "mariadb-server"})
}
```

第二次及之后运行速度大幅提升。

### 10.10 观测追踪

两个实时可观测工具：Dagger TUI（终端 UI）和 Dagger Cloud（浏览器界面）。Dagger Cloud 注册可选，单用户免费。

---

## 11. Quickstart - Use a Toolchain
> 来源: https://docs.dagger.io/getting-started/quickstarts/toolchain

约 5 分钟完成。Toolchains 是预构建的 Dagger 模块，无需编码即可提供 CI/CD 能力。

### 11.1 获取示例应用

```bash
gh repo create hello-dagger --template dagger/hello-dagger-template --public --clone
cd hello-dagger
```

### 11.2 配置 Dagger Cloud（可选）

```bash
dagger login
```
浏览器访问认证链接，确认 code 后即可。单用户免费。

### 11.3 安装 Toolchain

```bash
dagger init
dagger toolchain install github.com/kpenfound/blueprints/hello-dagger --name hello
```

### 11.4 查看可用函数

```bash
dagger functions
dagger call hello --help

# 输出示例:
# build       Build the application container
# build-env   Build a ready-to-use development environment
# publish     Publish the application container after building and testing
# test        Return the result of running unit tests
```

### 11.5 使用 Toolchain 函数

```bash
dagger call hello test
dagger call hello build
dagger call hello build-env
dagger call hello publish --address=ghcr.io/myorg/hello-dagger:latest
```

安装后 toolchain 函数立即可用，自动使用项目源码。无需编写代码。

---

## 12. Quickstart - Build a CI Workflow
> 来源: https://docs.dagger.io/getting-started/quickstarts/ci

约 10 分钟。将手工脚本和 YAML 替换为现代 API。

### 12.1 初始化模块

```bash
dagger init --sdk=go --name=hello-dagger
dagger functions  # 查看自动生成的函数
```

### 12.2 构建 CI 工作流（Go 示例）

```go
func (m *HelloDagger) Publish(ctx context.Context, source *dagger.Directory) (string, error) {
    _, err := m.Test(ctx, source)
    if err != nil { return "", err }
    return m.Build(source).Publish(ctx, fmt.Sprintf("ttl.sh/hello-dagger-%.0f", math.Floor(rand.Float64()*10000000)))
}

func (m *HelloDagger) Build(source *dagger.Directory) *dagger.Container {
    build := m.BuildEnv(source).WithExec([]string{"npm", "run", "build"}).Directory("./dist")
    return dag.Container().From("nginx:1.25-alpine").
        WithDirectory("/usr/share/nginx/html", build).WithExposedPort(80)
}

func (m *HelloDagger) Test(ctx context.Context, source *dagger.Directory) (string, error) {
    return m.BuildEnv(source).WithExec([]string{"npm", "run", "test:unit", "run"}).Stdout(ctx)
}

func (m *HelloDagger) BuildEnv(source *dagger.Directory) *dagger.Container {
    nodeCache := dag.CacheVolume("node")
    return dag.Container().From("node:21-slim").
        WithDirectory("/src", source).WithMountedCache("/root/.npm", nodeCache).
        WithWorkdir("/src").WithExec([]string{"npm", "install"})
}
```

功能说明：`publish` 测试-构建-发布；`test` 单元测试；`build` 多阶段构建 nginx 镜像；`build-env` 构建环境。

### 12.3 运行工作流

```bash
dagger               # 启动 Dagger Shell
publish              # 运行发布（测试+构建+发布到 ttl.sh）
```

### 12.4 交互式调试

```bash
build-env | terminal --cmd=bash   # 进入构建环境的交互终端
```

### 12.5 以本地服务运行容器

```bash
build | as-service | up --ports=8080:80
```
访问 `http://localhost:8080`，NGINX 服务 "Hello from Dagger!"。

### 12.6 添加 Checks 验证

```go
// +check
func (m *HelloDagger) ValidateBuild(ctx context.Context,
    // +optional
    // +defaultPath="/"
    // +ignore=[".git", "node_modules"]
    source *dagger.Directory,
) error {
    _, err := m.Build(source).Sync(ctx)
    return err
}
```

```bash
dagger check     # 并行运行所有检查
dagger check -l  # 列出可用检查
```

---

## 13. Quickstart - Build an AI Agent
> 来源: https://docs.dagger.io/getting-started/quickstarts/agent

约 10 分钟。创建可使用 LLM 的编程代理，解决编程任务。

### 13.1 配置 LLM

使用环境变量或 `.env` 文件：`OPENAI_API_KEY`、`ANTHROPIC_API_KEY`、`GEMINI_API_KEY`

### 13.2 初始化模块

```bash
dagger init --sdk=go --name=coding-agent
```

### 13.3 创建 AI Agent（Go 示例）

```go
func (m *CodingAgent) GoProgram(assignment string) *dagger.Container {
    environment := dag.Env().
        WithStringInput("assignment", assignment, "the assignment to complete").
        WithContainerInput("builder",
            dag.Container().From("golang").WithWorkdir("/app"),
            "a container to use for building Go code").
        WithContainerOutput("completed", "the completed assignment in the Golang container")

    work := dag.LLM().
        WithEnv(environment).
        WithPrompt(`
You are an expert Go programmer with an assignment to create a Go program
Create files in the default directory in $builder
Always build the code to make sure it is valid
Do not stop until your assignment is completed and the code builds
Your assignment is: $assignment
`)
    return work.Env().Output("completed").AsContainer()
}
```

**关键概念：**
- `Env` 定义代理的输入输出环境，每个都有声明式描述
- `builder` Container 输入提供工作空间
- `completed` 输出表示完成的任务
- LLM 决定何时完成，完成后返回 `Container`

### 13.4 运行 Agent

```bash
dagger                                    # 启动 Dagger Shell
.help go-program                          # 查看帮助
llm | model                               # 验证 LLM 配置
go-program "write a curl clone"           # 分配任务
go-program "write a curl clone" | terminal # 进入结果容器检查
```

提示（Prompt）需要实验调整。如遇到 "binding value is nil" 说明 LLM 没有返回值，需调整提示。

---

## 14. Quickstart - Add an AI Agent to an Existing Project
> 来源: https://docs.dagger.io/getting-started/quickstarts/agent-in-project

约 10 分钟。为已有 Daggerized 项目添加 AI 代理，实现代码修改自动化。

### 14.1 创建 Workspace 子模块

```bash
dagger init --sdk=go .dagger/workspace
```

提供 `read-file`、`write-file`、`list-files`、`test` 四个函数，限制代理工具范围以减少错误。

```bash
dagger -m .dagger/workspace functions  # 验证函数
dagger install ./.dagger/workspace     # 安装为依赖
```

### 14.2 创建 Agentic 函数（`develop`）

```go
func (m *HelloDagger) Develop(ctx context.Context, assignment string,
    source *dagger.Directory) (*dagger.Directory, error) {
    environment := dag.Env().
        WithStringInput("assignment", assignment, "the assignment to complete").
        WithWorkspaceInput("workspace", dag.Workspace(source), "the workspace...").
        WithWorkspaceOutput("completed", "the workspace with the completed assignment")

    promptFile := dag.CurrentModule().Source().File("develop_prompt.md")
    work := dag.LLM().WithEnv(environment).WithPromptFile(promptFile)
    completed := work.Env().Output("completed").AsWorkspace()
    completedDirectory := completed.Source().WithoutDirectory("node_modules")

    _, err := m.Test(ctx, completedDirectory)  // 验证测试通过
    if err != nil { return nil, err }
    return completedDirectory, nil
}
```

**提示文件 `develop_prompt.md`：**
```
You are a developer on the HelloDagger Vue.js project.
Your assignment is: $assignment
- Before writing code, analyze the Workspace
- Do not make unnecessary changes
- Always run tests to validate your code changes
- Do not stop until tests pass
```

### 14.3 运行代理

```bash
dagger
.help develop
llm | model                             # 验证配置
develop "make the main page blue"

# 保存结果
completed=$(develop "make the main page blue")
build-env --source $completed | terminal  # 进入构建环境
build --source $completed | as-service | up --ports 8080:80  # 运行
$completed | export .                     # 导出到文件系统
```

### 14.4 部署到 GitHub Actions

**安装 GitHub Issue 模块：**
```bash
dagger install github.com/kpenfound/dag/github-issue@b316e472d3de5bb0e54fe3991be68dc85e33ef38
```

**`develop-issue` 函数：** 读取 GitHub Issue → 调用 develop → 创建 PR

**GitHub Actions 工作流 `develop.yml`：**
```yaml
on:
  issues:
    types: [labeled]
jobs:
  develop:
    if: github.event.label.name == 'develop'
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: dagger/dagger-for-github@v8.3.0
      - name: Develop
        run: |
          dagger call develop-issue \
            --github-token env://GH_TOKEN \
            --issue-id ${{ github.event.issue.number }} \
            --repository https://github.com/${{ github.repository }}
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

在 GitHub Issue 添加 "develop" 标签即可自动触发。

---

## 15. Types - Overview
> 来源: https://docs.dagger.io/getting-started/types/

Dagger API 提供超出基本类型的强大类型，可作为函数参数和返回值。

### 15.1 可用类型一览

| 类型 | 说明 |
|------|------|
| **Container** | OCI 兼容容器，包含实际状态（非仅镜像引用） |
| **Directory** | 目录（本地路径或 Git 引用） |
| **File** | 文件 |
| **Secret** | 机密凭据（密码、API key 等） |
| **Service** | 内容寻址的 TCP 服务 |
| **LLM** | 大语言模型 |
| **Env** | 环境变量和 LLM 使用的输入输出 |
| **CacheVolume** | 跨运行持久化的缓存目录 |
| **GitRepository** | Git 仓库 |
| **Other** | CurrentModule, Engine, EnvVariable, GitRef, Host, Module, Port, Socket, Terminal |

### 15.2 Container 常用操作

| 操作 | 说明 |
|------|------|
| `from` | 从基础镜像初始化 |
| `asService` | 转为 Service |
| `publish` | 发布镜像到仓库 |
| `stdout` / `stderr` | 获取最后执行命令的输出/错误流 |
| `withDirectory` | 复制目录到指定路径 |
| `withMountedDirectory` | 挂载目录到指定路径 |
| `withEntrypoint` | 设置入口命令 |
| `withExec` | 执行命令 |
| `withFile` / `withMountedFile` | 复制/挂载文件 |
| `withMountedCache` | 挂载缓存卷 |
| `withRegistryAuth` | 配置仓库认证 |
| `withWorkdir` | 设置工作目录 |
| `withServiceBinding` | 绑定运行时依赖的其他 Service |
| `terminal` | 打开交互终端 |

### 15.3 Directory 常用操作

| 操作 | 说明 |
|------|------|
| `dockerBuild` | 从目录构建 Docker 容器 |
| `entries` | 返回目录中的文件和子目录列表 |
| `export` | 导出到宿主机路径 |
| `file` | 返回指定路径的文件 |
| `withFile` / `withFiles` | 添加文件 |

### 15.4 Env 常用操作

| 操作 | 说明 |
|------|------|
| `withContainerInput` / `Output` | 创建/更新 Container 类型输入输出 |
| `withDirectoryInput` / `Output` | 创建/更新 Directory 类型输入输出 |
| `withFileInput` / `Output` | 创建/更新 File 类型输入输出 |
| `with[Object]Input` / `Output` | 创建/更新自定义对象类型输入输出 |

### 15.5 其他类型操作

**Secret:** `name`、`plaintext`（获取明文值）
**Service:** `endpoint`、`hostname`、`ports`、`up`（转发流量隧道）
**File:** `contents`（读取内容）、`export`（写入宿主机）
**GitRepository:** `branch`、`commit`、`head`、`ref`、`tag`、`tags`、`branches`

---

## 16. Types - Container
> 来源: https://docs.dagger.io/getting-started/types/container/

Container 代表 OCI 兼容容器的实际状态（不仅仅是镜像引用），由 Dagger Engine 管理。

### Default Address

支持为 Container 参数设置默认镜像地址：
```go
func (m *MyModule) Version(
    // +defaultAddress="alpine:latest"
    ctr *dagger.Container,
) (string, error) {
    return ctr.WithExec([]string{"cat", "/etc/alpine-release"}).Stdout(ctx)
}
```

### 关键示例

**从 Dockerfile 构建：**
```go
func (m *MyModule) Build(ctx context.Context, src *dagger.Directory) (string, error) {
    return src.DockerBuild().Publish(ctx, "ttl.sh/hello-dagger")
}
```

**交互式终端调试：**
```go
func (m *MyModule) Container() *dagger.Container {
    return dag.Container().From("alpine:latest").Terminal().
        WithExec([]string{"sh", "-c", "echo hello > /foo && cat /foo"}).Terminal()
}
```

**检查目录和文件：**
```go
func (m *MyModule) SimpleDirectory(ctx context.Context) (string, error) {
    return dag.Git("https://github.com/dagger/dagger.git").Head().Tree().
        Terminal().File("README.md").Contents(ctx)
}
```

**添加 OCI 注解：** 使用 `WithAnnotation("key", "value")`
**添加 OCI 标签：** 使用 `WithLabel("key", "value")`

---

## 17-24. Types Reference（各类型详细说明）

### 17. Directory
> 来源: https://docs.dagger.io/getting-started/types/directory/

- 代表目录状态（本地路径或 Git 引用）
- `defaultPath` 注解可设置默认路径
- 支持过滤器（include/exclude 模式）
- 支持 `terminal()` 调试（交互终端检查目录内容）

### 18. File
> 来源: https://docs.dagger.io/getting-started/types/file/

- 代表单个文件
- 主要操作：`contents()`（读取）、`export()`（写入宿主机）

### 19. Secret
> 来源: https://docs.dagger.io/getting-started/types/secret/

- 代表机密信息（密码、API key、SSH key 等）
- 支持 `name()` 和 `plaintext()`（获取明文值）
- 绝不暴露在明文日志、容器文件系统或缓存中

### 20. Service
> 来源: https://docs.dagger.io/getting-started/types/service/

- 内容寻址的 TCP 服务
- 主要操作：`endpoint()`、`hostname()`、`ports()`、`up()`（创建端口转发）

### 21. LLM
> 来源: https://docs.dagger.io/getting-started/types/llm/

- 大语言模型类型
- 主要操作：`withPrompt()`、`withEnv()`、`withPromptFile()`
- 支持 OpenAI、Anthropic、Google 等 provider，支持本地模型

### 22. Env
> 来源: https://docs.dagger.io/getting-started/types/env/

- LLM 使用的环境，定义输入输出
- 输入类型：String/Directory/Container/File/自定义对象
- 输出类型：同上
- 生成式声明提示词（declarative prompting）

### 23. CacheVolume
> 来源: https://docs.dagger.io/getting-started/types/cachevolume/

- 跨运行持久化的缓存目录
- `CacheVolume("name")` 创建命名缓存
- 通过容器的 `withMountedCache()` 挂载使用

### 24. GitRepository
> 来源: https://docs.dagger.io/getting-started/types/git/

- 代表 Git 仓库
- 主要操作：`branch()`、`commit()`、`tag()`、`head().tree()`
- 支持私有仓库认证（`withAuthToken`）

---

## 25. Using Dagger - Key Concepts
> 来源: https://docs.dagger.io/getting-started/concepts/

Dagger API 是组合 Dagger 工作流的统一接口，提供函数和类型来创建和管理应用交付工作流。

**核心思想：** 通过链式调用多个函数组合成工作流：
```bash
# Dagger Shell
container | from alpine | file /etc/os-release | contents

# CLI
dagger core container from --address=alpine file --path=/etc/os-release contents
```

- **Functions**: 组合调用，形成工作流
- **Types**: 支持基本类型 + 强大类型（Container, Directory, File, Service, Secret 等）

## 26. Using Dagger - API (CLI)
> 来源: https://docs.dagger.io/getting-started/api/cli

`dagger` CLI 是 Dagger 的核心入口。常用子命令：

| 命令 | 说明 |
|------|------|
| `dagger call <function>` | 调用 Dagger Function |
| `dagger check [pattern]` | 运行代码验证检查 |
| `dagger functions` | 列出当前模块的所有函数 |
| `dagger develop` | 进入开发模式（热重载） |
| `dagger init` | 初始化新模块 |
| `dagger install <source>` | 安装依赖模块 |
| `dagger toolchain install <source>` | 安装 toolchain |
| `dagger query` | 发送原始 GraphQL 查询 |
| `dagger login` / `dagger logout` | Dagger Cloud 认证 |
| `dagger version` | 查看版本信息 |

支持 `--sdk`、`--name`、`-m <module>`、`--progress` 等全局选项。

## 27. Using Dagger - API (SDK)
> 来源: https://docs.dagger.io/getting-started/api/sdk

Dagger SDK 提供两层能力：
- **Client generator**: 消费 Dagger API —— 用原生代码（Go/Python/TS 等）调用 Dagger 操作，SDK 自动生成类型安全的绑定
- **Server generator**: 扩展 Dagger API —— 编写的 Dagger Functions 自动注册到 API schema，外部可发现和调用

SDK 支持 5 种语言：Go、Python、TypeScript、PHP、Java（另有 Community/Experimental SDK）。

## 28. Using Dagger - API (HTTP / GraphQL)
> 来源: https://docs.dagger.io/getting-started/api/http

Dagger Engine 暴露 GraphQL API 端点。可以通过 HTTP POST 直接发送 GraphQL 查询：

```bash
dagger query <<EOF
{ container { from(address: "alpine") { file(path: "/etc/os-release") { contents } } } }
EOF
```

- 底层协议：GraphQL over HTTP
- 通过 SDK 调用时无需了解 GraphQL（SDK 内部处理转换）
- 高级用户可直接使用 `dagger query` 或 GraphQL 客户端

---

## 29. Features - Programmable Workflows
> 来源: https://docs.dagger.io/features/programmability

用代码而非 YAML 编写流水线。Dagger 提供：
- 完整执行引擎和系统 API
- 8 种语言的 SDK
- 交互式 Dagger Shell
- 可复用模块生态

## 30. Features - Built-In Caching
> 来源: https://docs.dagger.io/features/caching

Dagger 自动缓存两类数据：

**Layers（层缓存）：** 每个 `withExec`、`withFile` 等操作按输入内容寻址。只修改一个文件时，只有受影响的操作重新运行。`withEnvVariable` 会破坏层缓存，`withVolatileVariable` 不会。

**Volumes（卷缓存）：** 命名缓存卷跨运行持久化，适用于包管理器（npm、pip、apt 等）的依赖目录。通过 `CacheVolume("name")` + `withMountedCache()` 使用。

缓存配置（函数级别）：
- `+cache="default"`（默认 7 天 TTL）
- `+cache="volatile"`（仅当前 Engine 生命周期）
- `+cache="never"`（每次重新执行）
- `+cache="ttl=1h"`（自定义 TTL）

缓存在本地和 CI 之间自动工作，无需额外配置。

---

## 31. Features - Sandboxed Runtime
> 来源: https://docs.dagger.io/features/sandbox

Dagger Functions 完全沙箱化，默认无法直接访问宿主机系统。必须显式传入宿主资源（目录、文件、环境变量、网络服务等）才能访问。这提高了安全性、确保可重复性，并辅助缓存。

## 32. Features - Observability
> 来源: https://docs.dagger.io/features/observability

**交互式调试：** 工作流失败时可即时进入交互式 shell，保留故障点的完整上下文。在工作流中插入 `terminal()` 作为断点，类似调试器体验但无需预先配置。支持单个函数中多个断点，依次打开。

**两个可观测工具：**
- **Dagger TUI（终端 UI）：** 实时终端可视化，显示每个操作的状态、耗时、日志，支持在运行中查看细节
- **Dagger Cloud（浏览器）：** Traces 追踪平台。从所有组织的 Dagger Engine 收集遥测，以单一 Web 界面展示。可视化每一步骤、下钻详细日志、查看耗时、检查缓存命中状态

所有操作发出 OpenTelemetry trace，可导出到 Jaeger、Honeycomb 或任何 OTel 兼容后端。`dagger login` 注册 Dagger Cloud（单用户免费），之后每个工作流自动附带 Trace URL。

## 33. Features - Reusability
> 来源: https://docs.dagger.io/features/reusability

将常见任务和工作流封装为可复用、可共享的 Dagger Modules。设计灵感来自 Go modules：
- Dagger Modules 是 Dagger Functions 的集合
- `dagger install` 安装模块
- 支持 GitHub、本地路径、Git URL 作为来源
- Daggerverse（daggerverse.dev）索引所有公开模块

## 34. Features - Ephemeral Services
> 来源: https://docs.dagger.io/features/services

Dagger Functions 支持服务容器，可启动额外的容器化服务并从工作流中通信。

**常见场景：**
- 在依赖服务（数据库、缓存等）的上下文中运行测试
- 启动临时环境进行集成测试
- 通过 `asService()` 将容器转为服务
- 使用 `withServiceBinding()` 绑定运行时依赖

## 35. Features - Secrets Integration
> 来源: https://docs.dagger.io/features/secrets

原生支持从多个 secret provider 读取机密信息（密码、API key、SSH key、token）：宿主机环境变量、宿主机文件系统、宿主机命令执行结果、外部 secret manager。

**内置保护：** secrets 绝不会出现在明文日志、容器文件系统或缓存中。

## 36. Features - Local Defaults (.env)
> 来源: https://docs.dagger.io/features/local-defaults

支持在本地 `.env` 文件中持久化默认参数，避免每次输入相同 CLI 参数。将 `.env` 文件放在 `dagger.json` 旁边，变量名直接映射到参数名。

## 37. Features - Interactive Shell
> 来源: https://docs.dagger.io/features/shell

Dagger CLI 包含交互式 Shell（`dagger`），将熟悉的 Bash 语法翻译为 Dagger API 请求。构建、测试、临时环境、部署、任何终端自动化任务的最快捷方式。

## 38. Features - LLM Integration
> 来源: https://docs.dagger.io/features/llm

Dagger 可用作 AI 代理的运行时和编程环境。提供 `LLM` 类型原生集成大语言模型。
- **Tool use**: LLM 可自动发现和使用任何可用的 Dagger Functions
- **MCP 支持**: 将 Dagger 模块暴露为 MCP 服务器
- 支持 OpenAI、Anthropic、Google 等模型
- 支持 Docker Model Runner、Ollama 等本地模型

---

## 39. Building with Dagger - Overview
> 来源: https://docs.dagger.io/extending/

Dagger API 本身即可扩展和共享。两种方式使用 Dagger：
- **Dagger Shell**（交互式）：`dagger` 启动，使用 Bash 风格语法
- **Custom Functions**（代码）：用 SDK 编写函数，打包为 Modules

两种方式都能访问 Dagger 的容器操作、secret 管理等特性。

## 40. Building with Dagger - Module Structure
> 来源: https://docs.dagger.io/extending/modules

Dagger 模块结构：
- `dagger.json`：模块元数据（名称、SDK、依赖、toolchains）
- `.dagger/`：模块源码（`main.go`、`main.py`、`src/index.ts` 等）
- `dagger init --sdk=<lang>` 初始化新模块
- `dagger install <source>` 安装依赖模块
- `dagger develop` 进入开发模式，实时重载

---

## 41. Building with Dagger - Functions
> 来源: https://docs.dagger.io/extending/functions

Dagger Functions 是用 SDK 编写的类型安全计算单元，在隔离容器中执行。通过以下方式创建：
```bash
dagger init --sdk=<go|python|typescript|php|java>
```
修改 `.dagger/main.*` 文件添加函数，`dagger functions` 查看所有函数。

## 42. Building with Dagger - Chaining
> 来源: https://docs.dagger.io/extending/chaining

函数链式调用（Chaining）是 Dagger 最强大的特性之一，通过管道操作符（Shell）或方法调用（代码）组合函数：

```bash
# Shell
container | from alpine | with-exec apk add curl | with-exec curl https://dagger.io | stdout
```
```go
// Code
return dag.Container().From("alpine").WithExec([]string{"apk", "add", "curl"}).Stdout(ctx)
```

## 43. Building with Dagger - Arguments
> 来源: https://docs.dagger.io/extending/arguments

Dagger Functions 支持类型化参数，可设置默认值、文档说明、验证规则：
```go
func (m *MyModule) Build(
    // +default "alpine:latest"
    // +doc "Base container image"
    image string,
    // +defaultPath="/"
    source *dagger.Directory,
) *dagger.Container { ... }
```

## 44. Building with Dagger - Return Types
> 来源: https://docs.dagger.io/extending/return-types

支持返回基本类型（string, int, bool, array）和 Dagger 类型（Container, Directory, File, Secret, Service 等）。函数返回类型决定链式调用的下一个可用操作集。

## 45. Building with Dagger - Modules
> 来源: https://docs.dagger.io/extending/modules

Dagger Module 是 Dagger Functions 的打包单元。结构：
- `dagger.json`（元数据） + `.dagger/`（源码）
- `dagger install <source>` 从 GitHub/本地/Git URL 安装
- `dagger develop` 进入开发模式（热重载）

## 46-50. Building with Dagger - Advanced Topics
> 来源: https://docs.dagger.io/extending/

### 46. Secrets in Modules
> 来源: https://docs.dagger.io/extending/secrets

通过 `dagger.Secret` 类型安全处理机密信息，支持从环境变量、文件、命令输出获取

### 47. Services in Modules
> 来源: https://docs.dagger.io/extending/services

通过 `asService()` 和 `withServiceBinding()` 管理服务容器依赖

### 48. Cache Volumes
> 来源: https://docs.dagger.io/extending/cache-volumes

`CacheVolume("name")` + `withMountedCache()` 跨运行持久化缓存（npm, pip 等包管理器）

### 49. LLM in Modules
> 来源: https://docs.dagger.io/extending/llm

`dag.LLM().WithEnv(env).WithPrompt(...)` 在模块中使用 AI 能力

### 50. Module Documentation
> 来源: https://docs.dagger.io/extending/documentation

使用 `+doc` 注解为函数和参数添加文档，自动生成帮助文本

---

## 51. Building with Dagger - Remote Repositories
> 来源: https://docs.dagger.io/extending/remote-repositories

Dagger 支持 HTTP 和 SSH 协议访问远程仓库中的目录、文件和模块，兼容 GitHub、GitLab、BitBucket、Azure DevOps 等所有主流 Git 平台。

**引用格式：**

| 协议 | 格式 | 认证 |
|------|------|------|
| HTTP(S) | `https://github.com/user/repo.git[#version[:subpath]]` | Git credential manager |
| SSH Explicit | `ssh://git@github.com/user/repo.git[#version[:subpath]]` | SSH key |
| SSH SCP-like | `git@github.com:user/repo.git[#version[:subpath]]` | SSH key |

**关键特性：**
- `#version` 可选：tag、branch、commit hash
- `:subpath` 可选：仓库内子目录（monorepo 场景）
- 支持通过 `WithAuthToken` / `WithAuthPassword` 进行私有仓库认证

## 52. Building with Dagger - Module Dependencies
> 来源: https://docs.dagger.io/extending/module-dependencies

模块引用格式：`[proto://]host/repo[/subpath][@version]`

**示例：** `github.com/shykes/daggerverse/hello@v0.3.0`
- `github.com` = host
- `shykes/daggerverse` = repo
- `hello` = subpath
- `v0.3.0` = version

```bash
dagger install github.com/user/repo           # 最新默认分支
dagger install github.com/user/repo@v1.2.3   # 指定版本
dagger install ./local/path                    # 本地路径
```

私有模块认证支持通过 SSH agent、OAuth token 或 Git credential helper 配置。

## 53. Building with Dagger - Third-Party Packages
> 来源: https://docs.dagger.io/extending/packages

Dagger Functions 是普通代码，可以使用语言生态的任何第三方包。

**Go：** `go get github.com/spf13/cobra`；私有仓库配置 `goprivate` 在 dagger.json 中
**Python：** `uv add <package>` 或 `pip install`
**TypeScript：** `npm install` / `yarn add`
**PHP：** `composer require`
**Java：** Maven/Gradle 依赖管理

## 54. Building with Dagger - Constructors
> 来源: https://docs.dagger.io/extending/constructors

每个 Dagger 模块都有构造函数。默认为无参自动生成，可自定义。

**自定义构造函数（Go）：**
```go
func New(
    // +default="Hello"
    greeting string,
    // +default="World"
    name string,
) *MyModule {
    return &MyModule{Greeting: greeting, Name: name}
}
```

- 构造函数参数在 CLI 中直接作为 flag 使用
- 模块只有一个构造函数
- 字段需声明为 public（Go/TS），否则序列化时会丢失

## 55. Building with Dagger - Error Handling
> 来源: https://docs.dagger.io/extending/error-handling

与编程语言原生的错误处理方式一致：
```go
func (*MyModule) Divide(a, b int) (int, error) {
    if b == 0 { return 0, fmt.Errorf("cannot divide by zero") }
    return a / b, nil
}
```

## 56. Building with Dagger - Enumerations
> 来源: https://docs.dagger.io/extending/enumerations

支持自定义枚举类型，限制字符串参数的可选值（Go、Python、TypeScript）：
```go
type Severity string
const (
    Undetermined Severity = "UNDETERMINED"
    Low          Severity = "LOW"
    Medium       Severity = "MEDIUM"
    High         Severity = "HIGH"
    Critical     Severity = "CRITICAL"
)

func (m *MyModule) Scan(ctx context.Context, severity Severity) (string, error) { ... }
```
- 枚举值严格校验（不传 null/true/false）
- 名称：字母、数字、下划线；不能以数字开头
- 值大小写敏感，约定大写

## 57. Building with Dagger - Custom Types
> 来源: https://docs.dagger.io/extending/custom-types

模块可定义多个对象类型，通过链式调用从主对象函数访问：

```go
type MyModule struct{}
func (m *MyModule) DaggerOrganization() *Organization {
    return &Organization{
        URL: "https://github.com/dagger",
        Members: []*Account{{"jane", "jane@example.com"}, {"john", "john@example.com"}},
    }
}

type Organization struct {
    URL     string
    Members []*Account
}
type Account struct { Username, Email string }
func (a *Account) URL() string { return "https://github.com/" + a.Username }
```

## 58. Building with Dagger - Interfaces
> 来源: https://docs.dagger.io/extending/interfaces

Dagger 接口允许函数接受/返回任何暴露特定函数集合的对象，无需耦合到具体类型或 SDK 语言。

**Go 声明（嵌入 `DaggerObject`）：**
```go
type Greeter interface {
    dagger.DaggerObject
    Greet(name string) string
}

func (m *MyModule) UseGreeter(g Greeter) string {
    return g.Greet("World")
}
```
- 使用**结构类型检查**：任何具有兼容函数的对象都满足接口
- 跨语言兼容：Go 接口可被 Python/TS 对象满足
- 支持接口继承

## 59. Building with Dagger - State and Getters
> 来源: https://docs.dagger.io/extending/state

对象状态可直接暴露为 Dagger Function，无需显式创建 getter：
```go
type MyModule struct {
    Greeting string  // 公开字段：自动暴露
    // +private
    Name string      // 私有字段：不暴露
}

func (m *MyModule) Message() string {
    return fmt.Sprintf("%s, %s!", m.Greeting, m.Name)
}
```

## 60. Building with Dagger - Function Caching
> 来源: https://docs.dagger.io/extending/function-caching

每个函数默认缓存 7 天（最大 TTL）。相同输入 = 相同缓存值，不重新执行。

**缓存配置模式：**
- `+cache="default"`：默认 TTL（7 天）
- `+cache="volatile"`：仅当前引擎生命周期内缓存
- `+cache="never"`：禁用缓存（每次重新执行）
- `+cache="ttl=<duration>"`：自定义 TTL（如 `"ttl=1h"`）

**缓存失效策略：** 使用 `withEnvVariable`、`withVolatileVariable` 或修改输入参数来破坏缓存。

## 61. Building with Dagger - GraphQL Playground
> 来源: https://docs.dagger.io/extending/api-playground

原来的浏览器内 API Playground 已停用。推荐使用 `dagger query` 子命令从 CLI 发送原始 GraphQL 查询。

**本地启动 GraphQL API：**
1. 安装 Dagger CLI + 容器运行时
2. 在模块根目录设置 `DAGGER_SESSION_TOKEN=test`
3. 运行 `dagger query` 或启动 GraphQL 服务器（CORS on `127.0.0.1:8080/query`）
4. 使用 Altair 等 GraphQL 客户端连接探索

## 62-65. Building with Dagger - Custom Applications（SDK 独立应用）

不使用模块系统，直接在独立应用中使用 Dagger SDK：

### 62. Go Custom App
> 来源: https://docs.dagger.io/extending/custom-applications/go

- 需要 Go 1.22+
- `go get dagger.io/dagger@latest`
- 示例：为多架构和 Go 版本构建

### 63. Python Custom App
> 来源: https://docs.dagger.io/extending/custom-applications/python

- 需要 Python 3.10+
- `uv add dagger-io` 或 `uv add --script myscript.py dagger-io`
- 示例：针对多 Python 版本测试

### 64. TypeScript Custom App
> 来源: https://docs.dagger.io/extending/custom-applications/typescript

- 需要 TypeScript 5.0+
- `npm install @dagger.io/dagger --save-dev`
- 示例：针对多 Node.js 版本测试

### 65. PHP Custom App
> 来源: https://docs.dagger.io/extending/custom-applications/php

- 需要 PHP 8.2+
- `composer require dagger/dagger`
- 示例：针对多 PHP 版本测试

---

## 66. Cookbook
> 来源: https://docs.dagger.io/cookbook/

Cookbook 提供实用、真实世界的常见开发工作流示例。每个 recipe 展示如何使用 Dagger 解决特定问题。

### 食谱分类

**Builds（构建）：**
- **多阶段构建：** Go builder → Alpine 精简镜像
- **并行构建：** 使用 `Container.With()` 并发多个构建任务
- **矩阵构建：** 多 OS/架构/版本组合构建
- **Dockerfile 构建：** `Directory.DockerBuild()`

**Container Images（容器镜像）：**
- 发布到 ttl.sh 临时仓库
- 发布到 Docker Hub / GHCR / GCR 等 registry
- OCI 注解和标签添加
- 镜像导入导出（OCI tarball）

**Filesystems（文件系统）：**
- 添加本地目录和文件
- 从 Git 仓库克隆代码
- 文件读写操作
- 目录导出到宿主机

**Services（服务）：**
- 启动数据库/缓存等依赖服务
- `withServiceBinding()` 连接服务
- `asService().up()` 本地部署

**Secrets（机密）：**
- 从环境变量读取
- 从文件读取
- 从外部 secret manager 读取
- 在容器中使用 secret（不泄露）

**LLMs and Environments（LLM 和环境）：**
- 创建 AI 编程代理
- Env 定义输入输出
- 结构化 Prompt 工程
- 工具使用（tool use）

**Errors and Debugging（错误和调试）：**
- `terminal()` 断点调试
- 函数级错误处理
- 交互式终端排查

## 67. Reference - Overview
> 来源: https://docs.dagger.io/reference/

### Quick Reference（快速参考）
- **Glossary** - 关键术语和概念定义
- **CLI Reference** - 命令行接口文档
- **IDE Setup** - 开发环境配置指南
- **Troubleshooting** - 常见问题解决

### Configuration（配置）
- **Cloud configuration** - Dagger Cloud 设置
- **Cache management** - 缓存性能优化
- **Engine configuration** - Dagger Engine 配置
- **LLM integration** - 大语言模型配置
- **Module configuration** - Dagger 模块配置（dagger.json schema）
- **Custom runner** - 自定义执行环境
- **Custom CA** - 自定义证书颁发机构
- **Proxy configuration** - 网络代理设置

### API and SDKs
- **GraphQL API Reference** - 完整 API 文档
- **Go SDK Reference** - Go 语言绑定
- **Python SDK Reference** - Python 语言绑定
- **TypeScript SDK Reference** - TypeScript/JavaScript 绑定
- **PHP SDK Reference** - PHP 语言绑定

### Container Runtimes（容器运行时）
- **Overview** - 支持的容器运行时概览
- **Docker** - 使用 Dagger with Docker
- **Podman** - 使用 Dagger with Podman
- **Nerdctl** - 使用 Nerdctl
- **Apple Container** - 使用 Apple 容器运行时

### Deployment（部署）
- **Kubernetes** - 在 Kubernetes 上部署 Dagger
- **OpenShift** - 在 OpenShift 上部署 Dagger

### Best Practices（最佳实践）
- **Modules** - 测试和发布模块
- **Monorepos** - 在 Monorepo 中使用 Dagger
- **Adopting Dagger** - 在项目/团队/组织中采用 Dagger
- **Contributing** - 贡献到 Dagger 开源仓库
