import express from 'express';
import { config } from './config';
import lineWebhook from './line/webhook';
import { ensureSheetExists } from './sheets/auth';
import { startPriceCheckScheduler, runPriceCheck } from './scheduler/priceCheck';

const app = express();

// JSON 解析 (放在 LINE webhook 之前會有問題，所以只用於特定路由)
app.use(express.json());

// 健康檢查端點
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    name: 'LINE 願望清單比價機器人',
    version: '1.0.0',
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 手動觸發價格檢查 (供外部 cron 服務呼叫)
app.get('/api/check-prices', async (req, res) => {
  const authToken = req.query.token || req.headers['x-cron-token'];

  // 簡單的 token 驗證 (可選)
  if (process.env.CRON_SECRET && authToken !== process.env.CRON_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  console.log('收到外部 cron 觸發的價格檢查請求');

  // 非同步執行，立即回應
  res.json({ status: 'started', timestamp: new Date().toISOString() });

  // 背景執行價格檢查
  runPriceCheck().catch((error) => {
    console.error('價格檢查執行失敗:', error);
  });
});

// LINE Webhook
app.use('/line', lineWebhook);

async function bootstrap(): Promise<void> {
  console.log('=== LINE 願望清單比價機器人 ===');
  console.log(`環境: ${process.env.NODE_ENV || 'development'}`);

  try {
    // 確保 Google Sheets 工作表存在
    console.log('正在初始化 Google Sheets...');
    await ensureSheetExists();
    console.log('Google Sheets 初始化完成');

    // 如果啟用內建排程 (本地開發或有持續運行的環境)
    if (process.env.ENABLE_INTERNAL_CRON === 'true') {
      startPriceCheckScheduler();
    } else {
      console.log('內建排程已停用，請使用外部 cron 服務觸發 /api/check-prices');
    }

    // 啟動伺服器
    const port = config.server.port;
    app.listen(port, () => {
      console.log(`伺服器已啟動: http://localhost:${port}`);
      console.log(`LINE Webhook URL: /line/webhook`);
      console.log(`價格檢查 API: /api/check-prices`);
      console.log('');
      console.log('LINE Bot 指令:');
      console.log('  新增 [商品名稱] - 加入願望清單');
      console.log('  刪除 [商品名稱] - 從清單移除');
      console.log('  清單 - 顯示所有願望清單');
      console.log('  比價 [商品名稱] - 立即搜尋最低價');
    });
  } catch (error) {
    console.error('啟動失敗:', error);
    process.exit(1);
  }
}

// 優雅關閉
process.on('SIGINT', () => {
  console.log('\n正在關閉伺服器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n正在關閉伺服器...');
  process.exit(0);
});

bootstrap();
