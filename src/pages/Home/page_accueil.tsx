import { BoxIconLine } from "../../icons";
import Button from "../../components/ui/button/Button";
import Entry from "./modal/newEntry";
import { useState } from "react";
import NewCommandFrns from "./modal/newCommandFrns";

type ModalType =
  | "entry"
  | "commandeFournisseur"
  | "commandeClient"
  | "livraison"
  | "depense"
  | null;

export default function PageAccueil() {
  const [openModal, setOpenModal] = useState<ModalType>(null);

  const open = (modal: ModalType) => {
    setOpenModal(modal);
  };

  const close = () => {
    setOpenModal(null);
  };

  return (
    <>
      <div className="grid grid-cols- gap-5 sm:grid-cols-5 md:gap-6">
        <Button
          size="md"
          variant="outline"
          className="h-60"
          onClick={() => open("entry")}
          startIcon={<BoxIconLine className="size-10" />}
        >
          Entrée en stock
        </Button>
        <Entry
          isOpen={openModal == "entry"}
          onClose={close}
          className="max-w-[700px] m-4"
        ></Entry>
        <Button
          size="sm"
          variant="outline"
          startIcon={<BoxIconLine className="size-10" />}
          onClick={() => open('commandeFournisseur')}
        >
          Ajout nouvelle commande fournisseurs
        </Button>
        <NewCommandFrns
          isOpen={openModal == "commandeFournisseur"}
          onClose={close}
          className="max-w-[700px] m-4"
        ></NewCommandFrns>
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
