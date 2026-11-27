import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../services/api";
import Button from "../../components/ui/button/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
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

type StatutFiltre = "tous" | "actifs" | "inactifs";

// Rôles disponibles pour use_acc_code — adapte à ta nomenclature réelle
const ACC_CODES = [
  "ADMIN",
  "CAISSE",
  "VENTE",
  "STOCK",
  "GROUPE-STOCK",
] as const;

// Clair : fond pastel + texte foncé (contraste élevé sur fond blanc). Sombre : fond translucide + texte clair.
const accCodeStyles: Record<string, string> = {
  ADMIN:
    "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30",
  CAISSE:
    "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  VENTE:
    "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30",
  STOCK:
    "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
  "GROUPE-STOCK":
    "bg-brand-100 text-brand-800 border-brand-300 dark:bg-brand-500/15 dark:text-brand-300 dark:border-brand-500/30",
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

function initiales(login: string): string {
  return login?.trim().slice(0, 2).toUpperCase() || "?";
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState<StatutFiltre>("tous");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [confirmDisableId, setConfirmDisableId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { closeModal, isOpen, openModal } = useModal();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    openModal();
  };

  // silent = true : recharge sans afficher le spinner (après création / modification)
  const loadUsers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/users/");
      if (!res.status) throw new Error("Échec du chargement des utilisateurs");
      const data: User[] = await res.users;
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const nbActifs = useMemo(
    () => users.filter((u) => u.use_enabled).length,
    [users],
  );
  const nbInactifs = users.length - nbActifs;

  const filteredUsers = useMemo(() => {
    const q = search.trim().toUpperCase();
    return users.filter((u) => {
      if (statut === "actifs" && !u.use_enabled) return false;
      if (statut === "inactifs" && u.use_enabled) return false;
      if (!q) return true;
      return (
        u.use_login.toUpperCase().includes(q) ||
        u.use_acc_code.toUpperCase().includes(q)
      );
    });
  }, [users, search, statut]);

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

  async function deleteUser(userId: number) {
    setDeletingId(userId);
    setError(null);

    try {
      await apiFetch(`/api/users/${userId}/`, {
        method: "DELETE",
      });

      setUsers((prev) => prev.filter((user) => user.use_id !== userId));
      setConfirmDeleteId(null);
      setConfirmDisableId(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer cet utilisateur.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filtres: { key: StatutFiltre; label: string; count: number }[] = [
    { key: "tous", label: "Tous", count: users.length },
    { key: "actifs", label: "Actifs", count: nbActifs },
    { key: "inactifs", label: "Désactivés", count: nbInactifs },
  ];

  return (
    <div className="w-full text-slate-900 dark:text-slate-100">
      <div className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Button
              title="Ajouter un nouvel utilisateur"
              onClick={() => {
                setSelectedUser(null);
                openModal();
              }}
            >
              <FontAwesomeIcon icon={faPlus} />
            </Button>
            <NewUser
              isOpen={isOpen}
              onClose={() => {
                closeModal();
                setSelectedUser(null);
              }}
              className="max-w-[900px] m-4"
              userToEdit={selectedUser}
              onSuccess={() => loadUsers(true)}
            />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Utilisateurs
              </h1>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                Gérez les comptes, leurs rôles et leur statut.
              </p>
            </div>
          </div>

          <div className="relative w-full lg:w-80">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
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
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Statistiques */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              label: "Comptes",
              value: users.length,
              tone: "text-slate-900 dark:text-white",
            },
            {
              label: "Actifs",
              value: nbActifs,
              tone: "text-emerald-700 dark:text-emerald-300",
            },
            {
              label: "Désactivés",
              value: nbInactifs,
              tone: "text-rose-700 dark:text-rose-300",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                {s.label}
              </div>
              <div className={`mt-1 text-3xl font-bold tabular-nums ${s.tone}`}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Message d'erreur */}
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
          >
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-4 rounded-md px-2 py-1 font-semibold text-rose-800 hover:bg-rose-100 dark:text-rose-300 dark:hover:bg-rose-500/20"
            >
              Fermer
            </button>
          </div>
        )}

        {/* Filtre de statut */}
        <div className="mb-3 inline-flex overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {filtres.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatut(f.key)}
              className={`px-4 py-2 text-sm font-medium transition ${
                statut === f.key
                  ? "bg-brand-600 text-white"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {f.label}
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  statut === f.key
                    ? "bg-white/25 text-white"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-600 dark:text-slate-400">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600 dark:border-slate-700 dark:border-t-brand-400" />
              <span className="text-sm font-medium">
                Chargement des utilisateurs...
              </span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-4 py-16 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
              {users.length === 0
                ? "Aucun utilisateur enregistré."
                : "Aucun utilisateur ne correspond à cette recherche."}
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                    <th className="whitespace-nowrap px-3 py-3 font-semibold sm:px-4">
                      Identifiant
                    </th>
                    <th className="whitespace-nowrap px-3 py-3 font-semibold sm:px-4">
                      Rôle
                    </th>
                    <th className="whitespace-nowrap px-3 py-3 font-semibold sm:px-4">
                      Statut
                    </th>
                    <th className="whitespace-nowrap px-3 py-3 font-semibold sm:px-4">
                      Créé le
                    </th>
                    <th className="whitespace-nowrap px-3 py-3 font-semibold sm:px-4">
                      Modifié le
                    </th>
                    <th className="whitespace-nowrap px-3 py-3 text-right font-semibold sm:px-4">
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
                        className="border-b border-slate-100 transition-colors last:border-0 hover:bg-brand-50/60 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                      >
                        {/* Identifiant */}
                        <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                          <div className="flex items-center gap-3">
                            <span
                              aria-hidden="true"
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800 dark:bg-brand-500/20 dark:text-brand-300"
                            >
                              {initiales(user.use_login)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleEditUser(user)}
                              className="cursor-pointer text-left font-semibold text-brand-700 transition hover:text-brand-900 hover:underline dark:text-brand-300 dark:hover:text-brand-200"
                              title="Cliquer pour modifier cet utilisateur"
                            >
                              {user.use_login}
                            </button>
                          </div>
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
                              className="w-full min-w-[120px] rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                              className={`whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-semibold transition hover:brightness-95 disabled:opacity-50 ${
                                accCodeStyles[user.use_acc_code] ??
                                "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-700/30 dark:text-slate-300"
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
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                              user.use_enabled
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                                : "bg-slate-200 text-slate-700 dark:bg-slate-600/20 dark:text-slate-400"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                user.use_enabled
                                  ? "bg-emerald-600"
                                  : "bg-slate-500"
                              }`}
                            />
                            {user.use_enabled ? "Actif" : "Désactivé"}
                          </span>
                        </td>

                        {/* Date création */}
                        <td className="whitespace-nowrap px-3 py-3 text-slate-700 dark:text-slate-400 sm:px-4">
                          {formatDate(user.use_datecre)}
                        </td>

                        {/* Date modification */}
                        <td className="whitespace-nowrap px-3 py-3 text-slate-700 dark:text-slate-400 sm:px-4">
                          {formatDate(user.use_datemdf)}
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3 sm:px-4">
                          <div className="flex min-w-[260px] items-center justify-end gap-2">
                            {isConfirmingDisable ? (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                                  Désactiver ?
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleEnabled(user.use_id, false)
                                  }
                                  disabled={isSaving || deletingId !== null}
                                  className="whitespace-nowrap rounded-md bg-rose-600 px-2.5 py-1.5 font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                                >
                                  Confirmer
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDisableId(null)}
                                  className="whitespace-nowrap rounded-md px-2.5 py-1.5 font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                  Annuler
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => requestDisableToggle(user)}
                                disabled={isSaving || deletingId !== null}
                                className={`whitespace-nowrap rounded-md border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                                  user.use_enabled
                                    ? "border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                                    : "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                                }`}
                              >
                                {isSaving
                                  ? "..."
                                  : user.use_enabled
                                    ? "Désactiver"
                                    : "Activer"}
                              </button>
                            )}

                            {confirmDeleteId === user.use_id ? (
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="whitespace-nowrap font-medium text-rose-600 dark:text-rose-300">
                                  Supprimer ?
                                </span>
                                <button
                                  type="button"
                                  onClick={() => deleteUser(user.use_id)}
                                  disabled={deletingId === user.use_id}
                                  className="whitespace-nowrap rounded-md bg-rose-600 px-2.5 py-1.5 font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                                >
                                  {deletingId === user.use_id ? "..." : "Oui"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  disabled={deletingId === user.use_id}
                                  className="whitespace-nowrap rounded-md px-2 py-1.5 font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                  Non
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmDeleteId(user.use_id);
                                  setConfirmDisableId(null);
                                }}
                                disabled={isSaving || deletingId !== null}
                                title="Supprimer cet utilisateur"
                                aria-label={`Supprimer ${user.use_login}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-300 text-rose-700 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                              >
                                <FontAwesomeIcon icon={faTrash} />
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
