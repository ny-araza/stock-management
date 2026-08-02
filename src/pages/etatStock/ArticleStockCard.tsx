import React from 'react';
import { StockArticle } from './types';
import { MovementBadge } from './MovementBadge';
import { StockLevelIndicator } from './StockLevelIndicator';

interface ArticleStockCardProps {
  article: StockArticle;
}

/**
 * Une ligne / carte par article : nom + référence, badges entrée/sortie,
 * et jauge de stock actuel. Pas de bouton, pas d'action — uniquement
 * de la lecture rapide de l'état du stock.
 */
export function ArticleStockCard({ article }: ArticleStockCardProps) {
  const { nom, reference, entree, sortie, unite } = article;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 sm:w-1/3">
        <p className="truncate font-medium text-slate-900">{nom}</p>
        {reference && <p className="text-xs text-slate-400">Réf. {reference}</p>}
      </div>

      <div className="flex items-center gap-2 sm:w-1/4">
        {entree > 0 && <MovementBadge type="entree" quantite={entree} unite={unite} />}
        {sortie > 0 && <MovementBadge type="sortie" quantite={sortie} unite={unite} />}
        {entree === 0 && sortie === 0 && (
          <span className="text-xs text-slate-400">Aucun mouvement</span>
        )}
      </div>

      <div className="sm:w-1/3">
        <StockLevelIndicator article={article} />
      </div>
    </div>
  );
}
