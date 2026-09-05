'use client';

import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, RotateCcw, FileText, CheckCircle2 } from 'lucide-react';

interface ConclusionsSectionProps {
  conclusions: string[];
  onChange: (conclusions: string[]) => void;
}

export const DEFAULT_CONCLUSIONS = [
  'Стартовая рыночная стоимость объекта определена с учетом локации, этажности и технического состояния.',
  'Срок экспозиции объекта при заданной цене составляет от 30 до 45 дней при текущем спросе.',
  'Рекомендуется проведение предпродажной подготовки (хоум-стейджинг) для максимальной скорости продажи.',
  'Диапазон возможного торга при активных переговорах рекомендуется ограничить в пределах 2–3%.',
];

export function ConclusionsSection({ conclusions, onChange }: ConclusionsSectionProps) {
  const items = conclusions && conclusions.length > 0 ? conclusions : DEFAULT_CONCLUSIONS;

  const handleItemChange = (index: number, text: string) => {
    const updated = [...items];
    updated[index] = text;
    onChange(updated);
  };

  const handleAdd = () => {
    onChange([...items, '']);
  };

  const handleDelete = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    onChange(updated.length > 0 ? updated : ['']);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onChange(updated);
  };

  const handleReset = () => {
    onChange(DEFAULT_CONCLUSIONS);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl transition-all">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-slate-100">Заключения и рекомендации эксперта</h3>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              Редактируемый блок
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Добавьте или отредактируйте персональные рекомендации аналитика для Клиента
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Сбросить к шаблону
        </button>
      </div>

      <div className="space-y-3">
        {items.map((text, index) => (
          <div
            key={index}
            className="group flex items-start gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 transition-all focus-within:border-indigo-500/80 focus-within:bg-slate-900/50"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-xs font-bold text-indigo-400 mt-1">
              {index + 1}
            </div>

            <textarea
              rows={2}
              value={text}
              onChange={(e) => handleItemChange(index, e.target.value)}
              placeholder="Введите рекомендацию для отчёта..."
              className="w-full resize-y rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 transition-all focus:border-indigo-500 focus:outline-none"
            />

            <div className="flex flex-col gap-1 pt-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => handleMove(index, 'up')}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent"
                title="Переместить вверх"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={index === items.length - 1}
                onClick={() => handleMove(index, 'down')}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent"
                title="Переместить вниз"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(index)}
                className="rounded p-1 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                title="Удалить"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-600/20 px-4 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/30 hover:text-white transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Добавить пункт заключения
        </button>
      </div>
    </div>
  );
}
