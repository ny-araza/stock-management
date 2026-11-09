import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { apiFetch } from "../../services/api";
import { BCAutoComplete } from "../../interfaces/interfaces";
import NewCommandFrns from "../Home/modal/newCommandFrns";
import NewCmdFrnsPage from "./newCommandFrns";

type cfDetail = BCAutoComplete & {
  lignes: BCAutoComplete[];
};

export default function ModifierCFPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cf, setcf] = useState<cfDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const chargercf = async () => {
      try {
        if (!id) {
          throw new Error("Identifiant de cf invalide.");
        }
        const res = await apiFetch(`/api/bc-list/${id}/`);

        if (!res.status) {
          throw new Error(res.message || "Impossible de récupérer la cf.");
        }

        const data = res.commandes;
        console.log(data)

        if (Number(data.cmf_islivre) === 1) {
          throw new Error(
            "Cette cf est déjà validée et ne peut plus être modifiée.",
          );
        }

        setcf(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue.",
        );
      } finally {
        setLoading(false);
      }
    };

    chargercf();
  }, [id]);

  if (loading) {
    return <div className="p-6">Chargement de la cf...</div>;
  }

  if (error || !cf) {
    return (
      <div className="p-6">
        <p className="text-red-500">{error || "cf introuvable."}</p>

        <button
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white"
          onClick={() => navigate("/bc")}
        >
          Retour aux cfs
        </button>
      </div>
    );
  }

  return (
    <NewCmdFrnsPage
      mode="modification"
      initialData={cf}
      onSuccess={() => navigate("/bc")}
    />
  );
}
