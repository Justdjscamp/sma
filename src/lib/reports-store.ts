import { Report, DashboardStats } from '@/types';
import { INITIAL_REPORTS } from './mock-data';

const STORAGE_KEY = 'cma_expert_reports';

export function getStoredReports(): Report[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    const parsed = JSON.parse(data);
    // Фильтрация устаревших моковых отчетов при необходимости
    if (Array.isArray(parsed)) {
      const cleanReports = parsed.filter(
        (r) => !['cma-604488', 'cma-604489', 'cma-604490', 'cma-604491', 'cma-604492'].includes(r.id)
      );
      if (cleanReports.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanReports));
      }
      return cleanReports;
    }
    return [];
  } catch (e) {
    console.error('Failed to load reports from localStorage', e);
    return [];
  }
}

export function saveReport(newReport: Report): Report[] {
  if (typeof window === 'undefined') return INITIAL_REPORTS;
  try {
    const current = getStoredReports();
    // Prepend new report
    const updated = [newReport, ...current.filter((r) => r.id !== newReport.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save report to localStorage', e);
    return INITIAL_REPORTS;
  }
}

export function deleteReportFromStore(id: string): Report[] {
  if (typeof window === 'undefined') return INITIAL_REPORTS;
  try {
    const current = getStoredReports();
    const updated = current.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete report from localStorage', e);
    return INITIAL_REPORTS;
  }
}

export function getReportById(id: string): Report | undefined {
  const reports = getStoredReports();
  return reports.find((r) => r.id.toLowerCase() === id.toLowerCase());
}

export function generateReportId(): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `cma-${randomNum}`;
}

export function calculateDashboardStats(reports: Report[]): DashboardStats {
  const totalReports = reports.length;
  const totalProperties = reports.reduce(
    (acc, r) => acc + 1 + (r.competitors ? r.competitors.length : 0),
    0
  );

  const prices = reports.map((r) => r.recommendedPrice || r.property.price).filter((p) => p > 0);
  const averagePrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
  const lastAnalysisDate = reports.length > 0 ? reports[0].date : new Date().toISOString().split('T')[0];

  return {
    totalReports,
    totalProperties,
    averagePrice,
    lastAnalysisDate,
  };
}

