import { PageHeader } from '@/components/layout/page-header';
import { SettingsTabs } from '@/components/settings/settings-tabs';

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Настройки системы"
        subtitle="Параметры безопасности, уведомлений и приложения"
      />

      <div className="px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto space-y-6">
        <SettingsTabs />
      </div>
    </div>
  );
}
