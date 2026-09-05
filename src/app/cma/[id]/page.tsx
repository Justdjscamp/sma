'use client';

import { useState, useEffect, use } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { PropertyCard } from '@/components/new-cma/property-card';
import { CompetitorsSection } from '@/components/new-cma/competitors-section';
import { AnalyticsPanel } from '@/components/new-cma/analytics-panel';
import { AdjustmentsMatrix } from '@/components/new-cma/adjustments-matrix';
import { PdfReportModal } from '@/components/new-cma/pdf-report-modal';
import { Report, CmaAdjustments, Property, UserProfile } from '@/types';
import { getReportById } from '@/lib/reports-store';
import { getStoredProfile } from '@/lib/user-store';
import { exportReportToExcel } from '@/lib/excel-export';
import { INITIAL_USER } from '@/lib/mock-data';
import {
  Link as LinkIcon,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Copy,
  ArrowLeft,
  Calendar,
  User,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import Link from 'next/link';

export default function SingleReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const reportId = resolvedParams.id;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER);

  useEffect(() => {
    const loadedUser = getStoredProfile();
    if (loadedUser) setUserProfile(loadedUser);
  }, []);

  // Editable local state when viewing report
  const [targetProperty, setTargetProperty] = useState<Property | null>(null);
  const [competitors, setCompetitors] = useState<Property[]>([]);
  const [adjustments, setAdjustments] = useState<CmaAdjustments>({
    floorAdjustment: 0,
    renovationAdjustment: 5,
    balconyAdjustment: 0,
    demandAdjustment: 0,
    legalAdjustment: 0,
  });

  useEffect(() => {
    if (reportId) {
      const found = getReportById(reportId);
      if (found) {
        setReport(found);
        setTargetProperty(found.property);
        setCompetitors(found.competitors || []);
        if (found.adjustments) {
          setAdjustments(found.adjustments);
        }
      }
    }
    setLoading(false);
  }, [reportId]);

  const handleCopyDirectLink = () => {
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.href;
      navigator.clipboard.writeText(currentUrl);
      setToastMessage('Прямая ссылка на отчёт скопирована в буфер обмена!');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleExportExcel = () => {
    if (report) {
      exportReportToExcel(report);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium">Загрузка отчёта #{reportId}...</p>
      </div>
    );
  }

  if (!report || !targetProperty) {
    return (
      <div>
        <PageHeader title="Отчёт не найден" subtitle={`Заявка № ${reportId}`} />
        <div className="p-12 max-w-xl mx-auto text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Отчёт #{reportId} не найден в системе</h2>
          <p className="text-xs text-slate-500">
            Возможно, отчёт был удалён или указан неверный ID в адресной строке.
          </p>
          <Link
            href="/history"
            className="inline-flex items-center gap-2 text-xs font-semibold bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-md"
          >
            <ArrowLeft className="w-4 h-4" /> Вернуться в историю отчётов
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={`СМА Отчёт: ${report.title}`} subtitle={`Адрес: ${report.address}`}>
        <Link
          href="/history"
          className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3 py-2.5 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> В историю
        </Link>

        <button
          onClick={handleCopyDirectLink}
          className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs px-3.5 py-2.5 rounded-xl border border-blue-200/80 transition-all"
        >
          <Copy className="w-4 h-4 text-blue-600" /> Копировать ссылку
        </button>

        <button
          onClick={handleExportExcel}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <FileSpreadsheet className="w-4 h-4" /> Excel
        </button>
      </PageHeader>

      {/* Toast feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* PDF Modal */}
      <PdfReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        targetProperty={targetProperty}
        competitors={competitors}
        adjustments={adjustments}
        user={userProfile}
        reportId={reportId}
      />

      <div className="px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto space-y-8">
        {/* Direct Link Banner */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700 border border-blue-200">
                № {report.id}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                {report.status === 'completed' ? 'Утверждённый отчёт' : 'Черновик'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">{report.title}</h2>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> {report.date}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" /> {report.author}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyDirectLink}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all"
            >
              <LinkIcon className="w-4 h-4 text-blue-400" />
              Прямая ссылка
            </button>
          </div>
        </div>

        {/* 2 Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <PropertyCard
              property={targetProperty}
              onChange={setTargetProperty}
            />

            <AdjustmentsMatrix
              adjustments={adjustments}
              onChange={setAdjustments}
            />

            <CompetitorsSection
              competitors={competitors}
              onAddCompetitor={() => {}}
              onAddCompetitorWithData={(data) => setCompetitors((prev) => [...prev, data])}
              onUpdateCompetitor={(index, updated) => {
                setCompetitors((prev) => {
                  const next = [...prev];
                  next[index] = updated;
                  return next;
                });
              }}
              onRemoveCompetitor={(index) => {
                setCompetitors((prev) => prev.filter((_, i) => i !== index));
              }}
            />
          </div>

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
