import { Articles } from "../../interfaces/interfaces";

export interface StockArticle {
  stk_id: string;
  stk_art_code?: string;
  stk_nom_article: string;
  stk_lot_code: string;
  stk_pri_id: number;
  stk_quantite: number;
  stk_stockmini: number;
  stockMax?: number;
  unite?: string; // ex: "pcs", "kg", "L"
  article_table?: Articles;
}

export type NiveauStock = "critique" | "faible" | "normal" | "excedent";

/**
 * Détermine le niveau de stock d'un article à partir de son stock
 * actuel comparé à ses seuils min/max.
 */
export function getNiveauStock(article: StockArticle): NiveauStock {
  const { stk_quantite, stk_stockmini, stockMax } = article;
  if (stk_quantite <= 0) return "critique";
  if (stk_quantite <= stk_stockmini) return "faible";
  if (stockMax && stk_quantite >= stockMax) return "excedent";
  return "normal";
}
