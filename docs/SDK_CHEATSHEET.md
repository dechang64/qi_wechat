# 微信云函数 + CloudBase AI — SDK 真实 API 速查表

> 来源: npm 包源码 (`.d.ts` + `dist/cjs/*.js`), 不是博客/印象/猜.
> 创建时间: 2026-07-02, 在 qi_wechat 凌晨调试十几个版本后.

---

## wx-server-sdk (云函数基础 SDK)

**版本**: `^4.0.2` (package.json deps)

**npm 包**: https://registry.npmjs.org/wx-server-sdk/4.0.2
**tarball**: https://registry.npmjs.org/wx-server-sdk/-/wx-server-sdk-4.0.2.tgz
**真实导出**: 看 `index.d.ts` (27 KB, 6 文件, 无 `package.json` deps 字段, 0 个 AI 字段)

### 真实 API (`index.d.ts` 验证)

```ts
declare class Cloud {
    init(options: { env: string }): void;                  // 必填 env 字符串, 不传会 -501000
    database(): Database;
    uploadFile(opts): Promise<UploadFileResult>;
    downloadFile(opts): Promise<DownloadFileResult>;
    callFunction({name, data}): Promise<...>;
    getTempFileURL(opts): Promise<...>;
    deleteFile(opts): Promise<...>;
    getWXContext(): { OPENID, APPID, ENV, ... };          // 注意: ENV 是字符串!
    getCloudCallSign(opts): ...;
    getOpenData(opts): ...;
    getVoIPSign(opts): ...;
    openapi: { ... };
}
```

### ⚠️ 不存在的字段 (避坑)

- ❌ `cloud.ai` — **不存在**! index.d.ts 0 匹配. 之前 v5.2 错用.
- ❌ `cloud.extend.AI` — **不存在于 wx-server-sdk**. `wx.cloud.extend.AI` 是 **小程序客户端** (基础库 3.15.1+) 的 API, **云函数里不能用**.
- ❌ `cloud.modelRequest` / `cloud.chatCompletion` / `cloud.createModel` — 全部不存在.

### 用法示例 (云函数端)

```js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });   // 推荐用 DYNAMIC_CURRENT_ENV (Symbol)
const db = cloud.database();
const { OPENID } = cloud.getWXContext();           // OPENID 是字符串
```

---

## @cloudbase/node-sdk (云函数端 AI SDK)

**版本**: `^3.18.3`
**deps**: `@cloudbase/ai: ^2.23.0` (内部用, 不要单独装)
**tarball**: https://registry.npmjs.org/@cloudbase/node-sdk/-/cloudbase-node-sdk-3.18.3.tgz

### 真实导出 (`src/ai/index.ts` 验证)

```ts
import { AI } from '@cloudbase/ai';

export function createAI(cloudbase: CloudBase): AI {
    const envId = config.envName === SYMBOL_CURRENT_ENV ? getEnvIdFromContext() : config.envName;
    const baseUrl = buildCommonOpenApiUrlWithPath({...});
    const requestAdapter = new AIRequestAdapter(config, async () => {
        const credential = await cloudbase.auth().getClientCredential();
        return credential.access_token;
    });
    return new AI(requestAdapter, baseUrl, { t: (s) => s, lang: LANGS.ZH, LANG_HEADER_KEY: 'Accept-Language' });
}
```

**关键点**:
- `tcb.init({env: 字符串})` — **必须字符串**, 不能传 `cloud.DYNAMIC_CURRENT_ENV` (Symbol 跨包不兼容)
- `getEnvIdFromContext()` — 云函数里自动从 wx-server-sdk 上下文拿 env (但要 wx-server-sdk 配好了)

### AI 类真实签名 (`@cloudbase/ai/dist/cjs/AI.d.ts`)

```ts
declare class AI {
    baseUrl: string;
    aiBaseUrl: string;
    aiBotBaseUrl: string;
    bot: Bot;
    i18n: ICloudbaseConfig['i18n'];
    defaultHeaders: { [x: string]: any };

    constructor(req: SDKRequestInterface, baseUrl: string, i18n: ...);

    handleResponseData(responseData: Promise<unknown> | ReadableStream<Uint8Array>, header?: Headers): Promise<unknown>;

    createModel(model: string, options?: { defaultModelSubUrl?: string }): models.ReactModel;

    registerModel(name: string, model: types.ChatModelConstructor): void;

    createImageModel<const T extends 'hunyuan-exp' | (string & {})>(provider: T): models.DefaultImageModel<T>;

    modelRequest: types.ModelReq;     // ← 是方法 (callable), 调用 ai.modelRequest({url, data, stream})
    botRequest: types.BotReq;         // ← 同上
    registerFunctionTool(functionTool: types.FunctionTool): void;
}
```

### ModelReq 真实签名 (`type.d.ts` L23)

