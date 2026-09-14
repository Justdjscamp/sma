import { Property, CmaAdjustments } from '@/types';

export interface CmaCalculationResult {
  activeCount: number;
  topCheapestSqms: Property[];
  topExpensiveSqms: Property[];
  avgCheapSqm: number;
  avgExpensiveSqm: number;
  marketAvgSqm: number;
  allAvgSqm: number;
  
  // Base market prices per sqm (без поправок)
  // В стандарте таблицы Хасанова: F5 = B20 - 7% + 5% = B20 * 0.98 (-2% скидки на торг)
  baseMarketPriceSqm: number;
  baseLowSqm: number; // F6 = F5 * 0.93 (-7% от базового)
  baseHighSqm: number; // F7 = F5 * 1.05 (+5% от базового)
  
  // Base total values (без поправок)
  baseMidPrice: number;
  baseLowPrice: number;
  baseHighPrice: number;
  
  // Adjustments
  totalAdjustmentPercent: number;
  
  // Final Adjusted Prices per sqm (С учетом корректировок)
  // F16 = F5 * (1 + totalAdj/100)
  adjustedMidSqm: number;
  adjustedLowSqm: number;
  adjustedHighSqm: number;
  
  // Final Adjusted Total Property Values (Итоговая стоимость)
  adjustedMidPrice: number;
  adjustedLowPrice: number;
  adjustedHighPrice: number;
  
  // Deviation % of target property owner's price per sqm from market
  // Формула таблицы: 100% - (F5 / B7) = (B7 - F5) / B7
  deviationMidPercent: number;
  deviationLowPercent: number;
  deviationHighPercent: number;
}

export function getTotalAdjustmentPercent(adjustments?: CmaAdjustments): number {
  if (!adjustments) return 0;
  return (
    (adjustments.floorAdjustment || 0) +
    (adjustments.renovationAdjustment || 0) +
    (adjustments.competitorsAdjustment || 0) +
    (adjustments.balconyAdjustment || 0) +
    (adjustments.demandAdjustment || 0) +
    (adjustments.legalAdjustment || 0)
  );
}

