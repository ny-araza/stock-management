import { useCallback, useEffect, useState } from "react";
import { venteService, ListeVente, VenteParams } from "../services/ventesService";


export function useVentes() {
  const [ventes, setVentes] = useState<ListeVente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [filters, setFilters] = useState<Omit<VenteParams, "page">>({});

  const fetchVentes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await venteService.getVentes({
        page,
        ...filters,
      });

      setVentes(response.ventes);
      setTotalPages(response.total_pages);
      setTotalCount(response.count);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des ventes",
      );
      setVentes([]);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchVentes();
  }, [fetchVentes]);

  // Modifier les filtres et revenir à la première page
  const rechercher = (nouveauxFiltres: Omit<VenteParams, "page">) => {
    setPage(1);
    setFilters(nouveauxFiltres);
  };

  const pageSuivante = () => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  };

  const pagePrecedente = () => {
    setPage((prev) => Math.max(prev - 1, 1));
  };

  return {
    ventes,
    loading,
    error,

    page,
    totalPages,
    totalCount,

    rechercher,
    setPage,
    pageSuivante,
    pagePrecedente,

    refresh: fetchVentes,
  };
}
