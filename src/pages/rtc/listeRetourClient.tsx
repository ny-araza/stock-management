import React, { useEffect, useState } from "react";
import {
  Search,
  CalendarDays,
  Pencil,
  ChevronDown,
  ChevronRight,
  X,
  ClipboardList,
  Filter,
  RefreshCw,
} from "lucide-react";
import { RtcLigne, RtcType } from "../../interfaces/interfaces";



// ======================================
// PROPS
// ======================================

interface ListeRetourClientProps {
  listeRetourClient: RtcType[];
  loading?: boolean;
  error?: string | null;

  page: number;
  totalPages: number;
  totalCount: number;

  onModifier: (retour: RtcType) => void;
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
  if (Number.isNaN(d.getTime())) return date;

  return d.toLocaleDateString("fr-FR");
};

const formatNombre = (valeur: string | number | null | undefined) => {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(Number(valeur) || 0);
};

// ======================================
// COMPOSANT
// ======================================

export default function ListeRetourClient({
  listeRetourClient,
  loading = false,
  error = null,
  page,
  totalPages,
  totalCount,
  onModifier,
  onFiltrer,
  onPageChange,
  onRefresh,
}: ListeRetourClientProps) {
  const [recherche, setRecherche] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [retourOuvert, setRetourOuvert] = useState<number | null>(null);

  // ======================================
  // FILTRES
  // ======================================

  const appliquerFiltres = (
    overrides: {
      dateDebut?: string;
      dateFin?: string;
    } = {},
  ) => {
    const debut = overrides.dateDebut ?? dateDebut;
    const fin = overrides.dateFin ?? dateFin;

    onFiltrer({
      search: recherche.trim(),
      date_debut: debut,
      date_fin: fin,
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => appliquerFiltres(), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche]);

  const resetFiltres = () => {
    setRecherche("");
    setDateDebut("");
    setDateFin("");
    onFiltrer({});
  };

  const nombreFiltres = [recherche, dateDebut, dateFin].filter(Boolean).length;

  // ======================================
  // LIGNES DU RETOUR
  // ======================================

  const getLignes = (retour: RtcType): RtcLigne[] => {
    return retour.lignes ?? [];
  };

  // ======================================
  // RENDU
  // ======================================

  return (
    <div className="w-full space-y-5">
      {/* EN-TÊTE */}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Liste des retours clients
          </h2>
          <p className="text-sm text-gray-500">
            Consultez et gérez les retours effectués par vos clients.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700"
              title="Actualiser"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </button>
          )}

          <div className="rounded-lg bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
            {totalCount} retour(s)
          </div>
        </div>
      </div>

      {/* FILTRES */}

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-dark dark:text-white">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-white">
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
              placeholder="Rechercher un code, un client, une facture..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-dark"
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
                appliquerFiltres({ dateDebut: e.target.value });
              }}
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm dark:border-gray-700 dark:bg-gray-dark"
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
                appliquerFiltres({ dateFin: e.target.value });
              }}
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm dark:border-gray-700 dark:bg-gray-dark"
              aria-label="Date de fin"
            />
          </div>
        </div>
      </div>

      {/* ERREUR */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* TABLEAU */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-dark dark:text-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-600 dark:text-white">
              <tr>
                <th className="w-10 px-4 py-4"></th>
                <th className="px-4 py-4">Code retour</th>
                <th className="px-4 py-4">Date</th>
                <th className="px-4 py-4">Client</th>
                <th className="px-4 py-4">Facture / Vente</th>
                <th className="px-4 py-4">Motif</th>
                <th className="px-4 py-4 text-center">Articles</th>
                <th className="px-4 py-4 text-center">Mode paiement</th>
                <th className="px-4 py-4 text-right">Montant HT</th>
                <th className="px-4 py-4 text-right">Montant TTC</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center">
                    <RefreshCw
                      size={25}
                      className="mx-auto mb-3 animate-spin text-brand-500"
                    />
                    <p className="text-gray-500">
                      Chargement des retours clients...
                    </p>
                  </td>
                </tr>
              ) : listeRetourClient.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center">
                    <ClipboardList
                      size={35}
                      className="mx-auto mb-3 text-gray-300"
                    />
                    <p className="font-medium text-gray-600 dark:text-white">
                      Aucun retour client trouvé
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Modifiez vos critères de recherche.
                    </p>
                  </td>
                </tr>
              ) : (
                listeRetourClient.map((retour) => {
                  const lignes = getLignes(retour);
                  const estOuvert = retourOuvert === retour.rtc_id;

                  return (
                    <React.Fragment key={retour.rtc_id}>
                      <tr className="transition hover:bg-brand-50/40 dark:border-gray-700">
                        {/* DÉTAILS */}

                        <td className="px-4 py-4">
                          <button
                            onClick={() =>
                              setRetourOuvert(estOuvert ? null : retour.rtc_id)
                            }
                            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label={
                              estOuvert
                                ? "Masquer les articles"
                                : "Afficher les articles"
                            }
                          >
                            {estOuvert ? (
                              <ChevronDown size={18} />
                            ) : (
                              <ChevronRight size={18} />
                            )}
                          </button>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-brand-700 dark:text-brand-200">
                          {retour.rtc_code}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-gray-600 dark:text-white">
                          {formatDate(retour.rtc_date)}
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-medium text-gray-800 dark:text-white">
                            {retour.rtc_cli_nom || retour.rtc_cli_code || "-"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {retour.rtc_cli_code}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-gray-600 dark:text-white">
                          <p>{retour.rtc_facture || "-"}</p>
                          {retour.rtc_vte_code && (
                            <p className="text-xs text-gray-400">
                              Vente : {retour.rtc_vte_code}
                            </p>
                          )}
                        </td>

                        <td className="max-w-[180px] px-4 py-4 text-gray-600 dark:text-white">
                          <span className="line-clamp-2">
                            {retour.rtc_motif || "-"}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-center">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-white">
                            {lignes.length}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-center text-gray-600 dark:text-white">
                          {retour.rtc_modepaye || "-"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-right text-gray-600 dark:text-white">
                          {formatMontant(retour.rtc_montant_ht)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-right font-semibold text-gray-800 dark:text-white">
                          {formatMontant(retour.rtc_montant_ttc)}
                        </td>

                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => onModifier(retour)}
                            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700"
                          >
                            <Pencil size={14} />
                            Modifier
                          </button>
                        </td>
                      </tr>

                      {/* DÉTAILS DES ARTICLES DU RETOUR */}

                      {estOuvert && (
                        <tr className="bg-gray-50 dark:bg-gray-800/40">
                          <td
                            colSpan={11}
                            className="px-8 py-5 dark:bg-gray-dark"
                          >
                            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <h4 className="font-semibold text-gray-700 dark:text-white">
                                Articles du retour {retour.rtc_code}
                              </h4>
                              <span className="text-xs text-gray-500">
                                {retour.rtc_observation || "Aucune observation"}
                              </span>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-dark dark:text-white">
                              <table className="w-full min-w-[950px] text-sm">
                                <thead className="bg-gray-100 text-xs text-gray-500 dark:bg-gray-700 dark:text-white">
                                  <tr>
                                    <th className="px-4 py-3">Code article</th>
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
                                    <th className="px-4 py-3">Lot</th>
                                    <th className="px-4 py-3">Péremption</th>
                                  </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                  {lignes.map((ligne) => (
                                    <tr key={ligne.rtcl_id}>
                                      <td className="px-4 py-3 font-medium text-gray-700 dark:text-white">
                                        {ligne.rtcl_art_code}
                                      </td>

                                      <td className="px-4 py-3 text-right">
                                        {formatNombre(ligne.rtcl_quantite)}
                                      </td>

                                      <td className="whitespace-nowrap px-4 py-3 text-right">
                                        {formatMontant(ligne.rtcl_prixunit)}
                                      </td>

                                      <td className="whitespace-nowrap px-4 py-3 text-right">
                                        {formatMontant(ligne.rtcl_remise)}
                                      </td>

                                      <td className="whitespace-nowrap px-4 py-3 text-right">
                                        {formatMontant(ligne.rtcl_tva)}
                                      </td>

                                      <td className="whitespace-nowrap px-4 py-3 text-right">
                                        {formatMontant(ligne.rtcl_ht)}
                                      </td>

                                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                                        {formatMontant(ligne.rtcl_ttc)}
                                      </td>

                                      <td className="px-4 py-3">
                                        {ligne.rtcl_lot || "-"}
                                      </td>

                                      <td className="whitespace-nowrap px-4 py-3">
                                        {formatDate(ligne.rtcl_dateper)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
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

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-dark dark:text-white">
          <span className="text-xs text-gray-500">
            {totalCount} retour(s) au total
          </span>

          <span className="text-xs font-medium text-gray-600 dark:text-white">
            Total TTC de cette page :{" "}
            {formatMontant(
              listeRetourClient.reduce(
                (total, retour) => total + Number(retour.rtc_montant_ttc || 0),
                0,
              ),
            )}
          </span>
        </div>
      </div>

      {/* PAGINATION */}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-dark">
        <span className="text-sm text-gray-500">
          Page {page} sur {totalPages}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(1)}
            disabled={page <= 1 || loading}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-dark dark:text-white"
          >
            Première
          </button>

          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-dark dark:text-white"
          >
            Précédent
          </button>

          <span className="rounded-lg bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 dark:bg-gray-700 dark:text-white">
            {page}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-dark dark:text-white"
          >
            Suivant
          </button>

          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages || loading}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-dark dark:text-white"
          >
            Dernière
          </button>
        </div>
      </div>
    </div>
  );
}
