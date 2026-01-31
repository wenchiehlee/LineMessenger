import { google, sheets_v4 } from 'googleapis';
import { config } from '../config';

let sheetsClient: sheets_v4.Sheets | null = null;

export async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  if (sheetsClient) {
    return sheetsClient;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: config.google.serviceAccountEmail,
      private_key: config.google.privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

export async function ensureSheetExists(): Promise<void> {
  const sheets = await getSheetsClient();
  const spreadsheetId = config.google.spreadsheetId;

  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const sheetNames = response.data.sheets?.map((s) => s.properties?.title) || [];

    if (!sheetNames.includes('願望清單')) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: '願望清單',
                },
              },
            },
          ],
        },
      });

      // 新增標題列
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: '願望清單!A1:F1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [['使用者ID', '商品名稱', '新增日期', '最低價格', '來源', '最後更新']],
        },
      });

      console.log('已建立「願望清單」工作表');
    }
  } catch (error) {
    console.error('檢查/建立工作表失敗:', error);
    throw error;
  }
}
