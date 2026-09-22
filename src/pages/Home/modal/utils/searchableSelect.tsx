import React, {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type KeyboardEvent,
} from "react";

interface SearchableSelectProps<T> {
  value: string;
  onChange: (value: string) => void;

  suggestions: T[];
  onSelect: (item: T) => void;

  loading?: boolean;
  required?: boolean
  placeholder?: string;
  noResultsText?: string;

  /**
   * Permet de générer une clé unique pour chaque élément.
   */
  getKey: (item: T) => string | number;

  /**
   * Permet de personnaliser complètement l'affichage
   * d'un élément dans la liste.
   */
  renderItem: (item: T, index: number, highlighted: boolean) => ReactNode;

  /**
   * Classes CSS personnalisables.
   */
  inputClassName?: string;
  dropdownClassName?: string;
  itemClassName?: string;

  /**
   * Permet de contrôler l'ouverture du dropdown.
   */
  openOnFocus?: boolean;

  /**
   * Permet de masquer le message "Aucun résultat".
   */
  showNoResults?: boolean;

  disabled?: boolean;
}

export default function SearchableSelect<T>({
  value,
  onChange,
  suggestions,
  onSelect,
  loading = false,
  required,
  placeholder = "Rechercher...",
  noResultsText = "Aucun résultat trouvé",

  getKey,
  renderItem,

  inputClassName = "",
  dropdownClassName = "",
  itemClassName = "",

  openOnFocus = true,
  showNoResults = true,

  disabled = false,
}: SearchableSelectProps<T>) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  /**
   * Fermer le dropdown lorsqu'on clique à l'extérieur.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setHighlight(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /**
   * Ouvrir automatiquement lorsqu'il y a des résultats.
   */
  useEffect(() => {
    if (suggestions.length > 0 && value.trim() !== "") {
      setShowSuggestions(true);
    }
  }, [suggestions, value]);

  /**
   * Gestion du clavier.
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    // Flèche bas
    if (e.key === "ArrowDown") {
      e.preventDefault();

      if (!suggestions.length) return;

      setShowSuggestions(true);

      setHighlight((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));

      return;
    }

    // Flèche haut
    if (e.key === "ArrowUp") {
      e.preventDefault();

      if (!suggestions.length) return;

      setShowSuggestions(true);

      setHighlight((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));

      return;
    }

    // Entrée
    if (e.key === "Enter") {
      e.preventDefault();

      if (showSuggestions && highlight >= 0 && highlight < suggestions.length) {
        const selectedItem = suggestions[highlight];

        onSelect(selectedItem);

        setShowSuggestions(false);
        setHighlight(-1);
      }

      return;
    }

    // Escape
    if (e.key === "Escape") {
      e.preventDefault();

      setShowSuggestions(false);
      setHighlight(-1);

      return;
    }
  };

  const handleChange = (value: string) => {
    onChange(value);
    setHighlight(-1);

    if (value.trim() === "") {
      setShowSuggestions(false);
    } else {
      setShowSuggestions(true);
    }
  };

  const handleFocus = () => {
    if (!openOnFocus) return;

    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleSelect = (item: T) => {
    onSelect(item);
    setShowSuggestions(false);
    setHighlight(-1);

    // Garder le focus sur l'input après sélection.
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const shouldShowNoResults =
    showSuggestions &&
    !loading &&
    value.trim() !== "" &&
    suggestions.length === 0 &&
    showNoResults;

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        autoComplete="off"
        disabled={disabled}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={inputClassName}
        required={required}
      />

      {/* Loading */}
      {loading && (
        <span className="absolute right-3 top-2.5 text-xs text-gray-400">
          ...
        </span>
      )}

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          className={`
            absolute z-[100] mt-1 max-h-60 w-full overflow-y-auto
            rounded-md border border-gray-200 bg-white shadow-lg
            dark:border-gray-700 dark:bg-gray-800
            ${dropdownClassName}
          `}
        >
          {suggestions.map((item, index) => {
            const isHighlighted = highlight === index;

            return (
              <div
                key={getKey(item)}
                role="option"
                aria-selected={isHighlighted}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlight(index)}
                onClick={() => handleSelect(item)}
                className={`
                  cursor-pointer
                  ${isHighlighted ? "bg-blue-50 dark:bg-gray-700" : ""}
                  ${itemClassName}
                `}
              >
                {renderItem(item, index, isHighlighted)}
              </div>
            );
          })}
        </div>
      )}

      {/* Aucun résultat */}
      {shouldShowNoResults && (
        <div
          className={`
            absolute z-[100] mt-1 w-full rounded-md border
            border-gray-200 bg-white px-3 py-2 text-sm text-gray-500
            shadow-lg
            dark:border-gray-700 dark:bg-gray-800
          `}
        >
          {noResultsText}
        </div>
      )}
    </div>
  );
}
