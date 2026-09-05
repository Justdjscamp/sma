'use client';

import { useEffect, useState } from 'react';
import { UserProfile } from '@/types';
import { getStoredProfile, saveProfile } from '@/lib/user-store';
import { updateActiveUserProfile } from '@/lib/auth-store';
import { User, Mail, Phone, Building2, Briefcase, Camera, CheckCircle2, Save } from 'lucide-react';

interface ProfileFormProps {
  initialProfile: UserProfile;
}

export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const loaded = getStoredProfile();
    if (loaded) {
      setProfile(loaded);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfile(profile);
    updateActiveUserProfile(profile);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Toast Feedback */}
      {isSaved && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Профиль успешно сохранен!</span>
        </div>
      )}

      {/* Profile Header Avatar Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group">
          <img
            src={profile.photo}
            alt={profile.name}
            className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-200 shadow-md"
          />
          <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="text-center sm:text-left flex-1">
          <h3 className="text-xl font-bold text-slate-900">{profile.name}</h3>
          <p className="text-xs font-semibold text-blue-600 mt-0.5">{profile.position}</p>
          <p className="text-xs text-slate-500 mt-1">{profile.company}</p>
        </div>

        <div className="flex flex-col items-center sm:items-end gap-2 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6">
          <span className="text-[11px] font-medium text-slate-400">Логотип компании</span>
          <img
            src={profile.companyLogo}
            alt="Company Logo"
            className="w-20 h-10 object-cover rounded-lg border border-slate-200"
          />
        </div>
      </div>

      {/* Details Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
          Персональные и рабочие данные
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" /> ФИО пользователя
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> Электронная почта (Email)
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> Телефон
            </label>
            <input
              type="text"
              value={profile.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" /> Название компании
            </label>
            <input
              type="text"
              value={profile.company}
              onChange={(e) => handleChange('company', e.target.value)}
              className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Должность
            </label>
            <input
              type="text"
              value={profile.position}
              onChange={(e) => handleChange('position', e.target.value)}
              className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" /> Адрес компании
            </label>
            <input
              type="text"
              value={profile.companyAddress || ''}
              onChange={(e) => handleChange('companyAddress', e.target.value)}
              placeholder="г. Санкт-Петербург, Щербаков пер. д.17/3"
              className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">
              Сайт компании (URL)
            </label>
            <input
              type="text"
              value={profile.companyWebsite || ''}
              onChange={(e) => handleChange('companyWebsite', e.target.value)}
              placeholder="trendproperty.ru"
              className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">
              Telegram (Ник / ссылка)
            </label>
            <input
              type="text"
              value={profile.telegram || ''}
              onChange={(e) => handleChange('telegram', e.target.value)}
              placeholder="t.me/Khasanov_Pavel"
              className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">
              URL фотографии профиля
            </label>
            <input
              type="text"
              value={profile.photo}
              onChange={(e) => handleChange('photo', e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-sm shadow-blue-500/20 active:scale-95 transition-all duration-150"
          >
            <Save className="w-4 h-4" /> Сохранить изменения
          </button>
        </div>
      </div>
    </form>
  );
}
