// app.js — 云开发版
App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error("wx.cloud 不可用, 请检查 app.json 是否含 cloud: true");
      return;
    }
    // 显式指定云开发环境 ID
    wx.cloud.init({
      env: "qi-wechat-dev-d7gxd20xreb567ce2",
      traceUser: true,
    });

    console.log("[qi_wechat] cloud inited, env=qi-wechat-dev-d7gxd20xreb567ce2");

    // 微信登录 — 取一次 code, 触发云端 session (仅在用户首次进入时)
    // 云函数可通过 cloud.getWXContext().OPENID 拿到用户身份, 不必保存 code
    wx.login({
      success(res) {
        if (res.code) {
          console.log("[qi_wechat] login code (transient):", res.code.slice(0, 8) + "...");
        }
      },
    });

    // 读取本地 user profile
    const cached = wx.getStorageSync("user_profile");
    if (cached) {
      this.globalData.user = cached;
    }

    // P0-5: 强制手机号注册 (视频 3 反馈)
    // 首次进入未授权, 标记 needsPhoneAuth
    // 拦截在 home 页 onShow 触发弹窗
    if (!wx.getStorageSync("phone_authorized")) {
      this.globalData.needsPhoneAuth = true;
    }
  },

  // P0-5: 标记用户已授权手机号
  markPhoneAuthorized(phoneInfo) {
    wx.setStorageSync("phone_authorized", true);
    if (phoneInfo) {
      wx.setStorageSync("phone_info", phoneInfo);
    }
    this.globalData.needsPhoneAuth = false;
  },

  // 全局数据 (云开发 — 不再需要 api_base)
  globalData: {
    user: null,
    selected_community: null,
    selected_counselor: null,
    cloud_env_id: "qi-wechat-dev-d7gxd20xreb567ce2",
    // P0-5: 是否需要强制手机号注册
    needsPhoneAuth: false,
  },

  // 云函数调用 helper (统一错误处理)
  async callFunction(name, data = {}) {
    try {
      const options = { name, data };
      if (this.globalData.cloud_env_id) {
        options.config = { env: this.globalData.cloud_env_id };
      }
      const res = await wx.cloud.callFunction(options);
      if (res.result && res.result.code !== undefined) {
        if (res.result.code !== 0) {
          return { ok: false, message: res.result.message || "云函数错误" };
        }
      }
      return { ok: true, data: res.result };
    } catch (e) {
      console.error(`[callFunction ${name}]`, e);
      return { ok: false, message: e.message || "网络异常" };
    }
  },
});


