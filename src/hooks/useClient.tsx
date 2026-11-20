import { useCallback, useEffect, useState } from "react";
import { clientService, ClientParams } from "../services/clientServices";
import { Client } from "../interfaces/interfaces";

export function useClient() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [filters, setFilters] = useState<Omit<ClientParams, "page">>({});

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await clientService.getClients({
        page,
        ...filters,
      });

      setClients(response.clients);
      setTotalPages(response.total_pages);
      setTotalCount(response.count);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des clients",
      );
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Modifier les filtres et revenir à la première page
  const rechercher = (nouveauxFiltres: Omit<ClientParams, "page">) => {
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
    clients,
    loading,
    error,

    page,
    totalPages,
    totalCount,

    rechercher,
    setPage,
    pageSuivante,
    pagePrecedente,

    refresh: fetchClients,
  };
}
