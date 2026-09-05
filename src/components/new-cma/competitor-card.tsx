'use client';

import { useState } from 'react';
import { Property } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { Trash2, Link as LinkIcon, RefreshCw, MapPin, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

import { validateRealEstateUrl } from '@/lib/validators';

interface CompetitorCardProps {
  index: number;
  competitor: Property;
  onUpdate: (updated: Property) => void;
  onRemove: () => void;
}

export function CompetitorCard({
  index,
  competitor,
  onUpdate,
  onRemove,
}: CompetitorCardProps) {
  const [urlInput, setUrlInput] = useState(competitor.url || '');
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(Boolean(competitor.price));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFetchData = async () => {
    setErrorMessage(null);
    const validation = validateRealEstateUrl(urlInput);

    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Указана невалидная ссылка');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      });
      const result = await res.json();

      if (result.success && result.data) {
        onUpdate({
          ...competitor,
          ...result.data,
          id: competitor.id,
          url: urlInput,
        });
        setHasFetched(true);
        setErrorMessage(null);
      } else {
        setErrorMessage(result.error || 'Не удалось автоматически спарсить страницу.');
      }
    } catch (e) {
      setErrorMessage('Ошибка связи с сервером парсинга.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-slate-300 transition-all duration-200 relative group">
      {/* Inline Parse Error Warning */}
      {errorMessage && (
        <div className="mb-3 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-amber-500 hover:text-amber-900 text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top bar: URL and fetch button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-1">
          <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0">
            #{index + 1}
          </span>
          <div className="relative flex-1">
            <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Вставьте ссылку на объявление с Avito или ЦИАН..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleFetchData}
            disabled={isLoading || !urlInput.trim()}
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all duration-200',
              isLoading
                ? 'bg-blue-50 text-blue-400 cursor-wait'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 active:scale-95'
            )}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            {isLoading ? 'Загрузка...' : 'Получить данные'}
          </button>

          <button
            onClick={onRemove}
            title="Удалить конкурента"
            className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center text-slate-400 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Competitor details preview */}
      {hasFetched ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="relative rounded-xl overflow-hidden bg-slate-100 h-28 border border-slate-200/60">
            <img
              src={competitor.photo}
              alt={competitor.address}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {competitor.source && (
              <span
                className={cn(
                  'absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-white backdrop-blur-md',
                  competitor.source === 'avito' ? 'bg-emerald-600/90' : 'bg-blue-600/90'
                )}
              >
                {competitor.source}
              </span>
            )}
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <div className="flex items-start gap-1.5 text-slate-800 text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{competitor.address}</span>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
              <span>Этаж: <strong className="text-slate-800 font-semibold">{competitor.floor}/{competitor.totalFloors}</strong></span>
              <span>Площадь: <strong className="text-slate-800 font-semibold">{competitor.area} м²</strong></span>
            </div>
          </div>

          <div className="text-right space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="text-sm font-bold text-slate-900">
              {formatCurrency(competitor.price)}
            </div>
            <div className="text-xs font-semibold text-blue-600">
              {formatNumber(competitor.pricePerSqm)} ₽/м²
            </div>
          </div>
        </div>
      ) : (
        <div className="py-4 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-slate-300" />
          <span>Вставьте ссылку и нажмите «Получить данные» для парсинга объекта</span>
        </div>
      )}
    </div>
  );
}
