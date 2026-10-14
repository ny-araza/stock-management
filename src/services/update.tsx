import { apiFetch } from "./api";

export interface DataUpdate {
  pro_islivre: boolean;
  pro_enabled: boolean;
  pro_usermdf: string;
}

export default async function mettreAJourDocument(
  name: string,
  proId: number,
  data: DataUpdate,
) {
  const response = await apiFetch(`/api/${name}/${proId}/update/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (response?.error) {
    throw new Error(
      response.error || "Erreur lors de la mise à jour de la proforma.",
    );
  }

  return response;
}
