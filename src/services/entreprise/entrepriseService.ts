import { Entreprise } from "../../interfaces/interfaces";
import { apiFetch } from "../api";

interface EntrepriseResponse {
  status: boolean;
  message: string;
  entreprises: Entreprise[];
}

export const entrepriseApi = {
  getAll: async (): Promise<Entreprise[]> => {
    const res: EntrepriseResponse = await apiFetch("/api/entreprises/");

    if (!res.status) {
      throw new Error(res.message || "Erreur de récupération de l'entreprise");
    }

    return res.entreprises;
  },
};
