import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`環境變數 ${name} 未設定`);
  }
  return value;
}

export const config = {
  // LINE Bot 設定
  line: {
    channelAccessToken: requireEnv('LINE_CHANNEL_ACCESS_TOKEN'),
    channelSecret: requireEnv('LINE_CHANNEL_SECRET'),
  },

  // Google Sheets 設定
  google: {
    serviceAccountEmail: requireEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
    privateKey: requireEnv('GOOGLE_PRIVATE_KEY').replace(/\\n/g, '\n'),
    spreadsheetId: requireEnv('GOOGLE_SPREADSHEET_ID'),
  },

  // 伺服器設定
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
  },

  // 排程設定
  scheduler: {
    priceCheckCron: process.env.PRICE_CHECK_CRON || '0 */6 * * *',
  },
};

export default config;
