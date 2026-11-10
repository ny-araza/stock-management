import { useState } from "react";
import { useAuth } from "../../services/authLogin";
import { useNavigate } from "react-router";
import { BCAutoComplete } from "../../interfaces/interfaces";
import updateCF from "../../services/updateCF";
import { useCF } from "../../hooks/useCF";
import ListeBC from "./listeCF";
import { BCAutoParams } from "../../services/cfService";
import Alert from "../../components/ui/alert/Alert";

export default function CFPages() {
  const [alert, setAlert] = useState({
    open: false,
    variant: "success" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
  });
  const {
    commandes,
    error,
    loading,
    page,
    setPage,
    totalPages,
    totalCount,
    rechercher,
    refresh,
  } = useCF();
  const { authorisation, user } = useAuth();
  const navigate = useNavigate();

  const handleModifier = (cf: BCAutoComplete) => {
    // Empêcher la modification d'une cf déjà validée
    if (cf.cmf_islivre) {
      setAlert({
        open: true,
        variant: "warning",
        title: "Attention",
        message: "Commande fournisseur deja livré.",
      });
      return;
    }

    navigate(`/new-cmd_fournis/${cf.cmf_id}/modifier`);
  };

  const handleLivrer = (vente: BCAutoComplete) => {
    if (vente.cmf_islivre === true) {
      setAlert({
        open: true,
        variant: "warning",
        title: "Attention",
        message: "Commande deja validé.",
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
        message: "Vous n'êtes pas autorisé a modifier cette commande",
      });
    }
    updateCF(vente.cmf_id, {
      cmf_is_paye: false,
      cmf_is_livre: true,
      cmf_usermdf: user?.use_login ? user.use_login : "",
    });
    refresh();
  };

  const handlePaye = async (cf: BCAutoComplete) => {
    // Vérifier la validation
    console.log(cf.cmf_modecmd);

    if (!cf.cmf_islivre) {
      setAlert({
        open: true,
        variant: "warning",
        title: "Attention",
        message:
          "La commande doit d'abord etre livrer avant de pouvoir la payer",
      });
      return;
    }
    // Vérifier si la cf est déjà payée
    if (cf.cmf_is_paye == true) {
      setAlert({
        open: true,
        variant: "warning",
        title: "Attention",
        message: "Cette commande a déjà été payée.",
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
        message: "Vous n'êtes pas autorisés à payer cette commande",
      });
      return;
    }

    try {
      // Effectuer le paiement
      await updateCF(cf.cmf_id, {
        cmf_is_paye: true,
        cmf_is_livre: true,
        cmf_usermdf: user?.use_login || "",
      });
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
  return (
    <div className="p-6">
      <ListeBC
        commandes={commandes}
        loading={loading}
        error={error}

        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onModifier={handleModifier}
        onPaye={handlePaye}
        onLivrer={handleLivrer}
        onFiltrer={(filters: Omit<BCAutoParams, "page">) => {
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
