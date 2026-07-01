// pages/index/index.js
// 入口页 — 微信体验版默认走 pages/index/index, 重定向到 pages/home/home
Page({
  onLoad() {
    // 立即跳到真正的 home 页
    wx.reLaunch({ url: "/pages/home/home" });
  },
});
