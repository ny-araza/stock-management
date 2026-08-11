import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../services/api"; // adapte le chemin selon ton projet

/**
 * Correspond à la table des ventes / factures (`vte_*`)
 */
interface Facture {
  vte_id: number;
  vte_code: string;
  vte_date: string;
  vte_modepaye: string | null;
  vte_montant_ht: number;
  vte_montant_ttc: number;
  vte_tva: number | null;
  vte_cli_code: string | null;
  vte_cli_nom: string | null;
  vte_cli_contact: string | null;
  vte_payeclient: string | null;
  vte_datepay: string | null;
  vte_telmoney: string | null;
  vte_valide: number; // 0 / 1
  vte_paye: number; // 0 / 1
  vte_datevalide: string | null;
  vte_livreur: string | null;
}

type StatusFilter = "TOUTES" | "A_VALIDER" | "A_PAYER";

const MODES_PAIEMENT = [
  "Espèces",
  "Mobile Money",
  "Chèque",
  "Virement",
] as const;

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatMontant(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value) + " Ar";
}

export default function FactureManagement() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("TOUTES");
  const [selected, setSelected] = useState<Facture | null>(null);
  const [saving, setSaving] = useState(false);
  const [modePaye, setModePaye] = useState<string>(MODES_PAIEMENT[0]);

  useEffect(() => {
    let cancelled = false;

    async function loadFactures() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch("/api/ventes/");
        if (!res.status) throw new Error("Échec du chargement des factures");
        console.log(res.ventes)
        const data: Facture[] = await res.ventes;
        if (!cancelled) setFactures(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Une erreur est survenue",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFactures();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredFactures = useMemo(() => {
    const q = search.trim().toUpperCase();
    return factures.filter((f) => {
      const matchesSearch =
        !q ||
        f.vte_code.toUpperCase().includes(q) ||
        (f.vte_cli_nom ?? "").toUpperCase().includes(q);

      const matchesStatus =
        statusFilter === "TOUTES" ||
        (statusFilter === "A_VALIDER" && !f.vte_valide) ||
        (statusFilter === "A_PAYER" && !f.vte_paye);

      return matchesSearch && matchesStatus;
    });
  }, [factures, search, statusFilter]);

  function openFacture(facture: Facture) {
    setSelected(facture);
    setModePaye(facture.vte_modepaye || MODES_PAIEMENT[0]);
  }

  function closePanel() {
    setSelected(null);
  }

  function patchFactureLocal(vte_id: number, patch: Partial<Facture>) {
    setFactures((prev) =>
      prev.map((f) => (f.vte_id === vte_id ? { ...f, ...patch } : f)),
    );
    setSelected((prev) =>
      prev && prev.vte_id === vte_id ? { ...prev, ...patch } : prev,
    );
  }

  async function validerFacture(facture: Facture) {
    setSaving(true);
    setError(null);
    const patch: Partial<Facture> = {
      vte_valide: 1,
      vte_datevalide: new Date().toISOString(),
    };
    try {
      const res = await apiFetch(`/api/factures/${facture.vte_id}/valider/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      patchFactureLocal(facture.vte_id, patch);
    } catch {
      setError("Impossible de valider cette facture.");
    } finally {
      setSaving(false);
    }
  }

  async function payerFacture(facture: Facture) {
    setSaving(true);
    setError(null);
    const patch: Partial<Facture> = {
      vte_paye: 1,
      vte_modepaye: modePaye,
      vte_datepay: new Date().toISOString(),
    };
    try {
      const res = await apiFetch(`/api/factures/${facture.vte_id}/payer/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      patchFactureLocal(facture.vte_id, patch);
    } catch {
      setError("Impossible de marquer cette facture comme payée.");
    } finally {
      setSaving(false);
    }
  }

  const aValiderCount = factures.filter((f) => !f.vte_valide).length;
  const aPayerCount = factures.filter((f) => !f.vte_paye).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Factures
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {aValiderCount} à valider · {aPayerCount} à payer sur{" "}
              {factures.length} facture{factures.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un code ou un client..."
              className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Filtres de statut */}
        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              { key: "TOUTES", label: "Toutes" },
              { key: "A_VALIDER", label: `À valider (${aValiderCount})` },
              { key: "A_PAYER", label: `À payer (${aPayerCount})` },
            ] as { key: StatusFilter; label: string }[]
          ).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setStatusFilter(opt.key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === opt.key
                  ? "border-teal-500 bg-teal-500/15 text-teal-300"
                  : "border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-rose-300/70 hover:text-rose-200"
            >
              Fermer
            </button>
          </div>
        )}

        {/* Liste des factures */}
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-teal-400" />
              <span className="text-sm">Chargement des factures...</span>
            </div>
          ) : filteredFactures.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-500">
              Aucune facture ne correspond à ces critères.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium text-right">
                    Montant TTC
                  </th>
                  <th className="px-4 py-3 font-medium">Validation</th>
                  <th className="px-4 py-3 font-medium">Paiement</th>
                </tr>
              </thead>
              <tbody>
                {filteredFactures.map((f) => (
                  <tr
                    key={f.vte_id}
                    onClick={() => openFacture(f)}
                    className="cursor-pointer border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-3 font-medium text-slate-100">
                      {f.vte_code}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {formatDate(f.vte_date)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {f.vte_cli_nom || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-100">
                      {formatMontant(f.vte_montant_ttc)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${
                          f.vte_valide
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-amber-500/15 text-amber-300"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            f.vte_valide ? "bg-emerald-400" : "bg-amber-400"
                          }`}
                        />
                        {f.vte_valide ? "Validée" : "Non validée"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${
                          f.vte_paye
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-rose-500/15 text-rose-300"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            f.vte_paye ? "bg-emerald-400" : "bg-rose-400"
                          }`}
                        />
                        {f.vte_paye ? "Payée" : "Non payée"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Panneau latéral / modale de détail + actions */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 sm:items-center sm:justify-center">
          <div
            className="absolute inset-0"
            onClick={closePanel}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full w-full max-w-md overflow-y-auto border-l border-slate-800 bg-slate-900 p-6 shadow-2xl sm:h-auto sm:rounded-xl sm:border">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Facture {selected.vte_code}
                </h2>
                <p className="mt-0.5 text-sm text-slate-400">
                  {formatDate(selected.vte_date)}
                </p>
              </div>
              <button
                onClick={closePanel}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Détails */}
            <div className="mb-6 space-y-2 rounded-lg border border-slate-800 bg-slate-950/50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Client</span>
                <span className="text-slate-200">
                  {selected.vte_cli_nom || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact</span>
                <span className="text-slate-200">
                  {selected.vte_cli_contact || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Montant HT</span>
                <span className="text-slate-200">
                  {formatMontant(selected.vte_montant_ht)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">TVA</span>
                <span className="text-slate-200">
                  {selected.vte_tva != null
                    ? formatMontant(selected.vte_tva)
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 font-medium">
                <span className="text-slate-400">Montant TTC</span>
                <span className="text-white">
                  {formatMontant(selected.vte_montant_ttc)}
                </span>
              </div>
            </div>

            {/* Statuts */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-800 p-3">
                <p className="text-xs text-slate-500">Validation</p>
                <p
                  className={`mt-1 text-sm font-medium ${
                    selected.vte_valide ? "text-emerald-300" : "text-amber-300"
                  }`}
                >
                  {selected.vte_valide ? "Validée" : "Non validée"}
                </p>
                {selected.vte_valide === 1 && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    le {formatDate(selected.vte_datevalide)}
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-slate-800 p-3">
                <p className="text-xs text-slate-500">Paiement</p>
                <p
                  className={`mt-1 text-sm font-medium ${
                    selected.vte_paye ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {selected.vte_paye ? "Payée" : "Non payée"}
                </p>
                {selected.vte_paye === 1 && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    le {formatDate(selected.vte_datepay)}
                    {selected.vte_modepaye ? ` · ${selected.vte_modepaye}` : ""}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {!selected.vte_valide && (
                <button
                  onClick={() => validerFacture(selected)}
                  disabled={saving}
                  className="w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  {saving ? "Validation en cours..." : "Valider la facture"}
                </button>
              )}

              {!selected.vte_paye && (
                <div className="space-y-2 rounded-lg border border-slate-800 p-3">
                  <label className="block text-xs text-slate-500">
                    Mode de paiement
                  </label>
                  <select
                    value={modePaye}
                    onChange={(e) => setModePaye(e.target.value)}
                    disabled={saving}
                    className="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-teal-500"
                  >
                    {MODES_PAIEMENT.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => payerFacture(selected)}
                    disabled={saving}
                    className="w-full rounded-lg border border-teal-500/30 bg-teal-500/10 px-4 py-2.5 text-sm font-medium text-teal-300 transition hover:bg-teal-500/20 disabled:opacity-50"
                  >
                    {saving ? "Paiement en cours..." : "Marquer comme payée"}
                  </button>
                </div>
              )}

              {selected.vte_valide === 1 && selected.vte_paye === 1 && (
                <p className="text-center text-sm text-slate-500">
                  Cette facture est validée et payée.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
