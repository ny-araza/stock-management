import React from "react";
import { StockArticle } from "./types";
import { StockLevelIndicator } from "./StockLevelIndicator";

interface ArticleStockCardProps {
  article: StockArticle;
}

/**
 * Une ligne / carte par article : nom + référence, badges entrée/sortie,
 * et jauge de stock actuel. Pas de bouton, pas d'action — uniquement
 * de la lecture rapide de l'état du stock.
 */
export function ArticleStockCard({ article }: ArticleStockCardProps) {
  const { article_table, stk_art_code } = article;

  return (
    <div className="flex flex-col gap-3 rounded-xl border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-gray-dark dark:text-white">
      <div className="min-w-0 sm:w-1/3">
        <p className="truncate font-medium text-slate-900 dark:text-white">
          {article_table?.art_nom}
        </p>
        {stk_art_code && (
          <p className="text-xs text-slate-400">Réf. {stk_art_code}</p>
        )}
      </div>

      <div className="sm:w-1/3">
        <StockLevelIndicator article={article} />
      </div>
    </div>
  );
}
