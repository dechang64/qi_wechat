// pages/chat/chat.js — Phase 2: 6 角色 + 历史 + 打字机 + 危机
const app = getApp();

const ROLES = [
  { key: "narrative",        name: "叙事",   icon: "📖", desc: "重写你的故事" },
  { key: "cbt",              name: "CBT",    icon: "🧠", desc: "重构认知" },
  { key: "person_centered",  name: "人本",   icon: "🤝", desc: "共情倾听" },
  { key: "act",              name: "ACT",    icon: "🌊", desc: "接纳行动" },
  { key: "positive",         name: "积极",   icon: "🌻", desc: "培养优势" },
  { key: "empowerment_sfbt", name: "焦点",   icon: "⚡", desc: "短程解决" },
];

Page({
  data: {
    roles: ROLES,
    currentRole: "narrative",
    messages: [],
    input: "",
    sending: false,
    scrollTo: "",
  },

  // timer 不放 data (避免 setData 复制)
  // 同时多发消息时, 用 activeTypingId 防串
  _typingTimer: null,
  _activeTypingId: null,

  onLoad() {
    this.loadHistory();
  },

  onUnload() {
    this._stopTyping();
  },

  _stopTyping() {
    if (this._typingTimer) {
      clearInterval(this._typingTimer);
      this._typingTimer = null;
    }
    this._activeTypingId = null;
  },

  async loadHistory() {
    // 先重置 messages, 防止 onLoad 多次调用时重复 push welcome
    this.setData({ messages: [] });

    wx.showLoading({ title: "加载历史...", mask: true });
    const res = await app.callFunction("chat", { action: "load" });
    wx.hideLoading();
    if (res.ok && res.data && res.data.history && res.data.history.length > 0) {
      const msgs = res.data.history.map(m => ({
        id: m._id,
        role: m.role === "user" ? "user" : "bot",
        content: m.content,
        role_used: m.role_used,
      }));
      this.setData({
        messages: msgs,
        scrollTo: `msg-${msgs[msgs.length - 1].id}`,
      });
    } else {
      // 无历史, 显示欢迎语 (根据当前选中角色动态生成)
      const roleName = ROLES.find(r => r.key === this.data.currentRole).name;
      const roleDesc = ROLES.find(r => r.key === this.data.currentRole).desc;
      this.setData({
        messages: [{
          id: "welcome-" + Date.now(),
          role: "bot",
          content: `你好, 我是祺臻小愈. 我会用${roleName}(${roleDesc})的方式倾听你. 你可以说一说最近让你困扰的事吗?`,
          role_used: this.data.currentRole,
        }],
      });
    }
  },

  onInput(e) {
    this.setData({ input: e.detail.value });
  },

  switchRole(e) {
    const role = e.currentTarget.dataset.role;
    this.setData({ currentRole: role });
    wx.showToast({ title: `已切换到 ${ROLES.find(r => r.key === role).name}`, icon: "none", duration: 1000 });
  },

  async clearHistory() {
    const r = await wx.showModal({
      title: "清空对话?",
      content: "清空后无法恢复, 确定吗?",
      confirmText: "清空",
      cancelText: "取消",
    });
    if (!r.confirm) return;
    wx.showLoading({ title: "清空中..." });
    const res = await app.callFunction("chat", { action: "clear" });
    wx.hideLoading();
    if (res.ok) {
      this.setData({
        messages: [{
          id: "reset-" + Date.now(),
          role: "bot",
          content: "对话已清空. 我们重新开始吧. 你想说点什么?",
          role_used: this.data.currentRole,
        }],
      });
    }
  },

  async send() {
    const text = this.data.input.trim();
    if (!text || this.data.sending) return;

    // 先停止上一波打字 (防止串)
    this._stopTyping();

    // 1. 立即把用户消息 push 上去
    const userMsg = {
      id: `u_${Date.now()}`,
      role: "user",
      content: text,
    };
    this.setData({
      messages: [...this.data.messages, userMsg],
      input: "",
      sending: true,
      scrollTo: `msg-${userMsg.id}`,
    });

    // 2. 调云函数
    const res = await app.callFunction("chat", {
      text,
      role: this.data.currentRole,
    });
    this.setData({ sending: false });

    if (res.ok) {
      const r = res.data;
      // 3a. 用打字机效果推送 AI 回复
      this._startTyping(r.content, r.role_used);

      // 4. 危机跳转
      if (r.crisis) {
        setTimeout(() => {
          wx.showModal({
            title: "我们很关心你",
            content: "我听到你说的话. 请拨打 24h 心理援助热线 400-161-9995 (或北京 010-82951332). 我们一起面对.",
            showCancel: false,
            confirmText: "我知道了",
          });
          setTimeout(() => wx.switchTab({ url: "/pages/crisis/crisis" }), 1500);
        }, 800);
      }
    } else {
      // 3b. 失败 fallback — 显示真实错误 (调试期)
      const errMsg = res.message || "未知错误";
      const fallbackReplies = [
        "谢谢你告诉我. 想再具体说一点吗?",
        "我听到你的话了. 慢慢说.",
        "我们一起深呼吸. 你想从哪个点开始?",
      ];
      const botMsg = {
        id: `fb_${Date.now()}`,
        role: "bot",
        content: `[❌ 错误] ${errMsg}\n\n(临时本地回复) ${fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)]}`,
        role_used: this.data.currentRole,
      };
      this.setData({
        messages: [...this.data.messages, botMsg],
        scrollTo: `msg-${botMsg.id}`,
      });
      wx.showToast({ title: "AI 调用失败: " + errMsg.slice(0, 30), icon: "none", duration: 3000 });
      console.error("[chat] AI 调用失败:", errMsg);
    }
  },

  _startTyping(fullText, roleUsed) {
    if (!fullText) return;

    // 1. 占位消息
    const botId = `b_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const placeholder = {
      id: botId,
      role: "bot",
      content: "",
      role_used: roleUsed || this.data.currentRole,
      typing: true,
    };
    this.setData({
      messages: [...this.data.messages, placeholder],
      scrollTo: `msg-${botId}`,
    });

    // 标记 active
    this._activeTypingId = botId;

    // 2. 打字机
    let i = 0;
    // 平均打 3s 完成 (实时响应)
    const step = Math.max(2, Math.ceil(fullText.length / 100));
    const that = this;  // 闭包捕获 page instance
    const timer = setInterval(() => {
      // 如果 active id 变了, 说明被新一波中断, 停止
      if (that._activeTypingId !== botId) {
        clearInterval(timer);
        return;
      }
      i += step;
      if (i >= fullText.length) {
        clearInterval(timer);
        that._typingTimer = null;
        that._activeTypingId = null;
        // 最终消息
        const msgs = that.data.messages.map(m =>
          m.id === botId
            ? { ...m, content: fullText, typing: false }
            : m
        );
        that.setData({ messages: msgs });
      } else {
        const partial = fullText.slice(0, i);
        const msgs = that.data.messages.map(m =>
          m.id === botId ? { ...m, content: partial } : m
        );
        that.setData({ messages: msgs, scrollTo: `msg-${botId}` });
      }
    }, 30);

    this._typingTimer = timer;
  },
});
