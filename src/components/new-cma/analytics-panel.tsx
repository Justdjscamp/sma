'use client';

import { Property, CmaAdjustments } from '@/types';
import { calculateCmaAnalytics } from '@/lib/cma-calculator';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { FileDown, TrendingUp, TrendingDown, Award, BarChart3, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsPanelProps {
  targetProperty: Property;
  competitors: Property[];
  adjustments: CmaAdjustments;
  onOpenPdfModal: () => void;
}

export function AnalyticsPanel({
  targetProperty,
  competitors,
  adjustments,
  onOpenPdfModal,
}: AnalyticsPanelProps) {
  const analytics = calculateCmaAnalytics(targetProperty, competitors, adjustments);

  const count = analytics.activeCount;
  const recommendedPrice = analytics.adjustedMidPrice;
  const totalAdjPercent = analytics.totalAdjustmentPercent;

  // Financial Corridor (С учетом корректировок по ТЗ и стандарту таблицы)
  const corridorLow = analytics.adjustedLowPrice;
  const corridorMid = analytics.adjustedMidPrice;
  const corridorHigh = analytics.adjustedHighPrice;

  // Deviation %
  const deviationPercent = analytics.deviationMidPercent;

  return (
    <div className="space-y-5 sticky top-24">
      {/* Recommended Price Highlight Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-900/10 border border-slate-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Award className="w-28 h-28" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Итоговая расчетная стоимость
            </div>
            {totalAdjPercent !== 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Поправка {totalAdjPercent > 0 ? `+${totalAdjPercent}` : totalAdjPercent}%
              </span>
            )}
          </div>

          <div className="text-3xl lg:text-4xl font-extrabold text-emerald-400 tracking-tight my-2">
            {formatCurrency(recommendedPrice)}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/60">
            <span>Рассчитано по {count} объектам</span>
            <span className="font-semibold text-emerald-300">
              {formatNumber(analytics.adjustedMidSqm)} ₽/м²
            </span>
          </div>
        </div>
      </div>

      {/* Financial Corridor (Низ / Среднее / Верх) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2 uppercase tracking-wider">
            <Scale className="w-4 h-4 text-blue-600" />
            Финансовый коридор СМА
          </h3>
          <span className="text-[10px] font-semibold text-slate-400">С учетом корректировок</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Низ (быстро)</span>
            <span className="text-xs font-bold text-slate-700 mt-1 block">{formatCurrency(corridorLow)}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{formatNumber(analytics.adjustedLowSqm)} ₽/м²</span>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100">
            <span className="text-[10px] text-blue-600 font-semibold block uppercase">Среднее</span>
            <span className="text-xs font-bold text-blue-700 mt-1 block">{formatCurrency(corridorMid)}</span>
            <span className="text-[10px] text-blue-600 font-bold block mt-0.5">{formatNumber(analytics.adjustedMidSqm)} ₽/м²</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Верх (макс)</span>
            <span className="text-xs font-bold text-slate-700 mt-1 block">{formatCurrency(corridorHigh)}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{formatNumber(analytics.adjustedHighSqm)} ₽/м²</span>
          </div>
        </div>
      </div>

      {/* Market Deviation & Summary Stats */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            Сводные показатели рынка
          </h3>
          <span className="text-[11px] font-semibold text-slate-400">
            {count} аналогов
          </span>
        </div>

        {/* Deviation badge */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">Отклонение от рынка:</span>
          <span
            className={cn(
              'font-bold px-2 py-0.5 rounded-md text-xs',
              deviationPercent > 0
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : deviationPercent < 0
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-700'
            )}
          >
            {deviationPercent > 0 ? `+${deviationPercent}% выше рынка` : `${deviationPercent}% ниже рынка`}
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-slate-100/60">
            <span className="text-slate-500 font-medium">Общее среднее рынка (B20)</span>
            <span className="font-bold text-slate-900">{formatNumber(analytics.marketAvgSqm)} ₽/м²</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100/60">
            <span className="text-slate-500 font-medium">Базовая цена (с учетом торга −2%)</span>
            <span className="font-bold text-blue-600">{formatNumber(analytics.baseMarketPriceSqm)} ₽/м²</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100/60">
            <span className="text-slate-500 font-medium flex items-center gap-1 text-emerald-600">
              <TrendingDown className="w-3.5 h-3.5" /> Среднее 3 дешевых
            </span>
            <span className="font-bold text-slate-900">{formatNumber(analytics.avgCheapSqm)} ₽/м²</span>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <span className="text-slate-500 font-medium flex items-center gap-1 text-rose-600">
              <TrendingUp className="w-3.5 h-3.5" /> Среднее 3 дорогих
            </span>
            <span className="font-bold text-slate-900">{formatNumber(analytics.avgExpensiveSqm)} ₽/м²</span>
          </div>
        </div>
      </div>

      {/* TOP 3 Cheapest & Expensive per sqm */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)] space-y-4">
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1 text-emerald-600">
            <TrendingDown className="w-3.5 h-3.5" /> ТОП-3 Самых дешевых (за м²)
          </h4>
          <div className="space-y-1.5">
            {analytics.topCheapestSqms.map((item, i) => (
              <div key={item.id || i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-emerald-50/50 border border-emerald-100">
                <span className="truncate max-w-[150px] font-medium text-slate-700">#{i + 1} {item.address || 'Конкурент'}</span>
                <span className="font-bold text-emerald-700">{formatNumber(item.pricePerSqm)} ₽/м²</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1 text-rose-600">
            <TrendingUp className="w-3.5 h-3.5" /> ТОП-3 Самых дорогих (за м²)
          </h4>
          <div className="space-y-1.5">
            {analytics.topExpensiveSqms.map((item, i) => (
              <div key={item.id || i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-rose-50/50 border border-rose-100">
                <span className="truncate max-w-[150px] font-medium text-slate-700">#{i + 1} {item.address || 'Конкурент'}</span>
                <span className="font-bold text-rose-700">{formatNumber(item.pricePerSqm)} ₽/м²</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Button: Generate PDF */}
      <button
        onClick={onOpenPdfModal}
        className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/25 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
      >
        <FileDown className="w-5 h-5" />
        Сформировать PDF
      </button>
    </div>
  );
}
