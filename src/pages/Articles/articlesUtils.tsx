import { PrixUnite, UniteVente } from "./PrixUnitSection";

export type PrixUnites = Record<UniteVente, PrixUnite>;

export const emptyPrixUnites: PrixUnites = {
  PIECE: {
    unite: "PIECE",
    actif: true,
    prix_achat: "",
    taux_marge: "",
    tva: "20",
    colis: "",
  },
  GROS: {
    unite: "GROS",
    actif: false,
    prix_achat: "",
    taux_marge: "",
    tva: "20",
    colis: "",
  },
};

/** Marge = prix d'achat x taux ; Prix de vente = prix d'achat + marge */
export function calculerPrix(u: PrixUnite) {
  const achat = parseFloat(u.prix_achat) || 0;
  const taux = parseFloat(u.taux_marge) || 0;
  const marge = achat * (taux / 100);
  const prixVente = achat + marge;
  return { marge, prixVente };
}