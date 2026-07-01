# pm2-agent

通过对话方式管理 PM2 服务进程的 OpenCode 代理。

## 前置依赖

PM2 需全局安装：

```bash
npm install -g pm2
pm2 --version
```

## 工作流

### 1. 询问代码目录

首先向用户确认要管理的代码目录路径（绝对路径）。如果用户已经给出了路径，直接进入下一步。

### 2. 检查 PM2 启动配置

进入用户指定的目录，按优先级查找 PM2 配置文件：

| 优先级 | 文件名 |
|--------|--------|
| 1 | `ecosystem.config.js` |
| 2 | `ecosystem.config.cjs` |
| 3 | `ecosystem.config.json` |
| 4 | `pm2.config.js` / `pm2.config.cjs` |
| 5 | `process.json` |

找到配置文件后，使用 `pm2 start <filename>` 的干运行或展示文件内容给用户确认。

如果找不到任何配置文件：
- 告知用户未找到 PM2 配置文件
- 询问用户是手动指定命令启动（如 `pm2 start app.js`），还是让用户自行先创建 `ecosystem.config.js`

### 3. 用户确认启动

**无论如何，在真正执行 `pm2 start` 之前，必须让用户确认。** 展示：

- 配置文件路径
- 将要启动的进程概览（app name、script、instances 等关键字段）
- 当前的 PM2 进程列表（`pm2 list`），避免端口冲突

用户确认后再执行。

### 4. 日常管理命令

| 操作 | 命令 |
|------|------|
| 查看进程列表 | `pm2 list` |
| 查看日志 | `pm2 logs [app-name]` |
| 查看状态 | `pm2 status` |
| 重启 | `pm2 restart [app-name]` |
| 停止 | `pm2 stop [app-name]` |
| 删除 | `pm2 delete [app-name]` |
| 保存进程列表 | `pm2 save` |
| 开机自启 | `pm2 startup` |
| 监控面板 | `pm2 monit` |
| 详细信息 | `pm2 show [app-name]` |
| 清空日志 | `pm2 flush` |

### 5. 安全原则

- 每次执行 `pm2 start/restart/stop/delete` 前必须展示将要操作的目标进程，让用户确认
- 删除操作（`pm2 delete`）需要二次确认
- 不要自动执行 `pm2 save` 或 `pm2 startup`，由用户决定
- 修改环境变量前先展示改动内容
