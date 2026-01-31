import { getSheetsClient, ensureSheetExists } from './auth';
import { config } from '../config';

export interface WishlistItem {
  userId: string;
  productName: string;
  addedDate: string;
  lowestPrice?: number;
  source?: string;
  lastUpdated?: string;
}

const SHEET_NAME = '願望清單';

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export async function addWishlistItem(
  userId: string,
  productName: string
): Promise<WishlistItem> {
  await ensureSheetExists();
  const sheets = await getSheetsClient();
  const spreadsheetId = config.google.spreadsheetId;

  const now = formatDate(new Date());

  const newItem: WishlistItem = {
    userId,
    productName,
    addedDate: now,
  };

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_NAME}!A:F`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[userId, productName, now, '', '', '']],
    },
  });

  console.log(`已新增願望清單項目: ${productName} (使用者: ${userId})`);
  return newItem;
}

export async function removeWishlistItem(
  userId: string,
  productName: string
): Promise<boolean> {
  await ensureSheetExists();
  const sheets = await getSheetsClient();
  const spreadsheetId = config.google.spreadsheetId;

  // 取得所有資料
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A:F`,
  });

  const rows = response.data.values || [];
  if (rows.length <= 1) {
    return false; // 只有標題列
  }

  // 找到要刪除的列 (跳過標題列)
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row[0] === userId && row[1] === productName) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex === -1) {
    return false;
  }

  // 取得 sheet ID
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
  });

  const sheet = spreadsheet.data.sheets?.find(
    (s) => s.properties?.title === SHEET_NAME
  );

  if (!sheet?.properties?.sheetId) {
    throw new Error('找不到工作表');
  }

  // 刪除該列
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheet.properties.sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    },
  });

  console.log(`已刪除願望清單項目: ${productName} (使用者: ${userId})`);
  return true;
}

export async function getWishlistItems(userId: string): Promise<WishlistItem[]> {
  await ensureSheetExists();
  const sheets = await getSheetsClient();
  const spreadsheetId = config.google.spreadsheetId;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A:F`,
  });

  const rows = response.data.values || [];
  if (rows.length <= 1) {
    return [];
  }

  const items: WishlistItem[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row[0] === userId) {
      items.push({
        userId: row[0],
        productName: row[1],
        addedDate: row[2],
        lowestPrice: row[3] ? parseFloat(row[3]) : undefined,
        source: row[4] || undefined,
        lastUpdated: row[5] || undefined,
      });
    }
  }

  return items;
}

export async function getAllWishlistItems(): Promise<WishlistItem[]> {
  await ensureSheetExists();
  const sheets = await getSheetsClient();
  const spreadsheetId = config.google.spreadsheetId;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A:F`,
  });

  const rows = response.data.values || [];
  if (rows.length <= 1) {
    return [];
  }

  const items: WishlistItem[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    items.push({
      userId: row[0],
      productName: row[1],
      addedDate: row[2],
      lowestPrice: row[3] ? parseFloat(row[3]) : undefined,
      source: row[4] || undefined,
      lastUpdated: row[5] || undefined,
    });
  }

  return items;
}

export async function updateWishlistItemPrice(
  userId: string,
  productName: string,
  lowestPrice: number,
  source: string
): Promise<boolean> {
  await ensureSheetExists();
  const sheets = await getSheetsClient();
  const spreadsheetId = config.google.spreadsheetId;

  // 取得所有資料
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A:F`,
  });

  const rows = response.data.values || [];
  if (rows.length <= 1) {
    return false;
  }

  // 找到要更新的列
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row[0] === userId && row[1] === productName) {
      rowIndex = i + 1; // Sheets 是 1-indexed
      break;
    }
  }

  if (rowIndex === -1) {
    return false;
  }

  const now = formatDate(new Date());

  // 更新價格資訊
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!D${rowIndex}:F${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[lowestPrice, source, now]],
    },
  });

  console.log(`已更新價格: ${productName} = $${lowestPrice} (${source})`);
  return true;
}
