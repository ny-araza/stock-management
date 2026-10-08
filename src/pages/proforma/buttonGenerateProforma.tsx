import React from "react";
import Button from "../../components/ui/button/Button"; // adapte le chemin
import { Client, Proforma, ProLigneArticle } from "../../interfaces/interfaces";
import { CompanyInfo, generateProformaPdf } from "./generatePdf";

interface ProformaPdfButtonProps {
  form: Proforma;
  client: Client;
  ligneArticle: ProLigneArticle[];
  company?: CompanyInfo;
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
  company,
  fileName,
  label = "Télécharger PDF",
  size = "sm",
  variant = "outline",
  disabled = false,
  className,
  onGenerated,
  onError,
}) => {
  const handleClick = () => {
    try {
      generateProformaPdf({ form, client, ligneArticle, company, fileName });
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
      disabled={disabled || !form || !client}
      onClick={handleClick}
      className={className}
    >
      {label}
    </Button>
  );
};

export default ProformaPdfButton;
