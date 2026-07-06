// 纯 mock 测试: 不跑真实 SDK, 直接 mock 我代码里调用的 4 个接口
// 验证 chat/index.js 的解析逻辑是否正确

console.log('=== 纯 mock 测试 chat 云函数解析逻辑 ===\n');

// === Mock: tcb.init() 返回的 AI 实例 ===
// 这是 SDK 真实返回的 model 实例 (我看了源码: HunYuanSimpleModel)
// 它有 doGenerate / doStream 方法, 但 v5.3 我猜的是 doGenerate
const mockModel = {
  doGenerate: async ({ messages, model, temperature }) => {
    console.log('[mock model.doGenerate] 调用了!');
    console.log('  messages:', JSON.stringify(messages).slice(0, 200));
    console.log('  model:', model);
    console.log('  temperature:', temperature);
    // 模拟 SDK 真实返回: { response: { choices: [...] }, rawResponse: {...} }
    return {
      response: {
        id: 'mock_id_123',
        object: 'chat.completion',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: '【mock 回复】我听到你说的话了. 你想多说说吗?',
          },
          finish_reason: 'stop',
        }],
        usage: { prompt_tokens: 50, completion_tokens: 20, total_tokens: 70 },
      },
      rawResponse: {
        Response: {
          Id: 'mock_id_123',
          Choices: [{
            Index: 0,
            Message: { Role: 'assistant', Content: '【mock 回复】我听到你说的话了. 你想多说说吗?' },
            FinishReason: 'stop',
          }],
        },
      },
    };
  },
  doStream: async function* () {
    yield '【mock stream】';
  },
};

const mockAi = {
  createModel: (name) => {
    console.log('[mock ai.createModel]', name);
    return mockModel;
  },
  modelRequest: async ({ url, data, stream }) => {
    console.log('[mock ai.modelRequest]', { url, stream });
    return mockModel.doGenerate(data || {});
  },
};

const mockTcbApp = {
  ai: () => mockAi,
};

// === Mock: wx-server-sdk ===
const mockCloud = {
  init: (opts) => { console.log('[mock cloud.init]', opts); },
  getWXContext: () => ({ OPENID: 'mock_openid_xxx' }),
  database: () => ({
    collection: () => ({
      add: async (d) => { console.log('[mock db.add]', d.data.role, d.data.content?.slice(0, 30)); return { _id: 'mock_db_id' }; },
      where: () => ({
        orderBy: () => ({
          limit: () => ({ get: async () => ({ data: [] }) }),
        }),
      }),
    }),
  }),
};

// === 模拟我的 v5.3 callLLM 解析逻辑 (从 chat/index.js 抄) ===
async function callLLM(system, history) {
  const messages = [
    { role: "system", content: system },
    ...history,
  ];

  const provider = "hunyuan";
  const modelName = "hy3-preview";
  console.log(`[callLLM] provider=${provider}, model=${modelName}, messages=${messages.length}`);

  // 真实调用 (mock 的):
  const ai = mockTcbApp.ai();
  const model = ai.createModel(provider);
  const result = await model.doGenerate({
    messages,
    model: modelName,
    temperature: 0.7,
  });

  // === 这里是我 v5.3 的解析逻辑 ===
  let text = null;
  if (result && result.response && result.response.choices && result.response.choices[0]) {
    text = result.response.choices[0].message?.content || result.response.choices[0].text;
  }
  // 兜底 PascalCase
  if (!text && result && result.rawResponse && result.rawResponse.Response) {
    const r = result.rawResponse.Response;
    if (r.Choices && r.Choices[0]) {
      text = r.Choices[0].Message?.Content || r.Choices[0].Message?.content;
    }
  }
  if (text) return text;
  throw new Error(`无法解析 AI 响应, result 摘要=${JSON.stringify(result).slice(0, 300)}`);
}

// === 跑测试 ===
(async () => {
  try {
    const result = await callLLM(
      "你是 CBT 治疗师",
      [{ role: "user", content: "我今天心情不好" }]
    );
    console.log('\n=== 测试结果 ===');
    console.log('返回文本:', result);
    console.log('✅ 解析逻辑正确, 拿到文本');
  } catch (e) {
    console.log('\n❌ 解析失败:', e.message);
  }
})();