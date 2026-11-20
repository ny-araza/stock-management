import { useCallback, useEffect, useState } from "react";
import {
  fournisseurService,
  FournisseurParams,
} from "../services/fournisseurServices";
import { Fourniseur } from "../interfaces/interfaces";

export function useFournisseur() {
  const [fournisseurs, setFournisseurs] = useState<Fourniseur[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [filters, setFilters] = useState<Omit<FournisseurParams, "page">>({});

  const fetchFournisseurs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fournisseurService.getFournisseurs({
        page,
        ...filters,
      });

      setFournisseurs(response.fournisseurs);
      setTotalPages(response.total_pages);
      setTotalCount(response.count);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des fournisseurs",
      );
      setFournisseurs([]);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchFournisseurs();
  }, [fetchFournisseurs]);

  // Modifier les filtres et revenir à la première page
  const rechercher = (nouveauxFiltres: Omit<FournisseurParams, "page">) => {
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
    fournisseurs,
    loading,
    error,

    page,
    totalPages,
    totalCount,

    rechercher,
    setPage,
    pageSuivante,
    pagePrecedente,

    refresh: fetchFournisseurs,
  };
}
