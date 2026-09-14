'use client';

import { CmaAdjustments } from '@/types';
import { getTotalAdjustmentPercent } from '@/lib/cma-calculator';
import { Sliders, Percent, Scale, ShieldAlert, Home, Paintbrush, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdjustmentsMatrixProps {
  adjustments: CmaAdjustments;
  onChange: (updatedAdjustments: CmaAdjustments) => void;
}

export function AdjustmentsMatrix({
  adjustments,
  onChange,
}: AdjustmentsMatrixProps) {
  const handleSelect = (key: keyof CmaAdjustments, value: number) => {
    onChange({
      ...adjustments,
      [key]: value,
    });
  };

  const totalAdjustmentPercent = getTotalAdjustmentPercent(adjustments);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.05)] space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            Сетка коэффициентов корректировки
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Поправки к рыночной стоимости по стандарту таблицы СМА (6 категорий)
          </p>
        </div>

        <div
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border',
            totalAdjustmentPercent > 0
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : totalAdjustmentPercent < 0
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-slate-50 text-slate-700 border-slate-200'
          )}
        >
          <Percent className="w-3.5 h-3.5" />
          <span>Суммарная поправка: {totalAdjustmentPercent > 0 ? `+${totalAdjustmentPercent}` : totalAdjustmentPercent}%</span>
        </div>
      </div>

      <div className="space-y-5 text-xs">
        {/* 1. Этаж */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-slate-400" /> 1. Корректировка по этажу
            </label>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
              <span>Своё:</span>
              <input
                type="number"
                value={adjustments.floorAdjustment}
                onChange={(e) => handleSelect('floorAdjustment', Number(e.target.value) || 0)}
                className="w-14 px-1.5 py-0.5 rounded border border-slate-200 text-right font-bold text-slate-700 focus:outline-none focus:border-blue-500"
              />
              <span>%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { label: '1-й этаж (−10%)', val: -10 },
              { label: '2–4 этаж (−3%)', val: -3 },
              { label: 'Средний этаж (0%)', val: 0 },
              { label: 'Высокий от 12 эт. (+2%)', val: 2 },
              { label: 'Видовые (+5%)', val: 5 },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => handleSelect('floorAdjustment', opt.val)}
                className={cn(
                  'p-2 rounded-xl text-xs font-medium border text-center transition-all',
                  adjustments.floorAdjustment === opt.val
                    ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Ремонт */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Paintbrush className="w-3.5 h-3.5 text-slate-400" /> 2. Качество ремонта относительно аналогов
            </label>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
              <span>Своё:</span>
              <input
                type="number"
                value={adjustments.renovationAdjustment}
                onChange={(e) => handleSelect('renovationAdjustment', Number(e.target.value) || 0)}
                className="w-14 px-1.5 py-0.5 rounded border border-slate-200 text-right font-bold text-slate-700 focus:outline-none focus:border-blue-500"
              />
              <span>%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { label: '«Убитая» (−10%)', val: -10 },
              { label: 'Хуже аналогов (−5%)', val: -5 },
              { label: 'Аналогичное (0%)', val: 0 },
              { label: 'Лучше аналогов (+5%)', val: 5 },
              { label: 'Флиппинг (+20%)', val: 20 },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => handleSelect('renovationAdjustment', opt.val)}
                className={cn(
                  'p-2 rounded-xl text-xs font-medium border text-center transition-all',
                  adjustments.renovationAdjustment === opt.val
                    ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Конкуренты в локации (Таблица: колонка C) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" /> 3. Конкуренты в локации
            </label>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
              <span>Своё:</span>
              <input
                type="number"
                value={adjustments.competitorsAdjustment || 0}
                onChange={(e) => handleSelect('competitorsAdjustment', Number(e.target.value) || 0)}
                className="w-14 px-1.5 py-0.5 rounded border border-slate-200 text-right font-bold text-slate-700 focus:outline-none focus:border-blue-500"
              />
              <span>%</span>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {[
              { label: '100 объектов (−10%)', val: -10 },
              { label: '30 объектов (−3%)', val: -3 },
              { label: '20 объектов (−2%)', val: -2 },
              { label: '10 объектов (−1%)', val: -1 },
              { label: 'Норма (0%)', val: 0 },
              { label: '5 конкурентов (+1%)', val: 1 },
              { label: '3–4 конкурента (+2%)', val: 2 },
              { label: '1–2 конкурента (+3%)', val: 3 },
              { label: 'Нет конкурентов (+5%)', val: 5 },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => handleSelect('competitorsAdjustment', opt.val)}
                className={cn(
                  'p-2 rounded-xl text-xs font-medium border text-center transition-all',
                  (adjustments.competitorsAdjustment || 0) === opt.val
                    ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Балкон / Лоджия (Таблица: колонка D) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-slate-400" /> 4. Наличие балкона / лоджии
            </label>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
              <span>Своё:</span>
              <input
                type="number"
                value={adjustments.balconyAdjustment}
                onChange={(e) => handleSelect('balconyAdjustment', Number(e.target.value) || 0)}
                className="w-14 px-1.5 py-0.5 rounded border border-slate-200 text-right font-bold text-slate-700 focus:outline-none focus:border-blue-500"
              />
              <span>%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { label: 'Отсутствует (−6%)', val: -6 },
              { label: 'Без балкона (−3%)', val: -3 },
              { label: 'Нет в доме (−2%)', val: -2 },
              { label: 'Балкон есть (0%)', val: 0 },
              { label: 'Есть в доме (+2%)', val: 2 },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => handleSelect('balconyAdjustment', opt.val)}
                className={cn(
                  'p-2 rounded-xl text-xs font-medium border text-center transition-all',
                  adjustments.balconyAdjustment === opt.val
                    ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Спрос в локации (Таблица: колонка E) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" /> 5. Спрос и ликвидность локации
            </label>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
              <span>Своё:</span>
              <input
                type="number"
                value={adjustments.demandAdjustment}
                onChange={(e) => handleSelect('demandAdjustment', Number(e.target.value) || 0)}
                className="w-14 px-1.5 py-0.5 rounded border border-slate-200 text-right font-bold text-slate-700 focus:outline-none focus:border-blue-500"
              />
              <span>%</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { label: 'Низкий спрос / Отток (−3%)', val: -3 },
              { label: 'Сбалансированный спрос (0%)', val: 0 },
              { label: 'Высокий спрос / Приток (+3%)', val: 3 },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => handleSelect('demandAdjustment', opt.val)}
                className={cn(
                  'p-2 rounded-xl text-xs font-medium border text-center transition-all',
                  adjustments.demandAdjustment === opt.val
                    ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6. Документы / Юридический блок (Таблица: колонка F) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" /> 6. Документы и особенности сделки
            </label>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
              <span>Своё:</span>
              <input
                type="number"
                value={adjustments.legalAdjustment}
                onChange={(e) => handleSelect('legalAdjustment', Number(e.target.value) || 0)}
                className="w-14 px-1.5 py-0.5 rounded border border-slate-200 text-right font-bold text-slate-700 focus:outline-none focus:border-blue-500"
              />
              <span>%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Опека / доли / занижение (−3%)', val: -3 },
              { label: 'Обременение (−3%)', val: -3 },
              { label: 'Много собственников / встречка (−2%)', val: -2 },
              { label: 'Чистые документы (0%)', val: 0 },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => handleSelect('legalAdjustment', opt.val)}
                className={cn(
                  'p-2 rounded-xl text-xs font-medium border text-center transition-all',
                  adjustments.legalAdjustment === opt.val
                    ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
