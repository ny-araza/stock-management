export interface UserFull {
    use_id: number,
    use_login: string,
    use_pwd: string,
    use_acc_code: "ADMIN" | "CAISSE" | "VENTE" | "STOCK" | "GROUPE-STOCK"
    use_datecre: string,
    use_datemdf: string,
    use_usercre: "ADMIN" | "admin"
    use_usermdf: null | "ADMIN"
}

export interface Client {
    cli_id: number,
    cli_code: string,
    cli_nom: string,
    cli_datecre: string,
    cli_datemdf: string,
    cli_usercre: string,
    cli_usermdf: string,
    cli_tel1: string,
    cli_tel2: string,
    cli_adresse: string,
    cli_enabled: boolean,
    cli_email: string,
    cli_modepay: string,
    cli_nif: string,
    cli_stat: string,
    cli_rcs: string,
    cli_type: string
}