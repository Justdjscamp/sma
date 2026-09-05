'use client';

import Link from 'next/link';
import { Report } from '@/types';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Calendar, MapPin, ArrowUpRight, CheckCircle2, Clock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecentReportsProps {
  reports: Report[];
}

export function RecentReports({ reports }: RecentReportsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Последние отчеты СМА
          </h2>
          <p className="text-xs text-slate-500">
            Быстрый доступ к недавним анализами рынка
          </p>
        </div>
        <Link
          href="/history"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
        >
          Смотреть все ({reports.length})
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.slice(0, 5).map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
                      {report.title}
                    </h3>
                    <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-[220px]">{report.address}</span>
                    </div>
                  </div>
                </div>

                <StatusBadge status={report.status} />
              </div>

              <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">Рекомендуемая цена</span>
                  <p className="text-sm font-bold text-emerald-600 mt-0.5">
                    {formatCurrency(report.recommendedPrice)}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">Конкурентов</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">
                    {report.competitors.length} объектов
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(report.date)}</span>
              </div>

              <Link
                href="/new-cma"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                Открыть
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Report['status'] }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
        <CheckCircle2 className="w-3 h-3" />
        Готов
      </span>
    );
  }
  if (status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
        <Clock className="w-3 h-3 animate-spin" />
        В обработке
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
      Черновик
    </span>
  );
}
