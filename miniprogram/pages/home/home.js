// pages/home/home.js — 云开发版
const app = getApp();

Page({
  data: {
    communities: [],
    selected_community: "",
    dailyTip: "",
  },

  onLoad() {
    this.loadCommunities();
    this.loadDailyTip();
    const last = wx.getStorageSync("selected_community");
    if (last) this.setData({ selected_community: last });
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
