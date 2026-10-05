import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type KeyboardEvent,
} from "react";

import { Modal } from "../../../../components/ui/modal";
import Button from "../../../../components/ui/button/Button";
import SearchableSelect from "./searchableSelect";
import Alert from "../../../../components/ui/alert/Alert";

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
 * Lot avec la quantité qui sera réellement utilisée
 * pour la ligne article.
 */
export interface LotAllocation extends LotBase {
  /**
   * Quantité prélevée dans ce lot
   */
  quantiteUtilisee: number;
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

  /**
   * Sauvegarde d'une seule ligne
   */
  onSave: (article: T) => void;

  /**
   * Sauvegarde de plusieurs lignes.
   *
   * Utilisé lorsque la quantité demandée doit être
   * répartie sur plusieurs lots.
   */
  onSaveMultiple?: (articles: T[]) => void;

  onClose: () => void;

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

  /**
   * Récupération des lots disponibles.
   *
   * Cette fonction doit retourner les lots dans l'ordre
   * dans lequel ils doivent être consommés.
   *
   * Exemple :
   *
   * [
   *   {
   *     lot_id: 1,
   *     lot_code: "LOT-001",
   *     lot_datePeremption: "2027-01-22",
   *     lot_quantite: 6,
   *     quantiteUtilisee: 6
   *   },
   *   {
   *     lot_id: 2,
   *     lot_code: "LOT-002",
   *     lot_datePeremption: "2028-12-12",
   *     lot_quantite: 8,
   *     quantiteUtilisee: 4
   *   }
   * ]
   */
  getLots?: (article: S, form: T) => LotAllocation[];

  /**
   * Transforme une allocation de lot en ligne article.
   *
   * Cette fonction permet au GenericArticleModal de rester
   * complètement générique.
   *
   * Exemple pour ProLigneArticle :
   *
   * mapLotToLine={(form, lot) => ({
   *   ...form,
   *   prol_Quantite: lot.quantiteUtilisee,
   *   prol_lot: lot.lot_code,
   *   prol_datePer: lot.lot_datePeremption || "",
   * })}
   */
  mapLotToLine?: (form: T, lot: LotAllocation) => T;

  className?: string;

  titleCreate?: string;
  titleEdit?: string;

  /**
   * Stock de l'article sélectionné
   */
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
  onSaveMultiple,

  searchConfig,
  fields,

  calculation,
  validate,

  getArticleCode,

  renderFooter,

  getLots,
  mapLotToLine,

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

  // ==========================================================
  // ARTICLE SELECTIONNE
  // ==========================================================

  /**
   * Article API réellement sélectionné.
   *
   * On le garde séparément de `form` car `form` contient
   * uniquement la ligne à sauvegarder.
   */
  const [selectedArticle, setSelectedArticle] = useState<S | null>(null);

  // ==========================================================
  // ALERT
  // ==========================================================

  const [alert, setAlert] = useState({
    open: false,
    variant: "success" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
  });

  // ==========================================================
  // LOTS
  // ==========================================================

  /**
   * Les lots sont calculés automatiquement à partir :
   *
   * - de l'article sélectionné
   * - du formulaire actuel
   * - de getLots()
   *
   * Il n'est donc plus nécessaire d'avoir un état `lots`.
   */
  const lots = useMemo<LotAllocation[]>(() => {
    if (!selectedArticle || !getLots) {
      return [];
    }

    try {
      const result = getLots(selectedArticle, form);

      if (!Array.isArray(result)) {
        return [];
      }

      return result.filter((lot) => Number(lot.quantiteUtilisee || 0) > 0);
    } catch (error) {
      console.error("Erreur lors du calcul des lots :", error);

      return [];
    }
  }, [selectedArticle, form, getLots]);

  // ==========================================================
  // INITIALISATION
  // ==========================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    const initialValue = article ? { ...article } : { ...emptyValue };

    setForm(initialValue);

    setSearch(article && getArticleCode ? getArticleCode(article) : "");

    setSuggestions([]);

    setShowSuggestions(false);

    setHighlight(-1);

    setSelectedArticle(null);

