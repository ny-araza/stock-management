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

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("REÇU DE PAIEMENT", pageWidth / 2, y, {
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
