// InventaireHistorique.tsx
// Liste des inventaires (TInventaire). Un clic sur une ligne ouvre un modal avec
// toutes les lignes de cet inventaire (TLigneInventaire, lien invl_inv_code == inv_code).

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../../../services/api";
/* ------------------------------------------------------------------ */
/* Types & config                                                      */
/* ------------------------------------------------------------------ */

interface Inventaire {
  invId: number;
  invCode: string;
  invDate: string; // "AAAA-MM-JJ"
  invDatecre: string | null; // ISO datetime
  invUsercre: string;
  invEtat: string;
  invNbligne: number | null;
  invNbecart: number | null;
  invNbverifie: number | null;
  invNbart: number | null;
}

interface InventairesResponse {
  count: number;
  results: Inventaire[];
}

interface Ligne {
  invlId: number;
  lotId: number | null;
  lotCode: string;
  artCode: string;
  nomArticle: string;
  qteTheo: number | null;
  qtePhys: number | null;
  ecart: number | null;
  etat: number | null;
  dateCre: string | null;
  userCre: string;
}

const ENDPOINT_LISTE = "/inventaire/liste/";
const endpointLignes = (code: string) =>
  `/inventaire/liste/${encodeURIComponent(code)}/lignes/`;

const PAGE_SIZE = 20;
const LIGNES_PAR_AFFICHAGE = 50; // lignes affichées dans le modal, puis +50 à chaque « Afficher plus »

/* ------------------------------------------------------------------ */
/* Formats                                                             */
/* ------------------------------------------------------------------ */

// "2026-11-26" -> "26/11/2026" (sans passer par Date : évite tout décalage de fuseau horaire)
const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—";
  const [y, m, j] = d.slice(0, 10).split("-");
  return y && m && j ? `${j}/${m}/${y}` : d;
};

const fmtDateHeure = (d: string | null | undefined) => {
  if (!d) return "—";
  const date = new Date(d);
  return Number.isNaN(date.getTime())
    ? d
    : date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
};

const fmtNum = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("fr-FR");
const fmtEcart = (n: number | null) =>
  n == null
    ? "—"
    : n > 0
      ? `+${n.toLocaleString("fr-FR")}`
      : n.toLocaleString("fr-FR");

const ecartClass = (e: number | null) =>
  e == null || e === 0
    ? "text-slate-500 dark:text-slate-400"
    : e < 0
      ? "text-red-600 dark:text-red-400"
      : "text-emerald-600 dark:text-emerald-400";

/* ------------------------------------------------------------------ */
/* Modal (version locale : remplace-la par ton <Modal/> existant)      */
/* ------------------------------------------------------------------ */

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ open, title, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-xl dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 text-sm">{children}</div>
        <div className="flex justify-end border-t border-slate-200 px-5 py-3 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm dark:border-slate-600"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Contenu du modal : détail d'un inventaire                           */
/* ------------------------------------------------------------------ */