```ts
export interface IModelReqInput {
    url: string;                                 // ← 必填! 没传会 fallback 到某默认值
    headers?: Record<string, string>;
    data?: Object;
    stream?: boolean;                            // true 返 ReadableStream, false 返 Object
    timeout?: number;
}

export type ModelReq = <T extends IModelReqInput>(props: T) =>
    T['stream'] extends true
        ? Promise<ReadableStream<Uint8Array>>
        : Promise<Object>;
```

### HunYuanSimpleModel.doGenerate 真实实现 (`models/HunYuan/index.js` L69-90)

```js
HunYuanSimpleModel.prototype.doGenerate = function (data, options) {
    var res = await this.req({                              // this.req = ai.modelRequest
        url: this.url,                                      // baseUrl + '/hunyuan'
        headers: { 'X-Tc-Action': 'ChatCompletions' },
        data: { ...processInput(data), stream: false },     // 强制 stream: false
        stream: false,
        timeout: options?.timeout,
    });
    output = titleCaseToSnakeCase(res.Response);            // 大写 key 转 snake_case
    return { ...output, rawResponse: res };
};
```

### util.js titleCaseToSnakeCase (L39-54)

```js
function titleCaseToSnakeCase(obj) {
    // PascalCase → snake_case
    // Response → response, Choices → choices, Message → message, Content → content
    return Object.entries(obj).reduce((acc, [key, value]) => {
        var snakeCaseKey = toSnakeCase(key);
        acc[snakeCaseKey] = typeof value === 'object' ? titleCaseToSnakeCase(value) : value;
        return acc;
    }, {});
}
```

### 完整调用链 (权威, 不猜)

```js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });  // 拿 OPENID

const tcb = require('@cloudbase/node-sdk');
const app = tcb.init({ env: 'qi-wechat-dev-d7gxd20xreb567ce2' });  // ← 字符串!
const ai = app.ai();
const model = ai.createModel('hunyuan');         // HunYuanSimpleModel
const result = await model.doGenerate({         // 真实方法
    messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
    ],
    model: 'hy3-preview',                        // 可选, 默认 hunyuan-turbo
    temperature: 0.7,
});
// 文本路径 1: result.response.choices[0].message.content (snake_case, doGenerate 已转)
// 文本路径 2: result.rawResponse.Response.Choices[0].Message.Content (腾讯原生 PascalCase)
```

### 支持的 provider (从 dist/cjs/models/ 目录验证)

- `hunyuan` → subUrl=`hunyuan`
- `hunyuan-exp` → subUrl=`hunyuan-exp/chat/completions`
- `hunyuan-beta` → subUrl=`hunyuan-beta/openapi/v1/chat/completions`
- `deepseek`, `dashscope`, `ark`, `moonshot`, `yi`, `zhipu`, `default`

### 默认 model

- `hunyuan` provider 默认用 `hunyuan-turbo` (腾讯混元 turbo)
- `hy3-preview` 不是默认, 要显式传 `model: 'hy3-preview'`

---

## 调试教训 (写下来给未来的自己)

1. **不要猜 SDK API 名** — 连续猜 6 个不存在的方法 (`chatCompletion` / `createModel` / `textCompletion` / `modelRequest` / `bot.sendMessage` / `req.send`), 浪费时间 + 用户耐心.
2. **权威源优先级**: SDK 包源码 (`.d.ts` + `dist/`) > 官方 docs.example > GitHub README > 博客. **永远先看 .d.ts**.
3. **`wx-server-sdk` 和 `@cloudbase/node-sdk` 是两个不同的 SDK**, 不要混. 云函数 AI 用后者.
4. **Symbol 跨包不兼容** — `cloud.DYNAMIC_CURRENT_ENV` (wx-server-sdk Symbol) ≠ `tcb.SYMBOL_CURRENT_ENV` (@cloudbase/node-sdk Symbol). 跨包用真实字符串 env ID.
5. **trace 日志累积到 throw** — `errTrace.push(msg)`, 失败时 throw 把整个执行链带回前端. 这一招帮定位了 v0.1.13 真实 trace.
6. **`stream: false` 字段名小写 snake_case** — SDK 默认 PascalCase (`Stream: false`), 大小写错 SDK 走默认流式, 返 ReadableStream → circular JSON 错误.

---

## 调试 SOP (用户 2026-07-02 给的方法论)

```
Step 1: STOP — 不写一行业务代码, 先调研
  - npm pack <pkg>@<ver> + 解压看 .d.ts + dist/cjs/
  - 查官方 docs.example (有完整可运行代码, 不是片段)
  - 列真实方法名 / 真实参数 / 真实返回类型, 写到这个文件

Step 2: 写 trace 日志
  - const errTrace = []; const trace = msg => { console.log(msg); errTrace.push(msg); };
  - 失败时 throw new Error(`... Trace: ${errTrace.join(" | ")}`)

Step 3: 写本地 mock test
  - Module.prototype.require 注入 mock cloud / tcb
  - node test/<x>.test.js 跑通解析逻辑, 不依赖部署

Step 4: 才部署 / 上线
  - 部署后看云端 trace, 跟本地 trace 对比
  - 不要让用户截图抓 bug
```