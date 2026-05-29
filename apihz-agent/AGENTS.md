# AGENTS.md — apihz-cli Quick Reference

`@orangemust/apihz-cli` is a CLI for [apihz.cn](https://www.apihz.cn/) (接口盒子), giving terminal access to 479+ APIs.
Run via `apihz-cli` (global install) or `npx @orangemust/apihz-cli`.

## Authentication

```
apihz-cli config set --id=<id> --key=<key>     # Save credentials
apihz-cli config set --vip                      # Enable VIP line
apihz-cli config show                           # View config (key masked)
apihz-cli config get id                         # Get specific value
apihz-cli config reset                          # Clear all config
apihz-cli config path                           # Config file location
```

Config file: `~/.apihz/config.json`
Priority: CLI flags (`--id`, `--key`, `--vip`) > env vars (`APIHZ_ID`, `APIHZ_KEY`, `APIHZ_VIP`) > config file.

## Global Flags

| Flag | Description |
|------|-------------|
| `--id <id>` | Developer ID (overrides config and env) |
| `--key <key>` | Developer KEY (overrides config and env) |
| `--vip` | Use VIP line instead of free line |
| `--raw` | Output raw API response |

---

## Time (时间)

```
apihz-cli time now --type=20                   # Current time + lunar + zodiac
apihz-cli time calendar                         # Full calendar (60+ fields)
apihz-cli time to-timestamp --time="2024-03-20 16:16:16"
apihz-cli time from-timestamp --time=1710925735 --type=1
apihz-cli time country --country=US             # Country timezone info
```

**time now --type values:**
1=timestamp 2=datetime 3=CN format 4=slash 5=pipe 6=compact 7-12=year/month/day/hour/min/sec 13=YMD 14=HMS 15=YM 16=MD 17=HM 18=MS 19=DH 20=full+lunar+zodiac

## Weather (天气)

```
apihz-cli weather by-address --place=绵阳 --sheng=四川 --day=3 --hourtype=1
apihz-cli weather by-ip --day=1 --hourtype=1
apihz-cli weather by-coords --lon=116.30 --lat=40.05 --day=1
apihz-cli weather moji15 --sheng=四川 --place=绵阳
apihz-cli weather cloud                          # Satellite cloud map
apihz-cli weather precipitation                  # Precipitation anomaly
apihz-cli weather temp-anomaly                   # Temperature anomaly
apihz-cli weather humidity                       # Soil humidity
```

## IP & Location (位置坐标)

```
apihz-cli ip lookup                              # Auto-detect IP geolocation
apihz-cli ip lookup --ip=112.192.49.243          # Specific IP
apihz-cli ip lookup --td=1                       # Query channel 0-5
apihz-cli ip visitor                             # IP + browser + OS
apihz-cli phone lookup --phone=13219931963
apihz-cli region list --type=1                   # Provinces
apihz-cli region list --type=2 --sheng=四川      # Cities under province
apihz-cli region list --type=3 --sheng=四川 --shi=绵阳  # Districts
apihz-cli region code --sheng=四川 --place=绵阳   # Code + coords
apihz-cli region country                         # All countries
apihz-cli idcard lookup --card=510704888888888888
apihz-cli geo reverse --lon=116.30 --lat=40.05   # Coords → address
```

## Image (图像)

```
apihz-cli image memes --words=开心 --source=apihz
apihz-cli image memes --source=baidu --words=开心 --page=1 --limit=10
apihz-cli image memes --source=sougou --words=开心
apihz-cli image search --words=风景 --source=baidu --type=1
apihz-cli image search --source=sougou --words=风景
apihz-cli image wallpaper --type=1               # 0=rand 1=general 2=beauty
apihz-cli image avatar --type=5                  # 0=all 1=male 2=female 3=couple 4=bestie 5=anime 6=pet 7=cute 8=europe 9=ancient 10=troll 11=fairy 12=simple 13=QQ 14=wechat 15=text 16=custom
apihz-cli image bing                             # Bing daily wallpaper
apihz-cli image nasa --hd                        # NASA astronomy picture
```

## Text & Dictionary (字词句名)

```
apihz-cli text translate --words="你好" --from=2 --to=1
apihz-cli text translate --words="hello" --from=1 --to=2 --cache
apihz-cli text yiyan                             # Random quote (120k)
apihz-cli text yiyan-search --words=人生
apihz-cli text pinyin --words="接口盒子"
apihz-cli text pinyin --words="接口盒子" --sep=|
apihz-cli text hanzi --word=天                   # Character lookup (20k)
apihz-cli text ciyu --words=宇宙                 # Word lookup (380k)
apihz-cli text baike --words=北京                # Baidu encyclopedia
apihz-cli text nick --min=2 --max=6              # Random nickname (1M)
apihz-cli text case --type=1 --words="hello"     # 1=upper 2=lower 3=capitalize-first 4=capitalize-each
apihz-cli text jfzh --type=1 --words="接口盒子"   # 1=S→T 2=T→S
apihz-cli text today                             # Today in history
apihz-cli text today --month=7 --day=1           # Specific date
apihz-cli text joke                              # Random joke (200k)
```

**translate language codes:** 1=en 2=zh-CN 3=zh-TW 4=ja 5=ko 6=fr 7=de 8=ru 9=es 10=ar ...

## Idioms (成语)

```
apihz-cli chengyu random                         # Random idiom (30k)
apihz-cli chengyu chain --word=天                # Idiom starting with char
apihz-cli chengyu lookup --words=焕然一新         # Full idiom definition
```

## QR Code (二维码)

```
apihz-cli qrcode create --text="hello"           # Generate QR
apihz-cli qrcode create --text="hello" --level=10 --size=15 --bg=ffffff --fg=000000
apihz-cli qrcode parse --type=1 --img=<url>      # Parse QR (basic)
apihz-cli qrcode parse --type=2 --img=<base64> --ext=png
apihz-cli qrcode parse-plus --type=1 --img=<url> # Parse QR (advanced)
```

## News (新闻热点)

```
apihz-cli news baidu
apihz-cli news weibo
apihz-cli news douyin
```

## Network (域名网站)

```
apihz-cli network icp --domain=apihz.cn
apihz-cli network icp-plus --domain=apihz.cn     # Stable version (offline DB)
apihz-cli network domain --domain=example.com    # Free: .com/.cn only
apihz-cli network tdk --url=https://apihz.cn     # Title/Description/Keywords
apihz-cli network tdk --url=https://apihz.cn --node=2  # HK access node
```

## AI Recognition (AI识别) — PAID

All require `--type` (1=remote URL, 2=BASE64) and `--img <data>` (max 1MB).

```
apihz-cli ai face-compare --type=1 --imga=<url1> --imgb=<url2>
apihz-cli ai face-liveness --type=1 --img=<url>   # ≥40 = live
apihz-cli ai face-attr --type=1 --img=<url> --mode=1  # 1=all 2=detection only
apihz-cli ai ocr --type=1 --img=<url>
apihz-cli ai ocr --type=1 --img=<url> --sep=|
apihz-cli ai idcard --type=1 --img=<url>
apihz-cli ai bankcard --type=1 --img=<url>
apihz-cli ai driving-license --type=1 --img=<url>
apihz-cli ai vehicle-license --type=1 --img=<url> --page=1  # 1=front 2=back
apihz-cli ai business-license --type=1 --img=<url>
apihz-cli ai receipt --type=1 --img=<url>
apihz-cli ai plate --type=1 --img=<url>           # License plate
apihz-cli ai vehicle --type=1 --img=<url>         # Vehicle make/model/color
apihz-cli ai product --type=1 --img=<url>         # Product recognition
apihz-cli ai tag --type=1 --img=<url>             # Image tags
```

## Voice (语音) — PAID

```
apihz-cli voice to-text --type=1 --data=<url> --format=wav
apihz-cli voice to-text --type=1 --data=<url> --format=mp3 --lang=16k_en
# Format: wav/pcm/ogg/mp3/m4a/aac/amr
# Lang: 8k_zh (default) / 8k_en / 16k_zh / 16k_en / 16k_ja / 16k_ko / 16k_yue ...

apihz-cli voice to-voice --text="你好" --type=1 --voice=1001
apihz-cli voice to-voice --text="hello" --type=2 --lg=2 --vtype=2
# type: 1=URL 2=BASE64 | lg: 1=CN 2=EN 3=JP | vtype: 1=wav 2=mp3
# emotion: neutral/sad/happy/angry/fear/news/story/radio/poetry
```

## Auth (实名认证) — PAID

```
apihz-cli auth bank3 --name=张三 --number=6222... --idcard=5107...
apihz-cli auth bank2 --name=张三 --number=6222...
apihz-cli auth alipay --name=张三 --number=5107...
apihz-cli auth alipay-check --cxid=<query_id>
```

## Storage (存储)

```
apihz-cli storage text --type=2 --numid=1                    # Read entry
apihz-cli storage text --type=1 --numid=1 --words="hello" --title="test"
apihz-cli storage text --type=3 --numid=1 --words="prefix"   # Prepend
apihz-cli storage text --type=4 --numid=1 --words="suffix"   # Append
apihz-cli storage data-create --name=data1,data2 --data="val1","val2"
apihz-cli storage data-query --name=* --page=1 --limit=10
apihz-cli storage data-query --name=data1,data2 --tj="data1<>'张三'"
apihz-cli storage data-query --name=* --pxname=data1 --px=2  # Sort desc
```

## SMS (短信)

```
apihz-cli sms send --phone=13219931963
apihz-cli sms send --phone=13219931963 --code=123456        # Custom code
apihz-cli sms send-verify --type=1 --phone=13219931963       # Send (PAID)
apihz-cli sms send-verify --type=2 --phone=13219931963 --code=123456  # Verify (FREE)
apihz-cli sms send-aliyun --phone=13219931963 --aliid=... --alikey=... --sign=... --template=... --code=123456
```

## Unit Conversion (单位换算)

```
apihz-cli unit speed --num=100 --unit=米秒        # m/s → all units (note: CN names)
apihz-cli unit speed --num=360 --unit=节          # knot → all
apihz-cli unit time --num=3600 --unit=秒
apihz-cli unit density --num=1 --unit=千克立方米
apihz-cli unit frequency --num=1000 --unit=赫兹
apihz-cli unit current --num=5 --unit=安培
apihz-cli unit voltage --num=220 --unit=伏特
apihz-cli unit resistance --num=1000 --unit=欧姆
```

> Units use Chinese names (e.g. `米秒` not `km/h`, `节` not `kn`). Server rejects English symbols and names >2 chars.

## Misc (杂项)

```
apihz-cli misc jiakao --type=1                     # 1=subject-1 4=subject-4
apihz-cli misc qq --qq=10001
apihz-cli misc lottery                             # Latest 双色球
apihz-cli misc lottery --qh=2024130                 # Specific period
apihz-cli misc lanzou --url=<share_link> --pwd=6pvs
apihz-cli misc lanzou --url=<link> --type=2 --outtype=2
apihz-cli misc phone-status --number=13219931963    # PAID
apihz-cli misc phone-online --number=13219931963    # PAID
apihz-cli misc bank-info --number=6222...           # PAID
apihz-cli misc chem-eq --reactants=H2,O2 --products=H2O
apihz-cli misc element --name=H                     # Periodic table
apihz-cli misc element --name=氢                    # CN name
apihz-cli misc element --name=1                     # Atomic number
apihz-cli misc mail --name=... --to=... --title=... --text=... --code=utf8 --port=25 --ip=... --secure=tls --idmail=... --pwd=... --usermail=...
apihz-cli misc proxy --type=1                       # PAID, 1=http 2=socks5
apihz-cli misc proxy --type=1 --ip=<whitelist> --direct
apihz-cli misc redpack --zfb=account --name=张三    # PAID
```

## Common Patterns

```bash
# JSON parsing with jq
apihz-cli time now --type=20 | jq '.sx'
apihz-cli ip lookup | jq '{city: .shi, isp: .isp}'
apihz-cli news baidu | jq '.data[].content[] | select(.isTop != true) | .word'

# Override credentials per-command
apihz-cli time now --id=<id> --key=<key>

# One-liner install + configure + verify
npm install -g @orangemust/apihz-cli && apihz-cli config set --id=<id> --key=<key> && apihz-cli time now --type=20
```

## Errors

- **Request failed / code:400** → Wrong/missing id/key. Check `apihz-cli config show`.
- **通讯秘钥错误** → Developer KEY wrong. Get fresh key from apihz.cn User Center.
- **查询失败，请重试** → Server-side issue. Retry or try `--vip`.
- **empty config** → No credentials saved. Run `apihz-cli config set --id=<id> --key=<key>`.
- **无效的单位类型** → Unit name must be Chinese short form (e.g. `米秒` not `km/h`).
