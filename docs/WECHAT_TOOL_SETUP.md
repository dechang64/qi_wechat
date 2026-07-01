# qi_wechat APK 打包 + 微信开发者工具配置 — 实战手册

> v0.1 demo 完整流程: 5 步拿到你手机可扫码测试的小程序

---

## Step 1: 下载微信开发者工具 (2 min)

1. 浏览器打开: https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
2. 下载 **微信开发者工具** (Windows 64 / Mac)
3. 安装 (一路 Next)

## Step 2: 注册小程序测试号 (2 min)

1. 浏览器打开: https://developers.weixin.qq.com/miniprogram/dev/devtools/appid.html
2. 微信扫码登录
3. 申请 "测试号" (无需营业执照)
4. 系统给:
   - **AppID**: 类似 `wx7c8d9e0f1a2b3c4d` (复制)
   - **AppSecret**: 类似 `7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3` (复制)

## Step 3: 导入项目 (3 min)

打开微信开发者工具:
1. 左上角 "小程序" → "导入项目" (或 "+" → "导入项目")
2. 填:
   - **项目目录**: `C:\Users\decha\.mavis\agents\mavis\workspace\qi_wechat\miniprogram\`
   - **AppID**: 粘你刚才的 AppID
   - **项目名称**: `祺臻心理`
   - **开发模式**: 选 "小程序"
   - **后端服务**: 选 "不使用云服务"
3. 点 "导入" — 工具会扫项目文件

## Step 4: 修改 app.js 配置 + 关闭域名校验 (3 min)

### 4.1 编辑 `app.js`

工具会自动打开项目根目录的代码编辑器。找到 `app.js`:

```js
globalData: {
    // 改成 http://127.0.0.1:8765 (你的后端)
    // 或者用你电脑局域网 IP (手机扫码访问): http://192.168.x.x:8765
    api_base: "http://127.0.0.1:8765",
    // ...
}
```

**保存** (Ctrl+S)

### 4.2 关闭域名校验

工具栏 → "详情" → "本地设置" → 勾选:
- ☑ "不校验合法域名、web-view (业务域名)、TLS 版本以及 HTTPS 证书"

否则小程序拒绝访问 http:// (你的后端是 http 不是 https)

## Step 5: 启动后端 + 编译预览 (3 min)

### 5.1 后端 (你应该已经启动了)

PowerShell 另开窗口:
```powershell
cd C:\Users\decha\.mavis\agents\mavis\workspace\qi_wechat
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8765 --reload
```

(注意 `--host 0.0.0.0` 让手机也能访问)

应该看到:
```
INFO:     Uvicorn running on http://0.0.0.0:8765
INFO:     Application startup complete.
```

### 5.2 编译 + 真机预览

1. 工具栏点 **"编译"** (Ctrl+B)
   - 应看到模拟器显示主页: 4 个入口 + 5 个社区 (mock 数据)
2. 工具栏点 **"预览"** (二维码图标)
   - 弹出 QR 码
   - 用微信扫码 — 小程序加载到你手机

### 5.3 让手机能访问到电脑后端 (关键)

如果手机扫码后空白 / 加载失败:

- 你手机和电脑要在**同一个 WiFi**
- 改 `app.js` 的 `api_base` 为 `http://192.168.x.x:8765` (你电脑局域网 IP)
- 关 **Windows 防火墙** 或允许 8765 端口

查看电脑 IP:
```powershell
ipconfig | Select-String "IPv4"
```

---

## Step 6 (可选): 真机调试

工具栏 "真机调试" → 二维码 → 扫码
- 能在 **手机** 看到 console.log
- 可以打断点 (DevTools 风格)

---

## Step 7: 测试场景 (5 min)

手机端验证 5 个 page:

| Page | 操作 | 期望 |
|---|---|---|
| **home** | 点页面, 选社区 | 5 个社区, 点击后蓝色高亮 + Toast |
| **chat** | 输入"今天心情不好" | bot 回复 "谢谢你告诉我. 能再具体一点吗?" |
| | 输入"我最近很累, 不想活了" | 弹模态框 "我们很关心你", 跳到 crisis page |
| **assessment** | 5 题选项 (每题必须选) | 进度条前进, 提交后看 result 卡片 |
| | 选 q5=3 (强烈) | result 显示 "建议立即寻求专业帮助" (urgent) |
| **booking** | 选社区 → 选老师 → 选时段 → 留手机号 → 确认 | 4 步流程, 完成页 |
| **crisis** | 点 12320-5 卡片 | 弹模态框 "确认拨打", wx.makePhoneCall 触发拨号 |

---

## Step 8 (可选): 体验版二维码

工具栏 "上传" → "上传为体验版"
- 会生成二维码
- 你的微信号扫码 → 进入体验版小程序
- 限制: 测试号 20 个体验者

---

## Step 9 (Phase 2, 公司资质后):

1. 注册公司 (或个人工商户)
2. 微信小程序注册 (https://mp.weixin.qq.com)
3. ICP 备案 (你后端的域名)
4. 后端 HTTPS (let's encrypt / cloudflare)
5. 上传审核

整**个** v0.1 → v1.0 升级流程: 1 个月

---

## 常见问题

### Q: "不在以下 request 合法域名列表中"

→ Step 4.2 没勾选 "不校验合法域名"
→ 或是你上线了正式版, 真机需 HTTPS

### Q: 后端访问不到

→ 检查 uvicorn 启动用了 `--host 0.0.0.0` (默认是 127.0.0.1, 局域网点不通)
→ 检查 Windows 防火墙: `netsh advfirewall firewall add rule name="qi_wechat" dir=in action=allow protocol=TCP localport=8765`
→ 检查手机 WiFi 同网

### Q: 选了社区但 mock 数据 + 没后端

→ app.js 的 api_base 填错了
→ 或后端跑挂了, 看 uvicorn 控制台

### Q: 怎么生成 APK? (正式版需要)

**APK 这个概念对小程序不适用**:
- 小程序**不是** Android app
- **没有 APK / IPA 文件**
- 用户**不下载安装**, 直接微信扫码 / 搜索即开

如果你**真要** APK (比如社区活动中心老人不会扫码):
- 选 "小程序" → 找外包做 "webview 套壳" → 生成 Android APK
- 但这样体验差, 不推荐
- v0.1 / demo 阶段用真机扫码就够了

---

## 现在就动手 (5 min 跑起来)

1. ✅ 后端已经启动 (http://127.0.0.1:8765 健康)
2. ✅ miniprogram/ 已经在 C:\Users\decha\.mavis\agents\mavis\workspace\qi_wechat\
3. ⏳ 你需要做: 下载微信开发者工具 + 注册测试号 + 导入项目
4. ⏳ 修改 app.js api_base
5. ⏳ 真机预览扫码

跑通后告诉我, 我帮你:
- 看 demo 实际效果
- 决定下一步 (Phase 2 接入 AMAX AI chat / 真实场景测试)
- 写 backend 部署到云 (云函数 / 阿里云 ECS)
