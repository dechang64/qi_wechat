# qi_wechat 云开发版 — 实战手册 v0.1

> ⚠️ 已废弃 FastAPI 后端, 全面用微信云开发 (云函数 + 云数据库)
> 你的 AppID: **wx06d5e464bb5a2f41**

---

## 重大变化

| 之前 (FastAPI) | 现在 (云开发) |
|---|---|
| 你电脑 uvicorn 8765 | 微信云函数 (cloud.run) |
| SQLite 本地 | 云数据库 MongoDB-like |
| 后端 ip:10.14.65.144:8765 | **自动 HTTPS, 任何设备可访问** |
| api_base 配置 | **不需要** (云函数自动鉴权) |
| 需要同 WiFi | ✅ **任何网络** |

---

## Step 1: 开启云开发 (2 min)

1. 打开 **微信开发者工具**
2. 顶部菜单 → "云开发" → "开通"
3. 微信扫码确认 (用申请测试号的微信号)
4. 创建云环境:
   - 环境名称: `qi-wechat-dev`
   - 环境付费: 选 "按量付费" (免费 4 个云函数 + 2GB 数据库)

## Step 2: 创建 5 个数据库集合 (1 min)

云开发控制台 → "数据库" → "集合管理" → "添加集合":

- `users`
- `assessments`
- `bookings`
- `messages`
- `crisis_logs`

权限都选 "仅创建者可读写" (v0.1 阶段)

## Step 3: 部署 5 个云函数 (3 min)

云开发控制台 → "云函数" → 依次:

```
1. 点 "上传部署"
2. 选 cloudfunctions/communities/
3. 部署
4. 重复: counselors, assessment, booking, crisis, chat
```

每个云函数**包含**:
- `index.js` (代码)
- `package.json` (依赖)
- 自动装 wx-server-sdk

## Step 4: 重新导入项目 (2 min)

1. 微信开发者工具 → 删旧项目
2. 导入项目:
   - 项目目录: `C:\Users\decha\.mavis\agents\mavis\workspace\qi_wechat\miniprogram\`
   - AppID: `wx06d5e464bb5a2f41` (已写入 project.config.json)
   - 项目名: 祺臻心理
3. 工具**会自动**检测 `cloudfunctions/` 目录 → 提示 "检测到云开发项目, 是否关联" → 选 "是"

## Step 5: 编译 + 真机预览 (2 min)

1. 工具栏 "编译" Ctrl+B
2. 模拟器看主页 (应看到 5 社区, 云函数返回数据)
3. 工具栏 "预览" → QR 码
4. 用你手机扫码 — **任何网络都行** (不再受 WiFi 限制)

## Step 6: 测试场景 (5 min)

手机端验证 5 个 page:

| Page | 操作 | 期望 |
|---|---|---|
| **home** | 看 5 社区 | 来自 cloud "communities" |
| | 点社区 | 蓝色高亮 |
| **chat** | "今天心情不好" | bot 随机回复 (云端) |
| | "不想活了" | 危机 → 跳 crisis |
| **assessment** | 5 题全答 | result 卡片 (云端写库) |
| **booking** | 选社区 → 老师 → 时段 → 手机号 | 写 bookings 集合 |
| **crisis** | 点 12320-5 | 弹模态 → 真机拨号 |
| | 测试 "不想活了" | 命中 (云端) |

---

## Step 7: 看云数据库 (1 min)

云开发控制台 → "数据库":
- `users`: 看到自己刚才预约时插入的 record
- `assessments`: 看到刚才 5 题评估的 score + level
- `bookings`: 看到预约的 counselor_id + 时间
- `messages`: 看到 chat 历史

🎉 数据真的存在云上了! 不是 mock!

---

## 项目结构 (云开发版)

```
qi_wechat/
├── miniprogram/              # 小程序前端
│   ├── app.js / app.json / app.wxss
│   ├── pages/{home,chat,assessment,booking,crisis}/
│   └── project.config.json  # cloud: true + AppID
└── cloudfunctions/           # 云函数后端
    ├── communities/         # 列社区
    ├── counselors/          # 跨社区咨询师池
    ├── assessment/           # 5 题问卷 + 提交
    ├── booking/             # 创建预约
    ├── crisis/               # 热线 + 检测 + 日志
    └── chat/                 # AI 倾诉 (mock)
```

---

## 费用 (云开发按量)

v0.1 demo 完全免费:
- 4 个云函数调用: 0 元 (4 以内免费)
- 2GB 数据库: 0 元 (2GB 以内免费)
- 出网带宽: 0 元 (1GB 以内免费)

Phase 2 上规模: ~30 元/月

---

## Phase 2 路线

1. 接入 AMAX AI (cloud function 用 node-fetch 调 deepseek-v3)
2. 增加咨询师实时排班 (云函数 + 定时任务)
3. WebSocket 危机广播 (云函数 + 消息推送)
4. 多社区完整上线 (5+ 社区)

---

## 现**在**你**的** **5** 步

1. ✅ AppID 已填入 project.config.json: `wx06d5e464bb5a2f41`
2. ⏳ 微信开发者工具导入
3. ⏳ 云开发开通 (新环境)
4. ⏳ 部署 5 个云函数
5. ⏳ 编译预览 + 测试

跑通后告诉我效果!