    skipSearch.current = true;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, article]);

  // ==========================================================
  // RECHERCHE
  // ==========================================================

  const rechercherArticle = useCallback(
    async (value: string) => {
      if (!searchConfig) {
        return;
      }

      const currentId = ++requestId.current;

      if (!value.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        setLoading(true);

        const result = await searchConfig.search(value);

        /**
         * Protection contre les réponses
         * asynchrones dans le mauvais ordre.
         */
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
    if (!open || !searchConfig) {
      return;
    }

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

    /**
     * Dès que l'utilisateur modifie la recherche,
     * l'article sélectionné n'est plus considéré
     * comme actif.
     */
    setSelectedArticle(null);
  };

  // ==========================================================
  // SELECT ARTICLE
  // ==========================================================

  const choisirArticle = (item: S) => {
    if (!searchConfig) {
      return;
    }

    skipSearch.current = true;

    const searchValue = searchConfig.getSearchValue(item);

    setSearch(searchValue);

    /**
     * On garde l'article API sélectionné.
     * getLots() pourra ensuite calculer les lots
     * en fonction de la quantité présente dans `form`.
     */
    setSelectedArticle(item);

    setForm((prev) => searchConfig.mapToForm(item, prev));

    setSuggestions([]);

    setShowSuggestions(false);

    setHighlight(-1);
  };

  // ==========================================================
  // KEYBOARD
  // ==========================================================

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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

  // ==========================================================
  // CHANGE FORM
  // ==========================================================

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
  // SUBMIT
  // ==========================================================

  const handleSubmit = () => {
    console.log("Formulaire :", form);

    // ======================================================
    // VALIDATION
    // ======================================================

    if (validate) {
      const error = validate(form);

      if (error) {
        setAlert({
          open: true,
          message: error,
          title: "Une erreur est survenue",
          variant: "error",
        });

        return;
      }
    }

    // ======================================================
    // AUCUN LOT
    // ======================================================

    /**
     * Si aucun lot n'est disponible,
     * on sauvegarde normalement une seule ligne.
     */
    if (!getLots || !selectedArticle || lots.length === 0) {
      onSave(form);

      onClose();

      return;
    }

    // ======================================================
    // UN SEUL LOT
    // ======================================================

    if (lots.length === 1) {
      /**
       * Si mapLotToLine existe, on injecte :
       *
       * - la quantité utilisée
       * - le lot
       * - la date de péremption
       *
       * dans la ligne finale.
       */
      if (mapLotToLine) {
        const ligne = mapLotToLine(form, lots[0]);

        onSave(ligne);
      } else {
        /**
         * Sans mapLotToLine, on conserve
         * le comportement classique.
         */
        onSave(form);
      }

      onClose();

      return;
    }

    // ======================================================
    // PLUSIEURS LOTS
    // ======================================================

    /**
     * Plusieurs lots sont nécessaires.
     *
     * Exemple :
     *
     * quantité demandée = 10
     *
     * lot 1 = 6
     * lot 2 = 4
     *
     * lots =
     *
     * [
     *   { lot: "LOT1", quantiteUtilisee: 6 },
     *   { lot: "LOT2", quantiteUtilisee: 4 }
     * ]
     *
     * On transforme chaque lot en une ligne article.
     */

    if (!mapLotToLine) {
      setAlert({
        open: true,
        message:
          "Plusieurs lots sont nécessaires mais mapLotToLine n'est pas configuré.",
        title: "Configuration des lots",
        variant: "error",
      });

      return;
    }

    if (!onSaveMultiple) {
      setAlert({
        open: true,
        message:
          "Plusieurs lots sont nécessaires mais onSaveMultiple n'est pas configuré.",
        title: "Configuration des lots",
        variant: "error",
      });

      return;
    }

    const articles = lots.map((lot) => mapLotToLine(form, lot));

    console.log("Articles générés depuis les lots :", articles);

    // ======================================================
    // SAUVEGARDE DES MULTIPLES LIGNES
    // ======================================================

    onSaveMultiple(articles);

    onClose();
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  if (!open) {
    return null;
  }

  // ==========================================================
  // TOTAL LOTS UTILISES
  // ==========================================================

  const totalLotsUtilises = lots.reduce(
    (total, lot) => total + Number(lot.quantiteUtilisee || 0),
    0,
  );

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
                          if (Number(raw) < 0) return 0;

                          handleChange(field.name, parsed);
                        }}
                        className={inputClass}
                      />
                    )}
                  </div>
                );
              })}

            {/* ================================================
                LOTS UTILISES
            ================================================ */}

            {getLots && selectedArticle && lots.length > 0 && (
              <div className="col-span-12">
                <div
                  className="
                      rounded-lg
                      border border-gray-200
                      bg-gray-50
                      p-3
                      dark:border-gray-700
                      dark:bg-gray-900/50
                    "
                >
                  {/* ================================
                        HEADER LOTS
                    ================================= */}

                  <div
                    className="
                        mb-3
                        flex
                        items-center
                        justify-between
                        gap-3
                      "
                  >
                    <div>
                      <label
                        className="
                            block
                            text-sm
                            font-semibold
                            text-gray-800
                            dark:text-gray-200
                          "
                      >
                        Lots utilisés
                      </label>

                      <p
                        className="
                            mt-0.5
                            text-xs
                            text-gray-500
                            dark:text-gray-400
                          "
                      >
                        La quantité est automatiquement répartie selon les lots
                        disponibles.
                      </p>
                    </div>

                    <div
                      className="
                          shrink-0
                          rounded-full
                          bg-brand-300
                          px-3 py-1
                          text-xs
                          font-semibold
                          text-white
                        "
                    >
                      {totalLotsUtilises} unité
                      {totalLotsUtilises > 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* ================================
                        LISTE DES LOTS
                    ================================= */}

                  <div
                    className="
                        overflow-hidden
                        rounded-md
                        border
                        border-gray-200
                        dark:border-gray-700
                      "
                  >
                    <div
                      className="
                          grid
                          grid-cols-12
                          gap-2
                          border-b
                          border-gray-200
                          bg-gray-100
                          px-3 py-2
                          text-xs
                          font-semibold
                          text-gray-600
                          dark:border-gray-700
                          dark:bg-gray-800
                          dark:text-gray-300
                        "
                    >
                      <div className="col-span-4">Lot</div>

                      <div className="col-span-4">Date péremption</div>

                      <div className="col-span-2 text-center">Stock</div>

                      <div className="col-span-2 text-center">Utilisé</div>
                    </div>

                    {lots.map((lot, index) => (
                      <div
                        key={`${lot.lot_id}-${index}`}
                        className="
                              grid
                              grid-cols-12
                              gap-2
                              items-center
                              border-b
                              border-gray-200
                              px-3 py-2
                              last:border-b-0
                              dark:border-gray-700
                            "
                      >
                        {/* Lot */}

                        <div
                          className="
                                col-span-4
                                truncate
                                text-sm
                                font-medium
                                text-gray-800
                                dark:text-gray-200
                              "
                          title={lot.lot_code}
                        >
                          {lot.lot_code || `Lot #${lot.lot_id}`}
                        </div>

                        {/* Date */}

                        <div
                          className="
                                col-span-4
                                text-sm
                                text-gray-600
                                dark:text-gray-400
                              "
                        >
                          {lot.lot_datePeremption || "—"}
                        </div>

                        {/* Stock */}

                        <div
                          className="
                                col-span-2
                                text-center
                                text-sm
                                text-gray-600
                                dark:text-gray-400
                              "
                        >
                          {Number(lot.lot_quantite || 0)}
                        </div>

                        {/* Quantité utilisée */}

                        <div
                          className="
                                col-span-2
                                text-center
                              "
                        >
                          <span
                            className="
                                  inline-flex
                                  min-w-8
                                  items-center
                                  justify-center
                                  rounded-full
                                  bg-brand-300
                                  px-2
                                  py-1
                                  text-xs
                                  font-bold
                                  text-white
                                "
                          >
                            {lot.quantiteUtilisee}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================================================
                AUCUN LOT
            ================================================ */}

            {getLots && selectedArticle && lots.length === 0 && (
              <div className="col-span-12">
                <div
                  className="
                      rounded-md
                      border
                      border-gray-200
                      bg-gray-50
                      px-3 py-2
                      text-sm
                      text-gray-500
                      dark:border-gray-700
                      dark:bg-gray-900/50
                      dark:text-gray-400
                    "
                >
                  Aucun lot disponible pour la quantité demandée.
                </div>
              </div>
            )}
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
          {/* ================================================
              STOCK + FOOTER PERSONNALISE
          ================================================ */}

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

          {/* ================================================
              BOUTONS
          ================================================ */}

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

      {/* ====================================================
          ALERT
      ==================================================== */}

      <Alert
        open={alert.open}
        variant={alert.variant}
        title={alert.title}
        message={alert.message}
        showLink={false}
        onClose={() =>
          setAlert({
            open: false,
            variant: alert.variant,
            message: alert.message,
            title: alert.title,
          })
        }
      />
    </Modal>
  );
}
