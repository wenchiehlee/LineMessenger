import { Client, TextMessage } from '@line/bot-sdk';
import { config } from '../config';

const client = new Client({
  channelAccessToken: config.line.channelAccessToken,
  channelSecret: config.line.channelSecret,
});

export interface PriceAlert {
  productName: string;
  oldPrice: number;
  newPrice: number;
  source: string;
  url?: string;
}

export async function pushPriceAlert(
  userId: string,
  alert: PriceAlert
): Promise<void> {
  const priceDiff = alert.oldPrice - alert.newPrice;
  const percentOff = ((priceDiff / alert.oldPrice) * 100).toFixed(1);

  let message = `🔔 價格下降通知！

商品：${alert.productName}
原價：$${alert.oldPrice.toLocaleString()}
現價：$${alert.newPrice.toLocaleString()}
降幅：$${priceDiff.toLocaleString()} (-${percentOff}%)
來源：${alert.source}`;

  if (alert.url) {
    message += `\n\n🔗 前往購買：${alert.url}`;
  }

  const textMessage: TextMessage = {
    type: 'text',
    text: message,
  };

  await client.pushMessage(userId, textMessage);
}

export async function pushMessage(userId: string, text: string): Promise<void> {
  const textMessage: TextMessage = {
    type: 'text',
    text,
  };

  await client.pushMessage(userId, textMessage);
}

export { client };
