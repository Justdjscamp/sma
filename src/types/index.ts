export interface Property {
  id: string;
  url: string;
  photo: string;
  address: string;
  price: number;
  area: number; // in sq m
  pricePerSqm: number; // rub / sq m
  rooms: number;
  floor: number;
  totalFloors: number;
  buildingMaterial: string; // e.g. 'Монолит-кирпич', 'Панельный', 'Кирпичный'
  buildingType: string; // e.g. 'Новостройка', 'Вторичка'
  yearBuilt: number;
  renovation?: string; // e.g. 'Дизайнерский', 'Евро', 'Косметический', 'Без ремонта'
  viewsTotal?: number; // Всего просмотров
  viewsToday?: number; // Просмотров сегодня
  hasBalcony?: boolean;
  description?: string;
  source?: 'avito' | 'cian';
}

export interface CmaAdjustments {
  floorAdjustment: number; // e.g. -10, -3, 0, 2
  renovationAdjustment: number; // e.g. -10, -5, 0, 5, 20
  balconyAdjustment: number; // e.g. -3, 0, 2
  demandAdjustment: number; // e.g. -3, 0, 3
  legalAdjustment: number; // e.g. -6, -5, -2, 0
}

export interface AggregatorEstimate {
  id: string;
  name: string; // e.g. 'Авито Оценка', 'ЦИАН Оценка', 'Яндекс Недвижимость', 'Домклик'
  estimate: number;
  minEstimate?: number;
  maxEstimate?: number;
  url?: string;
}

export type ReportStatus = 'completed' | 'draft' | 'in_progress';

export interface Report {
  id: string;
  title: string;
  address: string;
  date: string;
  status: ReportStatus;
  author: string;
  property: Property;
  competitors: Property[];
  recommendedPrice: number;
  minPrice?: number;
  maxPrice?: number;
  avgPricePerSqm?: number;
  adjustments?: CmaAdjustments;
  aggregatorEstimates?: AggregatorEstimate[];
  conclusions?: string[];
}

export type UserRole = 'admin' | 'realtor' | 'analyst';

export interface UserProfile {
  id?: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  companyAddress?: string;
  companyWebsite?: string;
  telegram?: string;
  position: string;
  photo: string;
  companyLogo: string;
  role?: UserRole;
}

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  profile: UserProfile;
  role: UserRole;
  createdAt: string;
}

export interface DashboardStats {
  totalReports: number;
  totalProperties: number;
  averagePrice: number;
  lastAnalysisDate: string;
}
