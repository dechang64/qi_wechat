// 本地 mock 测试 chat 云函数, 不依赖部署
// 模拟 wx-server-sdk 的 cloud 对象 + 注入 tcb.init mock
const Module = require('module');
const originalResolve = Module._resolveFilename;
const originalLoad = Module._load;

// === 1. Mock wx-server-sdk ===
const cloudMock = {
  init: (opts) => { console.log('[mock cloud.init]', opts); },
  getWXContext: () => ({ OPENID: 'mock_openid_xxx', ENV: 'qi-wechat-dev-d7gxd20xreb567ce2' }),
  database: () => ({
    collection: () => ({
      add: async (d) => { console.log('[mock db.add]', d.data); return { _id: 'mock_id' }; },
      where: () => ({
        orderBy: () => ({
          limit: () => ({ get: async () => ({ data: [] }) }),
        }),
      }),
    }),
  }),
};

// === 2. Mock @cloudbase/node-sdk ===
// 真实 API: tcb.init({env: '字符串'}) -> { ai(): AIInstance }
//           AIInstance.createModel('hunyuan') -> HunYuanSimpleModel
//           HunYuanSimpleModel.doGenerate({messages, model}) -> {response: {choices: [...]}}
// 关键: 不 mock 真的, 让 SDK 跑真实代码!

const tcbReal = require('@cloudbase/node-sdk');
console.log('[test] tcb keys:', Object.keys(tcbReal).join(','));

(async () => {
  try {
    console.log('[test] init tcb with env...');
    const app = tcbReal.init({ env: 'qi-wechat-dev-d7gxd20xreb567ce2' });
    console.log('[test] app keys:', Object.keys(app).join(','));
    const ai = app.ai();
    console.log('[test] ai keys:', Object.keys(ai).join(','));
    console.log('[test] ai.baseUrl:', ai.baseUrl);
    console.log('[test] ai.aiBaseUrl:', ai.aiBaseUrl);

    console.log('[test] createModel("hunyuan")...');
    const model = ai.createModel('hunyuan');
    console.log('[test] model.constructor.name:', model.constructor.name);
    console.log('[test] model 上的方法:', Object.getOwnPropertyNames(Object.getPrototypeOf(model)).join(','));
    console.log('[test] typeof model.doGenerate:', typeof model.doGenerate);
    console.log('[test] typeof model.doStream:', typeof model.doStream);
  } catch (e) {
    console.log('[test] ERROR:', e.message);
    console.log('[test] stack:', e.stack);
  }
})();