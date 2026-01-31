# LINE 願望清單比價機器人

透過 LINE Bot 管理願望清單，自動從蝦皮和 momo 比價，價格下降時推播通知。

## 功能特色

- **願望清單管理** - 透過 LINE 訊息新增/刪除/查詢想買的商品
- **Google Sheets 同步** - 願望清單自動同步到 Google 試算表
- **即時比價** - 從蝦皮 (Shopee) 和 momo 搜尋最低價格
- **價格追蹤** - 定時檢查價格，下降時自動推播通知

## LINE Bot 指令

| 指令 | 說明 | 範例 |
|------|------|------|
| `新增 [商品]` | 加入願望清單 | `新增 iPhone 16` |
| `刪除 [商品]` | 從清單移除 | `刪除 iPhone 16` |
| `清單` | 顯示所有願望清單 | `清單` |
| `比價 [商品]` | 立即搜尋最低價 | `比價 AirPods Pro` |

---

## 系統架構

### 標準架構（單一伺服器）

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│  LINE App   │────▶│  Node.js        │────▶│ Google       │
│  (使用者)    │◀────│  Server         │◀────│ Sheets       │
└─────────────┘     └────────┬────────┘     └──────────────┘
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
              ┌──────────┐     ┌──────────┐
              │  Shopee  │     │   momo   │
              │  爬蟲     │     │  爬蟲     │
              └──────────┘     └──────────┘
```

### 免費平台架構（推薦）

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│  LINE App   │────▶│  Railway/Render │────▶│ Google       │
│  (使用者)    │◀────│  (Webhook)      │◀────│ Sheets       │
└─────────────┘     └────────┬────────┘     └──────────────┘
                             │
                    ┌────────┴────────┐
                    │  cron-job.org   │
                    │  (外部排程觸發)  │
                    │  GET /api/check-prices
                    └─────────────────┘
```

### GitHub Actions + Cloudflare Workers 架構

```
┌─────────────┐     ┌─────────────────────┐     ┌──────────────┐
│  LINE App   │────▶│  Cloudflare Workers │────▶│ Google       │
│  (使用者)    │◀────│  (Webhook 處理)      │◀────│ Sheets       │
└─────────────┘     └─────────────────────┘     └──────────────┘
                              │
                    ┌─────────┴─────────┐
                    │  GitHub Actions   │
                    │  (定時比價 Cron)   │
                    │  Schedule: 0 */6 * * *
                    └───────────────────┘
```

---

## 部署方案比較

| 平台 | 免費額度 | 優點 | 缺點 | 推薦度 |
|------|----------|------|------|--------|
| **Railway** | $5/月 | 最簡單、UI 友善 | 額度用完會停止 | ⭐⭐⭐⭐⭐ |
| **Zeabur** | 有限額度 | 台灣團隊、中文介面 | 免費額度較少 | ⭐⭐⭐⭐ |
| **Render** | 無限制 | 完全免費 | 閒置 15 分鐘休眠 | ⭐⭐⭐⭐ |
| **Fly.io** | 3 個 VM | 功能強大、可選東京區域 | CLI 設定較複雜 | ⭐⭐⭐⭐ |
| **GitHub Actions + Cloudflare** | 幾乎無限 | 完全免費、GitHub 整合 | 需拆分服務、需改寫程式碼 | ⭐⭐⭐ |
| **Vercel** | 無限制 | 部署極快 | Serverless 不適合持續 cron | ⭐⭐ |

### 外部 Cron 服務

| 服務 | 免費額度 | 最短間隔 |
|------|----------|----------|
| [cron-job.org](https://cron-job.org/) | 無限制 | 1 分鐘 |
| [UptimeRobot](https://uptimerobot.com/) | 50 個監控 | 5 分鐘 |
| [EasyCron](https://www.easycron.com/) | 200 次/月 | 20 分鐘 |
| GitHub Actions | 2,000 分鐘/月 | 5 分鐘 |

---

## 專案結構

```
LineMessenger/
├── src/
│   ├── index.ts              # 應用程式進入點
│   ├── config/
│   │   └── index.ts          # 環境變數設定
│   ├── line/
│   │   ├── webhook.ts        # LINE Webhook 處理
│   │   ├── commands.ts       # 指令解析
│   │   └── push.ts           # 推播服務
│   ├── sheets/
│   │   ├── auth.ts           # Google Sheets 認證
│   │   └── wishlist.ts       # 願望清單 CRUD
│   ├── scrapers/
│   │   ├── shopee.ts         # Shopee 爬蟲
│   │   ├── momo.ts           # momo 爬蟲
│   │   └── index.ts          # 比價整合
│   └── scheduler/
│       └── priceCheck.ts     # 定時比價排程
├── package.json
├── tsconfig.json
├── .env.example              # 環境變數範本
├── .gitignore
├── Dockerfile                # Docker 部署
├── railway.json              # Railway 設定
├── render.yaml               # Render 設定
├── fly.toml                  # Fly.io 設定
├── DEPLOY.md                 # 詳細部署指南
├── CLAUDE.md                 # Claude Code 指引
└── README.md                 # 本文件
```

---

## 快速開始

### 1. 環境準備

```bash
# 複製專案
git clone https://github.com/your-username/LineMessenger.git
cd LineMessenger

# 安裝依賴
npm install

# 複製環境變數範本
cp .env.example .env
```

### 2. 設定環境變數

編輯 `.env` 檔案：

```env
# LINE Bot (從 LINE Developers Console 取得)
LINE_CHANNEL_ACCESS_TOKEN=your_token
LINE_CHANNEL_SECRET=your_secret

# Google Sheets (從 Google Cloud Console 取得)
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id

# 伺服器
PORT=3000

# 排程 (免費平台設為 false，使用外部 cron)
ENABLE_INTERNAL_CRON=false
CRON_SECRET=your_random_secret
```

### 3. 本地開發

```bash
# 開發模式（自動重載）
npm run dev

# 或建置後執行
npm run build
npm start
```

### 4. 部署

詳見 [DEPLOY.md](./DEPLOY.md)

---

## API 端點

| 端點 | 方法 | 說明 |
|------|------|------|
| `/` | GET | 服務狀態 |
| `/health` | GET | 健康檢查 |
| `/line/webhook` | POST | LINE Webhook |
| `/api/check-prices` | GET | 觸發價格檢查（供外部 cron 使用） |

### 價格檢查 API

```bash
# 觸發價格檢查
curl "https://your-domain/api/check-prices?token=your_CRON_SECRET"
```

---

## 技術棧

| 類別 | 技術 |
|------|------|
| Runtime | Node.js 18+ |
| Language | TypeScript |
| Web Framework | Express |
| LINE SDK | @line/bot-sdk |
| Google API | googleapis |
| Web Scraping | axios + cheerio |
| Scheduler | node-cron |

---

## 待實作功能（TODO）

- [ ] GitHub Actions + Cloudflare Workers 方案
- [ ] 更多電商平台支援（PChome、Yahoo 購物）
- [ ] 價格歷史圖表
- [ ] 多使用者群組支援
- [ ] 商品圖片預覽
- [ ] 設定目標價格提醒

---

## 注意事項

1. **反爬蟲機制** - Shopee/momo 可能有反爬蟲，程式已加入請求間隔（2 秒）
2. **API 限制** - Google Sheets API 限制 60 次/分鐘
3. **LINE 推播限制** - 免費方案每月 500 則推播訊息
4. **休眠問題** - Render 免費方案閒置 15 分鐘會休眠，可用 UptimeRobot 定時 ping

---

## 授權

MIT License (2026 Wen-Chieh Lee)
