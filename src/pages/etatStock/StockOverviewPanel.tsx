import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { StockArticle, getNiveauStock } from './types';
import { ArticleStockCard } from './ArticleStockCard';

interface StockOverviewPanelProps {
  articles: StockArticle[];
  title?: string;
}

const ORDRE_NIVEAU: Record<string, number> = {
  critique: 0,
  faible: 1,
  normal: 2,
  excedent: 3,
};

/**
 * Vue d'ensemble de l'état du stock : une seule barre de recherche
 * (pas de filtres ni boutons compliqués), les articles les plus
 * critiques remontent automatiquement en haut de la liste.
 *
 * Usage :
 * <StockOverviewPanel articles={articles} />
 */
export function StockOverviewPanel({ articles, title = 'État du stock' }: StockOverviewPanelProps) {
  const [recherche, setRecherche] = useState('');

  const articlesFiltres = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    const filtres = terme
      ? articles.filter(
          (a) =>
            a.nom.toLowerCase().includes(terme) ||
            a.reference?.toLowerCase().includes(terme)
        )
      : articles;

    return [...filtres].sort(
      (a, b) => ORDRE_NIVEAU[getNiveauStock(a)] - ORDRE_NIVEAU[getNiveauStock(b)]
    );
  }, [articles, recherche]);

  const nbASurveiller = useMemo(
    () =>
      articles.filter((a) => {
        const niveau = getNiveauStock(a);
        return niveau === 'critique' || niveau === 'faible';
      }).length,
    [articles]
  );

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {nbASurveiller > 0 && (
            <p className="text-sm text-amber-600">{nbASurveiller} article(s) à surveiller</p>
          )}
        </div>

        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un article..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-slate-400 focus:outline-none sm:w-64"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {articlesFiltres.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            Aucun article ne correspond à votre recherche.
          </p>
        ) : (
          articlesFiltres.map((article) => (
            <ArticleStockCard key={article.id} article={article} />
          ))
        )}
      </div>
    </div>
  );
}
