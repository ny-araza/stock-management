import React, { useCallback, useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Filter,
  X,
  Users,
  Pencil,
  Mail,
  Phone,
  MapPin,
  Plus,
} from "lucide-react";

import { Client } from "../../interfaces/interfaces";
import { apiFetch } from "../../services/api";
import { useModal } from "../../hooks/useModal";
import NewClts from "./newClts";

// ======================================
// FORMATAGE
// ======================================

const formatDate = (date?: string | null) => {
  if (!date) return "-";

  const d = new Date(date);

  if (isNaN(d.getTime())) return date;

  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// ======================================
// PROPS
// ======================================

interface ListeClientProps {
  onRefresh?: () => void;
}

// ======================================
// COMPOSANT
// ======================================

export default function ListeClient({ onRefresh }: ListeClientProps) {
  const { isOpen, openModal, closeModal } = useModal();

  // Données
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Recherche et filtres
  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState("");
  const [typeClient, setTypeClient] = useState("");
  const [modePaiement, setModePaiement] = useState("");

  // Énumérations
  const [types, setTypes] = useState<any[]>([]);
  const [modesPaiement, setModesPaiement] = useState<any[]>([]);

  const [refreshKey, setRefreshKey] = useState(0);

  // ======================================
  // CHARGEMENT DES ENUMERATIONS
  // ======================================

  const fetchEnumeration = async (code: string) => {
    try {
      const query = new URLSearchParams();
      query.set("enu_code", code);

      const res = await apiFetch(
        `/api/generate-enumeration/?${query.toString()}`,
      );

      if (res.success) {
        if (code === "TYPE_CLT") {
          setTypes(res.nom_enumeration || []);
        } else if (code === "MODE_PAY") {
          setModesPaiement(res.nom_enumeration || []);
        }
      }
    } catch (err) {
      console.error("Erreur chargement énumération :", err);
    }
  };

  useEffect(() => {
    fetchEnumeration("TYPE_CLT");
    fetchEnumeration("MODE_PAY");
  }, []);

  // ======================================
  // CHARGEMENT DES CLIENTS
  // ======================================

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams();

      query.set("page", String(page));

      if (recherche.trim()) {
        query.set("search", recherche.trim());
      }

      if (statut !== "") {
        query.set("cli_enabled", statut);
      }

      if (typeClient !== "") {
        query.set("cli_type", typeClient);
      }

      if (modePaiement !== "") {
        query.set("cli_modepay", modePaiement);
      }

      const res = await apiFetch(`/api/clients/?${query.toString()}`);

      if (res.status) {
        setClients(res.clients || []);
        setTotalCount(res.count || 0);
        setTotalPages(res.total_pages || 1);
        setHasNext(res.next !== null);
        setHasPrevious(res.previous !== null);
      } else {
        throw new Error(res.message || "Impossible de récupérer les clients");
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [page, recherche, statut, typeClient, modePaiement, refreshKey]);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        fetchClients();
      },
      recherche ? 400 : 0,
    );

    return () => clearTimeout(timer);
  }, [fetchClients, recherche]);

  // ======================================
  // FILTRES
  // ======================================

  const resetFiltres = () => {
    setRecherche("");
    setStatut("");
    setTypeClient("");
    setModePaiement("");
    setPage(1);
  };

  const nombreFiltres = [recherche, statut, typeClient, modePaiement].filter(
    Boolean,
  ).length;

  // ======================================
  // STATUT CLIENT
  // ======================================

  const getStatut = (client: Client) => {
    if (client.cli_enabled) {
      return {
        label: "Actif",
        style: "bg-green-100 text-green-700",
      };
    }

    return {
      label: "Non actif",
      style: "bg-red-100 text-red-700",
    };
  };

  // ======================================
  // ENUMERATION : LIBELLES
  // ======================================

  const getTypeClient = (client: Client) => {
    const item = types.find(
      (elt: any) => String(elt.enu_id) === String(client.cli_type),
    );

    return item?.enu_nom || client.cli_type || "-";
  };

  const getModePaiement = (client: Client) => {
    const item = modesPaiement.find(
      (elt: any) => String(elt.enu_id) === String(client.cli_modepay),
    );

    return item?.enu_nom || client.cli_modepay || "-";
  };

  // ======================================
  // ACTUALISATION
  // ======================================

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);

    if (onRefresh) {
      onRefresh();
    }
  };

  // ======================================
  // FERMETURE MODAL
  // ======================================

  const handleCloseModal = () => {
    closeModal();
    setRefreshKey((prev) => prev + 1);
  };

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleAjouter = () => {
    setSelectedClient(null);
    openModal();
  };
  const handleModifier = (client: Client) => {
    setSelectedClient(client);
    console.log(client)
    openModal();
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
            Liste des clients
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Consultez et gérez vos clients.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            title="Actualiser"
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          </button>

          <div className="rounded-lg bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 dark:bg-gray-800 dark:text-brand-200">
            {totalCount} client(s)
          </div>

          <button
            onClick={handleAjouter}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus size={17} />
            Nouveau client
          </button>
        </div>
      </div>

      {/* FILTRES */}

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:bg-gray-dark dark:border-gray-700 dark:text-white">
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

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {/* RECHERCHE */}

          <div className="relative lg:col-span-4">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={recherche}
              onChange={(e) => {
                setRecherche(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher un code, un nom, un téléphone..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-dark dark:text-white"
            />
          </div>

          {/* STATUT */}

          <select
            value={statut}
            onChange={(e) => {
              setStatut(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-dark dark:text-white"
          >
            <option value="">Tous les statuts</option>
            <option value="1">Actifs</option>
            <option value="0">Non actifs</option>
          </select>

          {/* TYPE CLIENT */}

          <select
            value={typeClient}
            onChange={(e) => {
              setTypeClient(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-dark dark:text-white"
          >
            <option value="">Tous les types de clients</option>

            {types.map((item: any) => (
              <option key={item.enu_id} value={item.enu_id}>
                {item.enu_nom}
              </option>
            ))}
          </select>

          {/* MODE PAIEMENT */}

          <select
            value={modePaiement}
            onChange={(e) => {
              setModePaiement(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-dark dark:text-white"
          >
            <option value="">Tous les modes de paiement</option>

            {modesPaiement.map((item: any) => (
              <option key={item.enu_id} value={item.enu_id}>
                {item.enu_nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ERREUR */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30">
          {error}
        </div>
      )}

      {/* TABLEAU */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:bg-gray-dark dark:border-gray-700 dark:text-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-600 dark:text-white">
              <tr>
                <th className="px-4 py-4">Code client</th>
                <th className="px-4 py-4">Client</th>
                <th className="px-4 py-4">Contacts</th>
                <th className="px-4 py-4">Adresse</th>
                <th className="px-4 py-4">Type</th>
                <th className="px-4 py-4">Mode paiement</th>
                <th className="px-4 py-4">Date création</th>
                <th className="px-4 py-4 text-center">Statut</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <RefreshCw
                      size={25}
                      className="mx-auto mb-3 animate-spin text-brand-500"
                    />

                    <p className="text-gray-500 dark:text-gray-400">
                      Chargement des clients...
                    </p>
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <Users size={35} className="mx-auto mb-3 text-gray-300" />

                    <p className="font-medium text-gray-600 dark:text-white">
                      Aucun client trouvé
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Modifiez vos critères de recherche.
                    </p>
                  </td>
                </tr>
              ) : (
                clients.map((client) => {
                  const statutClient = getStatut(client);

                  return (
                    <tr
                      key={client.cli_id}
                      className="transition hover:bg-brand-50/40 dark:hover:bg-gray-800"
                    >
                      {/* CODE */}

                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-brand-700 dark:text-brand-200">
                        {client.cli_code || "-"}
                      </td>

                      {/* NOM */}

                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {client.cli_nom || "-"}
                        </p>

                        {client.cli_email && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                            <Mail size={12} />
                            {client.cli_email}
                          </p>
                        )}
                      </td>

                      {/* CONTACTS */}

                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {client.cli_tel1 && (
                            <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                              <Phone size={13} />
                              {client.cli_tel1}
                            </p>
                          )}

                          {client.cli_tel2 && (
                            <p className="flex items-center gap-2 text-xs text-gray-400">
                              <Phone size={12} />
                              {client.cli_tel2}
                            </p>
                          )}

                          {!client.cli_tel1 && !client.cli_tel2 && "-"}
                        </div>
                      </td>

                      {/* ADRESSE */}

                      <td className="px-4 py-4 text-gray-600 dark:text-gray-300">
                        {client.cli_adresse ? (
                          <span className="flex items-center gap-2">
                            <MapPin size={14} />
                            {client.cli_adresse}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      {/* TYPE */}

                      <td className="px-4 py-4 text-gray-600 dark:text-gray-300">
                        {getTypeClient(client)}
                      </td>

                      {/* MODE PAIEMENT */}

                      <td className="px-4 py-4 text-gray-600 dark:text-gray-300">
                        {getModePaiement(client)}
                      </td>

                      {/* DATE */}

                      <td className="whitespace-nowrap px-4 py-4 text-gray-600 dark:text-gray-300">
                        {formatDate(client.cli_datecre)}
                      </td>

                      {/* STATUT */}

                      <td className="px-4 py-4 text-center">
                        <span
                          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statutClient.style}`}
                        >
                          {statutClient.label}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleModifier(client)}
                            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Pencil size={14} />
                            Modifier
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PIED DU TABLEAU */}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-4 py-3 dark:bg-gray-800 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {totalCount} client(s) au total
          </span>

          <span className="text-xs text-gray-500 dark:text-gray-400">
            {clients.length} client(s) affiché(s) sur cette page
          </span>
        </div>
      </div>

      {/* PAGINATION */}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:bg-gray-dark dark:border-gray-700">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Page {page} sur {totalPages}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPage(1)}
            disabled={page <= 1 || loading || !hasPrevious}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 dark:bg-gray-dark dark:border-gray-700 dark:text-white"
          >
            Première
          </button>

          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1 || loading || !hasPrevious}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 dark:bg-gray-dark dark:border-gray-700 dark:text-white"
          >
            Précédent
          </button>

          <span className="rounded-lg bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 dark:bg-gray-800 dark:text-brand-200">
            {page}
          </span>

          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages || loading || !hasNext}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 dark:bg-gray-dark dark:border-gray-700 dark:text-white"
          >
            Suivant
          </button>

          <button
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages || loading || !hasNext}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 dark:bg-gray-dark dark:border-gray-700 dark:text-white"
          >
            Dernière
          </button>
        </div>
      </div>

      {/* MODAL NOUVEAU CLIENT */}

      <NewClts
        isOpen={isOpen}
        onClose={handleCloseModal}
        client={selectedClient}
        onSaved={() => {
          fetchClients();
          onRefresh?.();
        }}
      />
    </div>
  );
}
