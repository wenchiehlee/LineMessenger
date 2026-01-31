# 免費部署指南

本文件說明如何將 LINE 願望清單比價機器人部署到免費平台。

## 部署前準備

### 1. LINE Bot 設定

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 建立 Provider 和 Messaging API Channel
3. 取得 **Channel Access Token** 和 **Channel Secret**
4. 啟用 Webhook 並關閉「自動回應訊息」

### 2. Google Sheets 設定

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立專案並啟用 Google Sheets API
3. 建立 Service Account 並下載 JSON 金鑰
4. 建立 Google Sheets 試算表，將 Service Account Email 加為編輯者
5. 記下試算表 ID (網址中 `/d/` 和 `/edit` 之間的字串)

---

## 方案 A：Railway (推薦)

**免費額度：** $5/月 (約可運行 500 小時)

### 步驟

1. 前往 [Railway](https://railway.app/) 並用 GitHub 登入

2. 點選 **New Project** → **Deploy from GitHub repo**

3. 選擇此專案的 repo

4. 設定環境變數 (Settings → Variables)：
   ```
   LINE_CHANNEL_ACCESS_TOKEN=xxx
   LINE_CHANNEL_SECRET=xxx
   GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx
   GOOGLE_PRIVATE_KEY=xxx
   GOOGLE_SPREADSHEET_ID=xxx
   CRON_SECRET=隨機字串
   ENABLE_INTERNAL_CRON=false
   ```

5. 部署完成後，取得網址 (如 `https://xxx.up.railway.app`)

6. 到 LINE Developers Console 設定 Webhook URL：
   ```
   https://xxx.up.railway.app/line/webhook
   ```

### 設定外部 Cron

1. 前往 [cron-job.org](https://cron-job.org/) 免費註冊

2. 建立新 Cron Job：
   - URL: `https://xxx.up.railway.app/api/check-prices?token=你的CRON_SECRET`
   - Schedule: 每 6 小時 (`0 */6 * * *`)
   - Request method: GET

---

## 方案 B：Render

**免費方案：** 無限制，但閒置 15 分鐘會休眠

### 步驟

1. 前往 [Render](https://render.com/) 並用 GitHub 登入

2. 點選 **New** → **Web Service**

3. 連結 GitHub repo

4. 設定：
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

5. 加入環境變數 (同 Railway)

6. 部署完成後設定 LINE Webhook URL

### 防止休眠

使用 [UptimeRobot](https://uptimerobot.com/) 每 5 分鐘 ping `/health` 端點。

---

## 方案 C：Fly.io

**免費方案：** 3 個共用 CPU VM

### 步驟

1. 安裝 flyctl CLI：
   ```bash
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. 登入並部署：
   ```bash
   fly auth login
   fly launch --no-deploy

   # 設定 secrets
   fly secrets set LINE_CHANNEL_ACCESS_TOKEN=xxx
   fly secrets set LINE_CHANNEL_SECRET=xxx
   fly secrets set GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx
   fly secrets set GOOGLE_PRIVATE_KEY="xxx"
   fly secrets set GOOGLE_SPREADSHEET_ID=xxx
   fly secrets set CRON_SECRET=xxx

   # 部署
   fly deploy
   ```

3. 取得網址：`https://line-wishlist-bot.fly.dev`

---

## 方案 D：Zeabur (台灣團隊)

**免費方案：** 有限額度

### 步驟

1. 前往 [Zeabur](https://zeabur.com/) 並登入

2. 建立專案 → 從 GitHub 部署

3. 設定環境變數

4. 綁定網域

---

## 外部 Cron 服務比較

| 服務 | 免費方案 | 最短間隔 |
|------|----------|----------|
| [cron-job.org](https://cron-job.org/) | 無限制 | 1 分鐘 |
| [EasyCron](https://www.easycron.com/) | 200 次/月 | 20 分鐘 |
| [Pipedream](https://pipedream.com/) | 10,000 次/月 | 15 分鐘 |

---

## 環境變數說明

| 變數 | 說明 |
|------|------|
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Bot Channel Access Token |
| `LINE_CHANNEL_SECRET` | LINE Bot Channel Secret |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Google Service Account Email |
| `GOOGLE_PRIVATE_KEY` | Google Service Account Private Key |
| `GOOGLE_SPREADSHEET_ID` | Google Sheets 試算表 ID |
| `PORT` | 伺服器埠號 (平台通常自動設定) |
| `ENABLE_INTERNAL_CRON` | 是否啟用內建排程 (免費平台設為 `false`) |
| `CRON_SECRET` | 外部 Cron 呼叫驗證 Token |

---

## 疑難排解

### Webhook 驗證失敗

確認 LINE Webhook URL 格式正確：`https://your-domain/line/webhook`

### Google Sheets 權限錯誤

確認 Service Account Email 已加入試算表的編輯者

### 價格檢查沒有執行

1. 確認外部 Cron 服務有正確設定
2. 檢查 `CRON_SECRET` 是否正確
3. 查看平台的 log 確認是否有錯誤
