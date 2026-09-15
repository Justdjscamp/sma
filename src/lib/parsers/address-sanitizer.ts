/**
 * Utility functions for cleaning and validating real estate addresses
 * across Avito, CIAN, and map geocoding services.
 */

export function cleanAddressString(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  let cleaned = raw
    // Remove site separators and pipe suffixes (e.g. "| Купить квартиру | Авито", "— ЦИАН")
    .split(/[|—]/)[0]
    // Remove offer IDs in brackets e.g. "(№4911851410)" or "(Объект Avito)"
    .replace(/\(.*?\)/g, '')
    // Remove site brand mentions
    .replace(/\s+на\s+(?:Авито|ЦИАН|Avito|Cian).*/gi, '')
    .replace(/\|\s*(?:Купить|Продажа|Авито|ЦИАН).*/gi, '')
    // Remove marketing / real estate action phrases
    .replace(/(?:Купить|Продажа|Снять|Сдам|Сдаётся|Продается|Продаётся)\s+(?:квартиру|комнату|долю|апартаменты|недвижимость).*/gi, '')
    .replace(/(?:Шоурум|Офис продаж|На карте|Показать на карте)/gi, '')
    // Remove subway distance text like "Ладожская 15 мин." or "м. Ладожская"
    .replace(/(?:[А-Яа-яA-Za-z]+)\s*\d+\s*мин.*/gi, '')
    .replace(/\b(?:пешком|транспортом|на машине)\b.*/gi, '')
    // Normalize prepositions like "в Санкт-Петербурге" -> "Санкт-Петербург"
    .replace(/^в\s+(Санкт-Петербурге|Москве|Краснодаре|Казани|Сочи)/i, 'г. $1')
    .replace(/\bСанкт-Петербурге\b/gi, 'Санкт-Петербург')
    .replace(/\bМоскве\b/gi, 'Москва')
    .replace(/\bКраснодаре\b/gi, 'Краснодар')
    .replace(/\bКазани\b/gi, 'Казань')
    .replace(/\bСочи\b/gi, 'Сочи')
    // Remove consecutive spaces, dots and trailing punctuation
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[,.\s-]+|[,.\s-]+$/g, '');

  return cleaned;
}

/**
 * Checks if the address string contains a specific street, avenue or house number,
 * rather than just a city name or general district.
 */
export function isSpecificStreetAddress(addr: string): boolean {
  if (!addr) return false;
  const clean = cleanAddressString(addr);
  // Has numbers (house/building number) or street indicators
  const hasDigits = /\d/.test(clean);
  const hasStreetKeywords = /(?:ул(?:ица|\.)?|пр(?:-кт|оспект|\.)?|пер(?:еулок|\.)?|бул(?:ьвар|\.)?|ш(?:оссе|\.)?|наб(?:ережная|\.)?|проезд|тупик|линия|аллея|д\.\s*\d+|дом\s*\d+|корп|к\.\s*\d+)/i.test(clean);
  return hasDigits || hasStreetKeywords;
}
