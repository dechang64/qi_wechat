// 云函数: assessment
// 入参: { action: "questions" } 拿题目
// 入参: { action: "submit", answers: {q1:1,q2:2,...} } 提交
// 出参: questions / { score, level, advice, assessment_id }

const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const QUESTIONS = [
  { id: "q1", text: "过去 2 周, 您是否经常感到心情低落、抑郁或绝望?",
    options: [{v:0,t:"完全没有"},{v:1,t:"几天"},{v:2,t:"一半以上"},{v:3,t:"几乎每天"}] },
  { id: "q2", text: "过去 2 周, 您是否对做事提不起兴趣?",
    options: [{v:0,t:"完全没有"},{v:1,t:"几天"},{v:2,t:"一半以上"},{v:3,t:"几乎每天"}] },
  { id: "q3", text: "过去 2 周, 您的睡眠质量如何?",
    options: [{v:0,t:"很好"},{v:1,t:"偶尔差"},{v:2,t:"经常差"},{v:3,t:"几乎每天失眠或嗜睡"}] },
  { id: "q4", text: "过去 2 周, 您与家人/朋友的相处如何?",
    options: [{v:0,t:"正常"},{v:1,t:"有点疏远"},{v:2,t:"明显减少"},{v:3,t:"几乎不联系"}] },
  { id: "q5", text: "过去 2 周, 您是否有过'不想活了'或类似想法?",
    options: [{v:0,t:"完全没有"},{v:1,t:"很少"},{v:2,t:"有时"},{v:3,t:"经常/强烈"}] },
];

function scoreToLevel(score) {
  if (score >= 12) return "urgent";
  if (score >= 8) return "high";
  if (score >= 5) return "mid";
  return "low";
}

function levelToAdvice(level) {
  if (level === "urgent") return {
    level: "urgent", title: "建议立即寻求专业帮助", color: "#dc3545",
    recommendations: [
      "请立刻拨打 12320-5 (北京心理援助热线, 24h)",
      "或联系您信任的家人 / 朋友",
      "建议尽快预约 1 次面对面咨询 (本周内)",
    ],
    immediate: true,
  };
  if (level === "high") return {
    level: "high", title: "建议近期咨询", color: "#d4a574",
    recommendations: [
      "建议预约 1 位心理咨询师 (1 周内)",
      "避免独自承受, 多与信任的人倾诉",
      "规律作息, 适度运动",
    ],
    immediate: false,
  };
  if (level === "mid") return {
    level: "mid", title: "可考虑预约, 也可自助调节", color: "#9bbf65",
    recommendations: [
      "如有需要可预约咨询",
      "试试 1 分钟呼吸训练",
      "记心情日记, 观察变化",
    ],
    immediate: false,
  };
  return {
    level: "low", title: "状态良好, 继续保持", color: "#5a7d6b",
    recommendations: ["心理状态稳定", "关注心理健康"],
    immediate: false,
  };
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const db = cloud.database();
  const action = (event && event.action) || "questions";

  // 拿题目
  if (action === "questions") {
    return { code: 0, questions: QUESTIONS, total: QUESTIONS.length };
  }

  // 提交评估
  if (action === "submit") {
    const answers = event.answers || {};
    const score = Object.values(answers).reduce((a, b) => a + Number(b || 0), 0);
    const level = scoreToLevel(score);

    // upsert user (按 openid)
    const userRes = await db.collection("users").where({ wx_openid: OPENID }).get();
    let userId;
    if (userRes.data && userRes.data.length) {
      userId = userRes.data[0]._id;
    } else {
      const ins = await db.collection("users").add({
        data: {
          wx_openid: OPENID,
          nickname: event.nickname || "",
          avatar: event.avatar || "",
          phone: event.phone || "",
          created_at: Date.now(),
        },
      });
      userId = ins._id;
    }

    // 写评估记录
    const res = await db.collection("assessments").add({
      data: {
        user_id: userId,
        answers: answers,
        score: score,
        level: level,
        created_at: Date.now(),
      },
    });

    return {
      code: 0,
      assessment_id: res._id,
      score: score,
      level: level,
      advice: levelToAdvice(level),
    };
  }

  return { code: -1, message: "unknown action" };
};
