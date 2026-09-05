import { PageHeader } from '@/components/layout/page-header';
import { ProfileForm } from '@/components/profile/profile-form';
import { INITIAL_USER } from '@/lib/mock-data';

export default function ProfilePage() {
  return (
    <div>
      <PageHeader
        title="Профиль пользователя"
        subtitle="Персональная информация и реквизиты компании для PDF-отчетов"
      />

      <div className="px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto space-y-6">
        <ProfileForm initialProfile={INITIAL_USER} />
      </div>
    </div>
  );
}
