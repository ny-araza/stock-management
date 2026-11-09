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
  CheckIcon,
  Truck,
  DollarSign,
} from "lucide-react";

import {
  BCAutoComplete,
  Enumeration,
  EnumerationOption,
} from "../../interfaces/interfaces";
import { apiFetch } from "../../services/api";

// ======================================
// PROPS
// ======================================

interface ListeBCAutoProps {
  commandes: BCAutoComplete[];
  loading?: boolean;
  error?: string | null;

  page: number;
  totalPages: number;
  totalCount: number;

  onModifier: (commande: BCAutoComplete) => void;
  onLivrer: (commande: BCAutoComplete) => void;
  onPaye: (commande: BCAutoComplete) => void;

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

export default function ListeBC({
  commandes,
  loading = false,
  error = null,
  page,
  totalPages,
  totalCount,
  onModifier,
  onValidate,
  onLivrer,
  onFiltrer,
  onPageChange,
  onRefresh,
  onPaye,
}: ListeBCAutoProps) {
  const [recherche, setRecherche] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [livre, setLivre] = useState("");
  const [modeCommande, setModeCommande] = useState("");
  const [venteOuverte, setVenteOuverte] = useState<number | null>(null);

  // ======================================
  // FILTRES
  // ======================================

  const appliquerFiltres = (
    overrides: {
      dateDebut?: string;
      dateFin?: string;
      livre?: string;
      modeCommande?: string;
    } = {},
  ) => {
    const debut = overrides.dateDebut ?? dateDebut;
    const fin = overrides.dateFin ?? dateFin;
    const livraison = overrides.livre ?? livre;
    const mode = overrides.modeCommande ?? modeCommande;

    onFiltrer({
      search: recherche.trim(),
      date_debut: debut,
      date_fin: fin,
      mode_cmd: mode,
      is_livre: livraison,
    });
  };

  React.useEffect(() => {
    const timer = setTimeout(() => appliquerFiltres(), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche]);

  const resetFiltres = () => {
    setRecherche("");
    setDateDebut("");
    setDateFin("");
    setLivre("");
    setModeCommande("");
    onFiltrer({});
  };

  const nombreFiltres = [
    recherche,
    dateDebut,
    dateFin,
    livre,
    modeCommande,
  ].filter(Boolean).length;

  // ======================================
  // STATUT LIVRAISON
  // ======================================

  const getStatutLivraison = (commande: BCAutoComplete) => {
    if (commande.cmf_islivre) {
      return {
        label: "Livré",
        style: "bg-green-100 text-green-700",
      };
    }

    return {
      label: "Non livré",
      style: "bg-orange-100 text-orange-700",
    };
  };
  const [commandeEnum, setCommandEnum] = useState<Enumeration[]>([]);
  const enumerationCmd: EnumerationOption[] = commandeEnum.map(
    (item: Enumeration) => ({
      ...item,
      value: item.enu_id.toString(),
      label: item.enu_nom,
    }),
  );
  const fetchCommande = async (enu_code: string) => {
    try {
      const query = new URLSearchParams();
      query.set("enu_code", enu_code);
      const res = await apiFetch(
        `/api/generate-enumeration/?${query.toString()}`,
      );

      if (res.success) {
        setCommandEnum(res.nom_enumeration);
      }
    } catch (error: any) {
      console.log(error);
    }
  };

  const get_mode_cmd = (cf: BCAutoComplete) => {
    if (!enumerationCmd) return cf.cmf_modecmd;
    const enu_nom = enumerationCmd.filter(
      (elt) => elt.enu_id == Number(cf.cmf_modecmd),
    )[0]?.enu_nom;
    if (enu_nom) return enu_nom;
    return cf.cmf_modecmd;
  };

  useEffect(() => {
    fetchCommande("MODE_COM");
  }, []);
  // ======================================
  // RENDU
  // ======================================

  return (
    <div className="w-full space-y-5">
      {/* EN-TÊTE */}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Liste des bons de commande automatiques
          </h2>
          <p className="text-sm text-gray-500">
            Consultez et gérez vos bons de commande fournisseurs.
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
            {totalCount} commande(s)
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
              placeholder="Rechercher un code, un fournisseur..."
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
                appliquerFiltres({ dateDebut: e.target.value });
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
                appliquerFiltres({ dateFin: e.target.value });
              }}
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm"
              aria-label="Date de fin"
            />
          </div>

          {/* MODE COMMANDE */}

          <select
            value={modeCommande}
            onChange={(e) => {
              setModeCommande(e.target.value);
              appliquerFiltres({ modeCommande: e.target.value });
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">Tous les types de mode de paiements</option>
            {enumerationCmd.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          {/* LIVRAISON */}

          <select
            value={livre}
            onChange={(e) => {
              setLivre(e.target.value);
              appliquerFiltres({ livre: e.target.value });
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">Tous les statuts de livraison</option>
            <option value="true">Livrés</option>
            <option value="false">Non livrés</option>
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
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="w-10 px-4 py-4"></th>
                <th className="px-4 py-4">Code commande</th>
                <th className="px-4 py-4">Date</th>
                <th className="px-4 py-4">Date livraison prévue</th>
                <th className="px-4 py-4">Fournisseur</th>
                <th className="px-4 py-4 text-center">Articles</th>
                <th className="px-4 py-4 text-center">Mode commande</th>
                <th className="px-4 py-4 text-right">Montant HT</th>
                <th className="px-4 py-4 text-right">Montant TTC</th>
                <th className="px-4 py-4 text-center">Livraison</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center">
                    <RefreshCw
                      size={25}
                      className="mx-auto mb-3 animate-spin text-brand-500"
                    />
                    <p className="text-gray-500">Chargement des commandes...</p>
                  </td>
                </tr>
              ) : commandes.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center">
                    <ShoppingCart
                      size={35}
                      className="mx-auto mb-3 text-gray-300"
                    />
                    <p className="font-medium text-gray-600">
                      Aucune commande trouvée
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Modifiez vos critères de recherche.
                    </p>
                  </td>
                </tr>
              ) : (
                commandes.map((commande) => {
                  const statut = getStatutLivraison(commande);

                  return (
                    <React.Fragment key={commande.cmf_id}>
                      <tr className="transition hover:bg-brand-50/40">
                        {/* DÉTAILS */}

                        <td className="px-4 py-4">
                          <button
                            onClick={() =>
                              setVenteOuverte(
                                venteOuverte === commande.cmf_id
                                  ? null
                                  : commande.cmf_id,
                              )
                            }
                            className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
                          >
                            {venteOuverte === commande.cmf_id ? (
                              <ChevronDown size={18} />
                            ) : (
                              <ChevronRight size={18} />
                            )}
                          </button>
                        </td>

                        <td className="px-4 py-4 font-semibold text-brand-700">
                          {commande.cmf_code}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                          {formatDate(commande.cmf_date)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                          {formatDate(commande.cmf_dateliv)}
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-medium text-gray-800">
                            {commande.fournisseur?.fou_nom ||
                              commande.cmf_fou_code}
                          </p>
                          <p className="text-xs text-gray-400">
                            {commande.cmf_fou_code}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-center">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                            {commande.ligne?.length || 0}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-center text-gray-600">
                          {get_mode_cmd(commande) || "-"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-right text-gray-600">
                          {formatMontant(commande.cmf_montant_ht)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-right font-semibold text-gray-800">
                          {formatMontant(commande.cmf_montant_ttc)}
                        </td>

                        <td className="px-4 py-4 text-center">
                          <span
                            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statut.style}`}
                          >
                            {statut.label}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onModifier(commande)}
                              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700"
                            >
                              <Pencil size={14} />
                              Modifier
                            </button>

                            {/*{!commande.cmf_islivre && (
                              <button
                                onClick={() => onLivrer(commande)}
                                className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800"
                              >
                                <Truck size={14} />
                                Livrer
                              </button>
                            )}
                            {!commande.cmf_is_paye && (
                              <button
                                onClick={() => onPaye(commande)}
                                className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800"
                              >
                                <DollarSign size={14} />
                                Payer
                              </button>
                            )}*/}
                          </div>
                        </td>
                      </tr>

                      {/* DÉTAILS DES ARTICLES */}

                      {venteOuverte === commande.cmf_id && (
                        <tr className="bg-gray-50">
                          <td colSpan={11} className="px-8 py-5">
                            <h4 className="mb-3 font-semibold text-gray-700">
                              Articles de la commande {commande.cmf_code}
                            </h4>

                            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                              <table className="w-full min-w-[650px] text-sm">
                                <thead className="bg-gray-100 text-xs text-gray-500">
                                  <tr>
                                    <th className="px-4 py-3">Article</th>
                                    <th className="px-4 py-3">Code article</th>
                                    <th className="px-4 py-3 text-right">
                                      Quantité
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                      Prix unitaire
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                      Total TTC
                                    </th>
                                  </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                  {commande.ligne?.map((ligne, index) => (
                                    <tr key={index}>
                                      <td className="px-4 py-3 font-medium text-gray-700">
                                        {ligne.art_nom || ligne.cmfl_Art_Code}
                                      </td>

                                      <td className="px-4 py-3 text-gray-500">
                                        {ligne.cmfl_Art_Code}
                                      </td>

                                      <td className="px-4 py-3 text-right">
                                        {ligne.cmfl_Quantite}
                                      </td>

                                      <td className="px-4 py-3 text-right">
                                        {formatMontant(ligne.cmfl_PrixAchat)}
                                      </td>

                                      <td className="px-4 py-3 text-right font-medium">
                                        {formatMontant(ligne.cmfl_TotalTTC)}
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

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-4 py-3">
          <span className="text-xs text-gray-500">
            {totalCount} commande(s) au total
          </span>

          <span className="text-xs font-medium text-gray-600">
            Total TTC de cette page :{" "}
            {formatMontant(
              commandes.reduce(
                (total, commande) =>
                  total + Number(commande.cmf_montant_ttc || 0),
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
