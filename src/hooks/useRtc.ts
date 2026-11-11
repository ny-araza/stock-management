import { useCallback, useEffect, useState } from "react";
import { retourClientService, RtfParams } from "../services/retourClient";
import { RtcType } from "../pages/rtc/retourCltsTable";

export function useRetourClient() {
  const [listeRetourClient, setListeRetourClient] = useState<RtcType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [filters, setFilters] = useState<Omit<RtfParams, "page">>({});

  const fetchRetours = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await retourClientService.getRetours({
        page,
        ...filters,
      });

      setListeRetourClient(response.retour_client);
      setTotalPages(response.total_pages);
      setTotalCount(response.count);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des retours clients",
      );
      setListeRetourClient([]);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchRetours();
  }, [fetchRetours]);

  // Modifier les filtres et revenir à la première page
  const rechercher = (nouveauxFiltres: Omit<RtfParams, "page">) => {
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
    listeRetourClient,
    loading,
    error,

    page,
    totalPages,
    totalCount,

    rechercher,
    setPage,
    pageSuivante,
    pagePrecedente,

    refresh: fetchRetours,
  };
}
