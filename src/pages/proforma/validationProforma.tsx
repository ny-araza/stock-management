import React from "react";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import ProformaPrint from "../Home/modal/utils/printFacture";
import { Proforma, Client, ProLigneArticle } from "../../interfaces/interfaces";
import ProformaPdfButton from "./buttonGenerateProforma";

interface ValidationProformaModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: Proforma;
  client: Client;
  ligneArticle: ProLigneArticle[];
  onValidate: () => void;
}

const ValidationProformaModal: React.FC<ValidationProformaModalProps> = ({
  isOpen,
  onClose,
  form,
  client,
  ligneArticle,
  onValidate,
}) => {
  /**
   * Impression directe de la page
   */
  const handlePrint = () => {
    window.print();
  };


  
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[1200px] m-4">
      <div className="relative flex max-h-[95vh] w-full flex-col overflow-hidden rounded-3xl bg-white dark:bg-gray-900">
        {/* ========================================================= */}
        {/* EN-TÊTE DU MODAL */}
        {/* ========================================================= */}

        <div className="shrink-0 border-b border-gray-200 px-6 py-4 dark:border-gray-800 print:hidden">
          <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Aperçu du proforma
          </h4>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Vérifiez le document avant de l'imprimer ou de l'enregistrer.
          </p>
        </div>

        {/* ========================================================= */}
        {/* PAGE PRINT */}
        {/* ========================================================= */}

        <div className="flex-1 overflow-y-auto bg-gray-100 p-4 dark:bg-gray-950 print:overflow-visible print:bg-white print:p-0">
          <ProformaPrint
            form={form}
            client={client}
            ligneArticle={ligneArticle}
          />
        </div>

        {/* ========================================================= */}
        {/* ACTIONS */}
        {/* ========================================================= */}

        <div className="shrink-0 border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 print:hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {/* Imprimer */}
            <Button size="sm" type="button" onClick={handlePrint}>
              Imprimer
            </Button>

            {/* Générer PDF */}
            <ProformaPdfButton
              form={form}
              client={client}
              ligneArticle={ligneArticle}
              company={{
                nom: "AUTRE SOCIÉTÉ",
                adresse: "Toamasina, Madagascar",
                tel: "+261 34 00 000 00",
                email: "info@autre.mg",
              }}
              fileName={`Proforma_${form.pro_code}`}
              label="Exporter en PDF"
            />

            {/* Enregistrer */}
            <Button size="sm" type="button" onClick={onValidate}>
              💾 Enregistrer le proforma
            </Button>

            {/* Annuler */}
            <Button size="sm" variant="outline" type="button" onClick={onClose}>
              Annuler
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ValidationProformaModal;
