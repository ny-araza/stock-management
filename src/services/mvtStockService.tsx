import { apiFetch } from "./api";

export interface MvtStockType {
  mvt_id: number;
  mvt_action: string | null;
  mvt_origine: string | null;
  mvt_datecre: string | null;
  mvt_datemdf: string | null;
  mvt_usercre: string | null;
  mvt_usermdf: string | null;
  mvt_code_org: string;
  mvt_qte: number;
  mvt_date: string;
  mvt_art_code: string | null;
  mvt_pri_id: number;
  mvt_lot_code: string | null;
}

export interface MvtStockResponse {
  status: boolean;
  message?: string;
  mvt_stock: MvtStockType[];
  count: number;
  next: string | null;
  previous: string | null;
  total_pages: number;
}

export interface MvtStockFilters {
  [key: string]: string | number | boolean | null | undefined;
}

export interface MvtStockParams {
  page?: number;
  search?: string;
  filters?: MvtStockFilters;
}

/**
 * Récupérer la liste des mouvements de stock
 */
export const fetchMvtStocks = async ({
  page = 1,
  search = "",
  filters = {},
}: MvtStockParams = {}): Promise<MvtStockResponse> => {
  const query = new URLSearchParams();

  query.set("page", String(page));

  if (search) {
    query.set("search", search);
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const res = await apiFetch(`/api/mvt_stockk/?${query.toString()}`);

  if (!res.status) {
    throw new Error(
      res.message || "Impossible de récupérer les mouvements de stock",
    );
  }

  return res;
};

/**
 * Récupérer un mouvement de stock par son ID
 */
export const fetchMvtStockById = async (id: number): Promise<MvtStockType> => {
  const res = await apiFetch(`/api/mvt_stockk/${id}/`);

  if (!res.status) {
    throw new Error(res.message || "Mouvement de stock introuvable");
  }

  return res.mvt_stock;
};

/**
 * Créer un mouvement de stock
 */
export const createMvtStock = async (
  data: Omit<MvtStockType, "mvt_id">,
): Promise<MvtStockType> => {
  const res = await apiFetch("/api/mvt_stockk/", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!res.status) {
    throw new Error(res.message || "Impossible de créer le mouvement de stock");
  }

  return res.mvt_stock;
};

/**
 * Modifier un mouvement de stock
 */
export const updateMvtStock = async (
  id: number,
  data: Partial<Omit<MvtStockType, "mvt_id">>,
): Promise<MvtStockType> => {
  const res = await apiFetch(`/api/mvt_stockk/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

  if (!res.status) {
    throw new Error(
      res.message || "Impossible de modifier le mouvement de stock",
    );
  }

  return res.mvt_stock;
};

/**
 * Supprimer un mouvement de stock
 */
export const deleteMvtStock = async (id: number): Promise<void> => {
  const res = await apiFetch(`/api/mvt_stockk/${id}/`, {
    method: "DELETE",
  });

  if (!res.status) {
    throw new Error(
      res.message || "Impossible de supprimer le mouvement de stock",
    );
  }
};
