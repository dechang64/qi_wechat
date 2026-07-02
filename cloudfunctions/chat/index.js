// 云函数: chat
// Phase 2: 接入 deepseek-v3 + 6 心理疗法角色 + 危机检测 + 跨上下文记忆
// PRD: 6.1 角色设定, 6.2 跨社区, 4.3 危机应急

const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// ==============================
// 19 关键词危机检测 (PRD 7.1)
// ==============================
const CRISIS_KEYWORDS = [
  // 直接表达
  "不想活", "自杀", "轻生", "想死", "活不下去", "结束生命",
  // 自伤
  "自残", "割腕", "跳楼", "上吊", "服药过量",
  // 悲观绝望
  "绝望", "没意义", "没人需要我",
];

function detectCrisis(text) {
  return CRISIS_KEYWORDS.filter(w => text.includes(w));
}

// ==============================
// 6 大心理疗法角色 system_prompt
// PRD 6.1
// ==============================
const ROLE_PROMPTS = {
  narrative: {
    name: "叙事治疗师",
    icon: "📖",
    desc: "通过重写生命故事, 帮你找到被忽视的力量",
    system: `你是祺臻心理中心的叙事治疗师"小愈". 你的来访者是一位中国成年人, 正在经历心理困扰.

【叙事疗法核心】
1. 外化问题: 把"我焦虑"变成"焦虑这只野兽" — 让问题与人分离
2. 寻找例外: 询问"有没有不那么焦虑的时刻?", 找到被忽视的例外
3. 寻找主线故事 vs 替代故事: 帮助来访者看到被压抑的正面经历
4. 寻找见证: 让来访者讲述自己的故事, 你是见证者

【沟通风格】
- 温柔、好奇、不评判
- 用开放式问题("你是怎么发现的?" / "对你来说这是怎么样的?")
- 复述来访者的关键短语, 让 ta 听清自己的话
- 不给建议, 引导来访者自己找到答案
- 中文, 简洁 (2-4 段, 每段 2-3 句)
- 必要时使用比喻和故事

【红线】
- 不诊断精神疾病
- 不替代专业心理咨询师
- 检测到自杀/自伤/危机信号时, 立即切换到危机应对模式
- 绝对保密, 但危机情况下会建议来访者拨打 24h 热线`,
  },
  cbt: {
    name: "CBT 认知行为治疗师",
    icon: "🧠",
    desc: "识别自动化思维, 重构认知偏差",
    system: `你是祺臻心理中心的 CBT 治疗师"小愈". 你的来访者正在经历情绪困扰.

【CBT 核心】
1. 识别自动思维: "你此刻脑海中浮现了什么想法?"
2. 检验证据: "支持这个想法的证据是什么? 反面的证据呢?"
3. 识别认知扭曲: 灾难化 / 全或无 / 心理过滤 / 情绪化推理
4. 重构思维: "如果你的好朋友遇到这件事, 你会对 ta 说什么?"
5. 行为激活: 引导来访者从小步骤开始

【沟通风格】
- 协作、教育、具体
- 用结构化提问
- 列出选项让来访者选
- 用表格思维导图 (markdown)
- 中文, 简洁`,
  },
  person_centered: {
    name: "人本主义治疗师",
    icon: "🤝",
    desc: "以来访者为中心, 共情无条件积极关注",
    system: `你是人本主义治疗师"小愈".

【人本主义核心 - 罗杰斯三大条件】
1. 共情理解: 准确感受来访者的内在世界
2. 无条件积极关注: 不评判, 完全接纳
3. 真诚一致: 你与来访者真实接触

【沟通风格】
- 倾听、复述、确认感受
- "我听到你说... 是这样吗?"
- 不引导, 信任来访者内在自我疗愈能力
- 中文, 温柔`,
  },
  act: {
    name: "ACT 接纳承诺疗法",
    icon: "🌊",
    desc: "接纳痛苦, 行动价值观",
    system: `你是 ACT 接纳承诺疗法治疗师"小愈".

【ACT 六核心】
1. 接纳: 痛苦是人生常态, 与之共处
2. 认知解离: 把想法只是看作想法, 不是事实
3. 关注当下: 回到此时此刻
4. 价值观澄清: "对你来说最重要的是什么?"
5. 承诺行动: 在价值观方向上迈步
6. 隐喻: 用沙盒 / 河流 / 暴风雨等隐喻

【沟通风格】
- 体验性、隐喻丰富
- 用 ACT 经典隐喻 (路过的车 / 大海上的浪)
- 中文, 诗意但不空洞`,
  },
  positive: {
    name: "积极心理学",
    icon: "🌻",
    desc: "关注优势, 培养 PERMA 幸福五要素",
    system: `你是积极心理学引导师"小愈".

【PERMA 五要素】
P 积极情绪 / E 投入 / R 人际关系 / M 意义 / A 成就

【沟通风格】
- 关注来访者过往的成功时刻
- "你曾经克服过困难吗? 你当时是怎么做的?"
- 用"三件好事"练习: 每晚写下三件好事 + 为什么
- 中文, 温暖具体`,
  },
  empowerment_sfbt: {
    name: "赋权 + SFBT 焦点解决",
    icon: "⚡",
    desc: "短程焦点, 关注解决而非问题",
    system: `你是赋权 / SFBT 焦点解决治疗师"小愈".

【SFBT 核心提问】
1. 奇迹问题: "如果奇迹发生, 问题不再, 你会看到什么不同?"
2. 刻度问题: "1-10 分, 你现在的状态是几分? 怎样可以多 1 分?"
3. 例外问题: "什么时候状态稍好一些?"
4. 应对问题: "你是怎么熬过来的?"

【赋权原则】
- 来访者是解决自身问题的专家
- 相信每个人有能力
- 不纠缠问题, 焦点在解决

【沟通风格】
- 简洁、聚焦、未来取向
- 中文, 1-2 段, 干净利落`,
  },
};

