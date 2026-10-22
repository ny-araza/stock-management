import Entry from "./modal/newEntry";
import { useState } from "react";
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
  faFileAlt,
  faTruckArrowRight,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import AnimatedButton from "./animeButton";
import NewRetourFrns from "./modal/newRetourFrns";
import NewRetourClient from "./modal/newRetourClient";
import { useAuth } from "../../services/authLogin";
import { Authorization } from "../../services/authLogin";
import NewClts from "../Clients/newClts";
import NewFrns from "../Fournisseurs/newFrns";
import { Link } from "react-router";

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
  | "proforma"
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
  frns: 102,
  proforma: 108,
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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-5 md:gap-6"></div>
    </>
  );
}
