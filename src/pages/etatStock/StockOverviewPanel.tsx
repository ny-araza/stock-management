import React, { useMemo, useState } from "react";
import { Search, ChevronDown, ChevronUp, Package } from "lucide-react";
import { StockArticle, getNiveauStock } from "./types";
import { ArticleStockCard } from "./ArticleStockCard";
import Pagination from "../../components/ui/pagination/Pagination";
import { apiFetch } from "../../services/api";

interface StockOverviewPanelProps {
  articles?: StockArticle[];
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

interface Lot {
  lot_id: number;
  lot_code: string;
  lot_datePeremption: string;
  lot_quantite: number;
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

  const expiration = new Date(`${dateExpiration}T00:00:00`);
  const maintenant = new Date();

  if (isNaN(expiration.getTime())) {
    return {
      className: "text-gray-400",
      label: dateExpiration,
    };
  }

  if (expiration < maintenant) {
    return {
      className: "text-red-600 dark:text-red-400 font-semibold",
      label: dateExpiration,
    };
  }

  const dansUnMois = new Date(maintenant);
  dansUnMois.setMonth(dansUnMois.getMonth() + 1);

  if (expiration < dansUnMois) {
    return {
      className: "text-yellow-600 dark:text-yellow-400 font-semibold",
      label: dateExpiration,
    };
  }

  const dansTroisMois = new Date(maintenant);
  dansTroisMois.setMonth(dansTroisMois.getMonth() + 3);

  if (expiration < dansTroisMois) {
    return {
      className: "text-green-600 dark:text-green-400 font-semibold",
      label: dateExpiration,
    };
  }

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
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const [lotsByArticle, setLotsByArticle] = useState<Record<string, Lot[]>>({});

  const [lotsLoading, setLotsLoading] = useState<string | null>(null);

  const articlesTries = useMemo(() => {
    return [...articles].sort(
      (a, b) =>
        ORDRE_NIVEAU[getNiveauStock(a)] - ORDRE_NIVEAU[getNiveauStock(b)],
    );
  }, [articles]);

  const handleArticleClick = async (article: StockArticle) => {
    const articleCode = article.stk_art_code;
    console.log(articleCode);
    // Si l'article est déjà ouvert, on le ferme
    if (expandedArticle === articleCode) {
      setExpandedArticle(null);
      return;
    }

    // Ouvrir immédiatement la ligne
    setExpandedArticle(articleCode);

    // Si les lots sont déjà chargés, inutile de refaire la requête
    if (lotsByArticle[articleCode]) {
      console.log(true);
      return;
    }

    try {
      setLotsLoading(articleCode);

      const response = await apiFetch(
        `/api/articles-autocomplete/?search=${articleCode}`,
      );

      if (!response.status || !response.articles?.length) {
        setLotsByArticle((prev) => ({
          ...prev,
          [articleCode]: [],
        }));

        return;
      }

      // On récupère exactement l'article correspondant au code
      const articleDetail = response.articles.find(
        (item: any) => item.code === articleCode,
      );

      setLotsByArticle((prev) => ({
        ...prev,
        [articleCode]: articleDetail?.lots || [],
      }));
    } catch (error) {
      console.error("Erreur lors de la récupération des lots :", error);

      setLotsByArticle((prev) => ({
        ...prev,
        [articleCode]: [],
      }));
    } finally {
      setLotsLoading(null);
    }
  };

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
          articlesTries.map((article) => {
            const articleCode = article.stk_art_code;

            const isExpanded = expandedArticle === articleCode;

            const isLoading = lotsLoading === articleCode;

            const lots = lotsByArticle[articleCode] || [];

            return (
              <div
                key={article.stk_id}
                className="overflow-hidden rounded-lg border border-slate-200 dark:border-white/[0.05]"
              >
                {/* ============================
                    LIGNE PRINCIPALE
                ============================ */}

                <button
                  type="button"
                  onClick={() => handleArticleClick(article)}
                  className="
                    flex
                    w-full
                    items-center
                    gap-3
                    text-left
                    transition
                    hover:bg-slate-50
                    dark:hover:bg-white/[0.03]
                  "
                >
                  {/* Carte article */}
                  <div className="min-w-0 flex-1">
                    <ArticleStockCard article={article} />
                  </div>

                  {/* Indicateur */}
                  <div className="flex shrink-0 items-center gap-2 pr-3">
                    <span className="text-xs text-gray-400">Lots</span>

                    {isExpanded ? (
                      <ChevronUp size={18} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-400" />
                    )}
                  </div>
                </button>

                {/* ============================
                    DROPDOWN DES LOTS
                ============================ */}

                <div
                  className={`
                    grid
                    transition-all
                    duration-300
                    ease-in-out
                    ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}
                  `}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-slate-200 bg-slate-50 p-3 dark:border-white/[0.05] dark:bg-white/[0.02]">
                      {isLoading ? (
                        <div className="py-4 text-center text-sm text-gray-400">
                          Chargement des lots...
                        </div>
                      ) : lots.length === 0 ? (
                        <div className="py-4 text-center text-sm text-gray-400">
                          Aucun lot trouvé pour cet article.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="mb-2 flex items-center gap-2">
                            <Package size={16} className="text-gray-400" />

                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                              Lots disponibles
                            </span>
                          </div>

                          {lots.map((lot) => {
                            const expiration = getExpirationStyle(
                              lot.lot_datePeremption,
                            );

                            return (
                              <div
                                key={lot.lot_id}
                                className="
                                  flex
                                  flex-col
                                  gap-3
                                  rounded-lg
                                  border
                                  border-slate-200
                                  bg-white
                                  p-3
                                  sm:flex-row
                                  sm:items-center
                                  sm:justify-between
                                  dark:border-white/[0.05]
                                  dark:bg-white/[0.03]
                                "
                              >
                                {/* Code lot */}
                                <div>
                                  <span className="block text-xs text-gray-400">
                                    Code du lot
                                  </span>

                                  <span className="font-medium text-gray-700 dark:text-gray-200">
                                    {lot.lot_code || "Non renseigné"}
                                  </span>
                                </div>

                                {/* Quantité */}
                                <div>
                                  <span className="block text-xs text-gray-400">
                                    Quantité
                                  </span>

                                  <span className="font-medium text-gray-700 dark:text-gray-200">
                                    {lot.lot_quantite}
                                  </span>
                                </div>

                                {/* Péremption */}
                                <div>
                                  <span className="block text-xs text-gray-400">
                                    Date de péremption
                                  </span>

                                  <span
                                    className={`font-medium ${expiration.className}`}
                                  >
                                    {expiration.label}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
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
