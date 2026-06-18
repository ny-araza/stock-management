export interface User {
    use_id: number,
    use_login: string,
    use_pwd: string,
    use_acc_code: "ADMIN" | "CAISSE" | "VENTE" | "STOCK" | "GROUPE-STOCK"
    use_datecre: string,
    use_datemdf: string,
    use_usercre: "ADMIN" | "admin"
    use_usermdf: null | "ADMIN"
}
