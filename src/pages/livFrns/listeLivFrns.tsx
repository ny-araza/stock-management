import React, { useEffect, useState } from "react";
import {
  Search,
  CalendarDays,
  Pencil,
  ChevronDown,
  ChevronRight,
  X,
  ShoppingCart,
  Filter,
  RefreshCw,
  FileText,
  Truck,
  CreditCard,
} from "lucide-react";

import { Entree, EntreeLigne } from "../../services/livFrnsService";

// ======================================
// PROPS
// ======================================

interface ListeLivFrnsProps {
  entrees: Entree[];
  loading?: boolean;
  error?: string | null;

  page: number;
  totalPages: number;
  totalCount: number;

  onModifier: (entree: Entree) => void;
  onPaye: (entree: Entree) => void;

  onFiltrer: (filters: Record<string, any>) => void;
  onPageChange: (page: number) => void;
  onRefresh?: () => void;
}

// ======================================
// FORMATAGE
// ======================================

const formatMontant = (montant: string | number | null | undefined) => {
  return (
    new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(Number(montant) || 0) + " Ar"
  );
};

const formatDate = (date?: string | null) => {
  if (!date) return "-";

  const d = new Date(date);

  if (isNaN(d.getTime())) return date;

  return d.toLocaleDateString("fr-FR");
};

// ======================================
// COMPOSANT
// ======================================

