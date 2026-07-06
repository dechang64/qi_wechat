// 完全照搬 SDK dist/cjs/AI.js + models/HunYuan/index.js 源码
// 不许自己写任何 method, 看看 model 上真实有什么

const ModelReqStub = async function({ url, data, stream }) {
  // 模拟真实请求: 走 modelRequest 的 fetch
  // 这里只 mock 返回, 不发真请求
  console.log('[ModelReqStub] called url=', url, 'data=', JSON.stringify(data).slice(0, 100));
  return {
    Response: {
      Id: 'mock-resp-id',
      Choices: [{
        Index: 0,
        Message: { Role: 'assistant', Content: '【mock 真实 SDK 路径回复】我听到你说的话了.' },
        FinishReason: 'stop',
      }],
    },
  };
};

// AI class 完全按 AI.js L79-161 模拟
function AI(req, baseUrl, i18n) {
  this.req = req;
  this.baseUrl = baseUrl;
  const _this = this;

  this.modelRequest = async function({ url, data, headers, stream, timeout }) {
    const fetchHeaders = { 'Content-Type': 'application/json' };
    if (stream) Object.assign(fetchHeaders, { Accept: 'text/event-stream' });
    // 这里应该调 this.req.fetch, 我们 mock 直接返回
    return ModelReqStub({ url, data, stream });
  };

  this.aiBaseUrl = baseUrl + '/ai';
  this.aiBotBaseUrl = baseUrl + '/aibot';
  this.bot = {};
  this.i18n = i18n;
}

// 完全按 AI.js L192-209 模拟 createModel
AI.prototype.createModel = function(model, options) {
  const MODELS = {
    'hunyuan': HunYuanSimpleModel,
    'hunyuan-exp': HunYuanSimpleModel,  // 简化
    'hunyuan-beta': HunYuanSimpleModel,
  };
  let simpleModel;
  const SimpleModelConstructor = MODELS[model];
  if (SimpleModelConstructor) {
    simpleModel = new SimpleModelConstructor(this.modelRequest, this.aiBaseUrl);
  } else {
    const subUrl = typeof options?.defaultModelSubUrl === 'string' ? options.defaultModelSubUrl : '/chat/completions';
    simpleModel = new DefaultSimpleModel(this.modelRequest, this.aiBaseUrl, '' + model + subUrl);
  }
  return simpleModel;
};

// 完全照搬 HunYuan/index.js L53-90
function HunYuanSimpleModel(req, baseUrl, subUrl) {
  this.req = req;
  this.baseUrl = baseUrl;
  this.subUrl = 'hunyuan';
  if (subUrl != null) this.subUrl = subUrl;
}

Object.defineProperty(HunYuanSimpleModel.prototype, 'url', {
  get: function() { return this.baseUrl + '/' + this.subUrl; }
});

HunYuanSimpleModel.prototype.doGenerate = async function(data, options) {
  const res = await this.req({
    url: this.url,
    headers: { 'X-Tc-Action': 'ChatCompletions' },
    data: Object.assign({}, data, { stream: false }),
    stream: false,
    timeout: options?.timeout,
  });
  const output = titleCaseToSnakeCase(res.Response);
  return Object.assign({}, output, { rawResponse: res });
};

function titleCaseToSnakeCase(obj) {
  if (typeof obj !== 'object' || obj == null) return obj;
  if (Array.isArray(obj)) return obj.map(titleCaseToSnakeCase);
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const snakeKey = key.replace(/[A-Z]/g, m => '_' + m.toLowerCase()).replace(/^_/, '');
    acc[snakeKey] = typeof value === 'object' ? titleCaseToSnakeCase(value) : value;
    return acc;
  }, {});
}

// DefaultSimpleModel fallback (真实源码)
function DefaultSimpleModel(req, baseUrl, subUrl) {
  this.req = req;
  this.baseUrl = baseUrl;
  this.subUrl = subUrl;
}
DefaultSimpleModel.prototype.doGenerate = async function(data) {
  const res = await this.req({ url: this.baseUrl + '/' + this.subUrl, data, stream: false });
  return res;
};
DefaultSimpleModel.prototype.doStream = async function*(data) {
  yield 'mock stream';
};

// === 跑测试 ===
(async () => {
  const ai = new AI({}, 'https://mock-base-url.com', { t: s => s, lang: 'zh' });
  console.log('ai keys:', Object.keys(ai).join(','));
  console.log('typeof ai.createModel:', typeof ai.createModel);

  // 调 createModel('hunyuan')
  const model = ai.createModel('hunyuan');
  console.log('model.constructor.name:', model.constructor.name);
  console.log('model.url:', model.url);
  console.log('model 上的方法:');
  for (const k of Object.getOwnPropertyNames(Object.getPrototypeOf(model))) {
    console.log('  ', k, '=', typeof model[k]);
  }
  console.log('typeof model.doGenerate:', typeof model.doGenerate);
  console.log('typeof model.doStream:', typeof model.doStream);

  // 真调一次
  if (typeof model.doGenerate === 'function') {
    console.log('\n--- 真实调 doGenerate ---');
    const result = await model.doGenerate({
      messages: [{ role: 'user', content: 'test' }],
      model: 'hy3-preview',
    });
    console.log('result.response:', JSON.stringify(result.response).slice(0, 300));
    console.log('result.rawResponse.Response.Choices:', JSON.stringify(result.rawResponse.Response.Choices).slice(0, 300));
  } else {
    console.log('❌ model.doGenerate 真的不是 function!');
  }
})();