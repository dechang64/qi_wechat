# AI 接入配置 (腾讯云 CloudBase 内置 AI - 混元 hy3-preview)

> 适用于 qi_wechat v2.0 / Phase 2 部署。  
> 使用 **腾讯云 CloudBase 内置 AI 能力**, **不依赖外部 API Key**, 不踩网络出口坑。

---

## 0. 当前 Phase 2 已完成功能

| 模块 | 状态 | 实现位置 |
|---|---|---|
| ✅ 6 心理疗法角色 prompt | 已实现 | `cloudfunctions/chat/index.js` 内 `ROLE_PROMPTS` |
| ✅ 19 关键词危机检测 | 已实现 | `cloudfunctions/chat/index.js` 内 `CRISIS_KEYWORDS` |
| ✅ 跨上下文 (最近 16 条) | 已实现 | `chat` 云函数 `history` 拼接 |
| ✅ 历史消息云端持久化 | 已实现 | 集合 `messages` |
| ✅ 历史加载 + 清空 | 已实现 | 前端 `pages/chat/chat.js` |
| ✅ 打字机效果 | 已实现 | `chat.js` `_startTyping()` |
| ✅ 每日一笺 | 已实现 | `cloudfunctions/daily_tips/` |
| ✅ **LLM 调用** | **已配置, 即开即用** | `chat` 云函数 `callLLM()` (cloudbase.AI) |

---

## 1. 默认模型: 腾讯混元 hy3-preview

### 1.1 为什么选混元

- ✅ **CloudBase 内置** — 不依赖外部 API, 不踩网络出口坑
- ✅ **中文能力顶级** — 腾讯混元是中文 LLM 第一梯队
- ✅ **心理咨询场景适配** — 中文表达力强, 共情好
- ✅ **已默认启用** — CloudBase 后台已开启 hy3-preview (个人版)
- ✅ **无需配置 API Key** — CloudBase 自动鉴权

### 1.2 价格 (按用量)

| 档位 | 输入 (元/千 token) | 输出 (元/千 token) |
|---|---|---|
| 0-16k | 1.2 | 4 |
| 16-32k | 1.6 | 6.4 |
| 32k+ | 2 | 8 |

> 体验版用户量小, 每月成本通常 < ¥10

---

## 2. 切换其他模型 (可选)

`callLLM()` 通过环境变量 `AI_MODEL` 切换, 支持 CloudBase 所有可用模型:

```bash
# 默认 (混元)
AI_MODEL = hunyuan-pro

# 其他备选
AI_MODEL = hunyuan-standard        # 混元标准版 (更便宜)
AI_MODEL = hunyuan-lite            # 混元 lite (最快)
AI_MODEL = qwen3.5-flash           # 通义千问 (需开通套餐)
AI_MODEL = deepseek-v4-flash       # DeepSeek (需开通套餐)
```

**配置方式**: 云开发控制台 → 云函数 → chat → 配置 → 环境变量 → 添加 `AI_MODEL`

---

## 3. 调用流程

```
前端 chat.js
  ↓ wx.cloud.callFunction({ name: "chat" })
chat 云函数
  ↓ cloud.extend.AI.createModel("hunyuan-pro").chatText({ messages })
腾讯混元 (CloudBase 内置)
  ↓ 流式或一次性返回
chat 云函数 (拼装历史 + 写 messages 集合)
  ↓ 返回 { ok, data: { content, role_used, crisis } }
前端 chat.js (打字机展示 + 危机跳转)
```

---

## 4. 故障排查速查表

| 现象 | 原因 | 解决 |
|---|---|---|
| `model not found` | `AI_MODEL` 拼写错 | 改成 `hunyuan-pro` |
| `permission denied` | 模型未启用 | CloudBase 控制台 → AI → 启用对应模型 |
| `quota exceeded` | 免费额度用完 | 充值或切换到免费模型 |
| `timeout 60s` | 长上下文超时 | 把 `执行超时` 改 120s |
| 一直 `[离线] fallback` | chat 云函数没部署新代码 | 微信开发者工具 → 右键 chat → 上传并部署 |

---

## 5. 为什么不用外部 API (AMAX / DeepSeek)

v1.0 时用了 AMAX OpenAI 兼容 API, 但实际部署发现:

- ❌ **微信云函数默认封了外部 https 出口** — AMAX/DeepSeek API 调不通
- ❌ **需要固定出口 IP + AMAX 后台白名单** — 配置繁琐
- ❌ **AMAX `amax-router` 路由慢** — 经常超时
- ✅ **腾讯云 CloudBase 内置 AI** — 不踩坑, 中文本土, 稳定

**结论**: 对**小程序云开发场景**, CloudBase 内置 AI 是更优解。AMAX 适合自建服务器 / 非微信云环境。