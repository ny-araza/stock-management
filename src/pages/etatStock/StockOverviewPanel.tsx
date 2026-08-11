import React, { useMemo } from "react";
import { Search } from "lucide-react";
import { StockArticle, getNiveauStock } from "./types";
import { ArticleStockCard } from "./ArticleStockCard";
import Pagination from "../../components/ui/pagination/Pagination";

interface StockOverviewPanelProps {
  articles: StockArticle[];
  title?: string;

  // Pagination
  page: number;
  totalPages: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPageChange: (page: number) => void;

  // Recherche
  search: string;
  onSearchChange: (search: string) => void;
}

const ORDRE_NIVEAU: Record<string, number> = {
  critique: 0,
  faible: 1,
  normal: 2,
  excedent: 3,
};

function getExpirationStyle(dateExpiration: string) {
  if (!dateExpiration) {
    return {
      className: "text-gray-400",
      label: "Pas de péremption",
    };
  }

  // Ajouter l'heure pour éviter certains problèmes de timezone
  const expiration = new Date(`${dateExpiration}T00:00:00`);
  const maintenant = new Date();

  if (isNaN(expiration.getTime())) {
    return {
      className: "text-gray-400",
      label: dateExpiration,
    };
  }

  // Date déjà dépassée
  if (expiration < maintenant) {
    return {
      className: "text-red-600 dark:text-red-400 font-semibold",
      label: dateExpiration,
    };
  }

  // Date dans moins d'un mois
  const dansUnMois = new Date(maintenant);
  dansUnMois.setMonth(dansUnMois.getMonth() + 1);

  if (expiration < dansUnMois) {
    return {
      className: "text-yellow-600 dark:text-yellow-400 font-semibold",
      label: dateExpiration,
    };
  }

  // Date dans moins de 3 mois
  const dansTroisMois = new Date(maintenant);
  dansTroisMois.setMonth(dansTroisMois.getMonth() + 3);

  if (expiration < dansTroisMois) {
    return {
      className: "text-green-600 dark:text-green-400 font-semibold",
      label: dateExpiration,
    };
  }

  // Plus de 3 mois
  return {
    className: "text-gray-500 dark:text-gray-400",
    label: dateExpiration,
  };
}

export function StockOverviewPanel({
  articles,
  title = "État du stock",

  page,
  totalPages,
  totalCount,
  hasPrevious,
  hasNext,
  onPageChange,

  search,
  onSearchChange,
}: StockOverviewPanelProps) {
  const articlesTries = useMemo(() => {
    return [...articles].sort(
      (a, b) =>
        ORDRE_NIVEAU[getNiveauStock(a)] - ORDRE_NIVEAU[getNiveauStock(b)],
    );
  }, [articles]);

  return (
    <div className="w-full">
      {/* En-tête */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {title}
          </h2>
        </div>

        {/* Recherche */}
        <div className="relative w-full sm:w-64">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un article..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-slate-400 focus:outline-none dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-white"
          />
        </div>
      </div>

      {/* Liste */}
      <div className="flex flex-col gap-2">
        {articlesTries.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            Aucun article ne correspond à votre recherche.
          </p>
        ) : (
          // articlesTries.map((article) => (
          //   <ArticleStockCard key={article.stk_id} article={article} />
          // ))
          articlesTries.map((article) => {
            const expiration = getExpirationStyle(article.stk_lot_code);

            return (
              <div key={article.stk_id} className="flex items-center gap-3">
                {/* Carte article */}
                {/* Date de péremption */}
                <div className="min-w-0 flex-1">
                  <ArticleStockCard article={article} />
                </div>
                <div className="flex shrink-0 flex-col items-start pr-2">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    Péremption
                  </span>
                  <span className={`text-sm ${expiration.className}`}>
                    {expiration.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        onPageChange={onPageChange}
      />
    </div>
  );
}
