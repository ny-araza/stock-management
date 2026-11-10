import { useEffect, useState } from "react";
import { useVentes } from "../../hooks/useVentes";
import ListeVentes from "./listVente";
import { ListeVente, VenteParams } from "../../services/ventesService";
import { useNavigate } from "react-router";
import { useAuth } from "../../services/authLogin";
import updateVente from "../../services/updateVente";
import Alert from "../../components/ui/alert/Alert";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Modal } from "../../components/ui/modal";
import { Download, X } from "lucide-react";
import { formatDate } from "../Home/modal/utils/utilsFucntions";
import { Enumeration, EnumerationOption } from "../../interfaces/interfaces";
import { apiFetch } from "../../services/api";
import html2canvas from "html2canvas";

export default function VentesPage() {
  //ticket
  const entreprise = "TOUT POUR BEBE";
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketUrl, setTicketUrl] = useState<string | null>(null);
  const [ticketBlob, setTicketBlob] = useState<Blob | null>(null);
  // ticket
  const [payementEnum, setpayementEnum] = useState<Enumeration[]>([]);

  const enumerationPaye: EnumerationOption[] = payementEnum.map(
    (item: Enumeration) => ({
      ...item,
      value: item.enu_id.toString(),
      label: item.enu_nom,
    }),
  );
  //modePaye
  const [modePayementEnum, setModepayementEnum] = useState<Enumeration[]>([]);
  const enumerationModePaye: EnumerationOption[] = modePayementEnum.map(
    (item: Enumeration) => ({
      ...item,
      value: item.enu_id.toString(),
      label: item.enu_nom,
    }),
  );
  const fetchPaye = async (enu_code: string) => {
    try {
      const query = new URLSearchParams();
      query.set("enu_code", enu_code);

      const res = await apiFetch(
        `/api/generate-enumeration/?${query.toString()}`,
      );

      if (res.success) {
        setpayementEnum(res.nom_enumeration || []);
      }
    } catch (error) {
      console.error("Erreur chargement énumération PAYE_CLIENT :", error);
    }
  };

  const fetchModePaye = async (enu_code: string) => {
    try {
      const query = new URLSearchParams();
      query.set("enu_code", enu_code);
      const res = await apiFetch(
        `/api/generate-enumeration/?${query.toString()}`,
      );

      if (res.success) {
        console.log(res.success);
        setModepayementEnum(res.nom_enumeration);
      }
    } catch (error: any) {
      console.log(error);
    }
  };
  const [alert, setAlert] = useState({
    open: false,
    variant: "success" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
  });
  const {
    ventes,
    loading,
    error,
    page,
    totalPages,
    totalCount,
    setPage,
    rechercher,
    refresh,
  } = useVentes();
  const { authorisation, user } = useAuth();
  const navigate = useNavigate();

  const handleModifier = (vente: ListeVente) => {
    // Empêcher la modification d'une vente déjà validée
    if (vente.vte_valide === 1) {
      setAlert({
        open: true,
        variant: "warning",
        title: "Attention",
        message: "Vente deja validé.",
      });
      return;
    }

    navigate(`/new-vente/${vente.vte_id}/modifier`);
  };

  const handleValidate = (vente: ListeVente) => {
    if (vente.vte_valide === 1) {
      setAlert({
        open: true,
        variant: "warning",
        title: "Attention",
        message: "Vente deja validé.",
      });
      return;
    }
    const validateAutorisation = authorisation?.filter((elt) => {
      return elt.aut_men_code == 110 && elt.aut_acces === 1;
    });
    if (!validateAutorisation) {
      setAlert({
        open: true,
        variant: "warning",
        title: "Attention",
        message: "Vous n'êtes pas autorisé a modifier cette vente",
      });
    }
    updateVente(vente.vte_id, {
      vte_paye: vente.vte_paye === 1 ? true : false,
      vte_valide: true,
      vte_usermdf: user?.use_login ? user.use_login : "",
    });
    refresh();
  };
  const handlePaye = async (vente: ListeVente) => {
    // Vérifier la validation
    console.log(vente.vte_payeclient);

    if (vente.vte_valide != 1) {
      setAlert({
        open: true,
        variant: "warning",
        title: "Attention",
        message: "Veuillez d'abord valider cette vente.",
      });
      return;
    }
    // Vérifier si la vente est déjà payée
    if (vente.vte_paye == 1) {
      setAlert({
        open: true,
        variant: "warning",
        title: "Attention",
        message: "Cette vente a déjà été payée.",
      });
      return;
    }

    // Vérifier l'autorisation
    const autorise = authorisation?.some(
      (elt) => elt.aut_men_code == 110 && elt.aut_acces === 1,
    );

    if (!autorise) {
      setAlert({
        open: true,
        variant: "warning",
        title: "Attention",
        message: "Vous n'êtes pas autorisés à payer cette vente.",
      });
      return;
    }

    try {
      // Effectuer le paiement
      await updateVente(vente.vte_id, {
        vte_paye: true,
        vte_valide: true,
        vte_usermdf: user?.use_login || "",
      });

      // Générer et afficher le ticket
      afficherTicket(vente);

      // Actualiser la liste
      refresh();
    } catch (error) {
      console.error("Erreur lors du paiement :", error);

      setAlert({
        open: true,
        variant: "error",
        title: "Erreur",
        message: "Le paiement n'a pas pu être effectué.",
      });
    }
  };
  // ===============================
  // EXPORTER FACTURE PDF / PNG
  // ===============================
  //

  const genererTicketPDF = (vente: ListeVente): Blob => {
    // Largeur du ticket : 80 mm
    const pageWidth = 80;

    // Toutes les lignes de la vente
    const lignes = vente.lignes || [];

    // Hauteur dynamique selon le nombre d'articles
    const pageHeight = 125 + lignes.length * 12;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [pageWidth, pageHeight],
    });

    // --------------------------------
    // FORMATAGE DES NOMBRES
    // --------------------------------

    const formatNombre = (valeur: number | string | null | undefined) => {
      const nombre = Number(valeur || 0);

      return nombre.toLocaleString("fr-FR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    };

    const formatAr = (montant: number) => {
      const value = Number(montant || 0);

      return `${value
        .toLocaleString("fr-FR")
        .replace(/\u202f/g, " ")
        .replace(/\u00a0/g, " ")} Ar`;
    };

    // --------------------------------
    // FORMATAGE DES DATES
    // --------------------------------

    const formatDate = (date: string | null | undefined) => {
      if (!date) return "-";

      const d = new Date(date);

      if (isNaN(d.getTime())) return date;

      return d.toLocaleDateString("fr-FR");
    };

    const formatDateHeure = (date: string | null | undefined) => {
      if (!date) return "-";

      const d = new Date(date);

      if (isNaN(d.getTime())) return date;

      return d.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    // --------------------------------
    // EN-TÊTE DU TICKET
    // --------------------------------

    let y = 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(entreprise, pageWidth / 2, y, {
      align: "center",
    });

    y += 7;

    doc.setFontSize(11);
    doc.text("TICKET DE CAISSE", pageWidth / 2, y, {
      align: "center",
    });

    y += 5;

    doc.setLineWidth(0.3);
    doc.line(4, y, pageWidth - 4, y);

    y += 6;

    // --------------------------------
    // INFORMATIONS DE LA VENTE
    // --------------------------------

    doc.setFontSize(8);

    const afficherInfo = (label: string, valeur: string) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, 4, y);

      doc.setFont("helvetica", "normal");

      const lignesTexte = doc.splitTextToSize(valeur || "-", pageWidth - 28);

      doc.text(lignesTexte, 25, y);

      y += Math.max(4, lignesTexte.length * 3.5);
    };

    afficherInfo("N° Vente:", vente.vte_code || "-");
    afficherInfo("Date:", formatDate(vente.vte_date));
    const today = new Date().toISOString().split("T")[0];
    afficherInfo("Date paiement:", formatDate(vente.vte_datepay || today));
    afficherInfo("Client:", vente.vte_cli_nom || "-");
    afficherInfo("Contact:", vente.vte_cli_contact || "-");
    const enu_nom = enumerationModePaye.filter(
      (elt) => elt.enu_id == Number(vente.vte_modepaye),
    )[0]?.enu_nom;
    afficherInfo("Mode paiement:", enu_nom || vente.vte_modepaye);

    if (vente.vte_payeclient) {
      const enu_nom = enumerationPaye.filter(
        (elt) => elt.enu_id == Number(vente.vte_payeclient),
      )[0].enu_nom;
      afficherInfo("Type paiement :", enu_nom);
    }

    y += 2;

    doc.line(4, y, pageWidth - 4, y);

    y += 6;

    // --------------------------------
    // ARTICLES
    // --------------------------------

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    doc.text("ARTICLES", pageWidth / 2, y, {
      align: "center",
    });

    y += 3;

    // Création du tableau avec toutes les lignes
    autoTable(doc, {
      startY: y,

      margin: {
        left: 4,
        right: 4,
      },

      head: [["Désignation", "Qté", "P.U", "Total"]],

      body: lignes.map((item) => [
        item.art_nom || item.vtel_art_code || "-",
        formatNombre(item.vtel_quantite),
        formatAr(item.vtel_prixunit),
        formatAr(item.vtel_ttc),
      ]),

      theme: "plain",

      styles: {
        font: "helvetica",
        fontSize: 7,
        cellPadding: 1.5,
        overflow: "linebreak",
        textColor: [0, 0, 0],
        lineColor: [180, 180, 180],
        lineWidth: 0.1,
      },

      headStyles: {
        fontStyle: "bold",
        fontSize: 7,
        textColor: [0, 0, 0],
        fillColor: [235, 235, 235],
      },

      columnStyles: {
        0: {
          cellWidth: 32,
          halign: "left",
        },
        1: {
          cellWidth: 8,
          halign: "center",
        },
        2: {
          cellWidth: 14,
          halign: "right",
        },
        3: {
          cellWidth: 16,
          halign: "right",
        },
      },

      didParseCell: (data) => {
        if (data.section === "body") {
          data.cell.styles.fontSize = 7;
        }
      },
    });

    // Position après le tableau
    y = (doc as any).lastAutoTable.finalY + 5;

    // --------------------------------
    // TOTAUX
    // --------------------------------

    doc.setLineWidth(0.3);
    doc.line(4, y, pageWidth - 4, y);

    y += 6;

    const montantHT = Number(vente.vte_montant_ht || 0);
    const montantTTC = Number(vente.vte_montant_ttc || 0);

    const montantTVA = montantTTC - montantHT;
    const remise = Number(vente.ve_remise || 0);

    const afficherTotal = (label: string, montant: number, gras = false) => {
      doc.setFont("helvetica", gras ? "bold" : "normal");

      doc.setFontSize(8);

      doc.text(label, 4, y);

      doc.text(formatAr(montant), pageWidth - 4, y, { align: "right" });

      y += 5;
    };

    afficherTotal("Total HT :", montantHT);

    afficherTotal("TVA :", montantTVA);

    if (remise > 0) {
      afficherTotal("Remise :", remise);
    }

    y += 2;

    doc.line(4, y, pageWidth - 4, y);

    y += 7;

    // TOTAL TTC
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);

    doc.text("TOTAL TTC :", 4, y);

    doc.text(formatAr(montantTTC), pageWidth - 4, y, { align: "right" });

    y += 8;

    // --------------------------------
    // MESSAGE DE REMERCIEMENT
    // --------------------------------

    doc.line(4, y, pageWidth - 4, y);

    y += 7;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);

    doc.text("MERCI POUR VOTRE ACHAT !", pageWidth / 2, y, { align: "center" });

    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    doc.text(`À bientôt chez ${entreprise}`, pageWidth / 2, y, {
      align: "center",
    });

    // --------------------------------
    // RETOURNER LE PDF
    // --------------------------------

    return doc.output("blob");
  };

  const afficherTicket = (vente: ListeVente) => {
    const blob = genererTicketPDF(vente);

    const url = URL.createObjectURL(blob);

    setTicketBlob(blob);
    setTicketUrl(url);
    setTicketModalOpen(true);

    // Téléchargement automatique
    const link = document.createElement("a");
    link.href = url;
    link.download = `Ticket_${vente.vte_code || vente.vte_id}.pdf`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /// Facture export

  // =====================================================
  // FORMATAGE FACTURE
  // =====================================================

  const formatFactureMontant = (value: number | string | null | undefined) => {
    return `${Number(value || 0)
      .toLocaleString("fr-FR")
      .replace(/\u202f/g, " ")
      .replace(/\u00a0/g, " ")} Ar`;
  };

  const formatFactureDate = (date?: string | null) => {
    if (!date) return "-";

    const d = new Date(date);

    return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString("fr-FR");
  };

  const escapeHTML = (value: unknown) => {
    return String(value ?? "-").replace(/[&<>"']/g, (char) => {
      const entities: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };

      return entities[char];
    });
  };

  // =====================================================
  // GÉNÉRER FACTURE PDF A4
  // =====================================================

  const genererFacturePDF = (vente: ListeVente): Blob => {
    const doc = new jsPDF({
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const marginX = 15;
    const rightX = pageWidth - marginX;
    const centerX = pageWidth / 2;

    const lignes = vente.lignes || [];

    const DARK: [number, number, number] = [17, 24, 39];
    const GRAY: [number, number, number] = [107, 114, 128];
    const BORDER: [number, number, number] = [209, 213, 219];

    const montantHT = Number(vente.vte_montant_ht || 0);
    const montantTTC = Number(vente.vte_montant_ttc || 0);
    const montantTVA = Number((montantTTC - montantHT).toFixed(2));
    const remise = Number(vente.ve_remise || 0);

    doc.setTextColor(...DARK);

    // =====================================
    // HEADER : ENTREPRISE / FACTURE / CLIENT
    // =====================================

    const headerY = 20;

    // Entreprise
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(entreprise, marginX, headerY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    doc.text("Antananarivo, Madagascar", marginX, headerY + 6);

    // Titre facture
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);

    doc.text("FACTURE", centerX, headerY, {
      align: "center",
      charSpace: 0.5,
    });

    doc.setFontSize(10);

    doc.text(`N° ${vente.vte_code}`, centerX, headerY + 7, {
      align: "center",
    });

    doc.setFont("helvetica", "normal");

    doc.text(
      `Date : ${formatFactureDate(vente.vte_date)}`,
      centerX,
      headerY + 13,
      { align: "center" },
    );

    // Informations client
    const clientX = 140;
    const clientW = rightX - clientX;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    const clientName = doc.splitTextToSize(vente.vte_cli_nom || "-", clientW);

    doc.text(clientName, clientX, headerY);

    let clientY = headerY + clientName.length * 5 + 1;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    const clientInfos = [
      `Code : ${vente.vte_cli_code || "-"}`,
      `Contact : ${vente.vte_cli_contact || "-"}`,
      ...(vente.ve_adresse_liv ? [`Adresse : ${vente.ve_adresse_liv}`] : []),
    ];

    clientInfos.forEach((info) => {
      const wrapped = doc.splitTextToSize(info, clientW);

      doc.text(wrapped, clientX, clientY);

      clientY += wrapped.length * 4.5;
    });

    const headerBottom = Math.max(headerY + 16, clientY) + 3;

    doc.setDrawColor(...DARK);
    doc.setLineWidth(0.6);

    doc.line(marginX, headerBottom, rightX, headerBottom);

    // =====================================
    // INFORMATIONS DE LA VENTE
    // =====================================

    const infoY = headerBottom + 7;

    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);

    doc.line(marginX, infoY, rightX, infoY);
    doc.line(marginX, infoY + 10, rightX, infoY + 10);

    const colW = (rightX - marginX) / 3;

    const modePaiement =
      enumerationModePaye.find(
        (elt) => elt.enu_id === Number(vente.vte_modepaye),
      )?.enu_nom ||
      vente.vte_modepaye ||
      "-";

    const typePaiement =
      enumerationPaye.find((elt) => elt.enu_id === Number(vente.vte_payeclient))
        ?.enu_nom ||
      vente.vte_payeclient ||
      "-";

    const infos: [string, string][] = [
      ["Mode paiement : ", String(modePaiement)],
      ["Type paiement : ", String(typePaiement)],
      ["Échéance : ", formatFactureDate(vente.ve_dateecheance)],
    ];

    doc.setFontSize(8.5);

    infos.forEach(([label, value], index) => {
      const x = marginX + index * colW;

      doc.setFont("helvetica", "bold");
      doc.text(label, x, infoY + 6.5);

      const labelWidth = doc.getTextWidth(label);

      doc.setFont("helvetica", "normal");

      const wrapped = doc.splitTextToSize(value, colW - labelWidth - 2);

      doc.text(wrapped, x + labelWidth, infoY + 6.5);
    });

    // =====================================
    // TABLEAU DES ARTICLES
    // =====================================

    const rows = lignes.length
      ? lignes.map((item) => [
          item.vtel_art_code || "-",
          item.art_nom || item.vtel_art_code || "-",
          String(item.vtel_quantite || 0),
          formatFactureMontant(item.vtel_prixunit),
          formatFactureMontant(item.vtel_ttc),
        ])
      : [
          [
            {
              content: "Aucun article",
              colSpan: 5,
              styles: {
                halign: "center",
                textColor: GRAY,
                cellPadding: 8,
              },
            },
          ],
        ];

    autoTable(doc, {
      startY: infoY + 18,

      margin: {
        left: marginX,
        right: marginX,
        bottom: 25,
      },

      head: [["Code", "Désignation", "Qté", "Prix U.", "Total TTC"]],

      body: rows as any,

      theme: "grid",

      styles: {
        font: "helvetica",
        fontSize: 8.5,
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
        0: { cellWidth: 27 },
        1: { cellWidth: 67 },
        2: { cellWidth: 18, halign: "center" },
        3: { cellWidth: 35, halign: "right" },
        4: { cellWidth: 33, halign: "right" },
      },
    });

    // =====================================
    // TOTAUX
    // =====================================

    let y = (doc as any).lastAutoTable.finalY + 8;

    if (y + 65 > pageHeight - 25) {
      doc.addPage();
      y = 20;
    }

    const totalX = rightX - 80;

    const afficherTotal = (label: string, value: string) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);

      doc.text(label, totalX, y + 5);

      doc.setFont("helvetica", "normal");

      doc.text(value, rightX, y + 5, {
        align: "right",
      });

      doc.setDrawColor(...BORDER);
      doc.line(totalX, y + 8, rightX, y + 8);

      y += 9;
    };

    afficherTotal("Total HT", formatFactureMontant(montantHT));

    if (remise > 0) {
      afficherTotal("Remise", `- ${formatFactureMontant(remise)}`);
    }

    afficherTotal("Total TVA", formatFactureMontant(montantTVA));

    y += 3;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);

    doc.text("TOTAL TTC", totalX, y + 5);

    doc.text(formatFactureMontant(montantTTC), rightX, y + 5, {
      align: "right",
    });

    // =====================================
    // MONTANT EN LETTRES
    // =====================================

    if (vente.vte_lettremontant) {
      y += 15;

      const lettres = doc.splitTextToSize(
        vente.vte_lettremontant,
        rightX - marginX - 8,
      );

      const hauteur = 14 + lettres.length * 4.5;

      if (y + hauteur > pageHeight - 27) {
        doc.addPage();
        y = 20;
      }

      doc.setDrawColor(...BORDER);

      doc.roundedRect(marginX, y, rightX - marginX, hauteur, 1.5, 1.5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);

      doc.text("ARRÊTÉE À LA SOMME DE :", marginX + 4, y + 7);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);

      doc.text(lettres, marginX + 4, y + 13);
    }

    // =====================================
    // FOOTER
    // =====================================

    const totalPages = doc.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      const footerY = pageHeight - 20;

      doc.setDrawColor(...BORDER);
      doc.line(marginX, footerY, rightX, footerY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);

      doc.text("Facture client", centerX, footerY + 6, { align: "center" });

      doc.text(`Facture N° ${vente.vte_code}`, centerX, footerY + 11, {
        align: "center",
      });

      doc.text(`Page ${i} / ${totalPages}`, rightX, footerY + 11, {
        align: "right",
      });

      doc.setTextColor(...DARK);
    }

    return doc.output("blob");
  };

  // =====================================================
  // EXPORT PDF
  // =====================================================

  const exporterFacturePDF = (vente: ListeVente) => {
    const blob = genererFacturePDF(vente);

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `Facture_${vente.vte_code || vente.vte_id}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // =====================================================
  // EXPORT PNG
  // =====================================================

  const exporterFacturePNG = async (vente: ListeVente) => {
    const lignes = vente.lignes || [];

    const montantHT = Number(vente.vte_montant_ht || 0);
    const montantTTC = Number(vente.vte_montant_ttc || 0);
    const montantTVA = montantTTC - montantHT;
    const remise = Number(vente.ve_remise || 0);

    const modePaiement =
      enumerationModePaye.find(
        (elt) => elt.enu_id === Number(vente.vte_modepaye),
      )?.enu_nom ||
      vente.vte_modepaye ||
      "-";

    const typePaiement =
      enumerationPaye.find((elt) => elt.enu_id === Number(vente.vte_payeclient))
        ?.enu_nom ||
      vente.vte_payeclient ||
      "-";

    const element = document.createElement("div");

    element.style.cssText = `
      position:fixed;
      left:-10000px;
      top:0;
      width:794px;
      padding:50px;
      box-sizing:border-box;
      background:white;
      color:#111827;
      font-family:Arial,sans-serif;
      font-size:13px;
    `;

    const lignesHTML = lignes
      .map(
        (item) => `
      <tr>
        <td>${escapeHTML(item.vtel_art_code)}</td>
        <td>${escapeHTML(item.art_nom || item.vtel_art_code)}</td>
        <td style="text-align:center">${escapeHTML(item.vtel_quantite)}</td>
        <td style="text-align:right">${escapeHTML(formatFactureMontant(item.vtel_prixunit))}</td>
        <td style="text-align:right">${escapeHTML(formatFactureMontant(item.vtel_ttc))}</td>
      </tr>
    `,
      )
      .join("");

    element.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:25px">
        <div style="flex:1">
          <h2>${escapeHTML(entreprise)}</h2>
          <p>Antananarivo, Madagascar</p>
        </div>

        <div style="flex:1;text-align:center">
          <h1 style="font-size:30px;margin:0">FACTURE</h1>
          <h3>N° ${escapeHTML(vente.vte_code)}</h3>
          <p>Date : ${escapeHTML(formatFactureDate(vente.vte_date))}</p>
        </div>

        <div style="flex:1">
          <h3>${escapeHTML(vente.vte_cli_nom)}</h3>
          <p>Code : ${escapeHTML(vente.vte_cli_code)}</p>
          <p>Contact : ${escapeHTML(vente.vte_cli_contact)}</p>
          <p>Adresse : ${escapeHTML(vente.ve_adresse_liv || "-")}</p>
        </div>
      </div>

      <hr style="margin:25px 0;border:1px solid #111827"/>

      <div style="display:flex;justify-content:space-between;padding:15px 0;border-top:1px solid #d1d5db;border-bottom:1px solid #d1d5db">
        <span><b>Mode paiement :</b> ${escapeHTML(modePaiement)}</span>
        <span><b>Type paiement :</b> ${escapeHTML(typePaiement)}</span>
        <span><b>Date paiement :</b> ${escapeHTML(formatFactureDate(vente.ve_dateecheance))}</span>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-top:30px">
        <thead>
          <tr style="background:#f3f4f6">
            <th>Code</th>
            <th>Désignation</th>
            <th>Qté</th>
            <th>Prix U.</th>
            <th>Total TTC</th>
          </tr>
        </thead>
        <tbody>
          ${lignesHTML || `<tr><td colspan="5" style="text-align:center">Aucun article</td></tr>`}
        </tbody>
      </table>

      <div style="width:330px;margin:30px 0 0 auto">
        <div class="total"><span>Total HT</span><b>${escapeHTML(formatFactureMontant(montantHT))}</b></div>
        ${remise > 0 ? `<div class="total"><span>Remise</span><b>- ${escapeHTML(formatFactureMontant(remise))}</b></div>` : ""}
        <div class="total"><span>Total TVA</span><b>${escapeHTML(formatFactureMontant(montantTVA))}</b></div>
        <div class="total grand"><span>TOTAL TTC</span><b>${escapeHTML(formatFactureMontant(montantTTC))}</b></div>
      </div>

      ${
        vente.vte_lettremontant
          ? `
        <div style="border:1px solid #d1d5db;padding:15px;margin-top:25px">
          <b>ARRÊTÉE À LA SOMME DE :</b>
          <p>${escapeHTML(vente.vte_lettremontant)}</p>
        </div>
      `
          : ""
      }

      <div style="margin-top:50px;border-top:1px solid #d1d5db;padding-top:15px;text-align:center;color:#6b7280">
        Facture N° ${escapeHTML(vente.vte_code)}
      </div>

      <style>
        p { margin:5px 0; color:#4b5563; }
        th,td {
          border:1px solid #9ca3af;
          padding:12px 8px;
          text-align:left;
          font-size:12px;
        }
        th { font-weight:bold; }
        .total {
          display:flex;
          justify-content:space-between;
          padding:10px 0;
          border-bottom:1px solid #d1d5db;
        }
        .grand {
          font-size:17px;
          font-weight:bold;
          border-top:2px solid #111827;
        }
      </style>
    `;

    document.body.appendChild(element);

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
      });

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) resolve(result);
          else reject(new Error("Génération PNG impossible."));
        }, "image/png");
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `Facture_${vente.vte_code || vente.vte_id}.png`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      element.remove();
    }
  };

  // =====================================================
  // GESTION DES EXPORTS
  // =====================================================

  const handleExporterFacture = async (
    vente: ListeVente,
    format: "pdf" | "png",
  ) => {
    console.log("fdsfsdf");
    try {
      if (format === "pdf") {
        exporterFacturePDF(vente);
      } else {
        await exporterFacturePNG(vente);
      }

      setAlert({
        open: true,
        variant: "success",
        title: "Export réussi",
        message: `La facture ${vente.vte_code} a été exportée en ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error("Erreur export facture :", error);

      setAlert({
        open: true,
        variant: "error",
        title: "Erreur d'export",
        message: "Impossible de générer la facture.",
      });
    }
  };

  useEffect(() => {
    fetchPaye("PAYE_CLIENT");
    fetchModePaye("MODE_PAY");
  }, []);
  return (
    <div className="p-6">
      <ListeVentes
        ventes={ventes}
        loading={loading}
        error={error}

        page={page}
        totalPages={totalPages}
        totalCount={totalCount}

        onModifier={handleModifier}
        onValidate={handleValidate}
        onExportFacture={handleExporterFacture}
        onPaye={handlePaye}
        onFiltrer={(filters: Omit<VenteParams, "page">) => {
          rechercher(filters);
        }}

        onPageChange={setPage}

        onRefresh={refresh}
      />
      <Alert
        open={alert.open}
        variant={alert.variant}
        title={alert.title}
        message={alert.message}
        showLink={false}
        onClose={() =>
          setAlert({
            open: false,
            variant: alert.variant,
            message: alert.message,
            title: alert.title,
          })
        }
      />
      <Modal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        className="max-w-2xl"
      >
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Ticket de caisse
              </h2>
              <p className="text-sm text-gray-500">
                Paiement effectué avec succès.
              </p>
            </div>

            <button
              onClick={() => setTicketModalOpen(false)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          {ticketUrl && (
            <iframe
              src={ticketUrl}
              title="Ticket de paiement"
              className="h-[65vh] w-full rounded-lg border border-gray-200"
            />
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setTicketModalOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
            >
              Fermer
            </button>

            <button
              onClick={() => {
                if (!ticketBlob) return;

                const url = URL.createObjectURL(ticketBlob);
                const link = document.createElement("a");

                link.href = url;
                link.download = "Ticket_paiement.pdf";
                link.click();

                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Download size={16} />
              Télécharger le ticket
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
