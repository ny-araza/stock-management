import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { montantEnLettres } from "./numberToWords";

export interface DocumentLigne {
  designation: string;
  quantite: number;
  datePeremption?: string;
  prixUnitaire: number;
  remise: number;
  tva: number;
  montantTtc: number;
}

export interface DocumentData {
  type: "FACTURE" | "PROFORMA";
  code: string;
  date: string;
  clientNom: string;
  clientAdresse: string;
  clientNif?: string;
  clientStat?: string;
  modePaiementLabel: string;
  lignes: DocumentLigne[];
  montantHt: number;
  remise: number;
  tva: number;
  montantTtc: number;
}

// À terme, sortir ça dans une config / un appel API "infos entreprise"
const ENTREPRISE = {
  nom: "TOUT POUR BEBE ET ENFANT",
  adresse: "IV K 22 ANKADIFOTSY",
  nif: "4005408199",
  stat: "47110112021000239",
};

function formatNombre(n: number): string {
  // Formatage manuel pour éviter les espaces insécables fines
  // que jsPDF/Helvetica n'affiche pas correctement (elles sortent en "/")
  const parts = Math.round(n).toString().split("");
  let result = "";
  let count = 0;

  for (let i = parts.length - 1; i >= 0; i--) {
    result = parts[i] + result;
    count++;
    if (count % 3 === 0 && i !== 0) {
      result = " " + result; // espace normal, pas d'espace insécable
    }
  }

  return result;
}

function formatDateFr(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("fr-FR");
}

export function generateDocumentPDF(data: DocumentData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 40;

  const isProforma = data.type === "PROFORMA";
  const titre = isProforma ? "PROFORMA" : "FACTURE";

  // --- Titre du document (bien visible pour distinguer proforma / facture) ---
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(titre, pageWidth / 2, y, { align: "center" });
  y += 16;

  // --- Bloc gauche : entreprise (pointillés) ---
  const boxWidth = (pageWidth - marginX * 2 - 20) / 2;
  const boxHeight = 130;

  doc.setDrawColor(0);
  doc.setLineDashPattern([2, 2], 0);
  doc.rect(marginX, y, boxWidth, boxHeight);
  doc.setLineDashPattern([], 0);

  let ly = y + 20;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(ENTREPRISE.nom, marginX + 10, ly);
  doc.setFont("helvetica", "normal");
  ly += 18;
  doc.text(ENTREPRISE.adresse, marginX + 10, ly);
  ly += 18;
  doc.text(`NIF : ${ENTREPRISE.nif}`, marginX + 10, ly);
  ly += 24;
  doc.text(`STAT : ${ENTREPRISE.stat}`, marginX + 10, ly);

  // --- Bloc droit : code document + client ---
  const rightX = marginX + boxWidth + 20;
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(data.code, rightX, y + 24);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let ry = y + 24;
  doc.text(`Date : ${formatDateFr(data.date)}`, rightX + boxWidth - 130, y - 4);

  ry += 24;
  doc.text(`Doit : ${data.clientNom}`, rightX, ry);
  ry += 20;
  doc.text(`Adresse : ${data.clientAdresse || "-"}`, rightX, ry);
  if (data.clientNif) {
    ry += 16;
    doc.text(`NIF : ${data.clientNif}`, rightX, ry);
  }
  if (data.clientStat) {
    ry += 16;
    doc.text(`STAT : ${data.clientStat}`, rightX, ry);
  }

  y += boxHeight + 30;

  // --- Tableau des lignes ---
  autoTable(doc, {
    startY: y,
    head: [
      [
        "Quantité",
        "Désignation",
        "Date Per",
        "Prix Unitaire",
        "Remise",
        "TVA",
        "Montant TTC",
      ],
    ],
    body: data.lignes.map((l) => [
      l.quantite,
      l.designation,
      l.datePeremption ? formatDateFr(l.datePeremption) : "-",
      formatNombre(l.prixUnitaire),
      `${l.remise}%`,
      `${l.tva}`,
      formatNombre(l.montantTtc),
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: 20,
      fontStyle: "bold",
      lineColor: 0,
      lineWidth: 0.5,
    },
    styles: { fontSize: 9, lineColor: 0, lineWidth: 0.5 },
    margin: { left: marginX, right: marginX },
  });

  // @ts-expect-error - lastAutoTable ajouté par le plugin
  y = doc.lastAutoTable.finalY + 20;

  // --- Bloc totaux + montant en lettres ---
  doc.setDrawColor(0);
  doc.rect(marginX, y, pageWidth - marginX * 2, 90);
  doc.line(pageWidth - marginX - 180, y, pageWidth - marginX - 180, y + 90);

  doc.setFontSize(9);
  doc.text("Arrêtée la somme de :", marginX + 10, y + 20);
  doc.setFont("helvetica", "bolditalic");
  const lettres = doc.splitTextToSize(
    montantEnLettres(data.montantTtc),
    pageWidth - marginX * 2 - 200,
  );
  doc.text(lettres, marginX + 10, y + 38);
  doc.setFont("helvetica", "normal");
  doc.text(`Paiement client : ${data.modePaiementLabel}`, marginX + 10, y + 70);

  const totX = pageWidth - marginX - 170;
  let ty = y + 20;
  doc.text("Montant HT :", totX, ty);
  doc.text(formatNombre(data.montantHt) + " Ar", pageWidth - marginX - 10, ty, {
    align: "right",
  });
  ty += 16;
  doc.text("Remise :", totX, ty);
  doc.text(formatNombre(data.remise) + " Ar", pageWidth - marginX - 10, ty, {
    align: "right",
  });
  ty += 16;
  doc.text("TVA :", totX, ty);
  doc.text(formatNombre(data.tva) + " Ar", pageWidth - marginX - 10, ty, {
    align: "right",
  });
  ty += 16;
  doc.setFont("helvetica", "bold");
  doc.text("Montant TTC :", totX, ty);
  doc.text(
    formatNombre(data.montantTtc) + " Ar",
    pageWidth - marginX - 10,
    ty,
    { align: "right" },
  );

  y += 120;

  // --- Signatures ---
  doc.setFont("helvetica", "bold");
  doc.text("FOURNISSEUR", marginX + 20, y);
  doc.text("CLIENT", pageWidth - marginX - 100, y);

  doc.save(`${data.code}.pdf`);
  return doc;
}
