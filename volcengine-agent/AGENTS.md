# Volcengine Agent 项目

火山引擎 CLI（`ve`）是用于调用和管理火山引擎 OpenAPI 的命令行工具。可配置凭证、切换 profile、查询服务接口、调用 API，并支持 SSO / Console Login 获取临时凭证。即梦 AI（Seedream 生图、Seedance 生视频等）等火山服务均可用它调用，按量付费。

## 前置检查

```bash
which ve || echo "未安装"
ve version                      # 版本（>= 1.0.20 命令前缀为 ve）
ve configure get                # 查看当前 profile 配置
```

## 安装

需要 Node.js >= 14：

```bash
npm install -g @volcengine/cli   # 或 brew install volcengine-cli / GitHub Release 二进制
ve version
```

一键安装全家桶（ve + arkcli + 全部 volcengine-skills）：

```bash
npx -y @volcengine/skills-setup@latest
```

> npm 安装时会自动安装火山引擎核心 Skill 到 `~/.agents/skills`（会让宿主 available_skills 膨胀）。如不需要，安装时设置 `VOLCENGINE_CLI_SKIP_SKILLS=1`。
> 常用官方 skill：`volcengine-cli`（ve 用法）、`volcengine-api`（查 API 参数/枚举/错误码）、`volcengine-sdk-generator`（生成 SDK 示例）、`volcengine-knowledge-search`（文档全文检索）、`volcengine-troubleshooting`（排障）。

## 配置与登录

`ve` 支持 ak / sso / console-login / ramrolearn / oidc / ecsrole 六种凭证模式。

```bash
# AK/SK 模式（最常用）
ve configure set --profile default --region cn-beijing --access-key <AK> --secret-key <SK>

# 控制台登录（OAuth2+PKCE，自动缓存 STS 临时凭证，无需 AK/SK；仅 1.0.42+）
ve login --profile default --region cn-beijing
ve login --profile default --region cn-beijing --remote     # 无浏览器远程授权

# 其他凭证模式
ve configure set --profile sso-1 --mode sso --region cn-beijing
ve configure set --profile ecs-1 --mode ecsrole --region cn-beijing --role-name <role>

# 查看 / 切换 / 删除 profile
ve configure get
ve configure list
ve configure profile --profile <name>     # 切换到指定 profile
ve configure delete <name>
```

## 配置与登录

`ve` 支持 ak / sso / console-login / ramrolearn / oidc / ecsrole 六种凭证模式。

```bash
# AK/SK 模式（最常用）
ve configure set --profile default --region cn-beijing --access-key <AK> --secret-key <SK>

# 其他凭证模式
ve configure set --profile sso-1 --mode sso --region cn-beijing
ve configure set --profile ecs-1 --mode ecsrole --region cn-beijing --role-name <role>

# 查看 / 切换 / 删除 profile
ve configure get
ve configure list
ve configure profile <name>
ve configure delete <name>
```

> AK/SK 在火山引擎控制台「访问控制」创建；未配置凭证时调用 API 会因鉴权失败报错。

## 快捷命令

通用调用格式：`ve [service] [action] [--Param value ...] [system flags]`

```bash
ve <service> -h                 # 查看某服务可用的 Action
ve <service> <action> -h        # 查看某 Action 的参数
ve <service> <action> --param value --profile default --region cn-beijing
```

System flags（v1.0.48+ 用三横线，与 API 双横线参数不冲突）：`---profile` `---region` `---endpoint` `--force`（跳过元数据校验强制调用）`--header Name=Value`（可重复）`--body '{json}'`（application/json 请求体）。

> 💡 **拿准确命令的最快方式**：用火山 **API Explorer CLI 生成器** https://api.volcengine.com/api-explorer?tab=cli ，选服务/Action 填参数即可自动生成 ve 命令。

### 视觉智能（即梦相关）— cv20240606

```bash
# 智能扩图（outpainting）
ve cv20240606 Img2ImgOutpainting --req_key high_aes_general_v21.1 \
  --custom_prompt "..." --image_urls '["https://..."]'

# 交互编辑 inpainting
ve cv20240606 Img2ImgInpainting --req_key high_aes_general_v21.1 --custom_prompt "..." --image_urls '["..."]'

# 文生图（XLSft 轻量版）
ve cv20240606 Text2ImgXLSft --req_key <req_key> --prompt "一只猫" --width 1024 --height 1024

# 图生图（XLSft）
ve cv20240606 Img2ImgXLSft --req_key <req_key> --prompt "改风格" --image_urls '["..."]'

# 换脸 / 风格化 / 数字人
ve cv20240606 FaceSwap --req_key <req_key> --image_urls '["..."]'
ve cv20240606 AIGCStylizeImage --req_key <req_key> --image_urls '["..."]'

# 视频类异步任务（submit + get result 两步）
ve cv20240606 FaceFusionMovieSubmitTask --req_key <req_key> --image_urls '["..."]'
ve cv20240606 FaceFusionMovieGetResult --req_key <req_key> --task_id <id>
```

