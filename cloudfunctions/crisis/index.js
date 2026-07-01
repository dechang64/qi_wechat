// 云函数: crisis
// 入参:
//   { action: "hotlines" } -> { hotlines }
//   { action: "detect", text: "..." } -> { is_crisis, keywords, confidence, advice }
//   { action: "log", user_message, action_taken, keywords? } -> { logged: true }

const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const HOTLINES = [
  { name: "12320-5",     desc: "北京心理援助热线 (24h)",  phone: "010-82951332", color: "#dc3545" },
  { name: "400-161-9995", desc: "全国心理援助",            phone: "400-161-9995", color: "#d4a574" },
  { name: "999",        desc: "医疗急救 (紧急)",          phone: "999",         color: "#dc3545" },
];

const CRISIS_KEYWORDS = [
  "不想活", "不想活了", "自杀", "轻生", "死了算了",
  "了断", "解脱", "没意义", "活着没意思", "不如死了",
  "自残", "割腕", "跳楼", "跳河", "吃药",
  "我想死", "要死", "该死", "想结束",
];

function detectCrisis(text) {
  if (!text) return { is_crisis: false, keywords: [], confidence: 0, advice: "" };
  const hits = CRISIS_KEYWORDS.filter(w => text.includes(w));
  if (!hits.length) return { is_crisis: false, keywords: [], confidence: 0, advice: "" };

  const confidence = Math.min(1.0, 0.5 + 0.15 * hits.length);
  return {
    is_crisis: true,
    keywords: hits,
    confidence: Math.round(confidence * 100) / 100,
    advice: "我们很关心你的安全, 想马上联系你. 请拨打下方热线, 也可点击联系咨询师.",
  };
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const db = cloud.database();
  const action = (event && event.action) || "hotlines";

  if (action === "hotlines") {
    return { code: 0, hotlines: HOTLINES };
  }

  if (action === "detect") {
    return { code: 0, ...detectCrisis(event.text || "") };
  }

  if (action === "log") {
    await db.collection("crisis_logs").add({
      data: {
        user_id: OPENID,
        user_message: event.user_message || "",
        action_taken: event.action_taken || "",
        keywords: event.keywords || [],
        created_at: Date.now(),
      },
    });
    return { code: 0, logged: true };
  }

  return { code: -1, message: "unknown action" };
};
