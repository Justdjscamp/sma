'use client';

import { useState, useEffect } from 'react';
import { Report } from '@/types';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { getStoredReports, deleteReportFromStore } from '@/lib/reports-store';
import { exportReportToExcel, exportAllReportsToExcel } from '@/lib/excel-export';
import { ReportDetailModal } from './report-detail-modal';
import Link from 'next/link';
import { Search, Filter, FileText, Download, Trash2, ExternalLink, MapPin, CheckCircle2, FileSpreadsheet, Copy, Eye } from 'lucide-react';

interface ReportsTableProps {
  initialReports: Report[];
}

export function ReportsTable({ initialReports }: ReportsTableProps) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'draft'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    const loaded = getStoredReports();
    if (loaded) {
      setReports(loaded);
    }
  }, []);

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.author.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id: string, title: string) => {
    const updated = deleteReportFromStore(id);
    setReports(updated);
    setToastMessage(`Отчет "${title}" удален`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyLink = (id: string) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/cma/${id}`;
      navigator.clipboard.writeText(url);
      setToastMessage(`Ссылка на отчёт #${id} скопирована!`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast message popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Quick View Modal */}
      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />

      {/* Top Search & Filter toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по ID, названию, адресу или автору..."
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Статус:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Все статусы</option>
            <option value="completed">Готовы</option>
            <option value="draft">Черновики</option>
          </select>

          <button
            onClick={() => exportAllReportsToExcel(reports)}
            className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs px-3 py-2 rounded-xl border border-emerald-200 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Экспорт реестра в Excel
          </button>
        </div>
      </div>

      {/* Modern Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">ID Отчёта</th>
                <th className="py-3.5 px-4">Дата</th>
                <th className="py-3.5 px-6">Название / Адрес</th>
                <th className="py-3.5 px-4">Автор</th>
                <th className="py-3.5 px-4">Реком. цена</th>
                <th className="py-3.5 px-4">Статус</th>
                <th className="py-3.5 px-6 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">Ничего не найдено</p>
                    <p className="text-xs text-slate-400 mt-0.5">Попробуйте изменить параметры поиска или фильтра</p>
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-4 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-[11px] border border-blue-200/60">
                        #{report.id}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-slate-500 font-medium whitespace-nowrap">
                      {formatDate(report.date)}
                    </td>

                    <td className="py-4 px-6 max-w-xs">
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {report.title}
                      </div>
                      <div className="text-slate-400 text-[11px] truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{report.address}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-600 font-medium whitespace-nowrap">
                      {report.author}
                    </td>

                    <td className="py-4 px-4 font-bold text-emerald-600 whitespace-nowrap">
                      {formatCurrency(report.recommendedPrice)}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      {report.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Готов
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          Черновик
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedReport(report)}
                          title="Быстрый просмотр"
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          href={`/cma/${report.id}`}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors inline-flex items-center gap-1 shadow-sm"
                        >
                          Открыть <ExternalLink className="w-3 h-3" />
                        </Link>

                        <button
                          onClick={() => handleCopyLink(report.id)}
                          title="Скопировать прямую ссылку"
                          className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-slate-600 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => exportReportToExcel(report)}
                          title="Скачать Excel (.xlsx)"
                          className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center text-slate-600 transition-colors"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(report.id, report.title)}
                          title="Удалить"
                          className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center text-slate-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
