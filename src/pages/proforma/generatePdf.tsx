import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Client, Proforma, ProLigneArticle } from "../../interfaces/interfaces";

export interface CompanyInfo {
  nom: string;
  adresse: string;
  tel: string;
  email: string;
}

export const DEFAULT_COMPANY: CompanyInfo = {
  nom: "SAINTO",
  adresse: "Antananarivo, Madagascar",
  tel: "+261 XX XX XXX XX",
  email: "contact@sainto.mg",
};

export interface GenerateProformaPdfOptions {
  form: Proforma;
  client: Client;
  ligneArticle: ProLigneArticle[];
  company?: CompanyInfo;
  /** Nom du fichier sans extension. Par défaut : Proforma_<code> */
  fileName?: string;
  /** Si true, retourne le Blob au lieu de télécharger le fichier */
  returnBlob?: boolean;
}

type RGB = [number, number, number];

const GRAY_BORDER: RGB = [209, 213, 219];
const GRAY_TEXT: RGB = [107, 114, 128];
const DARK: RGB = [17, 24, 39];

const formatMontant = (montant: number) => {
  const value = Number(montant || 0);

  return `${value
    .toLocaleString("fr-FR")
    .replace(/\u202f/g, " ")
    .replace(/\u00a0/g, " ")} Ar`;
};

const formatDate = (date?: string) => {
  if (!date) return "";
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString("fr-FR");
};

