import {
  BoxIconLine,
} from "../../icons";
import Button from "../ui/button/Button";
import { useModal } from "../../hooks/useModal";
import Entry from "../modal/newEntry";

export default function EcommerceMetrics() {

  const {isOpen, openModal, closeModal} = useModal()

  return (
    <>
      <div className="grid grid-cols- gap-5 sm:grid-cols-5 md:gap-6">
        {/* <!-- Metric Item Start --> */}
        <Button
          size="md"
          variant="outline"
          className="h-60"
          onClick={openModal}
          startIcon={<BoxIconLine className="size-10" />}
        >
          Entrée en stock
        </Button>
        <Entry isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4"></Entry>
        <Button
          size="sm"
          variant="outline"
          startIcon={<BoxIconLine className="size-10" />}
        >
          Nouvelle commande fournisseurs
        </Button>
        <Button
          size="sm"
          variant="outline"
          startIcon={<BoxIconLine className="size-10" />}
        >
          Nouvelle commande clients
        </Button>
        <Button
          size="sm"
          variant="outline"
          startIcon={<BoxIconLine className="size-10" />}
        >
          Nouvelle livraison fournisseurs
        </Button>
        <Button
          size="sm"
          variant="outline"
          startIcon={<BoxIconLine className="size-10" />}
        >
          Nouvelle dépense
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-5 md:gap-6">
        {/* <!-- Metric Item Start --> */}
        <Button
          size="md"
          variant="outline"
          className="md:h-60 sm:h-auto"
          startIcon={<BoxIconLine className="size-10" />}
        >
          Nouvelle entrée
        </Button>
        <Button
          size="sm"
          variant="outline"
          startIcon={<BoxIconLine className="size-10" />}
        >
          Nouvelle commande fournisseurs
        </Button>
        <Button
          size="sm"
          variant="outline"
          startIcon={<BoxIconLine className="size-10" />}
        >
          Nouvelle commande clients
        </Button>
        <Button
          size="sm"
          variant="outline"
          startIcon={<BoxIconLine className="size-10" />}
        >
          Nouvelle livraison fournisseurs
        </Button>
        <Button
          size="sm"
          variant="outline"
          startIcon={<BoxIconLine className="size-10" />}
        >
          Nouvelle dépense
        </Button>
      </div>
    </>
  );
}
