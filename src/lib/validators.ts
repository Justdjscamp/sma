export interface UrlValidationResult {
  isValid: boolean;
  source: 'avito' | 'cian' | 'unknown';
  error?: string;
}

export function validateRealEstateUrl(urlInput: string): UrlValidationResult {
  if (!urlInput || !urlInput.trim()) {
    return {
      isValid: false,
      source: 'unknown',
      error: 'Пожалуйста, вставьте ссылку на объявление.',
    };
  }

  const url = urlInput.trim();

  // Basic URL structure check
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch (e) {
    return {
      isValid: false,
      source: 'unknown',
      error: 'Указана невалидная URL-ссылка. Проверьте правильность формата.',
    };
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  if (hostname.includes('avito.ru') || hostname.includes('avito')) {
    return {
      isValid: true,
      source: 'avito',
    };
  }

  if (hostname.includes('cian.ru') || hostname.includes('cian')) {
    return {
      isValid: true,
      source: 'cian',
    };
  }

  return {
    isValid: false,
    source: 'unknown',
    error: 'Поддерживаются только ссылки с сайтов Avito (avito.ru) и ЦИАН (cian.ru).',
  };
}
