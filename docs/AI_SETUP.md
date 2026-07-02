# AI 接入配置 (AMAX OpenAI 兼容 API)

> 适用于 qi_wechat v1.0 / Phase 2 部署。  
> 支持 **AMAX** (默认) 和 **DeepSeek** 两个 provider, 通过环境变量切换。

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
| ⚠️ LLM 调用 | **需要 API Key** | `chat` 云函数 `callLLM()` (OpenAI 兼容) |

---

## 1. 获取 AMAX API Key (推荐, ~3 min)

### 1.1 注册 + 充值

- 访问 AMAX 控制台 (联系管理员获取入口 URL)
- 充值: ¥10-¥100 (按用量)

### 1.2 创建 API Key

- 创建 key, 名字 `qi_wechat`
- 复制: `sk-xxxxxxxxxxxxxxxx`
- ⚠️ **只能创建时看一次!**

### 1.3 AMAX API 文档摘要

| 项 | 值 |
|---|---|
| Base URL | `https://ai.amaxsmp.com/v1` |
| 鉴权 | `Authorization: Bearer sk-xxx` |
| 模型 | `amax-router` (智能路由, 平台自动选模型) |
| 请求格式 | OpenAI Chat Completions 兼容 |

**Python 示例** (来自 AMAX 文档):
```python
from openai import OpenAI
client = OpenAI(
    api_key="sk-your-api-key",
    base_url="https://ai.amaxsmp.com/v1"
)
response = client.chat.completions.create(
    model="amax-router",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "请用一句话介绍 Amax Router."}
    ]
)
print(response.choices[0].message.content)
```

我们的云函数就是 Node.js 等价实现。

---

## 2. 配置到云函数 (1 min, 最重要!)

### 2.1 微信开发者工具

### 2.2 顶部菜单 → "云开发" → 你的环境 (`qi-wechat-dev-d7gxd20xreb567ce2`)

### 2.3 左侧菜单 → "设置" → "环境变量"

### 2.4 添加环境变量

**默认配置 (AMAX)** — 只需要一个:

| 变量名 | 变量值 | 说明 |
|---|---|---|
| `AMAX_API_KEY` | `sk-xxxxxx` | AMAX 鉴权 key |

**可选配置** — 想换 provider / 模型时:

| 变量名 | 默认值 | 说明 |
|---|---|---|
| `AI_PROVIDER` | `amax` | 留空即用默认 amax |
| `AI_HOSTNAME` | `ai.amaxsmp.com` | 留空即用默认 |
| `AI_PATH` | `/v1/chat/completions` | 留空即用默认 |
| `AI_MODEL` | `amax-router` | 留空即用默认 |

**切换到 DeepSeek** 时:
| 变量名 | 变量值 |
|---|---|
| `AI_PROVIDER` | `deepseek` |
| `AI_HOSTNAME` | `api.deepseek.com` |
| `AI_MODEL` | `deepseek-chat` |
| `DEEPSEEK_API_KEY` | `sk-deepseek-xxx` |

### 2.5 保存

---

## 3. 重新部署 chat 云函数 (必须!)

环境变量是云函数运行时才读取的, **必须重新部署 chat** 才生效。

### 3.1 在微信开发者工具里

左侧项目树 → **右键** `cloudfunctions/chat/` → **"创建并部署: 云端安装依赖"**

等 30s-2min, 看到 "部署成功" 完成。

### 3.2 同时部署新增的 daily_tips

左侧 → 右键 `cloudfunctions/daily_tips/` → "创建并部署"

---

## 4. 验证

### 4.1 测试 chat

1. 微信开发者工具 → 顶部 "预览" → 扫码
2. 在手机上打开"祺臻心理" → 点击 tab "倾诉"
3. 输入任意话 (例如 "我最近睡不好")
4. 应该看到:
   - 6 个角色选择 (叙事/CBT/人本/ACT/积极/焦点)
   - 打字机效果 (看到 `▌` 光标)
   - AI 用叙事治疗师语气回复

