'use client';

import React from 'react';
import { AggregatorEstimate } from '@/types';
import { ExternalLink, Calculator, TrendingUp, HelpCircle } from 'lucide-react';

interface AggregatorEstimatesSectionProps {
  estimates: AggregatorEstimate[];
  onChange: (estimates: AggregatorEstimate[]) => void;
}

const DEFAULT_PLATFORMS: { id: string; name: string; color: string; badgeBg: string }[] = [
  { id: 'avito', name: 'Авито Оценка', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 border-emerald-500/30' },
  { id: 'cian', name: 'ЦИАН Оценка', color: 'text-sky-400', badgeBg: 'bg-sky-500/10 border-sky-500/30' },
  { id: 'yandex', name: 'Яндекс Недвижимость', color: 'text-amber-400', badgeBg: 'bg-amber-500/10 border-amber-500/30' },
  { id: 'domclick', name: 'Домклик', color: 'text-green-400', badgeBg: 'bg-green-500/10 border-green-500/30' },
];

export function AggregatorEstimatesSection({ estimates, onChange }: AggregatorEstimatesSectionProps) {
  // Ensure we have entries for all 4 default platforms
  const currentEstimatesMap = new Map(estimates.map((e) => [e.id, e]));

  const platformItems = DEFAULT_PLATFORMS.map((platform) => {
    const existing = currentEstimatesMap.get(platform.id);
    return (
      existing || {
        id: platform.id,
        name: platform.name,
        estimate: 0,
        minEstimate: 0,
        maxEstimate: 0,
        url: '',
      }
    );
  });

  const handleFieldChange = (id: string, field: keyof AggregatorEstimate, value: any) => {
    const updated = platformItems.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onChange(updated);
  };

  const validEstimates = platformItems.filter((item) => item.estimate > 0);
  const avgEstimate =
    validEstimates.length > 0
      ? Math.round(validEstimates.reduce((sum, item) => sum + item.estimate, 0) / validEstimates.length)
      : 0;

  const formatCurrency = (val: number) => {
    if (!val) return '—';
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(val) + ' ₽';
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl transition-all">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-slate-100">Оценка онлайн-агрегаторов</h3>
            <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
              Ручной ввод
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Укажите данные оценок стоимости с крупнейших площадок для включения в отчёт
          </p>
        </div>

        {avgEstimate > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-indigo-500/30 bg-indigo-950/40 px-4 py-2.5 shadow-lg shadow-indigo-950/50">
            <Calculator className="h-5 w-5 text-indigo-400" />
            <div>
              <div className="text-xs text-indigo-300">Средняя оценка по рынкам</div>
              <div className="text-lg font-bold text-indigo-200">{formatCurrency(avgEstimate)}</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {platformItems.map((item) => {
          const config = DEFAULT_PLATFORMS.find((p) => p.id === item.id) || DEFAULT_PLATFORMS[0];

          return (
            <div
              key={item.id}
              className="group rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 transition-all hover:border-slate-700 hover:bg-slate-900/40"
            >
              <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-12">
                {/* Platform Header */}
                <div className="lg:col-span-3 flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${config.badgeBg}`}>
                    <TrendingUp className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-200">{config.name}</h4>
                    <span className="text-xs text-slate-400">Площадка оценки</span>
                  </div>
                </div>

                {/* Estimate Value */}
                <div className="lg:col-span-3">
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Точечная оценка (₽)
                  </label>
                  <input
                    type="number"
                    value={item.estimate || ''}
                    onChange={(e) => handleFieldChange(item.id, 'estimate', Number(e.target.value) || 0)}
                    placeholder="Например: 7800000"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-sm font-semibold text-slate-100 placeholder-slate-500 transition-all focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Range (Min - Max) */}
                <div className="lg:col-span-3 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Мин. диапазон
                    </label>
                    <input
                      type="number"
                      value={item.minEstimate || ''}
                      onChange={(e) => handleFieldChange(item.id, 'minEstimate', Number(e.target.value) || 0)}
                      placeholder="От"
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 transition-all focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Макс. диапазон
                    </label>
                    <input
                      type="number"
                      value={item.maxEstimate || ''}
                      onChange={(e) => handleFieldChange(item.id, 'maxEstimate', Number(e.target.value) || 0)}
                      placeholder="До"
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 transition-all focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* URL Link */}
                <div className="lg:col-span-3">
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Ссылка на результат (необязательно)
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={item.url || ''}
                      onChange={(e) => handleFieldChange(item.id, 'url', e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 pl-3 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 transition-all focus:border-indigo-500 focus:outline-none"
                    />
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-400 transition-colors"
                        title="Открыть ссылку"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
