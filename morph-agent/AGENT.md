# morph-cli — Commands for AI Agents

This document describes how to invoke `morph-cli` commands on behalf of a user in conversation.

---

## Global Options

Place before the subcommand:

| Option | Default | Description |
|--------|---------|-------------|
| `--ci-base <path>` | `~/dagger-ci` | CI base directory (projects live here as subdirectories) |
| `--ssh-key <key>` | `file:~/.ssh/id_rsa` | SSH private key for Dagger |

Example with global options:
```
morph-cli --ci-base /custom/path --ssh-key file:/home/user/.ssh/id_rsa build doors main
```

---

## Command: `build`

### User intent phrases
- "build doors using main branch"
- "打包 doors 项目，分支 main"
- "构建 my-app 的 develop 分支"

### Syntax
```
morph-cli build <project> <branch>
```

### Arguments

| Arg | Required | Description |
|-----|----------|-------------|
| `<project>` | Yes | Project name (subdirectory under `--ci-base`) |
| `<branch>` | Yes | Git branch to build from |

### Behavior
1. Validates project directory exists under `--ci-base`
2. Generates a 10-char uppercase hex **build ID** (e.g., `A1B2C3D4E5`)
3. Creates output dir: `{ciBase}/{project}/output/{buildId}/`
4. Runs:
   ```
   dagger call build \
     --branch=<branch> \
     --private-key=<sshKey> \
     --build-id=<buildId> \
     --progress=plain \
     export --path={ciBase}/{project}/output/{buildId}/doors-0.0.1-SNAPSHOT.jar
   ```

### Output (success)
- 打印 Build ID 和 JAR 产物路径
- 提示下一步可执行: `morph-cli deploy <project> <buildId>`

### Preconditions
- `dagger` 在 `PATH` 中
- 项目目录存在

### Example
```
morph-cli build doors main
```

---

## Command: `deploy` (general project)

### User intent phrases
- "deploy doors with build ID ABCDEF1234"
- "部署 doors 的构建 ABCDEF1234"

### Syntax
```
morph-cli deploy <project> <buildId>
```

### Arguments

| Arg | Required | Description |
|-----|----------|-------------|
| `<project>` | Yes | Any project name **except** `door-applets` |
| `<buildId>` | Yes | 10-char build ID from a previous `build` |

### Behavior
1. Locates JAR: `{ciBase}/{project}/output/{buildId}/doors-0.0.1-SNAPSHOT.jar`
2. Exits with error if JAR does not exist
3. Runs:
   ```
   dagger call deploy \
     --jar-file=<jarPath> \
     --private-key=<sshKey> \
     --progress=plain
   ```

### Output (success)
- "Deploy 成功! 服务已更新并重启。"

### Preconditions
- 必须先执行过 `build`，对应 build ID 的 JAR 必须存在

### Example
```
morph-cli deploy doors ABCDEF1234
```

---

## Command: `deploy door-applets` (WeChat mini-app)

### User intent phrases
- "deploy door-applets 小程序，main 分支，版本号 1.2.3"
- "发布微信小程序，分支 develop，版本 2.0.0"

### Syntax
```
morph-cli deploy door-applets <branch> <version>
```

### Arguments

| Arg | Required | Description |
|-----|----------|-------------|
| `<project>` | Yes | Must be `door-applets` |
| `<branch>` | Yes | Git branch name |
| `<version>` | Yes | Version number (e.g., `1.0.0`) |

### Behavior
Runs:
```
dagger call deploy \
  --branch=<branch> \
  --private-key=<sshKey> \
  --env-file=./.env.staging \
  --upload-key=file:./private.wx7832004096eaa744.key \
  --version=<version> \
  --progress=plain
```

### Output (success)
- "Deploy 成功! 请到微信公众平台管理该版本"

### Preconditions
- 项目目录存在
- `.env.staging` 和微信上传密钥文件存在

### Example
```
morph-cli deploy door-applets main 1.2.3
```

---

## Listing Projects

**No separate command.** Projects are subdirectories under the CI base. Run:

```
ls ~/dagger-ci
```

Or use the `--ci-base` value if overridden.

---

## Common Workflows

### 1. Build → Deploy (one-shot)
用户说 "build and deploy doors on main"：
```
morph-cli build doors main
```
捕获输出中的 build ID，然后：
```
morph-cli deploy doors <buildId>
```

### 2. Override CI base
```
morph-cli --ci-base /custom/path build my-project main
```

### 3. Help
```
morph-cli --help
morph-cli build --help
morph-cli deploy --help
```
