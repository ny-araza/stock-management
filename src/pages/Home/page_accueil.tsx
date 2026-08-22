import Entry from "./modal/newEntry";
import { useState } from "react";
import NewCommandFrns from "./modal/newCommandFrns";
import Sortit from "./modal/newSortit";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightToBracket,
  faBox,
  faBoxArchive,
  faBuilding,
  faCaravan,
  faCartArrowDown,
  faCartShopping,
  faTruckArrowRight,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import AnimatedButton from "./animeButton";
import NewLivFrns from "./modal/newLivFrns";
import NewVente from "./modal/newVente";
import NewRetourFrns from "./modal/newRetourFrns";
import NewRetourClient from "./modal/newRetourClient";
import { useAuth } from "../../services/authLogin";
import { Authorization } from "../../services/authLogin";
import NewClts from "../Clients/newClts";
import NewFrns from "../Fournisseurs/newFrns";

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
  | "client"
  | "frns"
  | null;

// Codes de menu associés à chaque bouton.
// Tout bouton dont le ModalType n'apparaît PAS ici est automatiquement
// indisponible, faute de permission vérifiable.
const MENU_CODES: Partial<Record<Exclude<ModalType, null>, number>> = {
  entry: 107,
  commandeFournisseur: 103,
  livraison: 104,
  sortit: 107,
  vente: 109,
  rtc: 104,
  rtf: 103,
  client: 101,
  frns: 102
};

export default function PageAccueil() {
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const { authorisation } = useAuth();

  const open = (modal: ModalType) => {
    setOpenModal(modal);
  };

  const close = () => {
    setOpenModal(null);
  };

  const hasAccess = (modal: Exclude<ModalType, null>) => {
    const menuCode = MENU_CODES[modal];
    if (menuCode === undefined) return false; // pas de code -> pas d'accès possible
    return authorisation?.some(
      (auth: Authorization) =>
        auth.aut_men_code === menuCode && auth.aut_acces === 1,
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-5 md:gap-6">
        {hasAccess("entry") && (
          <>
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
          </>
        )}
        {hasAccess("sortit") && (
          <>
            <AnimatedButton
              onClick={() => open("sortit")}
              icon={
                <FontAwesomeIcon icon={faBoxArchive} className="text-6xl" />
              }
            >
              Sortit en stock
            </AnimatedButton>
            <Sortit
              isOpen={openModal == "sortit"}
              onClose={close}
              className="max-w-[900px] m-4"
            />
          </>
        )}
        {hasAccess("client") && (
          <>
            <AnimatedButton
              onClick={() => open("client")}
              icon={
                <FontAwesomeIcon icon={faUser} className="text-6xl" />
              }
            >
              Ajouter client
            </AnimatedButton>
            <NewClts
              isOpen={openModal == "client"}
              onClose={close}
              className="max-w-[900px] m-4"
            />
          </>
        )}
        {hasAccess("frns") && (
          <>
            <AnimatedButton
              onClick={() => open("frns")}
              icon={
                <FontAwesomeIcon icon={faBuilding} className="text-6xl" />
              }
            >
              Ajouter fournisseur
            </AnimatedButton>
            <NewFrns
              isOpen={openModal == "frns"}
              onClose={close}
              className="max-w-[900px] m-4"
            />
          </>
        )}
        {hasAccess("commandeFournisseur") && (
          <>
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
          </>
        )}
        {hasAccess("livraison") && (
          <>
            <AnimatedButton
              onClick={() => open("livraison")}
              icon={
                <FontAwesomeIcon icon={faCartArrowDown} className="text-6xl" />
              }
            >
              Nouvelle livraison fournisseur
            </AnimatedButton>
            <NewLivFrns
              isOpen={openModal == "livraison"}
              onClose={close}
              className="max-w-[900px] m-4"
            />
          </>
        )}
        {hasAccess("vente") && (
          <>
            <AnimatedButton
              onClick={() => open("vente")}
              icon={
                <FontAwesomeIcon icon={faCartShopping} className="text-6xl" />
              }
            >
              Nouvelle commande client
            </AnimatedButton>
            <NewVente
              isOpen={openModal == "vente"}
              onClose={close}
              className="max-w-[900px] m-4"
            />
          </>
        )}
        {/* <!-- Metric Item Start --> */}
        {hasAccess("rtf") && (
          <>
            <AnimatedButton
              onClick={() => open("rtf")}
              icon={
                <FontAwesomeIcon
                  icon={faTruckArrowRight}
                  className="text-6xl"
                />
              }
            >
              Retour fournisseur
            </AnimatedButton>
            <NewRetourFrns
              isOpen={openModal == "rtf"}
              onClose={close}
              className="max-w-[900px] m-4"
            />
          </>
        )}
        {hasAccess("rtc") && (
          <>
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
          </>
        )}
        {/* facture_comptant n'a pas de code de menu -> automatiquement indisponible */}
      </div>
    </>
  );
}
