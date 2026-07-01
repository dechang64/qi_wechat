// pages/booking/booking.js — 云开发版
const app = getApp();

Page({
  data: {
    step: 1,
    communities: [],
    counselors: [],
    selectedCommunity: "",
    selectedCounselor: 0,
    selectedCounselorName: "",
    selectedDate: "",
    slots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"],
    selectedTime: "",
    mode: "onsite",
    specialty: "",
    phone: "",
    bookingResult: null,
  },

  onLoad() {
    this.loadCommunities();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.setData({ selectedDate: tomorrow.toISOString().slice(0, 10) });
  },

  async loadCommunities() {
    const res = await app.callFunction("communities");
    if (res.ok) this.setData({ communities: res.data.communities });
    else this.setData({ communities: [{_id: "c_A", name: "苏州工业园", address: "工业园区"}] });
  },

  async loadCounselors(communityId, specialty) {
    const res = await app.callFunction("counselors", {
      community_id: communityId, specialty,
    });
    if (res.ok) this.setData({ counselors: res.data.counselors });
    else this.setData({ counselors: [] });
  },

  selectCommunity(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ selectedCommunity: id });
    wx.setStorageSync("selected_community", id);
    this.loadCounselors(id, this.data.specialty);
    setTimeout(() => this.setData({ step: 2 }), 300);
  },

  goCrossCommunity() {
    this.loadCounselors(null, this.data.specialty);
    this.setData({ selectedCommunity: "all" });
    setTimeout(() => this.setData({ step: 2 }), 300);
  },

  filterBy(e) {
    const s = e.currentTarget.dataset.s;
    this.setData({ specialty: s });
    this.loadCounselors(this.data.selectedCommunity || null, s);
  },

  selectCounselor(e) {
    const id = e.currentTarget.dataset.id;
    const counselor = this.data.counselors.find(c => c._id === id);
    this.setData({
      selectedCounselor: id,
      selectedCounselorName: counselor ? counselor.name : "",
    });
    setTimeout(() => this.setData({ step: 3 }), 300);
  },

  selectTime(e) { this.setData({ selectedTime: e.currentTarget.dataset.t }); },
  selectMode(e) { this.setData({ mode: e.currentTarget.dataset.m }); },
  onPhone(e) { this.setData({ phone: e.detail.value }); },

  async confirm() {
    if (this.data.phone.length !== 11) return;
    wx.showLoading({ title: "预约中" });

    const res = await app.callFunction("booking", {
      counselor_id: this.data.selectedCounselor,
      counselor_name: this.data.selectedCounselorName,
      community_id: this.data.selectedCommunity === "all" ? "c_A" : this.data.selectedCommunity,
      booking_date: this.data.selectedDate,
      booking_time: this.data.selectedTime,
      mode: this.data.mode,
      phone: this.data.phone,
    });
    wx.hideLoading();

    if (res.ok) {
      this.setData({ step: 5, bookingResult: res.data });
      wx.showToast({ title: "预约成功", icon: "success" });
    } else {
      // 离线 fallback
      this.setData({
        step: 5,
        bookingResult: {
          booking_id: `mock_${Date.now()}`,
          community_id: this.data.selectedCommunity,
          counselor_id: this.data.selectedCounselor,
          booking_time: `${this.data.selectedDate} ${this.data.selectedTime}`,
          mode: this.data.mode,
          status: "pending (offline)",
        },
      });
      wx.showToast({ title: "云端异常, 已用本地记录", icon: "none" });
    }
  },

  back() { this.setData({ step: Math.max(1, this.data.step - 1) }); },
  restart() {
    this.setData({
      step: 1, selectedCommunity: "", selectedCounselor: 0, selectedCounselorName: "",
      selectedTime: "", mode: "onsite", specialty: "", phone: "", bookingResult: null,
    });
  },
  goHome() { wx.switchTab({ url: "/pages/home/home" }); },
});
