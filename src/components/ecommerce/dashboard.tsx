import {
  BoxIconLine,
} from "../../icons";
import Button from "../ui/button/Button";

export default function EcommerceMetrics() {

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-5 md:gap-6">
      {/* <!-- Metric Item Start --> */}
      <Button
        size="sm"
        variant="outline"
        startIcon={<BoxIconLine className="size-5" />}
      >
        Nouvelle entrée
      </Button>
      <Button
        size="sm"
        variant="outline"
        startIcon={<BoxIconLine className="size-5" />}
      >
        Nouvelle commande fournisseurs
      </Button>
      <Button className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        Nouvelle commande fournisseurs
      </Button>
      <Button className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        Nouvelle Livraison fournisseurs
      </Button>
      <Button className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        Nouvelle dépense
      </Button>
    </div>
  );
}
