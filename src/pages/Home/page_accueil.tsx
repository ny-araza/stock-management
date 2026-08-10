import { BoxIconLine } from "../../icons";
import Button from "../../components/ui/button/Button";
import Entry from "./modal/newEntry";
import { useState } from "react";
import NewCommandFrns from "./modal/newCommandFrns";
import Sortit from "./modal/newSortit";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox,
  faBoxArchive,
  faCaravan,
  faCartArrowDown,
  faCartShopping,
} from "@fortawesome/free-solid-svg-icons";
import AnimatedButton from "./animeButton";
import NewLivFrns from "./modal/newLivFrns";
import NewVente from "./modal/newVente";

type ModalType =
  | "entry"
  | "commandeFournisseur"
  | "commandeClient"
  | "livraison"
  | "depense"
  | "sortit"
  | "vente"
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
        <AnimatedButton
          onClick={() => open("entry")}
          icon={<FontAwesomeIcon icon={faBox} className="text-6xl" />}
        >
          Entrée en stock
        </AnimatedButton>
        <Entry
          isOpen={openModal == "entry"}
          onClose={close}
          className="max-w-[700px] m-4"
        ></Entry>
        <AnimatedButton
          onClick={() => open("sortit")}
          icon={<FontAwesomeIcon icon={faBoxArchive} className="text-6xl" />}
        >
          Sortit en stock
        </AnimatedButton>
        <Sortit
          isOpen={openModal == "sortit"}
          onClose={close}
          className="max-w-[700px] m-4"
        />
        <AnimatedButton
          onClick={() => open("commandeFournisseur")}
          icon={<FontAwesomeIcon icon={faCaravan} className="text-6xl" />}
        >
          Nouvelle commande fournisseurs
        </AnimatedButton>
        <NewCommandFrns
          isOpen={openModal == "commandeFournisseur"}
          onClose={close}
          className="max-w-[700px] m-4"
        ></NewCommandFrns>
        <AnimatedButton
          onClick={() => open("livraison")}
          icon={<FontAwesomeIcon icon={faCartArrowDown} className="text-6xl" />}
        >
          Nouvelle livraison fournisseur
        </AnimatedButton>
        <NewLivFrns
          isOpen={openModal == "livraison"}
          onClose={close}
          className="max-w-[900px] m-4"
        />
        <AnimatedButton
          onClick={() => open("vente")}
          icon={<FontAwesomeIcon icon={faCartShopping} className="text-6xl" />}
        >
          Nouvelle vente
        </AnimatedButton>
        <NewVente
          isOpen={openModal == "vente"}
          onClose={close}
          className="max-w-[900px] m-4"
        />
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
