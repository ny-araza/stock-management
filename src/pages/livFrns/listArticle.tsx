import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faPen,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/ui/button/Button";
import { ArticleVente } from "./ArticleModal";

type Props = {
  articles: ArticleVente[];
  onEditArticle: (article: ArticleVente) => void;
  onArticlesChange: (articles: ArticleVente[]) => void;
};

interface Total {
  totalTtc: number;
  totalTva: number;
  totalHt: number;
}

export default function ListArticles({
  articles,
  onEditArticle,
  onArticlesChange,
}: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const toggleRow = (index: number) => {
    setExpandedIndex((current) => (current === index ? null : index));
  };

  const supprimerArticle = (index: number) => {
    onArticlesChange(articles.filter((_, i) => i !== index));
    setExpandedIndex(null);
  };

  function total(): Total {
    if (!articles)
      return {
        totalHt: 0,
        totalTtc: 0,
        totalTva: 0,
      };
    let totalht = 0;
    let totaltva = 0;
    articles.map((article: ArticleVente) => {
      totalht += article.pri_totalht;
      totaltva += article.pri_tva;
    });
    const res: Total = {
      totalHt: totalht,
      totalTva: totaltva,
      totalTtc: totalht + totaltva,
    };
    return res;
  }

  return (
    <div className="mt-5 w-full overflow-hidden">
      {/* ================= DESKTOP ================= */}
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
          {articles.map((article, index) => (
            <tr key={article.pri_id || index} className="border-b">
              <td className="p-2">
                <strong>{article.pri_article}</strong>

                <div className="text-sm text-gray-500">
                  {article.pri_designation}
                </div>
              </td>

              <td className="p-2">{article.pri_quantite}</td>

              <td className="p-2">
                {Number(article.pri_pua).toLocaleString("fr-FR")} Ar
              </td>
              <td className="p-2">{article.datePeremption}</td>
              <td className="p-2">
                <strong>
                  {Number(article.pri_totalht).toLocaleString("fr-FR")} Ar
                </strong>
              </td>

              <td className="p-2">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditArticle(article)}
                    title="Modifier"
                  >
                    <FontAwesomeIcon icon={faPen} />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => supprimerArticle(index)}
                    title="Supprimer"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>
              <span>TOTAL HT</span>
            </td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td className="text-right pr-1.5">
              <strong>
                {total().totalHt != 0
                  ? total().totalHt.toLocaleString("fr-FR")
                  : "0"}{" "}
                Ar
              </strong>
            </td>
          </tr>
          <tr>
            <td>
              <span>TOTAL TVA</span>
            </td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td className="text-right pr-1.5">
              <strong>
                {total().totalTva != 0
                  ? total().totalTva.toLocaleString("fr-FR")
                  : "0"}{" "}
                Ar
              </strong>
            </td>
          </tr>
          <tr>
            <td>
              <span>TOTAL TTC</span>
            </td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td className="text-right pr-1.5">
              <strong>
                {total().totalTtc != 0
                  ? total().totalTtc.toLocaleString("fr-FR")
                  : "0"}{" "}
                Ar
              </strong>
            </td>
          </tr>
        </tfoot>
      </table>

      {/* ================= MOBILE ================= */}
      <div className="sm:hidden w-full">
        {articles.map((article, index) => {
          const isOpen = expandedIndex === index;

          return (
            <div key={article.pri_id || index} className="border-b">
              {/* Ligne principale */}
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
                "
              >
                {/* Article */}
                <div className="min-w-0 flex-1">
                  <strong className="block truncate">
                    {article.pri_article}
                  </strong>

                  <div className="text-sm text-gray-500 truncate">
                    {article.pri_designation}
                  </div>
                </div>

                {/* Total HT + chevron */}
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

              {/* Contenu dropdown */}
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
                    "
                  >
                    {/* Code article */}
                    <div className="flex justify-between py-1.5">
                      <span className="text-gray-500">Code article</span>

                      <strong>{article.pri_article}</strong>
                    </div>

                    {/* Quantité */}
                    <div className="flex justify-between py-1.5">
                      <span className="text-gray-500">Quantité</span>

                      <strong>{article.pri_quantite}</strong>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-gray-500">Date Per</span>

                      <strong>{article.datePeremption}</strong>
                    </div>
                    {/* Prix unitaire */}
                    <div className="flex justify-between py-1.5">
                      <span className="text-gray-500">P.U</span>

                      <strong>
                        {Number(article.pri_pua).toLocaleString("fr-FR")} Ar
                      </strong>
                    </div>

                    {/* Total HT */}
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
                        {Number(article.pri_totalht).toLocaleString("fr-FR")} Ar
                      </strong>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditArticle(article);
                        }}
                      >
                        <FontAwesomeIcon icon={faPen} />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          supprimerArticle(index);
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div>
          <div className="flex justify-between">
            <div>
              <span>TOTAL HT</span>
            </div>

            <div className="text-right pr-1.5">
              <strong>
                {total().totalHt != 0
                  ? total().totalHt.toLocaleString("fr-FR")
                  : "0"}{" "}
                Ar
              </strong>
            </div>
          </div>
          <div className="flex justify-between">
            <div>
              <span>TOTAL TVA</span>
            </div>

            <div className="text-right pr-1.5">
              <strong>
                {total().totalTva != 0
                  ? total().totalTva.toLocaleString("fr-FR")
                  : "0"}{" "}
                Ar
              </strong>
            </div>
          </div>
          <div className="flex justify-between">
            <div>
              <span>TOTAL TTC</span>
            </div>

            <div className="text-right pr-1.5">
              <strong>
                {total().totalTtc != 0
                  ? total().totalTtc.toLocaleString("fr-FR")
                  : "0"}{" "}
                Ar
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
