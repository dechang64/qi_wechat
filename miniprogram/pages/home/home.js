// pages/home/home.js — 云开发版 + v0.3.0 反馈 P0-5
const app = getApp();

Page({
  data: {
    communities: [],
    selected_community: "",
    dailyTip: "",
    // P0-5: 手机号授权遮罩
    showPhoneAuth: false,
  },

  onLoad() {
    this.loadCommunities();
    this.loadDailyTip();
    const last = wx.getStorageSync("selected_community");
    if (last) this.setData({ selected_community: last });
  },

  onShow() {
    // P0-5: 检查是否需要手机号授权
    if (!wx.getStorageSync("phone_authorized")) {
      this.setData({ showPhoneAuth: true });
    } else {
      this.setData({ showPhoneAuth: false });
    }
  },

  // P0-5: 用户授权手机号回调
  onGetPhone(e) {
    if (e.detail.errMsg === "getPhoneNumber:ok") {
      // 真实场景: 把 encryptedData + iv 发到云函数解密
      // 这里先标记本地已授权, 云函数后续接入
      app.markPhoneAuthorized(e.detail);
      this.setData({ showPhoneAuth: false });
      wx.showToast({ title: "授权成功", icon: "success" });
    } else {
      // 用户拒绝授权
      wx.showToast({ title: "已跳过, 部分功能受限", icon: "none" });
      this.onSkipPhone();
    }
  },

  // P0-5: 跳过授权 (仅浏览模式)
  onSkipPhone() {
    // 不标记为已授权, 保留 needsPhoneAuth
    // 下次 onShow 还会再弹一次 (但间隔拉长)
    this.setData({ showPhoneAuth: false });
  },

  async loadCommunities() {
    const res = await app.callFunction("communities");
    if (res.ok) {
      this.setData({ communities: res.data.communities });
    } else {
      // 离线 fallback
      this.setData({
        communities: [
          { _id: "c_A", name: "苏州工业园社区", address: "工业园区" },
          { _id: "c_B", name: "姑苏区社区",     address: "姑苏区" },
          { _id: "c_C", name: "高新区社区",     address: "高新区" },
          { _id: "c_D", name: "吴中区社区",     address: "吴中区" },
          { _id: "c_E", name: "相城区社区",     address: "相城区" },
        ],
      });
    }
  },

  async loadDailyTip() {
    const res = await app.callFunction("daily_tips");
    if (res.ok && res.data && res.data.tip) {
      this.setData({ dailyTip: res.data.tip });
    } else {
      // 离线 fallback
      const tips = [
        "深呼吸 4-7-8: 吸 4 秒, 屏 7 秒, 呼 8 秒. 焦虑时的急救.",
        "今晚睡前 30 分钟放下手机. 这是你能给大脑最好的礼物.",
        "今天是新的一天. 你不需要重复昨天的自己.",
      ];
      this.setData({ dailyTip: tips[Math.floor(Math.random() * tips.length)] });
    }
  },

  selectCommunity(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ selected_community: id });
    wx.setStorageSync("selected_community", id);
    wx.showToast({ title: "已选", icon: "success" });
  },

  goChat() { wx.switchTab({ url: "/pages/chat/chat" }); },
  goAssessment() { wx.switchTab({ url: "/pages/assessment/assessment" }); },
  goBooking() { wx.switchTab({ url: "/pages/booking/booking" }); },
  goCrisis() { wx.switchTab({ url: "/pages/crisis/crisis" }); },
});
