'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { RecentReports } from '@/components/dashboard/recent-reports';
import { getStoredReports, calculateDashboardStats } from '@/lib/reports-store';
import { Report, DashboardStats } from '@/types';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { FileText, Building2, TrendingUp, Calendar, Sparkles, Plus } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    totalProperties: 0,
    averagePrice: 0,
    lastAnalysisDate: '',
  });

  useEffect(() => {
    const loaded = getStoredReports();
    setReports(loaded);
    setStats(calculateDashboardStats(loaded));
    setLoading(false);
  }, []);

  return (
    <div>
      <PageHeader
        title="Обзор аналитики"
        subtitle="Сравнительный анализ рынка недвижимости (СМА)"
        showNewReportButton
      />

      <div className="px-4 md:px-8 py-6 md:py-8 space-y-8 max-w-7xl mx-auto">
        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-6 lg:p-8 text-white shadow-xl shadow-blue-600/15 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span>Интеллектуальная система СМА</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              Добро пожаловать в CMA Expert!
            </h2>
            <p className="text-sm text-blue-100/90 leading-relaxed">
              Автоматически собирайте аналоги с Avito и ЦИАН, формируйте точно рассчитанные отчеты и экспортируйте коммерческие PDF в 1 клик.
            </p>
          </div>

          <div className="relative z-10 shrink-0">
            <Link
              href="/new-cma"
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-black/10 hover:bg-blue-50 active:scale-95 transition-all duration-200"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Создать новый СМА
            </Link>
          </div>

          {/* Decorative background light effect */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Statistics Grid */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Ключевые показатели
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
              ))
            ) : (
              <>
                <StatCard
                  title="Количество отчетов"
                  value={stats.totalReports}
                  change="+14% за месяц"
                  isPositive
                  icon={FileText}
                  description="Сформировано за весь период"
                />

                <StatCard
                  title="Количество объектов"
                  value={stats.totalProperties}
                  change="+32 объекта"
                  isPositive
                  icon={Building2}
                  description="В базе конкурентов"
                />

                <StatCard
                  title="Средняя цена объектов"
                  value={formatCurrency(stats.averagePrice)}
                  change="+2.4%"
                  isPositive
                  icon={TrendingUp}
                  description="По исследованным рынкам"
                />

                <StatCard
                  title="Последний анализ"
                  value={formatDate(stats.lastAnalysisDate)}
                  icon={Calendar}
                  description="Свежий отчет"
                />
              </>
            )}
          </div>
        </div>

        {/* Recent Reports List */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-6 w-48 bg-slate-100 rounded-lg animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <RecentReports reports={reports} />
        )}
      </div>
    </div>
  );
}
