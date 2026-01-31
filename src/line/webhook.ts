import { Request, Response, Router } from 'express';
import { middleware, WebhookEvent, TextMessage, MessageAPIResponseBase } from '@line/bot-sdk';
import { config } from '../config';
import { parseCommand, getHelpMessage } from './commands';
import { client } from './push';
import { addWishlistItem, removeWishlistItem, getWishlistItems } from '../sheets/wishlist';
import { comparePrices } from '../scrapers';

const router = Router();

const lineMiddleware = middleware({
  channelAccessToken: config.line.channelAccessToken,
  channelSecret: config.line.channelSecret,
});

async function handleTextMessage(
  event: WebhookEvent & { type: 'message'; message: { type: 'text'; text: string } }
): Promise<MessageAPIResponseBase | void> {
  const { replyToken, source, message } = event;
  const userId = source.userId;

  if (!userId) {
    console.log('無法取得使用者 ID');
    return;
  }

  const command = parseCommand(message.text);

  let replyText: string;

  switch (command.action) {
    case 'add':
      if (command.productName) {
        try {
          await addWishlistItem(userId, command.productName);
          replyText = `✅ 已將「${command.productName}」加入願望清單`;
        } catch (error) {
          console.error('新增願望清單失敗:', error);
          replyText = `❌ 新增失敗，請稍後再試`;
        }
      } else {
        replyText = '請輸入商品名稱，例如：新增 iPhone 16';
      }
      break;

    case 'delete':
      if (command.productName) {
        try {
          const deleted = await removeWishlistItem(userId, command.productName);
          if (deleted) {
            replyText = `✅ 已將「${command.productName}」從願望清單移除`;
          } else {
            replyText = `❌ 找不到「${command.productName}」`;
          }
        } catch (error) {
          console.error('刪除願望清單失敗:', error);
          replyText = `❌ 刪除失敗，請稍後再試`;
        }
      } else {
        replyText = '請輸入商品名稱，例如：刪除 iPhone 16';
      }
      break;

    case 'list':
      try {
        const items = await getWishlistItems(userId);
        if (items.length === 0) {
          replyText = '📋 你的願望清單是空的\n\n使用「新增 商品名稱」來加入商品';
        } else {
          const itemList = items
            .map((item, index) => {
              let line = `${index + 1}. ${item.productName}`;
              if (item.lowestPrice) {
                line += `\n   💰 最低價: $${item.lowestPrice.toLocaleString()} (${item.source})`;
              }
              return line;
            })
            .join('\n\n');
          replyText = `📋 願望清單 (${items.length} 項)\n\n${itemList}`;
        }
      } catch (error) {
        console.error('取得願望清單失敗:', error);
        replyText = `❌ 取得清單失敗，請稍後再試`;
      }
      break;

    case 'compare':
      if (command.productName) {
        replyText = `🔍 正在搜尋「${command.productName}」的最低價...`;
        await client.replyMessage(replyToken, { type: 'text', text: replyText });

        try {
          const results = await comparePrices(command.productName);
          if (results.length === 0) {
            await client.pushMessage(userId, {
              type: 'text',
              text: `❌ 找不到「${command.productName}」的相關商品`,
            });
          } else {
            const resultText = results
              .slice(0, 5)
              .map((r, i) => `${i + 1}. ${r.title}\n   💰 $${r.price.toLocaleString()} - ${r.source}\n   🔗 ${r.url}`)
              .join('\n\n');
            await client.pushMessage(userId, {
              type: 'text',
              text: `🔍 「${command.productName}」比價結果\n\n${resultText}`,
            });
          }
        } catch (error) {
          console.error('比價失敗:', error);
          await client.pushMessage(userId, {
            type: 'text',
            text: `❌ 比價失敗，請稍後再試`,
          });
        }
        return;
      } else {
        replyText = '請輸入商品名稱，例如：比價 iPhone 16';
      }
      break;

    default:
      replyText = getHelpMessage();
  }

  const textMessage: TextMessage = {
    type: 'text',
    text: replyText,
  };

  return client.replyMessage(replyToken, textMessage);
}

async function handleEvent(event: WebhookEvent): Promise<MessageAPIResponseBase | void> {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return;
  }

  return handleTextMessage(event as WebhookEvent & { type: 'message'; message: { type: 'text'; text: string } });
}

router.post('/webhook', lineMiddleware, async (req: Request, res: Response) => {
  const events: WebhookEvent[] = req.body.events;

  try {
    await Promise.all(events.map(handleEvent));
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook 處理錯誤:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
