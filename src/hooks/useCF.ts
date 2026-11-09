import { useCallback, useEffect, useState } from "react";
import {
  bcAutoService,
  BCAutoParams,
  BCAutoComplete,
} from "../services/cfService";

export function useCF() {
  const [commandes, setCommandes] = useState<BCAutoComplete[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [filters, setFilters] = useState<Omit<BCAutoParams, "page">>({});

  const fetchCommandes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await bcAutoService.getCommandes({
        page,
        ...filters,
      });

      setCommandes(response.commandes);
      setTotalPages(response.total_pages);
      setTotalCount(response.count);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des bons de commande",
      );
      setCommandes([]);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchCommandes();
  }, [fetchCommandes]);

  // Modifier les filtres et revenir à la première page
  const rechercher = (nouveauxFiltres: Omit<BCAutoParams, "page">) => {
    setPage(1);
    setFilters(nouveauxFiltres);
  };

  // Pagination
  const pageSuivante = () => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  };

  const pagePrecedente = () => {
    setPage((prev) => Math.max(prev - 1, 1));
  };

  return {
    commandes,
    loading,
    error,

    page,
    totalPages,
    totalCount,

    rechercher,
    setPage,
    pageSuivante,
    pagePrecedente,

    refresh: fetchCommandes,
  };
}
