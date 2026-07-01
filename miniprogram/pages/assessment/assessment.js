// pages/assessment/assessment.js — 云开发版
const app = getApp();

Page({
  data: {
    questions: [],
    current: 0,
    answers: {},
    submitted: false,
    result: null,
    progress: 20,
  },

  onLoad() {
    this.loadQuestions();
  },

  async loadQuestions() {
    const res = await app.callFunction("assessment", { action: "questions" });
    if (res.ok && res.data.questions) {
      this.setData({ questions: res.data.questions });
    } else {
      this.setData({
        questions: [
          { id: "q1", text: "过去 2 周, 您是否经常感到心情低落?", options: [
            { v: 0, t: "完全没有" }, { v: 1, t: "几天" }, { v: 2, t: "一半以上" }, { v: 3, t: "几乎每天" }] },
          { id: "q2", text: "过去 2 周, 您是否对做事提不起兴趣?", options: [
            { v: 0, t: "完全没有" }, { v: 1, t: "几天" }, { v: 2, t: "一半以上" }, { v: 3, t: "几乎每天" }] },
          { id: "q3", text: "您的睡眠质量如何?", options: [
            { v: 0, t: "很好" }, { v: 1, t: "偶尔差" }, { v: 2, t: "经常差" }, { v: 3, t: "几乎每天失眠" }] },
          { id: "q4", text: "您与家人/朋友的相处如何?", options: [
            { v: 0, t: "正常" }, { v: 1, t: "有点疏远" }, { v: 2, t: "明显减少" }, { v: 3, t: "几乎不联系" }] },
          { id: "q5", text: "您是否有过'不想活了'的想法?", options: [
            { v: 0, t: "完全没有" }, { v: 1, t: "很少" }, { v: 2, t: "有时" }, { v: 3, t: "经常/强烈" }] },
        ],
      });
    }
  },

  selectOption(e) {
    const v = e.currentTarget.dataset.v;
    const qid = this.data.questions[this.data.current].id;
    this.setData({ [`answers.${qid}`]: v });
  },

  next() {
    if (this.data.current === 4) {
      this.submit();
      return;
    }
    this.setData({
      current: this.data.current + 1,
      progress: (this.data.current + 1) * 20 + 20,
    });
  },

  prev() {
    if (this.data.current > 0) {
      this.setData({
        current: this.data.current - 1,
        progress: (this.data.current + 1) * 20,
      });
    }
  },

  async submit() {
    wx.showLoading({ title: "评估中" });
    const res = await app.callFunction("assessment", {
      action: "submit",
      answers: this.data.answers,
    });
    wx.hideLoading();

    if (res.ok) {
      this.setData({ submitted: true, result: res.data });
      if (res.data.advice && res.data.advice.immediate) {
        wx.showModal({
          title: "⚠️ 紧急建议",
          content: res.data.advice.title + "\n请立刻拨打 12320-5 或联系我们",
          showCancel: false,
        });
      }
    } else {
      // 本地 fallback
      const score = Object.values(this.data.answers).reduce((a, b) => a + Number(b), 0);
      const level = score >= 12 ? "urgent" : score >= 8 ? "high" : score >= 5 ? "mid" : "low";
      const adviceMap = {
        urgent: { level, title: "建议立即寻求专业帮助", recommendations: ["请立刻拨打 12320-5", "联系家人/朋友", "尽快预约面对面咨询"], immediate: true },
        high: { level, title: "建议近期咨询", recommendations: ["1 周内预约咨询师", "避免独自承受", "规律作息"] },
        mid: { level, title: "可考虑预约, 也可自助调节", recommendations: ["如有需要可预约", "试试呼吸训练", "记心情日记"] },
        low: { level, title: "状态良好", recommendations: ["心理状态稳定", "关注心理健康"] },
      };
      this.setData({
        submitted: true,
        result: { score, advice: adviceMap[level], assessment_id: "offline" },
      });
      wx.showToast({ title: "云端异常, 已用本地评估", icon: "none" });
    }
  },

  restart() {
    this.setData({ current: 0, answers: {}, submitted: false, result: null, progress: 20 });
  },

  goCrisis() { wx.switchTab({ url: "/pages/crisis/crisis" }); },
});
