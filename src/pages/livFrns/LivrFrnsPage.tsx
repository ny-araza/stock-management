import { useState } from "react";
import { useAuth } from "../../services/authLogin";
import { useNavigate } from "react-router";
import { Entree } from "../../services/livFrnsService";
import { entreeService, EntreeParams } from "../../services/livFrnsService";
import { useLivFrns } from "../../hooks/useLivFrns";
import ListeLivFrns from "./listeLivFrns";
import Alert from "../../components/ui/alert/Alert";

export default function LivEntreePages() {
  const [alert, setAlert] = useState({
    open: false,
    variant: "success" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
  });

  const {
    entrees,
    error,
    loading,
    page,
    setPage,
    totalPages,
    totalCount,
    rechercher,
    refresh,
  } = useLivFrns();

  const { authorisation, user } = useAuth();
  const navigate = useNavigate();

  // ===============================
  // MODIFIER UNE ENTRÉE
  // ===============================
  const handleModifier = (entree: Entree) => {
    // Empêcher la modification d'une entrée déjà payée
    if (entree.ent_is_paye) {
      setAlert({
        open: true,
        variant: "warning",
        title: "Attention",
        message: "Cette entrée fournisseur a déjà été payée.",
      });
      return;
    }

    navigate(`/new-entry/${entree.ent_id}/modifier`);
  };

  // ===============================
  // MARQUER UNE ENTRÉE COMME PAYÉE
  // ===============================
  const handlePaye = async (entree: Entree) => {
    if (entree.ent_is_paye) {
      setAlert({
        open: true,
        variant: "warning",
        title: "Attention",
        message: "Cette entrée fournisseur a déjà été payée.",
      });
      return;
    }

    const autorise = authorisation?.some(
      (elt) => elt.aut_men_code == 110 && elt.aut_acces === 1,
    );

    if (!autorise) {
      setAlert({
        open: true,
        variant: "warning",
        title: "Attention",
        message: "Vous n'êtes pas autorisé à payer cette entrée.",
      });
      return;
    }

    try {
      await entreeService.modifierEntree(entree.ent_id, {
        ent_datepay: new Date().toISOString().split("T")[0],
        ent_usermdf: user?.use_login || "",
        ent_is_paye: true,
      });

      await refresh();

      setAlert({
        open: true,
        variant: "success",
        title: "Paiement effectué",
        message: "L'entrée fournisseur a été marquée comme payée.",
      });
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
  // FILTRAGE
  // ===============================
  const handleFiltrer = (filters: Omit<EntreeParams, "page">) => {
    rechercher(filters);
  };

  return (
    <div className="p-6">
      <ListeLivFrns
        entrees={entrees}
        loading={loading}
        error={error}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onModifier={handleModifier}
        onPaye={handlePaye}
        onFiltrer={handleFiltrer}
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
    </div>
  );
}
