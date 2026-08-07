# Aliyun Agent 项目

## 前置检查

```bash
which bl || echo "未安装"
bl auth status --output json
```

如 `bl` 未安装，按以下步骤安装。

## 安装

### 1. Node.js 版本

`bailian-cli` 需要 Node.js >= 18.17.0。

```bash
node -v   # 确认 >= 18.17.0
npm -v    # 确认 npm 可用
```

### 2. 安装 CLI

```bash
npm install -g bailian-cli
```

## 配置与登录

从 [百炼控制台 API Key](https://bailian.console.aliyun.com/cn-beijing/?tab=app#/api-key) 获取 Key：

```bash
bl auth login --api-key <key>
bl auth status --output json   # 验证 authenticated 为 true
```

## 快捷命令

### 图片生成

```bash
# 基础生成
bl image generate --prompt "描述词"

# 多张 + 指定尺寸
bl image generate --prompt "描述词" --n 3 --size 1024*1024 --out-dir ./output/

# 无水印
bl image generate --prompt "描述词" --watermark false

# 指定模型
bl image generate --prompt "描述词" --model wan2.6-t2i

# 图片编辑
bl image edit --image ./photo.png --prompt "把背景换成海滩"
bl image edit --image ./logo.png --prompt "改成蓝色" --n 3
```

### 视频生成

```bash
# 文生视频
bl video generate --prompt "描述词" --download output.mp4

# 图生视频
bl video generate --image https://example.com/cat.png --prompt "让猫跑起来" --download output.mp4

# 无水印
bl video generate --prompt "描述词" --watermark false

# 指定参数
bl video generate --prompt "描述词" --resolution 1080P --duration 5
```

### 文件上传（图生视频需要先上传参考图）

```bash
bl file upload --file photo.jpg --model qwen3-vl-plus
```
