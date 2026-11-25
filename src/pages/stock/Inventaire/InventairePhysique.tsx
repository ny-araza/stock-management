// InventairePhysique.tsx
// Dépendances : npm i jspdf jspdf-autotable html2canvas
// Les lots sont chargés par tranches de 20 (pagination Django), au fil du défilement.

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { apiFetch } from "../../../services/api";
/* ------------------------------------------------------------------ */
/* Types & config                                                      */
/* ------------------------------------------------------------------ */

interface Lot {
  lotId: number;
  lotCode: string;
  lotArtCode: string;
  lotArtQuantite: number;
  nomArticle: string;
}

interface LotsResponse {
  count: number; // lots correspondant à la recherche
  total: number; // tous les lots
  results: Lot[];
}

interface Modification {
  lotId: number;
  lotCode: string;
  lotArtCode: string;
  nomArticle: string;
  ancienneQuantite: number;
  nouvelleQuantite: number;
  ecart: number;
}

type Filtre = "tous" | "modifies" | "non_modifies";
type Notice = { type: "success" | "error"; message: string } | null;
type ExportKind = "fiche-pdf" | "fiche-png" | "rapport-pdf" | "rapport-png";

const ENDPOINT_LOTS = "/inventaire/lots/";
const ENDPOINT_EXPORT = "/inventaire/lots/export/";
const ENDPOINT_SAVE = "/inventaire/enregistrer/";

const PAGE_SIZE = 20; // lots chargés au départ, puis à chaque défilement
const QUANTITE_STEP = "1"; // lot_art_quantite est un IntegerField
const DECIMALS = 0;

const round = (n: number) => Number(n.toFixed(DECIMALS));
const fmt = (n: number) =>
  n.toLocaleString("fr-FR", { maximumFractionDigits: DECIMALS });
const fmtEcart = (n: number) => (n > 0 ? `+${fmt(n)}` : fmt(n));

/** Retourne la quantité entière valide (>= 0) ou null. */
function parseQuantite(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === "") return null;
  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return null;
  return n;
}

const ecartClass = (e: number) =>
  e < 0
    ? "text-red-600 dark:text-red-400"
    : e > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-slate-500 dark:text-slate-400";

const normaliser = (rows: Lot[]): Lot[] =>
  rows.map((l) => ({ ...l, lotArtQuantite: Number(l.lotArtQuantite) }));

/* ------------------------------------------------------------------ */
/* Export (PDF / PNG) — lecture seule, ne touche jamais à la BDD       */
/* ------------------------------------------------------------------ */

const today = () => new Date().toLocaleDateString("fr-FR");
const stamp = () => new Date().toISOString().slice(0, 10);

const HEAD_FICHE = [
  "Date Péremption",
  "Code article",
  "Désignation",
  "Stock actuel",
  "Nouvelle qté",
  "Observations",
];
const HEAD_RAPPORT = [
  "Date Péremption",
  "Article",
  "Ancienne qté",
  "Nouvelle qté",
  "Écart",
];

const rowsFiche = (lots: Lot[]) =>
  lots.map((l) => [
    l.lotCode,
    l.lotArtCode,
    l.nomArticle,
    fmt(l.lotArtQuantite),
    "",
    "",
  ]);
const rowsRapport = (mods: Modification[]) =>
  mods.map((m) => [
    m.lotCode,
    `${m.lotArtCode} - ${m.nomArticle}`,
    fmt(m.ancienneQuantite),
    fmt(m.nouvelleQuantite),
    fmtEcart(m.ecart),
  ]);

function pdfFicheComptage(lots: Lot[]) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  doc.setFontSize(14);
  doc.text("Fiche de comptage physique", 14, 15);
  doc.setFontSize(9);
  doc.text(`Date : ${today()}   |   Lots : ${lots.length}`, 14, 21);
  autoTable(doc, {
    startY: 26,
    head: [HEAD_FICHE],
    body: rowsFiche(lots),
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      lineColor: [180, 180, 180],
      lineWidth: 0.1,
    },
    headStyles: { fillColor: [30, 41, 59] },
    columnStyles: {
      3: { halign: "right" },
      4: { cellWidth: 26 },
      5: { cellWidth: 40 },
    },
    theme: "grid",
  });
  doc.save(`fiche-comptage-${stamp()}.pdf`);
}

