import { Modal } from "../../components/ui/modal";
import Alert from "../../components/ui/alert/Alert";
import { useEffect, useState } from "react";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { EyeIcon, EyeCloseIcon } from "../../icons";
import Button from "../../components/ui/button/Button";
import { apiFetch } from "../../services/api";
import { accessApi } from "../../services/accessApi";
import PermissionMatrix from "./permissionMatrix";
import { Menu } from "./typeUser";

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

// Même liste que ACC_CODES dans UserManagement (à importer si vous l'exportez)
const ACC_CODES = ["ADMIN", "CAISSE", "VENTE", "STOCK", "GROUPE-STOCK"];

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
    acc_code: "",
  });

  const [menus, setMenus] = useState<Menu[]>([]);
  const [perms, setPerms] = useState<Record<number, boolean>>({});
  const [loadingPerms, setLoadingPerms] = useState(false);

  const [alert, setAlert] = useState({
    open: false,
    variant: "success" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const isEditing = !!userToEdit;

  // Charge les droits enregistrés pour un code d'accès (rôle)
  const loadProfile = async (code: string) => {
    if (!code) {
      setPerms({});
      return;
    }
    try {
      const list = await accessApi.profile(code);
      setPerms(Object.fromEntries(list.map((p) => [p.men_code, p.acces])));
    } catch {
      setPerms({});
    }
  };

  // Remplir le formulaire + charger menus et droits à l'ouverture
  useEffect(() => {
    if (!isOpen) return;

    setValues({
      nom_user: userToEdit?.use_login ?? "",
      // On ne récupère jamais le mot de passe existant
      mdp_user: "",
      acc_code: userToEdit?.use_acc_code ?? "",
    });
    setPerms({});

    let cancelled = false;
    setLoadingPerms(true);
    Promise.all([
      accessApi.menus(),
      userToEdit?.use_acc_code
        ? accessApi.profile(userToEdit.use_acc_code)
        : Promise.resolve([]),
    ])
      .then(([m, p]) => {
        if (cancelled) return;
        setMenus(m);
        setPerms(Object.fromEntries(p.map((x) => [x.men_code, x.acces])));
      })
      .catch(() => {
        if (cancelled) return;
        setAlert({
          open: true,
          variant: "error",
          title: "Une erreur est survenue",
          message: "Impossible de charger la liste des menus.",
        });
      })
      .finally(() => !cancelled && setLoadingPerms(false));

    return () => {
      cancelled = true;
    };
  }, [userToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Changer de rôle affiche les droits déjà enregistrés pour ce rôle
  const handleAccCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setValues((prev) => ({ ...prev, acc_code: code }));
    loadProfile(code);
  };

  const reset = () => {
    const code = userToEdit?.use_acc_code ?? "";
    setValues({
      nom_user: userToEdit?.use_login ?? "",
      mdp_user: "",
      acc_code: code,
    });
    loadProfile(code);
  };

  // Création
  const createUser = async () => {
    return await apiFetch("/api/user/create/", {
      method: "POST",
      body: JSON.stringify({
        use_login: values.nom_user,
        use_pwd: values.mdp_user,
        use_acc_code: values.acc_code,
        use_enabled: 1,
      }),
    });
  };

  // Modification
  const updateUser = async () => {
    if (!userToEdit) return;

    const body: Record<string, unknown> = {
      use_login: values.nom_user,
      use_acc_code: values.acc_code,
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

      if (!values.acc_code) {
        setAlert({
          open: true,
          variant: "warning",
          title: "Code d'accès obligatoire",
          message: "Veuillez choisir un code d'accès (rôle).",
        });
        return;
      }

      const res = isEditing ? await updateUser() : await createUser();

      if (res?.status) {
        // Enregistre les autorisations du code d'accès (t_autorisation)
        let permsSaved = true;
        try {
          await accessApi.saveProfile(
            values.acc_code,
            menus.map((m) => ({
              men_code: m.men_code,
              acces: !!perms[m.men_code],
            })),
          );
        } catch {
          permsSaved = false;
        }

        setAlert(
          permsSaved
            ? {
                open: true,
                message: isEditing
                  ? "Utilisateur modifié avec succès"
                  : "Nouvel utilisateur enregistré avec succès",
                title: "Opération réussie",
                variant: "success",
              }
            : {
                open: true,
                variant: "warning",
                title: "Utilisateur enregistré",
                message:
                  "L'utilisateur est enregistré, mais ses autorisations n'ont pas pu être sauvegardées.",
              },
        );

        onSuccess?.();
        reset();
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

  // Si le rôle actuel n'est pas dans la liste, on le garde quand même sélectionnable
  const codeOptions =
    values.acc_code && !ACC_CODES.includes(values.acc_code)
      ? [values.acc_code, ...ACC_CODES]
      : ACC_CODES;

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
            <div className="custom-scrollbar max-h-[70vh] overflow-y-auto px-2 pb-3">
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

                {/* CODE D'ACCES (ROLE) */}
                <div className="lg:col-span-2">
                  <Label>Code d'accès (rôle)</Label>
                  <select
                    value={values.acc_code}
                    onChange={handleAccCodeChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="">Choisir un rôle...</option>
                    {codeOptions.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* AUTORISATIONS */}
              <div className="mt-6">
                <h5 className="mb-1 text-sm font-bold text-slate-900 dark:text-white">
                  Autorisations
                </h5>
                <p className="mb-4 text-xs text-slate-600 dark:text-slate-400">
                  Rattachées au code d'accès{" "}
                  <strong>{values.acc_code || "…"}</strong> : elles s'appliquent
                  à tous les utilisateurs qui partagent ce code.
                </p>

                {loadingPerms ? (
                  <div className="flex justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600 dark:border-slate-700 dark:border-t-brand-400" />
                  </div>
                ) : (
                  <PermissionMatrix
                    menus={menus}
                    value={perms}
                    onChange={(code, acces) =>
                      setPerms((p) => ({ ...p, [code]: acces }))
                    }
                    onToggleAll={(acces) =>
                      setPerms(
                        Object.fromEntries(
                          menus.map((m) => [m.men_code, acces]),
                        ),
                      )
                    }
                  />
                )}
              </div>

              <div className="mt-6 flex justify-center gap-2">
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
