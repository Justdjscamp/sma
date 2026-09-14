import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawAddress = searchParams.get('address') || '';

  // Clean up the address string
  const cleanAddress = rawAddress
    .split(/На карте|Шоурум|Офис продаж/i)[0]
    .replace(/(?:[А-Яа-яA-Za-z]+)\d+\s*мин.*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  let lon = searchParams.get('lon');
  let lat = searchParams.get('lat');

  // If no coordinates provided, try to resolve via Yandex map-widget
  if (!lon || !lat) {
    if (cleanAddress) {
      try {
        const widgetUrl = `https://yandex.ru/map-widget/v1/?text=${encodeURIComponent(cleanAddress)}&z=15`;
        const res = await fetch(widgetUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
          signal: AbortSignal.timeout(3500),
        });
        if (res.ok) {
          const html = await res.text();
          // Find coordinates pattern [lon, lat]
          const match = html.match(/\[([0-9]{2}\.[0-9]+),\s*([0-9]{2}\.[0-9]+)\]/);
          if (match) {
            lon = match[1];
            lat = match[2];
          }
        }
      } catch (err) {
        console.warn('Map geocode error:', err);
      }
    }
  }

  // Fallback coordinates if resolution failed
  if (!lon || !lat) {
    if (/москв/i.test(cleanAddress)) {
      lon = '37.617698';
      lat = '55.755864';
    } else {
      // Default: Saint Petersburg (e.g. near center / Nevsky)
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
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      });
    }
  } catch (err) {
    console.error('Static map fetch error:', err);
  }

  // Fallback SVG placeholder if map tile service is unreachable
  const svg = `<svg width="600" height="280" viewBox="0 0 600 280" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#1f1f1f"/>
    <circle cx="300" cy="110" r="28" fill="#e63946" opacity="0.9"/>
    <circle cx="300" cy="105" r="10" fill="#ffffff"/>
    <path d="M 285 125 L 300 155 L 315 125 Z" fill="#e63946"/>
    <text x="300" y="195" fill="#f59e0b" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="bold" text-anchor="middle">
      ${cleanAddress || 'Локация объекта'}
    </text>
    <text x="300" y="220" fill="#9ca3af" font-family="system-ui, -apple-system, sans-serif" font-size="12" text-anchor="middle">
      Яндекс Карта: ${lat}, ${lon}
    </text>
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
