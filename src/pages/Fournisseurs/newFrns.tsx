import { Modal } from "../../components/ui/modal";
import { useState, useEffect } from "react";
import { postData } from "../../services/sendDataService";
import { useForm } from "../../hooks/useForm";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import PhoneInput from "react-phone-number-input";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import { Option } from "../../components/form/Select";
import Alert from "../../components/ui/alert/Alert";
import { apiFetch } from "../../services/api";
import { Enumeration } from "../../interfaces/interfaces";

interface newFrnsProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const NewFrns: React.FC<newFrnsProps> = ({ isOpen, onClose, className }) => {
  const [onSubmitClick, setOnSubmutCliked] = useState(0);
  const { values, handleChange, setField, reset } = useForm({
    code: "",
    denomination: "",
    contact1: undefined as string | undefined,
    contact2: undefined as string | undefined,
    adresse: "",
    email: "",
    commercial: "",
    paiement: "",
  });
  const [alert, setAlert] = useState({
    open: false,
    variant: "success" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
  });

  const [enumeration, setEnumeration] = useState<Enumeration[]>([]);
  const EnumerationOptions: EnumerationOption[] = enumeration.map(
    (item: Enumeration) => ({
      ...item,
      value: item.enu_id.toString(),
      label: item.enu_nom,
    }),
  );

  const isFormEmpty = (
    data: Record<string, unknown>,
    ignoredFields: string[] = [],
  ): boolean => {
    return Object.entries(data)
      .filter(([key]) => !ignoredFields.includes(key))
      .every(
        ([, value]) => value === "" || value === null || value === undefined,
      );
  };

  const [sendError, setSendError] = useState<string | null>(null);

  const fetchEnumeration = async (enu_code: string) => {
    try {
      const query = new URLSearchParams();
      query.set("enu_code", enu_code);
      const res = await apiFetch(
        `/api/generate-enumeration/?${query.toString()}`,
      );

      if (res.success) {
        setEnumeration(res.nom_enumeration);
      }
    } catch (error: any) {
      console.log(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnSubmutCliked(onSubmitClick + 1);
    try {
      if (
        !values.denomination &&
        isFormEmpty(values, ["code", "denomination"])
      ) {
        setAlert({
          open: true,
          variant: "error",
          title: `Une erreur est survenue`,
          message: "Le champs denomination doit être au moins remplis",
        });
        return;
      }
      if (!values.paiement) {
        values.paiement = "1";
      }
      const res = await postData("/api/insert-database/", "t_fournis", {
        fou_code: values.code,
        fou_nom: values.denomination,
        fou_tel1: values.contact1,
        fou_tel2: values.contact2,
        fou_mail: values.email,
        fou_adresse: values.adresse,
        fou_modepay: values.paiement,
        fou_commercial: values.commercial,
      });
      if (res.status) {
        setAlert({
          open: true,
          variant: "success",
          title: `Notification`,
          message: `Fournisseur ${values.denomination} enrigistrer avec succès`,
        });
        clear();
      } else {
        setAlert({
          open: true,
          variant: "error",
          title: `Une erreur est survenue`,
          message: `${res.message}`,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCode = async (table_name: string, isInsert: boolean) => {
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

  const clear = () => {
    reset();
    fetchCode("t_fournis", false);
  };

  useEffect(() => {
    fetchCode("t_fournis", false);
    fetchEnumeration("MODE_PAY");
  }, [isOpen]);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Ajouter un nouveau fournisseur
            </h4>
          </div>
          <form className="flex flex-col" onSubmit={handleSubmit}>
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div>
                    <Label>Code</Label>
                    <Input name="code" value={values.code} disabled />
                  </div>
                  <div>
                    <Label>Dénomination</Label>
                    <Input
                      name="denomination"
                      value={values.denomination}
                      type="text"
                      onChange={handleChange}
                      placeholder="Nom du fournisseur"
                    />
                  </div>
                  <div className="insert-num-client">
                    <div>
                      <Label>Contact 1</Label>
                      <PhoneInput
                        international
                        defaultCountry="MG"
                        value={values.contact1}
                        onChange={(value) => setField("contact1", value)}
                        className="rounded-lg dark:text-gray-300 border border-gray-300 dark:border-gray-700 px-3 py-2"
                      />
                    </div>
                    <div>
                      <Label>Contact 2</Label>
                      <PhoneInput
                        international
                        defaultCountry="MG"
                        value={values.contact2}
                        onChange={(value) => setField("contact2", value)}
                        className="rounded-lg  dark:text-gray-300 border border-gray-300 dark:border-gray-700 px-3 py-2"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Adresse</Label>
                    <Input
                      name="adresse"
                      value={values.adresse}
                      onChange={handleChange}
                      placeholder="Adresse du fournisseur"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-7">
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email</Label>
                    <Input
                      name="email"
                      value={values.email}
                      onChange={handleChange}
                      placeholder="fournisseur@gmail.com"
                    />
                  </div>

                  <div className="lg:col-span-1">
                    <Label>Paiment</Label>
                    <Select
                      options={EnumerationOptions}
                      onChange={(value) => setField("paiement", value)}
                      defaultValue="1"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center items-center gap-3 px-2 mt-6 lg:justify-between">
              <span className="text-red-600">{sendError}</span>
              <div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mr-5"
                  onClick={clear}
                >
                  Effacer tout
                </Button>
                <Button size="sm" type="submit">
                  Sauvegarder
                </Button>
              </div>
            </div>
          </form>
        </div>
        <Alert
          open={alert.open}
          variant={alert.variant}
          title={alert.title}
          message={alert.message}
          showLink={false}
          onClose={() =>
            setAlert({
              open: false,
              variant: alert.variant,
              message: alert.message,
              title: alert.title,
            })
          }
        />
      </Modal>
    </>
  );
};

export default NewFrns;
