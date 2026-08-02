export interface StockArticle {
  id: string;
  nom: string;
  reference?: string;
  entree: number;
  sortie: number;
  stockActuel: number;
  stockMin: number;
  stockMax?: number;
  unite?: string; // ex: "pcs", "kg", "L"
}

export type NiveauStock = 'critique' | 'faible' | 'normal' | 'excedent';

/**
 * Détermine le niveau de stock d'un article à partir de son stock
 * actuel comparé à ses seuils min/max.
 */
export function getNiveauStock(article: StockArticle): NiveauStock {
  const { stockActuel, stockMin, stockMax } = article;
  if (stockActuel <= 0) return 'critique';
  if (stockActuel <= stockMin) return 'faible';
  if (stockMax && stockActuel >= stockMax) return 'excedent';
  return 'normal';
}
