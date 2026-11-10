import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { apiFetch } from "../../services/api";
import { Entree, EntreeLigne } from "./livFrnsTable";
import { CFLigneArticle } from "../../interfaces/interfaces";
import NewLivFrnsPage from "./newLivFrns";

type EntreeAutoComplete = Omit<Entree, "lignes"> & {
  ligne: CFLigneArticle[];
};

type EntreeDetailResponse = Entree & {
  lignes: CFLigneArticle[];
};

export default function ModifierLivFrnsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [entree, setEntree] = useState<EntreeAutoComplete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const convertirLigne = (ligne: EntreeLigne): CFLigneArticle => ({
      cmfl_id: ligne.entl_id,
      cmfl_cmf_code: ligne.entl_ent_code,
      cmfl_Quantite: Number(ligne.entl_quantite),
      cmfl_PrixAchat: Number(ligne.entl_prixunit),
      cmfl_Tva: Number(ligne.entl_tva),
      cmfl_TotalHT: Number(ligne.entl_ht),
      cmfl_Art_Code: ligne.entl_art_code,
      cmfl_fou_Code: ligne.entl_fou_code,
      cmfl_TotalTTC: Number(ligne.entl_ttc),
      cmfl_pri_id: ligne.entl_pri_id,
      art_nom: "",
      cmfl_uid: ligne.entl_uid,
      cmfl_remise: Number(ligne.entl_remise ?? 0),
      cmfl_montant_remise: Number(ligne.entl_montant_remise ?? 0),
      cmfl_lot: "",
      cmfl_datePer: ligne.entl_dateper || "",
      cmfl_quantite_stock: ligne.entl_quantite,
      cmfl_lot_id: ligne.entl_lot_id,
      cmfl_lot_code: undefined,
      cmfl_montant_tva:
        (Number(ligne.entl_tva ?? 0) / 100) * Number(ligne.entl_ht),
    });

    const chargerEntree = async () => {
      try {
        if (!id) {
          throw new Error("Identifiant de l'entrée invalide.");
        }

        const res = await apiFetch(`/api/entree_stock/${id}/`);

        if (!res.status) {
          throw new Error(res.message || "Impossible de récupérer l'entrée.");
        }

        const data = res.entree as EntreeDetailResponse;

        // Conversion des lignes EntreeLigne vers CFLigneArticle
        const lignesAdaptees: CFLigneArticle[] = (data.lignes ?? []).map(
          convertirLigne,
        );

        // Adaptation de la structure Entree vers EntreeAutoComplete
        const entreeAdaptee: EntreeAutoComplete = {
          ent_id: data.ent_id,
          ent_code: data.ent_code,
          ent_datecre: data.ent_datecre,
          ent_datemdf: data.ent_datemdf,
          ent_usercre: data.ent_usercre,
          ent_usermdf: data.ent_usermdf,
          ent_fou_code: data.ent_fou_code,
          ent_date: data.ent_date,
          ent_facture: data.ent_facture,
          ent_datepay: data.ent_datepay,
          ent_modepaye: data.ent_modepaye,
          ent_dateecheance: data.ent_dateecheance,
          ent_montant_ht: data.ent_montant_ht,
          ent_montant_ttc: data.ent_montant_ttc,
          ent_cmf_code: data.ent_cmf_code,
          ent_is_paye: data.ent_is_paye,
          fournisseur: data.fournisseur,
          ligne: lignesAdaptees,
        };

        setEntree(entreeAdaptee);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue.",
        );
      } finally {
        setLoading(false);
      }
    };

    chargerEntree();
  }, [id]);

  if (loading) {
    return <div className="p-6">Chargement de l'entrée...</div>;
  }

  if (error || !entree) {
    return (
      <div className="p-6">
        <p className="text-red-500">{error || "Entrée introuvable."}</p>

        <button
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white"
          onClick={() => navigate("/liv-frns")}
        >
          Retour aux livraisons fournisseur
        </button>
      </div>
    );
  }

  return (
    <NewLivFrnsPage
      mode="modification"
      initialData={entree}
      onSuccess={() => navigate("/liv-frns")}
    />
  );
}
