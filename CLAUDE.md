# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LINE 願望清單比價機器人 - 透過 LINE Bot 管理願望清單，自動從蝦皮和 momo 比價，價格下降時推播通知。

## Current Implementation Status

| 模組 | 狀態 | 檔案 |
|------|------|------|
| 專案設定 | ✅ 完成 | `package.json`, `tsconfig.json` |
| 環境變數 | ✅ 完成 | `src/config/index.ts` |
| LINE Webhook | ✅ 完成 | `src/line/webhook.ts` |
| 指令解析 | ✅ 完成 | `src/line/commands.ts` |
| LINE 推播 | ✅ 完成 | `src/line/push.ts` |
| Google Sheets 認證 | ✅ 完成 | `src/sheets/auth.ts` |
| 願望清單 CRUD | ✅ 完成 | `src/sheets/wishlist.ts` |
| Shopee 爬蟲 | ✅ 完成 | `src/scrapers/shopee.ts` |
| momo 爬蟲 | ✅ 完成 | `src/scrapers/momo.ts` |
| 比價整合 | ✅ 完成 | `src/scrapers/index.ts` |
| 排程模組 | ✅ 完成 | `src/scheduler/priceCheck.ts` |
| 應用程式進入點 | ✅ 完成 | `src/index.ts` |
| 部署設定 | ✅ 完成 | `railway.json`, `render.yaml`, `fly.toml`, `Dockerfile` |

## Deployment Options Summary

| 方案 | 架構 | 推薦度 |
|------|------|--------|
| Railway + cron-job.org | 單一伺服器 + 外部 cron | ⭐⭐⭐⭐⭐ |
| Render + UptimeRobot | 單一伺服器 + 防休眠 ping | ⭐⭐⭐⭐ |
| Fly.io | 單一伺服器 + 外部 cron | ⭐⭐⭐⭐ |
| GitHub Actions + Cloudflare Workers | 分離式：Workers 處理 webhook，Actions 執行 cron | ⭐⭐⭐ (未實作) |

詳見 `README.md` 和 `DEPLOY.md`

## Build & Run Commands

```bash
npm install      # 安裝依賴
npm run dev      # 開發模式 (自動重載)
npm run build    # 建置 TypeScript
npm start        # 生產模式執行
```

## Project Structure

```
src/
├── index.ts              # 應用程式進入點，Express 伺服器
├── config/
│   └── index.ts          # 環境變數與設定
├── line/
│   ├── webhook.ts        # LINE Webhook 路由，處理訊息事件
│   ├── commands.ts       # 指令解析 (新增/刪除/清單/比價)
│   └── push.ts           # LINE 推播訊息服務
├── sheets/
│   ├── auth.ts           # Google Sheets API 認證
│   └── wishlist.ts       # 願望清單 CRUD 操作
├── scrapers/
│   ├── shopee.ts         # Shopee API 爬蟲
│   ├── momo.ts           # momo HTML 爬蟲 (cheerio)
│   └── index.ts          # 比價整合，合併結果並排序
└── scheduler/
    └── priceCheck.ts     # node-cron 排程，支援外部觸發
```

## Key API Endpoints

| 端點 | 方法 | 說明 |
|------|------|------|
| `/health` | GET | 健康檢查 |
| `/line/webhook` | POST | LINE Webhook |
| `/api/check-prices?token=xxx` | GET | 外部 cron 觸發價格檢查 |

## Environment Variables

```env
LINE_CHANNEL_ACCESS_TOKEN=     # LINE Bot Token
LINE_CHANNEL_SECRET=           # LINE Bot Secret
GOOGLE_SERVICE_ACCOUNT_EMAIL=  # Google Service Account
GOOGLE_PRIVATE_KEY=            # Google Private Key (含換行符號)
GOOGLE_SPREADSHEET_ID=         # Google Sheets ID
PORT=3000                      # 伺服器埠號
ENABLE_INTERNAL_CRON=false     # 內建排程 (免費平台設 false)
CRON_SECRET=                   # 外部 cron 驗證 token
```

## TODO / Next Steps

- [ ] 實作 GitHub Actions + Cloudflare Workers 方案
- [ ] 新增更多電商平台 (PChome, Yahoo)
- [ ] 價格歷史圖表功能
- [ ] 單元測試
- [ ] 錯誤處理強化

## License

MIT License (2026 Wen-Chieh Lee)
