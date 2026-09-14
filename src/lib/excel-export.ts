import { Report } from '@/types';

export function exportReportToExcel(report: Report) {
  const target = report.property;
  const competitors = report.competitors || [];

  let csvContent = '\uFEFF'; // UTF-8 BOM for Excel Cyrillic compatibility

  // Title
  csvContent += `ОТЧЕТ СРАВНИТЕЛЬНОГО МАРКЕТИНГОВОГО АНАЛИЗА (СМА)\n`;
  csvContent += `Название отчета;${report.title}\n`;
  csvContent += `Адрес объекта;${report.address}\n`;
  csvContent += `Дата анализа;${report.date}\n`;
  csvContent += `Автор отчета;${report.author}\n`;
  csvContent += `Рекомендуемая стоимость;${report.recommendedPrice} ₽\n\n`;

  // Section 1: Target Specs
  csvContent += `ХАРАКТЕРИСТИКИ ОБЪЕКТА ОЦЕНКИ\n`;
  csvContent += `Параметр;Значение\n`;
  csvContent += `Цена объекта;${target.price} ₽\n`;
  csvContent += `Площадь;${target.area} м²\n`;
  csvContent += `Цена за м²;${target.pricePerSqm} ₽/м²\n`;
  csvContent += `Комнат;${target.rooms}\n`;
  csvContent += `Этаж;${target.floor} / ${target.totalFloors}\n`;
  csvContent += `Материал дома;${target.buildingMaterial}\n`;
  csvContent += `Тип ремонта;${target.renovation || 'Дизайнерский'}\n\n`;

  // Section 2: Competitors
  csvContent += `СПИСОК АНАЛОГОВ И КОНКУРЕНТОВ (${competitors.length})\n`;
  csvContent += `№;Адрес аналога;Метка;Цена (₽);Площадь (м²);Цена за м² (₽/м²);Этаж;Ремонт;Источник;Ссылка\n`;

  competitors.forEach((c, idx) => {
    csvContent += `${idx + 1};"${c.address.replace(/"/g, '""')}";"${c.tag?.text || '—'}";${c.price};${c.area};${c.pricePerSqm};${c.floor}/${c.totalFloors};"${c.renovation || '—'}";${c.source || 'avito/cian'};"${c.url || ''}"\n`;
  });

  if (report.adjustments) {
    const adj = report.adjustments;
    const total =
      (adj.floorAdjustment || 0) +
      (adj.renovationAdjustment || 0) +
      (adj.competitorsAdjustment || 0) +
      (adj.balconyAdjustment || 0) +
      (adj.demandAdjustment || 0) +
      (adj.legalAdjustment || 0);

    csvContent += `\nСЕТКА КОРРЕКТИРОВОК\n`;
    csvContent += `Параметр;Поправка (%)\n`;
    csvContent += `Этаж;${adj.floorAdjustment}%\n`;
    csvContent += `Ремонт;${adj.renovationAdjustment}%\n`;
    csvContent += `Конкуренты в локации;${adj.competitorsAdjustment || 0}%\n`;
    csvContent += `Балкон / лоджия;${adj.balconyAdjustment}%\n`;
    csvContent += `Спрос по локации;${adj.demandAdjustment}%\n`;
    csvContent += `Документы;${adj.legalAdjustment}%\n`;
    csvContent += `Итоговая корректировка;${total}%\n`;
  }

  if (report.searchParamsDescription) {
    csvContent += `\nПАРАМЕТРЫ ВЫБОРКИ АНАЛОГОВ\n`;
    csvContent += `"${report.searchParamsDescription.replace(/"/g, '""')}"\n`;
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `СМА_${report.title.replace(/[^a-zA-Z0-9а-яА-Я_-]/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportAllReportsToExcel(reports: Report[]) {
  let csvContent = '\uFEFF';
  csvContent += `РЕЕСТР ОТЧЕТОВ СМА EXPERT\n`;
  csvContent += `№;Дата;Название;Адрес;Автор;Статус;Реком. цена (₽);Аналогов\n`;

  reports.forEach((r, idx) => {
    csvContent += `${idx + 1};${r.date};"${r.title.replace(/"/g, '""')}";"${r.address.replace(/"/g, '""')}";"${r.author}";${r.status === 'completed' ? 'Готов' : 'Черновик'};${r.recommendedPrice};${r.competitors ? r.competitors.length : 0}\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Реестр_отчетов_СМА_Expert.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