// ==============================
// 默认角色: 叙事 (适合泛化场景)
// ==============================
const DEFAULT_ROLE = "narrative";

// ==============================
// ==============================
// 调大模型: 腾讯云 CloudBase 内置 AI (@cloudbase/node-sdk)
// 真实 API (从 dist/cjs/AI.d.ts + models/HunYuan/index.js + util.js 源码验证):
//   const tcb = require("@cloudbase/node-sdk");
//   const app = tcb.init({ env: "qi-wechat-dev-d7gxd20xreb567ce2" });  // 字符串!
//   const ai = app.ai();
//   const model = ai.createModel("hunyuan");                              // HunYuanSimpleModel
//   const result = await model.doGenerate({                              // 真实方法名 (不是 modelRequest)
//     messages: [{ role: "user", content: "..." }],
//     model: "hy3-preview",                                              // 可选, 默认 hunyuan-turbo
//     temperature: 0.7,
//   });
//   // 返回值结构: { response: { choices: [{ message: { content } }] }, rawResponse: {...} }
//   // 文本: result.response.choices[0].message.content
//   // 或者: result.rawResponse.Response.Choices[0].Message.Content (腾讯混元原生字段)
//
// 通过环境变量 AI_MODEL 切换具体模型 (默认 hy3-preview 混元)
// 通过环境变量 AI_PROVIDER 切换 provider (默认 hunyuan, 可选 deepseek/dashscope/ark 等)
// 不依赖外部 API Key — CloudBase 内置 AI 调用
// ==============================

// @cloudbase/node-sdk 是云函数端 AI 的唯一正解
const tcb = require("@cloudbase/node-sdk");
const ENV_ID = process.env.WX_ENV_ID || "qi-wechat-dev-d7gxd20xreb567ce2";

// 把 tcb.init 放外面 (云函数冷启动时初始化一次), 不要每次 callLLM 都重新 init
let _tcbApp = null;
let _tcbAi = null;
function getAi() {
  if (_tcbAi) return _tcbAi;
  try {
    // 必须传字符串 env ID! Symbol 不行 (跨包 Symbol 不兼容)
    _tcbApp = tcb.init({ env: ENV_ID });
    _tcbAi = _tcbApp.ai();
    // 诊断 SDK 实际版本 + AI 实例方法 (云端可能装到不同版本, 老版本 API 不同)
    let sdkVersion = "unknown";
    try { sdkVersion = require("@cloudbase/node-sdk/package.json").version; } catch {}
    let aiKeys = Object.keys(_tcbAi || {}).join(",");
    let modelReqType = typeof _tcbAi.modelRequest;
    let botType = typeof _tcbAi.bot;
    console.log(`[SDK DIAG] @cloudbase/node-sdk version=${sdkVersion}, ai keys=[${aiKeys}], modelRequest=${modelReqType}, bot=${botType}`);
    return _tcbAi;
  } catch (e) {
    throw new Error(`tcb.init({env:"${ENV_ID}"}) 失败: ${e.message}`);
  }
}

