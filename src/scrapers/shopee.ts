import axios from 'axios';

export interface ShopeeProduct {
  title: string;
  price: number;
  url: string;
  source: 'Shopee';
  image?: string;
  sold?: number;
  rating?: number;
}

const SHOPEE_API_URL = 'https://shopee.tw/api/v4/search/search_items';
const SHOPEE_BASE_URL = 'https://shopee.tw';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function searchShopee(keyword: string): Promise<ShopeeProduct[]> {
  try {
    const response = await axios.get(SHOPEE_API_URL, {
      params: {
        keyword,
        limit: 10,
        newest: 0,
        order: 'relevancy',
        page_type: 'search',
        scenario: 'PAGE_GLOBAL_SEARCH',
        version: 2,
      },
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
        'Referer': `${SHOPEE_BASE_URL}/search?keyword=${encodeURIComponent(keyword)}`,
      },
      timeout: 10000,
    });

    const items = response.data?.items || [];

    const products: ShopeeProduct[] = items.map((item: {
      item_basic?: {
        name?: string;
        price?: number;
        shopid?: number;
        itemid?: number;
        image?: string;
        historical_sold?: number;
        item_rating?: { rating_star?: number };
      };
    }) => {
      const basic = item.item_basic || {};
      const price = (basic.price || 0) / 100000; // Shopee 價格單位轉換

      return {
        title: basic.name || '',
        price,
        url: `${SHOPEE_BASE_URL}/product/${basic.shopid}/${basic.itemid}`,
        source: 'Shopee' as const,
        image: basic.image
          ? `https://cf.shopee.tw/file/${basic.image}`
          : undefined,
        sold: basic.historical_sold,
        rating: basic.item_rating?.rating_star,
      };
    });

    return products.filter((p) => p.title && p.price > 0);
  } catch (error) {
    console.error('Shopee 搜尋失敗:', error);
    // 如果 API 失敗，回傳空陣列而不是拋出錯誤
    return [];
  }
}
