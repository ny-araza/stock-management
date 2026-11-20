import { useFournisseur } from "../../hooks/useFournisseur";
import ListeFournisseur from "./listeFournisseur";

export default function FournisseurPage() {
  const {refresh} = useFournisseur()
  
  return (
    <div className="p-6">
      <ListeFournisseur onRefresh={refresh} />
    </div>
  );
}
