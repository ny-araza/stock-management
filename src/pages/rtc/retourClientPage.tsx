import { useState } from "react";
import { useNavigate } from "react-router";
import { RtcLigneType, RtcType } from "../../interfaces/interfaces";
import { useAuth } from "../../services/authLogin";
import { useRetourClient } from "../../hooks/useRtc";
import ListeRetourClient from "./listeRetourClient";
import Alert from "../../components/ui/alert/Alert";

export default function RetourClientPages() {
  const [alert, setAlert] = useState({
    open: false,
    variant: "success" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
  });

  const {
    listeRetourClient,
    error,
    loading,
    page,
    setPage,
    totalPages,
    totalCount,
    rechercher,
    refresh,
  } = useRetourClient();

  const { authorisation } = useAuth();
  const navigate = useNavigate();

  // ======================================
  // MODIFICATION DU RETOUR CLIENT
  // ======================================

  const handleModifier = (retour: RtcType) => {
    const autorise = authorisation?.some(
      (elt) => elt.aut_men_code == 110 && elt.aut_acces === 1,
    );

    if (!autorise) {
      setAlert({
        open: true,
        variant: "warning",
        title: "Attention",
        message: "Vous n'êtes pas autorisé à modifier ce retour client.",
      });
      return;
    }

    navigate(`/new-retour-client/${retour.rtc_id}/modifier`);
  };

  // ======================================
  // RENDU
  // ======================================

  return (
    <div className="p-6">
      <ListeRetourClient
        listeRetourClient={listeRetourClient}
        loading={loading}
        error={error}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onModifier={handleModifier}
        onFiltrer={(filters) => {
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
