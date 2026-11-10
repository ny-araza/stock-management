import { apiFetch } from "./api";
import { Entree, EntreeLigne } from "../pages/livFrns/livFrnsTable";

// ===============================
// INTERFACES
// ===============================

export type { Entree, EntreeLigne };

// ===============================
// PARAMÈTRES DE RECHERCHE
// ===============================

export interface EntreeParams {
  page?: number;
  search?: string;

  fournisseur?: string;
  fou_code?: string;
  code?: string;

  date_debut?: string;
  date_fin?: string;

  mode_paye?: string;
  facture?: string;

  ordering?: string;
}

// ===============================
// RÉPONSE DJANGO
// ===============================

export interface EntreeResponse {
  status: boolean;
  message: string;
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  entree: Entree[];
}

// ===============================
// SERVICE
// ===============================

// À adapter selon ton URL Django réelle
const ENDPOINT = "/api/entree_stock/";

export const entreeService = {
  /**
   * Récupérer les entrées fournisseurs
   * avec pagination et filtres Django.
   */
  async getEntrees(params: EntreeParams = {}): Promise<EntreeResponse> {
    const queryParams: Record<string, string> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams[key] = String(value);
      }
    });

    const response = await apiFetch(
      ENDPOINT,
      {
        method: "GET",
      },
      queryParams,
    );

    if (!response.status) {
      throw new Error(
        response.message ||
          "Erreur lors de la récupération des entrées fournisseurs",
      );
    }

    return response as EntreeResponse;
  },

  /**
   * Récupérer une page précise.
   */
  async getPage(page: number): Promise<EntreeResponse> {
    return this.getEntrees({ page });
  },

  /**
   * Rechercher des entrées fournisseurs.
   */
  async rechercher(search: string, page = 1): Promise<EntreeResponse> {
    return this.getEntrees({
      search,
      page,
    });
  },

  /**
   * Filtrer les entrées par période.
   */
  async filtrerParDate(
    date_debut: string,
    date_fin: string,
    page = 1,
  ): Promise<EntreeResponse> {
    return this.getEntrees({
      date_debut,
      date_fin,
      page,
    });
  },

  /**
   * Filtrer les entrées par fournisseur.
   */
  async filtrerParFournisseur(
    fou_code: string,
    page = 1,
  ): Promise<EntreeResponse> {
    return this.getEntrees({
      fou_code,
      page,
    });
  },

  /**
   * Filtrer les entrées par mode de paiement.
   */
  async filtrerParModePaiement(
    mode_paye: string,
    page = 1,
  ): Promise<EntreeResponse> {
    return this.getEntrees({
      mode_paye,
      page,
    });
  },

  /**
   * Filtrer les entrées selon plusieurs critères.
   */
  async filtrer(params: EntreeParams): Promise<EntreeResponse> {
    return this.getEntrees({
      ...params,
      page: params.page ?? 1,
    });
  },

  /**
   * Récupérer une entrée avec toutes ses lignes.
   */
  async getEntreeById(id: number): Promise<Entree> {
    const response = await apiFetch(`${ENDPOINT}${id}/`, {
      method: "GET",
    });

    if (!response.status) {
      throw new Error(response.message || "Entrée fournisseur introuvable");
    }

    return (response.entree || response.data) as Entree;
  },

  /**
   * Modifier une entrée fournisseur.
   */
  async modifierEntree(id: number, donnees: Partial<Entree>): Promise<void> {
    const response = await apiFetch(`${ENDPOINT}${id}/`, {
      method: "PATCH",
      body: JSON.stringify(donnees),
    });

    if (!response.status) {
      throw new Error(
        response.message ||
          "Erreur lors de la modification de l'entrée fournisseur",
      );
    }
  },
};
