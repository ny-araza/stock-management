import { apiFetch } from "./api";

export interface DataUpdate {
  cmf_is_livre: boolean;
  cmf_is_paye: boolean;
  cmf_usermdf: string;
}

export default async function updateCF(
  vteId: number,
  data: DataUpdate,
) {
  const response = await apiFetch(`/api/update-cf/${vteId}/update/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (response?.error) {
    throw new Error(
      response.error || "Erreur lors de la mise à jour de la cf",
    );
  }

  return response;
}
