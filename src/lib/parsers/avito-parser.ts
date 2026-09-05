import * as cheerio from 'cheerio';
import { ParsedProperty, ParseResult } from './parser-types';
import { browserPool } from './browser-pool';

const BOT_USER_AGENTS = [
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'TelegramBot (like TwitterBot)',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];

export async function parseAvitoUrl(url: string): Promise<ParseResult> {
  const cleanUrl = url.trim();

  // Попытка 1: Поочередный HTTP запрос с Bot User-Agent (обход капчи Avito)
  for (const ua of BOT_USER_AGENTS) {
    try {
      const response = await fetch(cleanUrl, {
        headers: {
          'User-Agent': ua,
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (response.ok) {
        const html = await response.text();
        const data = extractAvitoFromHtml(html, cleanUrl);
        if (data && data.price > 0 && data.area > 0) {
          return {
            success: true,
            data,
            method: 'cheerio',
          };
        }
      }
    } catch (e) {
      console.warn(`Avito Cheerio parse attempt with UA ${ua} failed:`, e);
    }
  }

  // Попытка 2: Эмуляция браузера через Playwright
  try {
    const { page, context } = await browserPool.getPage();
    try {
      await page.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForSelector('[data-marker="item-view/item-address"], [itemprop="price"], h1, meta[property="og:title"]', {
        timeout: 8000,
      }).catch(() => {});

      const html = await page.content();
      const data = extractAvitoFromHtml(html, cleanUrl);

      if (data && data.price > 0) {
        return {
          success: true,
          data,
          method: 'playwright',
        };
      }
    } finally {
      await context.close();
    }
  } catch (e: any) {
    console.warn('Avito Playwright fallback error:', e);
  }

  // Попытка 3: Частичное извлечение параметров из URL
  const fallbackData = extractFromAvitoUrlString(cleanUrl);
  if (fallbackData && fallbackData.price > 0) {
    return {
      success: true,
      data: fallbackData,
      method: 'url_extracted',
    };
  }

  return {
    success: false,
    error: 'Не удалось автоматически отпарсить объявление с Avito (возможно, сработала капча). Пожалуйста, введите данные объекта вручную.',
  };
}

function extractAvitoFromHtml(html: string, url: string): ParsedProperty | null {
  const $ = cheerio.load(html);

  let address = '';
  let price = 0;
  let area = 0;
  let rooms = 1;
  let floor = 1;
  let totalFloors = 1;
  let renovation = 'Косметический';
  let buildingMaterial = 'Монолит';
  let yearBuilt = 2020;
  let photo = '';
  let viewsTotal = 0;
  let viewsToday = 0;

  // 1. Извлечение OpenGraph Meta (Гуглбот и соцсети получают их почти всегда)
  const ogTitle = $('meta[property="og:title"]').attr('content') || $('meta[name="twitter:title"]').attr('content') || $('title').text() || '';
  const ogDesc = $('meta[property="og:description"]').attr('content') || $('meta[name="twitter:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
  const ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || '';

  if (ogImage) photo = ogImage;

  // Извлечение цены из OpenGraph или метаданных
  const priceMeta = $('meta[property="product:price:amount"]').attr('content') || $('meta[itemprop="price"]').attr('content');
  if (priceMeta) {
    price = Number(priceMeta);
  }

  const combinedMeta = ogTitle + ' ' + ogDesc;

  if (!price && combinedMeta) {
    const priceMatch = combinedMeta.match(/([\d\s]{5,})\s*(?:руб|₽)/i) || combinedMeta.match(/по\s+цене\s+([\d\s]{5,})/i);
    if (priceMatch) {
      const clean = priceMatch[1].replace(/\s/g, '');
      if (clean && !isNaN(Number(clean))) price = Number(clean);
    }
  }

  // Извлечение площади из Meta
  if (combinedMeta) {
    const areaMatch = combinedMeta.match(/([\d[.,]+)\s*м²/i);
    if (areaMatch) {
      area = parseFloat(areaMatch[1].replace(',', '.'));
    }
  }

  // Извлечение адреса из Meta
  if (ogTitle) {
    const addrMatch = ogTitle.match(/в\s+([^,]+(?:,[^,]+)*)\s+на\s+Авито/i) || ogTitle.match(/в\s+([^,]+(?:,[^,]+)*)/i);
    if (addrMatch) {
      address = addrMatch[1].trim();
    }
  }

  // 2. Извлечение JSON-LD
  try {
    $('script[type="application/ld+json"]').each((_, el) => {
      const text = $(el).html();
      if (!text) return;
      try {
        const json = JSON.parse(text);
        if (json['@type'] === 'Product' || json['@type'] === 'SingleFamilyResidence' || json['offers']) {
          if (json.offers?.price && !price) {
            price = Number(json.offers.price);
          }
          if (json.name && !address) {
            address = json.name;
          }
          if (json.image && !photo) {
            photo = Array.isArray(json.image) ? json.image[0] : json.image;
          }
        }
      } catch {}
    });
  } catch {}

  // 3. Извлечение window.__initialData__
  if (!price || !area) {
    const scripts = $('script').toArray();
    for (const script of scripts) {
      const content = $(script).html() || '';
      if (content.includes('window.__initialData__') || content.includes('__initialData__')) {
        try {
          const match = content.match(/window\.__initialData__\s*=\s*("[\s\S]*?"|{[\s\S]*?});/) || content.match(/__initialData__\s*=\s*({[\s\S]*?});/);
          if (match && match[1]) {
            let jsonStr = match[1];
            if (jsonStr.startsWith('"')) {
              jsonStr = JSON.parse(jsonStr);
            }
            const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
            const item = findObjectWithKeys(parsed, ['price', 'title', 'item']);
            if (item) {
              if (item.price && !price) price = Number(item.price);
              if (item.title && !address) address = item.title;
            }
          }
        } catch {}
      }
    }
  }

  // 4. DOM элементы
  if (!price) {
    const priceText =
      $('[data-marker="item-view/item-price"]').attr('content') ||
      $('[itemprop="price"]').attr('content') ||
      $('[data-marker="item-view/item-price"]').text() ||
      $('.js-item-price').text();
    const cleanPrice = priceText.replace(/\D/g, '');
    if (cleanPrice) price = Number(cleanPrice);
  }

  if (!address) {
    address =
      $('[data-marker="item-view/item-address"]').text().trim() ||
      $('[itemprop="streetAddress"]').text().trim() ||
      $('h1[data-marker="item-view/title-info"]').text().trim() ||
      $('h1').text().trim();
  }

  // Извлечение параметров
  const fullText = (ogTitle + ' ' + ogDesc + ' ' + $('[data-marker="item-view/item-params"]').text() + ' ' + $.text()).trim();

  if (/студия/i.test(fullText)) {
    rooms = 1;
  } else {
    const rMatch = fullText.match(/(\d+)\s*-\s*к(?:омн|атная|\.)?/i) || fullText.match(/Количество комнат[:\s]*(\d+)/i) || fullText.match(/(\d+)\s*(?:комн|комнат)/i);
    if (rMatch) rooms = parseInt(rMatch[1], 10);
  }

  if (!area) {
    const areaMatch = fullText.match(/(?:Общая площадь|Площадь):\s*([\d[.,]+)\s*м²/i) || fullText.match(/([\d[.,]+)\s*м²/i);
    if (areaMatch) area = parseFloat(areaMatch[1].replace(',', '.'));
  }

  const floorMatch = fullText.match(/Этаж:\s*(\d+)\s*из\s*(\d+)/i) || fullText.match(/(\d+)\s*\/\s*(\d+)\s*эт/i);
  if (floorMatch) {
    floor = parseInt(floorMatch[1], 10);
    totalFloors = parseInt(floorMatch[2], 10);
  }

  if (/дизайнерский/i.test(fullText)) renovation = 'Дизайнерский';
  else if (/евро/i.test(fullText)) renovation = 'Евро';
  else if (/без ремонта/i.test(fullText) || /требует ремонта/i.test(fullText)) renovation = 'Без ремонта';
  else if (/косметический/i.test(fullText)) renovation = 'Косметический';

  if (/монолит/i.test(fullText)) buildingMaterial = 'Монолит-кирпич';
  else if (/кирпич/i.test(fullText)) buildingMaterial = 'Кирпичный';
  else if (/панель/i.test(fullText)) buildingMaterial = 'Панельный';

  const urlFallback = extractFromAvitoUrlString(url);
  if (!area && urlFallback && urlFallback.area > 0) area = urlFallback.area;
  if ((!address || address.includes('Москва')) && urlFallback && urlFallback.address) address = urlFallback.address;
  if (rooms === 1 && urlFallback && urlFallback.rooms > 1) rooms = urlFallback.rooms;
  if (floor === 1 && urlFallback && urlFallback.floor > 1) floor = urlFallback.floor;
  if (totalFloors === 1 && urlFallback && urlFallback.totalFloors > 1) totalFloors = urlFallback.totalFloors;

  const pricePerSqm = (price > 0 && area > 0) ? Math.round(price / area) : 0;

  return {
    address: address || urlFallback?.address || 'Объект Avito',
    price: price || 0,
    area: area || 0,
    pricePerSqm,
    floor: floor || 1,
    totalFloors: totalFloors || 1,
    rooms: rooms || 1,
    renovation,
    buildingMaterial,
    yearBuilt: yearBuilt || 2020,
    photo: photo || '',
    viewsTotal: viewsTotal || 0,
    viewsToday: viewsToday || 0,
    source: 'avito',
  };
}

function extractFromAvitoUrlString(url: string): ParsedProperty | null {
  let rooms = 1;
  let area = 0;
  let totalFloors = 1;
  let floor = 1;
  let location = '';
  let offerId = '';

  // 1. Извлечение комнат (например, 1-k._kvartira)
  const roomsMatch = url.match(/(\d+)-k\._kvartira/i);
  if (roomsMatch) {
    rooms = parseInt(roomsMatch[1], 10);
  } else if (/studiya/i.test(url)) {
    rooms = 1;
  }

  // 2. Извлечение площади (например, 34.6_m)
  const areaMatch = url.match(/([\d.]+)_m/i);
  if (areaMatch) {
    area = parseFloat(areaMatch[1]);
  }

  // 3. Извлечение этажности и этажа (например, 29_et._8)
  const floorsMatch = url.match(/(\d+)_et\._(\d+)/i);
  if (floorsMatch) {
    totalFloors = parseInt(floorsMatch[1], 10);
    floor = parseInt(floorsMatch[2], 10);
  } else {
    const totalMatch = url.match(/(\d+)_et/i);
    if (totalMatch) totalFloors = parseInt(totalMatch[1], 10);
  }

  // 4. Извлечение локации из URL slugs
  const cityMatch = url.match(/avito\.ru\/([^\/]+)\//);
  if (cityMatch && cityMatch[1]) {
    const slug = cityMatch[1].toLowerCase();
    if (slug === 'spb' || slug === 'sankt-peterburg') location = 'г. Санкт-Петербург';
    else if (slug === 'moskva') location = 'г. Москва';
    else if (slug === 'yablonovskiy') location = 'пгт. Яблоновский';
    else if (slug === 'krasnodar') location = 'г. Краснодар';
    else location = `г. ${slug.charAt(0).toUpperCase() + slug.slice(1)}`;
  }

  // 5. Извлечение ID объявления
  const idMatch = url.match(/_(\d{8,})/);
  if (idMatch) offerId = idMatch[1];

  if (!offerId && !area) return null;

  return {
    address: `${location || 'Объект Avito'} (№${offerId})`,
    price: 0,
    area: area || 0,
    pricePerSqm: 0,
    floor: floor || 1,
    totalFloors: totalFloors || 1,
    rooms: rooms || 1,
    renovation: 'Косметический',
    buildingMaterial: 'Монолит-кирпич',
    yearBuilt: 2021,
    photo: '',
    viewsTotal: 0,
    viewsToday: 0,
    source: 'avito',
  };
}

function findObjectWithKeys(obj: any, keys: string[]): any {
  if (!obj || typeof obj !== 'object') return null;
  for (const key of keys) {
    if (key in obj) return obj;
  }
  for (const k of Object.keys(obj)) {
    const res = findObjectWithKeys(obj[k], keys);
    if (res) return res;
  }
  return null;
}
