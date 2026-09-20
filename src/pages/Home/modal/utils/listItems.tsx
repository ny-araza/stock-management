import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faPen,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../../../components/ui/button/Button";

// ============================================================
// TYPES
// ============================================================

export interface ListColumn<T> {
  /**
   * Nom affiché dans le tableau
   */
  label: string;

  /**
   * Permet de récupérer la valeur à afficher
   */
  render: (item: T, index: number) => React.ReactNode;

  /**
   * Classes Tailwind pour la colonne desktop
   */
  className?: string;

  /**
   * Permet d'afficher ou non cette colonne sur mobile
   */
  mobile?: boolean;

  /**
   * Permet de définir la colonne principale
   * affichée dans la ligne mobile.
   */
  mobilePrimary?: boolean;
}

export interface ListTotal<T> {
  /**
   * Nom affiché
   */
  label: string;

  /**
   * Calcule le total à partir de la liste
   */
  value: (items: T[]) => number;

  /**
   * Permet d'ajouter "Ar", "%", etc.
   */
  suffix?: string;
}

// ============================================================
// PROPS
// ============================================================

interface ListItemsProps<T> {
  /**
   * Liste des éléments
   */
  items: T[];

  /**
   * Colonnes du tableau
   */
  columns: ListColumn<T>[];

  /**
   * Totaux affichés en bas
   */
  totals?: ListTotal<T>[];

  /**
   * Identifiant unique d'un élément
   */
  getKey?: (item: T, index: number) => string | number;

  /**
   * Modification d'un élément
   */
  onEdit?: (item: T, index: number) => void;

  /**
   * Suppression d'un élément
   */
  onDelete?: (item: T, index: number) => void;

  /**
   * Callback lorsque la liste est modifiée
   */
  onItemsChange?: (items: T[]) => void;

  /**
   * Texte lorsqu'il n'y a aucun élément
   */
  emptyText?: string;

  /**
   * Afficher les boutons d'action
   */
  showActions?: boolean;

  /**
   * Texte du bouton modifier
   */
  editTitle?: string;

  /**
   * Texte du bouton supprimer
   */
  deleteTitle?: string;
}

// ============================================================
// COMPOSANT
// ============================================================

