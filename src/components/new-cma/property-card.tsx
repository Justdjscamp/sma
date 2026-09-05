'use client';

import { Property } from '@/types';
import { formatNumber } from '@/lib/formatters';
import { MapPin, DollarSign, Maximize2, ImageIcon, Eye, Paintbrush, Home } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onChange: (updatedProperty: Property) => void;
}

export function PropertyCard({ property, onChange }: PropertyCardProps) {
  const handleChange = (field: keyof Property, value: any) => {
    const updated = { ...property, [field]: value };
    
    // Auto-recalculate price per sqm if price or area changes
    if (field === 'price' || field === 'area') {
      const numPrice = field === 'price' ? Number(value) : property.price;
      const numArea = field === 'area' ? Number(value) : property.area;
      if (numArea > 0) {
        updated.pricePerSqm = Math.round(numPrice / numArea);
      }
    }
    
    onChange(updated);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.05)] space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
          </span>
          <h3 className="font-bold text-slate-900 text-base">Объект оценки</h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
          Заполнить автоматически
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Photo preview & URL edit */}
        <div className="space-y-3">
          <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 h-56 flex items-center justify-center">
            {property.photo ? (
              <img
                src={property.photo}
                alt="Объект оценки"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="text-center text-slate-400">
                <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                <span className="text-xs">Нет фото</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-medium bg-black/60 px-3 py-1.5 rounded-lg backdrop-blur-md">
                Нажмите для смены фото
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Ссылка на фото (URL)</label>
            <input
              type="text"
              value={property.photo || ''}
              onChange={(e) => handleChange('photo', e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              placeholder="https://..."
            />
          </div>

          {/* Views counters */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <Eye className="w-3.5 h-3.5 text-slate-400" /> Просмотры:
            </span>
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <span>{property.viewsTotal || 1420} всего</span>
              <span className="text-slate-300">•</span>
              <span className="text-blue-600">+{property.viewsToday || 48} сегодня</span>
            </div>
          </div>
        </div>

        {/* Form fields grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="sm:col-span-2 md:col-span-3">
            <label className="text-xs font-medium text-slate-600 mb-1 block flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> Адрес объекта
            </label>
            <input
              type="text"
              value={property.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-900"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Цена объекта (₽)
            </label>
            <input
              type="number"
              value={property.price}
              onChange={(e) => handleChange('price', Number(e.target.value))}
              className="w-full text-sm font-bold text-blue-600 px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5 text-slate-400" /> Площадь (м²)
            </label>
            <input
              type="number"
              step="0.1"
              value={property.area}
              onChange={(e) => handleChange('area', Number(e.target.value))}
              className="w-full text-sm font-semibold px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Цена за м² (₽)
            </label>
            <div className="w-full text-sm font-bold text-slate-700 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 flex items-center">
              {formatNumber(property.pricePerSqm)} ₽
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Комнат</label>
            <input
              type="number"
              value={property.rooms}
              onChange={(e) => handleChange('rooms', Number(e.target.value))}
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Этаж</label>
            <input
              type="number"
              value={property.floor}
              onChange={(e) => handleChange('floor', Number(e.target.value))}
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Этажность дома</label>
            <input
              type="number"
              value={property.totalFloors}
              onChange={(e) => handleChange('totalFloors', Number(e.target.value))}
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block flex items-center gap-1">
              <Paintbrush className="w-3.5 h-3.5 text-slate-400" /> Состояние ремонта
            </label>
            <select
              value={property.renovation || 'Дизайнерский'}
              onChange={(e) => handleChange('renovation', e.target.value)}
              className="w-full text-sm font-medium px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="Дизайнерский">Дизайнерский</option>
              <option value="Евро">Евроремонт</option>
              <option value="Косметический">Косметический</option>
              <option value="Без ремонта">Без ремонта ("Убитая")</option>
              <option value="Флиппинг">Флиппинг (под ключ)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-slate-400" /> Балкон / Лоджия
            </label>
            <select
              value={property.hasBalcony ? 'yes' : 'no'}
              onChange={(e) => handleChange('hasBalcony', e.target.value === 'yes')}
              className="w-full text-sm font-medium px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="yes">Есть балкон / лоджия</option>
              <option value="no">Отсутствует</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Материал дома</label>
            <input
              type="text"
              value={property.buildingMaterial}
              onChange={(e) => handleChange('buildingMaterial', e.target.value)}
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Тип дома</label>
            <input
              type="text"
              value={property.buildingType}
              onChange={(e) => handleChange('buildingType', e.target.value)}
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Год постройки</label>
            <input
              type="number"
              value={property.yearBuilt}
              onChange={(e) => handleChange('yearBuilt', Number(e.target.value))}
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