export function calculateCmaAnalytics(
  targetProperty: Property,
  competitors: Property[],
  adjustments?: CmaAdjustments
): CmaCalculationResult {
  const activeCompetitors = competitors.filter((c) => c.price > 0 && c.area > 0);
  const activeCount = activeCompetitors.length;

  const totalAdjustmentPercent = getTotalAdjustmentPercent(adjustments);
  const targetArea = targetProperty.area > 0 ? targetProperty.area : 1;
  const targetPricePerSqm =
    targetProperty.pricePerSqm > 0
      ? targetProperty.pricePerSqm
      : targetProperty.price > 0 && targetProperty.area > 0
      ? Math.round(targetProperty.price / targetProperty.area)
      : 0;

  if (activeCount === 0) {
    const fallbackSqm = targetPricePerSqm;
    const baseMid = Math.round(targetArea * fallbackSqm);
    const adjFactor = 1 + totalAdjustmentPercent / 100;
    const adjustedMidSqm = Math.round(fallbackSqm * adjFactor);
    const adjustedMidPrice = Math.round(targetArea * adjustedMidSqm);

    return {
      activeCount: 0,
      topCheapestSqms: [],
      topExpensiveSqms: [],
      avgCheapSqm: fallbackSqm,
      avgExpensiveSqm: fallbackSqm,
      marketAvgSqm: fallbackSqm,
      allAvgSqm: fallbackSqm,
      baseMarketPriceSqm: fallbackSqm,
      baseLowSqm: Math.round(fallbackSqm * 0.93),
      baseHighSqm: Math.round(fallbackSqm * 1.05),
      baseMidPrice: baseMid,
      baseLowPrice: Math.round(baseMid * 0.93),
      baseHighPrice: Math.round(baseMid * 1.05),
      totalAdjustmentPercent,
      adjustedMidSqm,
      adjustedLowSqm: Math.round(fallbackSqm * 0.93 * adjFactor),
      adjustedHighSqm: Math.round(fallbackSqm * 1.05 * adjFactor),
      adjustedMidPrice,
      adjustedLowPrice: Math.round(baseMid * 0.93 * adjFactor),
      adjustedHighPrice: Math.round(baseMid * 1.05 * adjFactor),
      deviationMidPercent: 0,
      deviationLowPercent: 0,
      deviationHighPercent: 0,
    };
  }

  // Calculate competitor price per sqm accurately
  const normalizedCompetitors = activeCompetitors.map((c) => ({
    ...c,
    pricePerSqm: c.pricePerSqm > 0 ? c.pricePerSqm : Math.round(c.price / (c.area || 1)),
  }));

  // Sort by pricePerSqm ascending
  const sortedBySqm = [...normalizedCompetitors].sort((a, b) => a.pricePerSqm - b.pricePerSqm);

  const cheapCount = Math.min(3, sortedBySqm.length);
  const expensiveCount = Math.min(3, sortedBySqm.length);

  const topCheapestSqms = sortedBySqm.slice(0, cheapCount);
  const topExpensiveSqms = sortedBySqm.slice(-expensiveCount).reverse();

  const avgCheapSqm =
    topCheapestSqms.reduce((sum, item) => sum + item.pricePerSqm, 0) / (topCheapestSqms.length || 1);

  const avgExpensiveSqm =
    topExpensiveSqms.reduce((sum, item) => sum + item.pricePerSqm, 0) / (topExpensiveSqms.length || 1);

  // Общее среднее B20 по таблице: (B18 + B19) / 2
  const marketAvgSqm = (avgCheapSqm + avgExpensiveSqm) / 2;

  // Простое среднее всех конкурентов для справки
  const allAvgSqm =
    normalizedCompetitors.reduce((sum, c) => sum + c.pricePerSqm, 0) / normalizedCompetitors.length;

  // Базовая удельная стоимость (F5): B20 - 7% + 5% = B20 * 0.98
  const baseMarketPriceSqm = marketAvgSqm * 0.98;

  // Базовая вилка цен за м²
  const baseLowSqm = baseMarketPriceSqm * 0.93; // F6 = F5 * 0.93
  const baseMidSqm = baseMarketPriceSqm;        // F5
  const baseHighSqm = baseMarketPriceSqm * 1.05; // F7 = F5 * 1.05

  // Базовая полная стоимость
  const baseMidPrice = Math.round(targetArea * baseMidSqm);
  const baseLowPrice = Math.round(targetArea * baseLowSqm);
  const baseHighPrice = Math.round(targetArea * baseHighSqm);

  // Коэффициент корректировки
  const adjFactor = 1 + totalAdjustmentPercent / 100;

  // Итоговые цены за м² с учетом поправок (F16, F17, F18)
  const adjustedMidSqm = Math.round(baseMidSqm * adjFactor);
  const adjustedLowSqm = Math.round(baseLowSqm * adjFactor);
  const adjustedHighSqm = Math.round(baseHighSqm * adjFactor);

  // Итоговая полная стоимость (E16, E17, E18)
  const adjustedMidPrice = Math.round(targetArea * adjustedMidSqm);
  const adjustedLowPrice = Math.round(targetArea * adjustedLowSqm);
  const adjustedHighPrice = Math.round(targetArea * adjustedHighSqm);

  // Процент отклонения цены собственника от рынка:
  // Формула таблицы (ячейки E10, E11, E12): 100% - (F / B7) = (B7 - F) / B7
  let deviationMidPercent = 0;
  let deviationLowPercent = 0;
  let deviationHighPercent = 0;

  if (targetPricePerSqm > 0) {
    deviationMidPercent = ((targetPricePerSqm - baseMidSqm) / targetPricePerSqm) * 100;
    deviationLowPercent = ((targetPricePerSqm - baseLowSqm) / targetPricePerSqm) * 100;
    deviationHighPercent = ((targetPricePerSqm - baseHighSqm) / targetPricePerSqm) * 100;
  }

  return {
    activeCount,
    topCheapestSqms,
    topExpensiveSqms,
    avgCheapSqm: Math.round(avgCheapSqm),
    avgExpensiveSqm: Math.round(avgExpensiveSqm),
    marketAvgSqm: Math.round(marketAvgSqm),
    allAvgSqm: Math.round(allAvgSqm),
    baseMarketPriceSqm: Math.round(baseMarketPriceSqm),
    baseLowSqm: Math.round(baseLowSqm),
    baseHighSqm: Math.round(baseHighSqm),
    baseMidPrice,
    baseLowPrice,
    baseHighPrice,
    totalAdjustmentPercent,
    adjustedMidSqm,
    adjustedLowSqm,
    adjustedHighSqm,
    adjustedMidPrice,
    adjustedLowPrice,
    adjustedHighPrice,
    deviationMidPercent: Number(deviationMidPercent.toFixed(1)),
    deviationLowPercent: Number(deviationLowPercent.toFixed(1)),
    deviationHighPercent: Number(deviationHighPercent.toFixed(1)),
  };
}