function DetailInventaire({ inv }: { inv: Inventaire }) {
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibles, setVisibles] = useState(LIGNES_PAR_AFFICHAGE);
  const requestId = useRef(0);

  const charger = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const data: Ligne[] = await apiFetch(endpointLignes(inv.invCode));
      if (id !== requestId.current) return;
      setLignes(data);
    } catch {
      if (id !== requestId.current) return;
      setError("Impossible de charger les lignes de cet inventaire.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [inv.invCode]);

  useEffect(() => {
    setVisibles(LIGNES_PAR_AFFICHAGE);
    charger();
  }, [charger]);

  const infos: [string, string][] = [
    ["Code", inv.invCode],
    ["Date de l'inventaire", fmtDate(inv.invDate)],
    ["Réalisé par", inv.invUsercre || "—"],
    ["Enregistré le", fmtDateHeure(inv.invDatecre)],
    ["État", inv.invEtat || "—"],
    ["Lignes", fmtNum(inv.invNbligne)],
    ["Articles", fmtNum(inv.invNbart)],
    ["Avec écart", fmtNum(inv.invNbecart)],
  ];

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {infos.map(([label, value]) => (
          <div
            key={label}
            className="rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700"
          >
            <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {label}
            </dt>
            <dd className="mt-0.5 font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="px-3 py-2">Code lot</th>
              <th className="px-3 py-2">Code article</th>
              <th className="px-3 py-2">Désignation</th>
              <th className="px-3 py-2 text-right">Qté théorique</th>
              <th className="px-3 py-2 text-right">Qté physique</th>
              <th className="px-3 py-2 text-right">Écart</th>
              <th className="px-3 py-2 text-right">État</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center text-slate-500"
                >
                  Chargement des lignes…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-red-600">
                  {error}{" "}
                  <button type="button" onClick={charger} className="underline">
                    Réessayer
                  </button>
                </td>
              </tr>
            ) : lignes.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center text-slate-500"
                >
                  Aucune ligne pour cet inventaire.
                </td>
              </tr>
            ) : (
              lignes.slice(0, visibles).map((l) => (
                <tr
                  key={l.invlId}
                  className="border-t border-slate-200 dark:border-slate-700"
                >
                  <td className="px-3 py-2 font-mono">{l.lotCode}</td>
                  <td className="px-3 py-2 font-mono">{l.artCode}</td>
                  <td className="px-3 py-2">{l.nomArticle}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fmtNum(l.qteTheo)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fmtNum(l.qtePhys)}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-medium tabular-nums ${ecartClass(l.ecart)}`}
                  >
                    {fmtEcart(l.ecart)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {l.etat ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && !error && lignes.length > visibles && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setVisibles((v) => v + LIGNES_PAR_AFFICHAGE)}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            Afficher plus ({visibles} / {lignes.length})
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function InventaireHistorique() {
  const [items, setItems] = useState<Inventaire[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState<Inventaire | null>(null);
  const requestId = useRef(0); // ignore les réponses obsolètes

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPage = useCallback(
    async (offset: number) => {
      const id = ++requestId.current;
      const params: Record<string, string> = {
        limit: String(PAGE_SIZE),
        offset: String(offset),
      };
      if (debouncedSearch) params.search = debouncedSearch;

      if (offset === 0) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      try {
        const data: InventairesResponse = await apiFetch(
          ENDPOINT_LISTE,
          {},
          params,
        );
        if (id !== requestId.current) return;
        setItems((prev) =>
          offset === 0 ? data.results : [...prev, ...data.results],
        );
        setCount(data.count);
      } catch {
        if (id !== requestId.current) return;
        setError("Impossible de charger les inventaires.");
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [debouncedSearch],
  );

  useEffect(() => {
    fetchPage(0);
  }, [fetchPage]);

  const fermer = useCallback(() => setSelected(null), []);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Historique des inventaires</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Cliquez sur un inventaire pour voir le détail de ses lignes.
          </p>
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par code ou par utilisateur…"
          className="min-w-64 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
        />
      </header>

      <section className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Réalisé par</th>
              <th className="px-3 py-2 text-right">Lignes</th>
              <th className="px-3 py-2 text-right">Articles</th>
              <th className="px-3 py-2 text-right">Avec écart</th>
              <th className="px-3 py-2">État</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-10 text-center text-slate-500"
                >
                  Chargement des inventaires…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-red-600">
                  {error}{" "}
                  <button
                    type="button"
                    onClick={() => fetchPage(0)}
                    className="underline"
                  >
                    Réessayer
                  </button>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-10 text-center text-slate-500"
                >
                  Aucun inventaire.
                </td>
              </tr>
            ) : (
              items.map((inv) => (
                <tr
                  key={inv.invId}
                  tabIndex={0}
                  onClick={() => setSelected(inv)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(inv);
                    }
                  }}
                  className="cursor-pointer border-t border-slate-200 hover:bg-sky-50 focus:bg-sky-50 focus:outline-none dark:border-slate-700 dark:hover:bg-slate-800 dark:focus:bg-slate-800"
                >
                  <td className="px-3 py-2 font-mono">{inv.invCode}</td>
                  <td className="px-3 py-2">{fmtDate(inv.invDate)}</td>
                  <td className="px-3 py-2">{inv.invUsercre || "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fmtNum(inv.invNbligne)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fmtNum(inv.invNbart)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fmtNum(inv.invNbecart)}
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      {inv.invEtat || "—"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loading && !error && items.length > 0 && (
          <div className="flex flex-col items-center gap-2 px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
            <span>
              {items.length} / {count} inventaire(s)
            </span>
            {items.length < count && (
              <button
                type="button"
                onClick={() => fetchPage(items.length)}
                disabled={loadingMore}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {loadingMore ? "Chargement…" : "Charger plus"}
              </button>
            )}
          </div>
        )}
      </section>

      <Modal
        open={selected !== null}
        title={selected ? `Inventaire ${selected.invCode}` : ""}
        onClose={fermer}
      >
        {selected && <DetailInventaire key={selected.invId} inv={selected} />}
      </Modal>
    </div>
  );
}
