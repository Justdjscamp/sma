'use client';

import { useEffect, useState } from 'react';
import { Sliders, Shield, Bell, Lock, Globe, Moon, CheckCircle2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStoredSettings, saveSettings, SystemSettings } from '@/lib/user-store';

export function SettingsTabs() {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications'>('general');
  const [isSaved, setIsSaved] = useState(false);

  // Settings states
  const [language, setLanguage] = useState('ru');
  const [currency, setCurrency] = useState('RUB');
  const [timezone, setTimezone] = useState('Europe/Moscow');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailNotify, setEmailNotify] = useState(true);
  const [pushNotify, setPushNotify] = useState(true);
  const [smsNotify, setSmsNotify] = useState(false);

  useEffect(() => {
    const loaded = getStoredSettings();
    if (loaded) {
      setLanguage(loaded.language);
      setCurrency(loaded.currency);
      setTimezone(loaded.timezone);
      setEmailNotify(loaded.emailNotify);
      setPushNotify(loaded.pushNotify);
      setSmsNotify(loaded.smsNotify);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings: SystemSettings = {
      language,
      currency,
      timezone,
      emailNotify,
      pushNotify,
      smsNotify,
    };
    saveSettings(updatedSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Toast Feedback */}
      {isSaved && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Настройки успешно сохранены!</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200/60 w-fit">
        <button
          onClick={() => setActiveTab('general')}
          className={cn(
            'flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition-all duration-200',
            activeTab === 'general'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <Sliders className="w-3.5 h-3.5" /> Общие
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={cn(
            'flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition-all duration-200',
            activeTab === 'security'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <Shield className="w-3.5 h-3.5" /> Безопасность
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={cn(
            'flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition-all duration-200',
            activeTab === 'notifications'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <Bell className="w-3.5 h-3.5" /> Уведомления
        </button>
      </div>

      {/* Tab Contents */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        {activeTab === 'general' && (
          <div className="space-y-5">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
              Общие параметры интерфейса
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" /> Язык интерфейса
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="ru">Русский (Russian)</option>
                  <option value="en">English (US)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Основная валюта отчетов
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="RUB">Российский рубль (₽)</option>
                  <option value="USD">Доллар США ($)</option>
                  <option value="EUR">Евро (€)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Часовой пояс
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Europe/Moscow">Москва, Санкт-Петербург (UTC+3)</option>
                  <option value="Asia/Yekaterinburg">Екатеринбург (UTC+5)</option>
                  <option value="Asia/Novosibirsk">Новосибирск (UTC+7)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-5">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              Смена пароля аккаунта
            </h3>

            <div className="space-y-4 max-w-md">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Текущий пароль
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Новый пароль
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Подтверждение нового пароля
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-5">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              Каналы и типы уведомлений
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Email-уведомления</h4>
                  <p className="text-xs text-slate-500">Получать отчеты и аналитику на почту</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotify}
                  onChange={(e) => setEmailNotify(e.target.checked)}
                  className="w-5 h-5 accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Push-уведомления в браузере</h4>
                  <p className="text-xs text-slate-500">Оповещения о готовности СМА отчетов в реальном времени</p>
                </div>
                <input
                  type="checkbox"
                  checked={pushNotify}
                  onChange={(e) => setPushNotify(e.target.checked)}
                  className="w-5 h-5 accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">SMS-информирование</h4>
                  <p className="text-xs text-slate-500">Уведомления о критических изменениях цен на сохраненные объекты</p>
                </div>
                <input
                  type="checkbox"
                  checked={smsNotify}
                  onChange={(e) => setSmsNotify(e.target.checked)}
                  className="w-5 h-5 accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-sm shadow-blue-500/20 active:scale-95 transition-all duration-150"
          >
            <Save className="w-4 h-4" /> Сохранить настройки
          </button>
        </div>
      </form>
    </div>
  );
}
