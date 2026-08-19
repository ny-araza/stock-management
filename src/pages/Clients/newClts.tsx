/* eslint-disable @typescript-eslint/no-explicit-any */
import { Modal } from "../../components/ui/modal";
import { useState } from "react";
import { useForm } from "../../hooks/useForm";
import { postData } from "../../services/sendDataService";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import PhoneInput from "react-phone-number-input";
import { CSSProperties } from "react";
import { Option } from "../../components/form/Select";
import { useEffect } from "react";
import { apiFetch } from "../../services/api";
import Alert from "../../components/ui/alert/Alert";

interface newCltProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const NewClts: React.FC<newCltProps> = ({ isOpen, onClose, className }) => {
  const [onSubmitClick, setOnSubmutCliked] = useState(0);
  const [sendError, setSendError] = useState<string | null>(null);
  const [typeCLient, setTypeClient] = useState<Option[]>([]);
  const [modepay, setModePay] = useState<Option[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState({
    open: false,
    variant: "success" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
  });
  const { values, handleChange, setField, reset } = useForm({
    code: "",
    denomination: "",
    contact1: undefined as string | undefined,
    contact2: undefined as string | undefined,
    adresse: "",
    email: "",
    nif: "",
    stat: "",
    rcs: "",
    type_client: "",
    paiement: "",
  });

  const typeOptions: Option[] = typeCLient.map((item: any) => ({
    ...item,
    value: item.enu_ud,
    label: item.enu_nom,
  }));

  const modePayOptions: Option[] = modepay.map((item: any) => ({
    ...item,
    value: item.enu_ud,
    label: item.enu_nom,
  }));

  const styleForm: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    width: "100%",
  };

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

  // get load enumeration (type client)
  const fetchTypeClient = async (enu_code: string) => {
    try {
      const query = new URLSearchParams();
      query.set("enu_code", enu_code);
      const res = await apiFetch(
        `/api/generate-enumeration/?${query.toString()}`,
      );

      if (res.success) {
        setTypeClient(res.nom_enumeration);
      }
    } catch (error: any) {
      setError(error.error);
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

  const fetchModePay = async (enu_code: string) => {
    try {
      const query = new URLSearchParams();
      query.set("enu_code", enu_code);
      const res = await apiFetch(
        `/api/generate-enumeration/?${query.toString()}`,
      );

      if (res.success) {
        setModePay(res.nom_enumeration);
      }
    } catch (error: any) {
      setError(error.error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnSubmutCliked(onSubmitClick + 1);
    try {
      if (
        !values.denomination
      ) {
        setAlert({
          open: true,
          variant: "error",
          title: `Une erreur est survenue`,
          message: "Le champs denomination doit être au moins remplis",
        });
        return;
      }
      const res = await postData("/api/insert-database/", "t_client", {
        cli_code: values.code,
        cli_nom: values.denomination,
        cli_tel1: values.contact1,
        cli_tel2: values.contact2,
        cli_email: values.email,
        cli_adresse: values.adresse,
        cli_modepay: values.paiement,
        cli_nif: values.nif,
        cli_stat: values.stat,
        cli_rcs: values.rcs,
        cli_type: values.type_client,
      });
      if (res.status) {
        fetchCode("t_client", true);
        setAlert({
          open: true,
          variant: "success",
          title: `Notification`,
          message: `Client ${values.denomination} enrigistrer avec succès`,
        });
        reset();
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

  const clear = () => {
    reset();
    fetchCode("t_client", false);
  };

  useEffect(() => {
    fetchCode("t_client", false);
    fetchTypeClient("TYPE_CLT");
    fetchModePay("MODE_PAY");
    setField("paiement", "1");
    setField("type_client", "85");
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[700px] m-4">
      <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Ajouter un nouveau client
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
                    placeholder="Nom du client"
                  />
                </div>
                <div style={styleForm} className="insert-num-client">
                  <div>
                    <Label>Contact 1</Label>
                    <PhoneInput
                      international
                      defaultCountry="MG"
                      value={values.contact1}
                      onChange={(value) => setField("contact1", value)}
                      className="rounded-lg border border-gray-300 dark:border-gray-700 dark:text-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <Label>Contact 2</Label>
                    <PhoneInput
                      international
                      defaultCountry="MG"
                      value={values.contact2}
                      onChange={(value) => setField("contact2", value)}
                      className="rounded-lg border border-gray-300 dark:border-gray-700 px-3  dark:text-gray-300 py-2"
                    />
                  </div>
                </div>
                <div>
                  <Label>Adresse</Label>
                  <Input
                    name="adresse"
                    value={values.adresse}
                    onChange={handleChange}
                    placeholder="Adresse du client"
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
                    placeholder="client@gmail.com"
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>NIF</Label>
                  <Input
                    name="nif"
                    value={values.nif}
                    onChange={handleChange}
                    placeholder="NF"
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>STAT</Label>
                  <Input
                    name="stat"
                    value={values.stat}
                    onChange={handleChange}
                    placeholder="STAT"
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>RCS</Label>
                  <Input
                    name="rcs"
                    value={values.rcs}
                    onChange={handleChange}
                    placeholder="RCS"
                  />
                </div>
                <div style={styleForm}>
                  <div className="col-span-2 w-full lg:col-span-1">
                    <Label>Type de client</Label>
                    <Select
                      options={typeOptions}
                      onChange={(value) => setField("type_client", value)}
                      defaultValue="29"
                    />
                  </div>
                  <div className="col-span-2 w-full lg:col-span-1">
                    <Label>Paiments</Label>
                    <Select
                      options={modePayOptions}
                      onChange={(value) => setField("paiement", value)}
                      defaultValue="29"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-between">
            <span className="text-red-600">{sendError}</span>
            <div className="flex justify-center w-full">
              <Button size="sm" type="submit" className="mr-2">
                Sauvegarder
              </Button>
              <Button
                size="sm"
                variant="outline"
                type="submit"
                className="ml-2"
                onClick={clear}
              >
                Tout effacer
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
  );
};

export default NewClts;
