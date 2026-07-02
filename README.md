# 祺臻心理 · 微信小程序 (qi_wechat)

> 基于微信云开发的多社区心理小程序。  
> 5 大社区协同 + AI 倾诉(6 角色)+ 心理测评 + 跨社区预约 + 24h 危机热线。

---

## 项目状态

- ✅ **Phase 1**: 云开发基础架构 (6 个云函数 + 5 个 page + 体验版可扫码)
- ✅ **Phase 2**: AI 接入 (deepseek-v3 + 6 心理疗法角色 + 19 关键词危机 + 上下文记忆)
- ⏳ Phase 3: 跨社区协同 (待规划)
- ⏳ Phase 4: 咨询师 App (待规划)
- ⏳ Phase 5: 区域经理后台 + 督导后台 (待规划)

## 文档

| 文档 | 内容 |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 总体架构 (FastAPI 时代, 仅历史) |
| [docs/CLOUD_SETUP.md](docs/CLOUD_SETUP.md) | 云开发开通 + 集合创建 |
| [docs/WECHAT_DEVTOOL_GUIDE.md](docs/WECHAT_DEVTOOL_GUIDE.md) | 微信开发者工具图文流程 |
| [docs/SETUP.md](docs/SETUP.md) | 项目部署 |
| **docs/AI_SETUP.md** ⭐ | **AI 接入配置 (AMAX / DeepSeek)** |

## Phase 2 快速开始

```bash
# 1. 获取 AMAX API key

# 2. 微信开发者工具 → 云开发 → 设置 → 环境变量
#    AMAX_API_KEY = sk-your-key

# 3. 重新部署 chat 云函数
#    左键 cloudfunctions/chat → 右键 → 创建并部署: 云端安装依赖

# 4. 同时部署新增的 daily_tips

# 5. ctrl+B 编译 → 体验版 → 手机扫码测试
```

详细: [docs/AI_SETUP.md](docs/AI_SETUP.md)

---

## 技术栈

- **微信小程序** (WXML/WXSS/JS, 不用任何框架)
- **云函数** (Node.js 18, wx-server-sdk)
- **云数据库** (微信云开发, 5 集合: users / messages / assessments / bookings / crisis_logs + daily_tips_logs)
- **AI** (AMAX OpenAI 兼容 API / DeepSeek, 路由模型 amax-router)

## 项目结构

```
qi_wechat/
├── cloudfunctions/
│   ├── chat/            # AI 倾诉 (6 角色 + 危机 + 上下文)
│   ├── communities/     # 5 社区列表
│   ├── counselors/      # 10 老师
│   ├── assessment/      # 心理测评
│   ├── booking/         # 预约
│   ├── crisis/          # 危机热线
│   └── daily_tips/      # 每日一笺 (60 条心理常识)
├── miniprogram/         # 5 page + 入口 index
│   ├── pages/{home,chat,assessment,booking,crisis}/
│   ├── images/          # 10 个 tabBar 图标
│   ├── app.js
│   ├── app.json
│   └── app.wxss
├── docs/                # 5 文档
├── tools/
│   └── make_icons.py    # tabBar 图标生成器
├── project.config.json  # 微信开发者工具项目配置
└── package.json         # (空)
```

## 6 心理疗法角色 (chat 云函数)

- 📖 **叙事治疗** — 通过重写生命故事找到力量 (默认)
- 🧠 **CBT** — 识别自动化思维, 重构认知偏差
- 🤝 **人本主义** — 共情无条件积极关注
- 🌊 **ACT** — 接纳痛苦, 行动价值观
- 🌻 **积极心理学** — 培养 PERMA 五要素
- ⚡ **赋权 + SFBT 焦点解决** — 短程焦点

## 19 关键词危机检测

`不想活 / 自杀 / 轻生 / 想死 / 活不下去 / 结束生命 / 自残 / 割腕 / 跳楼 / 上吊 / 服药过量 / 绝望 / 没意义 / 没人需要我`

命中后:
1. 不接倾诉, 直接给 24h 热线 (400-161-9995)
2. 写 `crisis_logs` 集合
3. 前端跳转到 crisis 页

## AppID & 云环境

- AppID: `wx06d5e464bb5a2f41` (测试号)
- 云环境 ID: `qi-wechat-dev-d7gxd20xreb567ce2`
- 体验版: 已发布 (微信扫码)
- 正式版: 待提交审核 (PRD 7.1 合规未做完)

---

## License

MIT (c) Dechang Yu @ XJTLU Academy of AI, 2026
