import { BaseOption } from "../components/form/form-elements/inputSearch";

export interface UserFull {
  use_id: number;
  use_login: string;
  use_pwd: string;
  use_acc_code: "ADMIN" | "CAISSE" | "VENTE" | "STOCK" | "GROUPE-STOCK";
  use_datecre: string;
  use_datemdf: string;
  use_usercre: "ADMIN" | "admin";
  use_usermdf: null | "ADMIN";
}

export interface Client {
  cli_id: number;
  cli_code: string;
  cli_nom: string;
  cli_datecre?: string;
  cli_datemdf?: string;
  cli_usercre?: string;
  cli_usermdf?: string;
  cli_tel1: string;
  cli_tel2: string;
  cli_adresse: string;
  cli_enabled: boolean;
  cli_email: string;
  cli_modepay: string;
  cli_nif: string;
  cli_stat: string;
  cli_rcs: string;
  cli_type: string;
}

export interface ListeVente {
  vte_id: number;
  vte_code: string;
  vte_datecre: string;
  vte_datemdf: string;
  vte_usercre: string;
  vte_usermdf: string;
  vte_date: string;
  vte_modepaye: string;
  vte_montant_ht: string;
  vte_montant_ttc: string;
  vte_tva: number;
  vte_cli_code: string;
  vte_cli_nom: string;
  vte_cli_contact: string;
  vte_payeclient: string;
  vte_datepay: string;
  vte_telmoney: string;
  vte_valide: boolean;
  vte_paye: boolean;
  vte_datevalide: string;
  vte_livreur: string;
  vet_operateur: string;
  vte_lettremontant: string;
  ve_dateecheance: string;
  ve_code_bl: string;
  ve_adresse_liv: string;
  ve_remise: number;
  ve_proforma: string;
}

export interface VenteLigne {
  art_nom?: string;
  vtel_id: number;
  vtel_quantite: number;
  vtel_prixunit: number;
  vtel_ttc: number;
  vtel_art_code: string;
  vtel_pri_id: number;
  vtel_tva: number;
  vtel_ht: number;
  vtel_fou_code: string;
  vtel_lot_id: number;
  vtel_lot_code: string;
  vtel_lot_dateper: string;
  vtel_dateper: string | null;
  vtel_prix: string;
  vtel_cli_code: string;
  vtel_vte_code: string;
  vtel_remise: number;
  vtel_montant_tva?: number;
  vtel_montant_remise?: number;
  vtel_uid?: string;
  vtel_quantite_stock?: number;
  vtel_lot?: string;
}


export interface FactureAutocomplete {
  rtc_code: string;
  vte_id: string;
  vte_code: string;
  vte_date: string;
  vte_vte_code: string;
  vte_montant_ht: number;
  vte_montant_ttc: number;
  vte_tva: number;
  vte_cli_code: string;
  vte_cli_nom: string;
  rtc_motif: string;
  rtc_observation: string;
  client: Client
  ligne: VenteLigne[]
}

export interface ListeVenteProforma {
  pro_id: number;
  pro_code: string;
  pro_datecre: string;
  pro_datemdf: string;
  pro_usercre: string;
  pro_usermdf: string;
  pro_date: string;
  pro_modecmd: string;
  pro_dateliv: string;
  pro_enabled: 1;
  pro_montant_ht: number;
  pro_montant_ttc: number;
  pro_islivre: boolean;
  pro_cli_code: string;
  pro_lettre: string;
  pro_tva: number;
  pro_remise: number;
  client: Client;
  ligne: ProLigneArticle[];
}

export interface Proforma {
  pro_id: number;
  pro_code: string;
  pro_datecre: string;
  pro_datemdf: string;
  pro_usercre: string;
  pro_usermdf: string;
  pro_date: string;
  pro_modecmd: string;
  pro_dateliv: string;
  pro_islivre: boolean;
  pro_montant_ht: number;
  pro_montant_ttc: number;
  pro_cli_code: string;
  pro_enabled: boolean;
  pro_lettre: string;
  pro_tva: number;
  pro_remise: number;
}

export interface Articles {
  art_id: number;
  art_code: string;
  art_nom: string;
  art_datecre: string;
  art_datemdf: string;
  art_usercre: string;
  art_usermdf: string;
  art_poids: string;
  art_taille: string;
  art_stockmini: number;
  art_enabled: boolean;
  art_fam_id: number;
  art_sof_id: number;
  art_codebarre: string;
  art_lot_id: number;
  art_stockable: boolean;
  art_marque: string;
}

