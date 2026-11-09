import { apiFetch } from "./api";
import { BCAutoComplete, CFLigneArticle } from "../interfaces/interfaces";

// ===============================
// INTERFACES
// ===============================

export type { BCAutoComplete, CFLigneArticle };

// ===============================
// PARAMÈTRES DE RECHERCHE
// ===============================

export interface BCAutoParams {
  page?: number;
  search?: string;

  fournisseur?: string;
  fou_code?: string;
  code?: string;

  date_debut?: string;
  date_fin?: string;

  is_livre?: boolean | "true" | "false";

  mode_cmd?: string;

  ordering?: string;
}

// ===============================
// RÉPONSE DJANGO
// ===============================

export interface BCAutoResponse {
  status: boolean;
  message: string;
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  commandes: BCAutoComplete[];
}

// ===============================
// SERVICE
// ===============================

// À adapter selon ton URL Django réelle
const ENDPOINT = "/api/bc-list/";

export const bcAutoService = {
  /**
   * Récupérer les bons de commande automatiques
   * avec pagination et filtres Django.
   */
  async getCommandes(params: BCAutoParams = {}): Promise<BCAutoResponse> {
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
          "Erreur lors de la récupération des bons de commande",
      );
    }

    return response as BCAutoResponse;
  },

  /**
   * Récupérer une page précise.
   */
  async getPage(page: number): Promise<BCAutoResponse> {
    return this.getCommandes({ page });
  },

  /**
   * Rechercher des bons de commande.
   */
  async rechercher(search: string, page = 1): Promise<BCAutoResponse> {
    return this.getCommandes({
      search,
      page,
    });
  },

  /**
   * Filtrer les commandes par période.
   */
  async filtrerParDate(
    date_debut: string,
    date_fin: string,
    page = 1,
  ): Promise<BCAutoResponse> {
    return this.getCommandes({
      date_debut,
      date_fin,
      page,
    });
  },

  /**
   * Récupérer uniquement les commandes livrées
   * ou non livrées.
   */
  async filtrerParLivraison(
    is_livre: boolean,
    page = 1,
  ): Promise<BCAutoResponse> {
    return this.getCommandes({
      is_livre,
      page,
    });
  },

  /**
   * Filtrer les commandes par fournisseur.
   */
  async filtrerParFournisseur(
    fou_code: string,
    page = 1,
  ): Promise<BCAutoResponse> {
    return this.getCommandes({
      fou_code,
      page,
    });
  },

  /**
   * Filtrer les commandes par mode de commande.
   */
  async filtrerParModeCommande(
    mode_cmd: string,
    page = 1,
  ): Promise<BCAutoResponse> {
    return this.getCommandes({
      mode_cmd,
      page,
    });
  },

  /**
   * Récupérer les commandes selon plusieurs critères.
   */
  async filtrer(params: BCAutoParams): Promise<BCAutoResponse> {
    return this.getCommandes({
      ...params,
      page: params.page ?? 1,
    });
  },

  /**
   * Récupérer un bon de commande avec toutes ses lignes.
   */
  async getCommandeById(id: number): Promise<BCAutoComplete> {
    const response = await apiFetch(`${ENDPOINT}${id}/`, {
      method: "GET",
    });

    if (!response.status) {
      throw new Error(response.message || "Bon de commande introuvable");
    }

    return (response.commande || response.bc_auto) as BCAutoComplete;
  },

  /**
   * Modifier un bon de commande.
   */
  async modifierCommande(
    id: number,
    donnees: Partial<BCAutoComplete>,
  ): Promise<void> {
    const response = await apiFetch(`${ENDPOINT}${id}/`, {
      method: "PATCH",
      body: JSON.stringify(donnees),
    });

    if (!response.status) {
      throw new Error(
        response.message || "Erreur lors de la modification du bon de commande",
      );
    }
  },
};
