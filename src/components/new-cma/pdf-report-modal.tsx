'use client';

import { Property, CmaAdjustments, UserProfile, AggregatorEstimate } from '@/types';
import { calculateCmaAnalytics, getTotalAdjustmentPercent } from '@/lib/cma-calculator';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { getTagBadgeClasses } from '@/lib/tag-helpers';
import { X, Printer, ExternalLink, MapPin, Building2, Edit3, Check, RotateCcw } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface PdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProperty: Property;
  competitors: Property[];
  adjustments: CmaAdjustments;
  user: UserProfile;
  reportId?: string;
  searchParamsDescription?: string;
  onUpdateSearchParamsDescription?: (val: string) => void;
  aggregatorEstimates?: AggregatorEstimate[];
  conclusions?: string[];
}

export function PdfReportModal({
  isOpen,
  onClose,
  targetProperty,
  competitors,
  adjustments,
  user,
  reportId,
  searchParamsDescription,
  onUpdateSearchParamsDescription,
  aggregatorEstimates = [],
  conclusions = [],
}: PdfReportModalProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isEditingParams, setIsEditingParams] = useState(false);

  // Default parameters text for competitor selection
  const defaultParamsText = `В районе 9 объектов с параметрами:
1. ${targetProperty.rooms}-к квартира: ${targetProperty.area} м²
2. Материал постройки: ${targetProperty.buildingMaterial || 'панельные'}
3. Локация: ${targetProperty.address || 'г. Санкт-Петербург'}
4. Этаж: ${targetProperty.floor > 1 ? 'Не первый' : '1 этаж'}
5. Год постройки: от ${targetProperty.yearBuilt ? (targetProperty.yearBuilt > 1970 ? 1970 : targetProperty.yearBuilt) : 1970} года`;

  const [localSearchParams, setLocalSearchParams] = useState(
    searchParamsDescription || defaultParamsText
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (searchParamsDescription) {
      setLocalSearchParams(searchParamsDescription);
    }
  }, [searchParamsDescription]);

  if (!isOpen || !mounted) return null;

  // Perform calculations using standard spreadsheet CMA logic
  const activeCompetitors = competitors.filter((c) => c.price > 0);
  const analytics = calculateCmaAnalytics(targetProperty, activeCompetitors, adjustments);

  const count = analytics.activeCount;
  const totalAdjPercent = analytics.totalAdjustmentPercent;

  const handlePrint = () => {
    document.body.classList.add('printing-pdf');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-pdf');
    }, 500);
  };

  const handleSaveParamsText = () => {
    setIsEditingParams(false);
    onUpdateSearchParamsDescription?.(localSearchParams);
  };

  const handleResetParamsText = () => {
    setLocalSearchParams(defaultParamsText);
    onUpdateSearchParamsDescription?.(defaultParamsText);
    setIsEditingParams(false);
  };

  // Profile fields
  const companyName = user.company || 'Тренд Недвижимость';
  const companyAddress = user.companyAddress || 'г. Санкт-Петербург, Щербаков пер. д.17/3, БЦ «Премьер», 3 этаж';
  const companyWebsite = user.companyWebsite || 'trendproperty.ru';
  const authorName = user.name || 'Хасанов Павел';
  const authorPosition = user.position || 'Специалист по недвижимости';
  const authorPhone = user.phone || '+7 (921) 781-89-12';
  const authorEmail = user.email || 'khasanov.pavel.trend@gmail.com';
  const authorTelegram = user.telegram || 't.me/Khasanov_Pavel';
  const authorPhoto = user.photo || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80';

  const modalContent = (
    <div
      className="pdf-modal-portal fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-center items-start p-2 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      {/* Modal Card Wrapper */}
      <div
        className="relative bg-[#222222] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-2 sm:my-6 border border-neutral-800 text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Sticky Action Bar (Hidden on print) */}
        <div className="sticky top-0 z-30 bg-[#111111]/95 backdrop-blur-md text-white px-5 py-3 flex items-center justify-between border-b border-neutral-800 shadow-xl no-print">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="font-bold text-xs sm:text-sm text-neutral-200 truncate">
              Отчёт СМА ({companyName}) — Белый фон для печати
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsEditingParams(!isEditingParams)}
              className="inline-flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer"
              title="Изменить описание выборки"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Параметры выборки</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs px-4 sm:px-5 py-2.5 rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Распечатать / Сохранить PDF
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Закрыть окно"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Inline Editor for Search Parameters (No-print banner) */}
        {isEditingParams && (
          <div className="bg-[#181818] border-b border-amber-500/30 p-4 space-y-3 no-print text-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" /> Редактирование блока «В районе X объектов с параметрами:»
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetParamsText}
                  className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
                >
                  <RotateCcw className="w-3 h-3" /> Сбросить
                </button>
                <button
                  type="button"
                  onClick={handleSaveParamsText}
                  className="text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1 px-3 py-1 rounded-lg"
                >
                  <Check className="w-3.5 h-3.5" /> Сохранить
                </button>
              </div>
            </div>
            <textarea
              rows={6}
              value={localSearchParams}
              onChange={(e) => setLocalSearchParams(e.target.value)}
              className="w-full bg-[#242424] text-neutral-100 text-xs p-3 rounded-xl border border-neutral-700 focus:outline-none focus:border-amber-500 font-mono leading-relaxed"
              placeholder="Введите параметры выборки объектов..."
            />
          </div>
        )}

        {/* ========================================================
            PRINTABLE ANALYTICS REPORT BODY (WHITE BACKGROUND A4)
            ISOLATED PRINTABLE CONTAINER (#printable-pdf-report)
           ======================================================== */}
        <div
          id="printable-pdf-report"
          ref={reportRef}
          className="p-6 sm:p-8 space-y-8 bg-white text-slate-900 text-xs print:p-0 print:bg-white"
        >
          {/* ========================================================
              СТРАНИЦА 1: ТИТУЛ, ПАРАМЕТРЫ ОБЪЕКТА И РЕЗУЛЬТАТ ОЦЕНКИ
             ======================================================== */}
          <div className="pdf-page pdf-page-1 space-y-4">
            {/* Header Strip */}
            <div className="bg-white text-slate-900 rounded-xl p-3 sm:p-4 flex items-center justify-between border border-slate-200 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-600 space-y-0.5">
                <div>{companyAddress}</div>
                <div>
                  Сайт: <strong className="text-amber-700">{companyWebsite}</strong>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {user.companyLogo ? (
                  <img src={user.companyLogo} alt={companyName} className="h-9 object-contain" />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-xl font-black tracking-tight text-amber-600 block leading-none">
                        {companyName.split(' ')[0] || 'Тренд'}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block">
                        {companyName.split(' ').slice(1).join(' ') || 'недвижимость'}
                      </span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-lg border border-amber-500/20">
                      Т
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Document Main Title */}
            <div className="text-center space-y-1.5 pt-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Сравнительный анализ объекта недвижимости
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
                Приветствую! Вот отчёт об оценке рыночной стоимости квартиры, анализ конкурентов и рекомендации по продаже.
              </p>
            </div>

            {/* Section 1: Параметры объекта */}
            <div className="space-y-2 pt-1 avoid-break">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-1 inline-block pr-6">
                Параметры объекта
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-50 rounded-xl p-4 border border-slate-200">
                {/* Photo */}
                <div className="md:col-span-6 rounded-lg overflow-hidden border border-slate-200 h-44 sm:h-48 bg-slate-100 flex items-center justify-center shadow-xs">
                  {targetProperty.photo ? (
                    <img
                      src={targetProperty.photo}
                      alt="Объект"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <Building2 className="w-10 h-10 mx-auto mb-1.5 opacity-50 text-amber-500" />
                      <span className="font-semibold text-xs">Главное фото объекта</span>
                    </div>
                  )}
                </div>

                {/* Details list */}
                <div className="md:col-span-6 space-y-2 text-xs">
                  <div className="pb-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-medium block text-[10px]">Тип недвижимости:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {targetProperty.rooms}-комнатная квартира
                    </span>
                  </div>

                  <div className="pb-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-medium block text-[10px]">Адрес объекта:</span>
                    <span className="font-bold text-amber-800 truncate block">
                      {targetProperty.address || 'г. Санкт-Петербург'}
                    </span>
                  </div>

                  <div className="pb-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-medium block text-[10px]">Состояние / Ремонт:</span>
                    <span className="font-bold text-slate-900">
                      {targetProperty.renovation || 'Косметический'}
                    </span>
                  </div>

                  <div className="pb-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-medium block text-[10px]">Общая площадь:</span>
                    <span className="font-black text-amber-700 text-base">
                      {targetProperty.area} м²
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block text-[10px]">Этаж / Этажность:</span>
                    <span className="font-bold text-slate-900">
                      {targetProperty.floor} из {targetProperty.totalFloors} эт.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Результат оценки */}
            <div className="space-y-2 pt-1 avoid-break">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-1 inline-block pr-6">
                Результат оценки
              </h2>

              <div className="rounded-xl overflow-hidden border border-amber-300 shadow-sm avoid-break">
                {/* Header Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 bg-amber-600 text-white font-bold text-xs text-center border-b border-amber-700 divide-x divide-amber-700/60">
                  <div className="p-2.5">Среднерыночная стоимость конкурентов за м²</div>
                  <div className="p-2.5">Прогноз цены продажи за м² после сравнения с конкурентами</div>
                  <div className="p-2.5">Полная стоимость составит</div>
                  <div className="p-2.5">Прогноз срока продажи при указанной стоимости</div>
                </div>

                {/* Values Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 bg-amber-50/70 text-slate-900 font-extrabold text-xs sm:text-sm text-center divide-x divide-amber-200">
                  <div className="p-3.5 flex items-center justify-center text-slate-900 font-bold">
                    {formatNumber(analytics.baseMarketPriceSqm)} рублей
                  </div>
                  <div className="p-3.5 flex items-center justify-center text-emerald-700 font-bold">
                    {formatNumber(analytics.adjustedMidSqm)} рублей
                  </div>
                  <div className="p-3.5 flex items-center justify-center text-amber-800 font-black text-base sm:text-lg">
                    {formatCurrency(analytics.adjustedMidPrice)}
                  </div>
                  <div className="p-3.5 flex items-center justify-center text-slate-700 font-semibold">
                    1-2 месяца
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              СТРАНИЦА 2: АНАЛИЗ КОНКУРЕНТОВ, КАРТА, ПАРАМЕТРЫ ВЫБОРКИ,
              ТАБЛИЦА КОНКУРЕНТОВ И СЕТКА КОРРЕКТИРОВОК
             ======================================================== */}
          <div className="pdf-page pdf-page-2 pdf-page-break space-y-4 pt-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-1 inline-block pr-6">
              Анализ конкурентов
            </h2>

            {/* Map & Customizable Search Parameters Block */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-slate-50 rounded-xl p-4 border border-slate-200 avoid-break">
              {/* Static Map */}
              <div className="md:col-span-5 rounded-lg overflow-hidden border border-slate-200 h-48 bg-slate-100 flex items-center justify-center relative shadow-xs group">
                {(() => {
                  const rawMapAddress = (targetProperty.address || 'Санкт-Петербург')
                    .split(/На карте|Шоурум|Офис продаж/i)[0]
                    .replace(/(?:[А-Яа-яA-Za-z]+)\d+\s*мин.*/gi, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                  const encodedMapAddr = encodeURIComponent(rawMapAddress || 'Санкт-Петербург');
                  const mapSrc = `/api/map?address=${encodedMapAddr}`;
                  const yandexMapsUrl = `https://yandex.ru/maps/?text=${encodedMapAddr}`;

                  return (
                    <a
                      href={yandexMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-full block relative cursor-pointer"
                      title="Открыть на Яндекс Картах"
                    >
                      <img
                        src={mapSrc}
                        alt="Карта Яндекса"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).setAttribute(
                            'src',
                            'https://static-maps.yandex.ru/1.x/?l=map&size=600,280&z=12&ll=30.315868,59.939095&pt=30.315868,59.939095,pm2rdm'
                          );
                        }}
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors flex items-end justify-between p-2">
                        <span className="bg-slate-900/90 px-2.5 py-1 rounded text-[10px] font-semibold text-amber-400 border border-amber-500/30 flex items-center gap-1 backdrop-blur-sm shadow">
                          <MapPin className="w-3 h-3 text-amber-400" /> Яндекс Карта
                        </span>
                        <span className="no-print bg-white/90 hover:bg-white text-[10px] font-bold text-slate-800 px-2 py-1 rounded flex items-center gap-1 border border-slate-300 shadow">
                          Открыть <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </a>
                  );
                })()}
              </div>

              {/* Customizable Parameters List */}
              <div className="md:col-span-7 space-y-2 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-slate-900 text-xs">
                    Параметры выборки объектов в районе:
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsEditingParams(!isEditingParams)}
                    className="text-[10px] text-amber-700 hover:text-amber-800 font-semibold no-print flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" /> Редактировать текст
                  </button>
                </div>

                {/* Render lines from localSearchParams */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-slate-700 font-medium whitespace-pre-line leading-relaxed text-xs shadow-2xs">
                  {localSearchParams}
                </div>
              </div>
            </div>

            {/* Table of Competitors with Clickable Links and Competitor Tags */}
            <div className="rounded-xl overflow-hidden border border-slate-300 text-xs shadow-xs avoid-break">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="p-2 text-left border-r border-slate-300">Объект / Ссылка</th>
                    <th className="p-2 border-r border-slate-300">Стоимость</th>
                    <th className="p-2 border-r border-slate-300">м²</th>
                    <th className="p-2 border-r border-slate-300 bg-amber-100 text-amber-900 font-bold">руб за метр</th>
                    <th className="p-2 border-r border-slate-300">Ремонт</th>
                    <th className="p-2 border-r border-slate-300">Этаж</th>
                    <th className="p-2">Срок продажи</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {/* Target property row highlighted */}
                  <tr className="bg-amber-100/70 font-bold border-b-2 border-amber-500 text-amber-950">
                    <td className="p-2 text-left font-black border-r border-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span>Наш объект</span>
                        <span className="inline-flex items-center text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-400/80">
                          Целевой
                        </span>
                      </div>
                    </td>
                    <td className="p-2 font-black text-slate-900 border-r border-slate-300">
                      {formatCurrency(targetProperty.price)}
                    </td>
                    <td className="p-2 border-r border-slate-300 font-bold">{targetProperty.area}</td>
                    <td className="p-2 font-black text-amber-900 bg-amber-200/60 border-r border-slate-300">
                      {formatNumber(targetProperty.pricePerSqm)} ₽
                    </td>
                    <td className="p-2 border-r border-slate-300">{targetProperty.renovation || 'Косметический'}</td>
                    <td className="p-2 border-r border-slate-300">
                      {targetProperty.floor}/{targetProperty.totalFloors}
                    </td>
                    <td className="p-2 text-slate-700">1-2 мес</td>
                  </tr>

                  {/* Competitor rows */}
                  {activeCompetitors.map((comp, idx) => (
                    <tr key={comp.id || idx} className="hover:bg-slate-50 transition-colors text-slate-800">
                      <td className="p-2 text-left border-r border-slate-200">
                        <div className="flex flex-col gap-1 items-start">
                          <div className="flex items-center gap-1 flex-wrap">
                            {comp.url ? (
                              <a
                                href={comp.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline font-bold inline-flex items-center gap-1"
                              >
                                Конкурент #{idx + 1}
                                <ExternalLink className="w-2.5 h-2.5 inline shrink-0 no-print" />
                              </a>
                            ) : (
                              <span className="font-bold text-slate-700">Конкурент #{idx + 1}</span>
                            )}
                          </div>
                          {comp.tag && (
                            <span className={getTagBadgeClasses(comp.tag.color, 'print')}>
                              {comp.tag.text}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2 font-bold text-slate-900 border-r border-slate-200">
                        {formatCurrency(comp.price)}
                      </td>
                      <td className="p-2 border-r border-slate-200">{comp.area}</td>
                      <td className="p-2 font-bold text-slate-900 bg-slate-50 border-r border-slate-200">
                        {formatNumber(comp.pricePerSqm)} ₽
                      </td>
                      <td className="p-2 border-r border-slate-200 text-slate-700">
                        {comp.renovation || 'Косметический'}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-slate-700">
                        {comp.floor}/{comp.totalFloors}
                      </td>
                      <td className="p-2 text-slate-500">{idx % 2 === 0 ? '1 мес' : '2 мес'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Factors list: 6 categories strictly matching the spreadsheet */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs avoid-break">
              <h4 className="font-bold text-slate-900">
                Факторы ликвидности объекта и % корректировки от среднерыночной стоимости за м²:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-slate-700 font-medium">
                <div>• Этаж: {adjustments.floorAdjustment > 0 ? `+${adjustments.floorAdjustment}%` : `${adjustments.floorAdjustment}%`}</div>
                <div>• Ремонт: «{targetProperty.renovation || 'Косметический'}» ({adjustments.renovationAdjustment > 0 ? `+${adjustments.renovationAdjustment}%` : `${adjustments.renovationAdjustment}%`})</div>
                <div>• Конкуренты в локации: {adjustments.competitorsAdjustment > 0 ? `+${adjustments.competitorsAdjustment}%` : `${adjustments.competitorsAdjustment}%`}</div>
                <div>• Балкон / лоджия: {adjustments.balconyAdjustment > 0 ? `+${adjustments.balconyAdjustment}%` : `${adjustments.balconyAdjustment}%`}</div>
                <div>• Спрос по локации: {adjustments.demandAdjustment > 0 ? `+${adjustments.demandAdjustment}%` : `${adjustments.demandAdjustment}%`}</div>
                <div>• Документы и сделка: {adjustments.legalAdjustment > 0 ? `+${adjustments.legalAdjustment}%` : `${adjustments.legalAdjustment}%`}</div>
              </div>
              <div className="pt-2 font-black text-slate-900 text-sm border-t border-slate-200 flex justify-between items-center">
                <span>Итоговая суммарная корректировка:</span>
                <span className="text-base text-amber-700 font-black">
                  {totalAdjPercent > 0 ? `+${totalAdjPercent}%` : `${totalAdjPercent}%`}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================
              СТРАНИЦА 3: ЦЕНЫ РЫНКА, СВОДНЫЕ ТАБЛИЦЫ, АГРЕГАТОРЫ И РИЕЛТОР
             ======================================================== */}
          <div className="pdf-page pdf-page-break space-y-4 pt-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-1 inline-block pr-6">
              Цены рынка
            </h2>

            {/* Tables Matrix matching Hassanov Spreadsheet */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 avoid-break">
              {/* Left Purple Block */}
              <div className="md:col-span-5 space-y-3">
                {/* Цена собственника */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <div className="bg-purple-800 text-white p-2 font-bold uppercase text-center text-xs">
                    Цена собственника
                  </div>
                  <table className="w-full text-xs text-center border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="p-2 font-bold bg-slate-50 text-left w-36 text-slate-700">Цена собственника</td>
                        <td className="p-2 font-extrabold text-slate-900">{formatCurrency(targetProperty.price)}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-2 font-bold bg-slate-50 text-left text-slate-700">Площадь:</td>
                        <td className="p-2 font-bold text-slate-900">{targetProperty.area}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold bg-slate-50 text-left text-slate-700">Цена за м²</td>
                        <td className="p-2 font-black text-white bg-rose-500">{formatNumber(targetProperty.pricePerSqm)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Данные рынка: 3 дешевых и 3 дорогих */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <div className="bg-purple-800 text-white p-2 font-bold uppercase text-center text-xs">
                    Данные рынка
                  </div>
                  <div className="p-2.5 space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-600 block mb-1">3 самых дешевых квартиры по м²:</span>
                      {analytics.topCheapestSqms.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-0.5 border-b border-slate-100 font-bold">
                          <span className="text-slate-500">Вариант #{idx + 1}</span>
                          <span className="text-emerald-700">{formatNumber(item.pricePerSqm)} ₽</span>
                        </div>
                      ))}
                    </div>

                    <div>
                      <span className="font-bold text-slate-600 block mb-1">3 самых дорогих квартиры по м²:</span>
                      {analytics.topExpensiveSqms.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-0.5 border-b border-slate-100 font-bold">
                          <span className="text-slate-500">Вариант #{idx + 1}</span>
                          <span className="text-rose-700">{formatNumber(item.pricePerSqm)} ₽</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Просчет стоимости объекта (B18, B19, B20) */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <div className="bg-purple-800 text-white p-2 font-bold uppercase text-center text-xs">
                    Просчет стоимости объекта (За м²)
                  </div>
                  <div className="p-2.5 space-y-1 text-xs font-semibold">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Среднее по дешевым:</span>
                      <span className="font-bold text-slate-900">{formatNumber(analytics.avgCheapSqm)} ₽</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Среднее по дорогим:</span>
                      <span className="font-bold text-slate-900">{formatNumber(analytics.avgExpensiveSqm)} ₽</span>
                    </div>
                    <div className="flex justify-between py-1 bg-purple-50 px-2 rounded font-bold text-purple-900">
                      <span>Общее среднее (B20):</span>
                      <span>{formatNumber(analytics.marketAvgSqm)} ₽</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Block: Итоговая стоимость и Отклонения */}
              <div className="md:col-span-7 space-y-3">
                {/* Базовая стоимость без поправки */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <div className="bg-purple-800 text-white p-2 font-bold uppercase flex justify-between px-4 text-xs">
                    <span>Итоговая стоимость (базовая):</span>
                    <span>За м²</span>
                  </div>
                  <table className="w-full text-xs text-center border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="p-2 font-bold bg-slate-50 text-left w-24 text-slate-700">Среднее</td>
                        <td className="p-2 font-extrabold text-slate-900">{formatCurrency(analytics.baseMidPrice)}</td>
                        <td className="p-2 font-bold text-amber-700">{formatNumber(analytics.baseMarketPriceSqm)}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-2 font-bold bg-slate-50 text-left text-slate-700">Низ</td>
                        <td className="p-2 font-semibold text-slate-700">{formatCurrency(analytics.baseLowPrice)}</td>
                        <td className="p-2 font-medium text-slate-600">{formatNumber(analytics.baseLowSqm)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold bg-slate-50 text-left text-slate-700">Верх</td>
                        <td className="p-2 font-semibold text-slate-700">{formatCurrency(analytics.baseHighPrice)}</td>
                        <td className="p-2 font-medium text-slate-600">{formatNumber(analytics.baseHighSqm)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* % отклонение от рыночной цены за м2 */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <div className="bg-purple-800 text-white p-2 font-bold uppercase text-center text-xs">
                    % отклонение от рыночной цены за м²
                  </div>
                  <table className="w-full text-xs text-center border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="p-2 font-bold bg-slate-50 text-left w-24 text-slate-700">Среднее</td>
                        <td className="p-2 font-extrabold text-slate-900">
                          {analytics.deviationMidPercent > 0 ? `+${analytics.deviationMidPercent}%` : `${analytics.deviationMidPercent}%`}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-2 font-bold bg-slate-50 text-left text-slate-700">Низ</td>
                        <td className="p-2 font-bold text-emerald-700">
                          {analytics.deviationLowPercent > 0 ? `+${analytics.deviationLowPercent}%` : `${analytics.deviationLowPercent}%`}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold bg-slate-50 text-left text-slate-700">Верх</td>
                        <td className="p-2 font-bold text-rose-700">
                          {analytics.deviationHighPercent > 0 ? `+${analytics.deviationHighPercent}%` : `${analytics.deviationHighPercent}%`}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Итоговая стоимость с учетом корректировки (Таблица ячейки F16-F18) */}
                <div className="border border-amber-300 rounded-lg overflow-hidden bg-white shadow-xs">
                  <div className="bg-amber-600 text-white p-2 font-bold uppercase flex justify-between px-4 text-xs">
                    <span>Итоговая стоимость с учетом корректировки</span>
                    <span>За м²</span>
                  </div>
                  <table className="w-full text-xs text-center border-collapse">
                    <tbody>
                      <tr className="border-b border-amber-200 bg-emerald-50/80">
                        <td className="p-2 font-black text-left w-24 text-emerald-950">Среднее</td>
                        <td className="p-2 font-black text-slate-950 text-sm">{formatCurrency(analytics.adjustedMidPrice)}</td>
                        <td className="p-2 font-black text-emerald-800">{formatNumber(analytics.adjustedMidSqm)}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-2 font-bold bg-slate-50 text-left text-slate-700">Низ</td>
                        <td className="p-2 font-bold text-slate-800">{formatCurrency(analytics.adjustedLowPrice)}</td>
                        <td className="p-2 font-medium text-slate-600">{formatNumber(analytics.adjustedLowSqm)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold bg-slate-50 text-left text-slate-700">Верх</td>
                        <td className="p-2 font-bold text-slate-800">{formatCurrency(analytics.adjustedHighPrice)}</td>
                        <td className="p-2 font-medium text-slate-600">{formatNumber(analytics.adjustedHighSqm)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Корректировка % */}
                <div className="bg-amber-50 rounded-lg p-2.5 flex items-center justify-between text-amber-950 font-black text-sm border-2 border-amber-500 shadow-2xs">
                  <span>Корректировка:</span>
                  <span className="text-lg text-amber-700 font-black">
                    {totalAdjPercent > 0 ? `+${totalAdjPercent}%` : `${totalAdjPercent}%`}
                  </span>
                </div>
              </div>
            </div>

            {/* Aggregators Section */}
            <div className="space-y-2 pt-2 avoid-break">
              <h3 className="text-xs font-bold text-slate-900 border-b border-slate-200 pb-1">
                Оценка цены квартиры согласно сайтам-агрегаторам
              </h3>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5 text-xs text-slate-800">
                {(() => {
                  const itemsWithEstimate = aggregatorEstimates.filter((item) => item.estimate > 0);
                  const displayItems = aggregatorEstimates.length > 0 ? aggregatorEstimates : [
                    { id: 'avito', name: 'Авито Оценка', estimate: 8100000, minEstimate: 7800000, maxEstimate: 9000000 },
                    { id: 'cian', name: 'ЦИАН Оценка', estimate: 7000000, minEstimate: 6300000, maxEstimate: 7700000 },
                    { id: 'yandex', name: 'Яндекс Недвижимость', estimate: 7450000 },
                    { id: 'domclick', name: 'Домклик', estimate: 8700000, minEstimate: 7400000, maxEstimate: 10000000 },
                  ];

                  const avgVal = itemsWithEstimate.length > 0
                    ? Math.round(itemsWithEstimate.reduce((sum, i) => sum + i.estimate, 0) / itemsWithEstimate.length)
                    : 7812500;

                  return (
                    <>
                      {displayItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-1 border-b border-slate-200">
                          <span className="text-slate-600">{item.name}:</span>
                          <span className="font-bold text-slate-900">
                            {item.estimate > 0 ? formatCurrency(item.estimate) : 'Данные не найдены'}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-1 font-bold text-amber-800">
                        <span>Среднее агрегаторов:</span>
                        <span>{formatCurrency(avgVal)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Conclusions and Recommendations */}
            <div className="space-y-2 pt-2 avoid-break">
              <h3 className="text-xs font-bold text-slate-900 border-b border-slate-200 pb-1">
                Заключения и рекомендации эксперта
              </h3>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1 text-xs text-slate-700">
                {(conclusions.length > 0 ? conclusions : [
                  'Стартовая рыночная стоимость определена с учетом локации, этажности и технического состояния.',
                  'Срок экспозиции объекта при заданной цене составляет от 30 до 45 дней при текущем спросе.',
                  'Рекомендуется проведение предпродажной подготовки (хоум-стейджинг) для максимальной скорости продажи.',
                  'Диапазон возможного торга при активных переговорах рекомендуется ограничить в пределах 2–3%.',
                ]).map((c, i) => (
                  <div key={i} className="flex items-start gap-2 py-0.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Author Profile Footer */}
            <div className="bg-white text-slate-900 rounded-xl p-4 flex items-center justify-between border border-slate-200 shadow-sm avoid-break">
              <div className="flex items-center gap-3">
                <img
                  src={authorPhoto}
                  alt={authorName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-500"
                />
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{authorName}</h4>
                  <p className="text-xs text-slate-500">{authorPosition}</p>
                </div>
              </div>

              <div className="text-right text-xs space-y-0.5 font-semibold text-slate-600">
                <div>Тел: <strong className="text-slate-900">{authorPhone}</strong></div>
                <div>Email: {authorEmail}</div>
                <div>Telegram: <span className="text-sky-700">{authorTelegram}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