export interface BC {
  cmf_id: number;
  cmf_code: string;
  cmf_datecre: string;
  cmf_datemdf: string;
  cmf_usercre: string;
  cmf_usermdf: string;
  cmf_date: string;
  cmf_modecmd: string;
  cmf_dateliv: string;
  cmf_enabled: boolean;
  cmf_montant_ht: number;
  cmf_montant_ttc: number;
  cmf_islivre: boolean;
  cmf_fou_code: string;
  cmf_lettre: string;
}

export interface BCAutoComplete {
  cmf_id: number;
  cmf_code: string;
  cmf_datecre: string;
  cmf_datemdf: string;
  cmf_usercre: string;
  cmf_usermdf: string;
  cmf_date: string;
  cmf_modecmd: string;
  cmf_dateliv: string;
  cmf_enabled: boolean;
  cmf_montant_ht: number;
  cmf_montant_ttc: number;
  cmf_islivre: boolean;
  cmf_fou_code: string;
  cmf_lettre: string;
  fournisseur: Fourniseur;
  ligne: CFLigneArticle[];
}

export interface CFLigneArticle {
  cmfl_id?: number;
  cmfl_cmf_code: string;
  cmfl_Quantite: number;
  cmfl_PrixAchat: number;
  cmfl_Tva: number;
  cmfl_TotalHT: number;
  cmfl_Art_Code: string;
  cmfl_fou_Code: string;
  cmfl_TotalTTC: number;
  cmfl_pri_id: number;
  art_nom: string;
  cmfl_uid?: string;
  cmfl_remise?: number;
  cmfl_montant_remise?: number;
  cmfl_montant_tva?: number;
  cmfl_lot: "";
  cmfl_datePer?: "";
  cmfl_quantite_stock?: number;
  cmfl_lot_id?: number;
  cmfl_lot_code?: string;
}

export interface ProLigneArticle {
  prol_id?: number;
  prol_pro_code: string;
  prol_Quantite: number;
  prol_prixunit: number;
  prol_Tva: number;
  prol_TotalHT: number;
  prol_Art_Code: string;
  prol_cli_Code: string;
  prol_TotalTTC: number;
  prol_pri_id: number;
  art_nom: string;
  prol_uid?: string;
  prol_remise?: number;
  prol_montant_remise?: number;
  prol_montant_tva?: number;
  prol_lot: "";
  prol_lot_id?: number;
  prol_datePer?: "";
  prol_quantite_stock?: number;
}

export interface InStock {
  in_id: number;
  in_quantite: number;
  in_pri_id: number;
  in_art_code: string;
  in_lot_code: string;
  in_motif: string;
  in_autre_motif: string;
  in_lot_id: number;
  in_date: string;
  in_code: string;
}

export interface OutStock {
  out_id: number;
  out_quantite: number;
  out_pri_id: number;
  out_art_code: string;
  out_lot_code: string;
  out_motif: string;
  out_autre_motif: string;
  out_lot_id: number;
  out_date: string;
  out_code: string;
}

export interface Fourniseur {
  fou_id: number;
  fou_code: string;
  fou_nom: string;
  fou_datecre: string;
  fou_datemdf: string;
  fou_usercre: string;
  fou_usermdf: string;
  fou_tel1: string;
  fou_tel2: string;
  fou_adresse: string;
  fou_mail: string;
  fou_enabled: boolean;
  fou_modepay: string;
  fou_commercial: string;
}

export interface Famille {
  fam_id: number;
  fam_code: string;
  fam_nom: string;
  fam_datecre: string;
  fam_datemdf: string;
  fam_usercre: string;
  fam_usermdf: string;
  fam_enabled: string;
}

export interface SousFamille {
  sof_id: number;
  sof_code: string;
  sof_nom: string;
  sof_datecre: string;
  sof_datemdf: string;
  sof_usercre: string;
  sof_usermdf: string;
  sof_fam_id: number;
  sof_fabricant: string;
  sof_paysorg: string;
  sof_enabled: boolean;
}

export interface ArticleApi {
  id: number;
  code: string;
  prix_ht: number;
  prix_vte: number;
  pri_tva: number;
  nom_article: string;
  lots: LotApi[];
  quantite_stock: number;
}

export interface LotApi {
  lot_id: number;
  lot_code: string;
  lot_datePeremption: string | null;
  lot_quantite: number;
}

export interface ArticleLigneEntrer {
  pri_id: number;
  pri_art_code: string;
  pri_pu: string;
}

export interface Enumeration {
  enu_id: number;
  enu_nom: string;
}

interface Option {
  value: string;
  label: string;
}

export interface ArticleLigneEntrerOption
  extends BaseOption, ArticleLigneEntrer {}

export interface FamilleOption extends BaseOption, Famille {}

export interface SousFamilleOption extends BaseOption, SousFamille {}

export interface EnumerationOption extends Option, Enumeration {}
