import { useEffect, useState } from "react";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";

export interface ArticleVente {
  pri_id: string;
  pri_article: string;
  pri_designation: string;
  pri_quantite: number;
  pri_pua: string;
  pri_tva: number;
  pri_totalht: number;
  remise: number;
  datePeremption: string;
  lot_code: string;
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
  pri_totalht: 0,
  remise: 0,
  datePeremption: "",
  lot_code: "",
};

export default function ArticleModal({
  open,
  article,
  onClose,
  onSave,
  className,
}: ArticleModalProps) {
  const [form, setForm] = useState<ArticleVente>(emptyArticle);

  /*
   * Initialiser le formulaire
   * lorsqu'on ouvre le modal
   */
  useEffect(() => {
    if (open) {
      setForm(article ? { ...article } : { ...emptyArticle });
    }
  }, [open, article]);

  /*
   * Modifier un champ
   */
  const handleChange = (field: keyof ArticleVente, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /*
   * Calcul du total HT
   *
   * Total brut = quantité × PUA
   * Remise = Total brut × remise / 100
   * Total HT = Total brut - remise
   */
  useEffect(() => {
    const quantite = Number(form.pri_quantite) || 0;
    const pua = Number(form.pri_pua) || 0;
    const remise = Number(form.remise) || 0;

    const totalBrut = quantite * pua;

    const montantRemise = totalBrut * (remise / 100);

    const totalHT = totalBrut - montantRemise;

    setForm((prev) => {
      if (prev.pri_totalht === totalHT) {
        return prev;
      }

      return {
        ...prev,
        pri_totalht: totalHT,
      };
    });
  }, [form.pri_quantite, form.pri_pua, form.remise]);

  /*
   * Enregistrer
   */
  const handleSubmit = () => {
    if (!form.pri_article) {
      alert("Veuillez sélectionner un article.");
      return;
    }

    if (form.pri_quantite <= 0) {
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

  /*
   * Ne rien afficher si fermé
   */
  if (!open) {
    return null;
  }

  return (
    <Modal isOpen={open} onClose={onClose} className={className}>
      {/* =========================
            HEADER
        ========================== */}
      <div className="max-h-[700px] overflow-auto">
        <div
          className="
            flex h-14
            items-center justify-center
            border-b
            border-gray-200
            px-5
            dark:border-gray-700
          "
        >
          <div>
            <h2
              className="
                text-lg
                font-semibold
                text-gray-900
                dark:text-white
              "
            >
              {article ? "Modifier l'article" : "Ajouter un article"}
            </h2>
          </div>
        </div>

        {/* =========================
            BODY
        ========================== */}

        <div className="p-5">
          <div
            className="
              grid
              grid-cols-12
              gap-x-4
              gap-y-4
            "
          >
            {/* ARTICLE */}

            <div className="col-span-12 md:col-span-5">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Article
              </label>

              <select
                value={form.pri_article}
                onChange={(e) => handleChange("pri_article", e.target.value)}
                className="
                  h-10 w-full
                  rounded-md
                  border border-gray-300
                  bg-white
                  px-3
                  text-sm
                  outline-none
                  focus:border-blue-500
                  dark:border-gray-600
                  dark:bg-gray-800
                  dark:text-white
                "
              >
                <option value="">Sélectionner un article</option>

                <option value="ART001">ART001 - Eau minérale 1.5L</option>

                <option value="ART002">ART002 - Eau minérale 1L</option>

                <option value="ART003">ART003 - Ice Tea Citron</option>

                <option value="ART004">ART004 - Ice Tea Pêche</option>
              </select>
            </div>

            {/* DESIGNATION */}

            <div className="col-span-12 md:col-span-7">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Désignation
              </label>

              <input
                type="text"
                value={form.pri_designation}
                onChange={(e) =>
                  handleChange("pri_designation", e.target.value)
                }
                placeholder="Désignation de l'article"
                className="
                  h-10 w-full
                  rounded-md
                  border border-gray-300
                  px-3
                  text-sm
                  outline-none
                  focus:border-blue-500
                  dark:border-gray-600
                  dark:bg-gray-800
                  dark:text-white
                "
              />
            </div>

            {/* QUANTITE */}

            <div className="col-span-12 md:col-span-3">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Quantité
              </label>

              <input
                type="number"
                min="0"
                value={form.pri_quantite}
                onChange={(e) =>
                  handleChange("pri_quantite", Number(e.target.value))
                }
                className="
                  h-10 w-full
                  rounded-md
                  border border-gray-300
                  px-3
                  text-sm
                  outline-none
                  focus:border-blue-500
                  dark:border-gray-600
                  dark:bg-gray-800
                  dark:text-white
                "
              />
            </div>

            {/* PUA */}

            <div className="col-span-12 md:col-span-3">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Prix unitaire
              </label>

              <input
                type="number"
                min="0"
                value={form.pri_pua}
                onChange={(e) => handleChange("pri_pua", e.target.value)}
                placeholder="0"
                className="
                  h-10 w-full
                  rounded-md
                  border border-gray-300
                  px-3
                  text-sm
                  outline-none
                  focus:border-blue-500
                  dark:border-gray-600
                  dark:bg-gray-800
                  dark:text-white
                "
              />
            </div>

            {/* TVA */}

            <div className="col-span-12 md:col-span-3">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                TVA (%)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={form.pri_tva}
                onChange={(e) =>
                  handleChange("pri_tva", Number(e.target.value))
                }
                className="
                  h-10 w-full
                  rounded-md
                  border border-gray-300
                  px-3
                  text-sm
                  outline-none
                  focus:border-blue-500
                  dark:border-gray-600
                  dark:bg-gray-800
                  dark:text-white
                "
              />
            </div>

            {/* REMISE */}

            <div className="col-span-12 md:col-span-3">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Remise (%)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={form.remise}
                onChange={(e) => handleChange("remise", Number(e.target.value))}
                className="
                  h-10 w-full
                  rounded-md
                  border border-gray-300
                  px-3
                  text-sm
                  outline-none
                  focus:border-blue-500
                  dark:border-gray-600
                  dark:bg-gray-800
                  dark:text-white
                "
              />
            </div>

            {/* TOTAL HT */}

            <div className="col-span-12 md:col-span-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Total HT
              </label>

              <input
                type="text"
                value={`${form.pri_totalht.toLocaleString("fr-FR")} Ar`}
                readOnly
                className="
                  h-10 w-full
                  rounded-md
                  border border-gray-300
                  bg-gray-50
                  px-3
                  text-sm
                  font-semibold
                  text-green-600
                  outline-none
                  dark:border-gray-600
                  dark:bg-gray-800
                "
              />
            </div>

            {/* LOT */}

            <div className="col-span-12 md:col-span-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Code lot
              </label>

              <input
                type="text"
                value={form.lot_code}
                onChange={(e) => handleChange("lot_code", e.target.value)}
                placeholder="Ex : LOT-2026-001"
                className="
                  h-10 w-full
                  rounded-md
                  border border-gray-300
                  px-3
                  text-sm
                  outline-none
                  focus:border-blue-500
                  dark:border-gray-600
                  dark:bg-gray-800
                  dark:text-white
                "
              />
            </div>

            {/* PEREMPTION */}

            <div className="col-span-12 md:col-span-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date de péremption
              </label>

              <input
                type="date"
                value={form.datePeremption}
                onChange={(e) => handleChange("datePeremption", e.target.value)}
                className="
                  h-10 w-full
                  rounded-md
                  border border-gray-300
                  px-3
                  text-sm
                  outline-none
                  focus:border-blue-500
                  dark:border-gray-600
                  dark:bg-gray-800
                  dark:text-white
                "
              />
            </div>
          </div>
        </div>

        {/* =========================
            FOOTER
        ========================== */}

        <div
          className="
            flex
            justify-end
            gap-2
            border-t
            border-gray-200
            px-5
            py-3
            dark:border-gray-700
          "
        >
          <button
            type="button"
            onClick={onClose}
            className="
              rounded-md
              bg-gray-100
              px-5
              py-2
              text-sm
              font-medium
              text-gray-700
              hover:bg-gray-200
              dark:bg-gray-800
              dark:text-gray-300
            "
          >
            Annuler
          </button>

          <Button
            type="button"
            onClick={handleSubmit}
            className="
              rounded-md
              px-5
              py-2
              text-sm
              font-medium
              text-white
            "
          >
            {article ? "Modifier" : "Ajouter"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
