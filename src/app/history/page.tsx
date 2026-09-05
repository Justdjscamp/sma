import { PageHeader } from '@/components/layout/page-header';
import { ReportsTable } from '@/components/history/reports-table';

export default function HistoryPage() {
  return (
    <div>
      <PageHeader
        title="История отчетов"
        subtitle="Архив и база всех сформированных сравнительных анализов рынка"
        showNewReportButton
      />

      <div className="px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto space-y-6">
        <ReportsTable initialReports={[]} />
      </div>
    </div>
  );
}
