import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import { apiFetch } from "../../services/api";
import SearchableSelect from "../Home/modal/utils/searchableSelect";
/* =========================
   TYPES API
========================== */

export interface LotApi {
  lot_id: number;
  lot_code: string;
  lot_datePeremption: string | null;
  lot_quantite: number;
}

export interface ArticleApi {
  id: number;
  code: string;
  prix_ht: number;
  prix_vte: number;
  pri_tva: number;
  nom_article: string;
  lots: LotApi[];
  quantite_stock: number;
}

/* =========================
   TYPE LIGNE
========================== */

export interface ArticleVente {
  uid?: string;
  pri_id: string;
  pri_article: string;
  pri_designation: string;
  pri_quantite: number;
  pri_pua: string;
  pri_tva: number;
  pri_tva_ar: number;
  pri_totalht: number;
  pri_totalttc: number;
  remise: number;
  pri_montant_remise: number;
  datePeremption: string;
  lot_code: string;
  quantite_stock?: number;
}

interface ArticleModalProps {
  open: boolean;
  article?: ArticleVente | null;
  onClose: () => void;
  onSave: (article: ArticleVente) => void;
  className?: string;
}

const emptyArticle: ArticleVente = {
  pri_id: "",
  pri_article: "",
  pri_designation: "",
  pri_quantite: 0,
  pri_pua: "",
  pri_tva: 0,
  pri_tva_ar: 0,
  pri_totalht: 0,
  pri_totalttc: 0,
  remise: 0,
  montant_remise: 0,
  datePeremption: "",
  lot_code: "",
  quantite_stock: 0,
};

const inputClass = `
  h-10 w-full rounded-md border border-gray-300 px-3 text-sm
  outline-none focus:border-blue-500
  dark:border-gray-600 dark:bg-gray-800 dark:text-white
`;

const labelClass =
  "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300";