export const generateProformaPdf = ({
  form,
  client,
  ligneArticle,
  company = DEFAULT_COMPANY,
  fileName,
  returnBlob = false,
}: GenerateProformaPdfOptions): Blob | void => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 15;
  const rightX = pageWidth - marginX;
  const centerX = pageWidth / 2;

  doc.setTextColor(...DARK);

  // =========================
  // HEADER : SOCIÉTÉ | TITRE | CLIENT
  // =========================
  const headerY = 20;

  // Société
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(company.nom, marginX, headerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(company.adresse, marginX, headerY + 6);
  doc.text(`Tél : ${company.tel}`, marginX, headerY + 11);
  doc.text(`Email : ${company.email}`, marginX, headerY + 16);

  // Titre
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("PROFORMA", centerX, headerY, { align: "center", charSpace: 0.5 });

  doc.setFontSize(10);
  doc.text(`N° ${form.pro_code}`, centerX, headerY + 7, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.text(`Date : ${formatDate(form.pro_date)}`, centerX, headerY + 13, {
    align: "center",
  });

  // Client
  const clientX = 140;
  const clientW = rightX - clientX;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const nomLines = doc.splitTextToSize(client.cli_nom || "", clientW);
  doc.text(nomLines, clientX, headerY);

  let cy = headerY + nomLines.length * 5 + 1;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const clientLines = [
    `Code : ${client.cli_code || "-"}`,
    `Adresse : ${client.cli_adresse || "-"}`,
    `Tél : ${client.cli_tel1 || "-"}`,
    `Email : ${client.cli_email || "-"}`,
    ...(client.cli_nif ? [`NIF : ${client.cli_nif}`] : []),
    ...(client.cli_stat ? [`STAT : ${client.cli_stat}`] : []),
  ];

  clientLines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, clientW);
    doc.text(wrapped, clientX, cy);
    cy += wrapped.length * 4.5;
  });

  const headerBottom = Math.max(headerY + 16, cy) + 3;
  doc.setDrawColor(...DARK);
  doc.setLineWidth(0.6);
  doc.line(marginX, headerBottom, rightX, headerBottom);

  // =========================
  // INFORMATIONS PROFORMA
  // =========================
  const infoY = headerBottom + 7;
  doc.setDrawColor(...GRAY_BORDER);
  doc.setLineWidth(0.3);
  doc.line(marginX, infoY, rightX, infoY);
  doc.line(marginX, infoY + 10, rightX, infoY + 10);

  const colW = (rightX - marginX) / 3;
  const infos: [string, string][] = [
    ["Mode de commande : ", form.pro_modecmd || "-"],
    ["Date livraison : ", formatDate(form.pro_dateliv)],
    ["Client : ", form.pro_cli_code || ""],
  ];

  doc.setFontSize(9);
  infos.forEach(([label, value], i) => {
    const x = marginX + i * colW;
    doc.setFont("helvetica", "bold");
    doc.text(label, x, infoY + 6.5);
    const labelW = doc.getTextWidth(label);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), x + labelW, infoY + 6.5);
  });

  const rows = ligneArticle.length
    ? ligneArticle.map((a) => [
        a.prol_Art_Code ?? "",
        a.art_nom ?? "",
        String(a.prol_Quantite ?? ""),
        formatMontant(Number(a.prol_prixunit || 0)),
        `${a.prol_Tva ?? 0} %`,
        formatMontant(Number(a.prol_TotalHT || 0)),
      ])
    : [
        [
          {
            content: "Aucun article",
            colSpan: 6,
            styles: { halign: "center", textColor: GRAY_TEXT, cellPadding: 8 },
          },
        ],
      ];

  autoTable(doc, {
    startY: infoY + 18,
    margin: { left: marginX, right: marginX },
    head: [["Code", "Désignation", "Qté", "Prix U.", "TVA", "Total HT"]],
    body: rows as any,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3,
      valign: "top",
      textColor: DARK,
      lineColor: [156, 163, 175],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: DARK,
      fontStyle: "bold",
      lineColor: [31, 41, 55],
      lineWidth: 0.3,
    },
    columnStyles: {
      0: { cellWidth: 27, halign: "left" },
      1: { cellWidth: 54, halign: "left" },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 27, halign: "right" },
      4: { cellWidth: 18, halign: "center" },
      5: { cellWidth: 36, halign: "right" },
    },
    didParseCell: (data) => {
      if (data.section === "head") {
        const aligns = ["left", "left", "center", "right", "center", "right"];
        data.cell.styles.halign = aligns[data.column.index] as any;
      }
    },
  });

  // =========================
  // TOTAUX
  // =========================
  let y = (doc as any).lastAutoTable.finalY + 8;

  if (y + 75 > pageHeight) {
    doc.addPage();
    y = 20;
  }

  const totW = 80;
  const totX = rightX - totW;

  const ligneTotal = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(label, totX, y + 5);
    doc.setFont("helvetica", "normal");
    doc.text(value, rightX, y + 5, { align: "right" });
    doc.setDrawColor(...GRAY_BORDER);
    doc.setLineWidth(0.3);
    doc.line(totX, y + 8, rightX, y + 8);
    y += 9;
  };

  ligneTotal("Total HT", formatMontant(form.pro_montant_ht));
  if (Number(form.pro_remise) > 0) {
    ligneTotal("Remise", `- ${formatMontant(form.pro_remise)}`);
  }
  ligneTotal("Total TVA", formatMontant(form.pro_tva));

  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL TTC", totX, y + 5);
  doc.text(formatMontant(form.pro_montant_ttc), rightX, y + 5, {
    align: "right",
  });
  y += 8;

  // =========================
  // MONTANT EN LETTRES
  // =========================
  y += 10;
  const lettresLines = doc.splitTextToSize(
    form.pro_lettre || "-",
    rightX - marginX - 8,
  );
  const lettresH = 14 + lettresLines.length * 4.5;

  doc.setDrawColor(...GRAY_BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, y, rightX - marginX, lettresH, 1.5, 1.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("ARRÊTÉ DU PRÉSENT PROFORMA À LA SOMME DE :", marginX + 4, y + 7);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.text(lettresLines, marginX + 4, y + 13);

  // =========================
  // FOOTER (toutes les pages)
  // =========================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const fy = pageHeight - 20;

    doc.setDrawColor(...GRAY_BORDER);
    doc.setLineWidth(0.3);
    doc.line(marginX, fy, rightX, fy);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY_TEXT);
    doc.text(
      "Ce document est un proforma et ne constitue pas une facture.",
      centerX,
      fy + 6,
      { align: "center" },
    );
    doc.text(`Proforma N° ${form.pro_code}`, centerX, fy + 11, {
      align: "center",
    });
    doc.text(`Page ${i} / ${totalPages}`, rightX, fy + 11, { align: "right" });
    doc.setTextColor(...DARK);
  }

  // =========================
  // SORTIE
  // =========================
  if (returnBlob) return doc.output("blob");

  doc.save(`${fileName ?? `Proforma_${form.pro_code}`}.pdf`);
};
