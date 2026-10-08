import React from "react";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";

export interface ProLigneArticle {
  prol_id?: number;
  prol_pro_code: string;
  prol_Quantite: number;
  prol_prixunit: number;
  prol_Tva: number;
  prol_TotalHT: number;
  prol_Art_Code: string;
  prol_cli_Code: string;
  prol_TotalTTC: number;
  prol_pri_id: number;
  art_nom: string;
  prol_uid?: string;
  prol_remise?: number;
  prol_montant_remise?: number;
  prol_montant_tva?: number;
  prol_lot: "";
  prol_lot_id?: number;
  prol_datePer?: "";
  prol_quantite_stock?: number;
}

export interface Proforma {
  pro_id: number;
  pro_code: string;
  pro_datecre: string;
  pro_datemdf: string;
  pro_usercre: string;
  pro_usermdf: string;
  pro_date: string;
  pro_modecmd: string;
  pro_dateliv: string;
  pro_islivre: boolean;
  pro_montant_ht: number;
  pro_montant_ttc: number;
  pro_cli_code: string;
  pro_enabled: boolean;
  pro_lettre: string;
  pro_tva: number;
  pro_remise: number;
}

interface ValidationProformaModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: Proforma;
  ligneArticle: ProLigneArticle[];
  onValidate: () => void;
  onGeneratePdf: () => void;
}

const ValidationProformaModal: React.FC<ValidationProformaModalProps> = ({
  isOpen,
  onClose,
  form,
  ligneArticle,
  onValidate,
  onGeneratePdf,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] m-4">
      <div className="relative w-full rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
        {/* Titre */}
        <div className="mb-6">
          <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Valider le proforma
          </h4>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Que souhaitez-vous faire avec ce proforma ?
          </p>
        </div>

        {/* Informations */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Proforma</span>

              <p className="font-medium text-gray-800 dark:text-white">
                {form.pro_code}
              </p>
            </div>

            <div>
              <span className="text-gray-500 dark:text-gray-400">Articles</span>

              <p className="font-medium text-gray-800 dark:text-white">
                {ligneArticle.length}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            size="sm"
            type="button"
            onClick={onGeneratePdf}
            className="w-full"
          >
            Générer le PDF
          </Button>

          <Button
            size="sm"
            type="button"
            onClick={onValidate}
            className="w-full"
          >
            Enregistrer le proforma
          </Button>

          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={onClose}
            className="w-full"
          >
            Annuler
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ValidationProformaModal;
