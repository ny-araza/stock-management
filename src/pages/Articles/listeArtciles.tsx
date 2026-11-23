import React, { useCallback, useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Filter,
  X,
  Package,
  Pencil,
  Barcode,
  Plus,
} from "lucide-react";

import { Article, PrixArticle } from "../../interfaces/interfaces";
import { apiFetch } from "../../services/api";
import { useModal } from "../../hooks/useModal";
import { useNavigate } from "react-router";

// ======================================
// FORMATAGE
// ======================================

const formatDate = (date?: string | null) => {
  if (!date) return "-";

  const d = new Date(date);

  if (isNaN(d.getTime())) return date;

  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatMontant = (value?: number | null) => {
  if (value === null || value === undefined) return "-";

  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const formatTva = (value?: number | null) => {
  if (value === null || value === undefined) return "-";

  return `${value.toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
  })} %`;
};

// ======================================
// PROPS
// ======================================

interface ListeArticlesProps {
  onRefresh?: () => void;
}

// ======================================
// COMPOSANT
// ======================================

export default function ListeArticles({ onRefresh }: ListeArticlesProps) {
  const { openModal } = useModal();

  // Données
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Recherche et filtres
  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState("");
  const [stockable, setStockable] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  const navigate = useNavigate();

  // ======================================
  // PRIX DE L'ARTICLE
  // ======================================

  const getPrixArticle = (article: Article): PrixArticle[] => {
    return article.prix ?? [];
  };

  // ======================================
  // CHARGEMENT DES ARTICLES
  // ======================================

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams();

      query.set("page", String(page));

      if (recherche.trim()) {
        query.set("search", recherche.trim());
      }

      if (statut !== "") {
        query.set("art_enabled", statut);
      }

      if (stockable !== "") {
        query.set("art_stockable", stockable);
      }

      const res = await apiFetch(`/api/articles/?${query.toString()}`);

      if (res.status) {
        setArticles(res.articles || []);
        setTotalCount(res.count || 0);
        setTotalPages(res.total_pages || 1);
        setHasNext(res.next !== null);
        setHasPrevious(res.previous !== null);
      } else {
        throw new Error(res.message || "Impossible de récupérer les articles");
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [page, recherche, statut, stockable, refreshKey]);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        fetchArticles();
      },
      recherche ? 400 : 0,
    );

    return () => clearTimeout(timer);
  }, [fetchArticles, recherche]);

  // ======================================
  // FILTRES
  // ======================================

  const resetFiltres = () => {
    setRecherche("");
    setStatut("");
    setStockable("");
    setPage(1);
  };

  const nombreFiltres = [recherche, statut, stockable].filter(Boolean).length;

  // ======================================
  // STATUT ARTICLE
  // ======================================

  const getStatut = (article: Article) => {
    if (article.art_enabled) {
      return {
        label: "Actif",
        style: "bg-green-100 text-green-700",
      };
    }

    return {
      label: "Non actif",
      style: "bg-red-100 text-red-700",
    };
  };

  // ======================================
  // ACTUALISATION
  // ======================================

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);

    if (onRefresh) {
      onRefresh();
    }
  };

  // ======================================
  // MODAL / NAVIGATION
  // ======================================

  const handleAjouter = () => {
    navigate(`/new-articles`);
  };

  const handleModifier = (article: Article) => {
    navigate(`/new-article/modifier/${article.art_id}`);
  };

  // ======================================
  // RENDU
  // ======================================

  return (
    <div className="w-full space-y-5">
      {/* EN-TÊTE */}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Liste des articles
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Consultez et gérez vos articles et leurs prix.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            title="Actualiser"
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          </button>

          <div className="rounded-lg bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 dark:bg-gray-800 dark:text-brand-200">
            {totalCount} article(s)
          </div>

          <button
            onClick={handleAjouter}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus size={17} />
            Nouvel article
          </button>
        </div>
      </div>

      {/* FILTRES */}

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:bg-gray-dark dark:border-gray-700 dark:text-white">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-white">
            <Filter size={17} />
            Filtres
          </div>

          {nombreFiltres > 0 && (
            <button
              onClick={resetFiltres}
              className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
            >
              <X size={15} />
              Réinitialiser
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* RECHERCHE */}

          <div className="relative md:col-span-2">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={recherche}
              onChange={(e) => {
                setRecherche(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher un code, un nom"
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-dark dark:text-white"
            />
          </div>

          {/* STATUT */}

          <select
            value={statut}
            onChange={(e) => {
              setStatut(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-dark dark:text-white"
          >
            <option value="">Tous les statuts</option>
            <option value="1">Actifs</option>
            <option value="0">Non actifs</option>
          </select>

          {/* STOCKABLE */}

          <select
            value={stockable}
            onChange={(e) => {
              setStockable(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-dark dark:text-white"
          >
            <option value="">Stockable ou non</option>
            <option value="1">Stockables</option>
            <option value="0">Non stockables</option>
          </select>
        </div>
      </div>

      {/* ERREUR */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30">
          {error}
        </div>
      )}

      {/* TABLEAU */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:bg-gray-dark dark:border-gray-700 dark:text-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1300px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-600 dark:text-white">
              <tr>
                <th className="px-4 py-4">Code article</th>
                <th className="px-4 py-4">Article</th>
                <th className="px-4 py-4 text-right">Prix d'achat</th>
                <th className="px-4 py-4 text-right">Prix de vente</th>
                <th className="px-4 py-4 text-right">TVA</th>
                <th className="px-4 py-4 text-right">Stock mini</th>
                <th className="px-4 py-4">Date création</th>
                <th className="px-4 py-4">User Cré</th>
                <th className="px-4 py-4">Date Modif</th>
                <th className="px-4 py-4">User Modif</th>
                <th className="px-4 py-4">Unité Vente</th>
                <th className="px-4 py-4 text-center">Statut</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={13} className="py-16 text-center">
                    <RefreshCw
                      size={25}
                      className="mx-auto mb-3 animate-spin text-brand-500"
                    />

                    <p className="text-gray-500 dark:text-gray-400">
                      Chargement des articles...
                    </p>
                  </td>
                </tr>
              ) : articles.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-16 text-center">
                    <Package size={35} className="mx-auto mb-3 text-gray-300" />

                    <p className="font-medium text-gray-600 dark:text-white">
                      Aucun article trouvé
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Modifiez vos critères de recherche.
                    </p>
                  </td>
                </tr>
              ) : (
                articles.map((article) => {
                  const statutArticle = getStatut(article);
                  const prixArticle = getPrixArticle(article);

                  return (
                    <tr
                      key={article.art_id}
                      className="transition hover:bg-brand-50/40 dark:hover:bg-gray-800"
                    >
                      {/* CODE */}

                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-brand-700 dark:text-brand-200">
                        {article.art_code || "-"}
                      </td>

                      {/* NOM */}

                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {article.art_nom || "-"}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                          {article.art_marque && (
                            <span>{article.art_marque}</span>
                          )}

                          {article.art_codebarre && (
                            <span className="flex items-center gap-1">
                              <Barcode size={12} />
                              {article.art_codebarre}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* PRIX ACHAT */}

                      <td className="px-4 py-4 text-right text-gray-600 dark:text-gray-300">
                        <div className="flex flex-col items-end gap-2">
                          {prixArticle.length > 0
                            ? prixArticle.map((prix) => (
                                <div
                                  key={prix.pri_id}
                                  className="whitespace-nowrap"
                                >
                                  {formatMontant(prix.pri_achat)}
                                </div>
                              ))
                            : "-"}
                        </div>
                      </td>

                      {/* PRIX VENTE */}

                      <td className="px-4 py-4 text-right font-semibold text-gray-800 dark:text-white">
                        <div className="flex flex-col items-end gap-2">
                          {prixArticle.length > 0
                            ? prixArticle.map((prix) => (
                                <div
                                  key={prix.pri_id}
                                  className="whitespace-nowrap"
                                >
                                  {formatMontant(prix.pri_vte)}
                                </div>
                              ))
                            : "-"}
                        </div>
                      </td>

                      {/* TVA */}

                      <td className="px-4 py-4 text-right text-gray-600 dark:text-gray-300">
                        <div className="flex flex-col items-end gap-2">
                          {prixArticle.length > 0
                            ? prixArticle.map((prix) => (
                                <div
                                  key={prix.pri_id}
                                  className="whitespace-nowrap"
                                >
                                  {formatTva(prix.pri_tva)}
                                </div>
                              ))
                            : "-"}
                        </div>
                      </td>

                      {/* STOCK MINI */}

                      <td className="whitespace-nowrap px-4 py-4 text-right text-gray-600 dark:text-gray-300">
                        {article.art_stockmini ?? "-"}
                      </td>

                      {/* DATE CRÉATION */}

                      <td className="whitespace-nowrap px-4 py-4 text-gray-600 dark:text-gray-300">
                        {formatDate(article.art_datecre)}
                      </td>

                      {/* UTILISATEUR CRÉATION */}

                      <td className="whitespace-nowrap px-4 py-4 text-gray-600 dark:text-gray-300">
                        {article.art_usercre || "-"}
                      </td>

                      {/* DATE MODIFICATION */}

                      <td className="whitespace-nowrap px-4 py-4 text-gray-600 dark:text-gray-300">
                        {formatDate(article.art_datemdf)}
                      </td>

                      {/* UTILISATEUR MODIFICATION */}

                      <td className="whitespace-nowrap px-4 py-4 text-gray-600 dark:text-gray-300">
                        {article.art_usermdf || "-"}
                      </td>

                      {/* UNITÉ DE VENTE */}

                      <td className="px-4 py-4 text-gray-600 dark:text-gray-300">
                        <div className="flex flex-col items-start gap-2">
                          {prixArticle.length > 0
                            ? prixArticle.map((prix) => (
                                <div
                                  key={prix.pri_id}
                                  className="whitespace-nowrap rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 dark:bg-gray-700 dark:text-brand-200"
                                >
                                  {prix.pri_unitevente || "-"}
                                </div>
                              ))
                            : "-"}
                        </div>
                      </td>

                      {/* STATUT */}

                      <td className="px-4 py-4 text-center">
                        <span
                          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statutArticle.style}`}
                        >
                          {statutArticle.label}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleModifier(article)}
                            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Pencil size={14} />
                            Modifier
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PIED DU TABLEAU */}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-4 py-3 dark:bg-gray-800 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {totalCount} article(s) au total
          </span>

          <span className="text-xs text-gray-500 dark:text-gray-400">
            {articles.length} article(s) affiché(s) sur cette page
          </span>
        </div>
      </div>

      {/* PAGINATION */}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:bg-gray-dark dark:border-gray-700">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Page {page} sur {totalPages}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPage(1)}
            disabled={page <= 1 || loading || !hasPrevious}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 dark:bg-gray-dark dark:border-gray-700 dark:text-white"
          >
            Première
          </button>

          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1 || loading || !hasPrevious}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 dark:bg-gray-dark dark:border-gray-700 dark:text-white"
          >
            Précédent
          </button>

          <span className="rounded-lg bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 dark:bg-gray-800 dark:text-brand-200">
            {page}
          </span>

          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages || loading || !hasNext}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 dark:bg-gray-dark dark:border-gray-700 dark:text-white"
          >
            Suivant
          </button>

          <button
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages || loading || !hasNext}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 dark:bg-gray-dark dark:border-gray-700 dark:text-white"
          >
            Dernière
          </button>
        </div>
      </div>
    </div>
  );
}
