import Entry from "./modal/newEntry";
import { useState } from "react";
import NewCommandFrns from "./modal/newCommandFrns";
import Sortit from "./modal/newSortit";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightToBracket,
  faBox,
  faBoxArchive,
  faCaravan,
  faCartArrowDown,
  faCartShopping,
  faFileAlt,
  faTruckArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import AnimatedButton from "./animeButton";
import NewLivFrns from "./modal/newLivFrns";
import NewVente from "./modal/newVente";
import NewRetourFrns from "./modal/newRetourFrns";
import NewRetourClient from "./modal/newRetourClient";

type ModalType =
  | "entry"
  | "commandeFournisseur"
  | "commandeClient"
  | "livraison"
  | "depense"
  | "sortit"
  | "vente"
  | "rtc"
  | "rtf"
  | "facture_comptant"
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
          className="max-w-[900px] m-4"
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
          className="max-w-[900px] m-4"
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
          className="max-w-[900px] m-4"
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
          Nouvelle commande client
        </AnimatedButton>
        <NewVente
          isOpen={openModal == "vente"}
          onClose={close}
          className="max-w-[900px] m-4"
        />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-5 md:gap-6">
        {/* <!-- Metric Item Start --> */}
        <AnimatedButton
          onClick={() => open("rtf")}
          icon={
            <FontAwesomeIcon icon={faTruckArrowRight} className="text-6xl" />
          }
        >
          Retour fournisseur
        </AnimatedButton>
        <NewRetourFrns
          isOpen={openModal == "rtf"}
          onClose={close}
          className="max-w-[900px] m-4"
        />
        <AnimatedButton
          onClick={() => open("rtc")}
          icon={
            <FontAwesomeIcon
              icon={faArrowRightToBracket}
              className="text-6xl"
            />
          }
        >
          Retour client
        </AnimatedButton>
        <NewRetourClient
          isOpen={openModal == "rtc"}
          onClose={close}
          className="max-w-[900px] m-4"
        />
        <AnimatedButton
          onClick={() => open("facture_comptant")}
          icon={<FontAwesomeIcon icon={faFileAlt} className="text-6xl" />}
        >
          Facture
        </AnimatedButton>
        <NewRetourClient
          isOpen={openModal == "facture_comptant"}
          onClose={close}
          className="max-w-[900px] m-4"
        />
      </div>
    </>
  );
}
