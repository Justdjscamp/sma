'use client';

import { Report } from '@/types';
import { formatCurrency, formatNumber, formatDate } from '@/lib/formatters';
import { exportReportToExcel } from '@/lib/excel-export';
import Link from 'next/link';
import { X, Printer, FileSpreadsheet, MapPin, Building2, Calendar, CheckCircle2, User, Home, Maximize2, DollarSign, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PdfReportModal } from '@/components/new-cma/pdf-report-modal';
import { getStoredProfile } from '@/lib/user-store';
import { UserProfile } from '@/types';

interface ReportDetailModalProps {
  report: Report | null;
  onClose: () => void;
}

export function ReportDetailModal({ report, onClose }: ReportDetailModalProps) {
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const profile = getStoredProfile();
    if (profile) setUserProfile(profile);
  }, []);

  if (!report) return null;

  const target = report.property;
  const competitors = report.competitors || [];
  const count = competitors.length;

  const adjustments = report.adjustments || {
    floorAdjustment: 0,
    renovationAdjustment: 5,
    balconyAdjustment: 0,
    demandAdjustment: 0,
    legalAdjustment: 0,
  };

  const handleExportExcel = () => {
    exportReportToExcel(report);
  };

  return (
    <>
      <PdfReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        targetProperty={target}
        competitors={competitors}
        adjustments={adjustments}
        user={userProfile || {
          name: report.author || 'Пользователь СМА',
          phone: '',
          email: '',
          company: 'Агентство Недвижимости',
          position: 'Аналитик СМА',
          photo: '',
          companyLogo: '',
        }}
      />

      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-8 border border-slate-200 animate-in fade-in zoom-in-95">
          {/* Header Bar */}
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              <span className="font-bold text-sm">Детали отчета СМА</span>
              <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono">
                #{report.id}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/cma/${report.id}`}
                onClick={onClose}
                className="text-xs font-medium text-blue-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
              >
                Открыть на отдельной странице <ExternalLink className="w-3 h-3" />
              </Link>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Title & Metadata */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {report.status === 'completed' ? 'Готовый анализ' : 'Черновик'}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{report.title}</h2>
                <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{report.address}</span>
                </div>
              </div>

              <div className="text-right text-xs text-slate-500 space-y-1 border-t sm:border-t-0 pt-2 sm:pt-0">
                <div className="flex items-center gap-1 sm:justify-end">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(report.date)}</span>
                </div>
                <div className="flex items-center gap-1 sm:justify-end">
                  <User className="w-3.5 h-3.5" />
                  <span>{report.author}</span>
                </div>
              </div>
            </div>

            {/* Price highlight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl text-white">
              <div>
                <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">
                  Рекомендуемая стоимость
                </span>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {formatCurrency(report.recommendedPrice)}
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  По {count} спарсенным конкурентам
                </p>
              </div>

              <div className="sm:text-right border-t sm:border-t-0 border-slate-700 pt-3 sm:pt-0">
                <span className="text-xs text-slate-400 font-medium block">Цена целевого объекта</span>
                <div className="text-lg font-bold text-white mt-1">
                  {formatCurrency(target.price)}
                </div>
                <p className="text-[11px] text-blue-300 mt-1">
                  {formatNumber(target.pricePerSqm)} ₽/м² ({target.area} м²)
                </p>
              </div>
            </div>

            {/* Property Specs */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Характеристики исследуемого объекта
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block">Комнат</span>
                  <strong className="text-slate-800 text-sm font-bold block mt-0.5">{target.rooms}-комн</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block">Этаж</span>
                  <strong className="text-slate-800 text-sm font-bold block mt-0.5">{target.floor} / {target.totalFloors}</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block">Дом / Год</span>
                  <strong className="text-slate-800 text-xs font-bold block mt-0.5 truncate">{target.buildingMaterial} ({target.yearBuilt})</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block">Ремонт</span>
                  <strong className="text-slate-800 text-xs font-bold block mt-0.5">{target.renovation || 'Дизайнерский'}</strong>
                </div>
              </div>
            </div>

            {/* Competitors List */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Найденные аналоги ({count})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2">
                {competitors.length === 0 ? (
                  <p className="text-xs text-slate-400 p-3 text-center">Нет конкурентов</p>
                ) : (
                  competitors.map((c, i) => (
                    <div key={c.id || i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                          #{i + 1}
                        </span>
                        <span className="font-semibold text-slate-800 truncate max-w-xs">{c.address}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-900">{formatCurrency(c.price)}</span>
                        <span className="text-[10px] text-blue-600 font-semibold block">{formatNumber(c.pricePerSqm)} ₽/м²</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleExportExcel}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" /> Скачать в Excel (.xlsx)
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setIsPdfModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all"
              >
                <Printer className="w-4 h-4" /> Предпросмотр и печать PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