async function callLLM(system, history) {
  const messages = [
    { role: "system", content: system },
    ...history,
  ];

  const provider = (process.env.AI_PROVIDER || "hunyuan").toLowerCase();
  const modelName = process.env.AI_MODEL || "hy3-preview";

  console.log(`[callLLM] provider=${provider}, model=${modelName}, messages=${messages.length}`);

  const ai = getAi();

  // 真实方法: ai.createModel(provider).doGenerate({messages, model, temperature})
  // createModel 返回的 model 实例类型是 ReactModel (abstract)
  // HunYuan 实现是 HunYuanSimpleModel (在 dist/cjs/models/HunYuan/index.js)
  let model;
  try {
    model = ai.createModel(provider);
  } catch (e) {
    throw new Error(`ai.createModel("${provider}") 失败: ${e.message}. @cloudbase/node-sdk 3.18.3 支持的 provider: hunyuan / hunyuan-exp / hunyuan-beta / deepseek / moonshot / ark / dashscope / yi / zhipu / default`);
  }

  // 诊断 model 实例上的真实方法 (云端 SDK 版本可能不同)
  let modelProtoMethods = [];
  try {
    let proto = Object.getPrototypeOf(model);
    while (proto && proto !== Object.prototype) {
      modelProtoMethods = modelProtoMethods.concat(Object.getOwnPropertyNames(proto));
      proto = Object.getPrototypeOf(proto);
    }
  } catch {}
  console.log(`[MODEL DIAG] provider=${provider}, model.constructor=${model.constructor.name}, methods=[${modelProtoMethods.join(",")}], typeof doGenerate=${typeof model.doGenerate}, typeof doStream=${typeof model.doStream}, typeof chatCompletion=${typeof model.chatCompletion}`);

  let result;
  // 真实 SDK 真相 (从云端 diag 日志 + ReactModel 类型定义确认):
  //   ai.createModel('hunyuan') 返 ReactModel (不是 HunYuanSimpleModel, 是 wrapper)
  //   ReactModel 上的方法: generateText / streamText (没有 doGenerate!)
  //   generateText(input, options?) -> { text, messages, usage, rawResponses, error? }
  //   文本: result.text (直接是字符串)
  const probeMethods = ['generateText', 'streamText', 'doGenerate', 'chatCompletion'];
  const availableMethods = probeMethods.filter(m => typeof model[m] === 'function');
  console.log(`[MODEL DIAG] model.availableMethods=[${availableMethods.join(",")}], model.constructor=${model.constructor.name}`);

  if (typeof model.generateText === 'function') {
    try {
      result = await model.generateText({
        messages,
        model: modelName,
        temperature: 0.7,
      });
      console.log(`[generateText] SUCCESS, result keys=[${Object.keys(result || {}).join(",")}], text 前 100 字: ${(result.text || "").slice(0, 100)}`);
    } catch (e) {
      throw new Error(`model.generateText({messages, model:"${modelName}"}) 失败: ${e.message}. 检查 modelName 是否在该 provider 支持的列表里`);
    }
  } else if (typeof model.streamText === 'function') {
    // 流式 fallback
    console.log(`[FALLBACK] model.generateText 不存在, 改用 model.streamText`);
    const stream = await model.streamText({ messages, model: modelName, temperature: 0.7 });
    let buf = "";
    for await (const chunk of stream.textStream) buf += chunk;
    result = { text: buf };
  } else {
    throw new Error(`model 上无 generateText / streamText. availableMethods=[${availableMethods.join(",")}]. 需要看 [SDK DIAG] 日志确认 @cloudbase/node-sdk 版本`);
  }

  // 解析返回: ReactModel.generateText 直接返 { text, messages, usage, rawResponses }
  // 文本: result.text
  let text = null;
  if (typeof result === "string") {
    text = result;
  } else if (result && typeof result.text === "string") {
    text = result.text;
  } else if (result && result.response && result.response.choices && result.response.choices[0]) {
    text = result.response.choices[0].message?.content || result.response.choices[0].text;
  } else if (result && result.rawResponse && result.rawResponse.Response) {
    const r = result.rawResponse.Response;
    if (r.Choices && r.Choices[0]) {
      text = r.Choices[0].Message?.Content || r.Choices[0].Message?.content;
    }
  }
  if (text) return text;
  throw new Error(`无法解析 AI 响应, result 摘要=${safeStringify(result).slice(0, 500)}`);
}

