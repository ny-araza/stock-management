import { Modal } from "../../components/ui/modal";
import Alert from "../../components/ui/alert/Alert";
import { useEffect, useState } from "react";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { EyeIcon, EyeCloseIcon } from "../../icons";
import Button from "../../components/ui/button/Button";
import { apiFetch } from "../../services/api";
import { useAuth } from "../../services/authLogin";

interface User {
  use_id: number;
  use_login: string;
  use_acc_code: string;
  use_enabled: boolean;
}

interface NewUserProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  userToEdit?: User | null;

  // Permet de mettre à jour la liste immédiatement
  onSuccess?: () => void;
}

const NewUser: React.FC<NewUserProps> = ({
  isOpen,
  onClose,
  className,
  userToEdit = null,
  onSuccess,
}) => {
  const [values, setValues] = useState({
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

  const isEditing = !!userToEdit;

  // Remplir le formulaire lors d'une modification
  useEffect(() => {
    if (isOpen) {
      if (userToEdit) {
        setValues({
          nom_user: userToEdit.use_login,
          // On ne récupère jamais le mot de passe existant
          mdp_user: "",
        });
      } else {
        setValues({
          nom_user: "",
          mdp_user: "",
        });
      }
    }
  }, [userToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const reset = () => {
    if (userToEdit) {
      setValues({
        nom_user: userToEdit.use_login,
        mdp_user: "",
      });
    } else {
      setValues({
        nom_user: "",
        mdp_user: "",
      });
    }
  };

  // Création
  const createUser = async () => {
    return await apiFetch("/api/user/create/", {
      method: "POST",
      body: JSON.stringify({
        use_login: values.nom_user,
        use_pwd: values.mdp_user,
        use_acc_code: "",
        use_enabled: 1,
      }),
    });
  };

  // Modification
  const updateUser = async () => {
    if (!userToEdit) return;

    const body: Record<string, unknown> = {
      use_login: values.nom_user,
    };
    // Modifier le mot de passe uniquement si un nouveau a été saisi
    if (values.mdp_user.trim()) {
      body.use_pwd = values.mdp_user;
    }

    return await apiFetch(`/api/user/update/${userToEdit.use_id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // En création, login + mot de passe sont obligatoires
      if (!isEditing && (!values.nom_user || !values.mdp_user)) {
        setAlert({
          open: true,
          variant: "warning",
          title: "Champs obligatoires",
          message: "Veuillez saisir un login et un mot de passe.",
        });
        return;
      }

      // En modification, seul le login est obligatoire
      if (isEditing && !values.nom_user.trim()) {
        setAlert({
          open: true,
          variant: "warning",
          title: "Login obligatoire",
          message: "Veuillez saisir un login.",
        });
        return;
      }

      const res = isEditing ? await updateUser() : await createUser();

      if (res?.status) {
        setAlert({
          open: true,
          message: isEditing
            ? "Utilisateur modifié avec succès"
            : "Nouvel utilisateur enregistré avec succès",
          title: "Opération réussie",
          variant: "success",
        });

        onSuccess?.();

        if (!isEditing) {
          reset();
        }
        reset()
      } else {
        setAlert({
          open: true,
          variant: "error",
          title: "Une erreur est survenue",
          message: res?.message || "Impossible d'effectuer l'opération.",
        });
      }
    } catch (error: any) {
      setAlert({
        open: true,
        variant: "error",
        title: "Une erreur est survenue",
        message:
          error.response?.data?.message ||
          error.response?.data?.detail ||
          error.message ||
          "Une erreur est survenue",
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
          <div className="flex justify-between px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {isEditing
                ? "Modifier l'utilisateur"
                : "Ajouter un nouvel utilisateur"}
            </h4>

            <span className="dark:text-white/90">
              {new Date().toLocaleDateString("fr-FR")}
            </span>
          </div>

          <form className="flex flex-col" onSubmit={handleSubmit}>
            <div className="custom-scrollbar h-full-[150px] overflow-y-auto px-2 pb-3">
              <div className="mb-2 grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                {/* LOGIN */}
                <div>
                  <Label>Login</Label>

                  <Input
                    name="nom_user"
                    type="text"
                    value={values.nom_user}
                    onChange={handleChange}
                    placeholder="Entrer le login"
                  />
                </div>

                {/* MOT DE PASSE */}
                <div>
                  <Label>
                    {isEditing
                      ? "Nouveau mot de passe (optionnel)"
                      : "Mot de passe"}
                  </Label>

                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={
                        isEditing
                          ? "Laisser vide pour ne pas modifier"
                          : "Entrer le mot de passe"
                      }
                      name="mdp_user"
                      id="password"
                      value={values.mdp_user}
                      onChange={handleChange}
                    />

                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2 flex justify-center gap-2">
                <Button type="submit">
                  {isEditing ? "Modifier" : "Valider"}
                </Button>

                <Button type="button" variant="outline" onClick={reset}>
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
            setAlert((prev) => ({
              ...prev,
              open: false,
            }))
          }
        />
      </Modal>
    </>
  );
};

export default NewUser;
