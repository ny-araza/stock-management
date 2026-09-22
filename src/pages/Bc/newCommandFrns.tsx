/* eslint-disable @typescript-eslint/no-explicit-any */

import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import {
  ArticleApi,
  BC,
  CFLigneArticle,
  Enumeration,
  EnumerationOption,
} from "../../interfaces/interfaces";
import { useState, useRef, useEffect, useCallback } from "react";
import { Fourniseur } from "../../interfaces/interfaces";
import SearchableSelect from "../Home/modal/utils/searchableSelect";
import { formatDate } from "../Home/modal/utils/utilsFucntions";
import { apiFetch } from "../../services/api";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlug, faPlus } from "@fortawesome/free-solid-svg-icons";
import ListItems, { ListColumn } from "../Home/modal/utils/listItems";
import GenericArticleModal, {
  ArticleCalculation,
  ArticleField,
  ArticleSearchConfig,
} from "../Home/modal/utils/articleGenericModal";
import NewFrns from "../Fournisseurs/newFrns";
import montantTTCEnLettres from "../../utils/montantEnLettre";
import { postData } from "../../services/sendDataService";
import Alert from "../../components/ui/alert/Alert";

export default function NewCmdFrnsPage() {
  const emptyBC: BC = {
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

  const [frns, setFrns] = useState<Fourniseur>(emptyFrns);
  const [form, setForm] = useState<BC>(emptyBC);
  const [ligneArticle, setLigneArticle] = useState<CFLigneArticle[]>([]);

  const [searchFrns, setSearchFrns] = useState("");
  const [showSuggestionsFrns, setShowSuggestionsFrns] =
    useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsFrns, setSuggestionsFrns] = useState<Fourniseur[]>([]);
  const [loading, setLoading] = useState(false);
  const skipSearch = useRef(false);
  const requestId = useRef(0);
  const [highlight, setHighlight] = useState(-1);
  const handleSearchChangeFrns = (value: string) => {
    setSearchFrns(value);
    setShowSuggestionsFrns(true);
    setFrns(emptyFrns);
  };
  const [openModalFrns, setOpenModalFrns] = useState(false);
  const [commandeEnum, setCommandEnum] = useState<Enumeration[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [article, setArticle] = useState<CFLigneArticle | null>(null);
  const enumerationCmd: EnumerationOption[] = commandeEnum.map(
    (item: Enumeration) => ({
      ...item,
      value: item.enu_id.toString(),
      label: item.enu_nom,
    }),
  );
  const [alert, setAlert] = useState({
    open: false,
    variant: "success" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
  });

  const inputClass = `
    h-10 w-full rounded-md border border-gray-300 px-3 text-sm
    outline-none focus:border-blue-500
    dark:border-gray-600 dark:bg-gray-800 dark:text-white
  `;

  const choisirFrns = (a: Fourniseur) => {
    skipSearch.current = true;
    setSearchFrns(a.fou_nom);
    setFrns(a);
    setSuggestionsFrns([]);
    setShowSuggestions(false);
    setHighlight(-1);
  };

  const fetchCommande = async (enu_code: string) => {
    try {
      const query = new URLSearchParams();
      query.set("enu_code", enu_code);
      const res = await apiFetch(
        `/api/generate-enumeration/?${query.toString()}`,
      );

      if (res.success) {
        setCommandEnum(res.nom_enumeration);
      }
    } catch (error: any) {
      console.log(error);
    }
  };

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
    // setLigneArticle((prev) => ({
    //   ...prev,
    //   ligne: prev.filter((item) => item.cmfl_uid !== uid),
    // }));
    // // Si on supprimait l'article actuellement en modification
    // if (editingUid === uid) {
    //   setEditingUid(null);
    //   setArticle(null);
    //   setModalOpen(false);
    // }
  };

  const ajouterArticle = (nouvelArticle: CFLigneArticle) => {
    console.log("Article reçu :", nouvelArticle);
    console.log("Mode :", editingUid ? "MODIFICATION" : "AJOUT");
    console.log("UID :", editingUid);

    setLigneArticle((prev) => {
      // =====================================================
      // 1. MODIFICATION D'UNE LIGNE EXISTANTE
      // =====================================================
      if (editingUid) {
        return prev.map((item) =>
          item.cmfl_uid === editingUid
            ? {
                ...item,
                ...nouvelArticle,

                // Conserver l'UID de la ligne existante
                cmfl_uid: editingUid,

                // Normalisation
                cmfl_pri_id: Number(nouvelArticle.cmfl_pri_id || 0),
                cmfl_Quantite: Number(nouvelArticle.cmfl_Quantite || 0),
                cmfl_PrixAchat: Number(nouvelArticle.cmfl_PrixAchat || 0),
                cmfl_Tva: Number(nouvelArticle.cmfl_Tva || 0),
                cmfl_TotalHT: Number(nouvelArticle.cmfl_TotalHT || 0),
                cmfl_TotalTTC: Number(nouvelArticle.cmfl_TotalTTC || 0),

                cmfl_datePer: nouvelArticle.cmfl_datePer || "",
                cmfl_remise: nouvelArticle.cmfl_remise || 0,
                cmfl_montant_remise: nouvelArticle.cmfl_montant_remise || 0,
                cmfl_quantite_stock: nouvelArticle.cmfl_quantite_stock || 0,

                // Valeur par défaut du lot
                cmfl_lot: nouvelArticle.cmfl_lot || "",
              }
            : item,
        );
      }

      // =====================================================
      // 2. AJOUT D'UNE NOUVELLE LIGNE
      // =====================================================

      const newArticle: CFLigneArticle = {
        ...nouvelArticle,

        // Générer un nouvel UID
        cmfl_uid:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,

        // Normalisation
        cmfl_pri_id: Number(nouvelArticle.cmfl_pri_id || 0),
        cmfl_Quantite: Number(nouvelArticle.cmfl_Quantite || 0),
        cmfl_PrixAchat: Number(nouvelArticle.cmfl_PrixAchat || 0),
        cmfl_Tva: Number(nouvelArticle.cmfl_Tva || 0),
        cmfl_TotalHT: Number(nouvelArticle.cmfl_TotalHT || 0),
        cmfl_TotalTTC: Number(nouvelArticle.cmfl_TotalTTC || 0),

        cmfl_datePer: nouvelArticle.cmfl_datePer || "",
        cmfl_remise: nouvelArticle.cmfl_remise || 0,
        cmfl_montant_remise: nouvelArticle.cmfl_montant_remise || 0,
        cmfl_quantite_stock: nouvelArticle.cmfl_quantite_stock || 0,

        // Valeur par défaut
        cmfl_lot: nouvelArticle.cmfl_lot || "",
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

  const openGenericModal = () => {
    setArticle(null);
    console.log(emptyArticle);
    setModalOpen(true);
    setEditingUid(null);
  };

  const fetchCode = async (table_name: string, isInsert: boolean) => {
    try {
      const query = new URLSearchParams();
      query.set("table_name", table_name);
      query.set("is_insert", isInsert ? "1" : "0");
      console.log(query.toString());
      const res = await apiFetch(
        `/api/generate-date-code/?${query.toString()}`,
      );

      if (res.success) {
        setForm((prev) => ({
          ...prev,
          cmf_code: res.code,
        }));
      }
    } catch (error: any) {
      console.log(error);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const ligne_ok: boolean[] = [];
      if (ligneArticle.length == 0 || !form || !frns) {
        throw Error("Vous avz laisser des champs vides");
      }
      const total_remise = ligneArticle.reduce(
        (total, article) => total + Number(article.cmfl_montant_remise || 0),
        0,
      );
      const ht =
        ligneArticle.reduce(
          (total, article) => total + Number(article.cmfl_TotalHT || 0),
          0,
        ) - total_remise || 0;
      const ttc = ligneArticle.reduce(
        (total, article) =>
          total +
          Number(article.cmfl_TotalHT || 0) +
          Number(article.cmfl_montant_tva || 0),
        0,
      );
      if (ttc === 0) {
        setAlert({
          open: true,
          message: "Le montant total HT doit être supérieur à 0.",
          title: "Montant invalide",
          variant: "error",
        });
        return;
      }
      const today = new Date().toISOString().split("T")[0];
      const res = await postData("/api/insert-database/", "t_cmd_fournis", {
        cmf_code: form.cmf_code,
        cmf_modecmd: form.cmf_modecmd,
        cmf_dateliv: form.cmf_dateliv,
        cmf_montant_ht: ht,
        cmf_montant_ttc: ttc,
        cmf_islivre: false,
        cmf_fou_code: form.cmf_fou_code,
        cmf_date: today,
        cmf_lettre: montantTTCEnLettres(ttc),
        cmf_enabled: true,
      });
      if (res.status) {
        ligneArticle.map(async (value) => {
          const send = await postData(
            "/api/insert-database/",
            "t_ligne_cmd_fournis",
            {
              cmfl_quantite: value.cmfl_Quantite,
              cmfl_pri_id: value.cmfl_pri_id,
              cmfl_cmf_code: value.cmfl_cmf_code,
              cmfl_prixachat: value.cmfl_PrixAchat,
              cmfl_tva: value.cmfl_montant_tva,
              cmfl_totalht: value.cmfl_TotalHT,
              cmfl_art_code: value.cmfl_Art_Code,
              cmfl_fou_code: value.cmfl_fou_Code,
            },
          );
          if (send.status) {
            ligne_ok.push(true);
          } else ligne_ok.push(false);
        });
      } else {
        setAlert({
          open: true,
          message: res.error,
          title: "Une erreur survenue",
          variant: "error",
        });
        return;
      }
      if (!ligne_ok.find((val) => val == false)) {
        fetchCode("t_cmd_fournis", true);
        setAlert({
          open: true,
          variant: "success",
          title: "Opération réussie",
          message: "Commande enregistrer avec succès",
        });
        clear();
        return;
      } else {
        setAlert({
          open: true,
          variant: "error",
          title: "Une erreur est survenue",
          message: "Erreur lors de l'enregistrement dans la base de donnée",
        });
      }

      setAlert({
        open: true,
        message: "Vous avez laisser un (des) champ(s) vide(s)",
        title: "Une erreur survenue",
        variant: "error",
      });
    } catch (error) {
      console.error(error);
    }
  };

  const clear = () => {
    setSearchFrns("");
    setFrns(emptyFrns);
    setLigneArticle([]);
    setForm(emptyBC);
    fetchCode("t_cmd_fournis", false);
  };

  useEffect(() => {
    fetchCode("t_cmd_fournis", false);
    fetchCommande("MODE_COM");
  }, []);

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
    <>
      <div>
        <div className="no-scrollbar relative h-full w-full overflow-y-auto rounded-3xl p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14 flex justify-between">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Ajout commande fournisseur
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
                  name="pieces"
                  type="text"
                  value={form.cmf_code}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      cmf_code: e.target.value,
                    }))
                  }
                  readonly={true}
                />
              </div>
              <div>
                <Label>Date de livraison</Label>
                <Input
                  type="date"
                  value={form.cmf_dateliv}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      cmf_dateliv: e.target.value,
                    }))
                  }
                  name="dateLiv"
                  required={true}
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
                        required={true}
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
                      onClick={() => setOpenModalFrns(true)}
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
                  value={frns.fou_adresse}
                  onChange={(e) =>
                    setFrns((prev) => ({
                      ...prev,
                      fou_adresse: e.target.value,
                    }))
                  }
                  className="w-full bg-transparent placeholder-white/70 outline-none"
                />
              </div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mb-4">
                <div>
                  <Label>Contact 1</Label>
                  <Input
                    name="contact1"
                    type="text"
                    value={frns.fou_tel1}
                    onChange={(e) =>
                      setFrns((prev) => ({
                        ...prev,
                        fou_tel1: e.target.value,
                      }))
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
                    value={frns.fou_tel2}
                    placeholder="N° de tel 2"
                    onChange={(e) =>
                      setFrns((prev) => ({
                        ...prev,
                        fou_tel1: e.target.value,
                      }))
                    }
                    className="w-full bg-transparent placeholder-white/70 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mb-4">
                <div>
                  <Label>Mail</Label>
                  <Input
                    name="mail"
                    type="text"
                    value={frns.fou_mail}
                    onChange={(e) =>
                      setFrns((prev) => ({
                        ...prev,
                        fou_tel1: e.target.value,
                      }))
                    }
                    placeholder="fournisseurs@gmail.com"
                    className="w-full bg-transparent placeholder-white/70 outline-none"
                  />
                </div>
                <div>
                  <Label>Mode de commande</Label>
                  <Select
                    options={enumerationCmd}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        cmf_modecmd: value,
                      }))
                    }
                    defaultValue="8"
                  ></Select>
                </div>
              </div>
            </div>
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
                items={ligneArticle}
                columns={articleColumns}

                getKey={(article: CFLigneArticle) => article.cmfl_Art_Code}

                onEdit={modifierArticle}

                onDelete={(item) => supprimerArticle(item.cmfl_uid!)}

                onItemsChange={setLigneArticle}

                totals={[
                  {
                    label: "TOTAL HT",
                    value: (items: CFLigneArticle[]) =>
                      items.reduce(
                        (total, article) =>
                          total + Number(article.cmfl_TotalHT || 0),
                        0,
                      ) -
                      items.reduce(
                        (total, article) =>
                          total + Number(article.cmfl_montant_remise || 0),
                        0,
                      ),
                    suffix: "Ar",
                  },
                  {
                    label: "TOTAL REMISE",
                    value: (items: CFLigneArticle[]) =>
                      items.reduce(
                        (total, article) =>
                          total + Number(article.cmfl_montant_remise || 0),
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
                          Number(article.cmfl_montant_tva || 0),
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
      </div>
      <NewFrns
        isOpen={openModalFrns}
        onClose={() => setOpenModalFrns(false)}
      ></NewFrns>
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
    </>
  );
}
