import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Modal } from "../../../../components/ui/modal";
import Button from "../../../../components/ui/button/Button";
import SearchableSelect from "./searchableSelect";
// ============================================================
// TYPES
// ============================================================

export interface LotBase {
  lot_id: number;
  lot_code: string;
  lot_datePeremption: string | null;
  lot_quantite?: number;
}

/**
 * Configuration d'un champ du formulaire
 */
export interface ArticleField<T> {
  name: keyof T;
  label: string;

  type?: "text" | "number" | "date";

  placeholder?: string;

  /**
   * Permet de définir la valeur affichée
   */
  getValue?: (item: T) => string | number;

  /**
   * Transformation de la valeur avant de la mettre
   * dans le formulaire
   */
  parseValue?: (value: string) => unknown;

  /**
   * Permet de masquer le champ
   */
  hidden?: boolean;

  /**
   * Permet de rendre le champ readonly
   */
  readOnly?: boolean;

  /**
   * Classes Tailwind
   */
  className?: string;

  min?: number;
  step?: number;

  /**
   * Permet d'afficher un contenu personnalisé
   */
  render?: (item: T, onChange: (value: unknown) => void) => ReactNode;
}

/**
 * Configuration de l'autocomplete
 */
export interface ArticleSearchConfig<T, S> {
  /**
   * Recherche les articles
   */
  search: (value: string) => Promise<S[]>;

  /**
   * Clé unique
   */
  getKey: (item: S) => string | number;

  /**
   * Texte affiché dans l'input après sélection
   */
  getSearchValue: (item: S) => string;

  /**
   * Transforme le résultat API en objet formulaire
   */
  mapToForm: (item: S, previous: T) => T;

  /**
   * Affichage d'une suggestion
   */
  renderItem: (item: S) => ReactNode;

  /**
   * Récupération des lots
   */
  getLots?: (item: S) => LotBase[];

  /**
   * Récupération du stock
   */
  getStock?: (item: S) => number;
}

/**
 * Configuration du calcul
 */
export interface ArticleCalculation<T> {
  calculate: (form: T) => Partial<T>;
}

/**
 * Props principales
 */
export interface GenericArticleModalProps<T, S> {
  open: boolean;

  article?: T | null;

  /**
   * Objet vide utilisé lors de la création
   */
  emptyValue: T;

  onClose: () => void;

  onSave: (article: T) => void;

  /**
   * Configuration de recherche
   */
  searchConfig?: ArticleSearchConfig<T, S>;

  /**
   * Champs affichés
   */
  fields: ArticleField<T>[];

  /**
   * Calcul automatique
   */
  calculation?: ArticleCalculation<T>;

  /**
   * Validation avant sauvegarde
   */
  validate?: (form: T) => string | null;

  /**
   * Permet de définir l'identifiant de l'article
   */
  getId?: (item: T) => string | number;

  /**
   * Permet d'obtenir le code article
   */
  getArticleCode?: (item: T) => string;

  /**
   * Affichage du footer
   */
  renderFooter?: (form: T) => ReactNode;

  className?: string;

  titleCreate?: string;
  titleEdit?: string;
  getStock?: (article: T) => number;
}

// ============================================================
// CONSTANTES
// ============================================================

const inputClass = `
  h-10 w-full rounded-md border border-gray-300 px-3 text-sm
  outline-none focus:border-blue-500
  dark:border-gray-600 dark:bg-gray-800 dark:text-white
`;

const labelClass =
  "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300";

// ============================================================
// COMPOSANT
// ============================================================