export default function ListeLivFrns({
  entrees,
  loading = false,
  error = null,
  page,
  totalPages,
  totalCount,
  onModifier,
  onPaye,
  onFiltrer,
  onPageChange,
  onRefresh,
}: ListeLivFrnsProps) {
  const [recherche, setRecherche] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [modePaye, setModePaye] = useState("");
  const [entreeOuverte, setEntreeOuverte] = useState<number | null>(null);

  // ======================================
  // FILTRES
  // ======================================

  const appliquerFiltres = (
    overrides: {
      dateDebut?: string;
      dateFin?: string;
      modePaye?: string;
    } = {},
  ) => {
    const debut = overrides.dateDebut ?? dateDebut;
    const fin = overrides.dateFin ?? dateFin;
    const mode = overrides.modePaye ?? modePaye;

    onFiltrer({
      search: recherche.trim(),
      date_debut: debut,
      date_fin: fin,
      mode_paye: mode,
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      appliquerFiltres();
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche]);

  const resetFiltres = () => {
    setRecherche("");
    setDateDebut("");
    setDateFin("");
    setModePaye("");

    onFiltrer({});
  };

  const nombreFiltres = [recherche, dateDebut, dateFin, modePaye].filter(
    Boolean,
  ).length;

  // ======================================
  // STATUT PAIEMENT
  // ======================================

  const getStatutPaiement = (entree: Entree) => {
    if (entree.ent_is_paye) {
      return {
        label: "Payé",
        style: "bg-green-100 text-green-700",
      };
    } else {
      return {
        label: "Pas encore payé",
        style: "bg-orange-100 text-red-700",
      };
    }
  };

  // ======================================
  // CALCULS
  // ======================================

  const getTotalArticles = (entree: Entree) => {
    return entree.lignes?.length || 0;
  };

  const getQuantiteTotale = (entree: Entree) => {
    return (
      entree.lignes?.reduce(
        (total, ligne) => total + Number(ligne.entl_quantite || 0),
        0,
      ) || 0
    );
  };

  // ======================================
  // RENDU
  // ======================================

  return (
    <div className="w-full space-y-5">
      {/* EN-TÊTE */}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Liste des entrées fournisseurs
          </h2>

          <p className="text-sm text-gray-500">
            Consultez et gérez les entrées de marchandises fournisseurs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              title="Actualiser"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </button>
          )}

          <div className="rounded-lg bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
            {totalCount} entrée(s)
          </div>
        </div>
      </div>

      {/* FILTRES */}

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-gray-700">
            <Filter size={17} />
            Filtres
          </div>

          {nombreFiltres > 0 && (
            <button
              onClick={resetFiltres}
              className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
            >
              <X size={15} />
              Réinitialiser
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {/* RECHERCHE */}

          <div className="relative lg:col-span-3">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un code, une facture, un fournisseur..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-500"
            />
          </div>

          {/* DATE DÉBUT */}

          <div className="relative">
            <CalendarDays
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="date"
              value={dateDebut}
              max={dateFin || undefined}
              onChange={(e) => {
                setDateDebut(e.target.value);
                appliquerFiltres({
                  dateDebut: e.target.value,
                });
              }}
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm"
              aria-label="Date de début"
            />
          </div>

          {/* DATE FIN */}

          <div className="relative">
            <CalendarDays
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="date"
              value={dateFin}
              min={dateDebut || undefined}
              onChange={(e) => {
                setDateFin(e.target.value);
                appliquerFiltres({
                  dateFin: e.target.value,
                });
              }}
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm"
              aria-label="Date de fin"
            />
          </div>

          {/* MODE DE PAIEMENT */}

          <select
            value={modePaye}
            onChange={(e) => {
              setModePaye(e.target.value);
              appliquerFiltres({
                modePaye: e.target.value,
              });
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">Tous les modes de paiement</option>
            <option value="1">Espèces</option>
            <option value="2">Chèque</option>
            <option value="3">Virement</option>
          </select>
        </div>
      </div>

      {/* ERREUR */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* TABLEAU */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="w-10 px-4 py-4"></th>
                <th className="px-4 py-4">Code entrée</th>
                <th className="px-4 py-4">Date entrée</th>
                <th className="px-4 py-4">Facture</th>
                <th className="px-4 py-4">Fournisseur</th>
                <th className="px-4 py-4">Bon de commande</th>
                <th className="px-4 py-4 text-center">Articles</th>
                <th className="px-4 py-4 text-center">Quantité</th>
                <th className="px-4 py-4 text-right">Montant HT</th>
                <th className="px-4 py-4 text-right">Montant TTC</th>
                <th className="px-4 py-4 text-center">Paiement</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center">
                    <RefreshCw
                      size={25}
                      className="mx-auto mb-3 animate-spin text-brand-500"
                    />

                    <p className="text-gray-500">Chargement des entrées...</p>
                  </td>
                </tr>
              ) : entrees.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center">
                    <ShoppingCart
                      size={35}
                      className="mx-auto mb-3 text-gray-300"
                    />

                    <p className="font-medium text-gray-600">
                      Aucune entrée trouvée
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Modifiez vos critères de recherche.
                    </p>
                  </td>
                </tr>
              ) : (
                entrees.map((entree) => {
                  const statut = getStatutPaiement(entree);

                  return (
                    <React.Fragment key={entree.ent_id}>
                      <tr className="transition hover:bg-brand-50/40">
                        {/* DÉTAILS */}

                        <td className="px-4 py-4">
                          <button
                            onClick={() =>
                              setEntreeOuverte(
                                entreeOuverte === entree.ent_id
                                  ? null
                                  : entree.ent_id,
                              )
                            }
                            className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
                          >
                            {entreeOuverte === entree.ent_id ? (
                              <ChevronDown size={18} />
                            ) : (
                              <ChevronRight size={18} />
                            )}
                          </button>
                        </td>

                        {/* CODE */}

                        <td className="px-4 py-4 font-semibold text-brand-700">
                          {entree.ent_code}
                        </td>

                        {/* DATE */}

                        <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                          {formatDate(entree.ent_date)}
                        </td>

                        {/* FACTURE */}

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <FileText size={15} className="text-gray-400" />
                            <span className="font-medium text-gray-700">
                              {entree.ent_facture || "-"}
                            </span>
                          </div>
                        </td>

                        {/* FOURNISSEUR */}

                        <td className="px-4 py-4">
                          <p className="font-medium text-gray-800">
                            {entree.fournisseur?.fou_nom || entree.ent_fou_code}
                          </p>

                          <p className="text-xs text-gray-400">
                            {entree.ent_fou_code}
                          </p>
                        </td>

                        {/* BON DE COMMANDE */}

                        <td className="px-4 py-4">
                          {entree.ent_cmf_code || "-"}
                        </td>

                        {/* ARTICLES */}

                        <td className="px-4 py-4 text-center">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                            {getTotalArticles(entree)}
                          </span>
                        </td>

                        {/* QUANTITÉ */}

                        <td className="px-4 py-4 text-center font-medium text-gray-700">
                          {getQuantiteTotale(entree)}
                        </td>

                        {/* MONTANT HT */}

                        <td className="whitespace-nowrap px-4 py-4 text-right text-gray-600">
                          {formatMontant(entree.ent_montant_ht)}
                        </td>

                        {/* MONTANT TTC */}

                        <td className="whitespace-nowrap px-4 py-4 text-right font-semibold text-gray-800">
                          {formatMontant(entree.ent_montant_ttc)}
                        </td>

                        {/* STATUT */}

                        <td className="px-4 py-4 text-center">
                          <span
                            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statut.style}`}
                          >
                            {statut.label}
                          </span>
                        </td>

                        {/* ACTIONS */}

                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onModifier(entree)}
                              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700"
                            >
                              <Pencil size={14} />
                              Modifier
                            </button>

                            {!entree.ent_is_paye && (
                                <button
                                  onClick={() => onPaye(entree)}
                                  className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800"
                                >
                                  <CreditCard size={14} />
                                  Payer
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>

                      {/* DÉTAILS DES ARTICLES */}

                      {entreeOuverte === entree.ent_id && (
                        <tr className="bg-gray-50">
                          <td colSpan={12} className="px-8 py-5">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                              <h4 className="font-semibold text-gray-700">
                                Articles de l'entrée {entree.ent_code}
                              </h4>

                              <span className="text-xs text-gray-500">
                                {getTotalArticles(entree)} article(s)
                              </span>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                              <table className="w-full min-w-[900px] text-sm">
                                <thead className="bg-gray-100 text-xs text-gray-500">
                                  <tr>
                                    <th className="px-4 py-3">Code article</th>
                                    <th className="px-4 py-3">Lot</th>
                                    <th className="px-4 py-3">
                                      Date péremption
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                      Quantité
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                      Prix unitaire
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                      Remise
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                      TVA
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                      Total HT
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                      Total TTC
                                    </th>
                                  </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                  {entree.lignes?.map((ligne: EntreeLigne) => (
                                    <tr key={ligne.entl_id}>
                                      <td className="px-4 py-3 font-medium text-gray-700">
                                        {ligne.entl_art_code}
                                      </td>

                                      <td className="px-4 py-3 text-gray-600">
                                        {ligne.entl_lot || "-"}
                                      </td>

                                      <td className="px-4 py-3 text-gray-600">
                                        {formatDate(ligne.entl_dateper)}
                                      </td>

                                      <td className="px-4 py-3 text-right">
                                        {ligne.entl_quantite}
                                      </td>

                                      <td className="px-4 py-3 text-right">
                                        {formatMontant(ligne.entl_prixunit)}
                                      </td>

                                      <td className="px-4 py-3 text-right">
                                        {formatMontant(
                                          ligne.entl_montant_remise || 0,
                                        )}
                                      </td>

                                      <td className="px-4 py-3 text-right">
                                        {formatMontant(
                                          (ligne.entl_tva / 100) *
                                            ligne.entl_ht,
                                        )}
                                      </td>

                                      <td className="px-4 py-3 text-right">
                                        {formatMontant(ligne.entl_ht)}
                                      </td>

                                      <td className="px-4 py-3 text-right font-semibold">
                                        {formatMontant(ligne.entl_ttc)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* INFORMATIONS PAIEMENT */}

                            <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-3">
                              <div>
                                <p className="text-xs text-gray-400">
                                  Mode de paiement
                                </p>
                                <p className="font-medium text-gray-700">
                                  {entree.ent_modepaye || "-"}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-gray-400">
                                  {!entree.ent_is_paye &&
                                    !(entree.ent_date == entree.ent_datepay) &&
                                    "Doit payé avant ou le :"}
                                  {entree.ent_date == entree.ent_datepay &&
                                    "Payé le:"}
                                </p>
                                <p className="font-medium text-gray-700">
                                  {formatDate(entree.ent_datepay)}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PIED DU TABLEAU */}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-4 py-3">
          <span className="text-xs text-gray-500">
            {totalCount} entrée(s) au total
          </span>

          <span className="text-xs font-medium text-gray-600">
            Total TTC de cette page :{" "}
            {formatMontant(
              entrees.reduce(
                (total, entree) => total + Number(entree.ent_montant_ttc || 0),
                0,
              ),
            )}
          </span>
        </div>
      </div>

      {/* PAGINATION */}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <span className="text-sm text-gray-500">
          Page {page} sur {totalPages}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(1)}
            disabled={page <= 1 || loading}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40"
          >
            Première
          </button>

          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40"
          >
            Précédent
          </button>

          <span className="rounded-lg bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
            {page}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40"
          >
            Suivant
          </button>

          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages || loading}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40"
          >
            Dernière
          </button>
        </div>
      </div>
    </div>
  );
}
