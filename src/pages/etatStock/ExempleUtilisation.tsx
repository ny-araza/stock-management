import React from 'react';
import { StockOverviewPanel, StockArticle } from './index';

// Remplacez ceci par vos données réelles, ex: via apiFetch('/api/articles/stock/')
const articlesExemple: StockArticle[] = [
  {
    id: '1',
    nom: 'Riz local 50kg',
    reference: 'ART-001',
    entree: 40,
    sortie: 12,
    stockActuel: 8,
    stockMin: 15,
    stockMax: 100,
    unite: 'sacs',
  },
  {
    id: '2',
    nom: 'Huile de cuisine 1L',
    reference: 'ART-014',
    entree: 0,
    sortie: 25,
    stockActuel: 0,
    stockMin: 10,
    stockMax: 80,
    unite: 'bouteilles',
  },
  {
    id: '3',
    nom: 'Savon de Marseille',
    reference: 'ART-022',
    entree: 60,
    sortie: 5,
    stockActuel: 120,
    stockMin: 20,
    stockMax: 100,
    unite: 'pcs',
  },
  {
    id: '4',
    nom: 'Farine de blé 1kg',
    reference: 'ART-009',
    entree: 15,
    sortie: 10,
    stockActuel: 45,
    stockMin: 20,
    stockMax: 120,
    unite: 'pcs',
  },
];

export default function ExempleUtilisation() {
  return (
    <div className="mx-auto p-1">
      <StockOverviewPanel articles={articlesExemple} title="État du stock — Articles" />
    </div>
  );
}
