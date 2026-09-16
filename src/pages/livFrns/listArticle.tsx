import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faPen,
  faTrash,
  faCheck,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/ui/button/Button";
import { ArticleVente } from "./ArticleModal";

type Props = {
  articles: ArticleVente[];

  /**
   * Permet au composant parent de récupérer
   * la nouvelle liste après modification/suppression.
   */
  onArticlesChange?: (articles: ArticleVente[]) => void;
};

interface Total {
  totalTtc: number;
  totalTva: number;
  totalHt: number;
}

export default function ListArticles({ articles, onArticlesChange }: Props) {
  // --------------------------------------------------
  // Liste locale
  // --------------------------------------------------

  const [articleList, setArticleList] = useState<ArticleVente[]>(articles);

  // Synchronise la liste locale lorsque le parent
  // envoie une nouvelle liste
  useEffect(() => {
    setArticleList(articles);
  }, [articles]);

  // --------------------------------------------------
  // Dropdown mobile
  // --------------------------------------------------

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleRow = (index: number) => {
    setExpandedIndex((current) => (current === index ? null : index));
  };

  // --------------------------------------------------
  // Modification
  // --------------------------------------------------

  const [editingId, setEditingId] = useState<string | null>(null);

  const [editArticle, setEditArticle] = useState<ArticleVente | null>(null);

  /**
   * Commencer la modification
   */
  const startEdit = (article: ArticleVente) => {
    setEditingId(article.pri_id);
    setEditArticle({ ...article });
  };

  /**
   * Annuler la modification
   */
  const cancelEdit = () => {
    setEditingId(null);
    setEditArticle(null);
  };

  /**
   * Modifier un champ
   */
  const updateEditField = <K extends keyof ArticleVente>(
    field: K,
    value: ArticleVente[K],
  ) => {
    if (!editArticle) return;

    setEditArticle({
      ...editArticle,
      [field]: value,
    });
  };

  /**
   * Enregistrer la modification
   */
  const saveEdit = () => {
    if (!editArticle) return;

    const newArticles = articleList.map((article) =>
      article.pri_id === editArticle.pri_id ? editArticle : article,
    );

    setArticleList(newArticles);

    // Informe le composant parent
    onArticlesChange?.(newArticles);

    setEditingId(null);
    setEditArticle(null);
  };

  // --------------------------------------------------
  // Suppression
  // --------------------------------------------------

  const deleteLigne = (id: string) => {
    const articleToDelete = articleList.find(
      (article) => article.pri_id === id,
    );

    if (!articleToDelete) return;

    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer l'article "${articleToDelete.pri_article}" ?`,
    );

    if (!confirmation) return;

    const newArticles = articleList.filter((article) => article.pri_id !== id);

    setArticleList(newArticles);

    // Informe le parent
    onArticlesChange?.(newArticles);

    // Si l'article supprimé était ouvert
    setExpandedIndex(null);

    // Si l'article était en modification
    if (editingId === id) {
      setEditingId(null);
      setEditArticle(null);
    }
  };

  // --------------------------------------------------
  // Totaux
  // --------------------------------------------------

  function total(): Total {
    if (!articleList) {
      return {
        totalHt: 0,
        totalTtc: 0,
        totalTva: 0,
      };
    }

    let totalht = 0;
    let totaltva = 0;

    articleList.forEach((article) => {
      totalht += Number(article.pri_totalht) || 0;
      totaltva += Number(article.pri_tva) || 0;
    });

    return {
      totalHt: totalht,
      totalTva: totaltva,
      totalTtc: totalht + totaltva,
    };
  }

  // --------------------------------------------------
  // Recalcul HT
  // --------------------------------------------------

  const updateQuantity = (value: string) => {
    if (!editArticle) return;

    const quantity = Number(value) || 0;
    const pua = Number(editArticle.pri_pua) || 0;

    setEditArticle({
      ...editArticle,
      pri_quantite: quantity,
      pri_totalht: quantity * pua,
    });
  };

  const updatePua = (value: string) => {
    if (!editArticle) return;

    const pua = Number(value) || 0;
    const quantity = Number(editArticle.pri_quantite) || 0;

    setEditArticle({
      ...editArticle,
      pri_pua: pua,
      pri_totalht: quantity * pua,
    });
  };

  // --------------------------------------------------
  // Rendu
  // --------------------------------------------------

  return (
    <div className="mt-5 w-full overflow-hidden">
      {/* ==================================================
          DESKTOP
      ================================================== */}

      <table className="hidden sm:table w-full border-b dark:text-white">
        <thead className="text-left">
          <tr className="border-b">
            <th className="p-2">Code Article</th>
            <th className="p-2">Quantité</th>
            <th className="p-2">P.U</th>
            <th className="p-2">Date Per</th>
            <th className="p-2">HT</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {articleList.map((article, index) => {
            const isEditing =
              editingId === article.pri_id && editArticle !== null;

            return (
              <tr key={article.pri_id || index} className="border-b">
                {/* ========================================
                    CODE + DESIGNATION
                ======================================== */}

                <td className="p-2">
                  {isEditing ? (
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={editArticle.pri_article}
                        onChange={(e) =>
                          updateEditField("pri_article", e.target.value)
                        }
                        className="w-full rounded border px-2 py-1 text-sm dark:bg-gray-800"
                      />

                      <input
                        type="text"
                        value={editArticle.pri_designation}
                        onChange={(e) =>
                          updateEditField("pri_designation", e.target.value)
                        }
                        className="w-full rounded border px-2 py-1 text-sm dark:bg-gray-800"
                      />
                    </div>
                  ) : (
                    <>
                      <strong>{article.pri_article}</strong>

                      <div className="text-sm text-gray-500">
                        {article.pri_designation}
                      </div>
                    </>
                  )}
                </td>

                {/* ========================================
                    QUANTITE
                ======================================== */}

                <td className="p-2">
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={editArticle.pri_quantite}
                      onChange={(e) => updateQuantity(e.target.value)}
                      className="w-24 rounded border px-2 py-1 dark:bg-gray-800"
                    />
                  ) : (
                    article.pri_quantite
                  )}
                </td>

                {/* ========================================
                    P.U
                ======================================== */}

                <td className="p-2">
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={editArticle.pri_pua}
                      onChange={(e) => updatePua(e.target.value)}
                      className="w-32 rounded border px-2 py-1 dark:bg-gray-800"
                    />
                  ) : (
                    <>{Number(article.pri_pua).toLocaleString("fr-FR")} Ar</>
                  )}
                </td>

                {/* ========================================
                    DATE PEREMPTION
                ======================================== */}

                <td className="p-2">
                  {isEditing ? (
                    <input
                      type="date"
                      value={editArticle.datePeremption || ""}
                      onChange={(e) =>
                        updateEditField("datePeremption", e.target.value)
                      }
                      className="rounded border px-2 py-1 dark:bg-gray-800"
                    />
                  ) : (
                    article.datePeremption
                  )}
                </td>

                {/* ========================================
                    TOTAL HT
                ======================================== */}

                <td className="p-2">
                  <strong>
                    {Number(
                      isEditing ? editArticle.pri_totalht : article.pri_totalht,
                    ).toLocaleString("fr-FR")}{" "}
                    Ar
                  </strong>
                </td>

                {/* ========================================
                    ACTIONS
                ======================================== */}

                <td className="p-2">
                  <div className="flex justify-end gap-1">
                    {isEditing ? (
                      <>
                        {/* ENREGISTRER */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={saveEdit}
                          title="Enregistrer"
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </Button>

                        {/* ANNULER */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEdit}
                          title="Annuler"
                        >
                          <FontAwesomeIcon icon={faXmark} />
                        </Button>
                      </>
                    ) : (
                      <>
                        {/* MODIFIER */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(article)}
                          title="Modifier"
                        >
                          <FontAwesomeIcon icon={faPen} />
                        </Button>

                        {/* SUPPRIMER */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteLigne(article.pri_id)}
                          title="Supprimer"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>

        {/* ==================================================
            TOTAUX DESKTOP
        ================================================== */}

        <tfoot>
          <tr>
            <td>
              <span>TOTAL HT</span>
            </td>

            <td colSpan={4}></td>

            <td className="text-right pr-1.5">
              <strong>{total().totalHt.toLocaleString("fr-FR")} Ar</strong>
            </td>
          </tr>

          <tr>
            <td>
              <span>TOTAL TVA</span>
            </td>

            <td colSpan={4}></td>

            <td className="text-right pr-1.5">
              <strong>{total().totalTva.toLocaleString("fr-FR")} Ar</strong>
            </td>
          </tr>

          <tr>
            <td>
              <span>TOTAL TTC</span>
            </td>

            <td colSpan={4}></td>

            <td className="text-right pr-1.5">
              <strong>{total().totalTtc.toLocaleString("fr-FR")} Ar</strong>
            </td>
          </tr>
        </tfoot>
      </table>

      {/* ==================================================
          MOBILE
      ================================================== */}

      <div className="sm:hidden w-full">
        {articleList.map((article, index) => {
          const isOpen = expandedIndex === index;

          const isEditing =
            editingId === article.pri_id && editArticle !== null;

          return (
            <div key={article.pri_id || index} className="border-b">
              {/* ==========================================
                  LIGNE PRINCIPALE
              ========================================== */}

              <button
                type="button"
                onClick={() => toggleRow(index)}
                className="
                  w-full
                  flex
                  items-center
                  justify-between
                  gap-3
                  px-2
                  py-3
                  text-left
                  active:bg-gray-50
                  dark:active:bg-gray-800
                "
              >
                <div className="min-w-0 flex-1">
                  <strong className="block truncate">
                    {article.pri_article}
                  </strong>

                  <div className="text-sm text-gray-500 truncate">
                    {article.pri_designation}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <strong className="whitespace-nowrap">
                    {Number(article.pri_totalht).toLocaleString("fr-FR")} Ar
                  </strong>

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

              {/* ==========================================
                  DROPDOWN
              ========================================== */}

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
                    {/* ====================================
                        CODE
                    ==================================== */}

                    <div className="flex justify-between gap-3 py-1.5">
                      <span className="text-gray-500">Code article</span>

                      {isEditing ? (
                        <input
                          type="text"
                          value={editArticle.pri_article}
                          onChange={(e) =>
                            updateEditField("pri_article", e.target.value)
                          }
                          className="w-40 rounded border px-2 py-1 text-right dark:bg-gray-700"
                        />
                      ) : (
                        <strong>{article.pri_article}</strong>
                      )}
                    </div>

                    {/* ====================================
                        DESIGNATION
                    ==================================== */}

                    {isEditing && (
                      <div className="flex justify-between gap-3 py-1.5">
                        <span className="text-gray-500">Désignation</span>

                        <input
                          type="text"
                          value={editArticle.pri_designation}
                          onChange={(e) =>
                            updateEditField("pri_designation", e.target.value)
                          }
                          className="w-40 rounded border px-2 py-1 text-right dark:bg-gray-700"
                        />
                      </div>
                    )}

                    {/* ====================================
                        QUANTITE
                    ==================================== */}

                    <div className="flex justify-between gap-3 py-1.5">
                      <span className="text-gray-500">Quantité</span>

                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editArticle.pri_quantite}
                          onChange={(e) => updateQuantity(e.target.value)}
                          className="w-28 rounded border px-2 py-1 text-right dark:bg-gray-700"
                        />
                      ) : (
                        <strong>{article.pri_quantite}</strong>
                      )}
                    </div>

                    {/* ====================================
                        DATE
                    ==================================== */}

                    <div className="flex justify-between gap-3 py-1.5">
                      <span className="text-gray-500">Date Per</span>

                      {isEditing ? (
                        <input
                          type="date"
                          value={editArticle.datePeremption || ""}
                          onChange={(e) =>
                            updateEditField("datePeremption", e.target.value)
                          }
                          className="w-40 rounded border px-2 py-1 dark:bg-gray-700"
                        />
                      ) : (
                        <strong>{article.datePeremption}</strong>
                      )}
                    </div>

                    {/* ====================================
                        P.U
                    ==================================== */}

                    <div className="flex justify-between gap-3 py-1.5">
                      <span className="text-gray-500">P.U</span>

                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editArticle.pri_pua}
                          onChange={(e) => updatePua(e.target.value)}
                          className="w-32 rounded border px-2 py-1 text-right dark:bg-gray-700"
                        />
                      ) : (
                        <strong>
                          {Number(article.pri_pua).toLocaleString("fr-FR")} Ar
                        </strong>
                      )}
                    </div>

                    {/* ====================================
                        TOTAL HT
                    ==================================== */}

                    <div
                      className="
                        flex
                        justify-between
                        border-t
                        mt-2
                        pt-2
                      "
                    >
                      <span className="text-gray-500">Total HT</span>

                      <strong>
                        {Number(
                          isEditing
                            ? editArticle.pri_totalht
                            : article.pri_totalht,
                        ).toLocaleString("fr-FR")}{" "}
                        Ar
                      </strong>
                    </div>

                    {/* ====================================
                        ACTIONS
                    ==================================== */}

                    <div className="flex justify-end gap-2 mt-3">
                      {isEditing ? (
                        <>
                          {/* ENREGISTRER */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              saveEdit();
                            }}
                            title="Enregistrer"
                          >
                            <FontAwesomeIcon icon={faCheck} />
                          </Button>

                          {/* ANNULER */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEdit();
                            }}
                            title="Annuler"
                          >
                            <FontAwesomeIcon icon={faXmark} />
                          </Button>
                        </>
                      ) : (
                        <>
                          {/* MODIFIER */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();

                              startEdit(article);
                            }}
                            title="Modifier"
                          >
                            <FontAwesomeIcon icon={faPen} />
                          </Button>

                          {/* SUPPRIMER */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();

                              deleteLigne(article.pri_id);
                            }}
                            title="Supprimer"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* ================================================
            TOTAUX MOBILE
        ================================================ */}

        <div className="mt-3 space-y-2">
          <div className="flex justify-between">
            <span>TOTAL HT</span>

            <strong>{total().totalHt.toLocaleString("fr-FR")} Ar</strong>
          </div>

          <div className="flex justify-between">
            <span>TOTAL TVA</span>

            <strong>{total().totalTva.toLocaleString("fr-FR")} Ar</strong>
          </div>

          <div className="flex justify-between">
            <span>TOTAL TTC</span>

            <strong>{total().totalTtc.toLocaleString("fr-FR")} Ar</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
