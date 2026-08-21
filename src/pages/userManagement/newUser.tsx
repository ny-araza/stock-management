/* eslint-disable @typescript-eslint/no-explicit-any */
import { Modal } from "../../components/ui/modal";
import Alert from "../../components/ui/alert/Alert";
import { useState } from "react";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { useForm } from "../../hooks/useForm";
import { EyeIcon, EyeCloseIcon } from "../../icons";
import Button from "../../components/ui/button/Button";
import { apiFetch } from "../../services/api";

interface newUserProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const NewUser: React.FC<newUserProps> = ({ isOpen, onClose, className }) => {
  const { values, reset, handleChange } = useForm({
    nom_user: "",
    mdp_user: "",
  });
  const [alert, setAlert] = useState({
    open: false,
    variant: "success" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const createUser = async (
    login: string,
    pwd: string,
    accCode: string,
    enabled: boolean,
  ) => {
    const res = await apiFetch("/api/user/create/", {
      method: "POST",
      body: JSON.stringify({
        use_login: login,
        use_pwd: pwd,
        use_acc_code: accCode,
        use_enabled: enabled ? 1 : 0,
      }),
    });
    return res;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (values.nom_user && values.mdp_user) {
        const res = await createUser(
          values.nom_user,
          values.mdp_user,
          "",
          true,
        );
        if (res.status) {
          setAlert({
            open: true,
            message: "Nouvelle utilisateur enregistrer avec succès",
            title: "Opération réussie",
            variant: "success",
          });
          reset();
        } else {
          setAlert({
            open: true,
            variant: "error",
            title: "Une erreur est survenue",
            message: `${res.message}`,
          });
        }
      }
    } catch (error: any) {
      setAlert({
        open: true,
        variant: "error",
        title: "Une erreur est survenue",
        message: `${error.error}`,
      });
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        className={className}
        showCloseButton={false}
      >
        <div className="no-scrollbar relative w-full max-w overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14 flex justify-between">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Ajouter nouvelle utilisateur
            </h4>
            <span className="dark:text-white/90">
              {Date().split(" ")[2]}/{Date().split(" ")[1]}/
              {Date().split(" ")[3]}
            </span>
          </div>
          <form className="flex flex-col" onSubmit={handleSubmit}>
            <div className="custom-scrollbar h-full-[150px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mb-2">
                <div>
                  <Label>Login</Label>
                  <Input
                    name="nom_user"
                    type="text"
                    value={values.nom_user}
                    onChange={handleChange}
                    placeholder="Entrer nouveau login"
                  />
                </div>
                <div>
                  <Label>Mot de passe</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Entrer nouveau mot de passe"
                      name="mdp_user"
                      id="password"
                      value={values.mdp_user}
                      onChange={handleChange}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-center mt-2">
                <Button type="submit">Valider</Button>
                <Button variant="outline" onClick={reset}>
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
    </>
  );
};

export default NewUser;
