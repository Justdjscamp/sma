export interface ParsedProperty {
  address: string;
  price: number;
  area: number;
  pricePerSqm: number;
  floor: number;
  totalFloors: number;
  rooms: number;
  renovation?: string;
  buildingMaterial?: string;
  buildingType?: string;
  yearBuilt?: number;
  hasBalcony?: boolean;
  viewsTotal?: number;
  viewsToday?: number;
  photo?: string;
  source: 'avito' | 'cian';
  title?: string;
  description?: string;
}

export interface ParseResult {
  success: boolean;
  data?: ParsedProperty;
  error?: string;
  method?: 'cheerio' | 'playwright' | 'url_extracted';
}

export interface ProxyConfig {
  server: string;
  username?: string;
  password?: string;
}
