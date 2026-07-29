import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import { useForm } from "../../../hooks/useForm";
import Select from "../../../components/form/Select";

interface cmdFrns {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const NewCommandFrns: React.FC<cmdFrns> = ({ isOpen, onClose, className }) => {
  const { values, reset, setField, handleChange } = useForm({
    pieces: "",
    fournisseur: "",
    contact: "",
    adresse: "",
    mail: "",
    modeCmd: "",
    dateLiv: "",
    designation: "",
  });

  const fetchFrns = async (table_name: string, isInsert: boolean) => {
    try {
      const query = new URLSearchParams();
      query.set("table_name", table_name);
      query.set("is_insert", isInsert ? "1" : "0");
      console.log(query.toString());
      const res = await apiFetch(
        `/api/generate-date-code/?${query.toString()}`,
      );

      if (res.success) {
        setField("code", res.code);
      }
    } catch (error: any) {
      console.log(error);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} className={className}>
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14 flex justify-between">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Ajout commande fournisseurs
            </h4>
            <span className="text-white/90">
              {Date().split(" ")[2]}/{Date().split(" ")[1]}/
              {Date().split(" ")[3]}
            </span>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[600px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5">
                <div>
                  <Label>Piece N°</Label>
                  <Input
                    name="code"
                    disabled
                    type="text"
                    value={values.pieces}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>Piece N°</Label>
                  <Input
                    name="code"
                    disabled
                    type="text"
                    value={values.fournisseur}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
};

export default NewCommandFrns;
