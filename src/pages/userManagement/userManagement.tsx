import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../services/api";
import Button from "../../components/ui/button/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import NewUser from "./newUser";
import { useModal } from "../../hooks/useModal";

/**
 * Correspond à la table `use_*` (utilisateurs) :
 * use_Id, use_Login, use_pwd, use_acc_code, use_enabled,
 * use_DateCre, use_DateMdf, use_UserCre, use_UserMdf
 */
interface User {
  use_id: number;
  use_login: string;
  use_acc_code: string;
  use_enabled: boolean; // 1/0 côté backend
  use_datecre: string | null;
  use_datemdf: string | null;
  use_usercre: string | null;
  use_usermdf: string | null;
}

// Rôles disponibles pour use_acc_code — adapte à ta nomenclature réelle
const ACC_CODES = [
  "ADMIN",
  "CAISSE",
  "VENTE",
  "STOCK",
  "GROUPE-STOCK",
] as const;

const accCodeStyles: Record<string, string> = {
  ADMIN:
    "dark:bg-violet-500/15 bg-violet-500/10 dark:text-violet-300 text-violet-500 border-violet-500/30",
  CAISSE:
    "dark:bg-amber-500/15 bg-amber-500/10  dark:text-amber-300 text-amber-400 border-amber-500/30",
  VENTE:
    "dark:bg-sky-500/15 bg-sky-500/10 dark:text-sky-300 text-sky-500 border-sky-500/30",
  STOCK:
    "dark:bg-emerald-500/15 bg-emerald-500/10 dark:text-emerald-300 text-emerald-500 border-emerald-500/30",
  "GROUPE-STOCK":
    "dark:bg-teal-500/15 bg-teal-500/10 dark:text-teal-300 text-teal-500 border-teal-500/30",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [confirmDisableId, setConfirmDisableId] = useState<number | null>(null);
  const { closeModal, isOpen, openModal, toggleModal } = useModal();

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch("/api/users/");
        if (!res.status)
          throw new Error("Échec du chargement des utilisateurs");
        const data: User[] = await res.users;
        if (!cancelled) setUsers(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Une erreur est survenue",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toUpperCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.use_login.toUpperCase().includes(q) ||
        u.use_acc_code.toUpperCase().includes(q),
    );
  }, [users, search]);

  async function updateAccCode(userId: number, newCode: string) {
    const previous = users;
    setUsers((prev) =>
      prev.map((u) =>
        u.use_id === userId ? { ...u, use_acc_code: newCode } : u,
      ),
    );
    setSavingId(userId);
    setEditingRoleId(null);
    try {
      const res = await apiFetch(`/api/users/${userId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ use_acc_code: newCode }),
      });
      if (!res) throw new Error();
    } catch {
      setUsers(previous); // rollback
      setError("Impossible de modifier le rôle de cet utilisateur.");
    } finally {
      setSavingId(null);
    }
  }

  async function toggleEnabled(userId: number, nextEnabled: boolean) {
    const previous = users;
    setUsers((prev) =>
      prev.map((u) =>
        u.use_id === userId ? { ...u, use_enabled: nextEnabled } : u,
      ),
    );
    setSavingId(userId);
    setConfirmDisableId(null);
    try {
      const res = await apiFetch(`/api/users/${userId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ use_enabled: nextEnabled == true ? 1 : 0 }),
      });
      if (!res) throw new Error();
    } catch {
      setUsers(previous); // rollback
      setError("Impossible de changer le statut de cet utilisateur.");
    } finally {
      setSavingId(null);
    }
  }

  function requestDisableToggle(user: User) {
    // Confirmation seulement quand on désactive un compte actif
    if (user.use_enabled) {
      setConfirmDisableId(user.use_id);
    } else {
      toggleEnabled(user.use_id, true);
    }
  }

  return (
    <div className="w-full  dark:text-slate-100 text-gray-dark">
      <div className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-2">
            <div>
              <Button
                title="Ajouter un nouvelle utilisateur"
                onClick={() => openModal()}
              >
                <FontAwesomeIcon icon={faPlus} />
              </Button>
              <NewUser
                isOpen={isOpen}
                onClose={closeModal}
                className="max-w-[900px] m-4"
              />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight dark:text-white">
                Utilisateurs
              </h1>
              <p className="mt-1 text-sm dark:text-slate-400">
                {users.length} compte{users.length > 1 ? "s" : ""} enregistré
                {users.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="relative w-full sm:w-72">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un identifiant ou un rôle..."
              className="w-full rounded-lg border dark:border-slate-800 dark:bg-slate-900 py-2 pl-9 pr-3 text-sm dark:text-slate-100 placeholder-slate-500 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-rose-300/70 hover:text-rose-200"
            >
              Fermer
            </button>
          </div>
        )}

        {/* Contenu */}
        <div className="w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900/60">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-teal-400" />
              <span className="text-sm">Chargement des utilisateurs...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 px-4 text-center text-sm text-slate-500">
              Aucun utilisateur ne correspond à cette recherche.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide dark:border-slate-800 dark:text-slate-500">
                    <th className="whitespace-nowrap px-3 py-3 font-medium sm:px-4">
                      Identifiant
                    </th>

                    <th className="whitespace-nowrap px-3 py-3 font-medium sm:px-4">
                      Rôle
                    </th>

                    <th className="whitespace-nowrap px-3 py-3 font-medium sm:px-4">
                      Statut
                    </th>

                    <th className="whitespace-nowrap px-3 py-3 font-medium sm:px-4">
                      Créé le
                    </th>

                    <th className="whitespace-nowrap px-3 py-3 font-medium sm:px-4">
                      Modifié le
                    </th>

                    <th className="whitespace-nowrap px-3 py-3 text-right font-medium sm:px-4">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => {
                    const isSaving = savingId === user.use_id;
                    const isEditingRole = editingRoleId === user.use_id;
                    const isConfirmingDisable =
                      confirmDisableId === user.use_id;

                    return (
                      <tr
                        key={user.use_id}
                        className="border-b border-slate-800/60 last:border-0 hover:bg-gray-300/20 dark:hover:bg-slate-800/30"
                      >
                        {/* Identifiant */}
                        <td className="whitespace-nowrap px-3 py-3 font-medium dark:text-slate-100 sm:px-4">
                          {user.use_login}
                        </td>

                        {/* Rôle */}
                        <td className="px-3 py-3 sm:px-4">
                          {isEditingRole ? (
                            <select
                              autoFocus
                              defaultValue={user.use_acc_code}
                              disabled={isSaving}
                              onChange={(e) =>
                                updateAccCode(user.use_id, e.target.value)
                              }
                              onBlur={() => setEditingRoleId(null)}
                              className="w-full min-w-[100px] rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-100 outline-none focus:border-teal-500"
                            >
                              {ACC_CODES.map((code) => (
                                <option key={code} value={code}>
                                  {code}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <button
                              onClick={() => setEditingRoleId(user.use_id)}
                              disabled={isSaving}
                              className={`whitespace-nowrap rounded-md border px-2 py-1 text-xs font-medium transition hover:opacity-80 disabled:opacity-50 ${
                                accCodeStyles[user.use_acc_code] ??
                                "border-slate-600 bg-slate-700/30 text-slate-300"
                              }`}
                              title="Cliquer pour modifier le rôle"
                            >
                              {user.use_acc_code}
                            </button>
                          )}
                        </td>

                        {/* Statut */}
                        <td className="px-3 py-3 sm:px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${
                              user.use_enabled
                                ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-300"
                                : "bg-slate-600/10 text-slate-400 dark:bg-slate-600/20"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                user.use_enabled
                                  ? "bg-emerald-400"
                                  : "bg-slate-500"
                              }`}
                            />

                            {user.use_enabled ? "Actif" : "Désactivé"}
                          </span>
                        </td>

                        {/* Date création */}
                        <td className="whitespace-nowrap px-3 py-3 text-slate-400 sm:px-4">
                          {formatDate(user.use_datecre)}
                        </td>

                        {/* Date modification */}
                        <td className="whitespace-nowrap px-3 py-3 text-slate-400 sm:px-4">
                          {formatDate(user.use_datemdf)}
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3 sm:px-4">
                          <div className="flex min-w-[170px] items-center justify-end gap-2">
                            {isConfirmingDisable ? (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="whitespace-nowrap text-slate-400">
                                  Désactiver ce compte ?
                                </span>

                                <button
                                  onClick={() =>
                                    toggleEnabled(user.use_id, false)
                                  }
                                  className="whitespace-nowrap rounded-md bg-rose-500/20 px-2 py-1 font-medium text-rose-300 hover:bg-rose-500/30"
                                >
                                  Confirmer
                                </button>

                                <button
                                  onClick={() => setConfirmDisableId(null)}
                                  className="whitespace-nowrap rounded-md px-2 py-1 text-slate-400 hover:text-slate-200"
                                >
                                  Annuler
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => requestDisableToggle(user)}
                                disabled={isSaving}
                                className={`whitespace-nowrap rounded-md border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                                  user.use_enabled
                                    ? "border-rose-500/10 text-rose-400 hover:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300"
                                    : "border-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300"
                                }`}
                              >
                                {isSaving
                                  ? "..."
                                  : user.use_enabled
                                    ? "Désactiver"
                                    : "Activer"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