cv20240606 主要 Action：`AIGCStylizeImage`（风格化）、`FaceSwap`/`FaceSwapAI`（换脸）、`HairStyle`、`HighAesGeneralV13/V14/V20` 等（即梦生图各版本）、`Text2ImgXLSft`/`Img2ImgXLSft`、`Img2ImgInpainting`/`Img2ImgOutpainting`（智能扩图/交互编辑）、`FaceFusionMovieSubmitTask`/`GetResult`（数字人视频）等。参数以 `ve cv20240606 <Action> -h` 为准，`req_key` 多为必填。

### 即梦图片生成（已验证 ✅ 2026-08-21）

即梦文生图走视觉智能「即梦AI-图片生成」服务，**不在 ve 内置元数据里**，需 `--force` 强制调用：
接口地址 `https://visual.volcengineapi.com`，`Service=cv`，`Region=cn-north-1`，`Version=2022-08-31`。

```bash
# ① 提交任务 → 返回 task_id
ve cv CVSync2AsyncSubmitTask --force --version 2022-08-31 --method POST \
  --region cn-north-1 --endpoint visual.volcengineapi.com \
  --body '{"req_key":"jimeng_t2i_v40","prompt":"一只坐在沙发上的猫，影棚灯光","width":2048,"height":2048,"force_single":true}'

# ② 查询结果（轮询直至 status=done），返回 image_urls（24h 有效）
ve cv CVSync2AsyncGetResult --force --version 2022-08-31 --method POST \
  --region cn-north-1 --endpoint visual.volcengineapi.com \
  --body '{"req_key":"jimeng_t2i_v40","task_id":"<task_id>","req_json":"{\"return_url\":true}"}'
```

req_key 对照（已开通服务）：
| 服务 | req_key |
|------|---------|
| 即梦AI-图片生成 3.0 | `jimeng_t2i_v30` |
| 即梦AI-图片生成 4.0 | `jimeng_t2i_v40` |
| 即梦AI-图片生成 4.6 | `jimeng_seedream46_cvtob` |

参数要点：
- `prompt` 必选（≤800 字符）；`image_urls` 可选（0-10 张，图生图/编辑）；`size` 或 `width`+`height` 控制分辨率（1K-4K，默认 2048²）。
- `force_single=true` 强制单图（省积分/更快）；组图按张数计费，最多 15-输入图数 张。
- 提交返回 `code=10000` 才有 `task_id`；查询结果 `status`：`in_queue` → `done`/`fail`。

### 大模型（火山方舟 ark）

```bash
ve ark -h                       # 火山方舟相关服务（豆包等大模型）
```

## 服务开通与计费（以即梦为例）

- 按量付费：注册火山引擎 → 实名认证 → 控制台开通「即梦AI 图像生成」等服务 → 费用中心充值 → 用 AK/SK 调用，按成功调用次数/Token 计费，失败不计费。
- 开通入口：https://www.volcengine.com/product/jimeng
- 文档：快速入门 https://www.volcengine.com/docs/85621/1995636 ；图像生成计费 https://docs.volcengine.com/docs/85621/1544714 ；SDK https://www.volcengine.com/docs/6444/1340578

## 注意事项

- CLI 文档：什么是 CLI https://www.volcengine.com/docs/83927/1176799 ；安装 https://www.volcengine.com/docs/83927/1184025 ；源码 https://github.com/volcengine/volcengine-cli
- 调用前先 `ve <service> <action> -h` 确认必填参数与取值范围；正式请求前可用小金额验证，避免误扣费。
- **官方接口文档反爬，抓不到正文时**：用火山官方 `volcengine-knowledge-search` skill 的脚本直接取全文（无需鉴权）：`python3 scripts/volcengine_docs.py fetch "<docs链接>"`（脚本在 `volcengine-skills` 仓库 `skills/core/volcengine-knowledge-search/scripts/volcengine_docs.py`）。`search` 子命令做语义检索。
- 生成类任务多为异步：提交返回 task_id 后，用对应的 `*GetResult` Action 轮询到完成。
- 未配置凭证时先 `ve configure set`；多环境用 `--profile` 隔离。
- 更新 CLI：`ve upgrade`。
- 自动补全：`ve completion bash/zsh`（写入对应 rc 文件）；彩色输出：`ve enable-color` / `ve disable-color`。
