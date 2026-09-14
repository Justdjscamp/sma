'use client';

import { useState } from 'react';
import { Property, PropertyTag, TagColor } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { PRESET_TAGS, TAG_COLORS_LIST, getTagColorMeta, getTagBadgeClasses } from '@/lib/tag-helpers';
import { Trash2, Link as LinkIcon, RefreshCw, MapPin, Tag, X, Check, AlertCircle } from 'lucide-react';
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

  // Tag editing state
  const [isEditingTag, setIsEditingTag] = useState(false);
  const [customText, setCustomText] = useState(competitor.tag?.text || '');
  const [customColor, setCustomColor] = useState<TagColor>(competitor.tag?.color || 'rose');

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

  const handleSelectPresetTag = (preset: PropertyTag) => {
    onUpdate({
      ...competitor,
      tag: preset,
    });
    setIsEditingTag(false);
  };

  const handleApplyCustomTag = () => {
    if (customText.trim()) {
      onUpdate({
        ...competitor,
        tag: { text: customText.trim(), color: customColor },
      });
      setIsEditingTag(false);
    }
  };

  const handleRemoveTag = () => {
    onUpdate({
      ...competitor,
      tag: undefined,
    });
    setCustomText('');
    setIsEditingTag(false);
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

      {/* Top bar: Index, Tag badge, URL and fetch button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0">
            #{index + 1}
          </span>

          {/* Competitor Tag Badge or Add Tag Button */}
          {competitor.tag ? (
            <button
              type="button"
              onClick={() => setIsEditingTag(!isEditingTag)}
              className={cn('cursor-pointer hover:opacity-90 active:scale-95 transition-all', getTagBadgeClasses(competitor.tag.color, 'light'))}
              title="Нажмите, чтобы изменить или удалить метку"
            >
              <span className={cn('w-1.5 h-1.5 rounded-full', getTagColorMeta(competitor.tag.color).dotClass)} />
              <span>{competitor.tag.text}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingTag(!isEditingTag)}
              className="text-[11px] font-semibold text-slate-400 hover:text-blue-600 hover:bg-blue-50 px-2 py-0.5 rounded-md border border-dashed border-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
              title="Добавить метку (например, Главный конкурент)"
            >
              <Tag className="w-3 h-3" /> + Метка
            </button>
          )}

          {/* URL Input */}
          <div className="relative flex-1 min-w-[200px]">
            <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Вставьте ссылку на объявление с Avito или ЦИАН..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium text-slate-900"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleFetchData}
            disabled={isLoading || !urlInput.trim()}
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer',
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
            className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center text-slate-400 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inline Tag Editor Box */}
      {isEditingTag && (
        <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-600" /> Выберите или укажите метку для конкурента #{index + 1}:
            </span>
            <div className="flex items-center gap-2">
              {competitor.tag && (
                <button
                  type="button"
                  onClick={handleRemoveTag}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold px-2 py-0.5 rounded hover:bg-rose-100 transition-colors"
                >
                  Удалить метку
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsEditingTag(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {PRESET_TAGS.map((preset) => {
              const meta = getTagColorMeta(preset.color);
              const isCurrent = competitor.tag?.text === preset.text;
              return (
                <button
                  key={preset.text}
                  type="button"
                  onClick={() => handleSelectPresetTag(preset)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer',
                    isCurrent
                      ? `${meta.lightBadgeClass} ring-2 ring-blue-500 shadow-xs`
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                  )}
                >
                  <span className={cn('w-2 h-2 rounded-full shrink-0', meta.dotClass)} />
                  {preset.text}
                </button>
              );
            })}
          </div>

          {/* Custom Tag Input + Color Selection */}
          <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Свой текст метки..."
              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-blue-500"
            />
            {/* Color dots */}
            <div className="flex items-center gap-1.5">
              {TAG_COLORS_LIST.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCustomColor(c.id)}
                  className={cn(
                    'w-5 h-5 rounded-full transition-all cursor-pointer',
                    c.dotClass,
                    customColor === c.id ? 'ring-2 ring-offset-2 ring-slate-700 scale-110' : 'opacity-70 hover:opacity-100'
                  )}
                  title={c.label}
                />
              ))}
            </div>
            <button
              type="button"
              disabled={!customText.trim()}
              onClick={handleApplyCustomTag}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-lg transition-all"
            >
              Сохранить
            </button>
          </div>
        </div>
      )}

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
