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
  CheckCheckIcon,
  CheckIcon,
  DollarSign,
  Menu,
  FileText,
} from "lucide-react";

import { ListeVente, VenteParams } from "../../services/ventesService";
import { Enumeration, EnumerationOption } from "../../interfaces/interfaces";
import Select from "../../components/form/Select";
import { apiFetch } from "../../services/api";
import { Dropdown } from "../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../components/ui/dropdown/DropdownItem";
import Button from "../../components/ui/button/Button";

// ======================================
// PROPS
// ======================================

interface ListeVentesProps {
  ventes: ListeVente[];
  loading?: boolean;
  error?: string | null;

  page: number;
  totalPages: number;
  totalCount: number;

  onModifier: (vente: ListeVente) => void;
  onValidate: (vente: ListeVente) => void;
  onExportFacture: (vente: ListeVente, format: "pdf" | "png") => void;
  onPaye: (vente: ListeVente) => void;

  onFiltrer: (filters: Omit<VenteParams, "page">) => void;

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

export default function ListeVentes({
  ventes,
  loading = false,
  error = null,
  page,
  totalPages,
  totalCount,
  onModifier,
  onValidate,
  onExportFacture,
  onPaye,
  onFiltrer,
  onPageChange,
  onRefresh,
}: ListeVentesProps) {
  // Filtres locaux
  const [recherche, setRecherche] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const [paye, setPaye] = useState("");
  const [payeClient, setPayeClient] = useState("");
  const [valide, setValide] = useState("");

  const [modePaye, setModePaye] = useState("");

  const [venteOuverte, setVenteOuverte] = useState<number | null>(null);

  // ======================================
  // RECHERCHE AVEC DÉLAI
  // ======================================

  useEffect(() => {
    const timer = setTimeout(() => {
      appliquerFiltres();
    }, 400);

    return () => clearTimeout(timer);

    // La recherche est déclenchée lorsque ses critères changent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche]);

  // ======================================
  // CONSTRUCTION DES FILTRES
  // ======================================

  const appliquerFiltres = (
    overrides: {
      dateDebut?: string;
      dateFin?: string;
      paye?: string;
      paye_client?: string;
      valide?: string;
      modePaye?: string;
    } = {},
  ) => {
    const debut = overrides.dateDebut ?? dateDebut;
    const fin = overrides.dateFin ?? dateFin;
    const paiement = overrides.paye ?? paye;
    const paiementClient = overrides.paye_client ?? payeClient;
    const validation = overrides.valide ?? valide;
    const mode = overrides.modePaye ?? modePaye;
    console.log(overrides);
    const filters: Omit<VenteParams, "page"> = {
      search: recherche.trim(),
      date_debut: debut,
      date_fin: fin,
      mode_paye: mode,
      paye_client: paiementClient,
    };

    if (paiement !== "") {
      filters.paye = Number(paiement) as 0 | 1;
    }

    if (validation !== "") {
      filters.valide = Number(validation) as 0 | 1;
    }

    onFiltrer(filters);
  };

  // ======================================
  // RÉINITIALISER
  // ======================================

  const resetFiltres = () => {
    setRecherche("");
    setDateDebut("");
    setDateFin("");
    setPaye("");
    setPayeClient("");
    setValide("");
    setModePaye("");

    onFiltrer({});
  };

  const nombreFiltres = [
    recherche,
    dateDebut,
    dateFin,
    paye,
    payeClient,
    valide,
    modePaye,
  ].filter(Boolean).length;

  // ======================================
  // STATUT
  // ======================================

  const getStatutPaiement = (vente: ListeVente) => {
    if (vente.vte_paye === 1) {
      return {
        label: "Payée",
        style: "bg-green-100 text-green-700",
      };
    }

    return {
      label: "Non payée",
      style: "bg-orange-100 text-orange-700",
    };
  };

  const getStatutValidation = (vente: ListeVente) => {
    if (vente.vte_valide === 1) {
      return {
        label: "Validée",
        style: "bg-brand-100 text-brand-700",
      };
    }

    return {
      label: "Non validée",
      style: "bg-gray-100 text-gray-600",
    };
  };
  //payeClient
  const [payementEnum, setpayementEnum] = useState<Enumeration[]>([]);

  const enumerationPaye: EnumerationOption[] = payementEnum.map(
    (item: Enumeration) => ({
      ...item,
      value: item.enu_id.toString(),
      label: item.enu_nom,
    }),
  );

  //modePaye
  const [modePayementEnum, setModepayementEnum] = useState<Enumeration[]>([]);
  const enumerationModePaye: EnumerationOption[] = modePayementEnum.map(
    (item: Enumeration) => ({
      ...item,
      value: item.enu_id.toString(),
      label: item.enu_nom,
    }),
  );

  //dropdown
  const [openDrop, setOpenDrop] = useState<number | null>(null);

  const get_paye_client = (vente: ListeVente) => {
    if (!enumerationPaye) return vente.vte_payeclient;
    const enu_nom = enumerationPaye.filter(
      (elt) => elt.enu_id == Number(vente.vte_payeclient),
    )[0]?.enu_nom;
    if (enu_nom) return enu_nom;
    return vente.vte_payeclient;
  };

  const get_mode_paye = (vente: ListeVente) => {
    if (!enumerationModePaye) return vente.vte_modepaye;
    const enu_nom = enumerationModePaye.filter(
      (elt) => elt.enu_id == Number(vente.vte_modepaye),
    )[0]?.enu_nom;
    if (enu_nom) return enu_nom;
    return vente.vte_modepaye;
  };

  const fetchPaye = async (enu_code: string) => {
    try {
      const query = new URLSearchParams();
      query.set("enu_code", enu_code);

      const res = await apiFetch(
        `/api/generate-enumeration/?${query.toString()}`,
      );

      if (res.success) {
        setpayementEnum(res.nom_enumeration || []);
      }
    } catch (error) {
      console.error("Erreur chargement énumération PAYE_CLIENT :", error);
    }
  };

  const fetchModePaye = async (enu_code: string) => {
    try {
      const query = new URLSearchParams();
      query.set("enu_code", enu_code);
      const res = await apiFetch(
        `/api/generate-enumeration/?${query.toString()}`,
      );

      if (res.success) {
        console.log(res.success);
        setModepayementEnum(res.nom_enumeration);
      }
    } catch (error: any) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchPaye("PAYE_CLIENT");
    fetchModePaye("MODE_PAY");
  }, []);
  // ======================================
  // RENDU
  // ======================================

  return (
    <div className="w-full space-y-5">
      {/* EN-TÊTE */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Liste des ventes
          </h2>

          <p className="text-sm text-gray-500">
            Consultez et gérez vos opérations de vente.
          </p>
        </div>

        <div className="flex items-center gap-2 ">
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
            {totalCount} vente(s)
          </div>
        </div>
      </div>

      {/* FILTRES */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:bg-gray-dark dark:border-gray-dark dark:text-white">
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
              placeholder="Rechercher un client, une vente, un article..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700"
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
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700"
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
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700"
              aria-label="Date de fin"
            />
          </div>

          {/* PAIEMENT */}
          <select
            value={paye}
            onChange={(e) => {
              setPaye(e.target.value);

              appliquerFiltres({
                paye: e.target.value,
              });
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-dark"
          >
            <option value="">Tous les paiements</option>
            <option value="1">Payées</option>
            <option value="0">Non payées</option>
          </select>

          {/* VALIDATION */}
          <select
            value={valide}
            onChange={(e) => {
              setValide(e.target.value);

              appliquerFiltres({
                valide: e.target.value,
              });
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-dark"
          >
            <option value="">Toutes les validations</option>
            <option value="1">Validées</option>
            <option value="0">Non validées</option>
          </select>

          {/* TYPE DE PAYEMENT CLIENT */}
          <select
            value={payeClient}
            onChange={(e) => {
              setPayeClient(e.target.value);

              appliquerFiltres({
                paye_client: e.target.value,
              });
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-dark"
          >
            <option value="">Tous les types de payement client</option>

            {enumerationPaye.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={modePaye}
            onChange={(e) => {
              setModePaye(e.target.value);

              appliquerFiltres({
                modePaye: e.target.value,
              });
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-dark"
          >
            <option value="">Type de paiement du client</option>
            <option value="Espèce">Espèce</option>
            <option value="Mobile Money">Mobile Money</option>
            <option value="Virement">Virement</option>
            <option value="Chèque">Chèque</option>
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
      <div className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-gray-dark dark:text-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-600 dark:text-white">
              <tr>
                <th className="w-10 px-4 py-4"></th>
                <th className="px-4 py-4">Code vente</th>
                <th className="px-4 py-4">Proforma</th>
                <th className="px-4 py-4">Date</th>
                <th className="px-4 py-4">Client</th>
                <th className="px-4 py-4 text-center">Articles</th>
                <th className="px-4 py-4 text-center">Type paiement</th>
                <th className="px-4 py-4 text-center">Mode de paiement</th>
                <th className="px-4 py-4 text-right">Montant HT</th>
                <th className="px-4 py-4 text-right">Montant TTC</th>
                <th className="px-4 py-4 text-center">Paiement</th>
                <th className="px-4 py-4 text-center">Validation</th>
                <th className="px-4 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <RefreshCw
                      size={25}
                      className="mx-auto mb-3 animate-spin text-brand-500"
                    />
                    <p className="text-gray-500">Chargement des ventes...</p>
                  </td>
                </tr>
              ) : ventes.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <ShoppingCart
                      size={35}
                      className="mx-auto mb-3 text-gray-300"
                    />

                    <p className="font-medium text-gray-600">
                      Aucune vente trouvée
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Modifiez vos critères de recherche.
                    </p>
                  </td>
                </tr>
              ) : (
                ventes.map((vente) => {
                  const statut = getStatutPaiement(vente);
                  const validation = getStatutValidation(vente);

                  return (
                    <React.Fragment key={vente.vte_id}>
                      <tr className="transition hover:bg-brand-50/40 dark:border-gray-700">
                        {/* DÉTAILS */}
                        <td className="px-4 py-4">
                          <button
                            onClick={() =>
                              setVenteOuverte(
                                venteOuverte === vente.vte_id
                                  ? null
                                  : vente.vte_id,
                              )
                            }
                            className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
                          >
                            {venteOuverte === vente.vte_id ? (
                              <ChevronDown size={18} />
                            ) : (
                              <ChevronRight size={18} />
                            )}
                          </button>
                        </td>

                        {/* CODE */}
                        <td className="px-4 py-4 font-semibold text-brand-700 dark:text-brand-200">
                          {vente.vte_code}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right text-gray-600 dark:text-white">
                          {vente.ve_proforma || "-"}
                        </td>
                        {/* DATE */}
                        <td className="whitespace-nowrap px-4 py-4 text-gray-600 dark:text-white">
                          {formatDate(vente.vte_date)}
                        </td>

                        {/* CLIENT */}
                        <td className="px-4 py-4">
                          <p className="font-medium text-gray-800 dark:text-white">
                            {vente.vte_cli_nom || "Client inconnu"}
                          </p>

                          <p className="text-xs text-gray-400 dark:text-white">
                            {vente.vte_cli_contact || vente.vte_cli_code}
                          </p>
                        </td>

                        {/* ARTICLES */}
                        <td className="px-4 py-4 text-center">
                          <span className="rounded-full bg-gray-100 px-3 dark:bg-gray-500 py-1 text-xs font-medium text-gray-600 dark:text-white">
                            {vente.lignes?.length || 0}
                          </span>
                        </td>

                        {/* HT */}
                        <td className="whitespace-nowrap px-4 py-4 text-right text-gray-600 dark:text-white">
                          {get_paye_client(vente)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right text-gray-600 dark:text-white">
                          {get_mode_paye(vente)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right text-gray-600 dark:text-white">
                          {formatMontant(vente.vte_montant_ht)}
                        </td>

                        {/* TTC */}
                        <td className="whitespace-nowrap px-4 py-4 text-right font-semibold text-gray-800 dark:text-white">
                          {formatMontant(vente.vte_montant_ttc)}
                        </td>

                        {/* PAIEMENT */}
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statut.style}`}
                          >
                            {statut.label}
                          </span>
                        </td>

                        {/* VALIDATION */}
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${validation.style}`}
                          >
                            {validation.label}
                          </span>
                        </td>

                        {/* MODIFICATION */}
                        <td className="px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenDrop(
                                openDrop === vente.vte_id ? null : vente.vte_id,
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 active:scale-95"
                          >
                            <Menu size={14} />
                            Actions
                            <ChevronDown size={14} />
                          </button>

                          <Dropdown
                            key={vente.vte_id}
                            isOpen={openDrop === vente.vte_id}
                            onClose={() => setOpenDrop(null)}
                            className="w-50"
                          >
                            <DropdownItem
                              onClick={() => {
                                setOpenDrop(null);
                                onModifier(vente);
                              }}
                              className="inline-flex w-full items-center gap-2 rounded-lg"
                            >
                              <Pencil size={14} />
                              Modifier
                            </DropdownItem>

                            <DropdownItem
                              onClick={() => {
                                setOpenDrop(null);
                                onValidate(vente);
                              }}
                              className="inline-flex w-full items-center gap-2 rounded-lg"
                            >
                              <CheckIcon size={14} />
                              Valider
                            </DropdownItem>

                            <DropdownItem
                              onClick={() => {
                                setOpenDrop(null);
                                onExportFacture(vente, "pdf");
                              }}
                              className="inline-flex w-full items-center gap-2 rounded-lg"
                            >
                              <FileText size={14} />
                              Exporter la facture PDF
                            </DropdownItem>
                            <DropdownItem
                              onClick={() => {
                                setOpenDrop(null);
                                onExportFacture(vente, "png");
                              }}
                              className="inline-flex w-full items-center gap-2 rounded-lg"
                            >
                              <FileText size={14} />
                              Exporter la facture PNG
                            </DropdownItem>

                            <DropdownItem
                              onClick={() => {
                                setOpenDrop(null);
                                onPaye(vente);
                              }}
                              className="inline-flex w-full items-center gap-2 rounded-lg"
                            >
                              <DollarSign size={14} />
                              Payer
                            </DropdownItem>
                          </Dropdown>
                        </td>
                      </tr>

                      {/* DÉTAILS DES LIGNES */}
                      {venteOuverte === vente.vte_id && (
                        <tr className="bg-gray-50">
                          <td colSpan={10} className="px-8 py-5 dark:bg-gray-dark">
                            <h4 className="mb-3 font-semibold text-gray-700 dark:text-white">
                              Articles de la vente {vente.vte_code}
                            </h4>

                            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:bg-gray-dark dark:border-gray-700 dark:text-white">
                              <table className="w-full min-w-[650px] text-sm">
                                <thead className="bg-gray-100 text-xs text-gray-500 dark:bg-gray-700 dark:text-white">
                                  <tr>
                                    <th className="px-4 py-3">Article</th>
                                    <th className="px-4 py-3">Code article</th>
                                    <th className="px-4 py-3">Lot</th>
                                    <th className="px-4 py-3 text-right">
                                      Quantité
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                      Prix unitaire
                                    </th>
                                    <th></th>
                                    <th className="px-4 py-3 text-right">
                                      Total TTC
                                    </th>
                                  </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100 dark:text-white">
                                  {vente.lignes?.map((ligne) => (
                                    <tr key={ligne.vtel_id}>
                                      <td className="px-4 py-3 font-medium text-gray-700 dark:text-white">
                                        {ligne.art_nom || ligne.vtel_art_code}
                                      </td>

                                      <td className="px-4 py-3 text-gray-500 dark:text-white">
                                        {ligne.vtel_art_code}
                                      </td>

                                      <td className="px-4 py-3 text-gray-500 dark:text-white">
                                        {ligne.vtel_lot_dateper || "-"}
                                      </td>

                                      <td className="px-4 py-3 text-right">
                                        {ligne.vtel_quantite}
                                      </td>

                                      <td className="px-4 py-3 text-right">
                                        {formatMontant(ligne.vtel_prixunit)}
                                      </td>
                                      <td></td>
                                      <td className="px-4 py-3 text-right font-medium">
                                        {formatMontant(ligne.vtel_ttc)}
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-4 py-3 dark:bg-gray-dark dark:border-gray-700">
          <span className="text-xs text-gray-500">
            {totalCount} vente(s) au total
          </span>

          <span className="text-xs font-medium text-gray-600">
            Total TTC de cette page :{" "}
            {formatMontant(
              ventes.reduce(
                (total, vente) => total + Number(vente.vte_montant_ttc || 0),
                0,
              ),
            )}
          </span>
        </div>
      </div>

      {/* PAGINATION */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:bg-gray-dark dark:border-gray-700">
        <span className="text-sm text-gray-500">
          Page {page} sur {totalPages}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(1)}
            disabled={page <= 1 || loading}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Première
          </button>

          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Précédent
          </button>

          <span className="rounded-lg bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
            {page}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Suivant
          </button>

          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages || loading}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Dernière
          </button>
        </div>
      </div>
    </div>
  );
}
