import { TagColor, PropertyTag } from '@/types';

export interface TagColorMeta {
  id: TagColor;
  label: string;
  dotClass: string;
  lightBadgeClass: string;
  darkBadgeClass: string;
  printBadgeClass: string;
}

export const TAG_COLORS_LIST: TagColorMeta[] = [
  {
    id: 'rose',
    label: 'Красный',
    dotClass: 'bg-rose-500',
    lightBadgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    darkBadgeClass: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
    printBadgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
  },
  {
    id: 'amber',
    label: 'Оранжевый',
    dotClass: 'bg-amber-500',
    lightBadgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    darkBadgeClass: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
    printBadgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    id: 'emerald',
    label: 'Зеленый',
    dotClass: 'bg-emerald-500',
    lightBadgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    darkBadgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
    printBadgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  {
    id: 'blue',
    label: 'Синий',
    dotClass: 'bg-sky-500',
    lightBadgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    darkBadgeClass: 'bg-sky-950/80 text-sky-300 border-sky-700/60',
    printBadgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
  },
  {
    id: 'purple',
    label: 'Фиолетовый',
    dotClass: 'bg-purple-500',
    lightBadgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    darkBadgeClass: 'bg-purple-950/80 text-purple-300 border-purple-700/60',
    printBadgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
  },
  {
    id: 'slate',
    label: 'Серый',
    dotClass: 'bg-slate-500',
    lightBadgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    darkBadgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
    printBadgeClass: 'bg-slate-100 text-slate-900 border-slate-300',
  },
];

export const PRESET_TAGS: PropertyTag[] = [
  { text: 'Главный конкурент', color: 'rose' },
  { text: 'Завышенная цена', color: 'amber' },
  { text: 'Заниженная цена', color: 'emerald' },
  { text: 'Срочная продажа', color: 'blue' },
  { text: 'Прямой аналог', color: 'purple' },
  { text: 'Требует ремонта', color: 'slate' },
];

export function getTagColorMeta(color?: TagColor): TagColorMeta {
  return TAG_COLORS_LIST.find((c) => c.id === color) || TAG_COLORS_LIST[0];
}

export function getTagBadgeClasses(color?: TagColor, mode: 'light' | 'dark' | 'print' = 'light'): string {
  const meta = getTagColorMeta(color);
  if (mode === 'print') {
    return `inline-flex items-center gap-1 font-bold rounded-md px-1.5 py-0.5 text-[10px] border ${meta.printBadgeClass}`;
  }
  if (mode === 'dark') {
    return `inline-flex items-center gap-1 font-semibold rounded-md px-2 py-0.5 text-xs border ${meta.darkBadgeClass}`;
  }
  return `inline-flex items-center gap-1 font-semibold rounded-md px-2 py-0.5 text-xs border ${meta.lightBadgeClass}`;
}
