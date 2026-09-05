import { Property, Report, UserProfile, DashboardStats } from '@/types';

export const INITIAL_USER: UserProfile = {
  name: 'Хасанов Павел',
  phone: '+7 (921) 781-89-12',
  email: 'khasanov.pavel.trend@gmail.com',
  company: 'Тренд Недвижимость',
  companyAddress: 'г. Санкт-Петербург, Щербаков пер. д.17/3, БЦ «Премьер», 3 этаж',
  companyWebsite: 'trendproperty.ru',
  telegram: 't.me/Khasanov_Pavel',
  position: 'Специалист по недвижимости',
  photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
  companyLogo: '',
};

export const INITIAL_STATS: DashboardStats = {
  totalReports: 0,
  totalProperties: 0,
  averagePrice: 0,
  lastAnalysisDate: '-',
};

export const EMPTY_TARGET_PROPERTY: Property = {
  id: 'target-new',
  url: '',
  photo: '',
  address: '',
  price: 0,
  area: 0,
  pricePerSqm: 0,
  rooms: 1,
  floor: 1,
  totalFloors: 1,
  buildingMaterial: 'Монолит',
  buildingType: 'Вторичка',
  yearBuilt: new Date().getFullYear(),
  renovation: 'Косметический',
  source: 'avito',
};

export const DEMO_TARGET_PROPERTY: Property = EMPTY_TARGET_PROPERTY;

export const INITIAL_COMPETITORS: Property[] = [];

export const INITIAL_REPORTS: Report[] = [];