export default function GenericArticleModal<T, S>({
  open,
  article,
  emptyValue,
  onClose,
  onSave,

  searchConfig,
  fields,

  calculation,
  validate,

  getArticleCode,

  renderFooter,

  className,

  titleCreate = "Ajouter un article",
  titleEdit = "Modifier l'article",
  getStock,
}: GenericArticleModalProps<T, S>) {
  // ==========================================================
  // FORM
  // ==========================================================

  const [form, setForm] = useState<T>(emptyValue);

  // ==========================================================
  // SEARCH
  // ==========================================================

  const [search, setSearch] = useState("");

  const [suggestions, setSuggestions] = useState<S[]>([]);

  const [showSuggestions, setShowSuggestions] = useState(false);

  const [loading, setLoading] = useState(false);

  const [highlight, setHighlight] = useState(-1);

  const skipSearch = useRef(false);

  const requestId = useRef(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // ==========================================================
  // LOTS
  // ==========================================================

  const [lots, setLots] = useState<LotBase[]>([]);

  const [lotMode, setLotMode] = useState<"existant" | "nouveau">("nouveau");

  // ==========================================================
  // INITIALISATION
  // ==========================================================

  useEffect(() => {
    if (!open) return;

    const initialValue = article ? { ...article } : { ...emptyValue };

    setForm(initialValue);

    setSearch(article && getArticleCode ? getArticleCode(article) : "");

    setSuggestions([]);
    setShowSuggestions(false);
    setHighlight(-1);

    skipSearch.current = true;

    setLots([]);
    setLotMode("nouveau");

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, article]);

  // ==========================================================
  // RECHERCHE
  // ==========================================================

  const rechercherArticle = useCallback(
    async (value: string) => {
      if (!searchConfig) return;

      const currentId = ++requestId.current;

      if (!value.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        setLoading(true);

        const result = await searchConfig.search(value);

        if (currentId !== requestId.current) {
          return;
        }

        setSuggestions(result);

        setShowSuggestions(true);

        setHighlight(-1);
      } catch (error) {
        console.error("Erreur recherche article :", error);

        if (currentId === requestId.current) {
          setSuggestions([]);
        }
      } finally {
        if (currentId === requestId.current) {
          setLoading(false);
        }
      }
    },
    [searchConfig],
  );

  // ==========================================================
  // DEBOUNCE
  // ==========================================================

  useEffect(() => {
    if (!open || !searchConfig) return;

    if (skipSearch.current) {
      skipSearch.current = false;
      return;
    }

    const timer = setTimeout(() => {
      rechercherArticle(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, open, rechercherArticle, searchConfig]);

  // ==========================================================
  // CHANGE SEARCH
  // ==========================================================

  const handleSearchChange = (value: string) => {
    setSearch(value);

    setShowSuggestions(true);

    setHighlight(-1);

    setForm((prev) => {
      if (!getArticleCode) {
        return prev;
      }

      const currentCode = getArticleCode(prev);

      if (currentCode === value) {
        return prev;
      }

      return prev;
    });

    setLots([]);
  };

  // ==========================================================
  // SELECT ARTICLE
  // ==========================================================

  const choisirArticle = (item: S) => {
    if (!searchConfig) return;

    skipSearch.current = true;

    const searchValue = searchConfig.getSearchValue(item);
    setSearch(searchValue);

    setForm((prev) => searchConfig.mapToForm(item, prev));

    const itemLots = searchConfig.getLots?.(item) ?? [];

    setLots(itemLots);

    setLotMode(itemLots.length > 0 ? "existant" : "nouveau");

    setSuggestions([]);

    setShowSuggestions(false);

    setHighlight(-1);
  };

  // ==========================================================
  // KEYBOARD
  // ==========================================================

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();

      setHighlight((index) => (index + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();

      setHighlight((index) =>
        index <= 0 ? suggestions.length - 1 : index - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();

      const index = highlight >= 0 ? highlight : 0;

      choisirArticle(suggestions[index]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleChange = <K extends keyof T>(field: K, value: T[K]) => {
    setForm((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };

      if (calculation) {
        const calculated = calculation.calculate(updated);

        return {
          ...updated,
          ...calculated,
        };
      }

      return updated;
    });
  };

  // ==========================================================
  // LOT
  // ==========================================================

  const choisirLot = (lotId: string) => {
    if (lotId === "__new__") {
      setLotMode("nouveau");

      return;
    }

    const lot = lots.find((item) => String(item.lot_id) === lotId);

    if (!lot) return;

    setLotMode("existant");
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = () => {
    console.log(form)
    if (validate) {
      const error = validate(form);

      if (error) {
        alert(error);
        return;
      }
    }
    onSave(form);

    onClose();
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  if (!open) {
    return null;
  }

  return (
    <Modal isOpen={open} onClose={onClose} className={className}>
      <div className="max-h-[700px] overflow-auto">
        {/* ==================================================
            HEADER
        ================================================== */}
        <div
          className="
            flex h-14 items-center justify-center
            border-b border-gray-200 px-5
            dark:border-gray-700
          "
        >
          <h2
            className="
              text-lg font-semibold
              text-gray-900 dark:text-white
            "
          >
            {article ? titleEdit : titleCreate}
          </h2>
        </div>

        {/* ==================================================
            BODY
        ================================================== */}

        <div className="p-5">
          <div
            className="
              grid grid-cols-12
              gap-x-4 gap-y-4
            "
          >
            {/* ================================================
                AUTOCOMPLETE
            ================================================ */}

            {searchConfig && (
              <div className="col-span-12">
                <label className={labelClass}>Article</label>

                <SearchableSelect<S>
                  value={search}
                  onChange={handleSearchChange}
                  suggestions={suggestions}
                  loading={loading}
                  onSelect={choisirArticle}
                  onKeyDown={handleKeyDown}
                  placeholder="Code ou nom de l'article"
                  noResultsText="Aucun article trouvé"
                  getKey={searchConfig.getKey}
                  inputClassName={inputClass}
                  renderItem={searchConfig.renderItem}
                />
              </div>
            )}

            {/* ================================================
                CHAMPS
            ================================================ */}

            {fields
              .filter((field) => !field.hidden)
              .map((field) => {
                const value = field.getValue
                  ? field.getValue(form)
                  : (form[field.name] as unknown as string | number);

                return (
                  <div
                    key={String(field.name)}
                    className={`
                      col-span-12
                      md:col-span-4
                      ${field.className ?? ""}
                    `}
                  >
                    <label className={labelClass}>{field.label}</label>

                    {field.render ? (
                      field.render(form, (value) =>
                        handleChange(field.name, value),
                      )
                    ) : (
                      <input
                        type={field.type ?? "text"}
                        value={value ?? ""}
                        min={field.min}
                        step={field.step}
                        placeholder={field.placeholder}
                        readOnly={field.readOnly}
                        onChange={(e) => {
                          const raw = e.target.value;

                          const parsed = field.parseValue
                            ? field.parseValue(raw)
                            : field.type === "number"
                              ? Number(raw)
                              : raw;

                          handleChange(field.name, parsed);
                        }}
                        className={inputClass}
                      />
                    )}
                  </div>
                );
              })}

            {/* ================================================
                LOT
            ================================================ */}

            {/*{searchConfig?.getLots && (
              <div
                className="
                  col-span-12
                  md:col-span-6
                "
              >
                <label className={labelClass}>Date Per</label>

                {lots.length > 0 && (
                  <select
                    className={`${inputClass} mb-2 bg-white`}
                    onChange={(e) => choisirLot(e.target.value)}
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
                    placeholder="Ex : 2026-001"
                    className={inputClass}
                  />
                )}
              </div>
            )}*/}
          </div>
        </div>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div
          className="
            border-t border-gray-200
            px-4 py-3
            dark:border-gray-700
          "
        >
          {/* Partie supérieure : stock + contenu personnalisé */}
          <div
            className="
              flex items-center justify-between
              gap-3
              mb-3
              sm:mb-0
              sm:flex-1
            "
          >
            {/* Stock */}
            {getStock && (
              <div className="relative group shrink-0">
                <span
                  className="
                    cursor-help
                    inline-flex items-center justify-center
                    min-w-5 h-5 px-1.5
                    rounded-full
                    bg-brand-300
                    text-white text-[18px]
                    font-bold
                  "
                >
                  {getStock(form) || 0}
                </span>

                {/* Popup */}
                <div
                  className="
                    absolute left-0 bottom-7 z-50
                    invisible opacity-0 translate-y-1
                    group-hover:visible
                    group-hover:opacity-100
                    group-hover:translate-y-0
                    transition-all duration-200
                    whitespace-nowrap
                    rounded-md
                    bg-gray-800
                    px-3 py-1.5
                    text-xs text-white
                    shadow-lg
                    pointer-events-none
                  "
                >
                  Quantité en stock :{" "}
                  <span className="font-bold">{getStock(form) || 0}</span>
                </div>
              </div>
            )}

            {/* Footer personnalisé */}
            {renderFooter && (
              <div className="flex-1 min-w-0">{renderFooter(form)}</div>
            )}
          </div>

          {/* Boutons */}
          <div
            className="
              flex gap-2
              w-full
              sm:w-auto
              sm:justify-end
            "
          >
            <button
              type="button"
              onClick={onClose}
              className="
                flex-1 sm:flex-none
                rounded-md
                bg-gray-100
                px-4 sm:px-5
                py-2
                text-sm font-medium
                text-gray-700
                hover:bg-gray-200
                dark:bg-gray-800
                dark:text-gray-300
                dark:hover:bg-gray-700
              "
            >
              Annuler
            </button>

            <Button
              type="button"
              onClick={handleSubmit}
              className="
                flex-1 sm:flex-none
                rounded-md
                px-4 sm:px-5
                py-2
                text-sm font-medium
                text-white
              "
            >
              {article ? "Modifier" : "Ajouter"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
