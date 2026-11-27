import React from "react";
import Button from "../../components/ui/button/Button";
import { Client, Proforma, ProLigneArticle } from "../../interfaces/interfaces";
import { generateProformaPdf } from "./generatePdf";
import { useEntreprise } from "../../hooks/useEntreprise";

interface ProformaPdfButtonProps {
  form: Proforma;
  client: Client;
  ligneArticle: ProLigneArticle[];
  fileName?: string;
  label?: string;
  size?: "sm" | "md";
  variant?: "primary" | "outline";
  disabled?: boolean;
  className?: string;
  onGenerated?: () => void;
  onError?: (error: unknown) => void;
}

const ProformaPdfButton: React.FC<ProformaPdfButtonProps> = ({
  form,
  client,
  ligneArticle,
  fileName,
  label = "Télécharger PDF",
  size = "sm",
  variant = "outline",
  disabled = false,
  className,
  onGenerated,
  onError,
}) => {
  const { entreprise, loading, error } = useEntreprise();

  const handleClick = () => {
    try {
      if (!entreprise) {
        throw new Error(
          error || "Les informations de l'entreprise sont indisponibles.",
        );
      }

      generateProformaPdf({
        form,
        client,
        ligneArticle,
        company: {
          nom: entreprise.etp_nom,
          adresse: [
            entreprise.etp_adresse,
            entreprise.etp_quartier,
            entreprise.etp_ville,
          ]
            .filter(Boolean)
            .join(", "),
          tel: entreprise.etp_mobile || entreprise.etp_fixe || "",
          email: entreprise.etp_mail || "",
        },
        fileName,
      });

      onGenerated?.();
    } catch (error) {
      console.error("Erreur génération PDF proforma :", error);
      onError?.(error);
    }
  };

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      disabled={disabled || !form || !client || loading || !entreprise}
      onClick={handleClick}
      className={className}
    >
      {loading ? "Chargement..." : label}
    </Button>
  );
};

export default ProformaPdfButton;
