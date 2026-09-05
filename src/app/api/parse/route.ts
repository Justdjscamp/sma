import { NextRequest, NextResponse } from 'next/server';
import { parseAvitoUrl } from '@/lib/parsers/avito-parser';
import { parseCianUrl } from '@/lib/parsers/cian-parser';
import { ParseResult } from '@/lib/parsers/parser-types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json(
        { success: false, error: 'Пожалуйста, укажите корректную ссылку на объявление.' },
        { status: 400 }
      );
    }

    const cleanUrl = url.trim();

    let result: ParseResult;

    if (cleanUrl.includes('avito.ru') || cleanUrl.includes('avito')) {
      result = await parseAvitoUrl(cleanUrl);
    } else if (cleanUrl.includes('cian.ru') || cleanUrl.includes('cian')) {
      result = await parseCianUrl(cleanUrl);
    } else {
      // Попробуем отпарсить как Avito если не распознано явно, или сгенерировать понятный ответ
      return NextResponse.json(
        {
          success: false,
          error: 'Сервис поддерживает ссылки с Avito (avito.ru) и ЦИАН (cian.ru).',
        },
        { status: 400 }
      );
    }

    if (result.success && result.data) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Не удалось получить данные по указанной ссылке.',
        },
        { status: 422 }
      );
    }
  } catch (error: any) {
    console.error('API Parse route error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Ошибка сервера при парсинге: ${error.message || 'Неизвестная ошибка'}`,
      },
      { status: 500 }
    );
  }
}
