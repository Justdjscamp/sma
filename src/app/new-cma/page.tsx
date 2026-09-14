'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { PropertyCard } from '@/components/new-cma/property-card';
import { CompetitorsSection } from '@/components/new-cma/competitors-section';
import { AnalyticsPanel } from '@/components/new-cma/analytics-panel';
import { AdjustmentsMatrix } from '@/components/new-cma/adjustments-matrix';
import { PdfReportModal } from '@/components/new-cma/pdf-report-modal';
import { AggregatorEstimatesSection } from '@/components/new-cma/aggregator-estimates-section';
import { ConclusionsSection, DEFAULT_CONCLUSIONS } from '@/components/new-cma/conclusions-section';
import { EMPTY_TARGET_PROPERTY, DEMO_TARGET_PROPERTY, INITIAL_COMPETITORS, INITIAL_USER } from '@/lib/mock-data';
import { Property, CmaAdjustments, Report, UserProfile, AggregatorEstimate } from '@/types';
import { saveReport, generateReportId } from '@/lib/reports-store';
import { getStoredProfile } from '@/lib/user-store';
import { validateRealEstateUrl } from '@/lib/validators';
import { exportReportToExcel } from '@/lib/excel-export';
import { calculateCmaAnalytics } from '@/lib/cma-calculator';
import { FileText, Link as LinkIcon, RefreshCw, Sparkles, CheckCircle2, Save, FileSpreadsheet, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NewCmaPage() {
  const [targetPropertyUrl, setTargetPropertyUrl] = useState('');
  const [isFetchingTarget, setIsFetchingTarget] = useState(false);
  const [targetProperty, setTargetProperty] = useState<Property>(EMPTY_TARGET_PROPERTY);
  const [competitors, setCompetitors] = useState<Property[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [searchParamsDescription, setSearchParamsDescription] = useState<string>('');

  // Aggregators & Conclusions State
  const [aggregatorEstimates, setAggregatorEstimates] = useState<AggregatorEstimate[]>([
    { id: 'avito', name: 'Авито Оценка', estimate: 0, minEstimate: 0, maxEstimate: 0, url: '' },
    { id: 'cian', name: 'ЦИАН Оценка', estimate: 0, minEstimate: 0, maxEstimate: 0, url: '' },
    { id: 'yandex', name: 'Яндекс Недвижимость', estimate: 0, minEstimate: 0, maxEstimate: 0, url: '' },
    { id: 'domclick', name: 'Домклик', estimate: 0, minEstimate: 0, maxEstimate: 0, url: '' },
  ]);
  const [conclusions, setConclusions] = useState<string[]>(DEFAULT_CONCLUSIONS);

  // Default parameters text for competitor selection
  const defaultParamsDesc = `В районе ${competitors.filter((c) => c.price > 0).length || 9} объектов с параметрами:
1. ${targetProperty.rooms}-к квартира: ${targetProperty.area} м²
2. Материал постройки: ${targetProperty.buildingMaterial || 'панельные'}
3. Локация: ${targetProperty.address || 'г. Санкт-Петербург'}
4. Этаж: ${targetProperty.floor > 1 ? 'Не первый' : '1 этаж'}
5. Год постройки: от ${targetProperty.yearBuilt ? (targetProperty.yearBuilt > 1970 ? 1970 : targetProperty.yearBuilt) : 1970} года`;

  // Helper to load sample demo data on demand
  const handleLoadDemo = () => {
    setTargetPropertyUrl(DEMO_TARGET_PROPERTY.url);
    setTargetProperty(DEMO_TARGET_PROPERTY);
    setCompetitors(INITIAL_COMPETITORS);
    setAggregatorEstimates([
      { id: 'avito', name: 'Авито Оценка', estimate: 7900000, minEstimate: 7600000, maxEstimate: 8200000, url: '' },
      { id: 'cian', name: 'ЦИАН Оценка', estimate: 8050000, minEstimate: 7800000, maxEstimate: 8300000, url: '' },
      { id: 'yandex', name: 'Яндекс Недвижимость', estimate: 7800000, minEstimate: 7500000, maxEstimate: 8100000, url: '' },
      { id: 'domclick', name: 'Домклик', estimate: 7950000, minEstimate: 7700000, maxEstimate: 8200000, url: '' },
    ]);
    setToastMessage('Загружен демо-пример (Мосфильмовская 88)');
    setTimeout(() => setToastMessage(null), 3000);
  };
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER);

  useEffect(() => {
    const loaded = getStoredProfile();
    if (loaded) setUserProfile(loaded);
  }, []);

  // Math Adjustments State (ТЗ 2.3 - 6 категорий таблицы Хасанова)
  const [adjustments, setAdjustments] = useState<CmaAdjustments>({
    floorAdjustment: 0,
    renovationAdjustment: 0,
    competitorsAdjustment: 0,
    balconyAdjustment: 0,
    demandAdjustment: 0,
    legalAdjustment: 0,
  });

  // Calculate analytics strictly using standard spreadsheet formulas
  const analytics = calculateCmaAnalytics(targetProperty, competitors, adjustments);
  const recommendedPrice = analytics.adjustedMidPrice;
  const avgPriceSqm = analytics.adjustedMidSqm;

  // Save Report Handler
  const handleSaveToHistory = () => {
    const reportId = generateReportId();
    const reportToSave: Report = {
      id: reportId,
      title: `${targetProperty.rooms}-к квартира, ${targetProperty.area} м²`,
      address: targetProperty.address,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      author: userProfile.name,
      property: targetProperty,
      competitors: competitors,
      recommendedPrice: recommendedPrice,
      minPrice: analytics.adjustedLowPrice,
      maxPrice: analytics.adjustedHighPrice,
      avgPricePerSqm: avgPriceSqm,
      adjustments: adjustments,
      searchParamsDescription: searchParamsDescription || defaultParamsDesc,
      aggregatorEstimates: aggregatorEstimates,
      conclusions: conclusions,
    };

    saveReport(reportToSave);
    setToastMessage(`Отчёт сохранён с ID #${reportId}! Доступен в Истории.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleExportExcelCurrent = () => {
    const reportToExport: Report = {
      id: `rep-temp`,
      title: `${targetProperty.rooms}-к квартира, ${targetProperty.area} м²`,
      address: targetProperty.address,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      author: userProfile.name || 'Пользователь СМА',
      property: targetProperty,
      competitors: competitors,
      recommendedPrice: recommendedPrice,
      adjustments: adjustments,
      searchParamsDescription: searchParamsDescription || defaultParamsDesc,
    };
    exportReportToExcel(reportToExport);
  };

  // Fetch Target property real parser handler
  const handleFetchTargetData = async () => {
    const validation = validateRealEstateUrl(targetPropertyUrl);
    if (!validation.isValid) {
      setToastMessage(`⚠️ ${validation.error}`);
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    setIsFetchingTarget(true);

    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetPropertyUrl }),
      });
      const result = await res.json();

      if (result.success && result.data) {
        setTargetProperty((prev) => ({
          ...prev,
          ...result.data,
          id: prev.id,
          url: targetPropertyUrl,
        }));
        const methodBadge = result.method === 'cheerio' ? 'Быстрый парсер' : 'Playwright';
        setToastMessage(`✅ Данные объекта оценки загружены (${methodBadge})!`);
      } else {
        setToastMessage(`⚠️ Ошибка парсинга: ${result.error || 'Не удалось спарсить страницу'}`);
      }
    } catch (e: any) {
      setToastMessage('❌ Ошибка связи с сервером парсинга');
    } finally {
      setIsFetchingTarget(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Competitor Actions
  const handleAddCompetitor = () => {
    if (competitors.length >= 20) return;
    const newComp: Property = {
      id: `comp-${Date.now()}`,
      url: '',
      photo: '',
      address: '',
      price: 0,
      area: 0,
      pricePerSqm: 0,
      rooms: 1,
      floor: 1,
      totalFloors: 1,
      buildingMaterial: '',
      buildingType: '',
      yearBuilt: 2022,
      renovation: 'Косметический',
    };

    setCompetitors((prev) => [...prev, newComp]);
  };

  // Add competitor with already-parsed data (for quick add and batch add)
  const handleAddCompetitorWithData = (data: Property) => {
    if (competitors.length >= 20) return;
    setCompetitors((prev) => [...prev, data]);
  };

  const handleUpdateCompetitor = (index: number, updated: Property) => {
    setCompetitors((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  const handleRemoveCompetitor = (index: number) => {
    setCompetitors((prev) => prev.filter((_, i) => i !== index));
    setToastMessage('Конкурент удален из анализа');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div>
      <PageHeader
        title="Новый СМА"
        subtitle="Создание сравнительного анализа рынка объектов недвижимости"
      >
        <button
          onClick={handleSaveToHistory}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <Save className="w-4 h-4" /> Сохранить отчёт в историю
        </button>

        <button
          onClick={handleExportExcelCurrent}
          title="Экспорт в Excel"
          className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3 py-2.5 rounded-xl transition-all"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel
        </button>
      </PageHeader>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* PDF Commercial Report Preview Modal */}
      <PdfReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        targetProperty={targetProperty}
        competitors={competitors}
        adjustments={adjustments}
        user={userProfile}
        searchParamsDescription={searchParamsDescription || defaultParamsDesc}
        onUpdateSearchParamsDescription={setSearchParamsDescription}
        aggregatorEstimates={aggregatorEstimates}
        conclusions={conclusions}
      />

      <div className="px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto space-y-8">
        <div className="border-b border-slate-200/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Создать новый сравнительный анализ рынка
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Введите ссылку на исследуемый объект, настройте поправки и получите точный расчет стоимости
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadDemo}
              className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs px-3.5 py-2 rounded-xl border border-indigo-200 transition-all shrink-0"
            >
              <PlayCircle className="w-3.5 h-3.5 text-indigo-600" /> Демо-пример
            </button>
            <button
              onClick={() => {
                setTargetPropertyUrl('');
                setTargetProperty(EMPTY_TARGET_PROPERTY);
                setCompetitors([]);
                setToastMessage('Форма очищена');
                setTimeout(() => setToastMessage(null), 2000);
              }}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-xl border border-slate-200 transition-all shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Очистить форму
            </button>
          </div>
        </div>

        {/* 2 Column Layout: Main Content + Sticky Analytics Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Left Form Area */}
          <div className="lg:col-span-8 space-y-8">
            {/* Card #1: Target Property URL Input */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.05)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Ссылка на объект оценки
                </h3>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200/60">
                  Avito / ЦИАН
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={targetPropertyUrl}
                    onChange={(e) => setTargetPropertyUrl(e.target.value)}
                    placeholder="Вставьте ссылку на объявление с Avito или ЦИАН..."
                    className="w-full text-sm pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium text-slate-900"
                  />
                </div>

                <button
                  onClick={handleFetchTargetData}
                  disabled={isFetchingTarget || !targetPropertyUrl.trim()}
                  className={cn(
                    'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all duration-200 shrink-0',
                    isFetchingTarget
                      ? 'bg-blue-400 cursor-wait'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 active:scale-95'
                  )}
                >
                  <RefreshCw className={cn('w-4 h-4', isFetchingTarget && 'animate-spin')} />
                  {isFetchingTarget ? 'Загрузка...' : 'Получить данные'}
                </button>
              </div>
            </div>

            {/* Editable Target Property Details */}
            <PropertyCard
              property={targetProperty}
              onChange={setTargetProperty}
            />

            {/* Adjustments Matrix (Математика СМА ТЗ 2.3) */}
            <AdjustmentsMatrix
              adjustments={adjustments}
              onChange={setAdjustments}
            />

            {/* Editable Search Parameters Description (Для отчёта PDF) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.05)] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-600" />
                    Параметры выборки аналогов (для отчёта PDF)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Редактируемый блок «В районе X объектов с параметрами: ...» для страницы анализа конкурентов
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchParamsDescription(defaultParamsDesc)}
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition-all cursor-pointer"
                >
                  Автозаполнение
                </button>
              </div>

              <textarea
                rows={5}
                value={searchParamsDescription || defaultParamsDesc}
                onChange={(e) => setSearchParamsDescription(e.target.value)}
                placeholder="Укажите критерии выборки аналогов..."
                className="w-full text-xs p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all font-mono leading-relaxed text-slate-800"
              />
            </div>

            {/* Competitors Section */}
            <CompetitorsSection
              competitors={competitors}
              onAddCompetitor={handleAddCompetitor}
              onAddCompetitorWithData={handleAddCompetitorWithData}
              onUpdateCompetitor={handleUpdateCompetitor}
              onRemoveCompetitor={handleRemoveCompetitor}
            />

            {/* Aggregator Estimates Manual Input Section */}
            <AggregatorEstimatesSection
              estimates={aggregatorEstimates}
              onChange={setAggregatorEstimates}
            />

            {/* Editable Conclusions & Recommendations Section */}
            <ConclusionsSection
              conclusions={conclusions}
              onChange={setConclusions}
            />
          </div>

          {/* Right Sticky Analytics Panel */}
          <div className="lg:col-span-4">
            <AnalyticsPanel
              targetProperty={targetProperty}
              competitors={competitors}
              adjustments={adjustments}
              onOpenPdfModal={() => setIsPdfModalOpen(true)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
