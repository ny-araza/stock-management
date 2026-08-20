import { Modal } from "../../../../components/ui/modal";
import Button from "../../../../components/ui/button/Button";

interface ValidationChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetour: () => void;
  onGenererProforma: () => void;
  onGenererFacture: () => void;
  loading?: boolean;
}

const ValidationChoiceModal: React.FC<ValidationChoiceModalProps> = ({
  isOpen,
  onClose,
  onRetour,
  onGenererProforma,
  onGenererFacture,
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[420px]">
      <div className="p-6">
        <h4 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90 text-center">
          Commande enregistrée
        </h4>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400 text-center">
          Que souhaitez-vous faire maintenant ?
        </p>
        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            onClick={onGenererFacture}
            disabled={loading}
            className="w-full"
          >
            Générer la facture
          </Button>
          <Button
            variant="outline"
            onClick={onGenererProforma}
            disabled={loading}
            className="w-full"
          >
            Générer proforma
          </Button>
          <Button
            variant="outline"
            onClick={onRetour}
            disabled={loading}
            className="w-full"
          >
            Retour aux champs
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ValidationChoiceModal;
