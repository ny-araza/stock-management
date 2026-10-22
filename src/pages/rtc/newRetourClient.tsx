import { useCallback, useEffect, useRef, useState } from "react";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import {
  ArticleApi,
  Client,
  Enumeration,
  EnumerationOption,
  FactureAutocomplete,
  VenteLigne,
} from "../../interfaces/interfaces";
import { apiFetch } from "../../services/api";
import SearchableSelect from "../Home/modal/utils/searchableSelect";
import { formatDate } from "../Home/modal/utils/utilsFucntions";
import Select from "../../components/form/Select";
import TextArea from "../../components/form/input/TextArea";
import Button from "../../components/ui/button/Button";
import ListItems, { ListColumn } from "../Home/modal/utils/listItems";
import { postData } from "../../services/sendDataService";
import deduireQuantiteLot from "../../utils/updateLot";
import GenericArticleModal, {
  ArticleCalculation,
  ArticleField,
  ArticleSearchConfig,
  LotAllocation,
} from "../Home/modal/utils/articleGenericModal";
import Alert from "../../components/ui/alert/Alert";

interface TotauxProforma {
  ht: number;
  tva: number;
  ttc: number;
  remise: number;
}

export default function NewRtcPage() {
  const today = new Date().toISOString().split("T")[0];
  const [motif, setMotif] = useState<Enumeration[]>([]);
  const EnumerationOptions: EnumerationOption[] = motif.map(
    (item: Enumeration) => ({
      ...item,
      value: item.enu_id.toString(),
      label: item.enu_nom,
    }),
  );

  const emptyClient: Client = {
    cli_adresse: "",
    cli_code: "",
    cli_email: "",
    cli_enabled: false,
    cli_id: 0,
    cli_modepay: "",
    cli_nif: "",
    cli_nom: "",
    cli_rcs: "",
    cli_stat: "",
    cli_tel1: "",
    cli_tel2: "",
    cli_type: "",
  };

  const emptyFactureAutocomplete: FactureAutocomplete = {
    rtc_code: "",
    rtc_motif: "",
    rtc_observation: "",
    vte_id: "",
    ligne: [],
    client: emptyClient,
    vte_code: "",
    vte_cli_code: "",
    vte_cli_nom: "",
    vte_date: today,
    vte_montant_ht: 0,
    vte_montant_ttc: 0,
    vte_tva: 0,
    vte_vte_code: "",
  };

  const emptyArticle: VenteLigne = {
    art_nom: "",
    vtel_art_code: "",
    vtel_cli_code: "",
    vtel_dateper: "",
    vtel_cli_code: "",
    vtel_ht: 0,
    vtel_id: 0,
    vtel_lot_code: "",
    vtel_lot_dateper: "",
    vtel_lot_id: 0,
    vtel_pri_id: 0,
    vtel_prixunit: 0,
    vtel_quantite: 0,
    vtel_montant_remise: 0,
    vtel_montant_tva: 0,
    vtel_uid: "",
    vtel_tva: 0,
    vtel_quantite_stock: 0,
  };

  const [rtc, setRtc] = useState<FactureAutocomplete>(emptyFactureAutocomplete);

  // facture autocomplete

  const [searchFacture, setSearchFacture] = useState("");
  const [showSuggestionsFacture, setShowSuggestionsFacture] =
    useState<boolean>(false);
  const [facture, setFacture] = useState<FactureAutocomplete>(
    emptyFactureAutocomplete,
  );
  const [suggestionsFacture, setSuggestionsFacture] = useState<
    FactureAutocomplete[]
  >([]);
  const [loading, setLoading] = useState(false);
  const skipSearch = useRef(false); // évite de relancer une recherche après sélection
  const [highlight, setHighlight] = useState(-1);
  const [searchClient, setSearchClient] = useState("");
  const inputClass = `
    h-10 w-full rounded-md border border-gray-300 px-3 text-sm
    outline-none focus:border-blue-500
    dark:border-gray-600 dark:bg-gray-800 dark:text-white
  `;
  const requestId = useRef(0);
  const handleSearchChangeFacture = (value: string) => {
    setSearchFacture(value);
    setShowSuggestionsFacture(true);
    setFacture(emptyFactureAutocomplete);
  };
  const [article, setArticle] = useState<VenteLigne | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [articles, setArticles] = useState<VenteLigne[]>([]);

  const [alert, setAlert] = useState({
    open: false,
    variant: "success" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
  });

  const choisirFacture = (a: FactureAutocomplete) => {
    skipSearch.current = true;
    console.log(a);
    setSearchFacture(a.vte_code);
    setSearchClt(a.client.cli_nom);
    setRtc((prev) => ({
      ...prev,
      vte_id: a.vte_id,
      client: a.client,
      vte_cli_code: a.vte_cli_code,
      vte_code: a.vte_code,
      vte_cli_nom: a.vte_cli_code,
      vte_date: a.vte_date,
      vte_montant_ht: a.vte_montant_ht,
      vte_montant_ttc: a.vte_montant_ttc,
      vte_tva: a.vte_tva,
      vte_vte_code: a.vte_vte_code,
      ligne: a.ligne.map((item) => ({
        ...item,
        vtel_quantite: Number(item.vtel_quantite ?? 0),
        vtel_prixunit: Number(item.vtel_prixunit ?? 0),
        vtel_montant_tva: Number(item.vtel_montant_tva ?? 0),
        vtel_ht: Number(item.vtel_ht ?? 0),
        vtel_ttc: Number(item.vtel_ttc ?? 0),
        vtel_pri_id: Number(item.vtel_pri_id ?? 0),
        vtel_uid:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
        vtel_dateper: item.vtel_dateper,
        vtel_id: item.vtel_id,
        vtel_lot_code: item.vtel_lot_code,
      })),
    }));
    setSuggestionsFacture([]);
    setShowSuggestionsFacture(false);
    setHighlight(-1);
  };

  const modifierArticle = (articleSelectionne: VenteLigne) => {
    setArticle({ ...articleSelectionne });
    setEditingUid(articleSelectionne.vtel_uid ?? null);
    setModalOpen(true);
  };

  const supprimerArticle = (uid: string) => {
    setRtc((prev) => ({
      ...prev,
      ligne: prev.ligne.filter((item) => item.vtel_uid !== uid),
    }));

    // Si on supprimait l'article actuellement en modification
    if (editingUid === uid) {
      setEditingUid(null);
      setArticle(null);
      setModalOpen(false);
    }
  };

  const rechercherFacture = useCallback(async (code: string) => {
    const currentId = ++requestId.current;

    if (!code.trim()) {
      setSuggestionsFacture([]);
      setShowSuggestionsFacture(false);
      return;
    }

    try {
      setLoading(true);
      const query = new URLSearchParams();
      query.set("search", code);

      const res = await apiFetch(`/api/fa-autocomplete/?${query.toString()}`);

      if (currentId !== requestId.current) return; // réponse obsolète

      if (res.status) {
        setSuggestionsFacture(res.t_vente ?? []);
        setShowSuggestionsFacture(true);
        setHighlight(-1);
      }
    } catch (err) {
      console.error(err);
      if (currentId === requestId.current) setSuggestionsFacture([]);
    } finally {
      if (currentId === requestId.current) setLoading(false);
    }
  }, []);

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
      render: (article) => (article.vtel_dateper ? article.vtel_dateper : "-"),
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

  // end facture autocomplete

  // client autocomplete

  const [searchClt, setSearchClt] = useState("");
  const [showSuggestionsClient, setShowSuggestionsClient] =
    useState<boolean>(false);
  const [client, setClient] = useState<Client>(emptyClient);
  const [suggestionsClient, setSuggestionsClient] = useState<Client[]>([]);
  const [ligneArticle, setLigneArticle] = useState<VenteLigne[]>([]);

  const handleSearchChangeClient = (value: string) => {
    setSearchClt(value);
    setShowSuggestionsClient(true);
    setClient(emptyClient);
  };

  const choisirClient = (a: Client) => {
    skipSearch.current = true;
    setSearchClt(a.cli_nom);
    console.log(a);
    setRtc((prev) => ({
      ...prev,
      client: a,
    }));
    setSuggestionsClient([]);
    setShowSuggestionsClient(false);
    setHighlight(-1);
  };

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

  // end client autocomplete

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
        setRtc((prev) => ({
          ...prev,
          rtc_code: res.code,
        }));
      }
    } catch (error: any) {
      console.log(error);
    }
  };

  const fetchMotif = async (enu_code: string) => {
    try {
      const query = new URLSearchParams();
      query.set("enu_code", enu_code);
      const res = await apiFetch(
        `/api/generate-enumeration/?${query.toString()}`,
      );

      if (res.success) {
        setMotif(res.nom_enumeration);
      }
    } catch (error: any) {
      console.error(error);
    }
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

  // open generic modal
  const ajouterArticle = (nouvelArticle: VenteLigne) => {
    console.log("Article reçu :", nouvelArticle);
    console.log("Mode :", editingUid ? "MODIFICATION" : "AJOUT");
    console.log(editingUid);

    if (nouvelArticle.vtel_dateper) {
      setRtc((prev) => {
        // =====================================================
        // 1. MODIFICATION D'UNE LIGNE EXISTANTE
        // =====================================================
        if (editingUid) {
          return {
            ...prev,
            ligne: prev.ligne.map((item) =>
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
                    vtel_montant_tva: Number(
                      nouvelArticle.vtel_montant_tva || 0,
                    ),
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
            ),
          };
        }

        // =====================================================
        // 2. AJOUT D'UNE NOUVELLE LIGNE
        // =====================================================

        const newArticle: VenteLigne = {
          ...nouvelArticle,
          // Nouvel UID uniquement pour cette nouvelle ligne
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
    } else {
      setAlert({
        open: true,
        variant: "error",
        title: "Une erreur est survenue",
        message: "La date de peremption doit être rempli",
      });
    }
  };

  const ajouterArticles = (articles: VenteLigne[]) => {
    console.log("Articles reçus :", articles);

    setRtc((prev) => {
      const nouveauxArticles: VenteLigne[] = articles.map((article) => ({
        ...article,

        // Chaque lot doit avoir sa propre ligne
        vtel_uid:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,

        // Normalisation
        vtel_pri_id: Number(article.vtel_pri_id || 0),
        vtel_quantite: Number(article.vtel_quantite || 0),
        vtel_prixunit: Number(article.vtel_prixunit || 0),
        vtel_montant_tva: Number(article.vtel_montant_tva || 0),
        vtel_ht: Number(article.vtel_ht || 0),
        vtel_ttc: Number(article.vtel_ttc || 0),

        vtel_dateper: article.vtel_dateper || "",
        vtel_remise: Number(article.vtel_remise || 0),

        vtel_montant_remise:
          (Number(article.vtel_ttc || 0) * Number(article.vtel_remise || 0)) /
          100,

        vtel_quantite_stock: Number(article.vtel_quantite_stock || 0),

        // Lot différent pour chaque ligne
        vtel_lot: article.vtel_lot || "",
        vtel_id: article.vtel_lot_id,
      }));

      return {
        ...prev,
        ligne: [...prev.ligne, ...nouveauxArticles],
      };
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
        data.operation,
      );

    } catch (error) {
      console.error(error);
      throw Error(`${error}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!rtc.ligne || rtc.ligne.length === 0) {
        setAlert({
          open: true,
          message: "Veuillez ajouter au moins un article.",
          title: "Aucune ligne",
          variant: "error",
        });
        return;
      }
      const totauxCalcules = calculerTotaux(rtc.ligne);
      console.log(totauxCalcules);
      if (totauxCalcules.ttc === 0) {
        setAlert({
          open: true,
          message: "Le montant total HT doit être supérieur à 0.",
          title: "Montant invalide",
          variant: "error",
        });
        return;
      }
      const resultats = await Promise.all(
        rtc.ligne.map(async (value) => {
          console.log(value);

          try {
            if (!value.vtel_dateper) {
              throw Error("Le datePer est vide");
            }
            const send = await postData(
              "/api/insert-database/",
              "t_ligne_rtc",
              {
                rtcl_quantite: value.vtel_quantite,
                rtcl_pri_id: value.vtel_pri_id,
                rtcl_vte_code: rtc.vte_code,
                rtcl_rtc_code: rtc.rtc_code,
                rtcl_prixunit: value.vtel_prixunit,
                rtcl_tva: value.vtel_tva,
                rtcl_ht: value.vtel_ht,
                rtcl_art_code: value.vtel_art_code,
                rtcl_cli_code: client.cli_code,
                rtcl_ttc: value.vtel_ttc,
                rtcl_lot_dateper: value.vtel_dateper,
                rtcl_lot_id: value.vtel_lot_id,
                rtcl_remise: value.vtel_montant_remise,
                rtcl_vtel_id: value.vtel_id,
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
                lot_id: value.vtel_lot_code,
                lot_art_code: value.vtel_art_code,
                lot_quantite: value.vtel_quantite,
                operation: "entrer",
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
      if (!toutesLesLignesOK) {
        setAlert({
          open: true,
          variant: "error",
          title: "Une erreur est survenue",
          message:
            "La retour a été enregistrer, mais une ou plusieurs lignes n'ont pas pu être enregistrées.",
        });
        return;
      }

      const res = await postData("/api/insert-database/", "t_retour_client", {
        rtc_code: rtc.rtc_code,
        rtc_vte: rtc.vte_code,
        rtc_date: today,
        rtc_montant_ht: totauxCalcules.ht,
        rtc_montant_ttc: totauxCalcules.ttc,
        rtc_tva: totauxCalcules.tva,
        rtc_cli_code: client.cli_code,
        rtc_cli_nom: client.cli_nom,
        rtc_motif: rtc.rtc_motif,
        rtc_observation: rtc.rtc_observation,
      });

      if (!res.status) {
        setAlert({
          open: true,
          variant: "error",
          title: "Une erreur est survenue",
          message: "Une erreur lors de l'enregistrement du retour",
        });

        return;
      }

      fetchCode("t_vente", true);
      setAlert({
        open: true,
        variant: "success",
        title: "Opération réussie",
        message: "Retour client enregistrée avec succès",
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

  const clear = () => {
    setSearchFacture("");
    setSearchClt("");
    setArticles([]);
    setRtc(emptyFactureAutocomplete);
    fetchCode("t_retour_client", false);
  };

  useEffect(() => {
    if (!open) return;

    if (skipSearch.current) {
      skipSearch.current = false;
      return;
    }

    const timer = setTimeout(() => rechercherFacture(searchFacture), 300);
    return () => {
      clearTimeout(timer);
    };
  }, [searchFacture, open, rechercherFacture]);

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
    fetchMotif("RC_MOTIF");
    fetchCode("t_retour_client", false);
  }, []);

  return (
    <>
      <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14 flex justify-between">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Ajout retour client
          </h4>
          <span className="dark:text-white/90">
            {Date().split(" ")[2]}/{Date().split(" ")[1]}/{Date().split(" ")[3]}
          </span>
        </div>
        <form className="flex flex-col" onSubmit={handleSubmit}>
          <div className="custom-scrollbar overflow-y-auto px-2 pb-3">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mb-2">
              <div>
                <Label>Piece N°</Label>
                <Input
                  name="pieces"
                  type="text"
                  value={rtc.rtc_code}
                  onChange={(e) => {
                    setRtc((prev) => ({
                      ...prev,
                      rtc_code: e.target.value,
                    }));
                  }}
                  readonly={true}
                />
              </div>
              <div>
                <Label>Facture</Label>
                <SearchableSelect<FactureAutocomplete>
                  value={searchFacture}
                  onChange={handleSearchChangeFacture}
                  suggestions={suggestionsFacture}
                  loading={loading}
                  required={true}
                  onSelect={choisirFacture}
                  placeholder="Rechercher une facture"
                  noResultsText="Aucun proforma trouvé"
                  getKey={(fa: FactureAutocomplete) => fa.vte_id}
                  inputClassName={inputClass}
                  renderItem={(fa: FactureAutocomplete) => (
                    <div className="px-3 py-2">
                      <div className="text-sm font-medium text-gray-800 dark:text-white">
                        {fa?.client.cli_nom || ""}
                      </div>

                      <div className="truncate text-xs text-gray-500">
                        {fa?.vte_code || ""}
                      </div>

                      <div className="text-xs text-gray-400">
                        Crée le: {formatDate(fa?.vte_date) || ""}
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
                        Crée le: {formatDate(clt.cli_datecre || "")}
                      </div>
                    </div>
                  )}
                />
              </div>
              <div>
                <Label>Contact</Label>
                <Input
                  name="contact"
                  type="text"
                  value={rtc.client.cli_tel1}
                  onChange={(e) => {
                    setRtc((prev) => ({
                      ...prev,
                      client: {
                        ...prev.client,
                        cli_tel1: e.target.value,
                      },
                    }));
                  }}
                  placeholder="Contact client"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mb-2">
              <div>
                <Label>Motif</Label>
                <Select
                  options={EnumerationOptions}
                  onChange={(value) =>
                    setRtc((prev) => ({
                      ...prev,
                      rtc_motif: value,
                    }))
                  }
                  defaultValue="35"
                />
              </div>
              <div>
                <Label>Observation</Label>
                <TextArea
                  name="observation"
                  placeholder="Observation"
                  value={rtc.rtc_observation}
                  onChange={(value) =>
                    setRtc((prev) => ({
                      ...prev,
                      rtc_observation: value,
                    }))
                  }
                  className="w-full"
                ></TextArea>
              </div>
            </div>
            <Label>Articles</Label>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 mt-5">
              <ListItems<VenteLigne>
                items={rtc.ligne}
                columns={articleColumns}

                getKey={(article: VenteLigne) => article.vtel_uid || ""}

                onEdit={modifierArticle}

                onDelete={(item) => supprimerArticle(item.vtel_uid!)}

                onItemsChange={setArticles}
                showActions={false}
                totals={[
                  {
                    label: "TOTAL HT",
                    value: (items: VenteLigne[]) =>
                      items.reduce(
                        (total, article) =>
                          total + Number(article.vtel_ht || 0),
                        0,
                      ) -
                      items.reduce(
                        (total, article) =>
                          total + Number(article.vtel_montant_remise || 0),
                        0,
                      ),
                    suffix: "Ar",
                  },
                  {
                    label: "TOTAL REMISE",
                    value: (items: VenteLigne[]) =>
                      items.reduce(
                        (total, article) =>
                          total + Number(article.vtel_montant_remise || 0),
                        0,
                      ),
                    suffix: "Ar",
                  },
                  {
                    label: "TOTAL TVA",
                    value: (items: VenteLigne[]) =>
                      items.reduce(
                        (total, article) =>
                          total + Number(article.vtel_montant_tva || 0),
                        0,
                      ),
                    suffix: "Ar",
                  },

                  {
                    label: "TOTAL TTC",
                    value: (items: VenteLigne[]) =>
                      items.reduce(
                        (total, article) =>
                          total +
                          Number(article.vtel_ht || 0) +
                          Number(article.vtel_montant_tva || 0),
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
    </>
  );
}
