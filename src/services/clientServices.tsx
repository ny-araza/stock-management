import { apiFetch } from "./api";
import { Client } from "../interfaces/interfaces";

// ===============================
// INTERFACES
// ===============================

export type { Client };

// ===============================
// PARAMÈTRES DE RECHERCHE
// ===============================

export interface ClientParams {
  page?: number;
  search?: string;

  code?: string;
  nom?: string;

  cli_type?: string;
  cli_modepay?: string;
  cli_enabled?: boolean | "true" | "false";

  date_debut?: string;
  date_fin?: string;

  ordering?: string;
}

// ===============================
// RÉPONSE DJANGO
// ===============================

export interface ClientResponse {
  status: boolean;
  message: string;
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  clients: Client[];
}

// ===============================
// SERVICE
// ===============================

const ENDPOINT = "/api/clients/";

export const clientService = {
  /**
   * Récupérer les clients avec pagination et filtres.
   */
  async getClients(params: ClientParams = {}): Promise<ClientResponse> {
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
        response.message || "Erreur lors de la récupération des clients",
      );
    }

    return response as ClientResponse;
  },

  /**
   * Récupérer une page précise.
   */
  async getPage(page: number): Promise<ClientResponse> {
    return this.getClients({ page });
  },

  /**
   * Rechercher des clients.
   */
  async rechercher(search: string, page = 1): Promise<ClientResponse> {
    return this.getClients({
      search,
      page,
    });
  },

  /**
   * Filtrer les clients par type.
   */
  async filtrerParType(cli_type: string, page = 1): Promise<ClientResponse> {
    return this.getClients({
      cli_type,
      page,
    });
  },

  /**
   * Filtrer les clients par mode de paiement.
   */
  async filtrerParModePay(
    cli_modepay: string,
    page = 1,
  ): Promise<ClientResponse> {
    return this.getClients({
      cli_modepay,
      page,
    });
  },

  /**
   * Filtrer les clients actifs ou désactivés.
   */
  async filtrerParStatut(
    cli_enabled: boolean,
    page = 1,
  ): Promise<ClientResponse> {
    return this.getClients({
      cli_enabled,
      page,
    });
  },

  /**
   * Filtrer les clients par période.
   */
  async filtrerParDate(
    date_debut: string,
    date_fin: string,
    page = 1,
  ): Promise<ClientResponse> {
    return this.getClients({
      date_debut,
      date_fin,
      page,
    });
  },

  /**
   * Récupérer les clients selon plusieurs critères.
   */
  async filtrer(params: ClientParams): Promise<ClientResponse> {
    return this.getClients({
      ...params,
      page: params.page ?? 1,
    });
  },

  /**
   * Récupérer un client par son ID.
   */
  async getClientById(id: number): Promise<Client> {
    const response = await apiFetch(`${ENDPOINT}${id}/`, {
      method: "GET",
    });

    if (!response.status) {
      throw new Error(response.message || "Client introuvable");
    }

    return (response.client || response.data) as Client;
  },

  /**
   * Modifier un client.
   */
  async modifierClient(id: number, donnees: Partial<Client>): Promise<void> {
    const response = await apiFetch(`${ENDPOINT}${id}/`, {
      method: "PATCH",
      body: JSON.stringify(donnees),
    });

    if (!response.status) {
      throw new Error(
        response.message || "Erreur lors de la modification du client",
      );
    }
  },
};
