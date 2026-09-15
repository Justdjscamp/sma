import { NextRequest, NextResponse } from 'next/server';
import { cleanAddressString } from '@/lib/parsers/address-sanitizer';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawAddress = searchParams.get('address') || '';

  // Aggressive sanitization of site headers, suffixes, IDs, etc.
  const cleanAddress = cleanAddressString(rawAddress);

  let lon = searchParams.get('lon');
  let lat = searchParams.get('lat');

  // Tier 1: OpenStreetMap Nominatim (Free, highly accurate for Russian streets/numbers)
  if ((!lon || !lat) && cleanAddress) {
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ru&q=${encodeURIComponent(cleanAddress)}`;
      const osmRes = await fetch(osmUrl, {
        headers: {
          'User-Agent': 'CmaExpertMapService/1.0 (info@realty-analytics.ru)',
          'Accept-Language': 'ru-RU,ru;q=0.9',
        },
        signal: AbortSignal.timeout(3000),
      });
      if (osmRes.ok) {
        const osmData = await osmRes.json();
        if (Array.isArray(osmData) && osmData.length > 0 && osmData[0].lon && osmData[0].lat) {
          lon = String(osmData[0].lon);
          lat = String(osmData[0].lat);
        }
      }
    } catch (err) {
      console.warn('Nominatim geocode attempt failed:', err);
    }
  }

  // Tier 2: Yandex map-widget scraper fallback
  if ((!lon || !lat) && cleanAddress) {
    try {
      const widgetUrl = `https://yandex.ru/map-widget/v1/?text=${encodeURIComponent(cleanAddress)}&z=15`;
      const res = await fetch(widgetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'ru-RU,ru;q=0.9',
        },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const html = await res.text();
        const match = html.match(/\[([0-9]{2}\.[0-9]+),\s*([0-9]{2}\.[0-9]+)\]/);
        if (match) {
          lon = match[1];
          lat = match[2];
        }
      }
    } catch (err) {
      console.warn('Yandex map-widget geocode attempt failed:', err);
    }
  }

  // Tier 3: Regional city center fallback
  if (!lon || !lat) {
    const addrLower = cleanAddress.toLowerCase();
    if (addrLower.includes('москв') || addrLower.includes('зеленоград')) {
      lon = '37.617698';
      lat = '55.755864';
    } else if (addrLower.includes('краснодар')) {
      lon = '38.97603';
      lat = '45.03547';
    } else if (addrLower.includes('сочи')) {
      lon = '39.7257';
      lat = '43.5855';
    } else if (addrLower.includes('казан')) {
      lon = '49.1221';
      lat = '55.7887';
    } else if (addrLower.includes('новосибирск')) {
      lon = '82.9204';
      lat = '55.0302';
    } else {
      // Default: Saint Petersburg
      lon = '30.315868';
      lat = '59.939095';
    }
  }

  // Construct static maps URL
  const apiKey = process.env.YANDEX_MAPS_API_KEY || process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;
  const staticUrl = apiKey
    ? `https://static-maps.yandex.ru/v1?ll=${lon},${lat}&pt=${lon},${lat},pm2rdm&size=600,280&z=15&l=map&apikey=${apiKey}`
    : `https://static-maps.yandex.ru/1.x/?l=map&size=600,280&z=15&ll=${lon},${lat}&pt=${lon},${lat},pm2rdm`;

  try {
    const mapRes = await fetch(staticUrl, {
      signal: AbortSignal.timeout(4000),
    });
    if (mapRes.ok) {
      const buffer = await mapRes.arrayBuffer();
      if (buffer.byteLength > 800) {
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=86400, s-maxage=86400',
          },
        });
      }
    }
  } catch (err) {
    console.warn('Static map fetch error:', err);
  }

  // Fallback light-theme SVG card (for printed A4 reports and offline mode)
  const escapedAddress = (cleanAddress || 'Локация объекта')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const svg = `<svg width="600" height="280" viewBox="0 0 600 280" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e2e8f0" stroke-width="1"/>
      </pattern>
      <radialGradient id="pinGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ef4444" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#ef4444" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <!-- Background & Grid -->
    <rect width="100%" height="100%" fill="#f8fafc"/>
    <rect width="100%" height="100%" fill="url(#grid)"/>
    <rect width="100%" height="100%" fill="none" stroke="#cbd5e1" stroke-width="2"/>

    <!-- Map road simulation shapes -->
    <path d="M 0 140 Q 200 120 400 160 T 600 140" fill="none" stroke="#cbd5e1" stroke-width="6"/>
    <path d="M 300 0 Q 320 140 280 280" fill="none" stroke="#cbd5e1" stroke-width="5"/>
    <path d="M 120 0 L 480 280" fill="none" stroke="#e2e8f0" stroke-width="4"/>

    <!-- Map Pin & Target Marker -->
    <circle cx="300" cy="110" r="40" fill="url(#pinGlow)"/>
    <circle cx="300" cy="110" r="22" fill="#ef4444" stroke="#ffffff" stroke-width="3" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"/>
    <circle cx="300" cy="110" r="8" fill="#ffffff"/>
    <path d="M 288 122 L 300 145 L 312 122 Z" fill="#ef4444"/>

    <!-- Address info badge box -->
    <rect x="50" y="180" width="500" height="75" rx="12" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.06))"/>
    
    <text x="300" y="212" fill="#0f172a" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" text-anchor="middle">
      ${escapedAddress}
    </text>
    <text x="300" y="238" fill="#64748b" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="500" text-anchor="middle">
      Геокоординаты: ${lat}, ${lon} • Яндекс Карты
    </text>
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
