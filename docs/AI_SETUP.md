# AI 接入配置 (deepseek-v3)

> 适用于 qi_wechat v0.2 / Phase 2 部署。  
> 完成此文档后,你的 AI 倾诉, 上下文记忆, 危机检测功能即可端到端跑通。

---

## 0. 当前 Phase 2 已完成功能

| 模块 | 状态 | 实现位置 |
|---|---|---|
| ✅ 6 心理疗法角色 prompt | 已实现 | `cloudfunctions/chat/index.js` 内 `ROLE_PROMPTS` |
| ✅ 19 关键词危机检测 | 已实现 | `cloudfunctions/chat/index.js` 内 `CRISIS_KEYWORDS` |
| ✅ 跨上下文 (最近 16 条) | 已实现 | `chat` 云函数 `history` 拼接 |
| ✅ 历史消息云端持久化 | 已实现 | 集合 `messages` |
| ✅ 历史加载 + 清空 | 已实现 | 前端 `pages/chat/chat.js` |
| ✅ 打字机效果 | 已实现 | `chat.js` `startTyping()` |
| ✅ 每日一笺 | 已实现 | `cloudfunctions/daily_tips/` |
| ⚠️ deepseek-v3 调用 | **需要 API Key** | `chat` 云函数 `callDeepseek()` |

---

## 1. 获取 deepseek API Key (5 min)

### 1.1 注册
访问 https://platform.deepseek.com → 注册账号 (用手机/邮箱都行)

### 1.2 充值
- **首次充值**: 至少 ¥10 (¥10 够用 ~5000 次对话)
- 路径: https://platform.deepseek.com/top_up → 微信/支付宝扫码

### 1.3 创建 API Key
- 路径: https://platform.deepseek.com/api_keys
- 点击 **"创建新 key"**
- 名字: `qi_wechat`
- **复制 key**: 形如 `sk-xxxxxxxxxxxxxxxx` (约 35 字符)
- ⚠️ **只能创建时看一次**, 关掉页面就再也看不到!

### 1.4 价格 (deepseek-v3)
- 输入: 1¥ / 百万 tokens
- 输出: 2¥ / 百万 tokens
- 一次倾诉聊天 ≈ 800-1500 tokens → 大约 ¥0.002-0.005

---

## 2. 配置到云函数 (1 min, 最重要!)

### 2.1 打开微信开发者工具

### 2.2 顶部菜单 → "云开发" → 你的环境 (`qi-wechat-dev-d7gxd20xreb567ce2`)

### 2.3 左侧菜单 → "设置" → "环境变量" (或顶 tab "云函数配置")

### 2.4 添加环境变量

| 变量名 | 变量值 | 说明 |
|---|---|---|
| `DEEPSEEK_API_KEY` | `sk-xxxxxx` (你刚创建) | deepseek 鉴权 key |

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

⚠️ **如果报错** 看到类似:
```
[chat] deepseek fail: deepseek 401: ...
```
→ 检查步骤 2.4 的 `DEEPSEEK_API_KEY` 是否正确(检查首尾有没有空格)

⚠️ **如果报错** 看到:
```
DEEPSEEK_API_KEY not set in cloud env
```
→ 必须重新部署 chat 云函数 (步骤 3.1)

### 4.2 测试 daily_tips

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

## 7. 故障排查

| 症状 | 原因 | 解决 |
|---|---|---|
| `DEEPSEEK_API_KEY not set` | 没配环境变量, 或没重新部署 | 步骤 2.4 + 3.1 |
| `deepseek 401: ...` | Key 错误或过期 | 重新创建 key |
| `deepseek 402: ...` | 余额不足 | 充值 ¥10+ |
| `TypeError: Cannot read property 'fetch'` | 老版 wx-server-sdk | 升级或重装依赖 |
| AI 回复慢 (>5s) | 网络问题 | 切到云函数本地调试查看日志 |
| 没看到打字机 | setData 太快, 看不到 mid | 改 step = ceil(len/100) |

---

## 8. 下一步可选优化 (留给你)

- [ ] **流式输出** (真正的 streaming) — deepseek 支持 SSE, 可让 AI 一边生成一边显示
- [ ] **语音输入** — 微信 wx.cloud.io + 腾讯云 ASR
- [ ] **记忆总结** — 每 50 条压缩一次历史, 节省 token
- [ ] **多语言** — 切换英文 prompt, 服务留学生社区
- [ ] **督导介入** — 当危机时自动通知区域经理

---

**最后**: 配置完成后, 你和你的体验者就能用上完整版倾诉功能了。  
如果你遇到任何问题, 把云函数日志 (顶部"云开发"→"日志"→"函数日志"→ chat 的报错) 发给我。
