import cron from 'node-cron';
import { config } from '../config';
import { getAllWishlistItems, updateWishlistItemPrice } from '../sheets/wishlist';
import { findLowestPrice } from '../scrapers';
import { pushPriceAlert } from '../line/push';

interface PriceHistory {
  [key: string]: number; // userId:productName -> lastLowestPrice
}

const priceHistory: PriceHistory = {};

function getHistoryKey(userId: string, productName: string): string {
  return `${userId}:${productName}`;
}

async function checkPricesForItem(
  userId: string,
  productName: string,
  currentLowestPrice?: number
): Promise<void> {
  console.log(`檢查價格: ${productName}`);

  const result = await findLowestPrice(productName);

  if (!result) {
    console.log(`找不到 ${productName} 的價格資訊`);
    return;
  }

  const historyKey = getHistoryKey(userId, productName);
  const previousPrice = priceHistory[historyKey] || currentLowestPrice;

  // 更新 Google Sheets 中的價格
  await updateWishlistItemPrice(userId, productName, result.price, result.source);

  // 如果價格下降，發送通知
  if (previousPrice && result.price < previousPrice) {
    console.log(`價格下降通知: ${productName} ($${previousPrice} -> $${result.price})`);

    await pushPriceAlert(userId, {
      productName,
      oldPrice: previousPrice,
      newPrice: result.price,
      source: result.source,
      url: result.url,
    });
  }

  // 更新價格歷史
  priceHistory[historyKey] = result.price;
}

async function runPriceCheck(): Promise<void> {
  console.log('=== 開始定時價格檢查 ===');
  console.log(`時間: ${new Date().toISOString()}`);

  try {
    const items = await getAllWishlistItems();
    console.log(`共有 ${items.length} 項商品需要檢查`);

    // 逐一檢查每個商品 (加入延遲避免被封鎖)
    for (const item of items) {
      try {
        await checkPricesForItem(item.userId, item.productName, item.lowestPrice);

        // 每次請求間隔 2 秒，避免觸發反爬蟲機制
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`檢查 ${item.productName} 時發生錯誤:`, error);
      }
    }

    console.log('=== 價格檢查完成 ===');
  } catch (error) {
    console.error('價格檢查失敗:', error);
  }
}

let scheduledTask: cron.ScheduledTask | null = null;

export function startPriceCheckScheduler(): void {
  const cronExpression = config.scheduler.priceCheckCron;

  console.log(`啟動價格檢查排程: ${cronExpression}`);

  scheduledTask = cron.schedule(cronExpression, runPriceCheck, {
    scheduled: true,
    timezone: 'Asia/Taipei',
  });

  console.log('價格檢查排程已啟動');
}

export function stopPriceCheckScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('價格檢查排程已停止');
  }
}

export { runPriceCheck };
