qi_wechat/
├── backend/                    # FastAPI 后端
│   ├── main.py                 # API 入口
│   ├── config.py               # 配置 + 数据库
│   ├── db.py                   # SQLite (开发) / 阿里云 RDS (生产)
│   ├── models.py               # SQLAlchemy ORM
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── community.py       # 社区信息
│   │   ├── assessment.py       # 5 题评估
│   │   ├── booking.py          # 跨社区预约
│   │   ├── counselor.py        # 咨询师信息 + 排班
│   │   └── crisis.py           # 危机检测 + 24h 热线
│   ├── services/
│   │   ├── __init__.py
│   │   ├── crisis_detect.py    # 关键词检测
│   │   └── ai_chat.py          # AMAX 集成
│   └── requirements.txt
│
├── miniprogram/                # 微信小程序前端
│   ├── app.js                  # 全局入口
│   ├── app.json                # 全局配置
│   ├── app.wxss                # 全局样式
│   ├── project.config.json     # 小程序项目配置
│   ├── sitemap.json            # 站点搜索
│   ├── pages/
│   │   ├── home/               # 主页 (祺臻 logo + 4 个入口)
│   │   │   ├── home.js
│   │   │   ├── home.wxml
│   │   │   └── home.wxss
│   │   ├── chat/               # 倾诉 (AI 对话)
│   │   │   ├── chat.js
│   │   │   ├── chat.wxml
│   │   │   └── chat.wxss
│   │   ├── assessment/         # 5 题评估
│   │   │   ├── assessment.js
│   │   │   ├── assessment.wxml
│   │   │   └── assessment.wxss
│   │   ├── booking/            # 跨社区预约
│   │   │   ├── booking.js
│   │   │   ├── booking.wxml
│   │   │   └── booking.wxss
│   │   └── crisis/             # 危机页面
│   │       ├── crisis.js
│   │       ├── crisis.wxml
│   │       └── crisis.wxss
│   ├── components/             # 自定义组件
│   │   └── counselor-card/     # 咨询师卡片
│   ├── utils/                  # 工具
│   │   ├── request.js          # wx.request 封装
│   │   └── mock.js             # mock 数据 (开发)
│   └── images/                 # 图片资源 (logo 等)
│
├── docs/
│   ├── SETUP.md                # 注册测试号 + 部署
│   ├── PRD_wechat.md           # 微信小程序专版 PRD (1 page)
│   └── API.md                  # 后端 API 文档
│
├── README.md
└── .gitignore
