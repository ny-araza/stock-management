import React, { useRef } from "react";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import ProformaPrint from "../Home/modal/utils/printFacture";
import { Proforma, Client, ProLigneArticle } from "../../interfaces/interfaces";
import html2canvas from "html2canvas";
import { CompanyInfo, generateProformaPdf } from "./generatePdf";
import { useEntreprise } from "../../hooks/useEntreprise";

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
  const { entreprise, loading, error } = useEntreprise();

  const proformaRef = useRef<HTMLDivElement>(null);

  // Informations réelles de l'entreprise
  const company: CompanyInfo | null = entreprise
    ? {
        nom: entreprise.etp_nom || "",
        adresse: [
          entreprise.etp_adresse,
          entreprise.etp_quartier,
          entreprise.etp_ville,
        ]
          .filter(Boolean)
          .join(", "),
        tel: entreprise.etp_mobile || entreprise.etp_fixe || "",
        email: entreprise.etp_mail || "",
        nif: entreprise.etp_nif || "",
        stat: entreprise.etp_stat || "",
      }
    : null;

  // Export PNG
  const handleExportPng = async () => {
    if (!proformaRef.current || !company) return;

    try {
      const canvas = await html2canvas(proformaRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `Proforma_${form.pro_code}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      onValidate();
    } catch (error) {
      console.error("Erreur export PNG :", error);
    }
  };

  // Export PDF
  const generatePdf = () => {
    if (!company) return;

    try {
      const fileName = `Proforma_${form.pro_code}`;

      generateProformaPdf({
        form,
        client,
        ligneArticle,
        company,
        fileName,
      });

      onValidate();
    } catch (error) {
      console.error("Erreur génération PDF :", error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[1200px] m-4">
      <div className="relative flex max-h-[95vh] w-full flex-col overflow-hidden rounded-3xl bg-white dark:bg-gray-900">
        <div className="shrink-0 border-b border-gray-200 px-6 py-4 dark:border-gray-800 print:hidden">
          <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Aperçu du proforma
          </h4>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Vérifiez le document avant de l'imprimer ou de l'enregistrer.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-100 p-4 dark:bg-gray-950 print:overflow-visible print:bg-white print:p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Chargement des informations de l'entreprise...
            </div>
          ) : error || !company ? (
            <div className="p-8 text-center text-red-500">
              {error ||
                "Impossible de récupérer les informations de l'entreprise."}
            </div>
          ) : (
            <div ref={proformaRef} className="bg-white">
              <ProformaPrint
                form={form}
                company={company}
                client={client}
                ligneArticle={ligneArticle}
              />
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 print:hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              size="sm"
              type="button"
              variant="outline"
              disabled={loading || !company}
              onClick={handleExportPng}
            >
              Exporter PNG
            </Button>

            <Button
              size="sm"
              type="button"
              variant="outline"
              disabled={loading || !company}
              onClick={generatePdf}
            >
              Exporter PDF
            </Button>

            <Button
              size="sm"
              type="button"
              disabled={loading || !company}
              onClick={onValidate}
            >
              Enregistrer le proforma
            </Button>

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
