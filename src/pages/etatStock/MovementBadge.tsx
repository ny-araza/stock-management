import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MovementBadgeProps {
  type: 'entree' | 'sortie';
  quantite: number;
  unite?: string;
}

const CONFIG = {
  entree: {
    Icon: ArrowUpRight,
    label: 'Entrée',
    classes: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  sortie: {
    Icon: ArrowDownRight,
    label: 'Sortie',
    classes: 'text-rose-700 bg-rose-50 border-rose-200',
  },
} as const;

/**
 * Petit badge visuel pour une entrée ou une sortie de stock.
 * Usage : <MovementBadge type="entree" quantite={12} unite="pcs" />
 */
export function MovementBadge({ type, quantite, unite = '' }: MovementBadgeProps) {
  const { Icon, label, classes } = CONFIG[type];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${classes}`}
      title={label}
    >
      <Icon size={14} strokeWidth={2.5} />
      {quantite} {unite}
    </span>
  );
}
