import { useCallback, useEffect, useState } from "react";

import { entreeService, EntreeParams } from "../services/livFrnsService";
import { Entree } from "../pages/livFrns/livFrnsTable";
export function useLivFrns() {
  const [entrees, setEntrees] = useState<Entree[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [filters, setFilters] = useState<Omit<EntreeParams, "page">>({});

  // ======================================
  // RÉCUPÉRER LES ENTRÉES
  // ======================================

  const fetchEntrees = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await entreeService.getEntrees({
        page,
        ...filters,
      });

      setEntrees(response.entree);
      setTotalPages(response.total_pages);
      setTotalCount(response.count);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des entrées fournisseurs",
      );

      setEntrees([]);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  // ======================================
  // CHARGEMENT AUTOMATIQUE
  // ======================================

  useEffect(() => {
    fetchEntrees();
  }, [fetchEntrees]);

  // ======================================
  // RECHERCHE / FILTRES
  // ======================================

  const rechercher = (nouveauxFiltres: Omit<EntreeParams, "page">) => {
    setPage(1);
    setFilters(nouveauxFiltres);
  };

  // ======================================
  // PAGINATION
  // ======================================

  const pageSuivante = () => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  };

  const pagePrecedente = () => {
    setPage((prev) => Math.max(prev - 1, 1));
  };

  // ======================================
  // RETOUR
  // ======================================

  return {
    entrees,
    loading,
    error,

    page,
    totalPages,
    totalCount,

    rechercher,
    setPage,
    pageSuivante,
    pagePrecedente,

    refresh: fetchEntrees,
  };
}
