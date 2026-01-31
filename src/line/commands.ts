export interface ParsedCommand {
  action: 'add' | 'delete' | 'list' | 'compare' | 'unknown';
  productName?: string;
}

export function parseCommand(text: string): ParsedCommand {
  const trimmed = text.trim();

  // 新增商品：新增 xxx
  if (trimmed.startsWith('新增 ') || trimmed.startsWith('新增')) {
    const productName = trimmed.replace(/^新增\s*/, '').trim();
    if (productName) {
      return { action: 'add', productName };
    }
    return { action: 'unknown' };
  }

  // 刪除商品：刪除 xxx
  if (trimmed.startsWith('刪除 ') || trimmed.startsWith('刪除')) {
    const productName = trimmed.replace(/^刪除\s*/, '').trim();
    if (productName) {
      return { action: 'delete', productName };
    }
    return { action: 'unknown' };
  }

  // 查詢清單
  if (trimmed === '清單' || trimmed === '列表' || trimmed === '願望清單') {
    return { action: 'list' };
  }

  // 比價：比價 xxx
  if (trimmed.startsWith('比價 ') || trimmed.startsWith('比價')) {
    const productName = trimmed.replace(/^比價\s*/, '').trim();
    if (productName) {
      return { action: 'compare', productName };
    }
    return { action: 'unknown' };
  }

  return { action: 'unknown' };
}

export function getHelpMessage(): string {
  return `📋 願望清單比價機器人 使用說明

指令列表：
• 新增 [商品名稱] - 加入願望清單
• 刪除 [商品名稱] - 從清單移除
• 清單 - 顯示所有願望清單
• 比價 [商品名稱] - 立即搜尋最低價

範例：
• 新增 iPhone 16
• 刪除 iPhone 16
• 比價 AirPods Pro`;
}
