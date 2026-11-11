import { apiFetch } from "./api";
import { RtcType, RtcLigne } from "../interfaces/interfaces";

// ===============================
// INTERFACES
// ===============================

export type { RtcType, RtcLigne };

// ===============================
// PARAMÈTRES DE RECHERCHE
// ===============================

export interface RtfParams {
  page?: number;
  search?: string;

  cli_code?: string;
  client?: string;
  code?: string;

  date_debut?: string;
  date_fin?: string;

  facture?: string;
  vte_code?: string;

  modepaye?: string;

  ordering?: string;
}

// ===============================
// RÉPONSE DJANGO
// ===============================

export interface RtfResponse {
  status: boolean;
  message: string;
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  retour_client: RtcType[];
}

// ===============================
// SERVICE
// ===============================

// À adapter selon ton URL Django réelle
const ENDPOINT = "/api/retours_client/";

export const retourClientService = {
  /**
   * Récupérer les retours clients
   * avec pagination et filtres Django.
   */
  async getRetours(params: RtfParams = {}): Promise<RtfResponse> {
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
          "Erreur lors de la récupération des retours clients",
      );
    }

    return response as RtfResponse;
  },

  /**
   * Récupérer une page précise.
   */
  async getPage(page: number): Promise<RtfResponse> {
    return this.getRetours({ page });
  },

  /**
   * Rechercher des retours clients.
   */
  async rechercher(search: string, page = 1): Promise<RtfResponse> {
    return this.getRetours({
      search,
      page,
    });
  },

  /**
   * Filtrer les retours par période.
   */
  async filtrerParDate(
    date_debut: string,
    date_fin: string,
    page = 1,
  ): Promise<RtfResponse> {
    return this.getRetours({
      date_debut,
      date_fin,
      page,
    });
  },

  /**
   * Filtrer les retours par client.
   */
  async filtrerParClient(cli_code: string, page = 1): Promise<RtfResponse> {
    return this.getRetours({
      cli_code,
      page,
    });
  },

  /**
   * Filtrer les retours par facture.
   */
  async filtrerParFacture(facture: string, page = 1): Promise<RtfResponse> {
    return this.getRetours({
      facture,
      page,
    });
  },

  /**
   * Filtrer les retours par mode de paiement.
   */
  async filtrerParModePaye(modepaye: string, page = 1): Promise<RtfResponse> {
    return this.getRetours({
      modepaye,
      page,
    });
  },

  /**
   * Récupérer les retours selon plusieurs critères.
   */
  async filtrer(params: RtfParams): Promise<RtfResponse> {
    return this.getRetours({
      ...params,
      page: params.page ?? 1,
    });
  },

  /**
   * Récupérer un retour client avec toutes ses lignes.
   */
  async getRetourById(id: number): Promise<RtcType> {
    const response = await apiFetch(`${ENDPOINT}${id}/`, {
      method: "GET",
    });

    if (!response.status) {
      throw new Error(response.message || "Retour client introuvable");
    }

    return (response.retour || response.retour_client || response) as RtcType;
  },

  /**
   * Modifier un retour client.
   */
  async modifierRetour(id: number, donnees: Partial<RtcType>): Promise<void> {
    const response = await apiFetch(`${ENDPOINT}${id}/`, {
      method: "PATCH",
      body: JSON.stringify(donnees),
    });

    if (!response.status) {
      throw new Error(
        response.message || "Erreur lors de la modification du retour client",
      );
    }
  },
};
