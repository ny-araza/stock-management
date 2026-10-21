import { apiFetch } from "../services/api";

const deduireQuantiteLot = async (
  lotId: number,
  artCode: string,
  quantite: number,
  op: string
) => {
  try {
    const response = await apiFetch("/api/lots/deduire-quantite/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lot_id: lotId,
        art_code: artCode,
        quantite,
        op: op
      }),
    });

    // apiFetch retourne déjà le JSON
    return response;
  } catch (error) {
    console.error("Erreur déduction lot :", error);
    throw error;
  }
};

export default deduireQuantiteLot;
