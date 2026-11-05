/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import ListeVentes from "./listVente";

export interface VenteLigne {
  art_nom?: string;
  vtel_id: number;
  vtel_datecre: string;
  vtel_datemdf: string | null;
  vtel_usercre: string;
  vtel_usermdf: string | null;
  vtel_quantite: number;
  vtel_prixunit: number;
  vtel_ttc: number;
  vtel_art_code: string;
  vtel_pri_id: number;
  vtel_tva: number;
  vtel_ht: number;
  vtel_fou_code: string;
  vtel_lot_id: number;
  vtel_lot_code: string;
  vtel_lot_dateper: string;
  vtel_dateper: string | null;
  vtel_prix: string;
  vtel_cli_code: string;
  vtel_vte_code: string;
  vtel_remise: number;
  vtel_montant_tva?: number;
  vtel_montant_remise?: number;
  vtel_uid?: string;
  vtel_quantite_stock?: number;
  vtel_lot?: string;
}

export interface ListeVente {
  vte_id: number;
  vte_code: string;
  vte_datecre: string;
  vte_datemd: string;
  vte_usercre: string;
  vte_usermdf: string;
  vte_date: string;
  vte_modepaye: string;
  vte_montant_ht: string;
  vte_montant_ttc: string;
  vte_tva: number;
  vte_cli_code: string;
  vte_cli_nom: string;
  vte_cli_contact: string;
  vte_payeclient: string;
  vte_datepay: string;
  vte_telmoney: string;
  vte_valide: boolean;
  vte_paye: boolean;
  vte_datevalide: string;
  vte_livreur: string;
  vet_operateur: string;
  vte_lettremontant: string;
  ve_dateecheance: string;
  ve_code_bl: string;
  ve_adresse_liv: string;
  ve_remise: number;
  ve_proforma: string;
  lignes: VenteLigne[];
}

export default function VentesTable() {
  const [ventes, setVentes] = useState<ListeVente[]>([]);

  const [venteSelectionnee, setVenteSelectionnee] = useState<ListeVente | null>(
    null,
  );

  const modifierVente = (vente: ListeVente) => {
    setVenteSelectionnee(vente);

    // Ici tu peux ouvrir ton modal de modification
    console.log("Vente à modifier :", vente);
  };

  return (
    <>
      <div className="p-6">
        <ListeVentes ventes={ventes} onModifier={modifierVente} />

        {venteSelectionnee && (
          <div className="mt-4 rounded-lg border bg-white p-4">
            Vente sélectionnée : {venteSelectionnee.vte_code}
          </div>
        )}
      </div>
    </>
  );
}