export default function ListItems<T>({
  items,
  columns,
  totals = [],

  getKey = (_, index) => index,

  onEdit,
  onDelete,
  onItemsChange,

  emptyText = "Aucun élément",
  showActions = true,

  editTitle = "Modifier",
  deleteTitle = "Supprimer",
}: ListItemsProps<T>) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // ----------------------------------------------------------
  // Toggle mobile
  // ----------------------------------------------------------

  const toggleRow = (index: number) => {
    setExpandedIndex((current) => (current === index ? null : index));
  };

  // ----------------------------------------------------------
  // Suppression
  // ----------------------------------------------------------

  const supprimerItem = (item: T, index: number) => {
    if (onDelete) {
      onDelete(item, index);
    }

    if (onItemsChange) {
      onItemsChange(items.filter((_, i) => i !== index));
    }

    setExpandedIndex(null);
  };

  // ----------------------------------------------------------
  // Colonnes principales mobile
  // ----------------------------------------------------------

  const mobilePrimaryColumns = useMemo(() => {
    const primary = columns.filter((column) => column.mobilePrimary);

    if (primary.length > 0) {
      return primary;
    }

    return columns.slice(0, 2);
  }, [columns]);

  // ----------------------------------------------------------
  // Format nombre
  // ----------------------------------------------------------

  const formatNumber = (value: number) => {
    return Number(value || 0).toLocaleString("fr-FR");
  };

  // ----------------------------------------------------------
  // Empty
  // ----------------------------------------------------------

  if (!items || items.length === 0) {
    return (
      <div className="mt-5 w-full py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        {emptyText}
      </div>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="mt-5 w-full overflow-hidden">
      {/* ======================================================
          DESKTOP
      ====================================================== */}

      <table className="hidden w-full border-b dark:text-white sm:table">
        <thead className="text-left">
          <tr className="border-b">
            {columns.map((column, index) => (
              <th key={index} className={`p-2 ${column.className ?? ""}`}>
                {column.label}
              </th>
            ))}

            {showActions && <th className="p-2 text-right">Actions</th>}
          </tr>
        </thead>

        <tbody>
          {items.map((item, index) => (
            <tr key={getKey(item, index)} className="border-b">
              {columns.map((column, columnIndex) => (
                <td
                  key={columnIndex}
                  className={`p-2 ${column.className ?? ""}`}
                >
                  {column.render(item, index)}
                </td>
              ))}

              {/* ACTIONS */}

              {showActions && (
                <td className="p-2">
                  <div className="flex justify-end gap-1">
                    {onEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(item, index)}
                        title={editTitle}
                      >
                        <FontAwesomeIcon icon={faPen} />
                      </Button>
                    )}

                    {onDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => supprimerItem(item, index)}
                        title={deleteTitle}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>

        {/* ====================================================
            TOTALS
        ==================================================== */}

        {totals.length > 0 && (
          <tfoot className="dark:text-white">
            {totals.map((total, index) => (
              <tr key={index}>
                <td colSpan={Math.max(columns.length - 1, 1)} className="p-2">
                  <span>{total.label}</span>
                </td>

                <td className="p-2 text-right">
                  <strong>
                    {formatNumber(total.value(items))}
                    {total.suffix ? ` ${total.suffix}` : ""}
                  </strong>
                </td>

                {showActions && <td />}
              </tr>
            ))}
          </tfoot>
        )}
      </table>

      {/* ======================================================
          MOBILE
      ====================================================== */}

      <div className="w-full sm:hidden">
        {items.map((item, index) => {
          const isOpen = expandedIndex === index;

          return (
            <div key={getKey(item, index)} className="border-b">
              {/* ==============================================
                  LIGNE PRINCIPALE
              ============================================== */}

              <button
                type="button"
                onClick={() => toggleRow(index)}
                className="
                  flex
                  w-full
                  items-center
                  justify-between
                  gap-3
                  px-2
                  py-3
                  text-left
                  active:bg-gray-50
                  dark:text-white
                "
              >
                <div className="min-w-0 flex-1">
                  {mobilePrimaryColumns.map((column, columnIndex) => (
                    <div
                      key={columnIndex}
                      className={
                        columnIndex === 0
                          ? "truncate font-semibold"
                          : "truncate text-sm text-gray-500"
                      }
                    >
                      {column.render(item, index)}
                    </div>
                  ))}
                </div>

                {/* Chevron */}

                <div className="flex shrink-0 items-center gap-2">
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`
                      text-xs
                      transition-transform
                      duration-300
                      ${isOpen ? "rotate-180" : "rotate-0"}
                    `}
                  />
                </div>
              </button>

              {/* ==============================================
                  DROPDOWN
              ============================================== */}

              <div
                className={`
                  grid
                  transition-all
                  duration-300
                  ease-in-out
                  ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }
                `}
              >
                <div className="overflow-hidden">
                  <div
                    className="
                      mx-2
                      mb-3
                      rounded-lg
                      bg-gray-50
                      px-3
                      py-3
                      text-sm
                      dark:bg-gray-800
                    "
                  >
                    {/* ========================================
                        COLONNES
                    ======================================== */}

                    {columns.map((column, columnIndex) => (
                      <div
                        key={columnIndex}
                        className="
                          flex
                          justify-between
                          gap-4
                          border-b
                          border-gray-200
                          py-1.5
                          last:border-0
                          dark:border-gray-700
                        "
                      >
                        <span className="text-gray-500">{column.label}</span>

                        <strong className="text-right">
                          {column.render(item, index)}
                        </strong>
                      </div>
                    ))}

                    {/* ========================================
                        ACTIONS
                    ======================================== */}

                    {showActions && (onEdit || onDelete) && (
                      <div className="mt-3 flex justify-end gap-2">
                        {onEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(item, index);
                            }}
                            title={editTitle}
                          >
                            <FontAwesomeIcon icon={faPen} />
                          </Button>
                        )}

                        {onDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              supprimerItem(item, index);
                            }}
                            title={deleteTitle}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* ====================================================
            MOBILE TOTALS
        ==================================================== */}

        {totals.length > 0 && (
          <div className="dark:text-white">
            {totals.map((total, index) => (
              <div key={index} className="flex justify-between py-1">
                <span>{total.label}</span>

                <strong>
                  {formatNumber(total.value(items))}
                  {total.suffix ? ` ${total.suffix}` : ""}
                </strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
