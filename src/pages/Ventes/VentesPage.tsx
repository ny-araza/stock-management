import { useVentes } from "../../hooks/useVentes";
import ListeVentes from "./listVente";
import { ListeVente, VenteParams } from "../../services/ventesService";
import { useNavigate } from "react-router";
import { useState } from "react";
import { useAuth } from "../../services/authLogin";
import autoTable from "jspdf-autotable";

export default function VentesPage() {
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
    console.log("Vente à modifier :", vente);

    // Empêcher la modification d'une vente déjà validée
    if (vente.vte_valide === 1) {
      toast.error(
        "Cette vente est déjà validée et ne peut plus être modifiée.",
      );
      return;
    }

    navigate(`/new-vente/${vente.vte_id}/modifier`);
  };

  const handleValidate = (vente: ListeVente) => {
    if (vente.vte_valide === 1) {
      alert("Vente deja valider");
      return;
    }
    const validateAutorisation = authorisation?.filter((elt) => {
      return elt.aut_men_code == 110 && elt.aut_acces === 1;
    });
    if (!validateAutorisation) return;
    console.log(`Vente a valider : ${vente}`);
    refresh();
  };
  const handlePaye = (vente: ListeVente) => {
    if (vente.vte_valide != 1) {
      console.log("Veuillez valider dabord")
    }
    const validateAutorisation = authorisation?.filter((elt) => {
      return elt.aut_men_code == 110 && elt.aut_acces === 1;
    });
    if (!validateAutorisation) return;
    console.log("Vente payer")
    refresh()
  }

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
    </div>
  );
}
