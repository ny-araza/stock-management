import { ListeVente } from "../pages/Ventes/ventesTable";
import deduireQuantiteLot from "../utils/updateLot";
import { apiFetch } from "./api";
import { postData } from "./sendDataService";
import { VenteLigne } from "./ventesService";

export interface DataUpdate {
  vte_valide: boolean;
  vte_paye: boolean;
  vte_usermdf: string;
  vte_is_retour?: number;
}

export default async function updateVente(vteId: number, data: DataUpdate) {

  const response = await apiFetch(`/api/update-vente/${vteId}/update/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (response?.error) {
    throw new Error(
      response.error || "Erreur lors de la mise à jour de la vente",
    );
  }

  return response;
}
