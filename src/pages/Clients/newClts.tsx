/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { Modal } from "../../components/ui/modal";
import { useForm } from "../../hooks/useForm";
import { postData } from "../../services/sendDataService";
import { apiFetch } from "../../services/api";
import { clientService } from "../../services/clientServices";

import { Client } from "../../interfaces/interfaces";

import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select, { Option } from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

import Alert from "../../components/ui/alert/Alert";

// =====================================
// PROPS
// =====================================

interface NewCltsProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  client?: Client | null;
  onSaved?: () => void;
}

// =====================================
// COMPOSANT
// =====================================

const NewClts: React.FC<NewCltsProps> = ({
  isOpen,
  onClose,
  className,
  client = null,
  onSaved,
}) => {
  const isModification = !!client;

  const [typeClient, setTypeClient] = useState<Option[]>([]);
  const [modePay, setModePay] = useState<Option[]>([]);
  const [saving, setSaving] = useState(false);

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

  // =====================================
  // OPTIONS
  // =====================================

  const typeOptions: Option[] = typeClient.map((item: any) => ({
    ...item,
    value: String(item.enu_id),
    label: item.enu_nom,
  }));

  const modePayOptions: Option[] = modePay.map((item: any) => ({
    ...item,
    value: String(item.enu_id),
    label: item.enu_nom,
  }));

  // =====================================
  // CHARGEMENT DES ÉNUMÉRATIONS
  // =====================================

  const fetchEnumeration = async (
    enuCode: string,
    setter: React.Dispatch<React.SetStateAction<Option[]>>,
  ) => {
    try {
      const query = new URLSearchParams();
      query.set("enu_code", enuCode);

      const response = await apiFetch(
        `/api/generate-enumeration/?${query.toString()}`,
      );

      if (response.success) {
        setter(response.nom_enumeration || []);
      }
    } catch (error) {
      console.error(`Erreur chargement énumération ${enuCode}:`, error);
    }
  };

  const getTypeClient = (cli_type: string) => {
    const item = typeOptions.find(
      (elt: any) => String(elt.enu_id) === String(cli_type),
    );

    return item?.label || cli_type || "-";
  };
  // =====================================
  // GÉNÉRATION DU CODE CLIENT
  // =====================================

  const fetchCode = async () => {
    try {
      const response = await apiFetch("/clients/next-code/");

      if (response.status) {
        setField("code", response.cli_code || "");
      }
    } catch (error) {
      console.error("Erreur génération code client :", error);
    }
  };

  // =====================================
  // PRÉREMPLISSAGE DU FORMULAIRE
  // =====================================

  const remplirFormulaire = (selectedClient: Client) => {
    console.log(getTypeClient(selectedClient.cli_type))
    console.log("newclient => ", selectedClient)
    setField("code", selectedClient.cli_code || "");
    setField("denomination", selectedClient.cli_nom || "");
    setField(
      "contact1",
      selectedClient.cli_tel1 ? String(selectedClient.cli_tel1) : undefined,
    );
    setField(
      "contact2",
      selectedClient.cli_tel2 ? String(selectedClient.cli_tel2) : undefined,
    );
    setField("adresse", selectedClient.cli_adresse || "");
    setField("email", selectedClient.cli_email || "");
    setField("nif", selectedClient.cli_nif || "");
    setField("stat", selectedClient.cli_stat || "");
    setField("rcs", selectedClient.cli_rcs || "");
    setField("type_client", String(selectedClient.cli_type ?? ""));
    setField("paiement", String(selectedClient.cli_modepay ?? ""));
  };

  // =====================================
  // INITIALISATION À L'OUVERTURE
  // =====================================

  useEffect(() => {
    if (!isOpen) return;

    fetchEnumeration("TYPE_CLT", setTypeClient);
    fetchEnumeration("MODE_PAY", setModePay);

    if (client) {
      // Mode modification
      remplirFormulaire(client);
    } else {
      // Mode création
      reset();

      setField("paiement", "1");
      setField("type_client", "85");

      fetchCode();
    }
  }, [isOpen]);

  // =====================================
  // RÉINITIALISATION
  // =====================================

  const clear = () => {
    if (client) {
      // En modification, restaurer les anciennes données
      remplirFormulaire(client);
    } else {
      // En création, vider le formulaire
      reset();

      setField("paiement", "1");
      setField("type_client", "85");

      fetchCode();
    }
  };

  // =====================================
  // DONNÉES À ENREGISTRER
  // =====================================

  const getClientData = () => ({
    cli_code: values.code,
    cli_nom: values.denomination.trim(),
    cli_tel1: values.contact1 || "",
    cli_tel2: values.contact2 || "",
    cli_email: values.email,
    cli_adresse: values.adresse,
    cli_modepay: values.paiement,
    cli_nif: values.nif,
    cli_stat: values.stat,
    cli_rcs: values.rcs,
    cli_type: values.type_client,
  });

  // =====================================
  // ENREGISTREMENT / MODIFICATION
  // =====================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!values.denomination.trim()) {
      setAlert({
        open: true,
        variant: "warning",
        title: "Champ obligatoire",
        message: "La dénomination du client doit être renseignée.",
      });
      return;
    }

    if (saving) return;

    setSaving(true);

    try {
      const donnees = getClientData();

      if (isModification && client) {
        // ---------------------------------
        // MODIFICATION
        // ---------------------------------

        await clientService.modifierClient(client.cli_id, {
          ...donnees,
          cli_usermdf: client.cli_usermdf || "",
        } as Partial<Client>);

        setAlert({
          open: true,
          variant: "success",
          title: "Modification réussie",
          message: `Le client ${values.denomination} a été modifié avec succès.`,
        });
      } else {
        // ---------------------------------
        // CRÉATION
        // ---------------------------------

        const response = await postData("/api/insert-database/", "t_client", {
          ...donnees,
          cli_enabled: 1,
        });

        if (!response.status) {
          throw new Error(
            response.message || "Erreur lors de l'enregistrement du client.",
          );
        }

        setAlert({
          open: true,
          variant: "success",
          title: "Enregistrement réussi",
          message: `Le client ${values.denomination} a été enregistré avec succès.`,
        });

        // Réinitialiser pour une nouvelle création
        reset();
        setField("paiement", "1");
        setField("type_client", "85");

        fetchCode();
      }

      // Actualiser la liste parente
      onSaved?.();
    } catch (error) {
      console.error("Erreur enregistrement client :", error);

      setAlert({
        open: true,
        variant: "error",
        title: "Une erreur est survenue",
        message:
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer le client.",
      });
    } finally {
      setSaving(false);
    }
  };

  // =====================================
  // STYLE
  // =====================================

  const styleForm: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    width: "100%",
  };

  // =====================================
  // RENDU
  // =====================================

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className={className || "max-w-[700px] m-4"}
    >
      <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        {/* HEADER */}
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {isModification
              ? "Modifier le client"
              : "Ajouter un nouveau client"}
          </h4>

          <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
            {isModification
              ? `Modification des informations du client ${client?.cli_code || ""}`
              : "Renseignez les informations du nouveau client."}
          </p>
        </div>

        {/* FORMULAIRE */}
        <form className="flex flex-col" onSubmit={handleSubmit}>
          <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
            {/* INFORMATIONS PRINCIPALES */}
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <div>
                <Label>Code</Label>
                <Input name="code" value={values.code} disabled />
              </div>

              <div>
                <Label>Dénomination *</Label>
                <Input
                  name="denomination"
                  value={values.denomination}
                  type="text"
                  onChange={handleChange}
                  placeholder="Nom du client"
                />
              </div>

              {/* CONTACTS */}
              <div style={styleForm} className="insert-num-client">
                <div>
                  <Label>Contact 1</Label>

                  <PhoneInput
                    international
                    defaultCountry="MG"
                    value={values.contact1}
                    onChange={(value) => setField("contact1", value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:text-gray-300"
                  />
                </div>

                <div className="mt-3">
                  <Label>Contact 2</Label>

                  <PhoneInput
                    international
                    defaultCountry="MG"
                    value={values.contact2}
                    onChange={(value) => setField("contact2", value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:text-gray-300"
                  />
                </div>
              </div>

              {/* ADRESSE */}
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

            {/* INFORMATIONS COMPLÉMENTAIRES */}
            <div className="mt-7">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>Email</Label>
                  <Input
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    placeholder="client@gmail.com"
                  />
                </div>

                <div>
                  <Label>NIF</Label>
                  <Input
                    name="nif"
                    value={values.nif}
                    onChange={handleChange}
                    placeholder="NIF"
                  />
                </div>

                <div>
                  <Label>STAT</Label>
                  <Input
                    name="stat"
                    value={values.stat}
                    onChange={handleChange}
                    placeholder="STAT"
                  />
                </div>

                <div>
                  <Label>RCS</Label>
                  <Input
                    name="rcs"
                    value={values.rcs}
                    onChange={handleChange}
                    placeholder="RCS"
                  />
                </div>

                {/* TYPE ET PAIEMENT */}
                <div style={styleForm}>
                  <Label>Type de client</Label>

                  <Select
                    key={"0"}
                    options={typeOptions}
                    onChange={(value) => setField("type_client", value)}
                    value={values.type_client}
                  />
                </div>

                <div style={styleForm}>
                  <Label>Mode de paiement</Label>

                  <Select
                    key={"1"}
                    options={modePayOptions}
                    onChange={(value) => setField("paiement", value)}
                    value={values.paiement}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-6 flex items-center gap-3 px-2 lg:justify-between">
            <div className="flex w-full justify-center">
              <Button
                size="sm"
                type="submit"
                className="mr-2"
                disabled={saving}
              >
                {saving
                  ? "Enregistrement..."
                  : isModification
                    ? "Enregistrer les modifications"
                    : "Sauvegarder"}
              </Button>

              <Button
                size="sm"
                variant="outline"
                type="button"
                className="ml-2"
                onClick={clear}
                disabled={saving}
              >
                {isModification ? "Annuler les changements" : "Tout effacer"}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* ALERT */}
      <Alert
        open={alert.open}
        variant={alert.variant}
        title={alert.title}
        message={alert.message}
        showLink={false}
        onClose={() =>
          setAlert((prev) => ({
            ...prev,
            open: false,
          }))
        }
      />
    </Modal>
  );
};

export default NewClts;
