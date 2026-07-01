// pages/crisis/crisis.js — 云开发版
const app = getApp();

Page({
  data: {
    hotlines: [],
    testInput: "",
    testResult: {},
  },

  onLoad() {
    this.loadHotlines();
  },

  async loadHotlines() {
    const res = await app.callFunction("crisis", { action: "hotlines" });
    if (res.ok) {
      // 加颜色
      const hotlines = (res.data.hotlines || []).map((h, i) => ({
        ...h,
        color: i === 0 ? "#dc3545" : i === 1 ? "#d4a574" : "#9bbf65",
      }));
      this.setData({ hotlines });
    } else {
      this.setData({
        hotlines: [
          { name: "12320-5", desc: "北京心理援助热线 (24h)", phone: "010-82951332", color: "#dc3545" },
          { name: "400-161-9995", desc: "全国心理援助", phone: "400-161-9995", color: "#d4a574" },
          { name: "999", desc: "医疗急救 (紧急)", phone: "999", color: "#dc3545" },
        ],
      });
    }
  },

  async callPhone(e) {
    const phone = e.currentTarget.dataset.phone;
    const ok = await new Promise(resolve => {
      wx.showModal({
        title: "拨打 " + phone,
        content: "确认拨打此号码?",
        success: r => resolve(r.confirm),
      });
    });
    if (!ok) return;

    wx.makePhoneCall({
      phoneNumber: phone,
      fail: () => wx.showToast({ title: "请用真机测试", icon: "none" }),
    });

    // 上报日志 (不影响主流程)
    app.callFunction("crisis", {
      action: "log",
      user_message: `called ${phone}`,
      action_taken: "call",
    });
  },

  onTestInput(e) { this.setData({ testInput: e.detail.value }); },

  async testDetect() {
    const res = await app.callFunction("crisis", { action: "detect", text: this.data.testInput });
    if (res.ok) {
      this.setData({ testResult: res.data });
    } else {
      // 离线本地检测
      const text = this.data.testInput;
      const words = ["不想活", "自杀", "轻生", "没意义"];
      const hits = words.filter(w => text.includes(w));
      this.setData({
        testResult: {
          is_crisis: hits.length > 0,
          keywords: hits,
          confidence: Math.min(1, 0.5 + hits.length * 0.15),
        },
      });
    }
  },

  goBooking() { wx.switchTab({ url: "/pages/booking/booking" }); },
});
