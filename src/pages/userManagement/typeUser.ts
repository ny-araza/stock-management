/** Identique à l'interface `User` de UserManagement (table t_users). */
export interface User {
  use_id: number;
  use_login: string;
  use_acc_code: string;
  use_enabled: boolean; // 1/0 côté backend
  use_datecre: string | null;
  use_datemdf: string | null;
  use_usercre: string | null;
  use_usermdf: string | null;
}

/** Ligne de t_list_menu. */
export interface Menu {
  men_code: number;
  men_desc: string | null;
  men_vbox: string | null;
}

/** Droit sur un menu (t_autorisation : aut_men_code / aut_acces). */
export interface Permission {
  men_code: number;
  acces: boolean;
}

export interface AccessPayload {
  use_login: string;
  password?: string;
  use_acc_code: string;
  use_enabled: boolean;
  permissions: Permission[];
}
