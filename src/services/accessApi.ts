import { apiFetch } from "./api";
import type { Menu, Permission } from "../pages/userManagement/typeUser";

export const accessApi = {
  // Récupération des menus
  menus: async (): Promise<Menu[]> => {
    const res = await apiFetch("/api/access/menus/");
    return res as Menu[];
  },

  // Récupération des autorisations
  profile: async (code: string): Promise<Permission[]> => {
    const res = await apiFetch(
      `/api/access/profiles/${encodeURIComponent(code)}/`,
    );
    return res as Permission[];
  },

  // Enregistrement des nouvelles autorisations
  saveProfile: (code: string, permissions: Permission[]) =>
    apiFetch(`/api/access/profiles/${encodeURIComponent(code)}/`, {
      method: "PUT",
      body: JSON.stringify({ permissions }),
    }),
};
