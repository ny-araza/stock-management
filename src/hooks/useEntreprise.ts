import { useCallback, useEffect, useState } from "react";
import { Entreprise } from "../interfaces/interfaces";
import { entrepriseApi } from "../services/entreprise/entrepriseService";

export function useEntreprise() {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntreprise = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await entrepriseApi.getAll();
      setEntreprises(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de récupérer les informations de l'entreprise",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntreprise();
  }, [fetchEntreprise]);

  return {
    entreprises,
    entreprise: entreprises[0] ?? null,
    loading,
    error,
    refetch: fetchEntreprise,
  };
}
