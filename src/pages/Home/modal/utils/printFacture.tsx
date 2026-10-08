import React from "react";
import Button from "../../../../components/ui/button/Button";
import {
  Client,
  Proforma,
  ProLigneArticle,
} from "../../../../interfaces/interfaces";

import { CompanyInfo, DEFAULT_COMPANY } from "../../../proforma/generatePdf";

interface ProformaPrintProps {
  form: Proforma;
  client: Client;
  ligneArticle: ProLigneArticle[];
  company?: CompanyInfo;
  onClose?: () => void;
}

const ProformaPrint: React.FC<ProformaPrintProps> = ({
  form,
  client,
  ligneArticle,
  company = DEFAULT_COMPANY,
  onClose,
}) => {
  const formatMontant = (value: number) => {
    return `${Number(value || 0).toLocaleString("fr-FR")} Ar`;
  };

  const formatDate = (date?: string) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("fr-FR");
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">

      <div
        id="proforma-print"
        className="
          mx-auto
          min-h-[297mm]
          w-[210mm]
          bg-white
          px-[15mm]
          py-[12mm]
          text-gray-900
          shadow-lg
          print:mx-0
          print:min-h-0
          print:w-[210mm]
          print:shadow-none
        "
      >
        {/* =========================
            HEADER : SOCIÉTÉ | TITRE | CLIENT
        ========================== */}
        <div className="border-b-2 border-gray-900 pb-4">
          <div className="grid grid-cols-3 items-start gap-4">
            {/* Société (gauche) */}
            <div>
              <h2 className="text-base font-bold uppercase tracking-wide">
                {company.nom}
              </h2>

              <p className="mt-1 text-sm">{company.adresse}</p>

              <p className="text-sm">Tél : {company.tel}</p>

              <p className="text-sm">Email : {company.email}</p>
            </div>

            {/* Titre (centre) */}
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-widest">PROFORMA</h1>

              <p className="mt-2 text-sm font-semibold">N° {form.pro_code}</p>

              <p className="mt-1 text-sm">Date : {formatDate(form.pro_date)}</p>
            </div>

            {/* Client (droite) */}
            <div className="break-words">
              <p className="text-sm font-bold">{client.cli_nom}</p>

              <p className="mt-1 text-sm">Code : {client.cli_code || "-"}</p>

              <p className="text-sm">Adresse : {client.cli_adresse || "-"}</p>

              <p className="text-sm">Tél : {client.cli_tel1 || "-"}</p>

              <p className="text-sm">Email : {client.cli_email || "-"}</p>

              {client.cli_nif && (
                <p className="text-sm">NIF : {client.cli_nif}</p>
              )}

              {client.cli_stat && (
                <p className="text-sm">STAT : {client.cli_stat}</p>
              )}
            </div>
          </div>
        </div>

        {/* =========================
            INFORMATIONS PROFORMA
        ========================== */}
        <div className="mt-6 grid grid-cols-3 gap-4 border-y border-gray-300 py-3 text-sm">
          <div>
            <span className="font-semibold">Mode de commande :</span>{" "}
            {form.pro_modecmd || "-"}
          </div>

          <div>
            <span className="font-semibold">Date livraison :</span>{" "}
            {formatDate(form.pro_dateliv)}
          </div>

          <div>
            <span className="font-semibold">Client :</span> {form.pro_cli_code}
          </div>
        </div>

        {/* =========================
            TABLEAU ARTICLES
        ========================== */}
        <div className="mt-7">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="w-[15%] border border-gray-800 px-3 py-2 text-left font-bold">
                  Code
                </th>

                <th className="w-[30%] border border-gray-800 px-3 py-2 text-left font-bold">
                  Désignation
                </th>

                <th className="w-[10%] border border-gray-800 px-3 py-2 text-center font-bold">
                  Qté
                </th>

                <th className="w-[15%] border border-gray-800 px-3 py-2 text-right font-bold">
                  Prix U.
                </th>

                <th className="w-[10%] border border-gray-800 px-3 py-2 text-center font-bold">
                  TVA
                </th>

                <th className="w-[20%] border border-gray-800 px-3 py-2 text-right font-bold">
                  Total HT
                </th>
              </tr>
            </thead>

            <tbody>
              {ligneArticle.map((article, index) => (
                <tr key={article.prol_uid || article.prol_id || index}>
                  <td className="border border-gray-400 px-3 py-3 align-top">
                    {article.prol_Art_Code}
                  </td>

                  <td className="border border-gray-400 px-3 py-3 align-top">
                    {article.art_nom}
                  </td>

                  <td className="border border-gray-400 px-3 py-3 text-center align-top">
                    {article.prol_Quantite}
                  </td>

                  <td className="border border-gray-400 px-3 py-3 text-right align-top">
                    {formatMontant(article.prol_prixunit)}
                  </td>

                  <td className="border border-gray-400 px-3 py-3 text-center align-top">
                    {article.prol_Tva} %
                  </td>

                  <td className="border border-gray-400 px-3 py-3 text-right align-top">
                    {formatMontant(article.prol_TotalHT)}
                  </td>
                </tr>
              ))}

              {ligneArticle.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="border border-gray-400 px-3 py-8 text-center text-gray-500"
                  >
                    Aucun article
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* =========================
            TOTAUX
        ========================== */}
        <div className="mt-6 flex justify-end">
          <div className="w-[320px]">
            {/* Total HT */}
            <div className="flex justify-between border-b border-gray-300 py-2 text-sm">
              <span className="font-semibold">Total HT</span>

              <span>{formatMontant(form.pro_montant_ht)}</span>
            </div>

            {/* Remise */}
            {form.pro_remise > 0 && (
              <div className="flex justify-between border-b border-gray-300 py-2 text-sm">
                <span className="font-semibold">Remise</span>

                <span>- {formatMontant(form.pro_remise)}</span>
              </div>
            )}

            {/* TVA */}
            <div className="flex justify-between border-b border-gray-300 py-2 text-sm">
              <span className="font-semibold">Total TVA</span>

              <span>{formatMontant(form.pro_tva)}</span>
            </div>

            {/* TTC (sans cadre) */}
            <div className="mt-2 flex justify-between py-2 text-base font-bold">
              <span>TOTAL TTC</span>

              <span>{formatMontant(form.pro_montant_ttc)}</span>
            </div>
          </div>
        </div>

        {/* =========================
            MONTANT EN LETTRES
        ========================== */}
        <div className="mt-8 rounded border border-gray-300 p-4">
          <p className="text-xs font-bold uppercase">
            Arrêté du présent proforma à la somme de :
          </p>

          <p className="mt-2 text-sm italic">{form.pro_lettre || "-"}</p>
        </div>

        {/* =========================
            FOOTER
        ========================== */}
        <div className="mt-12 border-t border-gray-300 pt-4 text-center text-xs text-gray-500">
          <p>Ce document est un proforma et ne constitue pas une facture.</p>

          <p className="mt-1">Proforma N° {form.pro_code}</p>
        </div>
      </div>
    </div>
  );
};

export default ProformaPrint;
