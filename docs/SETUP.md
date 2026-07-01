# 祺臻心理 微信小程序 — 测试号配置 + 本地部署指南

> 适用: v0.1 demo, 个人用户 (无公司资质)
> 时间: 2026-06-30

---

## 阶段 1: 注册微信小程序测试号 (5 min)

### 1.1 什么是测试号
- 个人**无需**营业执照 / 公司资质
- 微信官方提供的"沙盒账号", 用于开发测试
- **限制**:
  - 只能让 20 个微信用户扫码体验
  - 不能发布正式版 (上线审核需要企业)
  - 功能完整, 仅限体验

### 1.2 获取测试号 AppID + AppSecret

1. 浏览器打开: https://developers.weixin.qq.com/miniprogram/dev/devtools/appid.html
2. 微信扫码登录
3. 申请 "测试号" (不需企业认证)
4. 系统会显示:
   - **AppID**: 类似 `wx7c8d9e0f1a2b3c4d` (16 字符)
   - **AppSecret**: 类似 `7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3` (32 字符)
5. **保存** AppID + AppSecret (下一步用)

### 1.3 配置小程序服务器域名 (开发期)

测试号默认**不**允许访问任何外部域名。开发期勾选 "不校验合法域名" 即可:

1. 打开微信开发者工具
2. 详情 → 本地设置 → 勾选 "不校验合法域名、Web-view、TLS 版本以及 HTTPS 证书"
3. 这样 `http://127.0.0.1:8765` 才能被访问

> 注: 正式上线 (Phase 2) 必须用 HTTPS + 备案域名

---

## 阶段 2: 本地后端 (FastAPI)

### 2.1 启动 (5 min)

```powershell
# 假设你已经在 qi_wechat/ 目录
cd backend

# 安装依赖 (1 次)
python -m pip install -r requirements.txt

# 启动后端
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8765 --reload
```

看到 `Uvicorn running on http://127.0.0.1:8765` 就 OK 了

### 2.2 健康检查

打开浏览器: http://127.0.0.1:8765/api/health

应该看到: `{"ok":true,"ts":"iso_now"}`

Swagger UI: http://127.0.0.1:8765/docs

---

## 阶段 3: 微信开发者工具 (10 min)

### 3.1 下载安装

https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

(Windows 64 / Mac)

### 3.2 创建小程序项目

1. 打开微信开发者工具
2. 选 "小程序" → "导入项目"
3. 项目目录: `qi_wechat/miniprogram/`
4. AppID: 粘贴你测试号的 AppID
5. 项目名称: `祺臻心理`
6. 后端服务: 选 "小程序·云开发" 或 "不使用云服务"
7. 点 "导入"

### 3.3 修改 app.js 配置

打开 `qi_wechat/miniprogram/app.js`, 修改:

```js
globalData: {
    api_base: "http://127.0.0.1:8765",  // 改成你的后端地址
    // ...
}
```

### 3.4 编译 + 预览

1. 工具栏点 "编译" (Ctrl+B)
2. 应该看到主页 (hero + 4 入口 + 社区列表)
3. 工具栏点 "预览" (二维码)
4. 用你的微信扫码 → 体验版小程序就在你手机

> 注: 测试号限制 20 个体验者, 但你自己的微信一定在

---

## 阶段 4: 本地调试 (10 min)

### 4.1 测试场景

**主页 → 选社区**:
- 应该看到 5 个社区 (mock 数据, 即使后端不通)
- 点社区卡片 → 高亮 + Toast

**测试 AI 倾诉** (chat page):
- v0.1 占位, 还没接 AI

**测试预约** (booking page):
- v0.1 占位

**测试危机** (crisis page):
- v0.1 占位, 应该看到热线卡片

### 4.2 Network 面板调试

在微信开发者工具:
- 上方 "工具" → "调试器" → "Network" 标签
- 看你请求的是否真的命中 backend 路径

---

## 阶段 5: 后续 (Phase 2)

### 5.1 ngrok 暴露后端

如果想让别人扫码访问 (不只是你):

```powershell
# 下载 ngrok
# https://ngrok.com/download

ngrok http 8765
```

输出类似:
```
Forwarding: https://abc-123-456.ngrok.io -> http://127.0.0.1:8765
```

然后 app.js 里:
```js
api_base: "https://abc-123-456.ngrok.io"
```

> 但微信开发者工具**不**接受 ngrok 的 HTTPS 证书
> 更优方案: cloudflare tunnel (免费 HTTPS)

### 5.2 备案 + 上线 (正式版, 月级)

1. 注册公司 (或个人工商户)
2. 微信小程序注册 (https://mp.weixin.qq.com)
3. ICP 备案
4. 域名 HTTPS
5. 上传代码 + 微信审核 (1-7 天)

---

## 阶段 6: 常见问题

### Q1: 编译时 "不在以下 request 合法域名列表中"

测试号默认限制。
→ 工具 → 详情 → 本地设置 → 勾选 "不校验合法域名"

### Q2: 真机调试空白

→ 检查 console.log, 看是不是后端不通
→ 检查 app.js 的 api_base 是不是真的对

### Q3: 后端日志

启动时 `--log-level info` 看请求 / 响应

### Q4: 数据库路径

`qi_wechat/qi_dev.db` (SQLite, 删了自动重建)

### Q5: 测试号 20 个体验者满

→ 删除测试号重新申请 (同微信号 24h 内只能 1 次)

---

## 当前阶段 v0.1 (本次)

- ✅ 后端 FastAPI 跑通 (uvicorn 8765)
- ✅ 5 个 mock endpoints 全 200 OK
- ✅ 小程序 5 page WXML/WXSS 已写
- ✅ 仓库已推 GitHub
- ❌ 微信开发者工具导入测试 (你来做, 需微信)

---

## 推荐下一步 (按优先级)

| 步骤 | 时间 | 谁做 |
|---|---|---|
| 1. 下载微信开发者工具 | 2 min | 你 |
| 2. 注册测试号拿 AppID | 2 min | 你 |
| 3. 修改 app.js api_base | 1 min | 你 |
| 4. 导入项目编译预览 | 5 min | 你 |
| 5. 测 5 个 page | 5 min | 你 |

总计 15 分钟, 你就能在自己手机看到小程序跑起来!
