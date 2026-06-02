# apihz-agent — AGENTS.md

`@orangemust/apihz-cli` (v0.1.2) installed globally. 479+ APIs via apihz.cn, free tier: 10 calls/min, unlimited daily.

## 配置

Already configured with ID `10016043` and key. Config stored at `~/.apihz/config.json`. No action needed.

## 常用命令速查

### 时间
- `apihz-cli time now --type=20` — 北京时间 + 农历生肖
- `apihz-cli time calendar` — 万年历 (60+ 字段)
- `apihz-cli time to-timestamp --time="2024-03-20 16:16:16"`
- `apihz-cli time from-timestamp --time=1710925735`
- `apihz-cli time country --country=US`

### 天气
- `apihz-cli weather by-address --place=绵阳 --sheng=四川 --day=3 --hourtype=1`
- `apihz-cli weather by-ip --day=1`
- `apihz-cli weather by-coords --lon=116.30 --lat=40.05`

### IP & 网络
- `apihz-cli ip lookup --ip=112.192.49.243`
- `apihz-cli ip visitor`
- `apihz-cli phone lookup --phone=13219931963`
- `apihz-cli network icp --domain=apihz.cn`
- `apihz-cli network domain --domain=example.com`
- `apihz-cli network whois --domain=example.com`
- `apihz-cli network ping --host=baidu.com`
- `apihz-cli network screenshot --url=https://example.com`
- `apihz-cli network ssl-check --domain=example.com`

### 图片
- `apihz-cli image search --words=风景 --source=baidu`
- `apihz-cli image wallpaper --type=1`
- `apihz-cli image avatar --type=5`
- `apihz-cli image bing`
- `apihz-cli image nasa`
- `apihz-cli image memes --words=开心`
- `apihz-cli image compress --img=<url> --format=webp`

### 文本 & 词典
- `apihz-cli text translate --words="你好" --from=2 --to=1`
- `apihz-cli text pinyin --words="接口盒子"`
- `apihz-cli text hanzi --word=天`
- `apihz-cli text ciyu --words=宇宙`
- `apihz-cli text baike --words=北京`
- `apihz-cli text nick --min=2 --max=6`
- `apihz-cli text yiyan`
- `apihz-cli text joke`
- `apihz-cli text today`
- `apihz-cli text case --type=1 --words="hello"`
- `apihz-cli text jfzh --type=1 --words="你好"`
- `apihz-cli text sensitive --text="敏感词检测"`
- `apihz-cli text segment --text="中文分词"`
- `apihz-cli text similarity --text1="A" --text2="B"`
- `apihz-cli text poetry --keyword=月`
- `apihz-cli text random-name`
- `apihz-cli text dict --word=hello`
- 文章提取: `text extract-wechat`, `extract-wangyi`, `extract-xiaohongshu`, `extract-toutiao`, `extract-sina`, `extract-tencent`
- 百度搜索: `text baidu-search --words=关键词`

### 成语
- `apihz-cli chengyu random`
- `apihz-cli chengyu chain --word=天`
- `apihz-cli chengyu lookup --words=焕然一新`

### 新闻热点
- `apihz-cli news baidu`
- `apihz-cli news weibo`
- `apihz-cli news douyin`
- `apihz-cli news toutiao`

### 二维码
- `apihz-cli qrcode create --text="hello"`
- `apihz-cli qrcode parse --type=1 --img=<url>`

### 地理 & 区域
- `apihz-cli region list --type=1`
- `apihz-cli region code --sheng=四川 --place=绵阳`
- `apihz-cli region country`
- `apihz-cli idcard lookup --card=510704888888888888`
- `apihz-cli geo reverse --lon=116.30 --lat=40.05`
- `apihz-cli geo address --address=北京市朝阳区`
- `apihz-cli geo nearby --lon=116.30 --lat=40.05 --radius=1000`

### 单位转换
- `apihz-cli unit speed --num=100 --unit=米秒`
- `apihz-cli unit length --num=1000 --unit=米`
- `apihz-cli unit temperature --num=100 --unit=C --target=F`
- `apihz-cli unit storage --num=1 --unit=gb --target=mb`

### 加密解密
- `apihz-cli pwd md5 --words="hello"`
- `apihz-cli pwd base64-encode --words="hello"`
- `apihz-cli pwd url-encode --words="你好世界"`
- `apihz-cli pwd hex-encode --words="hello"`

### 交通物流
- `apihz-cli transport train-remain --add=绵阳 --end=成都 --y=2025 --m=6 --d=10`
- `apihz-cli transport express --number=<运单号>`
- `apihz-cli transport bus-route --starlon=121.42 --starlat=31.20 --endlon=121.31 --endlat=31.19`

### B站 & 娱乐
- `apihz-cli bilibili ranking`
- `apihz-cli bilibili video-info --url=https://www.bilibili.com/video/BV1xx`
- `apihz-cli bilibili user-info --url=https://space.bilibili.com/xxx`
- `apihz-cli bilibili maoyan-movie`
- `apihz-cli bilibili random-video`

### 日历 & 运势
- `apihz-cli calendar today-detail`
- `apihz-cli calendar today-luck`
- `apihz-cli calendar zhuge --words="问前程"`
- `apihz-cli calendar yuelao`
- `apihz-cli calendar mbti`

### 金融
- `apihz-cli finance exchange-rate --from=USD --to=CNY --money=100`
- `apihz-cli finance gold-price`
- `apihz-cli finance lottery-daletou`

### 杂项
- `apihz-cli misc uuid`
- `apihz-cli misc chem-eq --reactants=H2,O2 --products=H2O`
- `apihz-cli misc element --name=H`
- `apihz-cli misc jiakao --type=1`
- `apihz-cli misc lottery`
- `apihz-cli misc calc --expr="1+2*3"`

### 付费 API（需余额）
- `apihz-cli ai ocr --type=1 --img=<url>`
- `apihz-cli ai idcard --type=1 --img=<url>`
- `apihz-cli ai face-compare --type=1 --imga=<url1> --imgb=<url2>`
- `apihz-cli ai face-attr --type=1 --img=<url> --mode=1`
- `apihz-cli voice to-text --type=1 --data=<url> --format=wav`
- `apihz-cli voice to-voice --text="你好" --type=1`
- `apihz-cli sms send --phone=13219931963`
- `apihz-cli auth bank2 --name=张三 --number=6222...`

## 配置管理

```bash
apihz-cli config show    # 查看当前配置
apihz-cli config path    # 配置文件路径
apihz-cli config reset   # 清除配置
apihz-cli config set --id=<id> --key=<key>   # 重新设置
```

## 环境变量（无需配置文件）

```bash
export APIHZ_ID=10016043
export APIHZ_KEY=xxxx
export APIHZ_VIP=1
```

优先级: CLI flag > 环境变量 > 配置文件

## 通用参数

```bash
--id <id>     # 覆盖 Developer ID
--key <key>   # 覆盖 Developer KEY
--vip         # 使用 VIP 线路
--raw         # 输出原始 API 响应（无格式化）
```

## 帮助

```bash
apihz-cli --help                    # 总览
apihz-cli <command> --help          # 子命令详情
apihz-cli help <command>
```
