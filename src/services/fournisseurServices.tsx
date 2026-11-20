import { apiFetch } from "./api";
import { Fourniseur } from "../interfaces/interfaces";

export interface FournisseurParams {
  page?: number;
  search?: string;
  fou_enabled?: string;
  fou_modepay?: string;
}

export interface FournisseurResponse {
  status: boolean;
  message?: string;
  fournisseurs: Fourniseur[];
  count: number;
  total_pages: number;
  next: string | null;
  previous: string | null;
}

export const fournisseurService = {
  async getFournisseurs(
    params: FournisseurParams = {},
  ): Promise<FournisseurResponse> {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, String(value));
      }
    });

    const res = await apiFetch(`/api/fournisseurs/?${query.toString()}`);

    if (!res.status) {
      throw new Error(
        res.message || "Impossible de récupérer les fournisseurs",
      );
    }

    // Le backend renvoie la clé "fournisseur" (singulier)
    return {
      ...res,
      fournisseurs: res.fournisseur || [],
    } as FournisseurResponse;
  },

  // Modification : PATCH /api/fournisseurs/<fou_id>/
  async updateFournisseur(
    id: number,
    data: Record<string, unknown>,
  ): Promise<{ status: boolean; message?: string; fournisseur?: Fourniseur }> {
    return await apiFetch(`/api/fournisseurs/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },
};
