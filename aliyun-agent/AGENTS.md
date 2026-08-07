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

# MaaS 自定义端点
bl auth login --api-key <key> --base-url https://llm-xxxxx.cn-beijing.maas.aliyuncs.com/api/v1
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

# 图片编辑（单图）
bl image edit --image ./photo.png --prompt "把背景换成海滩"
bl image edit --image ./logo.png --prompt "改成蓝色" --n 3
```

### 模型选择

| 场景 | 模型 | 原因 |
|------|------|------|
| 快速文生图 | `z-image-turbo` | 同步快，罕有限流 |
| 图片编辑/双图合并 | `wan2.7-image` | 同步双图合并稳定 |
| 默认 `qwen-image-3.0` | ⚠️ 慎用 | MaaS 端点频繁 429 限流 |
| 异步模式 | ❌ 别用 | MaaS 不支持异步返回 403 |

### 图片编辑（双图叠加 logo）

```bash
# 基础图 + logo 精确叠加（底部左右角）
bl image edit \
  --image ./base.png \
  --image ./logo.png \
  --prompt "Place the orange logo in the bottom-left corner. Keep everything else exactly the same." \
  --size "1200*630" \
  --watermark false \
  --model wan2.7-image \
  --out-dir ./output/
```

### PNG → JPG 压缩

AI 生成 PNG 通常 1-2MB，转 JPG 可降至 100-200KB（OG 图片推荐 JPG）：

```bash
sips -s format jpeg -s formatOptions 85 input.png --out output.jpg
```

### Prompt 技巧

- 含人物时用 `--negative-prompt "human faces, people, distorted, deformed, bad anatomy"` —— 风景/物体比人像更稳定
- AI 不擅长精确定位 UI 元素（文字对位、手机屏幕内布局），场景描述保持简洁
- 批量生成 OG 图片工作流：`z-image-turbo 生成基础图` → `wan2.7-image 叠加 logo` → `sips 转 JPG` → `rm 中间 PNG`

### 模型目录

```bash
# 浏览所有模型
bl model list

# 按提供商筛选
bl model list --provider alibaba --provider deepseek

# 按能力筛选（TG=文本, VU=视觉理解, IG=生图, VG=生视频, TTS, ASR）
bl model list --capability TG --capability Reasoning

# 查看指定模型详情（含输入参数）
bl model list --model qwen-max --enrich --output json

# 按特性筛选（function-calling, web-search, structured-outputs）
bl model list --feature function-calling --output json
```

### 用量与额度

```bash
# 免费额度查询（不指定模型=全部）
bl usage free
bl usage free --model qwen3-max
bl usage free --expiring 30 --sort remaining

# 免费额度自动停用控制
bl usage freetier --off --model qwen3-max    # 关闭自动停用
bl usage freetier --on --model qwen3-max     # 开启自动停用
bl usage freetier --off --all                # 全部关闭

# 用量统计
bl usage stats                               # 最近7天
bl usage stats --days 30
bl usage stats --model qwen-turbo --type Text

# 综合摘要
bl usage summary --days 14
```

### 文件上传

上传本地文件到 DashScope 临时存储（48h），返回 `oss://` URL，供图生视频/多模态理解等使用：

```bash
bl file upload --file photo.jpg --model qwen3-vl-plus
bl file upload --file video.mp4 --model wan2.1-t2v-plus
bl file upload --file audio.wav --model qwen3-asr-flash
```

> 注意：`bl image edit` / `bl video generate` / `bl omni` 等命令已内置自动上传，直接传本地路径即可，无需手动 `bl file upload`。

### Web 搜索（DashScope MCP）

```bash
bl search web --query "阿里云百炼最新功能"
bl search web --query "TypeScript 5.9 new features" --count 5
```

> ⚠️ 仅用于百炼工作流内的搜索；普通搜索由 AI 宿主自身完成，不走此命令。

### 应用记忆（百炼应用记忆 CRUD）

```bash
# 添加记忆
bl memory add --user-id user1 --content "用户喜欢 Python 编程"

# 查看记忆列表
bl memory list --user-id user1

# 搜索记忆
bl memory search --user-id user1 --query "编程偏好" --top-k 5

# 更新记忆
bl memory update --node-id node_xxx --user-id user1 --content "新内容"

# 删除记忆
bl memory delete --node-id node_xxx --user-id user1
```

> 仅用于百炼应用记忆资源；宿主 agent 自身的记忆不走此命令。

### 视频生成

```bash
# 文生视频
bl video generate --prompt "描述词" --download output.mp4

# 图生视频
bl video generate --image ./photo.jpg --prompt "让猫跑起来" --download output.mp4

# 无水印
bl video generate --prompt "描述词" --watermark false

# 指定分辨率/时长
bl video generate --prompt "描述词" --resolution 1080P --duration 5

# 视频编辑（风格转换/物体替换）
bl video edit --video ./input.mp4 --prompt "转成动漫风格" --download output.mp4
bl video edit --video ./input.mp4 --prompt "替换背景" --resolution 720P

# 参考生视频（多主体多镜头+配音）
bl video ref --prompt "image1 在草地上奔跑" --image person.jpg
bl video ref --prompt "image1 说话" --image person.jpg --image-voice voice.mp3

# 异步任务查询
bl video task get --task-id 3b256896-xxxx
bl video download --task-id 3b256896-xxxx --out video.mp4
```

### omni 多模态理解（音视频文件超出宿主能力时使用）

```bash
# 图片理解
bl omni --message "描述这张图片" --image ./photo.jpg

# 音频理解
bl omni --message "这段音频说了什么" --audio ./meeting.wav

# 视频理解（仅文本输出）
bl omni --message "总结视频内容" --video ./demo.mp4 --text-only

# 语音回复
bl omni --message "Hello" --voice Sunny --audio-out reply.wav
```

### vision 图片/视频理解（用户指定百炼模型时使用）

```bash
bl vision describe --image photo.jpg
bl vision describe --image photo.jpg --prompt "这是什么品种的狗？"
bl vision describe --video ./clip.mp4 --prompt "总结视频内容"
```