function pdfRapport(mods: Modification[]) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  doc.setFontSize(14);
  doc.text("Rapport des modifications d'inventaire", 14, 15);
  doc.setFontSize(9);
  doc.text(`Date : ${today()}   |   Lots modifiés : ${mods.length}`, 14, 21);
  autoTable(doc, {
    startY: 26,
    head: [HEAD_RAPPORT],
    body: rowsRapport(mods),
    styles: { fontSize: 8.5, cellPadding: 2.2 },
    headStyles: { fillColor: [30, 41, 59] },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
    theme: "grid",
  });
  doc.save(`rapport-inventaire-${stamp()}.pdf`);
}

/** Rend un tableau HTML hors-écran, le capture en PNG puis le télécharge. */
async function exportPng(
  title: string,
  head: string[],
  rows: string[][],
  filename: string,
) {
  const host = document.createElement("div");
  host.style.cssText =
    "position:fixed;left:-10000px;top:0;background:#fff;color:#111;padding:24px;font-family:sans-serif;width:900px";
  const th = head
    .map(
      (h) =>
        `<th style="border:1px solid #bbb;padding:6px 8px;background:#1e293b;color:#fff;text-align:left;font-size:12px">${h}</th>`,
    )
    .join("");
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const tr = rows
    .map(
      (r) =>
        `<tr>${r
          .map(
            (c) =>
              `<td style="border:1px solid #ccc;padding:6px 8px;font-size:12px;height:18px">${esc(c)}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("");
  host.innerHTML = `<h2 style="margin:0 0 4px">${title}</h2><p style="margin:0 0 12px;font-size:12px;color:#555">${today()}</p><table style="border-collapse:collapse;width:100%"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
  document.body.appendChild(host);
  try {
    const canvas = await html2canvas(host, {
      scale: 2,
      backgroundColor: "#ffffff",
    });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = filename;
    a.click();
  } finally {
    document.body.removeChild(host);
  }
}

/* ------------------------------------------------------------------ */
/* Ligne du tableau (memo : saisie fluide)                             */
/* ------------------------------------------------------------------ */

interface RowProps {
  lot: Lot;
  saisie: string;
  inList: boolean;
  onChange: (lotId: number, v: string) => void;
  onAdd: (lot: Lot) => void;
}

const LotRow = memo(function LotRow({
  lot,
  saisie,
  inList,
  onChange,
  onAdd,
}: RowProps) {
  const q = parseQuantite(saisie);
  const invalid = saisie.trim() !== "" && q === null;
  const ecart = q === null ? null : round(q - lot.lotArtQuantite);

  return (
    <tr
      className={`border-b border-slate-200 dark:border-slate-700 ${
        inList ? "bg-sky-50/60 dark:bg-sky-950/30" : ""
      }`}
    >
      <td className="px-3 py-2 font-mono text-sm">{lot.lotCode}</td>
      <td className="px-3 py-2 font-mono text-sm">{lot.lotArtCode}</td>
      <td className="px-3 py-2">{lot.nomArticle}</td>
      <td className="px-3 py-2 text-right tabular-nums">
        {fmt(lot.lotArtQuantite)}
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={QUANTITE_STEP}
          value={saisie}
          onChange={(e) => onChange(lot.lotId, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onAdd(lot);
          }}
          aria-label={`Nouvelle quantité du lot ${lot.lotCode}`}
          className={`w-28 rounded-md border px-2 py-1 text-right tabular-nums bg-white dark:bg-slate-900 ${
            invalid
              ? "border-red-500"
              : "border-slate-300 dark:border-slate-600"
          }`}
        />
      </td>
      <td
        className={`px-3 py-2 text-right tabular-nums font-medium ${ecart === null ? "text-slate-400" : ecartClass(ecart)}`}
      >
        {ecart === null ? "—" : fmtEcart(ecart)}
      </td>
      <td className="px-3 py-2 text-right">
        <button
          type="button"
          onClick={() => onAdd(lot)}
          disabled={q === null}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {inList ? "Mettre à jour" : "Ajouter à la liste"}
        </button>
      </td>
    </tr>
  );
});

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function InventairePhysique() {
  const [lots, setLots] = useState<Lot[]>([]); // lots chargés jusqu'ici (tranches successives)
  const [count, setCount] = useState(0); // lots correspondant à la recherche (serveur)
  const [total, setTotal] = useState(0); // tous les lots (serveur)
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saisies, setSaisies] = useState<Record<number, string>>({});
  const [liste, setListe] = useState<Record<number, Modification>>({});
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [listeOuverte, setListeOuverte] = useState(false);

  const savingRef = useRef(false);
  const requestId = useRef(0); // ignore les réponses obsolètes
  const listeRef = useRef(liste);
  listeRef.current = liste;
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  /* ---------- recherche (anti-rebond) ---------- */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  /* ---------- chargement paginé ---------- */
  const fetchLots = useCallback(
    async (offset: number) => {
      const id = ++requestId.current;
      const params: Record<string, string> = {
        limit: String(PAGE_SIZE),
        offset: String(offset),
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filtre === "non_modifies") {
        const ids = Object.keys(listeRef.current);
        if (ids.length > 0) params.exclude_ids = ids.join(",");
      }

      if (offset === 0) {
        setLoading(true);
        setLoadError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const data: LotsResponse = await apiFetch(ENDPOINT_LOTS, {}, params);
        if (id !== requestId.current) return;
        const rows = normaliser(data.results);
        setLots((prev) => (offset === 0 ? rows : [...prev, ...rows]));
        setCount(data.count);
        setTotal(data.total);
      } catch {
        if (id !== requestId.current) return;
        if (offset === 0) setLoadError("Impossible de charger les lots.");
        else
          setNotice({
            type: "error",
            message: "Impossible de charger la suite des lots.",
          });
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [debouncedSearch, filtre],
  );

  // Premier chargement, puis rechargement depuis le début quand la recherche/le filtre change
  useEffect(() => {
    if (filtre === "modifies") {
      // ce filtre s'applique localement à la liste : pas d'appel serveur
      requestId.current++;
      setLoading(false);
      setLoadingMore(false);
      return;
    }
    fetchLots(0);
  }, [fetchLots, filtre, reloadKey]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  /* ---------- saisie / liste ---------- */
  const onChange = useCallback((lotId: number, v: string) => {
    setSaisies((s) => ({ ...s, [lotId]: v }));
  }, []);

  const onAdd = useCallback(
    (lot: Lot) => {
      const q = parseQuantite(saisies[lot.lotId]);
      if (q === null) {
        setNotice({
          type: "error",
          message:
            "Quantité invalide : renseignez un entier supérieur ou égal à 0.",
        });
        return;
      }
      setListe((l) => ({
        ...l,
        [lot.lotId]: {
          lotId: lot.lotId,
          lotCode: lot.lotCode,
          lotArtCode: lot.lotArtCode,
          nomArticle: lot.nomArticle,
          ancienneQuantite: lot.lotArtQuantite,
          nouvelleQuantite: q,
          ecart: round(q - lot.lotArtQuantite),
        },
      }));
    },
    [saisies],
  );

  const retirer = (lotId: number) =>
    setListe((l) => {
      const { [lotId]: _removed, ...rest } = l;
      return rest;
    });

  const modifierDansListe = (lotId: number, raw: string) => {
    const q = parseQuantite(raw);
    if (q === null) return;
    setListe((l) => ({
      ...l,
      [lotId]: {
        ...l[lotId],
        nouvelleQuantite: q,
        ecart: round(q - l[lotId].ancienneQuantite),
      },
    }));
  };

  const modifications = useMemo(() => Object.values(liste), [liste]);

  /* ---------- enregistrement ---------- */
  const enregistrer = async () => {
    if (savingRef.current || modifications.length === 0) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await apiFetch(ENDPOINT_SAVE, {
        method: "POST",
        body: JSON.stringify({
          modifications: modifications.map((m) => ({
            lotId: m.lotId,
            nouvelleQuantite: m.nouvelleQuantite,
          })),
        }),
      });
      const n = modifications.length;
      setListe({});
      setSaisies({});
      setNotice({ type: "success", message: `${n} lot(s) mis à jour.` });
      setReloadKey((k) => k + 1); // recharge depuis la BDD (retour à la première tranche)
    } catch (err) {
      // apiFetch attache le corps de la réponse d'erreur dans err.response.data
      const data = (err as { response?: { data?: { detail?: string } } })
        .response?.data;
      const detail =
        data && Object.keys(data).length > 0
          ? (data.detail ?? JSON.stringify(data))
          : "Erreur réseau.";
      setNotice({
        type: "error",
        message: `Échec de l'enregistrement : ${detail}`,
      });
      // la liste est conservée pour permettre un nouvel essai
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  /* ---------- lignes affichées ---------- */
  const enModeModifies = filtre === "modifies";

  const rows: Lot[] = useMemo(() => {
    if (!enModeModifies) return lots;
    const s = search.trim().toLowerCase();
    return modifications
      .filter(
        (m) =>
          !s ||
          m.nomArticle.toLowerCase().includes(s) ||
          m.lotArtCode.toLowerCase().includes(s) ||
          m.lotCode.toLowerCase().includes(s),
      )
      .map((m) => ({
        lotId: m.lotId,
        lotCode: m.lotCode,
        lotArtCode: m.lotArtCode,
        nomArticle: m.nomArticle,
        lotArtQuantite: m.ancienneQuantite,
      }));
  }, [enModeModifies, lots, modifications, search]);

  const totalAffichable = enModeModifies ? rows.length : count;
  const hasMore = !enModeModifies && lots.length < count;

  /* ---------- défilement infini : tranche suivante ---------- */
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchLots(lots.length);
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, lots.length, fetchLots]);

  /* ---------- stats ---------- */
  const stats = {
    total,
    ajoutes: modifications.length,
    restants: Math.max(total - modifications.length, 0),
    avecEcart: modifications.filter((m) => m.ecart !== 0).length,
  };

  /* ---------- exports ---------- */
  const exporter = async (kind: ExportKind) => {
    setExportOpen(false);
    if (kind.startsWith("rapport") && modifications.length === 0) {
      setNotice({
        type: "error",
        message: "La liste des modifications est vide.",
      });
      return;
    }
    setExporting(true);
    try {
      if (kind.startsWith("fiche")) {
        // la fiche couvre tous les lots, pas seulement ceux déjà affichés
        const all = normaliser(await apiFetch(ENDPOINT_EXPORT));
        if (all.length === 0) {
          setNotice({ type: "error", message: "Aucun lot à exporter." });
          return;
        }
        if (kind === "fiche-pdf") pdfFicheComptage(all);
        else
          await exportPng(
            "Fiche de comptage physique",
            HEAD_FICHE,
            rowsFiche(all),
            `fiche-comptage-${stamp()}.png`,
          );
      } else if (kind === "rapport-pdf") {
        pdfRapport(modifications);
      } else {
        await exportPng(
          "Rapport des modifications d'inventaire",
          HEAD_RAPPORT,
          rowsRapport(modifications),
          `rapport-inventaire-${stamp()}.png`,
        );
      }
    } catch {
      setNotice({ type: "error", message: "L'export a échoué." });
    } finally {
      setExporting(false);
    }
  };

  /* ---------- rendu ---------- */
  const statCards = [
    { label: "Total des lots", value: stats.total },
    { label: "Ajoutés à la liste", value: stats.ajoutes },
    { label: "Restant à traiter", value: stats.restants },
    { label: "Avec écart", value: stats.avecEcart },
  ];

  const afficheChargement = !enModeModifies && loading && rows.length === 0;
  const listeVisible = listeOuverte && modifications.length > 0;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Inventaire physique</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Saisissez les quantités comptées, constituez la liste puis
            enregistrez.
          </p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setExportOpen((o) => !o)}
            disabled={exporting}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            {exporting ? "Export en cours…" : "Exporter ▾"}
          </button>
          {exportOpen && (
            <div className="absolute right-0 z-20 mt-1 w-64 rounded-md border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              {(
                [
                  ["fiche-pdf", "Fiche de comptage (PDF, A4)"],
                  ["fiche-png", "Fiche de comptage (PNG)"],
                  ["rapport-pdf", "Rapport des modifications (PDF)"],
                  ["rapport-png", "Rapport des modifications (PNG)"],
                ] as [ExportKind, string][]
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => exporter(k)}
                  className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {notice && (
        <div
          role="status"
          className={`rounded-md border px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
              : "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
          }`}
        >
          {notice.message}
        </div>
      )}

      {/* Statistiques */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
          >
            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {s.label}
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {s.value}
            </div>
          </div>
        ))}
      </section>

      {/* Recherche & filtres */}
      <section className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par article, code article ou code lot…"
          className="min-w-64 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
        />
        <div className="inline-flex overflow-hidden rounded-md border border-slate-300 dark:border-slate-600">
          {(
            [
              ["tous", "Tous"],
              ["modifies", "Modifiés"],
              ["non_modifies", "Non modifiés"],
            ] as [Filtre, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFiltre(k)}
              className={`px-3 py-2 text-sm ${
                filtre === k
                  ? "bg-sky-600 text-white"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Tableau principal */}
      <section className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="px-3 py-2">Date péremption</th>
              <th className="px-3 py-2">Code article</th>
              <th className="px-3 py-2">Désignation</th>
              <th className="px-3 py-2 text-right">Stock actuel</th>
              <th className="px-3 py-2">Nouvelle quantité</th>
              <th className="px-3 py-2 text-right">Écart</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {afficheChargement ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-10 text-center text-slate-500"
                >
                  Chargement des lots…
                </td>
              </tr>
            ) : loadError && !enModeModifies ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-red-600">
                  {loadError}{" "}
                  <button
                    type="button"
                    onClick={() => fetchLots(0)}
                    className="underline"
                  >
                    Réessayer
                  </button>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-10 text-center text-slate-500"
                >
                  Aucun lot à afficher.
                </td>
              </tr>
            ) : (
              rows.map((lot) => (
                <LotRow
                  key={lot.lotId}
                  lot={lot}
                  saisie={saisies[lot.lotId] ?? ""}
                  inList={!!liste[lot.lotId]}
                  onChange={onChange}
                  onAdd={onAdd}
                />
              ))
            )}
          </tbody>
        </table>

        {/* Sentinelle de défilement + compteur */}
        {rows.length > 0 && !loadError && (
          <div
            ref={sentinelRef}
            className="px-3 py-3 text-center text-xs text-slate-500 dark:text-slate-400"
          >
            {loadingMore
              ? "Chargement de la suite…"
              : hasMore
                ? `${rows.length} / ${totalAffichable} lots affichés — faites défiler pour en voir plus…`
                : `${totalAffichable} lot(s) affiché(s)`}
          </div>
        )}
      </section>

      {/* Barre fixe en bas : toujours accessible, sans défiler jusqu'au dernier lot */}
      <div className="sticky bottom-0 z-30 -mx-4 md:-mx-6">
        {listeVisible && (
          <div className="max-h-[45vh] overflow-y-auto border-t border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="px-3 py-2">Code lot</th>
                  <th className="px-3 py-2">Article</th>
                  <th className="px-3 py-2 text-right">Ancienne qté</th>
                  <th className="px-3 py-2">Nouvelle qté</th>
                  <th className="px-3 py-2 text-right">Écart</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {modifications.map((m) => (
                  <tr
                    key={m.lotId}
                    className="border-t border-slate-200 dark:border-slate-700"
                  >
                    <td className="px-3 py-2 font-mono">{m.lotCode}</td>
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs text-slate-500">
                        {m.lotArtCode}
                      </span>{" "}
                      {m.nomArticle}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmt(m.ancienneQuantite)}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step={QUANTITE_STEP}
                        defaultValue={m.nouvelleQuantite}
                        disabled={saving}
                        onChange={(e) =>
                          modifierDansListe(m.lotId, e.target.value)
                        }
                        className="w-28 rounded-md border border-slate-300 bg-white px-2 py-1 text-right tabular-nums dark:border-slate-600 dark:bg-slate-900"
                      />
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-medium tabular-nums ${ecartClass(m.ecart)}`}
                    >
                      {fmtEcart(m.ecart)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => retirer(m.lotId)}
                        disabled={saving}
                        className="text-sm text-red-600 hover:underline disabled:opacity-40"
                      >
                        Retirer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] backdrop-blur md:px-6 dark:border-slate-700 dark:bg-slate-900/95">
          <div className="text-sm">
            <span className="rounded-full bg-sky-100 px-2 py-0.5 font-medium text-sky-800 dark:bg-sky-900 dark:text-sky-200">
              {modifications.length} lot(s) dans la liste
            </span>
            {modifications.length > 0 && (
              <span className="ml-2 text-slate-500 dark:text-slate-400">
                dont {stats.avecEcart} avec écart
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setListeOuverte((o) => !o)}
              disabled={modifications.length === 0}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:opacity-40 dark:border-slate-600"
            >
              {listeVisible ? "Masquer la liste ▼" : "Voir la liste ▲"}
            </button>
            <button
              type="button"
              onClick={() => setListe({})}
              disabled={modifications.length === 0 || saving}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:opacity-40 dark:border-slate-600"
            >
              Vider la liste
            </button>
            <button
              type="button"
              onClick={enregistrer}
              disabled={modifications.length === 0 || saving}
              className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? "Enregistrement…" : "Enregistrer les modifications"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
