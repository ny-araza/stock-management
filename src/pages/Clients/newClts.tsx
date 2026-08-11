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
import { generateReference } from "../../services/codeService";

interface newCltProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const NewClts: React.FC<newCltProps> = ({ isOpen, onClose, className }) => {
  const [onSubmitClick, setOnSubmutCliked] = useState(0);
  const [sendError, setSendError] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [typeCLient, setTypeClient] = useState<Option[]>([]);
  const [modepay, setModePay] = useState<Option[]>([]);
  const [error, setError] = useState<string | null>(null);
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

  const loadReference = async () => {
    try {
      const ref = await generateReference("t_client", "cli_code");
      setReference(ref);
    } catch (err) {
      console.error(err);
    }
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
        !values.denomination &&
        isFormEmpty(values, ["code", "denomination"])
      ) {
        setSendError("Veuiller au moins remplir le champs denomination");
        return;
      }
      const res = await postData("/api/insert-database/", "t_client", {
        cli_code: reference,
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
        alert("Client enregistré");
        reset();
      } else {
        setSendError(res.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadReference();
    fetchTypeClient("TYPE_CLT");
    fetchModePay("MODE_PAY");
  }, [isOpen, onSubmitClick]);

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
                  <div className="col-span-2 w-100">
                    <Label>Type de client</Label>
                    <Select
                      options={typeOptions}
                      onChange={(value) => setField("type_client", value)}
                      defaultValue="29"
                    />
                  </div>
                  <div className="col-span-2 w-100">
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
            <div>
              <Button size="sm" type="submit">
                Sauvegarder
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default NewClts;
