/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useCallback, useEffect } from "react";
import SearchableSelect from "../Home/modal/utils/searchableSelect";
import {
  ArticleApi,
  BCAutoComplete,
  CFLigneArticle,
  Enumeration,
  EnumerationOption,
} from "../../interfaces/interfaces";
import { Fourniseur } from "../../interfaces/interfaces";
import { apiFetch } from "../../services/api";
import { formatDate } from "../Home/modal/utils/utilsFucntions";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { useForm } from "../../hooks/useForm";
import Select from "../../components/form/Select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import ListItems, { ListColumn } from "../Home/modal/utils/listItems";
import Button from "../../components/ui/button/Button";
import GenericArticleModal, {
  ArticleCalculation,
  ArticleField,
  ArticleSearchConfig,
} from "../Home/modal/utils/articleGenericModal";
import { postData } from "../../services/sendDataService";
import Alert from "../../components/ui/alert/Alert";
import NewFrns from "../Fournisseurs/newFrns";

export default function NewLivFrnsPage() {
  const emptyFrns: Fourniseur = {
    fou_adresse: "",
    fou_code: "",
    fou_commercial: "",
    fou_datecre: "",
    fou_datemdf: "",
    fou_enabled: true,
    fou_id: 0,
    fou_mail: "",
    fou_modepay: "",
    fou_nom: "",
    fou_tel1: "",
    fou_tel2: "",
    fou_usercre: "",
    fou_usermdf: "",
  };
  const emptyBC: BCAutoComplete = {
    cmf_code: "",
    cmf_date: "",
    cmf_datecre: "",
    cmf_dateliv: "",
    cmf_datemdf: "",
    cmf_enabled: true,
    cmf_fou_code: "",
    cmf_id: 0,
    cmf_islivre: false,
    cmf_lettre: "",
    cmf_modecmd: "",
    cmf_montant_ht: 0,
    cmf_montant_ttc: 0,
    cmf_usercre: "",
    cmf_usermdf: "",
    fournisseur: emptyFrns,
    ligne: [],
  };

  const emptyArticle: CFLigneArticle = {
    art_nom: "",
    cmfl_Art_Code: "",
    cmfl_PrixAchat: 0,
    cmfl_Quantite: 0,
    cmfl_TotalHT: 0,
    cmfl_TotalTTC: 0,
    cmfl_Tva: 0,
    cmfl_cmf_code: "",
    cmfl_fou_Code: "",
    cmfl_pri_id: 0,
    cmfl_id: 0,
    cmfl_remise: 0,
    cmfl_uid: "",
    cmfl_lot: "",
    cmfl_datePer: "",
    cmfl_montant_remise: 0,
    cmfl_montant_tva: 0,
    cmfl_quantite_stock: 0,
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<BCAutoComplete>(emptyBC);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<BCAutoComplete[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const skipSearch = useRef(false); // évite de relancer une recherche après sélection
  const [highlight, setHighlight] = useState(-1);
  const requestId = useRef(0);
  const { values, reset, setField, handleChange } = useForm({
    codeBl: "",
    datePaiement: "",
    facture: "",
    modeCmd: "",
  });
  const [payementEnum, setpayementEnum] = useState<Enumeration[]>([]);
  const enumerationPaye: EnumerationOption[] = payementEnum.map(
    (item: Enumeration) => ({
      ...item,
      value: item.enu_id.toString(),
      label: item.enu_nom,
    }),
  );
  // list article
  const [article, setArticle] = useState<CFLigneArticle | null>(null);
  const [articles, setArticles] = useState<CFLigneArticle[]>([]);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [alert, setAlert] = useState({
    open: false,
    variant: "success" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
  });
  //open frns modal
  const [openModalFrns, setOpenModalFrns] = useState(false);
  const handleOpenModalFrns = () => {
    setOpenModalFrns(true);
  };
  const closeFrns = () => {
    setOpenModalFrns(false);
  };
  const [suggestionsFrns, setSuggestionsFrns] = useState<Fourniseur[]>([]);
  const [showSuggestionsFrns, setShowSuggestionsFrns] =
    useState<boolean>(false);
  const [searchFrns, setSearchFrns] = useState("");

  //end frnns ope modal
  const articleColumns: ListColumn<CFLigneArticle>[] = [
    {
      label: "Code Article",
      mobilePrimary: true,
      render: (article) => (
        <div>
          <strong>{article.cmfl_Art_Code}</strong>

          <div className="text-sm text-gray-500">{article.art_nom}</div>
        </div>
      ),
    },

    {
      label: "Quantité",
      render: (article) => article.cmfl_Quantite,
    },

    {
      label: "TVA (Ar)",
      render: (article) =>
        Number(article.cmfl_montant_tva).toLocaleString("fr-FR"),
    },

    {
      label: "P.U",
      render: (article) => (
        <>{Number(article.cmfl_PrixAchat).toLocaleString("fr-FR")} Ar</>
      ),
    },

    {
      label: "Date Per",
      render: (article) => (article.cmfl_datePer ? article.cmfl_datePer : "-"),
    },

    {
      label: "HT",
      mobilePrimary: true,
      render: (article) => (
        <strong>
          {Number(article.cmfl_TotalHT).toLocaleString("fr-FR")} Ar
        </strong>
      ),
    },
    {
      label: "Remise (Ar)",
      mobilePrimary: true,
      render: (article) => (
        <strong>
          {article.cmfl_montant_remise
            ? Number(article.cmfl_montant_remise).toLocaleString("fr-FR")
            : "0"}{" "}
          Ar
        </strong>
      ),
    },
  ];

  const modifierArticle = (articleSelectionne: CFLigneArticle) => {
    setArticle({ ...articleSelectionne });
    setEditingUid(articleSelectionne.cmfl_uid ?? null);
    setModalOpen(true);
  };

  const supprimerArticle = (uid: string) => {
    setForm((prev) => ({
      ...prev,
      ligne: prev.ligne.filter((item) => item.cmfl_uid !== uid),
    }));

    // Si on supprimait l'article actuellement en modification
    if (editingUid === uid) {
      setEditingUid(null);
      setArticle(null);
      setModalOpen(false);
    }
  };

  // end list article
  const inputClass = `
    h-10 w-full rounded-md border border-gray-300 px-3 text-sm
    outline-none focus:border-blue-500
    dark:border-gray-600 dark:bg-gray-800 dark:text-white
  `;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setShowSuggestions(true);

    // L'article n'est plus considéré comme validé tant qu'on tape
    setForm((prev) => ({
      ...prev,
      cmf_code: "",
      cmf_id: 0,
    }));
  };

  const handleSearchChangeFrns = (value: string) => {
    setSearchFrns(value);
    setShowSuggestionsFrns(true);

    // L'article n'est plus considéré comme validé tant qu'on tape
    setForm((prev) => ({
      ...prev,
      fournisseur: emptyFrns,
    }));
  };

  const choisirArticle = (a: BCAutoComplete) => {
    skipSearch.current = true;
    setSearch(a.cmf_code);

    setForm((prev) => ({
      ...prev,

      cmf_id_id: String(a.cmf_id),
      cmf_code: a.cmf_code,
      cmf_datecre: a.cmf_datecre,
      cmf_datemdf: a.cmf_datemdf,
      cmf_usercre: a.cmf_usercre,
      cmf_usermdf: a.cmf_usermdf,
      cmf_date: a.cmf_date,
      cmf_modecmd: a.cmf_modecmd,
      cmf_dateliv: a.cmf_dateliv,
      cmf_enabled: a.cmf_enabled,
      cmf_montant_ht: Number(a.cmf_montant_ht ?? 0),
      cmf_montant_ttc: Number(a.cmf_montant_ttc ?? 0),
      cmf_islivre: a.cmf_islivre,
      cmf_fou_code: a.cmf_fou_code,
      cmf_lettre: a.cmf_lettre,
      fournisseur: {
        ...a.fournisseur,
      },

      ligne: a.ligne.map((item) => ({
        ...item,
        cmfl_Quantite: Number(item.cmfl_Quantite ?? 0),
        cmfl_PrixAchat: Number(item.cmfl_PrixAchat ?? 0),
        cmfl_Tva: Number(item.cmfl_Tva ?? 0),
        cmfl_TotalHT: Number(item.cmfl_TotalHT ?? 0),
        cmfl_TotalTTC: Number(item.cmfl_TotalTTC ?? 0),
        cmfl_pri_id: Number(item.cmfl_pri_id ?? 0),
        cmfl_uid:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
        cmfl_datePer: "",
        cmfl_id: item.cmfl_id,
      })),
    }));
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlight(-1);
  };

  //new frns
  const choisirFrns = (a: Fourniseur) => {
    skipSearch.current = true;
    setSearchFrns(a.fou_nom);
    console.log(a);
    setForm((prev) => ({
      ...prev,
      fournisseur: {
        ...a,
      },
    }));
    setSuggestionsFrns([]);
    setShowSuggestions(false);
    setHighlight(-1);
  };

  const rechercherArticle = useCallback(async (code: string) => {
    const currentId = ++requestId.current;

    if (!code.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setLoading(true);
      const query = new URLSearchParams();
      query.set("search", code);

      const res = await apiFetch(
        `/api/cmf-fournis-autocomplete/?${query.toString()}`,
      );

      if (currentId !== requestId.current) return; // réponse obsolète

      if (res.status) {
        setSuggestions(res.cmf_fournis ?? []);
        setShowSuggestions(true);
        setHighlight(-1);
      }
    } catch (err) {
      console.error(err);
      if (currentId === requestId.current) setSuggestions([]);
    } finally {
      if (currentId === requestId.current) setLoading(false);
    }
  }, []);

  const rechercherFrns = useCallback(async (code: string) => {
    const currentId = ++requestId.current;

    if (!code.trim()) {
      setSuggestionsFrns([]);
      setShowSuggestionsFrns(false);
      return;
    }

    try {
      setLoading(true);

      const query = new URLSearchParams();
      query.set("search", code);

      const res = await apiFetch(`/api/fournisseurs/?${query.toString()}`);

      // La réponse n'est plus la plus récente
      if (currentId !== requestId.current) return;

      if (res.status) {
        setSuggestionsFrns(res.fournisseur ?? []);
        setShowSuggestionsFrns(true);
        setHighlight(-1);
      }
    } catch (err) {
      console.error(err);

      if (currentId === requestId.current) {
        setSuggestionsFrns([]);
        setShowSuggestionsFrns(false);
      }
    } finally {
      if (currentId === requestId.current) {
        setLoading(false);
      }
    }
  }, []);

  const fetchCode = async (table_name: string, isInsert: boolean) => {
    try {
      const query = new URLSearchParams();
      query.set("table_name", table_name);
      query.set("is_insert", isInsert ? "1" : "0");
      const res = await apiFetch(
        `/api/generate-date-code/?${query.toString()}`,
      );

      if (res.success) {
        setField("codeBl", res.code);
      }
    } catch (error: any) {
      console.log(error);
    }
  };

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

  const handleFournisseurChange = (
    field: keyof Fourniseur,
    value: string | number,
  ) => {
    setForm((prev) => ({
      ...prev,
      fournisseur: {
        ...prev.fournisseur,
        [field]: value,
      },
    }));
  };

  const ajouterArticle = (nouvelArticle: CFLigneArticle) => {
    console.log("Article reçu :", nouvelArticle);
    console.log("Mode :", editingUid ? "MODIFICATION" : "AJOUT");
    console.log(editingUid);

    setForm((prev) => {
      // =====================================================
      // 1. MODIFICATION D'UNE LIGNE EXISTANTE
      // =====================================================
      if (editingUid) {
        return {
          ...prev,
          ligne: prev.ligne.map((item) =>
            item.cmfl_uid === editingUid
              ? {
                  ...item,
                  ...nouvelArticle,

                  // On conserve l'UID de la ligne existante
                  cmfl_uid: editingUid,

                  // On conserve les informations du BC
                  cmfl_cmf_code: prev.cmf_code,
                  cmfl_fou_Code: prev.cmf_fou_code,
                  cmfl_id: nouvelArticle.cmfl_id,

                  // Normalisation
                  cmfl_pri_id: Number(nouvelArticle.cmfl_pri_id || 0),
                  cmfl_Quantite: Number(nouvelArticle.cmfl_Quantite || 0),
                  cmfl_PrixAchat: Number(nouvelArticle.cmfl_PrixAchat || 0),
                  cmfl_Tva: Number(nouvelArticle.cmfl_Tva || 0),
                  cmfl_TotalHT: Number(nouvelArticle.cmfl_TotalHT || 0),
                  cmfl_TotalTTC: Number(nouvelArticle.cmfl_TotalTTC || 0),
                  cmfl_datePer: nouvelArticle.cmfl_datePer || "",
                  cmfl_remise: nouvelArticle.cmfl_remise,
                }
              : item,
          ),
        };
      }

      // =====================================================
      // 2. AJOUT D'UNE NOUVELLE LIGNE
      // =====================================================

      const newArticle: CFLigneArticle = {
        ...nouvelArticle,
        // Nouvel UID uniquement pour cette nouvelle ligne
        cmfl_uid:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,

        // Informations du BC
        cmfl_cmf_code: prev.cmf_code,
        cmfl_fou_Code: prev.cmf_fou_code,
        cmfl_id: nouvelArticle.cmfl_id,

        // Normalisation
        cmfl_pri_id: Number(nouvelArticle.cmfl_pri_id || 0),
        cmfl_Quantite: Number(nouvelArticle.cmfl_Quantite || 0),
        cmfl_PrixAchat: Number(nouvelArticle.cmfl_PrixAchat || 0),
        cmfl_Tva: Number(nouvelArticle.cmfl_Tva || 0),
        cmfl_TotalHT: Number(nouvelArticle.cmfl_TotalHT || 0),
        cmfl_TotalTTC: Number(nouvelArticle.cmfl_TotalTTC || 0),
        cmfl_datePer: nouvelArticle.cmfl_datePer || "",
        cmfl_remise: nouvelArticle.cmfl_remise || 0,
      };

      return {
        ...prev,
        ligne: [...prev.ligne, newArticle],
      };
    });

    // Fermer le modal
    setModalOpen(false);

    // Réinitialiser l'article sélectionné
    setArticle(null);

    // IMPORTANT : réinitialiser le mode édition
    setEditingUid(null);
  };

  // Article Modal
  const articleFields: ArticleField<CFLigneArticle>[] = [
    {
      name: "art_nom",
      label: "Désignation",
      type: "text",
      placeholder: "Désignation de l'article",
      className: "md:col-span-7",
    },

    {
      name: "cmfl_Quantite",
      label: "Quantité",
      type: "number",
      min: 0,
      parseValue: Number,
    },

    {
      name: "cmfl_PrixAchat",
      label: "Prix unitaire",
      type: "number",
      min: 0,
    },
    {
      name: "cmfl_montant_tva",
      label: "TVA (Ar)",
      type: "number",
      min: 0,
      step: 0.01,
      parseValue: Number,
    },
    {
      name: "cmfl_remise",
      label: "Remise (%)",
      type: "number",
      min: 0,
      step: 0.01,
      parseValue: Number,
    },
    {
      name: "cmfl_datePer",
      label: "Date de Péremption",
      type: "date",
      parseValue: String,
    },
    {
      name: "cmfl_TotalHT",
      label: "Total HT",
      type: "text",
      readOnly: true,
      getValue: (article: CFLigneArticle) =>
        `${Number(article.cmfl_TotalHT).toLocaleString("fr-FR")} Ar`,
    },
  ];

  const articleSearchConfig: ArticleSearchConfig<CFLigneArticle, ArticleApi> = {
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

    getLots: (article) => [],

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

      cmfl_id: article.id,

      cmfl_Art_Code: article.code,

      art_nom: article.nom_article,

      cmfl_PrixAchat: article.prix_ht ?? 0,

      cmfl_Tva: Number(article.pri_tva ?? 0),

      cmfl_montant_tva:
        (Number(article.pri_tva ?? 0) * Number(article.prix_ht ?? 0)) / 100,

      cmfl_TotalHT: 0,

      cmfl_lot: "",

      cmfl_datePer: "",
      cmfl_remise: 0,
      cmfl_montant_remise: 0,
      cmfl_quantite_stock: article.quantite_stock,
      cmfl_uid:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,
    }),
  };

  const calculation: ArticleCalculation<CFLigneArticle> = {
    calculate: (form) => {
      const quantite = Number(form.cmfl_Quantite) || 0;

      const pua = Number(form.cmfl_PrixAchat) || 0;

      const remise = Number(form.cmfl_remise) || 0;

      const totalBrut = quantite * pua;

      const montantRemise = totalBrut * (remise / 100);

      const totalHT = totalBrut - montantRemise;

      const tva = totalHT * (Number(form.cmfl_Tva) / 100);

      const totalTTC = totalHT + tva;

      return {
        cmfl_TotalHT: totalHT,
        cmfl_montant_tva: tva,
        cmfl_TotalTTC: totalTTC,
        cmfl_montant_remise: montantRemise,
      };
    },
  };

  // End Article Modal
  // on Submit

  const stockLot = async (data: any) => {
    const res = await postData("/api/insert-database/", "t_lot", {
      lot_enabled: true,
      lot_code: data.pri_lot,
      lot_dateper: data.pri_datePeremption,
      lot_art_quantite: data.pri_quantite,
      lot_art_code: data.pri_article,
    });
    return res.id;
  };

  const handleCreateMvtStock = async (mvt: any) => {
    try {
      console.log(`mvt ${mvt}`);
      const res = await postData("/api/insert-database/", "t_mvt_stock", {
        mvt_action: "insert",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.log(form);
      if (!form.ligne || form.ligne.length === 0) {
        setAlert({
          open: true,
          message: "Veuillez ajouter au moins un article.",
          title: "Aucune ligne",
          variant: "error",
        });
        return;
      }

      if (calculation.calculate(form.ligne).cmfl_TotalTTC === 0) {
        setAlert({
          open: true,
          message: "Le montant total HT doit être supérieur à 0.",
          title: "Montant invalide",
          variant: "error",
        });
        return;
      }

      const today = new Date().toISOString().split("T")[0];

      const res = await postData("/api/insert-database/", "t_entree", {
        ent_code: values.codeBl,
        ent_modepaye: values.modeCmd ?? "0",
        ent_datepay: values.datePaiement,
        ent_montant_ht: Math.round(form.cmf_montant_ht),
        ent_montant_ttc: Math.round(form.cmf_montant_ttc),
        ent_fou_code: form.cmf_fou_code,
        ent_date: today,
        ent_facture: values.facture,
        ent_cmf_code: form.cmf_code,
        ent_is_paye: false,
      });

      if (!res.status) {
        setAlert({
          open: true,
          message: res.error,
          title: "Une erreur est survenue",
          variant: "error",
        });
        return;
      }

      /*
       * 2. Enregistrement de toutes les lignes
       */
      const resultats = await Promise.all(
        form.ligne.map(async (value) => {
          console.log(value);
          try {
            /*
             * Création du lot
             */
            const lot_id = await stockLot({
              pri_lot: value.cmfl_uid || "",
              pri_datePeremption: value.cmfl_datePer || "",
              pri_quantite: value.cmfl_Quantite,
              pri_article: value.cmfl_Art_Code,
            });
            // /*
            //  * Création de la ligne d'entrée
            //  */
            const send = await postData(
              "/api/insert-database/",
              "t_ligne_entree",
              {
                entl_quantite: value.cmfl_Quantite,
                entl_pri_id: value.cmfl_pri_id,

                // Code de l'entrée principale
                entl_ent_code: values.codeBl,

                entl_prixunit: value.cmfl_PrixAchat,
                entl_tva: value.cmfl_Tva,
                entl_ht: value.cmfl_TotalHT,

                entl_art_code: value.cmfl_Art_Code,

                /*
                 * IMPORTANT :
                 * Le fournisseur vient de la ligne.
                 */
                entl_fou_code: value.cmfl_fou_Code,

                entl_ttc: value.cmfl_TotalTTC,

                entl_dateper: value.cmfl_datePer,
                entl_prix: value.cmfl_PrixAchat,

                entl_remise: value.cmfl_remise ?? 0,

                entl_lot: lot_id,
              },
            );

            if (!send.status) {
              return false;
            }

            /*
             * Mouvement de stock
             */
            await handleCreateMvtStock({
              code_org: form.cmf_code,
              date: today,
              lot_code: lot_id,
              origine: "t_entree_stock",
              pri_id: value.cmfl_pri_id,
              qte: value.cmfl_Quantite,
              art_code: value.cmfl_Art_Code,
            });
            /*
             * Mise à jour du stock
             */
            await handleStock({
              quantite: value.cmfl_Quantite,
              pri_id: value.cmfl_pri_id,
              date: today,
              lot_code: lot_id,
              article: value.cmfl_Art_Code,
              old_stock: value.cmfl_quantite_stock ?? 0,
            });

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

      /*
       * 3. Vérifier toutes les lignes
       */
      const toutesLesLignesOK = resultats.every((result) => result === true);

      if (!toutesLesLignesOK) {
        setAlert({
          open: true,
          variant: "error",
          title: "Une erreur est survenue",
          message:
            "La livraison a été créée, mais une ou plusieurs lignes n'ont pas pu être enregistrées.",
        });

        return;
      }

      /*
       * 4. Succès
       */
      fetchCode("t_entree", true);

      setAlert({
        open: true,
        variant: "success",
        title: "Opération réussie",
        message: "Entree enregistrée avec succès",
      });

      clear()
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

  const openGenericModal = () => {
    setArticle(null);
    console.log(emptyArticle);
    setModalOpen(true);
    setEditingUid(null);
  };

  // on submit end
  const clear = () => {
    setSearch("");
    setSearchFrns("");
    setArticles([]);
    setForm(emptyBC);
    reset();
    fetchCode("t_entree", false);
  };

  useEffect(() => {
    fetchCode("t_entree", false);
    fetchPaye("MODE_PAY");
    setField("modeCmd", "1");
  }, []);

  useEffect(() => {
    if (!open) return;

    if (skipSearch.current) {
      skipSearch.current = false;
      return;
    }

    const timer = setTimeout(() => rechercherArticle(search), 300);
    return () => {
      clearTimeout(timer);
    };
  }, [search, open, rechercherArticle]);

  useEffect(() => {
    if (!open) return;

    if (skipSearch.current) {
      skipSearch.current = false;
      return;
    }

    const timerFrns = setTimeout(() => rechercherFrns(searchFrns), 300);
    return () => {
      clearTimeout(timerFrns);
    };
  }, [searchFrns, open, rechercherFrns]);

  return (
    <div>
      <div>
        <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14 flex justify-between">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Ajout livraisons fournisseur
            </h4>
            <span className="dark:text-white/90">
              {Date().split(" ")[2]}/{Date().split(" ")[1]}/
              {Date().split(" ")[3]}
            </span>
          </div>
          <form className="flex flex-col" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mb-2">
              <div>
                <Label>Piece N°</Label>
                <Input
                  name="codeBl"
                  type="text"
                  value={values.codeBl}
                  onChange={handleChange}
                  readonly={true}
                />
              </div>
              <div>
                <Label>Date de paiements</Label>
                <Input
                  name="datePaiement"
                  type="date"
                  value={values.datePaiement}
                  onChange={handleChange}
                  required={true}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mb-2">
              <div>
                <Label>Code CF</Label>
                <SearchableSelect<BCAutoComplete>
                  value={search}
                  onChange={handleSearchChange}
                  suggestions={suggestions}
                  loading={loading}
                  onSelect={choisirArticle}
                  placeholder="Numéro CF"
                  noResultsText="Aucun article trouvé"
                  getKey={(cmf: BCAutoComplete) => cmf.cmf_id}
                  inputClassName={inputClass}
                  renderItem={(cmf: BCAutoComplete) => (
                    <div className="px-3 py-2">
                      <div className="text-sm font-medium text-gray-800 dark:text-white">
                        {cmf.fournisseur.fou_nom}
                      </div>

                      <div className="truncate text-xs text-gray-500">
                        {cmf.cmf_code}
                      </div>

                      <div className="text-xs text-gray-400">
                        Crée le: {formatDate(cmf.cmf_datecre)}
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mb-2">
              <div>
                <Label>Nom Fournisseur</Label>
                <div className="flex items-center w-full gap-2 flex-nowrap">
                  <div className="grid grid-cols-[1fr_auto] gap-2 w-full">
                    <div>
                      <SearchableSelect<Fourniseur>
                        value={searchFrns}
                        onChange={handleSearchChangeFrns}
                        suggestions={suggestionsFrns}
                        loading={loading}
                        onSelect={choisirFrns}
                        placeholder="Rechercher fournisseur"
                        noResultsText="Aucun article trouvé"
                        getKey={(frn: Fourniseur) => frn.fou_id}
                        inputClassName={inputClass}
                        renderItem={(frn: Fourniseur) => (
                          <div className="px-3 py-2">
                            <div className="text-sm font-medium text-gray-800 dark:text-white">
                              {frn.fou_nom}
                            </div>

                            <div className="truncate text-xs text-gray-500">
                              {frn.fou_code}
                            </div>

                            <div className="text-xs text-gray-400">
                              Crée le: {formatDate(frn.fou_datecre)}
                            </div>
                          </div>
                        )}
                      />
                    </div>
                    <Button
                      variant="outline"
                      title="Ajouter nouveau fournisseur"
                      onClick={() => handleOpenModalFrns()}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label>Adrèsse</Label>
                <Input
                  name="adresse"
                  type="text"
                  placeholder="L'adrèsse du fournisseur"
                  value={form.fournisseur.fou_adresse}
                  onChange={(e) =>
                    handleFournisseurChange("fou_adresse", e.target.value)
                  }
                  className="w-full bg-transparent placeholder-white/70 outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mb-4">
              <div>
                <Label>Contact 1</Label>
                <Input
                  name="contact1"
                  type="text"
                  value={form.fournisseur.fou_tel1}
                  onChange={(e) =>
                    handleFournisseurChange("fou_tel1", e.target.value)
                  }
                  placeholder="N° de tel 1"
                  className="w-full bg-transparent placeholder-white/70 outline-none"
                />
              </div>
              <div>
                <Label>Contact 2</Label>
                <Input
                  name="contact2"
                  type="text"
                  value={form.fournisseur.fou_tel2}
                  placeholder="N° de tel 2"
                  onChange={(e) =>
                    handleFournisseurChange("fou_tel2", e.target.value)
                  }
                  className="w-full bg-transparent placeholder-white/70 outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mb-4">
              <div>
                <Label>Mail</Label>
                <Input
                  name="contact1"
                  type="text"
                  value={form.fournisseur.fou_mail}
                  onChange={(e) =>
                    handleFournisseurChange("fou_mail", e.target.value)
                  }
                  placeholder="N° de tel 1"
                  className="w-full bg-transparent placeholder-white/70 outline-none"
                />
              </div>
              <div>
                <Label>Mode de paiement</Label>
                <Select
                  options={enumerationPaye}
                  onChange={(value) => setField("modeCmd", value)}
                  defaultValue="espèce"
                ></Select>
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

              <ListItems<CFLigneArticle>
                items={form.ligne}
                columns={articleColumns}

                getKey={(article: CFLigneArticle) => article.cmfl_Art_Code}

                onEdit={modifierArticle}

                onDelete={(item) => supprimerArticle(item.cmfl_uid!)}

                onItemsChange={setArticles}

                totals={[
                  {
                    label: "TOTAL HT",
                    value: (items: CFLigneArticle[]) =>
                      items.reduce(
                        (total, article) =>
                          total + Number(article.cmfl_TotalHT || 0),
                        0,
                      ),
                    suffix: "Ar",
                  },

                  {
                    label: "TOTAL TVA",
                    value: (items: CFLigneArticle[]) =>
                      items.reduce(
                        (total, article) =>
                          total + Number(article.cmfl_montant_tva || 0),
                        0,
                      ),
                    suffix: "Ar",
                  },

                  {
                    label: "TOTAL TTC",
                    value: (items: CFLigneArticle[]) =>
                      items.reduce(
                        (total, article) =>
                          total +
                          Number(article.cmfl_TotalHT || 0) +
                          Number(article.cmfl_Tva || 0),
                        0,
                      ),
                    suffix: "Ar",
                  },
                ]}
              />
            </div>
            <div className="flex justify-center w-full">
              <Button
                className="md:w-50 sm:w-auto md:mr-3"
                variant="primary"
                type="submit"
              >
                Valider
              </Button>
              <Button variant="outline" onClick={clear}>
                Effacer tout
              </Button>
            </div>
          </form>
        </div>
      </div>
      <GenericArticleModal<CFLigneArticle, ArticleApi>
        open={modalOpen}
        article={article}
        emptyValue={emptyArticle}
        onClose={() => setModalOpen(false)}
        onSave={ajouterArticle}
        className="max-w-[900px] m-4 max-h-[700px]"

        searchConfig={articleSearchConfig}

        fields={articleFields}

        calculation={calculation}

        getArticleCode={(article) => article.cmfl_Art_Code}
        getStock={(article) => article.cmfl_quantite_stock ?? 0}
        validate={(form) => {
          if (!form.cmfl_Art_Code || !form.cmfl_uid) {
            return "Veuillez sélectionner un article dans la liste.";
          }

          if (Number(form.cmfl_Quantite) <= 0) {
            return "La quantité doit être supérieure à 0.";
          }

          if (Number(form.cmfl_PrixAchat) < 0) {
            return "Le prix unitaire est invalide.";
          }

          return null;
        }}

        renderFooter={(form) => (
          <div className="flex items-center">
            <span className="mr-2 dark:text-white">TTC :</span>

            <span className="text-green-600">
              <strong>
                {Number(form.cmfl_TotalTTC).toLocaleString("fr-FR")} Ar
              </strong>
            </span>

            <span className="ml-2 dark:text-white">| Remise :</span>

            <span className="ml-2 text-red-600">
              <strong>
                {Number(form.cmfl_montant_remise).toLocaleString("fr-FR")} Ar
              </strong>
            </span>
          </div>
        )}
      />
      <NewFrns isOpen={openModalFrns} onClose={closeFrns}></NewFrns>
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
