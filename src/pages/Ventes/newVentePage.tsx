/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useRef, useState } from "react";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import {
  ArticleApi,
  Client,
  Enumeration,
  EnumerationOption,
  ListeVente,
  ListeVenteProforma,
  Proforma,
} from "../../interfaces/interfaces";
import { apiFetch } from "../../services/api";
import SearchableSelect from "../Home/modal/utils/searchableSelect";
import { formatDate } from "../Home/modal/utils/utilsFucntions";
import Select, { Option } from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { VenteLigne } from "./ventesTable";
import ListItems, { ListColumn } from "../Home/modal/utils/listItems";
import GenericArticleModal, {
  ArticleCalculation,
  ArticleField,
  ArticleSearchConfig,
  LotAllocation,
} from "../Home/modal/utils/articleGenericModal";
import montantTTCEnLettres from "../../utils/montantEnLettre";
import { postData } from "../../services/sendDataService";
import deduireQuantiteLot from "../../utils/updateLot";
import Alert from "../../components/ui/alert/Alert";
import mettreAJourProforma, { DataUpdate } from "../../services/update";
import { useAuth } from "../../services/authLogin";
import mettreAJourDocument from "../../services/update";

export default function NewVentePage() {
  const today = new Date().toISOString().split("T")[0];

  const [alert, setAlert] = useState({
    open: false,
    variant: "success" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
  });
  const { user } = useAuth();

  const emptyVente: ListeVente = {
    vte_id: 0,
    vte_code: "",
    vte_datecre: "",
    vte_datemdf: "",
    vte_usercre: "",
    vte_usermdf: "",
    vte_date: today,
    vte_modepaye: "1",
    vte_montant_ht: "",
    vte_montant_ttc: "",
    vte_tva: 0,
    vte_cli_code: "",
    vte_cli_nom: "",
    vte_cli_contact: "",
    vte_payeclient: "16",
    vte_datepay: "",
    vte_telmoney: "",
    vte_valide: false,
    vte_paye: false,
    vte_datevalide: "",
    vte_livreur: "",
    vet_operateur: "",
    vte_lettremontant: "",
    ve_dateecheance: today,
    ve_code_bl: "",
    ve_adresse_liv: "",
    ve_remise: 0,
    ve_proforma: "",
  };

  const emptyClient: Client = {
    cli_adresse: "",
    cli_code: "",
    cli_datecre: "",
    cli_datemdf: "",
    cli_email: "",
    cli_enabled: true,
    cli_id: 0,
    cli_modepay: "",
    cli_nif: "",
    cli_nom: "",
    cli_rcs: "",
    cli_stat: "",
    cli_tel1: "",
    cli_tel2: "",
    cli_type: "",
    cli_usercre: "",
    cli_usermdf: "",
  };

  const emptyArticle: VenteLigne = {
    vtel_id: 0,
    vtel_datecre: "",
    vtel_datemdf: "",
    vtel_usercre: "",
    vtel_usermdf: "",
    vtel_quantite: 0,
    vtel_prixunit: 0,
    vtel_ttc: 0,
    vtel_art_code: "",
    vtel_pri_id: 0,
    vtel_tva: 0,
    vtel_ht: 0,
    vtel_fou_code: "",
    vtel_lot_id: "",
    vtel_lot_code: "",
    vtel_lot_dateper: "",
    vtel_dateper: "",
    vtel_prix: "",
    vtel_cli_code: "",
    vtel_vte_code: "",
    vtel_remise: 0,
  };

  const emptyForm: ListeVenteProforma = {
    pro_cli_code: "",
    pro_code: "",
    pro_date: "",
    pro_datecre: "",
    pro_dateliv: "",
    pro_datemdf: "",
    pro_enabled: true,
    pro_id: 0,
    pro_islivre: false,
    pro_lettre: "",
    pro_modecmd: "",
    pro_montant_ht: 0,
    pro_montant_ttc: 0,
    pro_remise: 0,
    pro_tva: 0,
    pro_usercre: "",
    pro_usermdf: "",
  };

  const [vente, setVente] = useState<ListeVente>(emptyVente);
  const [searchClt, setSearchClt] = useState("");
  const [searchProforma, setSearchProforma] = useState("");
  const [showSuggestionsClient, setShowSuggestionsClient] =
    useState<boolean>(false);
  const [showSuggestionsProforma, setShowSuggestionsProforma] =
    useState<boolean>(false);
  const [client, setClient] = useState<Client>(emptyClient);
  const [proforma, setProforma] = useState<ListeVenteProforma>(emptyForm);

  //payeClt
  const [payementEnum, setpayementEnum] = useState<Enumeration[]>([]);
  const enumerationPaye: EnumerationOption[] = payementEnum.map(
    (item: Enumeration) => ({
      ...item,
      value: item.enu_id.toString(),
      label: item.enu_nom,
    }),
  );
  //end payeClt

  //modePaye
  const [modePayementEnum, setModepayementEnum] = useState<Enumeration[]>([]);
  const enumerationModePaye: EnumerationOption[] = modePayementEnum.map(
    (item: Enumeration) => ({
      ...item,
      value: item.enu_id.toString(),
      label: item.enu_nom,
    }),
  );
  //modePaye

  // searchableSelect

  const [suggestionsClient, setSuggestionsClient] = useState<Client[]>([]);
  const [suggestionsProforma, setSuggestionsProforma] = useState<
    ListeVenteProforma[]
  >([]);
  const [loading, setLoading] = useState(false);
  const skipSearch = useRef(false);
  const [highlight, setHighlight] = useState(-1);

  const [payeOption, setPayeOption] = useState<Option[] | undefined>();

  const handleSearchChangeClient = (value: string) => {
    setSearchClt(value);
    setShowSuggestionsClient(true);
    setClient(emptyClient);
  };

  const handleSearchChangeProforma = (value: string) => {
    setSearchProforma(value);
    setShowSuggestionsProforma(true);
    setProforma(emptyForm);
  };

  const choisirClient = (a: Client) => {
    skipSearch.current = true;
    setSearchClt(a.cli_nom);
    console.log(a);
    setClient(a);
    setSuggestionsClient([]);
    setShowSuggestionsClient(false);
    setHighlight(-1);
  };

  const choisirProforma = (a: ListeVenteProforma) => {
    skipSearch.current = true;
    setSearchProforma(a.pro_code);
    console.log(a);
    setProforma(a);
    setSearchClt(a.client.cli_nom);
    setClient(a.client);
    setLigneArticle(
      a.ligne.map((ligne) => ({
        art_nom: ligne.art_nom,
        vtel_id: 0,
        vtel_datecre: new Date().toISOString(),
        vtel_datemdf: null,
        vtel_usercre: "",
        vtel_usermdf: null,
        vtel_quantite: ligne.prol_quantite,
        vtel_prixunit: ligne.prol_prixvente,
        vtel_ttc: ligne.prol_totalttc,
        vtel_art_code: ligne.prol_art_code,
        vtel_pri_id: ligne.prol_pri_id,
        vtel_tva: ligne.prol_tva,
        vtel_ht: ligne.prol_totalht,
        vtel_montant_tva: ligne.prol_montant_tva,
        vtel_fou_code: "",
        vtel_lot_id: ligne.prol_lot_id,
        vtel_lot_code: ligne.prol_lot_id,
        vtel_lot_dateper: ligne.prol_lot_dateper ?? "",
        vtel_dateper: ligne.prol_lot_dateper,
        vtel_prix: String(ligne.prol_prixunit),
        vtel_cli_code: a.client.cli_code,
        vtel_vte_code: vente.vte_cli_code,
        vtel_remise: ligne.prol_remise ?? 0,
      })),
    );
    setSuggestionsProforma([]);
    setShowSuggestionsProforma(false);
    setHighlight(-1);
  };

  const inputClass = `
    h-10 w-full rounded-md border border-gray-300 px-3 text-sm
    outline-none focus:border-blue-500
    dark:border-gray-600 dark:bg-gray-800 dark:text-white
  `;

  const rechercherClient = useCallback(async (code: string) => {
    if (!code.trim()) {
      setSuggestionsClient([]);
      setShowSuggestionsClient(false);
      return;
    }

    try {
      const query = new URLSearchParams();
      query.set("search", code);
      const res = await apiFetch(`/api/clients/?${query.toString()}`);
      if (res.status) {
        setSuggestionsClient(res.clients);
        setShowSuggestionsClient(true);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const rechercherProforma = useCallback(async (code: string) => {
    if (!code.trim()) {
      setSuggestionsProforma([]);
      setShowSuggestionsProforma(false);
      return;
    }

    try {
      const query = new URLSearchParams();
      query.set("search", code);
      const res = await apiFetch(
        `/api/proforma-autocomplete/?${query.toString()}`,
      );
      if (res.status) {
        setSuggestionsProforma(res.proforma);
        console.log(res.proforma);
        setShowSuggestionsProforma(true);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // openGenericModal

  const [article, setArticle] = useState<VenteLigne | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [ligneArticle, setLigneArticle] = useState<VenteLigne[]>([]);
  const [totaux, setTotaux] = useState<TotauxProforma>({
    ht: 0,
    tva: 0,
    ttc: 0,
    remise: 0,
  });

  interface TotauxProforma {
    ht: number;
    tva: number;
    ttc: number;
    remise: number;
  }

  const articleColumns: ListColumn<VenteLigne>[] = [
    {
      label: "Code Article",
      mobilePrimary: true,
      render: (article) => (
        <div>
          <strong>{article.vtel_art_code}</strong>

          <div className="text-sm text-gray-500">{article.art_nom}</div>
        </div>
      ),
    },

    {
      label: "Quantité",
      render: (article) => article.vtel_quantite,
    },

    {
      label: "TVA (Ar)",
      render: (article) =>
        Number(article.vtel_montant_tva).toLocaleString("fr-FR"),
    },

    {
      label: "P.U",
      render: (article) => (
        <>{Number(article.vtel_prixunit).toLocaleString("fr-FR")} Ar</>
      ),
    },

    {
      label: "Date Per",
      render: (article) => article.vtel_dateper,
    },

    {
      label: "HT",
      mobilePrimary: true,
      render: (article) => (
        <strong>{Number(article.vtel_ht).toLocaleString("fr-FR")} Ar</strong>
      ),
    },
    {
      label: "Remise (Ar)",
      mobilePrimary: true,
      render: (article) => (
        <strong>
          {article.vtel_montant_remise
            ? Number(article.vtel_montant_remise).toLocaleString("fr-FR")
            : "0"}{" "}
          Ar
        </strong>
      ),
    },
  ];

  const openGenericModal = () => {
    setArticle(null);
    setModalOpen(true);
    setEditingUid(null);
  };

  const modifierArticle = (articleSelectionne: VenteLigne) => {
    setArticle({ ...articleSelectionne });
    setEditingUid(articleSelectionne.vtel_uid ?? null);
    setModalOpen(true);
  };

  const supprimerArticle = (uid: string) => {
    // setLigneArticle((prev) => ({
    //   ...prev,
    //   ligne: prev.filter((item) => item.prol_uid !== uid),
    // }));
    // // Si on supprimait l'article actuellement en modification
    // if (editingUid === uid) {
    //   setEditingUid(null);
    //   setArticle(null);
    //   setModalOpen(false);
    // }
  };

  const calculerTotaux = (lignes: VenteLigne[]): TotauxProforma => {
    const sum = (fn: (a: VenteLigne) => number) =>
      lignes.reduce((t, a) => t + (Number(fn(a)) || 0), 0);

    const ht = sum((a) => a?.vtel_ht); // déjà net de remise

    const remise = sum((a) => a.vtel_montant_remise || 0);
    const tva = sum((a) => a.vtel_montant_tva || 0);

    console.log(
      Math.round(ht + remise),
      Math.round(remise),
      Math.round(ht),
      Math.round(tva),
      Math.round(ht + tva),
    );

    return {
      remise: Math.round(remise),
      ht: Math.round(ht),
      tva: Math.round(tva),
      ttc: Math.round(ht + tva),
    };
  };

  const ajouterArticle = (nouvelArticle: VenteLigne) => {
    console.log("Article reçu :", nouvelArticle);
    console.log("Mode :", editingUid ? "MODIFICATION" : "AJOUT");
    console.log("UID :", editingUid);

    setLigneArticle((prev) => {
      // =====================================================
      // 1. MODIFICATION D'UNE LIGNE EXISTANTE
      // =====================================================
      if (editingUid) {
        return prev.map((item) =>
          item.vtel_uid === editingUid
            ? {
                ...item,
                ...nouvelArticle,

                // Conserver l'UID de la ligne existante
                vtel_uid: editingUid,

                // Normalisation
                vtel_pri_id: Number(nouvelArticle.vtel_pri_id || 0),
                vtel_quantite: Number(nouvelArticle.vtel_quantite || 0),
                vtel_prixunit: Number(nouvelArticle.vtel_prixunit || 0),
                vtel_montant_tva: Number(nouvelArticle.vtel_montant_tva || 0),
                vtel_ht: Number(nouvelArticle.vtel_ht || 0),
                vtel_ttc: Number(nouvelArticle.vtel_ttc || 0),

                vtel_dateper: nouvelArticle.vtel_dateper || "",
                vtel_remise: nouvelArticle.vtel_remise || 0,
                vtel_montant_remise: nouvelArticle.vtel_montant_remise || 0,
                vtel_quantite_stock: nouvelArticle.vtel_quantite_stock || 0,

                // Valeur par défaut du lot
                vtel_lot: nouvelArticle.vtel_lot || "",
              }
            : item,
        );
      }

      // =====================================================
      // 2. AJOUT D'UNE NOUVELLE LIGNE
      // =====================================================

      const newArticle: VenteLigne = {
        ...nouvelArticle,

        // Générer un nouvel UID
        vtel_uid:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,

        // Normalisation
        vtel_pri_id: Number(nouvelArticle.vtel_pri_id || 0),
        vtel_quantite: Number(nouvelArticle.vtel_quantite || 0),
        vtel_prixunit: Number(nouvelArticle.vtel_prixunit || 0),
        vtel_montant_tva: Number(nouvelArticle.vtel_montant_tva || 0),
        vtel_ht: Number(nouvelArticle.vtel_ht || 0),
        vtel_ttc: Number(nouvelArticle.vtel_ttc || 0),

        vtel_dateper: nouvelArticle.vtel_dateper || "",
        vtel_remise: nouvelArticle.vtel_remise || 0,
        vtel_montant_remise: nouvelArticle.vtel_montant_remise || 0,
        vtel_quantite_stock: nouvelArticle.vtel_quantite_stock || 0,

        // Valeur par défaut
        vtel_lot: nouvelArticle.vtel_lot || "",
      };

      return [...prev, newArticle];
    });

    // =====================================================
    // 3. FERMETURE / RESET
    // =====================================================

    setModalOpen(false);
    setArticle(null);
    setEditingUid(null);
  };

  const ajouterArticles = (articles: VenteLigne[]) => {
    console.log("Articles reçus :", articles);

    setLigneArticle((prev) => {
      const nouveauxArticles: any = articles.map((article) => ({
        ...article,

        // Chaque lot doit avoir sa propre ligne
        vtel_uid:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.randomCF26100006()}`,

        // Normalisation
        vtel_pri_id: Number(article.vtel_pri_id || 0),
        vtel_quantite: Number(article.vtel_quantite || 0),
        vtel_prixunit: Number(article.vtel_prixunit || 0),
        vtel_montant_tva: Number(article.vtel_montant_tva || 0),
        vtel_ht: Number(article.vtel_ht || 0),
        vtel_ttc: Number(article.vtel_ttc || 0),

        vtel_dateper: article.vtel_dateper || "",
        vtel_remise: article.vtel_remise || 0,
        vtel_montant_remise:
          (Number(article.vtel_ttc || 0) * Number(article.vtel_remise || 0)) /
          100,
        vtel_quantite_stock: Number(article.vtel_quantite_stock || 0),

        // Lot différent pour chaque ligne
        vtel_lot: article.vtel_lot || "",
        vtel_id: article.vtel_lot_id,
      }));

      return [...prev, ...nouveauxArticles];
    });

    setModalOpen(false);
    setArticle(null);
    setEditingUid(null);
  };

  const articleSearchConfig: ArticleSearchConfig<VenteLigne, ArticleApi> = {
    search: async (value) => {
      const query = new URLSearchParams();

      query.set("search", value);

      const res = await apiFetch(
        `/api/articles-autocomplete/?${query.toString()}`,
      );

      return res.status ? (res.articles ?? []) : [];
    },
    getKey: (article) => article.id,

    getSearchValue: (article) => article.code,

    getLots: (article) => {
      console.log("article.lots => ", article.lots);
      return article.lots ?? [];
    },

    getStock: (article) => article.quantite_stock,

    renderItem: (article) => (
      <div className="px-3 py-2">
        <div
          className="
            text-sm font-medium
            text-gray-800
            dark:text-white
          "
        >
          {article.code}
        </div>

        <div
          className="
            truncate text-xs
            text-gray-500
          "
        >
          {article.nom_article}
        </div>

        <div className="text-xs text-gray-400">
          {Number(article.prix_ht).toLocaleString("fr-FR")} Ar · TVA{" "}
          {article.pri_tva}%
        </div>
      </div>
    ),
    mapToForm: (article, previous) => ({
      ...previous,

      vtel_id: article.id,

      vtel_art_code: article.code,

      art_nom: article.nom_article,

      vtel_prixunit: article.prix_vte ?? 0,

      vtel_tva: Number(article.pri_tva ?? 0),

      vtel_montant_tva:
        (Number(article.pri_tva ?? 0) * Number(article.prix_vte ?? 0)) / 100,

      vtel_ht: 0,

      vtel_lot: "",

      vtel_datePer: "",
      vtel_remise: 0,
      vtel_montant_remise: 0,
      vtel_quantite_stock: article.quantite_stock,
      vtel_uid:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,
    }),
  };

  const articleFields: ArticleField<VenteLigne>[] = [
    {
      name: "art_nom",
      label: "Désignation",
      type: "text",
      placeholder: "Désignation de l'article",
      className: "md:col-span-7",
    },

    {
      name: "vtel_quantite",
      label: "Quantité",
      type: "number",
      min: 0,
      parseValue: Number,
      getValue: (article: VenteLigne) => article.vtel_quantite || "",
      placeholder: "Quantité à vendre",
    },

    {
      name: "vtel_prixunit",
      label: "Prix unitaire",
      type: "number",
      min: 0,
    },
    {
      name: "vtel_montant_tva",
      label: "TVA (Ar)",
      type: "number",
      min: 0,
      step: 0.01,
      parseValue: Number,
    },
    {
      name: "vtel_remise",
      label: "Remise (%)",
      type: "number",
      min: 0,
      step: 0.01,
      parseValue: Number,
    },
    {
      name: "vtel_ht",
      label: "Total HT",
      type: "text",
      readOnly: true,
      getValue: (article: VenteLigne) =>
        `${Number(article.vtel_ht).toLocaleString("fr-FR")} Ar`,
    },
  ];

  const calculation: ArticleCalculation<VenteLigne> = {
    calculate: (form) => {
      const quantite = Number(form.vtel_quantite) || 0;
      const pua = Number(form.vtel_prixunit) || 0;
      const remise = Math.min(100, Math.max(0, Number(form.vtel_remise) || 0));
      const tauxTva = Number(form.vtel_tva) || 0;

      const totalBrut = quantite * pua;
      const montantRemise = totalBrut * (remise / 100);
      const totalHT = totalBrut - montantRemise;
      const tva = totalHT * (tauxTva / 100);
      return {
        vtel_ht: Math.round(totalHT),
        vtel_montant_tva: Math.round(tva),
        vtel_ttc: Math.round(totalHT + tva),
        vtel_montant_remise: Math.round(montantRemise),
      };
    },
  };

  // openGenrericModal

  function calculerDate(nb_jour: number): string {
    const date = new Date();
    const temp = payementEnum.filter((p) => p.enu_id == nb_jour);
    try {
      const t = temp[0].enu_nom.split(" ")[1];
      let nb = 0;
      try {
        nb = parseInt(t);
      } catch {
        return "";
      }

      if (!nb) return "";

      date.setDate(date.getDate() + nb);

      return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");
    } catch {
      return "";
    }
  }

  const fetchPaye = async (enu_code: string) => {
    try {
      const query = new URLSearchParams();
      query.set("enu_code", enu_code);
      const res = await apiFetch(
        `/api/generate-enumeration/?${query.toString()}`,
      );

      if (res.success) {
        setpayementEnum(res.nom_enumeration);
      }
    } catch (error: any) {
      console.log(error);
    }
  };

  const fetchModePaye = async (enu_code: string) => {
    try {
      const query = new URLSearchParams();
      query.set("enu_code", enu_code);
      const res = await apiFetch(
        `/api/generate-enumeration/?${query.toString()}`,
      );

      if (res.success) {
        setModepayementEnum(res.nom_enumeration);
      }
    } catch (error: any) {
      console.log(error);
    }
  };

  const fetchCode = async (table_name: string, isInsert: boolean) => {
    try {
      const query = new URLSearchParams();
      query.set("table_name", table_name);
      query.set("is_insert", isInsert ? "1" : "0");
      const res = await apiFetch(
        `/api/generate-date-code/?${query.toString()}`,
      );

      if (res.success) {
        setVente((prev) => ({
          ...prev,
          vte_code: res.code,
        }));
      }
    } catch (error: any) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!open) return;

    if (skipSearch.current) {
      skipSearch.current = false;
      return;
    }

    const timerFrns = setTimeout(() => rechercherClient(searchClt), 300);
    return () => {
      clearTimeout(timerFrns);
    };
  }, [searchClt, open, rechercherClient]);

  useEffect(() => {
    if (!open) return;

    if (skipSearch.current) {
      skipSearch.current = false;
      return;
    }

    const timerFrns = setTimeout(() => rechercherProforma(searchProforma), 300);
    return () => {
      clearTimeout(timerFrns);
    };
  }, [searchProforma, open, rechercherProforma]);

  const clear = () => {
    setSearchClt("");
    setSearchProforma("");
    setClient(emptyClient);
    setProforma(emptyForm);
    setLigneArticle([]);
    setVente(emptyVente);
    fetchCode("t_vente", false);
  };

  const calculerEtStockerTotaux = () => {
    const result = calculerTotaux(ligneArticle);
    console.log(result);
    const today = new Date().toISOString().split("T")[0];

    setTotaux(result);
    console.log("here hre hre rerere =>", result);

    setVente((prev) => ({
      ...prev,
      vte_montant_ht: String(result.ht),
      vte_montant_ttc: String(result.ttc),
      vte_tva: result.tva,
      vte_date: today,
    }));

    return result;
  };

  const handleCreateMvtStock = async (mvt: any) => {
    try {
      const res = await postData("/api/insert-database/", "t_mvt_stock", {
        mvt_action: "delete",
        mvt_code_org: mvt.code_org,
        mvt_date: mvt.date,
        mvt_lot_code: mvt.lot_code,
        mvt_origine: mvt.origine,
        mvt_pri_id: mvt.pri_id,
        mvt_qte: mvt.qte,
        mvt_art_code: mvt.art_code,
      });
      if (!res.status) {
        throw new Error(`${res.error}`);
      }
      console.log(`Mvt stocker avec success ${res.message}`);
    } catch (err: any) {
      throw new Error(`${err.error}`);
    }
  };

  const handleStock = async (stk: any) => {
    try {
      const quantity = stk.old_stock + parseInt(stk.quantite);

      const res = await postData("/api/insert-database/", "t_stock", {
        stk_quantite: quantity,
        stk_pri_id: stk.pri_id,
        stk_art_code: stk.article,
        stk_lot_code: stk.lot_code,
      });
      if (!res.status) {
        throw new Error(`${res.error}`);
      }
      console.log(`Stoké avec success ${res.message}`);
    } catch (err: any) {
      throw new Error(`${err.error}`);
    }
  };

  const stockLot = async (data: any) => {
    try {
      const result = await deduireQuantiteLot(
        data.lot_id,
        data.lot_art_code,
        data.lot_quantite,
        data.operation
      );

      console.log("Déduction réussie :", result);
    } catch (error) {
      console.error(error);
      throw Error(`${error}`);
    }
  };

  const handleSubmit = async () => {
    try {
      console.log("here => ", vente);
      const totauxCalcules = calculerTotaux(ligneArticle);
      console.log("totaux calcue => ", totauxCalcules);
      if (ligneArticle.length == 0 || !vente || !client) {
        throw Error("Vous avz laisser des champs vides");
      }

      if (totauxCalcules.ttc === 0) {
        setAlert({
          open: true,
          message: "Le montant total HT doit être supérieur à 0.",
          title: "Montant invalide",
          variant: "error",
        });
        return;
      }
      const today = new Date().toISOString().split("T")[0];
      const resultats = await Promise.all(
        ligneArticle.map(async (value) => {
          console.log(value);
          try {
            const send = await postData(
              "/api/insert-database/",
              "t_ligne_vente",
              {
                vtel_quantite: value.vtel_quantite,
                vtel_pri_id: value.vtel_pri_id,
                vtel_vte_code: vente.vte_code,
                vtel_prixunit: value.vtel_prixunit,
                vtel_tva: value.vtel_tva,
                vtel_ht: value.vtel_ht,
                vtel_art_code: value.vtel_art_code,
                vtel_cli_code: client.cli_code,
                vtel_ttc: value.vtel_ttc,
                vtel_lot_dateper: value.vtel_dateper,
                vtel_lot_id: value.vtel_lot_id,
                vtel_remise: value.vtel_montant_remise,
              },
            );

            if (!send.status) {
              return false;
            }
            try {
              await handleStock({
                quantite: value.vtel_quantite,
                pri_id: value.vtel_pri_id,
                date: today,
                lot_code: value.vtel_lot_id,
                article: value.vtel_art_code,
                old_stock: value.vtel_quantite ?? 0,
              });

              await stockLot({
                lot_id: value.vtel_lot_id,
                lot_art_code: value.vtel_art_code,
                lot_quantite: value.vtel_quantite,
                operation: "sortie"
              });
            } catch (error) {
              console.error(error);
              return false;
            }
            return true;
          } catch (error) {
            console.error(
              "Erreur lors de l'enregistrement de la ligne :",
              value,
              error,
            );
            return false;
          }
        }),
      );
      const toutesLesLignesOK = resultats.every((result) => result === true);
      console.log("here => ", client);
      console.log("here => ", totaux);
      if (!toutesLesLignesOK) {
        setAlert({
          open: true,
          variant: "error",
          title: "Une erreur est survenue",
          message:
            "La vente a été enregistrer, mais une ou plusieurs lignes n'ont pas pu être enregistrées.",
        });
        return;
      }

      const res = await postData("/api/insert-database/", "t_vente", {
        vte_code: vente.vte_code,
        vte_date: vente.vte_date,
        vte_modepaye: vente.vte_modepaye,
        vte_montant_ht: totauxCalcules.ht,
        vte_montant_ttc: totauxCalcules.ttc,
        vte_tva: totauxCalcules.tva,
        vte_cli_code: client.cli_code,
        vte_cli_nom: client.cli_nom,
        vte_cli_contact: client.cli_tel1,
        vte_payeclient: vente.vte_payeclient || "16",
        vte_datepay: vente.vte_datepay || null,
        vte_telmoney: vente.vte_telmoney,
        vte_valide: false,
        vte_datevalide: null,
        vte_paye: false,
        vte_livreur: vente.vte_livreur,
        vet_operateur: vente.vet_operateur,
        vte_lettremontant: montantTTCEnLettres(totauxCalcules.ttc),
        ve_dateecheance: vente.vte_datepay || null,
        ve_code_bl: vente.ve_code_bl,
        ve_adresse_liv: client.cli_adresse,
        ve_proforma: proforma.pro_code || null,
      });

      if (proforma.pro_code) {
        const data: DataUpdate = {
          pro_enabled: true,
          pro_islivre: true,
          pro_usermdf: user?.use_login ?? "",
        };
        try {
          await mettreAJourDocument("proforma", proforma.pro_id, data);
        } catch (error: any) {
          console.error(
            `Une erreur est survenue lors de l'update de proforma ${error}`,
          );
        }
      }

      if (!res.status) {
        setAlert({
          open: true,
          variant: "error",
          title: "Une erreur est survenue",
          message: "Une erreur lors de l'enregistrement de la vente",
        });

        return;
      }

      /*
       * 4. Succès
       */
      fetchCode("t_vente", true);

      setAlert({
        open: true,
        variant: "success",
        title: "Opération réussie",
        message: "Vente enregistrée avec succès",
      });

      clear();
    } catch (error) {
      console.error("Erreur handleSubmit :", error);

      setAlert({
        open: true,
        variant: "error",
        title: "Une erreur est survenue",
        message: "Erreur lors de l'enregistrement dans la base de données.",
      });
    }
  };

  useEffect(() => {
    setVente((prev) => ({
      ...prev,
      vte_datepay: calculerDate(parseInt(vente.vte_payeclient)) || null,
    }));
  }, [vente.vte_payeclient]);

  useEffect(() => {
    fetchCode("t_vente", false);
    fetchPaye("PAYE_CLIENT");
    fetchModePaye("MODE_PAY");
    setVente((prev) => ({
      ...prev,
      vte_modepaye: "1",
      vte_datepay: today,
      ve_dateecheance: today,
    }));
  }, []);

  return (
    <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl p-4 dark:bg-gray-900 lg:p-11">
      <div className="px-2 pr-14 flex justify-between">
        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          Commande client
        </h4>
        <span className="dark:text-white/90">
          {Date().split(" ")[2]}/{Date().split(" ")[1]}/{Date().split(" ")[3]}
        </span>
      </div>
      <form className="flex flex-col">
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mb-2">
          <div>
            <Label>Piece N°</Label>
            <Input
              name="pieces"
              type="text"
              value={vente.vte_code}
              readonly={true}
            />
          </div>
          <div>
            <Label>Date de vente</Label>
            <Input
              name="vte_date"
              type="date"
              value={vente.vte_date}
              onChange={(e) =>
                setVente((prev) => ({
                  ...prev,
                  vte_date: e.target.value,
                }))
              }
              required={true}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mb-2">
          <div>
            <Label>Proforma</Label>
            <SearchableSelect<ListeVenteProforma>
              value={searchProforma}
              onChange={handleSearchChangeProforma}
              suggestions={suggestionsProforma}
              loading={loading}
              onSelect={choisirProforma}
              placeholder="Rechercher un proforma"
              noResultsText="Aucun proforma trouvé"
              getKey={(pro: ListeVenteProforma) => pro.pro_id}
              inputClassName={inputClass}
              renderItem={(pro: ListeVenteProforma) => (
                <div className="px-3 py-2">
                  <div className="text-sm font-medium text-gray-800 dark:text-white">
                    {pro?.client.cli_nom || ""}
                  </div>

                  <div className="truncate text-xs text-gray-500">
                    {pro?.pro_code || ""}
                  </div>

                  <div className="text-xs text-gray-400">
                    Crée le: {formatDate(pro?.pro_datecre) || ""}
                  </div>
                </div>
              )}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mb-2">
          <div>
            <Label>Client</Label>
            <SearchableSelect<Client>
              value={searchClt}
              onChange={handleSearchChangeClient}
              suggestions={suggestionsClient}
              loading={loading}
              onSelect={choisirClient}
              placeholder="Rechercher un client"
              noResultsText="Aucun article trouvé"
              getKey={(clt: Client) => clt.cli_id}
              inputClassName={inputClass}
              required={true}
              renderItem={(clt: Client) => (
                <div className="px-3 py-2">
                  <div className="text-sm font-medium text-gray-800 dark:text-white">
                    {clt.cli_nom}
                  </div>

                  <div className="truncate text-xs text-gray-500">
                    {clt.cli_code}
                  </div>

                  <div className="text-xs text-gray-400">
                    Crée le: {formatDate(clt.cli_datecre)}
                  </div>
                </div>
              )}
            />
          </div>
          {client.cli_id != 2 && (
            <div>
              <Label>Adrèsse</Label>
              <Input
                name="adresse"
                type="text"
                placeholder="L'adrèsse du client"
                value={client.cli_adresse}
                onChange={(e) => {
                  setClient((prev) => ({
                    ...prev,
                    cli_adresse: e.target.value,
                  }));
                }}
                className="w-full bg-transparent placeholder-white/70 outline-none"
              />
            </div>
          )}
        </div>
        {client.cli_id != 2 && (
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mb-4">
            <div>
              <Label>Contact 1</Label>
              <Input
                name="cli_tel1"
                type="text"
                value={client.cli_tel1}
                onChange={(e) => {
                  setClient((prev) => ({
                    ...prev,
                    cli_tel1: e.target.value,
                  }));
                }}
                placeholder="N° de tel 1"
                className="w-full bg-transparent placeholder-white/70 outline-none"
              />
            </div>
            <div>
              <Label>Contact 2</Label>
              <Input
                name="cli_tel2"
                type="text"
                value={client.cli_tel2}
                placeholder="N° de tel 2"
                onChange={(e) => {
                  setClient((prev) => ({
                    ...prev,
                    cli_tel2: e.target.value,
                  }));
                }}
                className="w-full bg-transparent placeholder-white/70 outline-none"
              />
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mb-4">
          {client.cli_id != 2 && (
            <div>
              <Label>Mail</Label>
              <Input
                name="email"
                type="text"
                value={client.cli_email}
                onChange={(e) => {
                  setClient((prev) => ({
                    ...prev,
                    cli_email: e.target.value,
                  }));
                }}
                placeholder="client@gmail.com"
                className="w-full bg-transparent placeholder-white/70 outline-none"
              />
            </div>
          )}

          <div>
            <Label>Paiement client</Label>
            <Select
              options={enumerationPaye}
              onChange={(value) =>
                setVente((prev) => ({
                  ...prev,
                  vte_payeclient: value,
                }))
              }
              defaultValue="16"
            />
          </div>
        </div>
        <div className="mb-4">
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
            {vente.vte_payeclient != "16" && (
              <div>
                <Label>Livreur</Label>
                <Input
                  name="livreur"
                  type="text"
                  value={vente.vte_livreur}
                  onChange={(e) => {
                    setVente((prev) => ({
                      ...prev,
                      vte_livreur: e.target.value,
                    }));
                  }}
                  placeholder="Nom du livreur"
                />
              </div>
            )}
            <div>
              <Label>Code BL</Label>
              <Input
                name="bl"
                type="text"
                value={vente.ve_code_bl}
                onChange={(e) => {
                  setVente((prev) => ({
                    ...prev,
                    ve_code_bl: e.target.value,
                  }));
                }}
                placeholder="Numéro du bon de livraison"
              />
            </div>
          </div>
        </div>
        <div className="mb-4">
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
            <div className="w-full">
              <Label>Mode de paiement</Label>
              <Select
                className="w-full"
                options={enumerationModePaye}
                onChange={(value) => {
                  setVente((prev) => ({
                    ...prev,
                    vte_modepaye: value,
                  }));
                }}
                defaultValue="1"
              />
            </div>

            {vente.vte_modepaye == "4" && (
              <div>
                <Label>Téléphone Mobile Money</Label>
                <Input
                  name="telMoney"
                  type="text"
                  value={vente.vte_telmoney}
                  onChange={(e) => {
                    setVente((prev) => ({
                      ...prev,
                      vte_telmoney: e.target.value,
                    }));
                  }}
                  placeholder="Numéro Mobile Money"
                />
              </div>
            )}
          </div>
        </div>
        <div className="mb-4">
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-3">
            {parseInt(vente.vte_payeclient) > 61 && (
              <div>
                <Label>Date d'échéance</Label>
                <Input
                  name="vte_datepay"
                  type="date"
                  value={vente.vte_datepay}
                  onChange={(e) => {
                    setVente((prev) => ({
                      ...prev,
                      vte_datepay: e.target.value,
                    }));
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <Label>Articles</Label>
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 mt-5">
          <div className="flex justify-center">
            <Button
              type="button"
              onClick={openGenericModal}
              className="
                      rounded-md
                      bg-blue-600
                      px-4 py-2
                      text-white
                    "
              title="Ajouter nouvelle article"
            >
              <FontAwesomeIcon icon={faPlus} />
            </Button>
          </div>

          <ListItems<VenteLigne>
            items={ligneArticle}
            columns={articleColumns}

            getKey={(article: VenteLigne) => article.vtel_art_code}

            onEdit={modifierArticle}

            onDelete={(item) => supprimerArticle(item.vtel_uid!)}

            onItemsChange={setLigneArticle}

            totals={[
              {
                label: "TOTAL HT",
                value: (items: VenteLigne[]) => calculerTotaux(items).ht,
                suffix: "Ar",
              },
              {
                label: "TOTAL REMISE",
                value: (items: VenteLigne[]) =>
                  calculerTotaux(items).remise * -1,
                suffix: "Ar",
              },
              {
                label: "TOTAL TVA",
                value: (items: VenteLigne[]) => calculerTotaux(items).tva,
                suffix: "Ar",
              },

              {
                label: "TOTAL TTC",
                value: (items: VenteLigne[]) => calculerTotaux(items).ttc,
                suffix: "Ar",
              },
            ]}
          />
        </div>
        <div className="flex justify-center w-full">
          <Button
            className="md:w-50 sm:w-auto md:mr-3"
            variant="primary"
            type="button"
            onClick={() => {
              calculerEtStockerTotaux();
              handleSubmit();
            }}
          >
            Enregistrer
          </Button>
          <Button variant="outline" onClick={clear}>
            Effacer tout
          </Button>
        </div>
      </form>
      <GenericArticleModal<VenteLigne, ArticleApi>
        open={modalOpen}
        article={article}
        emptyValue={emptyArticle}

        onClose={() => {
          setModalOpen(false);
          setArticle(null);
          setEditingUid(null);
        }}

        onSave={ajouterArticle}

        onSaveMultiple={ajouterArticles}

        searchConfig={articleSearchConfig}

        fields={articleFields}

        calculation={calculation}

        getArticleCode={(article) => article.vtel_art_code}

        getStock={(article) => Number(article.vtel_quantite_stock || 0)}

        getLots={(article, form) => {
          const quantiteDemandee = Number(form.vtel_quantite || 0);
          console.log("quantiteDemandee => ", quantiteDemandee);
          if (quantiteDemandee <= 0) {
            return [];
          }

          const aujourdHui = new Date();

          const lotsDisponibles = (article.lots ?? [])
            .filter((lot) => {
              const quantite = Number(lot.lot_quantite || 0);

              if (quantite <= 0) {
                return false;
              }

              if (!lot.lot_datePeremption) {
                return true;
              }

              return new Date(lot.lot_datePeremption) >= aujourdHui;
            })
            .sort((a, b) => {
              if (!a.lot_datePeremption) {
                return 1;
              }

              if (!b.lot_datePeremption) {
                return -1;
              }

              return (
                new Date(a.lot_datePeremption).getTime() -
                new Date(b.lot_datePeremption).getTime()
              );
            });

          let restant = quantiteDemandee;
          console.log("restant => ", restant);
          const allocations: LotAllocation[] = [];

          for (const lot of lotsDisponibles) {
            if (restant <= 0) {
              break;
            }

            const stock = Number(lot.lot_quantite || 0);

            const quantiteUtilisee = Math.min(restant, stock);

            if (quantiteUtilisee <= 0) {
              continue;
            }

            allocations.push({
              ...lot,
              quantiteUtilisee,
            });
            restant -= quantiteUtilisee;
          }

          return allocations;
        }}

        mapLotToLine={(form, lot) => {
          const quantite = Number(lot.quantiteUtilisee || 0);

          const prixUnit = Number(form.vtel_prixunit || 0);

          const tva = Number(form.vtel_tva || 0);

          const totalHT = quantite * prixUnit;

          const totalTTC = totalHT * (1 + tva / 100);

          return {
            ...form,

            vtel_quantite: quantite,

            vtel_lot: lot.lot_code || "",

            vtel_dateper: lot.lot_datePeremption || "",

            vtel_ht: totalHT,

            vtel_ttc: totalTTC,
            vtel_lot_id: lot.lot_id,
          };
        }}

        className="max-w-[900px] m-4 max-h-[700px]"

        titleCreate="Ajouter un article"
        titleEdit="Modifier l'article"
      />
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
    </div>
  );
}
