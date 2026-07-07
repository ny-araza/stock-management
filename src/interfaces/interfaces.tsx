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

export interface ListeVente {
    vte_id: number,
    vte_code: string,
    vte_datecre: string,
    vte_datemd: string,
    vte_usercre: string,
    vte_usermdf: string,
    vte_date: string,
    vte_modepaye: string,
    vte_montant_ht: string,
    vte_montant_ttc: string,
    vte_tva: number,
    vte_cli_code: string,
    vte_cli_nom: string,
    vte_cli_contact: string,
    vte_payeclient: string,
    vte_datepay: string,
    vte_telmoney: string,
    vte_valide: boolean,
    vte_paye: boolean,
    vte_datevalide: string,
    vte_livreur: string,
    vet_operateur: string,
    vte_lettremontant: string,
    ve_dateecheance: string,
    ve_code_bl: string,
    ve_adresse_liv: string,
    ve_remise: number,
    ve_proforma: string
}

export interface Articles {
    art_id: number,
    art_code: string,
    art_nom: string,
    art_datecre: string,
    art_datemdf: string,
    art_usercre: string,
    art_usermdf: string,
    art_poids: string,
    art_taille: string,
    art_stockmini: number,
    art_enabled: boolean,
    art_fam_id: number,
    art_sof_id: number,
    art_codebarre: string,
    art_lot_id: number,
    art_stockable: boolean,
    art_marque: string
}