### 4.2 故障排查

⚠️ **如果报错** 看到类似:
```
[chat] amax no choices: ...
```
或:
```
amax HTTP 401: ...
```
→ 检查环境变量 `AMAX_API_KEY` 是否正确 (检查首尾有没有空格)

⚠️ **如果报错**:
```
AMAX_API_KEY not set in cloud env (provider=amax)
```
→ 必须重新部署 chat 云函数 (步骤 3.1)

⚠️ **如果报网络错误**:
```
amax HTTP 5xx: ...
```
→ AMAX 服务端问题, 等几分钟再试

### 4.3 测试 daily_tips

1. 进入首页 (tab "首页")
2. 应该看到 "✨ 今日一笺" 卡片, 显示一条心理常识

---

## 5. 进阶调参 (可选)

### 5.1 切换角色

用户在倾诉页顶部, 点任意角色 chip 即可切换。默认叙事 (Narrative Therapy), 适合泛化场景。

### 5.2 测试危机检测

在倾诉页输入包含以下词的话:
- "我不想活了"
- "想自杀"
- "觉得没意义"
- "想跳楼"

应该看到:
1. AI 不再接倾诉, 直接给危机热线
2. 微信弹 modal "我们很关心你"
3. 自动跳转到 crisis 页面

### 5.3 清除历史 (隐私)

倾诉页右上角"清空"按钮, 一键清空所有历史(云端 + 客户端)

---

## 6. 安全提示

- ✅ **Key 永远不会出现在前端代码** (在云函数环境变量)
- ✅ **OPENID 是微信内置, 云函数拿到的** — 用户不需要登录
- ✅ 历史消息按用户隔离 (`user_id` 字段)
- ⚠️ 真上线时建议加"消息 30 天后自动删除"(云函数定时器)
- ⚠️ PRD 7.1 合规: 当前 demo 不脱敏, 上线前必须做

---

## 7. Provider 切换对照表

| Provider | AI_PROVIDER | AI_HOSTNAME | AI_MODEL | 环境变量 Key |
|---|---|---|---|---|
| **AMAX (默认)** | (留空) `amax` | `ai.amaxsmp.com` | `amax-router` | `AMAX_API_KEY` |
| DeepSeek | `deepseek` | `api.deepseek.com` | `deepseek-chat` | `DEEPSEEK_API_KEY` |
| 任意 OpenAI 兼容 | 自定义 | 自定义 | 自定义 | 自定义 |

切换流程: 改环境变量 → 重新部署 chat 云函数 → 完成。

---

## 8. 故障排查速查表

| 症状 | 原因 | 解决 |
|---|---|---|
| `AMAX_API_KEY not set` | 没配环境变量, 或没重新部署 | 步骤 2.4 + 3.1 |
| `amax HTTP 401` | Key 错误或过期 | 重新创建 key |
| `amax HTTP 402` | 余额不足 | 充值 |
| `amax HTTP 429` | 请求过快 | 加 retry 间隔 |
| `TypeError: Cannot read property 'fetch'` | (v1.0 已修) Node https 模块替换 | 升级代码 |
| AI 回复慢 (>5s) | 网络问题 | 切到云函数本地调试查看日志 |
| 没看到打字机 | setData 太快 | 改 step = ceil(len/100) |

---

## 9. 下一步可选优化 (留给你)

- [ ] **流式输出** (真正的 SSE streaming) — amax-router 支持
- [ ] **语音输入** — 微信 wx.cloud.io + 腾讯云 ASR
- [ ] **记忆总结** — 每 50 条压缩一次历史, 节省 token
- [ ] **多语言** — 切换英文 prompt, 服务留学生社区
- [ ] **督导介入** — 当危机时自动通知区域经理

---

**最后**: 配置完成后, 你和你的体验者就能用上完整版倾诉功能了。  
如果你遇到任何问题, 把云函数日志 (顶部"云开发"→"日志"→"函数日志"→ chat 的报错) 发给我。