import { searchShopee, ShopeeProduct } from './shopee';
import { searchMomo, MomoProduct } from './momo';

export interface PriceResult {
  title: string;
  price: number;
  url: string;
  source: string;
  image?: string;
}

export async function comparePrices(keyword: string): Promise<PriceResult[]> {
  console.log(`開始比價: ${keyword}`);

  // 同時搜尋 Shopee 和 momo
  const [shopeeResults, momoResults] = await Promise.all([
    searchShopee(keyword),
    searchMomo(keyword),
  ]);

  console.log(`Shopee 找到 ${shopeeResults.length} 項結果`);
  console.log(`momo 找到 ${momoResults.length} 項結果`);

  // 合併結果
  const allResults: PriceResult[] = [
    ...shopeeResults.map((p) => ({
      title: p.title,
      price: p.price,
      url: p.url,
      source: p.source,
      image: p.image,
    })),
    ...momoResults.map((p) => ({
      title: p.title,
      price: p.price,
      url: p.url,
      source: p.source,
      image: p.image,
    })),
  ];

  // 按價格排序 (低到高)
  allResults.sort((a, b) => a.price - b.price);

  return allResults;
}

export async function findLowestPrice(
  keyword: string
): Promise<PriceResult | null> {
  const results = await comparePrices(keyword);
  return results.length > 0 ? results[0] : null;
}

export { searchShopee, searchMomo };
export type { ShopeeProduct, MomoProduct };
