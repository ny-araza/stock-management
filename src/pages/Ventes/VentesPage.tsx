import { useVentes } from "../../hooks/useVentes";
import ListeVentes from "./listVente";
import { ListeVente, VenteParams } from "../../services/ventesService";

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

  const handleModifier = (vente: ListeVente) => {
    console.log("Vente à modifier :", vente);

    // Ouvrir ton modal de modification ici
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

        onFiltrer={(filters: Omit<VenteParams, "page">) => {
          rechercher(filters);
        }}

        onPageChange={setPage}

        onRefresh={refresh}
      />
    </div>
  );
}
