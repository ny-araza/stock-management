import { useState } from "react";
import { useClient } from "../../hooks/useClient";
import { Client } from "../../interfaces/interfaces";
import ListeClient from "./listeClient";

export default function ClientPage() {
  const { clients, refresh } = useClient();

  const handleModifier = (client: Client) => {
    console.log("Client à modifier :", client);

    // Ouvrir ton formulaire de modification
    // Exemple :
    // navigate(`/clients/${client.cli_id}/modifier`);
  };

  return (
    <div className="p-6">
      <ListeClient onModifier={handleModifier} onRefresh={refresh} />
    </div>
  );
}