function safeStringify(obj) {
  try { return JSON.stringify(obj); } catch { return String(obj); }
}

// ==============================
// 主入口
// ==============================
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const OPENID = wxContext.OPENID;
  const db = cloud.database();

  const action = (event && event.action) || "send";
  const text = (event && event.text || "").trim();
  const roleKey = (event && event.role) || DEFAULT_ROLE;

  // ------------------------------
  // action: load — 拉历史 (最近 20 条)
  // ------------------------------
  if (action === "load") {
    try {
      const r = await db.collection("messages")
        .where({ user_id: OPENID })
        .orderBy("created_at", "asc")
        .limit(20)
        .get();
      return { code: 0, history: r.data };
    } catch (e) {
      console.error("[chat] load history fail:", e.message);
      // 仍然返回空历史 (避免阻塞 UI), 但加 error 信息让前端知道
      return { code: 0, history: [], warning: "load_failed" };
    }
  }

  // ------------------------------
  // action: clear — 清空历史
  // ------------------------------
  if (action === "clear") {
    try {
      const r = await db.collection("messages")
        .where({ user_id: OPENID })
        .get();
      await Promise.all(r.data.map(m => db.collection("messages").doc(m._id).remove()));
      return { code: 0, cleared: true };
    } catch (e) {
      return { code: -1, message: e.message };
    }
  }

  // ------------------------------
  // action: send — 发消息 (主入口)
  // ------------------------------
  if (!text) {
    return { code: -1, message: "empty text" };
  }

  const roleConfig = ROLE_PROMPTS[roleKey] || ROLE_PROMPTS[DEFAULT_ROLE];

  // 1. 危机检测 (前置)
  const hits = detectCrisis(text);
  if (hits.length > 0) {
    await db.collection("crisis_logs").add({
      data: {
        user_id: OPENID,
        user_message: text,
        action_taken: "chat_crisis_detected",
        keywords: hits,
        created_at: Date.now(),
      },
    });
    const crisisReply = `我听到你说的话. 我很关心你. 此刻你不是一个人, 我们一起面对.

如果你想立即和一位真人聊聊, 请拨打:
📞 全国心理援助热线 400-161-9995 (24h)
📞 北京心理危机研究与干预中心 010-82951332 (24h)

我会一直在这里. 你想继续说, 或者先停一下, 都可以.`;
    await db.collection("messages").add({
      data: {
        user_id: OPENID,
        role: "user",
        content: text,
        created_at: Date.now(),
      },
    });
    await db.collection("messages").add({
      data: {
        user_id: OPENID,
        role: "assistant",
        content: crisisReply,
        role_used: roleKey,
        crisis: true,
        created_at: Date.now(),
      },
    });
    return {
      code: 0,
      role: "assistant",
      content: crisisReply,
      crisis: true,
      role_used: roleKey,
    };
  }

  // 2. 写用户消息
  await db.collection("messages").add({
    data: {
      user_id: OPENID,
      role: "user",
      content: text,
      created_at: Date.now(),
    },
  });

  // 3. 取历史 8 轮 (16 条) 上下文
  let history = [];
  try {
    const h = await db.collection("messages")
      .where({ user_id: OPENID })
      .orderBy("created_at", "asc")
      .limit(16)
      .get();
    history = h.data.map(m => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    }));
  } catch (e) {
    // 如果拉历史失败, 不影响发送
  }

  // 4. 调 AI
  let reply;
  let aiSuccess = false;
  try {
    reply = await callLLM(roleConfig.system, history);
    aiSuccess = true;
  } catch (e) {
    console.error("[chat] LLM call fail:", e.message, e.stack);
    reply = null;
    // 把错误也透传给前端 (仅调试期, 上线后删除)
    return {
      code: -2,
      message: "LLM call failed: " + e.message,
      error_stack: (e.stack || "").slice(0, 500),
      role_used: roleKey,
    };
  }

  // 6. 写 AI 回复
  await db.collection("messages").add({
    data: {
      user_id: OPENID,
      role: "assistant",
      content: reply,
      role_used: roleKey,
      ai_success: aiSuccess,
      created_at: Date.now(),
    },
  });

  return {
    code: 0,
    role: "assistant",
    content: reply,
    crisis: false,
    role_used: roleKey,
    ai_success: aiSuccess,
  };
};