export default function ArticleModal({
  open,
  article,
  onClose,
  onSave,
  className,
}: ArticleModalProps) {
  const [form, setForm] = useState<ArticleVente>(emptyArticle);

  /* ---- autocomplete ---- */
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<ArticleApi[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [loading, setLoading] = useState(false);

  /* ---- lots de l'article choisi ---- */
  const [lots, setLots] = useState<LotApi[]>([]);
  const [lotMode, setLotMode] = useState<"existant" | "nouveau">("nouveau");

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipSearch = useRef(false); // évite de relancer une recherche après sélection
  const requestId = useRef(0); // évite les réponses hors délai

  /* =========================
     REQUÊTE AUTOCOMPLETE
  ========================== */

  const rechercherArticle = useCallback(async (code: string) => {
    const currentId = ++requestId.current;

    if (!code.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setLoading(true);
      const query = new URLSearchParams();
      query.set("search", code);

      const res = await apiFetch(
        `/api/articles-autocomplete/?${query.toString()}`,
      );

      if (currentId !== requestId.current) return; // réponse obsolète

      if (res.status) {
        setSuggestions(res.articles ?? []);
        setShowSuggestions(true);
        setHighlight(-1);
      }
    } catch (err) {
      console.error(err);
      if (currentId === requestId.current) setSuggestions([]);
    } finally {
      if (currentId === requestId.current) setLoading(false);
    }
  }, []);

  /* ---- débounce 300 ms ---- */
  useEffect(() => {
    if (!open) return;

    if (skipSearch.current) {
      skipSearch.current = false;
      return;
    }

    const timer = setTimeout(() => rechercherArticle(search), 300);
    return () => clearTimeout(timer);
  }, [search, open, rechercherArticle]);

  /* =========================
     INITIALISATION
  ========================== */

  useEffect(() => {
    if (!open) return;

    const base = article ? { ...article } : { ...emptyArticle };
    setForm(base);
    setSearch(base.pri_article);
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlight(-1);
    skipSearch.current = true; // ne pas ouvrir le dropdown à l'ouverture

    if (article?.pri_article) {
      // Mode édition : on recharge les lots de l'article
      chargerLots(article.pri_article);
      setLotMode(article.lot_code ? "existant" : "nouveau");
    } else {
      setLots([]);
      setLotMode("nouveau");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, article]);

  const chargerLots = async (code: string) => {
    try {
      const query = new URLSearchParams();
      query.set("search", code);

      const res = await apiFetch(
        `/api/articles-autocomplete/?${query.toString()}`,
      );

      if (res.status) {
        const trouve = (res.articles as ArticleApi[]).find(
          (a) => a.code === code,
        );
        setLots(trouve?.lots ?? []);
      }
    } catch (err) {
      console.error(err);
      setLots([]);
    }
  };

  /* =========================
     FERMETURE AU CLIC EXTÉRIEUR
  ========================== */

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* =========================
     SÉLECTION D'UN ARTICLE
  ========================== */

  const choisirArticle = (a: ArticleApi) => {
    skipSearch.current = true;
    setSearch(a.code);

    setForm((prev) => ({
      ...prev,
      pri_id: String(a.id),
      pri_article: a.code,
      pri_designation: a.nom_article,
      pri_pua: String(a.prix_ht ?? ""),
      pri_tva: Number(a.pri_tva ?? 0),
      pri_tva_ar: (Number(a.pri_tva ?? 0) * a.prix_ht) / 100,
      pri_totalttc: 0,
      // on repart d'un lot vierge : les lots dépendent de l'article
      lot_code: "",
      datePeremption: "",
      quantite_stock: a.quantite_stock,
    }));

    setLots(a.lots ?? []);
    setLotMode(a.lots && a.lots.length > 0 ? "existant" : "nouveau");
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlight(-1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setShowSuggestions(true);

    // L'article n'est plus considéré comme validé tant qu'on tape
    setForm((prev) => ({
      ...prev,
      pri_article: "",
      pri_id: "",
    }));
    setLots([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const index = highlight >= 0 ? highlight : 0;
      choisirArticle(suggestions[index]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  /* =========================
     SÉLECTION D'UN LOT
  ========================== */

  const choisirLot = (lotId: string) => {
    if (lotId === "__new__") {
      setLotMode("nouveau");
      setForm((prev) => ({ ...prev, lot_code: "", datePeremption: "" }));
      return;
    }

    const lot = lots.find((l) => String(l.lot_id) === lotId);
    if (!lot) return;

    setLotMode("existant");
    setForm((prev) => ({
      ...prev,
      lot_code: lot.lot_code,
      datePeremption: lot.lot_datePeremption ?? "",
    }));
  };

  /* =========================
     CHAMPS SIMPLES
  ========================== */

  const handleChange = (field: keyof ArticleVente, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /* =========================
     CALCUL TOTAL HT
  ========================== */

  useEffect(() => {
    const quantite = Number(form.pri_quantite) || 0;
    const pua = Number(form.pri_pua) || 0;
    const remise = Number(form.remise) || 0;

    const totalBrut = quantite * pua;
    const montantRemise = totalBrut * (remise / 100);
    const totalHT = totalBrut - montantRemise;

    // TVA calculée sur le HT après remise, pas sur le brut
    const tva_ar = totalHT * (Number(form.pri_tva) / 100);
    const totalttc = tva_ar + totalHT;

    setForm((prev) => {
      if (
        prev.pri_totalht === totalHT &&
        prev.pri_tva_ar === tva_ar &&
        prev.pri_totalttc === totalttc &&
        prev.pri_montant_remise === montantRemise
      ) {
        return prev;
      }
      return {
        ...prev,
        pri_totalht: totalHT,
        pri_tva_ar: tva_ar,
        pri_totalttc: totalttc,
        pri_montant_remise: montantRemise,
      };
    });
  }, [form.pri_quantite, form.pri_pua, form.remise]);

  /* =========================
     ENREGISTRER
  ========================== */

  const handleSubmit = () => {
    if (!form.pri_article || !form.pri_id) {
      alert("Veuillez sélectionner un article dans la liste.");
      inputRef.current?.focus();
      return;
    }

    if (Number(form.pri_quantite) <= 0) {
      alert("La quantité doit être supérieure à 0.");
      return;
    }

    if (Number(form.pri_pua) < 0) {
      alert("Le prix unitaire est invalide.");
      return;
    }

    onSave(form);
    onClose();
  };

  if (!open) return null;

  const lotSelectValue =
    lotMode === "nouveau"
      ? "__new__"
      : String(
          lots.find((l) => l.lot_code === form.lot_code)?.lot_id ?? "__new__",
        );

  return (
    <Modal isOpen={open} onClose={onClose} className={className}>
      <div className="max-h-[700px] overflow-auto">
        {/* ========== HEADER ========== */}
        <div className="flex h-14 items-center justify-center border-b border-gray-200 px-5 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {article ? "Modifier l'article" : "Ajouter un article"}
          </h2>
        </div>

        {/* ========== BODY ========== */}
        <div className="p-5">
          <div className="grid grid-cols-12 gap-x-4 gap-y-4">
            {/* ARTICLE — AUTOCOMPLETE */}
            <div className="col-span-12 md:col-span-5">
              <div className="flex justify-between">
                <label className={labelClass}>Article</label>

                <div className="relative group">
                  {/* Quantité */}
                  <span className="cursor-help inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-brand-300 text-white text-[20px] font-bold">
                    {form.quantite_stock || 0}
                  </span>

                  {/* Popup au survol */}
                  <div
                    className="
                      absolute right-0 top-7 z-50
                      invisible opacity-0 translate-y-1
                      group-hover:visible group-hover:opacity-100 group-hover:translate-y-0
                      transition-all duration-200
                      whitespace-nowrap
                      rounded-md bg-gray-800 px-3 py-1.5
                      text-xs text-white shadow-lg
                      pointer-events-none
                    "
                  >
                    Quantité en stock :{" "}
                    <span className="font-bold">
                      {form.quantite_stock || 0}
                    </span>
                  </div>
                </div>
              </div>
              <SearchableSelect<ArticleApi>
                value={search}
                onChange={handleSearchChange}
                suggestions={suggestions}
                loading={loading}
                onSelect={choisirArticle}
                placeholder="Code ou nom de l'article"
                noResultsText="Aucun article trouvé"
                getKey={(article) => article.id}
                inputClassName={inputClass}
                renderItem={(article) => (
                  <div className="px-3 py-2">
                    <div className="text-sm font-medium text-gray-800 dark:text-white">
                      {article.code}
                    </div>

                    <div className="truncate text-xs text-gray-500">
                      {article.nom_article}
                    </div>

                    <div className="text-xs text-gray-400">
                      {Number(article.prix_ht).toLocaleString("fr-FR")} Ar · TVA{" "}
                      {article.pri_tva}%
                    </div>
                  </div>
                )}
              />
            </div>

            {/* DESIGNATION */}
            <div className="col-span-12 md:col-span-7">
              <label className={labelClass}>Désignation</label>
              <input
                type="text"
                value={form.pri_designation}
                onChange={(e) =>
                  handleChange("pri_designation", e.target.value)
                }
                placeholder="Désignation de l'article"
                className={inputClass}
              />
            </div>

            {/* QUANTITE */}
            <div className="col-span-12 md:col-span-3">
              <label className={labelClass}>Quantité</label>
              <input
                type="number"
                min="0"
                value={form.pri_quantite}
                onChange={(e) =>
                  handleChange("pri_quantite", Number(e.target.value))
                }
                className={inputClass}
              />
            </div>

            {/* PUA */}
            <div className="col-span-12 md:col-span-3">
              <label className={labelClass}>Prix unitaire</label>
              <input
                type="number"
                min="0"
                value={form.pri_pua}
                onChange={(e) => handleChange("pri_pua", e.target.value)}
                placeholder="0"
                className={inputClass}
              />
            </div>

            {/* TVA */}
            <div className="col-span-12 md:col-span-3">
              <label className={labelClass}>TVA (Ar)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.pri_tva_ar}
                onChange={(e) =>
                  handleChange("pri_tva", Number(e.target.value))
                }
                className={inputClass}
              />
            </div>

            {/* REMISE */}
            <div className="col-span-12 md:col-span-3">
              <label className={labelClass}>Remise (%)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.remise}
                onChange={(e) => handleChange("remise", Number(e.target.value))}
                className={inputClass}
              />
            </div>

            {/* TOTAL HT */}
            <div className="col-span-12 md:col-span-4">
              <label className={labelClass}>Total HT</label>
              <input
                type="text"
                value={`${form.pri_totalht.toLocaleString("fr-FR")} Ar`}
                readOnly
                className="
                  h-10 w-full rounded-md border border-gray-300 bg-gray-50 px-3
                  text-sm font-semibold  outline-none
                  dark:border-gray-600 dark:bg-gray-800 dark:text-white/80
                "
              />
            </div>

            {/* LOT */}
            <div className="col-span-12 md:col-span-4">
              <label className={labelClass}>Code lot</label>

              {lots.length > 0 && (
                <select
                  value={lotSelectValue}
                  onChange={(e) => choisirLot(e.target.value)}
                  className={`${inputClass} mb-2 bg-white`}
                >
                  <option value="__new__">— Nouveau lot —</option>
                  {lots.map((lot) => (
                    <option key={lot.lot_id} value={lot.lot_id}>
                      {lot.lot_code || `Lot #${lot.lot_id}`}
                      {lot.lot_datePeremption
                        ? ` (exp. ${lot.lot_datePeremption})`
                        : ""}
                    </option>
                  ))}
                </select>
              )}

              {(lotMode === "nouveau" || lots.length === 0) && (
                <input
                  type="text"
                  value={form.lot_code}
                  onChange={(e) => handleChange("lot_code", e.target.value)}
                  placeholder="Ex : LOT-2026-001"
                  className={inputClass}
                />
              )}
            </div>

            {/* PEREMPTION */}
            <div className="col-span-12 md:col-span-4">
              <label className={labelClass}>Date de péremption</label>
              <input
                type="date"
                value={form.datePeremption}
                onChange={(e) => handleChange("datePeremption", e.target.value)}
                readOnly={lotMode === "existant"}
                className={`${inputClass} ${
                  lotMode === "existant" ? "bg-gray-50 dark:bg-gray-900" : ""
                }`}
              />
            </div>
          </div>
        </div>

        {/* ========== FOOTER ========== */}
        <div className="flex justify-between items-center gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-700">
          <div className="col-span-12 md:col-span-4">
            <div className="flex items-center">
              <span className="mr-2 dark:text-white">TTC: </span>
              <span className="text-green-600">
                <strong>
                  {Number(form.pri_totalttc).toLocaleString("fr-FR")} Ar
                </strong>
              </span>
              <span className="ml-2 dark:text-white"> | Remise: </span>
              <span className="text-red-600 ml-2">
                <strong>
                  {form.pri_montant_remise > 0
                    ? Number(form.pri_montant_remise).toLocaleString("fr-FR")
                    : "0"}{" "}
                  Ar
                </strong>
              </span>
            </div>
          </div>
          <div>
            <button
              type="button"
              onClick={onClose}
              className="
              rounded-md bg-gray-100 px-5 py-2 text-sm font-medium text-gray-700
              hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300
            "
            >
              Annuler
            </button>

            <Button
              type="button"
              onClick={handleSubmit}
              className="rounded-md px-5 py-2 text-sm font-medium text-white"
            >
              {article ? "Modifier" : "Ajouter"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
