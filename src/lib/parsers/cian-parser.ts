import * as cheerio from 'cheerio';
import { ParsedProperty, ParseResult } from './parser-types';
import { browserPool } from './browser-pool';
import { cleanAddressString, isSpecificStreetAddress } from './address-sanitizer';

const BOT_USER_AGENTS = [
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'TelegramBot (like TwitterBot)',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];

export async function parseCianUrl(url: string): Promise<ParseResult> {
  const cleanUrl = url.trim();
  const idMatch = cleanUrl.match(/flat\/(\d+)/) || cleanUrl.match(/(\d{7,})/);
  const offerId = idMatch ? idMatch[1] : '';

  // Попытка 1: Прямой запрос к CIAN JSON API (самый быстрый и надежный обход Cloudflare)
  if (offerId) {
    try {
      const apiRes = await fetch(`https://www.cian.ru/cian-api/site/v1/offer/get-offer-by-id/?offerId=${offerId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (apiRes.ok) {
        const json = await apiRes.json();
        const offer = json?.data?.offer || json?.offer;
        if (offer) {
          const data = extractFromCianJsonObject(offer, cleanUrl, offerId);
          if (data && data.price > 0 && data.area > 0) {
            return {
              success: true,
              data,
              method: 'cheerio',
            };
          }
        }
      }
    } catch (e) {
      console.warn('CIAN API fetch attempt failed:', e);
    }
  }

  // Попытка 2: Быстрый HTTP запрос через Bot User-Agent (Гуглбот)
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
        const data = extractCianFromHtml(html, cleanUrl);
        if (data && data.price > 0 && data.area > 0) {
          return {
            success: true,
            data,
            method: 'cheerio',
          };
        }
      }
    } catch (e) {
      console.warn(`CIAN Cheerio parse attempt with UA ${ua} failed:`, e);
    }
  }

  // Попытка 3: Эмуляция браузера через Playwright
  try {
    const { page, context } = await browserPool.getPage();
    try {
      await page.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForSelector('[data-name="OfferHeader"], [data-name="PriceInfo"], h1, meta[property="og:title"]', {
        timeout: 8000,
      }).catch(() => {});

      const html = await page.content();
      const data = extractCianFromHtml(html, cleanUrl);

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
    console.warn('CIAN Playwright fallback error:', e);
  }

  // Попытка 4: Извлечение частичных данных из URL если есть
  const fallbackData = extractFromCianUrlString(cleanUrl);
  if (fallbackData && fallbackData.price > 0) {
    return {
      success: true,
      data: fallbackData,
      method: 'url_extracted',
    };
  }

  return {
    success: false,
    error: 'Не удалось автоматически парсить данные с ЦИАН. Защита сайта от ботов заблокировала запрос. Пожалуйста, укажите параметры объекта вручную.',
  };
}

function extractFromCianJsonObject(offer: any, url: string, offerId: string): ParsedProperty {
  let price = Number(offer.bargainTerms?.priceRur || offer.priceRur || offer.bargainTerms?.price || 0);
  let area = parseFloat(offer.totalArea || offer.area || offer.allArea || 0);
  let floor = Number(offer.floorNumber || offer.floor || 1);
  let totalFloors = Number(offer.building?.floorsCount || offer.floorsCount || 1);
  let rooms = Number(offer.roomsCount || offer.rooms || 1);
  let address = '';

  if (offer.geo?.address && Array.isArray(offer.geo.address)) {
    address = offer.geo.address
      .filter((a: any) => a.type !== 'country')
      .map((a: any) => a.fullName || a.name)
      .join(', ');
  } else if (offer.geo?.userInput) {
    address = offer.geo.userInput;
  }

  let photo = '';
  if (offer.photos && offer.photos.length > 0) {
    photo = offer.photos[0].fullUrl || offer.photos[0].url || '';
  }

  let renovation = 'Евроремонт';
  if (offer.repairType === 'designer') renovation = 'Дизайнерский';
  else if (offer.repairType === 'cosmetic') renovation = 'Косметический';
  else if (offer.repairType === 'no') renovation = 'Без ремонта';

  let buildingMaterial = 'Монолит-кирпич';
  if (offer.building?.materialType === 'brick') buildingMaterial = 'Кирпичный';
  else if (offer.building?.materialType === 'panel') buildingMaterial = 'Панельный';

  const pricePerSqm = area > 0 ? Math.round(price / area) : 0;

  return {
    address: cleanCianAddress(address) || extractAddressFromUrl(url) || `г. Москва (Объект ЦИАН №${offerId})`,
    price: price || 0,
    area: area || 0,
    pricePerSqm,
    floor: floor || 1,
    totalFloors: totalFloors || 1,
    rooms: rooms || 1,
    renovation,
    buildingMaterial,
    yearBuilt: Number(offer.building?.buildYear) || 2023,
    photo: photo || '',
    viewsTotal: Number(offer.stats?.totalViews) || 0,
    viewsToday: Number(offer.stats?.dailyViews) || 0,
    source: 'cian',
  };
}

function extractCianFromHtml(html: string, url: string): ParsedProperty | null {
  const $ = cheerio.load(html);

  let address = '';
  let price = 0;
  let area = 0;
  let rooms = 1;
  let floor = 0;
  let totalFloors = 0;
  let renovation = 'Евроремонт';
  let buildingMaterial = 'Монолит-кирпич';
  let yearBuilt = 2023;
  let photo = '';
  let viewsTotal = 0;
  let viewsToday = 0;

  const ogTitle = $('meta[property="og:title"]').attr('content') || $('meta[name="twitter:title"]').attr('content') || $('title').text() || '';
  const ogDesc = $('meta[property="og:description"]').attr('content') || $('meta[name="twitter:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
  const ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || '';

  if (ogImage) photo = ogImage;

  // 1. Извлечение цены
  const priceMeta = $('meta[property="product:price:amount"]').attr('content') || $('meta[itemprop="price"]').attr('content');
  if (priceMeta) price = Number(priceMeta);

  const combinedMeta = ogTitle + ' ' + ogDesc;

  if (!price && combinedMeta) {
    const priceMatch = combinedMeta.match(/([\d\s]{5,})\s*(?:руб|₽)/i) || combinedMeta.match(/цена\s+([\d\s]{5,})/i);
    if (priceMatch) {
      const clean = priceMatch[1].replace(/\s/g, '');
      if (clean && !isNaN(Number(clean))) price = Number(clean);
    }
  }

  // 2. Извлечение площади (исправлен regex)
  if (combinedMeta) {
    const areaMatch = combinedMeta.match(/([\d.,]+)\s*м²/i);
    if (areaMatch) {
      area = parseFloat(areaMatch[1].replace(',', '.'));
    }
  }

  // 3. Извлечение адреса из ogTitle / meta
  if (ogTitle) {
    const addrMatch = ogTitle.match(/по адресу\s+([^|—]+)/i);
    if (addrMatch) {
      address = cleanCianAddress(addrMatch[1].trim());
    }
  }

  // 4. Поиск в скриптах JSON (_cianConfig / initialState)
  const scripts = $('script').toArray();
  for (const script of scripts) {
    const content = $(script).html() || '';
    if (
      content.includes('_cianConfig') ||
      content.includes('offerData') ||
      content.includes('initialState') ||
      content.includes('bargainTerms') ||
      content.includes('frontend-offer-card')
    ) {
      try {
        const match =
          content.match(/window\._cianConfig\s*=\s*({[\s\S]*?});/) ||
          content.match(/initialState\s*=\s*({[\s\S]*?});/) ||
          content.match(/offerData\s*=\s*({[\s\S]*?});/);
        if (match && match[1]) {
          const json = JSON.parse(match[1]);
          const offer =
            json['frontend-offer-card']?.offer ||
            json.offerData?.offer ||
            json.initialState?.offer ||
            findObjectWithKeys(json, ['bargainTerms', 'totalArea', 'floorNumber', 'building']);

          if (offer) {
            if (offer.bargainTerms?.priceRur && !price) price = Number(offer.bargainTerms.priceRur);
            if ((offer.totalArea || offer.area || offer.allArea) && !area) {
              area = parseFloat(offer.totalArea || offer.area || offer.allArea);
            }
            if (offer.floorNumber && !floor) floor = Number(offer.floorNumber);
            if (offer.building?.floorsCount && !totalFloors) totalFloors = Number(offer.building.floorsCount);
            if (offer.roomsCount && !rooms) rooms = Number(offer.roomsCount);
            if (offer.geo?.address) {
              const geoFormatted = cleanCianAddress(offer.geo.address.map((a: any) => a.fullName || a.name).join(', '));
              if (geoFormatted && (!address || isSpecificStreetAddress(geoFormatted))) {
                address = geoFormatted;
              }
            }
            if (offer.photos && offer.photos.length > 0 && !photo) {
              photo = offer.photos[0].fullUrl || offer.photos[0].url;
            }
            if (offer.building?.buildYear && yearBuilt === 2023) {
              yearBuilt = Number(offer.building.buildYear);
            }
            if (offer.stats) {
              if (offer.stats.totalViews) viewsTotal = Number(offer.stats.totalViews);
              if (offer.stats.dailyViews) viewsToday = Number(offer.stats.dailyViews);
            }
          }
        }
      } catch {}
    }
  }

  // 5. Поиск в JSON-LD
  if (!price || !area || !floor) {
    try {
      $('script[type="application/ld+json"]').each((_, el) => {
        const text = $(el).html();
        if (!text) return;
        try {
          const json = JSON.parse(text);
          if (json.offers?.price && !price) price = Number(json.offers.price);
          if (json.name && !address && !isCianTitle(json.name)) address = cleanCianAddress(json.name);
          if (json.image && !photo) photo = Array.isArray(json.image) ? json.image[0] : json.image;
          if (json.floorLevel && !floor) floor = Number(json.floorLevel);
          if (json.numberOfFloors && !totalFloors) totalFloors = Number(json.numberOfFloors);
          if (json.floorSize?.value && !area) area = parseFloat(json.floorSize.value);
        } catch {}
      });
    } catch {}
  }

  // 6. Парсинг конкретных блоков DOM карточки ЦИАН
  $('[data-name="ObjectSummaryDescription"] [data-name="SummaryItem"], [data-name="SummaryInfo"] div, [data-name="ParentInfo"]').each((_, el) => {
    const text = $(el).text().trim();
    if (!area && text.includes('м²')) {
      const m = text.match(/([\d.,]+)\s*м²/);
      if (m) area = parseFloat(m[1].replace(',', '.'));
    }
    if ((!floor || !totalFloors) && text.includes('Этаж')) {
      const m = text.match(/(\d+)\s*из\s*(\d+)/);
      if (m) {
        if (!floor) floor = parseInt(m[1], 10);
        if (!totalFloors) totalFloors = parseInt(m[2], 10);
      }
    }
    if (text.includes('Год постройки')) {
      const m = text.match(/(\d{4})/);
      if (m) yearBuilt = parseInt(m[1], 10);
    }
  });

  if (!price) {
    const priceText =
      $('[data-name="PriceInfo"]').text() ||
      $('[data-testid="price-amount"]').text() ||
      $('.a10a3f92e9--price_value--').text();
    const cleanPrice = priceText.replace(/\D/g, '');
    if (cleanPrice) price = Number(cleanPrice);
  }

  if (!address) {
    const geoText =
      $('[data-name="Geo"]').text().trim() ||
      $('[data-name="AddressContainer"]').text().trim() ||
      $('[data-name="AddressItem"]').text().trim() ||
      $('address').text().trim();

    if (geoText && !isCianTitle(geoText)) {
      address = cleanCianAddress(geoText);
    }
  }

  const fullText = (ogTitle + ' ' + ogDesc + ' ' + $.text()).trim();

  // Извлечение площади из полного текста страницы если все еще 0
  if (!area) {
    const areaMatch = fullText.match(/(?:Общая площадь|Площадь)[:\s]*([\d.,]+)\s*м²/i) || fullText.match(/([\d.,]+)\s*м²/i);
    if (areaMatch) {
      area = parseFloat(areaMatch[1].replace(',', '.'));
    }
  }

  // Извлечение этажа только по строгому контексту "Этаж X из Y"
  if (!floor || !totalFloors) {
    const fMatch = fullText.match(/Этаж[:\s]*(\d+)\s*(?:из|\/)\s*(\d+)/i) || fullText.match(/(\d+)\s*эт(?:аж)?\s*(?:из|\/)\s*(\d+)/i);
    if (fMatch) {
      if (!floor) floor = parseInt(fMatch[1], 10);
      if (!totalFloors) totalFloors = parseInt(fMatch[2], 10);
    }
  }

  // Извлечение года постройки
  if (yearBuilt === 2023) {
    const yMatch = fullText.match(/Год постройки[:\s]*(\d{4})/i) || fullText.match(/построен в\s*(\d{4})/i);
    if (yMatch) yearBuilt = parseInt(yMatch[1], 10);
  }

  if (!rooms || rooms === 1) {
    if (/студия/i.test(fullText)) {
      rooms = 1;
    } else {
      const rMatch = fullText.match(/(\d+)\s*-\s*к(?:омн|атная|\.)?/i) || fullText.match(/(\d+)\s*(?:комнатная|комнат)/i);
      if (rMatch) rooms = parseInt(rMatch[1], 10);
    }
  }

  if (/дизайнерский/i.test(fullText)) renovation = 'Дизайнерский';
  else if (/евро/i.test(fullText)) renovation = 'Евроремонт';
  else if (/косметический/i.test(fullText)) renovation = 'Косметический';
  else if (/без ремонта/i.test(fullText)) renovation = 'Без ремонта';

  if (!price && !area && !address) {
    return null;
  }

  const pricePerSqm = (price > 0 && area > 0) ? Math.round(price / area) : 0;

  return {
    address: address || extractAddressFromUrl(url) || 'г. Москва (Объект ЦИАН)',
    price: price || 0,
    area: area || 0,
    pricePerSqm,
    floor: floor || 1,
    totalFloors: totalFloors || 1,
    rooms: rooms || 1,
    renovation,
    buildingMaterial,
    yearBuilt: yearBuilt || 2023,
    photo: photo || '',
    viewsTotal: viewsTotal || 0,
    viewsToday: viewsToday || 0,
    source: 'cian',
  };
}

function cleanCianAddress(addr: string): string {
  if (!addr) return '';
  const cleaned = cleanAddressString(addr);
  if (isCianTitle(cleaned)) return '';
  return cleaned;
}

function isCianTitle(text: string): boolean {
  if (!text) return true;
  const lower = text.toLowerCase();
  return (
    lower.startsWith('продаю') ||
    lower.startsWith('продает') ||
    lower.startsWith('купить') ||
    lower.startsWith('снять') ||
    lower.startsWith('сдам') ||
    (lower.includes('апартаменты') && !lower.includes('улиц') && !lower.includes('проспект') && !lower.includes('дом') && !lower.includes('проезд'))
  );
}

function extractFromCianUrlString(url: string): ParsedProperty | null {
  const isSpb = url.includes('spb');
  const city = isSpb ? 'г. Санкт-Петербург' : 'г. Москва';
  const idMatch = url.match(/flat\/(\d+)/) || url.match(/(\d{7,})/);
  const offerId = idMatch ? idMatch[1] : '';

  // Extract area/rooms if present in URL slug
  let area = 0;
  let rooms = 1;
  const areaMatch = url.match(/([\d[.,]+)\s*-?m2/i) || url.match(/([\d[.,]+)_m/i);
  if (areaMatch) area = parseFloat(areaMatch[1].replace(',', '.'));

  const roomsMatch = url.match(/(\d+)-komn/i) || url.match(/(\d+)-k/i);
  if (roomsMatch) rooms = parseInt(roomsMatch[1], 10);

  if (!offerId && !area) return null;

  return {
    address: isSpb ? `${city} (Объект ЦИАН №${offerId})` : `${city} (Объект ЦИАН №${offerId})`,
    price: 0,
    area: area || 0,
    pricePerSqm: 0,
    floor: 1,
    totalFloors: 1,
    rooms: rooms || 1,
    renovation: 'Евроремонт',
    buildingMaterial: 'Монолит-кирпич',
    yearBuilt: 2021,
    photo: '',
    viewsTotal: 0,
    viewsToday: 0,
    source: 'cian',
  };
}

function extractAddressFromUrl(url: string): string {
  if (url.includes('spb')) return 'г. Санкт-Петербург';
  if (url.includes('moskva') || url.includes('cian.ru')) return 'г. Москва';
  return '';
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
