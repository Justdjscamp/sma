'use client';

import { useState, useRef, useEffect } from 'react';
import { Property, PropertyTag, TagColor } from '@/types';
import { CompetitorCard } from './competitor-card';
import { validateRealEstateUrl } from '@/lib/validators';
import { PRESET_TAGS, TAG_COLORS_LIST, getTagColorMeta } from '@/lib/tag-helpers';
import { Plus, Users, AlertCircle, Link as LinkIcon, RefreshCw, ListPlus, X, CheckCircle2, Loader2, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompetitorsSectionProps {
  competitors: Property[];
  onAddCompetitor: () => void;
  onAddCompetitorWithData: (data: Property) => void;
  onUpdateCompetitor: (index: number, updated: Property) => void;
  onRemoveCompetitor: (index: number) => void;
}

export function CompetitorsSection({
  competitors,
  onAddCompetitor,
  onAddCompetitorWithData,
  onUpdateCompetitor,
  onRemoveCompetitor,
}: CompetitorsSectionProps) {
  const isMaxReached = competitors.length >= 20;
  const [quickUrl, setQuickUrl] = useState('');
  const [isQuickLoading, setIsQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [quickSuccess, setQuickSuccess] = useState<string | null>(null);
  const quickInputRef = useRef<HTMLInputElement>(null);

  // Tag selection for new competitors
  const [selectedTag, setSelectedTag] = useState<PropertyTag | null>(null);
  const [isCustomTagOpen, setIsCustomTagOpen] = useState(false);
  const [customTagText, setCustomTagText] = useState('');
  const [customTagColor, setCustomTagColor] = useState<TagColor>('rose');

  // Batch add modal
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [batchUrls, setBatchUrls] = useState('');
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, errors: [] as string[] });

  // Auto-clear messages
  useEffect(() => {
    if (quickSuccess) {
      const t = setTimeout(() => setQuickSuccess(null), 3000);
      return () => clearTimeout(t);
    }
  }, [quickSuccess]);

  useEffect(() => {
    if (quickError) {
      const t = setTimeout(() => setQuickError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [quickError]);

  // Quick add by URL
  const handleQuickAdd = async () => {
    if (isMaxReached) return;
    setQuickError(null);
    setQuickSuccess(null);

    const validation = validateRealEstateUrl(quickUrl);
    if (!validation.isValid) {
      setQuickError(validation.error || 'Невалидная ссылка');
      return;
    }

    setIsQuickLoading(true);
    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: quickUrl }),
      });
      const result = await res.json();

      if (result.success && result.data) {
        const newComp: Property = {
          ...result.data,
          id: `comp-${Date.now()}`,
          url: quickUrl,
          tag: selectedTag || undefined,
        };
        onAddCompetitorWithData(newComp);
        setQuickUrl('');
        setSelectedTag(null);
        setQuickSuccess(`✅ Конкурент добавлен: ${result.data.address || 'Объект загружен'}`);
        quickInputRef.current?.focus();
      } else {
        setQuickError(`Ошибка парсинга: ${result.error || 'Не удалось распознать данные'}`);
      }
    } catch (e) {
      setQuickError('Ошибка связи с сервером парсинга');
    } finally {
      setIsQuickLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && quickUrl.trim() && !isQuickLoading) {
      handleQuickAdd();
    }
  };

  // Batch add
  const handleBatchAdd = async () => {
    const urls = batchUrls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0);

    if (urls.length === 0) return;

    const availableSlots = 20 - competitors.length;
    const toProcess = urls.slice(0, availableSlots);

    setBatchProcessing(true);
    setBatchProgress({ current: 0, total: toProcess.length, errors: [] });

    const errors: string[] = [];
    let addedCount = 0;

    for (let i = 0; i < toProcess.length; i++) {
      setBatchProgress(prev => ({ ...prev, current: i + 1 }));

      const url = toProcess[i];
      const validation = validateRealEstateUrl(url);
      if (!validation.isValid) {
        errors.push(`Строка ${i + 1}: ${validation.error}`);
        continue;
      }

      try {
        const res = await fetch('/api/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const result = await res.json();

        if (result.success && result.data) {
          const newComp: Property = {
            ...result.data,
            id: `comp-${Date.now()}-${i}`,
            url,
          };
          onAddCompetitorWithData(newComp);
          addedCount++;
        } else {
          errors.push(`Строка ${i + 1}: ${result.error || 'Ошибка парсинга'}`);
        }
      } catch {
        errors.push(`Строка ${i + 1}: Ошибка связи с сервером`);
      }

      // Small delay between requests to avoid rate limiting
      if (i < toProcess.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setBatchProgress(prev => ({ ...prev, errors }));
    setBatchProcessing(false);

    if (errors.length === 0) {
      setIsBatchOpen(false);
      setBatchUrls('');
      setBatchProgress({ current: 0, total: 0, errors: [] });
      setQuickSuccess(`✅ Успешно добавлено ${addedCount} конкурентов`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header + Quick Add Input */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-lg">Конкуренты объекта</h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {competitors.length} / 20
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Вставьте ссылку — данные загрузятся автоматически. Поддерживается Avito и ЦИАН.
              </p>
            </div>

            <button
              onClick={() => setIsBatchOpen(true)}
              disabled={isMaxReached}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-3 py-2 rounded-xl border border-slate-200 hover:border-blue-200 transition-all shrink-0"
            >
              <ListPlus className="w-4 h-4" />
              Пакетное добавление
            </button>
          </div>
        </div>

        {/* Quick Add Input — always visible at the top */}
        {!isMaxReached && (
          <div className="p-4 bg-gradient-to-r from-blue-50/50 to-slate-50/50">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={quickInputRef}
                  type="text"
                  value={quickUrl}
                  onChange={(e) => {
                    setQuickUrl(e.target.value);
                    setQuickError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Вставьте ссылку на объявление Avito или ЦИАН и нажмите Enter..."
                  className={cn(
                    'w-full text-sm pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all font-medium text-slate-900',
                    quickError
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-600'
                  )}
                  disabled={isQuickLoading}
                />
              </div>

              <button
                onClick={handleQuickAdd}
                disabled={isQuickLoading || !quickUrl.trim()}
                className={cn(
                  'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white transition-all duration-200 shrink-0',
                  isQuickLoading
                    ? 'bg-blue-400 cursor-wait'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 active:scale-95'
                )}
              >
                {isQuickLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Парсинг...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    Добавить
                  </>
                )}
              </button>
            </div>

            {/* Error / Success Messages */}
            {quickError && (
              <div className="mt-2.5 px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{quickError}</span>
              </div>
            )}
            {quickSuccess && (
              <div className="mt-2.5 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{quickSuccess}</span>
              </div>
            )}

            {/* Tag selector bar */}
            <div className="mt-3 pt-3 border-t border-slate-200/70 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-500 flex items-center gap-1 shrink-0">
                <Tag className="w-3.5 h-3.5 text-slate-400" /> Метка объекта:
              </span>

              {/* Preset Tag chips */}
              {PRESET_TAGS.map((preset) => {
                const isSelected = selectedTag?.text === preset.text;
                const meta = getTagColorMeta(preset.color);
                return (
                  <button
                    key={preset.text}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTag(null);
                      } else {
                        setSelectedTag(preset);
                      }
                    }}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer',
                      isSelected
                        ? `${meta.lightBadgeClass} ring-2 ring-blue-500 shadow-xs`
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <span className={cn('w-2 h-2 rounded-full shrink-0', meta.dotClass)} />
                    {preset.text}
                  </button>
                );
              })}

              {/* Custom tag button */}
              <button
                type="button"
                onClick={() => setIsCustomTagOpen(!isCustomTagOpen)}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer',
                  selectedTag && !PRESET_TAGS.some((p) => p.text === selectedTag.text)
                    ? 'bg-blue-50 text-blue-700 border-blue-300 ring-2 ring-blue-400'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                )}
              >
                + Свой тег...
              </button>

              {/* Clear tag button if selected */}
              {selectedTag && (
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  className="text-slate-400 hover:text-rose-500 text-xs px-1.5 py-0.5 rounded transition-colors"
                  title="Очистить метку"
                >
                  ✕ Сбросить
                </button>
              )}
            </div>

            {/* Custom Tag creator panel */}
            {isCustomTagOpen && (
              <div className="mt-2.5 p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2.5 text-xs animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customTagText}
                    onChange={(e) => setCustomTagText(e.target.value)}
                    placeholder="Название метки (например, Видовая, Под апартаменты)..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-900"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (customTagText.trim()) {
                          setSelectedTag({ text: customTagText.trim(), color: customTagColor });
                          setIsCustomTagOpen(false);
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={!customTagText.trim()}
                    onClick={() => {
                      if (customTagText.trim()) {
                        setSelectedTag({ text: customTagText.trim(), color: customTagColor });
                        setIsCustomTagOpen(false);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-3.5 py-1.5 rounded-lg transition-all"
                  >
                    Применить
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCustomTagOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Color dots picker */}
                <div className="flex items-center gap-3 pt-0.5">
                  <span className="text-slate-500 font-medium">Цвет метки:</span>
                  <div className="flex items-center gap-2">
                    {TAG_COLORS_LIST.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCustomTagColor(c.id)}
                        className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer',
                          c.dotClass,
                          customTagColor === c.id
                            ? 'ring-2 ring-offset-2 ring-slate-800 scale-110 shadow-xs'
                            : 'opacity-70 hover:opacity-100 hover:scale-105'
                        )}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {isMaxReached && (
          <div className="p-4 bg-amber-50/50 text-amber-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Достигнут максимум (20 конкурентов)
          </div>
        )}
      </div>

      {/* Competitors List */}
      {competitors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-800 text-base">Список конкурентов пуст</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Вставьте ссылку на объявление с Avito или ЦИАН в поле выше и нажмите «Добавить» или Enter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {competitors.map((competitor, index) => (
            <CompetitorCard
              key={competitor.id || index}
              index={index}
              competitor={competitor}
              onUpdate={(updated) => onUpdateCompetitor(index, updated)}
              onRemove={() => onRemoveCompetitor(index)}
            />
          ))}
        </div>
      )}

      {/* Batch Add Modal */}
      {isBatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !batchProcessing && setIsBatchOpen(false)} />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <ListPlus className="w-5 h-5 text-blue-600" />
                  Пакетное добавление
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Вставьте по одной ссылке на строку (макс. {20 - competitors.length} шт.)
                </p>
              </div>
              <button
                onClick={() => setIsBatchOpen(false)}
                disabled={batchProcessing}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Textarea */}
            <textarea
              value={batchUrls}
              onChange={(e) => setBatchUrls(e.target.value)}
              placeholder={`https://www.avito.ru/...\nhttps://cian.ru/...\nhttps://www.avito.ru/...`}
              rows={8}
              disabled={batchProcessing}
              className="w-full text-sm px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-mono resize-none"
            />

            {/* Progress */}
            {batchProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    Обработка...
                  </span>
                  <span>{batchProgress.current} / {batchProgress.total}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Errors */}
            {batchProgress.errors.length > 0 && !batchProcessing && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1 max-h-32 overflow-y-auto">
                <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Ошибки ({batchProgress.errors.length}):
                </div>
                {batchProgress.errors.map((err, i) => (
                  <div key={i} className="text-xs text-amber-700 pl-5">{err}</div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setIsBatchOpen(false);
                  setBatchUrls('');
                  setBatchProgress({ current: 0, total: 0, errors: [] });
                }}
                disabled={batchProcessing}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleBatchAdd}
                disabled={batchProcessing || !batchUrls.trim()}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all',
                  batchProcessing
                    ? 'bg-blue-400 cursor-wait'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 active:scale-95'
                )}
              >
                {batchProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Обработка...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Добавить все
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
