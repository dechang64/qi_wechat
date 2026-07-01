# 祺臻心理 微信小程序 (qi_wechat) v0.1 — 架构

## 系统架构

```
┌─────────────────────────────────────────────────────────┐
│  微信 (用户)                                              │
│  ┌──────────────────────────────────────────────────┐    │
│  │  qi_wechat 小程序 (WXML + WXSS + JS)              │    │
│  │  - 主页 / 倾诉 / 评估 / 预约 / 危机              │    │
│  │  - wx.request → 后端                              │    │
│  └──────────────────────┬───────────────────────────┘    │
└─────────────────────────┼────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────┐
│  FastAPI 后端 (Python 3.11)                              │
│  ┌──────────┬──────────┬──────────┬──────────┐        │
│  │ community │assessment │ booking  │ crisis   │        │
│  ├──────────┼──────────┼──────────┼──────────┤        │
│  │ counselor │   ai_chat  │ auth  │  upload  │        │
│  └──────────┴──────────┴──────────┴──────────┘        │
│       │                          │                      │
│       ▼                          ▼                      │
│  ┌──────────┐              ┌──────────┐                │
│  │ SQLite   │              │ AMAX  AI │                │
│  │ (dev)    │              │ (云端 LLM) │                │
│  └──────────┘              └──────────┘                │
└─────────────────────────────────────────────────────────┘

未来扩展:
- 阿里云 RDS (生产数据库)
- 阿里云 OSS (病历 + 录音)
- Dify / Coze (AI 工作流)
- EMQX (WebSocket 危机推送)
```

## 业务流程 (5 阶段)

### 1. 主页 (home)
```
[祺臻 logo]
[找咨询师] [简单聊聊] [心理测试] [紧急]
```

### 2. 倾诉 (chat)
```
用户输入 → 后端 AMAX chat → 流式输出
本地存最近 10 轮
危机词检测 → 转 crisis 页面
```

### 3. 评估 (assessment)
```
5 题问卷 (滑动翻页)
1. 最近 2 周心情 2. 睡眠 3. 食欲 4. 社交 5. 危险念头
得分 → 建议 (低/中/高)
高分 → 转 crisis
```

### 4. 预约 (booking)
```
选社区 → 选咨询师 → 选时段 → 留手机 → 确认
→ 后端 booking 工单
→ 短信通知咨询师 (Phase 2)
```

### 5. 危机 (crisis)
```
[24h 心理热线卡片] (12320-5 等)
[一键拨号]
[联系咨询师]
```

## 多社区协同 (Phase 2)

| 模块 | 实现 |
|---|---|
| 社区列表 | 后端 /community/list |
| 跨社区咨询师池 | 后端合并 5 社区的 counselors |
| 预约合并 | 后端按 (community, time) 联合查询 |
| 危机广播 (Phase 3) | WebSocket 推送到在线咨询师 + 督导 |

## 数据模型 (简)

```
User        (id, wx_openid, nickname, avatar, phone)
Community   (id, name, address, hotline)
Counselor   (id, name, community_id, specialties, slots)
Booking     (id, user_id, counselor_id, time, status)
Assessment  (id, user_id, score, answers_json, created_at)
CrisisLog   (id, user_id, keywords, action, counselor_resp)
Message     (id, user_id, role, content, created_at)  # AI 对话
```

## 开发节奏 (1 周 MVP)

| 天 | 内容 |
|---|---|
| Day 1-2 | FastAPI + SQLite + 5 个 route 的 happy path |
| Day 3 | 主页 + 倾诉 + AI 集成 |
| Day 4 | 评估 5 题 + 危机关键词 |
| Day 5 | 预约 UI + 跨社区 mock |
| Day 6-7 | 测试 + 注册测试号 + 微信开发者工具跑通 |
