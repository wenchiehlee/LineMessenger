import axios from 'axios';
import * as cheerio from 'cheerio';

export interface MomoProduct {
  title: string;
  price: number;
  url: string;
  source: 'momo';
  image?: string;
}

const MOMO_SEARCH_URL = 'https://www.momoshop.com.tw/search/searchShop.jsp';
const MOMO_BASE_URL = 'https://www.momoshop.com.tw';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function searchMomo(keyword: string): Promise<MomoProduct[]> {
  try {
    const response = await axios.get(MOMO_SEARCH_URL, {
      params: {
        keyword,
        searchType: '1',
        cateLevel: '-1',
        curPage: '1',
        maxPage: '1',
      },
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
        'Referer': MOMO_BASE_URL,
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const products: MomoProduct[] = [];

    // momo 商品列表解析
    $('li.goodsItemLi').each((_, element) => {
      const $item = $(element);

      const title = $item.find('.prdName').text().trim();
      const priceText = $item.find('.price b').text().trim().replace(/[,\$]/g, '');
      const price = parseInt(priceText, 10);

      const linkElement = $item.find('a.goodsUrl');
      const href = linkElement.attr('href') || '';
      const url = href.startsWith('http') ? href : `${MOMO_BASE_URL}${href}`;

      const image = $item.find('img.goodsImg').attr('src') || undefined;

      if (title && price > 0) {
        products.push({
          title,
          price,
          url,
          source: 'momo',
          image,
        });
      }
    });

    // 備用選擇器 (momo 頁面結構可能變動)
    if (products.length === 0) {
      $('.listArea li').each((_, element) => {
        const $item = $(element);

        const title = $item.find('.goodsName, .prdName, [class*="name"]').text().trim();
        const priceText = $item.find('.price, [class*="price"]').text().trim();
        const priceMatch = priceText.match(/[\d,]+/);
        const price = priceMatch ? parseInt(priceMatch[0].replace(/,/g, ''), 10) : 0;

        const href = $item.find('a').first().attr('href') || '';
        const url = href.startsWith('http') ? href : `${MOMO_BASE_URL}${href}`;

        if (title && price > 0) {
          products.push({
            title,
            price,
            url,
            source: 'momo',
          });
        }
      });
    }

    return products.slice(0, 10);
  } catch (error) {
    console.error('momo 搜尋失敗:', error);
    return [];
  }
}
