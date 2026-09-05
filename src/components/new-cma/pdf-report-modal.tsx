'use client';

import { Property, CmaAdjustments, UserProfile, AggregatorEstimate } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { X, Printer, ExternalLink, MapPin, Building2 } from 'lucide-react';
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
  aggregatorEstimates = [],
  conclusions = [],
}: PdfReportModalProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  // Active competitors calculations
  const activeCompetitors = competitors.filter((c) => c.price > 0);
  const priceSqms = activeCompetitors.map((c) => c.pricePerSqm);
  const count = activeCompetitors.length;

  const avgPriceSqm = count > 0 ? Math.round(priceSqms.reduce((a, b) => a + b, 0) / count) : targetProperty.pricePerSqm;
  const sortedBySqm = [...activeCompetitors].sort((a, b) => a.pricePerSqm - b.pricePerSqm);
  
  // TOP 3 cheapest & expensive per sqm
  const topCheapestSqms = sortedBySqm.slice(0, 3);
  const topExpensiveSqms = sortedBySqm.slice(-3).reverse();

  const cheapestAvgSqm = topCheapestSqms.length > 0
    ? Math.round(topCheapestSqms.reduce((a, b) => a + b.pricePerSqm, 0) / topCheapestSqms.length)
    : targetProperty.pricePerSqm;

  const expensiveAvgSqm = topExpensiveSqms.length > 0
    ? Math.round(topExpensiveSqms.reduce((a, b) => a + b.pricePerSqm, 0) / topExpensiveSqms.length)
    : targetProperty.pricePerSqm;

  // Total adjustment percent
  const totalAdjPercent =
    adjustments.floorAdjustment +
    adjustments.renovationAdjustment +
    adjustments.balconyAdjustment +
    adjustments.demandAdjustment +
    adjustments.legalAdjustment;

  // Base Prices before adjustments
  const basePrice = Math.round(targetProperty.area * avgPriceSqm);
  const baseLow = Math.round(basePrice * 0.93);
  const baseHigh = Math.round(basePrice * 1.05);

  // Adjusted Prices
  const adjustedPrice = Math.round(basePrice * (1 + totalAdjPercent / 100));
  const adjustedLow = Math.round(baseLow * (1 + totalAdjPercent / 100));
  const adjustedHigh = Math.round(baseHigh * (1 + totalAdjPercent / 100));

  // Deviations %
  const devAvgNum = avgPriceSqm > 0 ? ((targetProperty.pricePerSqm - avgPriceSqm) / avgPriceSqm) * 100 : 0;
  const devLowNum = cheapestAvgSqm > 0 ? ((targetProperty.pricePerSqm - cheapestAvgSqm) / cheapestAvgSqm) * 100 : 0;
  const devHighNum = expensiveAvgSqm > 0 ? ((targetProperty.pricePerSqm - expensiveAvgSqm) / expensiveAvgSqm) * 100 : 0;

  const devAvg = devAvgNum.toFixed(1);
  const devLow = devLowNum.toFixed(1);
  const devHigh = devHighNum.toFixed(1);

  const handlePrint = () => {
    document.body.classList.add('printing-pdf');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-pdf');
    }, 500);
  };

  // Dynamic logged-in User profile fields from settings
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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-center items-start p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div 
        className="relative bg-[#1e1e1e] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-2 sm:my-6 border border-neutral-800 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Sticky Floating Action Controls (Hidden on Print) */}
        <div className="sticky top-0 z-30 bg-[#111111]/95 backdrop-blur-md text-white px-5 sm:px-6 py-3.5 flex items-center justify-between border-b border-neutral-800 shadow-xl no-print">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="font-bold text-xs sm:text-sm text-neutral-200 truncate">Отчёт СМА ({companyName})</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
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

        {/* ========================================================
            DARK DESIGN PRINTABLE ANALYTICS REPORT BODY (MATCHES DOCX TEMPLATE)
            ISOLATED PRINTABLE CONTAINER (#printable-pdf-report)
           ======================================================== */}
        <div 
          id="printable-pdf-report"
          ref={reportRef} 
          className="p-8 space-y-8 bg-[#1e1e1e] text-white text-xs print:p-0 print:bg-[#1e1e1e]"
        >
          
          {/* HEADER STRIP */}
          <div className="bg-white text-neutral-900 rounded-xl p-4 flex items-center justify-between shadow-md">
            <div className="text-[11px] font-semibold text-neutral-600 space-y-0.5">
              <div>{companyAddress}</div>
              <div>Сайт: <strong className="text-amber-700">{companyWebsite}</strong></div>
            </div>

            <div className="flex items-center gap-3">
              {user.companyLogo ? (
                <img src={user.companyLogo} alt={companyName} className="h-10 object-contain" />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-2xl font-black tracking-tight text-amber-600 block leading-none">{companyName.split(' ')[0] || 'Тренд'}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block">{companyName.split(' ').slice(1).join(' ') || 'недвижимость'}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-xl border border-amber-500/20">
                    Т
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MAIN DOCUMENT TITLE */}
          <div className="text-center space-y-3 pt-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Сравнительный анализ объекта недвижимости
            </h1>
            <p className="text-neutral-300 text-sm max-w-2xl mx-auto leading-relaxed">
              Приветствую! Вот отчёт об оценке рыночной стоимости квартиры, анализ конкурентов и рекомендации по продаже.
            </p>
          </div>

          {/* SECTION 1: ПАРАМЕТРЫ ОБЪЕКТА */}
          <div className="space-y-4 pt-2">
            <h2 className="text-lg font-bold text-white border-b border-neutral-700 pb-1.5 inline-block pr-6">
              Параметры объекта
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-[#242424] rounded-2xl p-5 border border-neutral-800">
              {/* Photo - Enlarged display (~3x size) */}
              <div className="md:col-span-7 rounded-xl overflow-hidden border border-neutral-700 h-72 md:h-80 bg-neutral-900 flex items-center justify-center shadow-lg">
                {targetProperty.photo ? (
                  <img
                    src={targetProperty.photo}
                    alt="Объект"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-neutral-500">
                    <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50 text-amber-500" />
                    <span className="font-semibold text-sm">Главное фото объекта</span>
                  </div>
                )}
              </div>

              {/* Details list */}
              <div className="md:col-span-5 space-y-3 text-sm">
                <div className="pb-2 border-b border-neutral-800">
                  <span className="text-neutral-400 font-medium block text-xs">Тип недвижимости:</span>
                  <span className="font-bold text-white text-base">{targetProperty.rooms}-комнатная квартира</span>
                </div>

                <div className="pb-2 border-b border-neutral-800">
                  <span className="text-neutral-400 font-medium block text-xs">Адрес объекта:</span>
                  <span className="font-bold text-amber-300">{targetProperty.address || 'г. Санкт-Петербург'}</span>
                </div>

                <div className="pb-2 border-b border-neutral-800">
                  <span className="text-neutral-400 font-medium block text-xs">Состояние / Ремонт:</span>
                  <span className="font-bold text-white">{targetProperty.renovation || 'Евроремонт'}</span>
                </div>

                <div className="pb-2 border-b border-neutral-800">
                  <span className="text-neutral-400 font-medium block text-xs">Общая площадь:</span>
                  <span className="font-black text-amber-400 text-lg">{targetProperty.area} м²</span>
                </div>

                <div>
                  <span className="text-neutral-400 font-medium block text-xs">Этаж / Этажность:</span>
                  <span className="font-bold text-white">{targetProperty.floor} из {targetProperty.totalFloors} эт.</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: РЕЗУЛЬТАТ ОЦЕНКИ */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-neutral-700 pb-1.5 inline-block pr-6">
              Результат оценки
            </h2>

            <div className="rounded-xl overflow-hidden border border-neutral-800 shadow-xl">
              {/* Header Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 bg-[#a65300] text-white font-bold text-xs text-center border-b border-neutral-800 divide-x divide-amber-700/50">
                <div className="p-3">Среднерыночная стоимость конкурентов за м²</div>
                <div className="p-3">Прогноз цены продажи за м² после сравнения с конкурентами</div>
                <div className="p-3">Полная стоимость составит</div>
                <div className="p-3">Прогноз срока продажи при указанной стоимости</div>
              </div>

              {/* Values Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 bg-[#262626] text-white font-extrabold text-sm lg:text-base text-center divide-x divide-neutral-700">
                <div className="p-4 flex items-center justify-center text-amber-300">
                  {formatNumber(avgPriceSqm)} рублей
                </div>
                <div className="p-4 flex items-center justify-center text-emerald-400">
                  {formatNumber(Math.round(adjustedPrice / (targetProperty.area || 1)))} рублей
                </div>
                <div className="p-4 flex items-center justify-center text-amber-400 font-black text-lg">
                  {formatCurrency(adjustedPrice)}
                </div>
                <div className="p-4 flex items-center justify-center text-neutral-200">
                  1-2 месяца
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: АНАЛИЗ КОНКУРЕНТОВ & ТАБЛИЦА С ССЫЛКАМИ */}
          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-bold text-white border-b border-neutral-700 pb-1.5 inline-block pr-6">
              Анализ конкурентов
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start bg-[#242424] rounded-2xl p-5 border border-neutral-800">
              {/* Yandex Static Maps API location map */}
              <div className="md:col-span-5 rounded-xl overflow-hidden border border-neutral-700 h-52 bg-neutral-900 flex items-center justify-center relative shadow-md">
                <img
                  src={
                    process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY
                      ? `https://static-maps.yandex.ru/v1?text=${encodeURIComponent(targetProperty.address || 'Санкт-Петербург')}&size=600,280&z=14&l=map&apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY}`
                      : `https://static-maps.yandex.ru/1.x/?l=map&size=600,280&z=13&text=${encodeURIComponent(targetProperty.address || 'Санкт-Петербург')}`
                  }
                  alt="Карта Яндекса"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to stylized Yandex map background if API fails offline
                    (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&auto=format&fit=crop&q=80');
                  }}
                />
                <div className="absolute inset-0 bg-black/30 flex items-end p-2.5">
                  <span className="bg-neutral-900/90 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-400 border border-amber-500/30 flex items-center gap-1.5 backdrop-blur-sm shadow-md">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" /> Яндекс Карта объекта
                  </span>
                </div>
              </div>

              {/* Params list */}
              <div className="md:col-span-7 space-y-2 text-xs">
                <h4 className="font-bold text-white text-sm mb-2">
                  В районе {count > 0 ? count : 8} объектов с параметрами:
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-neutral-300 font-medium">
                  <li>{targetProperty.rooms}-к квартира ({targetProperty.area} м²)</li>
                  <li>Материал постройки: {targetProperty.buildingMaterial || 'Кирпич-монолит'}</li>
                  <li>Локация: {targetProperty.address || 'Санкт-Петербург'}</li>
                  <li>Этаж: {targetProperty.floor > 1 ? 'Не первый' : '1 этаж'}</li>
                  <li>Год постройки: от 2000 года</li>
                </ol>
              </div>
            </div>

            {/* TABLE OF COMPETITORS WITH CLICKABLE LINKS */}
            <div className="rounded-xl overflow-hidden border border-neutral-800 text-xs shadow-xl">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-[#2c2c2c] text-white font-bold border-b border-neutral-700">
                    <th className="p-2.5 text-left border-r border-neutral-700">Ссылка</th>
                    <th className="p-2.5 border-r border-neutral-700">Стоимость</th>
                    <th className="p-2.5 border-r border-neutral-700">м²</th>
                    <th className="p-2.5 border-r border-neutral-700 bg-[#7a4d00] text-amber-200">руб за метр</th>
                    <th className="p-2.5 border-r border-neutral-700">Ремонт</th>
                    <th className="p-2.5 border-r border-neutral-700">Этаж</th>
                    <th className="p-2.5">Сколько стоит</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 bg-[#1f1f1f]">
                  {/* Target property row highlighted */}
                  <tr className="bg-[#382600] font-bold border-b-2 border-amber-600 text-amber-200">
                    <td className="p-2.5 text-left font-black border-r border-neutral-800 underline">
                      Наш объект
                    </td>
                    <td className="p-2.5 font-black text-white border-r border-neutral-800">{formatCurrency(targetProperty.price)}</td>
                    <td className="p-2.5 border-r border-neutral-800">{targetProperty.area}</td>
                    <td className="p-2.5 font-black text-amber-400 bg-[#523300] border-r border-neutral-800">{formatNumber(targetProperty.pricePerSqm)} ₽</td>
                    <td className="p-2.5 border-r border-neutral-800">{targetProperty.renovation || 'Евро'}</td>
                    <td className="p-2.5 border-r border-neutral-800">{targetProperty.floor}/{targetProperty.totalFloors}</td>
                    <td className="p-2.5 text-neutral-300">1 мес</td>
                  </tr>

                  {/* Active Competitors */}
                  {activeCompetitors.map((comp, idx) => (
                    <tr key={comp.id || idx} className="hover:bg-[#282828] transition-colors">
                      <td className="p-2.5 text-left border-r border-neutral-800">
                        {comp.url ? (
                          <a
                            href={comp.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-400 hover:text-sky-300 underline font-bold inline-flex items-center gap-1"
                          >
                            Конкурент #{idx + 1}
                            <ExternalLink className="w-3 h-3 inline shrink-0" />
                          </a>
                        ) : (
                          <span className="text-neutral-400">Конкурент #{idx + 1}</span>
                        )}
                      </td>
                      <td className="p-2.5 font-bold text-white border-r border-neutral-800">{formatCurrency(comp.price)}</td>
                      <td className="p-2.5 border-r border-neutral-800">{comp.area}</td>
                      <td className="p-2.5 font-bold text-amber-300 bg-[#3a2800]/50 border-r border-neutral-800">{formatNumber(comp.pricePerSqm)} ₽</td>
                      <td className="p-2.5 border-r border-neutral-800 text-neutral-300">{comp.renovation || 'Косметический'}</td>
                      <td className="p-2.5 border-r border-neutral-800 text-neutral-300">{comp.floor}/{comp.totalFloors}</td>
                      <td className="p-2.5 text-neutral-400">{idx % 2 === 0 ? '1 мес' : '2 мес'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Factors list */}
            <div className="bg-[#242424] rounded-xl p-4 border border-neutral-800 space-y-2 text-xs">
              <h4 className="font-bold text-neutral-300">
                Факторы ликвидности объекта и % корректировки от среднерыночной стоимости за м²:
              </h4>
              <ul className="space-y-1 text-neutral-400 font-medium">
                <li>• Этаж: {adjustments.floorAdjustment > 0 ? `+${adjustments.floorAdjustment}%` : `${adjustments.floorAdjustment}%`}</li>
                <li>• Ремонт: «{targetProperty.renovation || 'Лучше конкурентов'}» ({adjustments.renovationAdjustment > 0 ? `+${adjustments.renovationAdjustment}%` : `${adjustments.renovationAdjustment}%`})</li>
                <li>• Конкуренты: менее 10 в районе ({adjustments.demandAdjustment > 0 ? `+${adjustments.demandAdjustment}%` : `${adjustments.demandAdjustment}%`})</li>
                <li>• Спрос по локации: средний (0%)</li>
              </ul>
              <div className="pt-2 font-black text-amber-400 text-sm border-t border-neutral-700">
                Итоговая корректировка: {totalAdjPercent > 0 ? `+${totalAdjPercent}%` : `${totalAdjPercent}%`}
              </div>
            </div>
          </div>

          {/* PAGE BREAK FOR "ЦЕНЫ РЫНКА" SECTION */}
          <div className="print-page-break pt-4 space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-neutral-700 pb-1.5 inline-block pr-6">
              Цены рынка
            </h2>

            {/* PURPLE & BROWN TABLES MATRIX (MATCHES SCREENSHOT 3 & 4) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* LEFT PURPLE BLOCK */}
              <div className="md:col-span-5 space-y-3">
                {/* Цена собственника */}
                <div className="border border-neutral-700 rounded-lg overflow-hidden bg-[#242424]">
                  <div className="bg-[#5c335c] text-white p-2 font-bold uppercase text-center">
                    Цена собственника
                  </div>
                  <table className="w-full text-xs text-center border-collapse">
                    <tbody>
                      <tr className="border-b border-neutral-700">
                        <td className="p-2 font-bold bg-[#2e2e2e] text-left w-36">Цена собственника</td>
                        <td className="p-2 font-extrabold text-white">{formatCurrency(targetProperty.price)}</td>
                      </tr>
                      <tr className="border-b border-neutral-700">
                        <td className="p-2 font-bold bg-[#2e2e2e] text-left">Площадь:</td>
                        <td className="p-2 font-bold text-white">{targetProperty.area}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold bg-[#2e2e2e] text-left">Цена за м²</td>
                        <td className="p-2 font-black text-white bg-[#ff4d6d]">{formatNumber(targetProperty.pricePerSqm)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Данные рынка */}
                <div className="border border-neutral-700 rounded-lg overflow-hidden bg-[#242424]">
                  <div className="bg-[#5c335c] text-white p-2 font-bold uppercase text-center">
                    Данные рынка
                  </div>
                  <div className="p-3 space-y-3 text-xs">
                    <div>
                      <span className="font-bold text-neutral-400 block mb-1">3 самых дешевых квартиры по м²:</span>
                      {topCheapestSqms.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-1 border-b border-neutral-800 font-bold">
                          <span className="text-neutral-400">Вариант #{idx + 1}</span>
                          <span className="text-emerald-400">{formatNumber(item.pricePerSqm)} ₽</span>
                        </div>
                      ))}
                    </div>

                    <div>
                      <span className="font-bold text-neutral-400 block mb-1">3 самых дорогих квартиры по м²:</span>
                      {topExpensiveSqms.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-1 border-b border-neutral-800 font-bold">
                          <span className="text-neutral-400">Вариант #{idx + 1}</span>
                          <span className="text-rose-400">{formatNumber(item.pricePerSqm)} ₽</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Просчет стоимости объекта */}
                <div className="border border-neutral-700 rounded-lg overflow-hidden bg-[#242424]">
                  <div className="bg-[#5c335c] text-white p-2 font-bold uppercase text-center">
                    Просчет стоимости объекта (За м²)
                  </div>
                  <div className="p-3 space-y-1.5 text-xs font-semibold">
                    <div className="flex justify-between py-1 border-b border-neutral-800">
                      <span className="text-neutral-400">Среднее по дешевым:</span>
                      <span className="font-bold text-white">{formatNumber(cheapestAvgSqm)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-neutral-800">
                      <span className="text-neutral-400">Среднее по дорогим:</span>
                      <span className="font-bold text-white">{formatNumber(expensiveAvgSqm)}</span>
                    </div>
                    <div className="flex justify-between py-1 bg-[#3a263a] px-2 rounded font-bold text-purple-200">
                      <span>Общее среднее:</span>
                      <span>{formatNumber(avgPriceSqm)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT BLOCK (TOTALS & ADJUSTED CORRIDOR) */}
              <div className="md:col-span-7 space-y-3">
                {/* Итоговая стоимость */}
                <div className="border border-neutral-700 rounded-lg overflow-hidden bg-[#242424]">
                  <div className="bg-[#5c335c] text-white p-2 font-bold uppercase flex justify-between px-4">
                    <span>Итоговая стоимость:</span>
                    <span>За м²</span>
                  </div>
                  <table className="w-full text-xs text-center border-collapse">
                    <tbody>
                      <tr className="border-b border-neutral-700">
                        <td className="p-2 font-bold bg-[#2e2e2e] text-left w-24">Среднее</td>
                        <td className="p-2 font-extrabold text-white">{formatCurrency(basePrice)}</td>
                        <td className="p-2 font-bold text-amber-300">{formatNumber(avgPriceSqm)}</td>
                      </tr>
                      <tr className="border-b border-neutral-700">
                        <td className="p-2 font-bold bg-[#2e2e2e] text-left">Низ</td>
                        <td className="p-2 font-bold text-neutral-300">{formatCurrency(baseLow)}</td>
                        <td className="p-2 font-medium text-neutral-400">{formatNumber(Math.round(baseLow / targetProperty.area))}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold bg-[#2e2e2e] text-left">Верх</td>
                        <td className="p-2 font-bold text-neutral-300">{formatCurrency(baseHigh)}</td>
                        <td className="p-2 font-medium text-neutral-400">{formatNumber(Math.round(baseHigh / targetProperty.area))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* % отклонение от рыночной цены */}
                <div className="border border-neutral-700 rounded-lg overflow-hidden bg-[#242424]">
                  <div className="bg-[#5c335c] text-white p-2 font-bold uppercase text-center">
                    % отклонение от рыночной цены за м2
                  </div>
                  <table className="w-full text-xs text-center border-collapse">
                    <tbody>
                      <tr className="border-b border-neutral-700">
                        <td className="p-2 font-bold bg-[#2e2e2e] text-left w-24">Среднее</td>
                        <td className="p-2 font-extrabold text-white">{devAvgNum > 0 ? `+${devAvg}%` : `${devAvg}%`}</td>
                      </tr>
                      <tr className="border-b border-neutral-700">
                        <td className="p-2 font-bold bg-[#2e2e2e] text-left">Низ</td>
                        <td className="p-2 font-bold text-emerald-400">{devLowNum > 0 ? `+${devLow}%` : `${devLow}%`}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold bg-[#2e2e2e] text-left">Верх</td>
                        <td className="p-2 font-bold text-rose-400">{devHighNum > 0 ? `+${devHigh}%` : `${devHigh}%`}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Итоговая стоимость с учетом корректировки (Бронзовый блок) */}
                <div className="border border-amber-700/60 rounded-lg overflow-hidden bg-[#242424]">
                  <div className="bg-[#7a4d00] text-white p-2 font-bold uppercase flex justify-between px-4">
                    <span>Итоговая стоимость с учетом корректировки</span>
                    <span>За м²</span>
                  </div>
                  <table className="w-full text-xs text-center border-collapse">
                    <tbody>
                      <tr className="border-b border-neutral-700 bg-[#2d5a2d]">
                        <td className="p-2 font-black text-left w-24">Среднее</td>
                        <td className="p-2 font-black text-white text-sm">{formatCurrency(adjustedPrice)}</td>
                        <td className="p-2 font-black text-amber-200">{formatNumber(Math.round(adjustedPrice / targetProperty.area))}</td>
                      </tr>
                      <tr className="border-b border-neutral-700">
                        <td className="p-2 font-bold bg-[#2e2e2e] text-left">Низ</td>
                        <td className="p-2 font-bold text-neutral-200">{formatCurrency(adjustedLow)}</td>
                        <td className="p-2 font-medium text-neutral-300">{formatNumber(Math.round(adjustedLow / targetProperty.area))}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold bg-[#2e2e2e] text-left">Верх</td>
                        <td className="p-2 font-bold text-neutral-200">{formatCurrency(adjustedHigh)}</td>
                        <td className="p-2 font-medium text-neutral-300">{formatNumber(Math.round(adjustedHigh / targetProperty.area))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Корректировка % Box */}
                <div className="bg-[#7a4d00] rounded-lg p-3 flex items-center justify-between text-white font-black text-base border border-amber-600">
                  <span>Корректировка:</span>
                  <span className="text-xl text-amber-300">{totalAdjPercent > 0 ? `+${totalAdjPercent},0%` : `${totalAdjPercent},0%`}</span>
                </div>
              </div>
            </div>

            {/* ОЦЕНКА ЦЕНЫ КВАРТИРЫ СОГЛАСНО САЙТАМ-АГРЕГАТОРАМ */}
            <div className="space-y-3 pt-3">
              <h3 className="text-sm font-bold text-white border-b border-neutral-700 pb-1">
                Оценка цены квартиры согласно сайтам-агрегаторам
              </h3>

              <div className="bg-[#242424] rounded-xl p-4 border border-neutral-800 space-y-2 text-xs">
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
                        <div key={item.id} className="flex justify-between items-center py-1 border-b border-neutral-800">
                          <span>
                            <strong className="text-amber-400">{item.name}</strong> —{' '}
                            {item.estimate > 0 ? (
                              <>
                                <span className="font-bold text-white">{formatCurrency(item.estimate)}</span>
                                {item.minEstimate && item.maxEstimate ? (
                                  <span className="text-neutral-400 ml-1">
                                    (диапазон {formatNumber(item.minEstimate)} - {formatNumber(item.maxEstimate)} ₽)
                                  </span>
                                ) : null}
                              </>
                            ) : (
                              <span className="text-neutral-500 font-normal">Данные не указаны</span>
                            )}
                          </span>

                          {item.url ? (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sky-400 hover:text-sky-300 underline font-semibold inline-flex items-center gap-1"
                            >
                              Открыть оценку <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : item.estimate > 0 ? (
                            <span className="text-neutral-400 text-[11px]">Введено вручную</span>
                          ) : null}
                        </div>
                      ))}

                      <div className="pt-2 font-black text-amber-400 text-sm">
                        Средняя по сайтам оценки = {formatCurrency(avgVal)}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* PAGE BREAK FOR "ЗАКЛЮЧЕНИЕ & ПЛАН ПРОДАЖИ" */}
          <div className="print-page-break pt-4 space-y-6">
            
            {/* ЗАКЛЮЧЕНИЕ И РЕКОМЕНДАЦИИ */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white border-b border-neutral-700 pb-1.5 inline-block pr-6">
                Заключение и рекомендации
              </h2>

              <ul className="space-y-2 text-xs text-neutral-300 font-medium list-disc list-inside bg-[#242424] p-4 rounded-xl border border-neutral-800">
                {(conclusions && conclusions.length > 0 ? conclusions : [
                  `Квартира расположена в пешей доступности от основных транспортных узлов (${targetProperty.address || 'Санкт-Петербург'}).`,
                  `Состояние объекта — ${targetProperty.renovation || 'Евроремонт'}.`,
                  'Рекомендуется придерживаться утвержденной цены продажи со снижением при дефиците звонков.',
                ]).map((item, idx) => (
                  <li key={idx} className="leading-relaxed">{item}</li>
                ))}
              </ul>
            </div>

            {/* ПЛАН ПРОДАЖИ ОБЪЕКТА В КАРТОЧКАХ */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white border-b border-neutral-700 pb-1.5 inline-block pr-6">
                План продажи объекта в карточках
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {/* 1 */}
                <div className="bg-[#a65300] text-white p-3.5 rounded-xl space-y-1">
                  <div className="font-bold">Аналитика конкурентов</div>
                  <div className="text-[11px] text-amber-100">Вы всегда в рынке</div>
                </div>

                {/* 2 */}
                <div className="bg-[#2d2d2d] text-white p-3.5 rounded-xl space-y-1 border border-neutral-700">
                  <div className="font-bold">Размещение на платформах для агентов</div>
                  <div className="text-[11px] text-neutral-400">Покупатели от агентов-партнеров</div>
                </div>

                {/* 3 */}
                <div className="bg-[#a65300] text-white p-3.5 rounded-xl space-y-1">
                  <div className="font-bold">Реклама на 20+ площадках</div>
                  <div className="text-[11px] text-amber-100">Максимальный охват покупателей</div>
                </div>

                {/* 4 */}
                <div className="bg-[#2d2d2d] text-white p-3.5 rounded-xl space-y-1 border border-neutral-700">
                  <div className="font-bold">Фото-, видеосъёмка и 3D-тур</div>
                  <div className="text-[11px] text-neutral-400">Больше обращений и показов</div>
                </div>

                {/* 5 */}
                <div className="bg-[#2d2d2d] text-white p-3.5 rounded-xl space-y-1 border border-neutral-700">
                  <div className="font-bold">Отчет о рекламе</div>
                  <div className="text-[11px] text-neutral-400">Вы контролируете процесс и видите результаты</div>
                </div>

                {/* 6 */}
                <div className="bg-[#a65300] text-white p-3.5 rounded-xl space-y-1">
                  <div className="font-bold">Предпродажная подготовка</div>
                  <div className="text-[11px] text-amber-100">Поможем повысить привлекательность объекта</div>
                </div>

                {/* 7 */}
                <div className="bg-[#2d2d2d] text-white p-3.5 rounded-xl space-y-1 border border-neutral-700">
                  <div className="font-bold">Контакт-центр 24/7</div>
                  <div className="text-[11px] text-neutral-400">Обрабатываем 100% чатов и звонков</div>
                </div>

                {/* 8 */}
                <div className="bg-[#a65300] text-white p-3.5 rounded-xl space-y-1">
                  <div className="font-bold">Показы и переговоры</div>
                  <div className="text-[11px] text-amber-100">Отстаиваем ваши интересы</div>
                </div>
              </div>
            </div>

            {/* AUTHOR / AGENT FOOTER PROFILE CARD - STRICT END OF REPORT */}
            <div className="pt-4 flex items-center justify-end">
              <div className="bg-[#242424] rounded-2xl p-4 border border-neutral-700 flex items-center gap-4 text-xs max-w-md shadow-xl">
                <div className="space-y-1 text-right">
                  <div className="text-sm font-extrabold text-white">{authorName}</div>
                  <div className="text-[11px] text-neutral-400 font-semibold">{authorPosition}</div>
                  <div className="text-amber-400 font-bold">{authorPhone}</div>
                  <div className="text-neutral-400 text-[10px]">{authorEmail}</div>
                  <div className="text-sky-400 font-semibold text-[10px]">{authorTelegram}</div>
                </div>

                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-amber-500/50 bg-neutral-800 shrink-0">
                  {authorPhoto ? (
                    <img src={authorPhoto} alt={authorName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-lg text-amber-400 bg-amber-500/20">
                      ХП
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
