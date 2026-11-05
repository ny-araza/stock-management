import { apiFetch } from "./api";

// ===============================
// INTERFACES
// ===============================

export interface VenteLigne {
  art_nom?: string;
  vtel_id: number;
  vtel_datecre: string;
  vtel_datemdf: string | null;
  vtel_usercre: string;
  vtel_usermdf: string | null;
  vtel_quantite: number;
  vtel_prixunit: number;
  vtel_ttc: number;
  vtel_art_code: string;
  vtel_pri_id: number;
  vtel_tva: number;
  vtel_ht: number;
  vtel_fou_code: string;
  vtel_lot_id: number;
  vtel_lot_code: string;
  vtel_lot_dateper: string;
  vtel_dateper: string | null;
  vtel_prix: string;
  vtel_cli_code: string;
  vtel_vte_code: string;
  vtel_remise: number;
  vtel_montant_tva?: number;
  vtel_montant_remise?: number;
  vtel_uid?: string;
  vtel_quantite_stock?: number;
  vtel_lot?: string;
}

export interface ListeVente {
  vte_id: number;
  vte_code: string;
  vte_datecre: string;
  vte_datemd: string;
  vte_usercre: string;
  vte_usermdf: string;
  vte_date: string;
  vte_modepaye: string;
  vte_montant_ht: string;
  vte_montant_ttc: string;
  vte_tva: number;
  vte_cli_code: string;
  vte_cli_nom: string;
  vte_cli_contact: string;
  vte_payeclient: string;
  vte_datepay: string;
  vte_telmoney: string;
  vte_valide: number | null;
  vte_paye: number | null;
  vte_datevalide: string;
  vte_livreur: string;
  vet_operateur: string;
  vte_lettremontant: string;
  ve_dateecheance: string;
  ve_code_bl: string;
  ve_adresse_liv: string;
  ve_remise: number;
  ve_proforma: string;
  lignes: VenteLigne[];
}

// ===============================
// PARAMÈTRES DE RECHERCHE
// ===============================

export interface VenteParams {
  page?: number;
  search?: string;

  client?: string;
  cli_code?: string;
  code?: string;

  date_debut?: string;
  date_fin?: string;

  paye?: 0 | 1;
  valide?: 0 | 1;

  mode_paye?: string;
  paye_client?: string;
  operateur?: string;

  ordering?: string;
}

// ===============================
// RÉPONSE DJANGO
// ===============================

export interface VenteResponse {
  status: boolean;
  message: string;
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  ventes: ListeVente[];
}

// ===============================
// SERVICE
// ===============================

const ENDPOINT = "/api/ventes/";

export const venteService = {
  /**
   * Récupérer les ventes avec pagination
   * et filtres Django.
   */
  async getVentes(params: VenteParams = {}): Promise<VenteResponse> {
    const queryParams: Record<string, string> = {};

    Object.entries(params).forEach(([key, value]) => {
      // Ignorer les valeurs vides et undefined
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
        response.message || "Erreur lors de la récupération des ventes",
      );
    }

    return response as VenteResponse;
  },

  /**
   * Récupérer une page précise.
   */
  async getPage(page: number): Promise<VenteResponse> {
    return this.getVentes({ page });
  },

  /**
   * Rechercher des ventes.
   */
  async rechercher(search: string, page = 1): Promise<VenteResponse> {
    return this.getVentes({
      search,
      page,
    });
  },

  /**
   * Filtrer les ventes par période.
   */
  async filtrerParDate(
    date_debut: string,
    date_fin: string,
    page = 1,
  ): Promise<VenteResponse> {
    return this.getVentes({
      date_debut,
      date_fin,
      page,
    });
  },

  /**
   * Récupérer uniquement les ventes payées
   * ou non payées.
   */
  async filtrerParPaiement(paye: 0 | 1, page = 1): Promise<VenteResponse> {
    return this.getVentes({
      paye,
      page,
    });
  },

  async filtrerParPayeClient(paye_client: string, page = 1): Promise<VenteResponse> {
    return this.getVentes({
      paye_client,
      page,
    });
  },
  
  /**
   * Récupérer uniquement les ventes validées
   * ou non validées.
   */
  async filtrerParValidation(valide: 0 | 1, page = 1): Promise<VenteResponse> {
    return this.getVentes({
      valide,
      page,
    });
  },

  /**
   * Récupérer toutes les ventes selon
   * plusieurs critères simultanément.
   */
  async filtrer(params: VenteParams): Promise<VenteResponse> {
    return this.getVentes({
      ...params,
      page: params.page ?? 1,
    });
  },

  /**
   * Récupérer une vente avec toutes ses lignes
   */
  async getVenteById(id: number): Promise<ListeVente> {
    const response = await apiFetch(`${ENDPOINT}${id}/`, { method: "GET" });

    if (!response.status) {
      throw new Error(response.message || "Vente introuvable");
    }

    return response.vente as ListeVente;
  },

  /**
   * Enregistrer les modifications d'une vente
   */
  async modifierVente(id: number, donnees: Partial<ListeVente>): Promise<void> {
    const response = await apiFetch(`${ENDPOINT}${id}/`, {
      method: "PATCH",
      body: JSON.stringify(donnees),
    });

    if (!response.status) {
      throw new Error(response.message || "Erreur lors de la modification");
    }
  },
};
