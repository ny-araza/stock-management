import { useState } from "react";
import { useVentes } from "../../hooks/useVentes";
import ListeVentes from "./listVente";
import { ListeVente, VenteParams } from "../../services/ventesService";
import { useNavigate } from "react-router";
import { useAuth } from "../../services/authLogin";
import updateVente from "../../services/updateVente";
import Alert from "../../components/ui/alert/Alert";

export default function VentesPage() {
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
  const handlePaye = (vente: ListeVente) => {
    if (vente.vte_valide != 1) {
      setAlert({
        open: true,
        variant: "warning",
        title: "Attention",
        message: "Veuillez d'abord valider cette vente.",
      });
    }
    const validateAutorisation = authorisation?.filter((elt) => {
      return elt.aut_men_code == 110 && elt.aut_acces === 1;
    });
    if (!validateAutorisation) {
      setAlert({
        open: true,
        variant: "warning",
        title: "Attention",
        message: "Vous n'êtes pas autorisés à valider cette vente",
      });
      return;
    }
    refresh();
  };

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
    </div>
  );
}
