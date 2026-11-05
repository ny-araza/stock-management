import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import NewVentePage from "./newVentePage";
import { apiFetch } from "../../services/api";
import { ListeVente } from "../../interfaces/interfaces";
import { VenteLigne } from "./ventesTable";

type VenteDetail = ListeVente & {
  lignes: VenteLigne[];
};

export default function ModifierVentePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vente, setVente] = useState<VenteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const chargerVente = async () => {
      try {
        if (!id) {
          throw new Error("Identifiant de vente invalide.");
        }

        const res = await apiFetch(`/api/ventes/${id}/`);

        if (!res.status) {
          throw new Error(res.message || "Impossible de récupérer la vente.");
        }

        const data = res.vente;

        if (Number(data.vte_valide) === 1) {
          throw new Error(
            "Cette vente est déjà validée et ne peut plus être modifiée.",
          );
        }

        setVente(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue.",
        );
      } finally {
        setLoading(false);
      }
    };

    chargerVente();
  }, [id]);

  if (loading) {
    return <div className="p-6">Chargement de la vente...</div>;
  }

  if (error || !vente) {
    return (
      <div className="p-6">
        <p className="text-red-500">{error || "Vente introuvable."}</p>

        <button
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white"
          onClick={() => navigate("/ventes")}
        >
          Retour aux ventes
        </button>
      </div>
    );
  }

  return (
    <NewVentePage
      mode="modification"
      initialData={vente}
      onSuccess={() => navigate("/ventes")}
    />
  );
}
