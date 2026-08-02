import React from 'react';
import { StockArticle, getNiveauStock, NiveauStock } from './types';

const NIVEAU_STYLES: Record<
  NiveauStock,
  { fill: string; label: string; text: string; dot: string }
> = {
  critique: { fill: 'bg-red-500', label: 'Rupture', text: 'text-red-700', dot: 'bg-red-500' },
  faible: { fill: 'bg-amber-500', label: 'Stock faible', text: 'text-amber-700', dot: 'bg-amber-500' },
  normal: { fill: 'bg-emerald-500', label: 'Stock normal', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  excedent: { fill: 'bg-sky-500', label: 'Surstock', text: 'text-sky-700', dot: 'bg-sky-500' },
};

interface StockLevelIndicatorProps {
  article: StockArticle;
}

/**
 * Jauge horizontale qui montre le stock actuel par rapport au seuil
 * minimum (trait vertical) et au plafond estimé. Le code couleur
 * (rouge / orange / vert / bleu) permet de repérer un article en
 * rupture d'un coup d'œil, sans lire les chiffres.
 */
export function StockLevelIndicator({ article }: StockLevelIndicatorProps) {
  const { stockActuel, stockMin, stockMax, unite = '' } = article;
  const niveau = getNiveauStock(article);
  const style = NIVEAU_STYLES[niveau];

  const plafond = Math.max(stockMax ?? stockMin * 2, stockActuel, 1);
  const pourcentage = Math.min(100, Math.round((stockActuel / plafond) * 100));
  const seuilPourcentage = Math.min(100, Math.round((stockMin / plafond) * 100));

  return (
    <div className="w-full">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-lg font-semibold text-slate-900">
          {stockActuel} <span className="text-xs font-normal text-slate-500">{unite}</span>
        </span>
        <span className={`flex items-center gap-1 text-xs font-medium ${style.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          {style.label}
        </span>
      </div>

      <div className="relative h-2 w-full rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full transition-all ${style.fill}`}
          style={{ width: `${pourcentage}%` }}
        />
        {stockMin > 0 && (
          <div
            className="absolute top-0 h-2 w-px bg-slate-400"
            style={{ left: `${seuilPourcentage}%` }}
            title={`Seuil minimum : ${stockMin} ${unite}`}
          />
        )}
      </div>
    </div>
  );
}
