/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArticleApi,
  ProLigneArticle,
  Client,
  Enumeration,
  EnumerationOption,
  Fourniseur,
  Proforma,
} from "../../interfaces/interfaces";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { formatDate } from "../Home/modal/utils/utilsFucntions";
import SearchableSelect from "../Home/modal/utils/searchableSelect";
import { apiFetch } from "../../services/api";
import NewClts from "../Clients/newClts";
import Select from "../../components/form/Select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import ListItems, { ListColumn } from "../Home/modal/utils/listItems";
import GenericArticleModal, {
  ArticleCalculation,
  ArticleField,
  ArticleSearchConfig,
} from "../Home/modal/utils/articleGenericModal";
import { postData } from "../../services/sendDataService";
import montantTTCEnLettres from "../../utils/montantEnLettre";
import Alert from "../../components/ui/alert/Alert";

export default function NewProformaPage() {
  const emptyForm: Proforma = {
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

  const emptyArticle: ProLigneArticle = {
    art_nom: "",
    prol_Art_Code: "",
    prol_prixunit: 0,
    prol_Quantite: 0,
    prol_TotalHT: 0,
    prol_TotalTTC: 0,
    prol_Tva: 0,
    prol_pro_code: "",
    prol_fou_Code: "",
    prol_pri_id: 0,
    prol_id: 0,
    prol_remise: 0,
    prol_uid: "",
    prol_lot: "",
    prol_datePer: "",
    prol_montant_remise: 0,
    prol_montant_tva: 0,
    prol_quantite_stock: 0,
  };

  const [form, setForm] = useState<Proforma>(emptyForm);
  const [client, setClient] = useState<Client>(emptyClient);

  const [payementEnum, setpayementEnum] = useState<Enumeration[]>([]);
  const enumerationPaye: EnumerationOption[] = payementEnum.map(
    (item: Enumeration) => ({
      ...item,
      value: item.enu_id.toString(),
      label: item.enu_nom,
    }),
  );

  // searchableSelect client
  const [alert, setAlert] = useState({
    open: false,
    variant: "success" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
  });
  const [searchClt, setSearchClt] = useState("");
  const [openModalClt, setOpenMOdalClt] = useState(false);
  const [showSuggestionsClient, setShowSuggestionsClient] =
    useState<boolean>(false);
  const handleSearchChangeClient = (value: string) => {
    setSearchClt(value);
    setShowSuggestionsClient(true);

    setClient(emptyClient);
  };
  const [suggestionsClient, setSuggestionsClient] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const skipSearch = useRef(false);
  const [highlight, setHighlight] = useState(-1);
  const inputClass = `
    h-10 w-full rounded-md border border-gray-300 px-3 text-sm
    outline-none focus:border-blue-500
    dark:border-gray-600 dark:bg-gray-800 dark:text-white
  `;
  const choisirClient = (a: Client) => {
    skipSearch.current = true;
    setSearchClt(a.cli_nom);
    console.log(a);
    setClient(a);
    setSuggestionsClient([]);
    setShowSuggestionsClient(false);
    setHighlight(-1);
  };

  const articleColumns: ListColumn<ProLigneArticle>[] = [
    {
      label: "Code Article",
      mobilePrimary: true,
      render: (article) => (
        <div>
          <strong>{article.prol_Art_Code}</strong>

          <div className="text-sm text-gray-500">{article.art_nom}</div>
        </div>
      ),
    },

    {
      label: "Quantité",
      render: (article) => article.prol_Quantite,
    },

    {
      label: "TVA (Ar)",
      render: (article) =>
        Number(article.prol_montant_tva).toLocaleString("fr-FR"),
    },

    {
      label: "P.U",
      render: (article) => (
        <>{Number(article.prol_prixunit).toLocaleString("fr-FR")} Ar</>
      ),
    },

    {
      label: "Date Per",
      render: (article) => (article.prol_datePer ? article.prol_datePer : "-"),
    },

    {
      label: "HT",
      mobilePrimary: true,
      render: (article) => (
        <strong>
          {Number(article.prol_TotalHT).toLocaleString("fr-FR")} Ar
        </strong>
      ),
    },
    {
      label: "Remise (Ar)",
      mobilePrimary: true,
      render: (article) => (
        <strong>
          {article.prol_montant_remise
            ? Number(article.prol_montant_remise).toLocaleString("fr-FR")
            : "0"}{" "}
          Ar
        </strong>
      ),
    },
  ];

  const modifierArticle = (articleSelectionne: ProLigneArticle) => {
    setArticle({ ...articleSelectionne });
    setEditingUid(articleSelectionne.prol_uid ?? null);
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

  const ajouterArticle = (nouvelArticle: ProLigneArticle) => {
    console.log("Article reçu :", nouvelArticle);
    console.log("Mode :", editingUid ? "MODIFICATION" : "AJOUT");
    console.log("UID :", editingUid);

    setLigneArticle((prev) => {
      // =====================================================
      // 1. MODIFICATION D'UNE LIGNE EXISTANTE
      // =====================================================
      if (editingUid) {
        return prev.map((item) =>
          item.prol_uid === editingUid
            ? {
                ...item,
                ...nouvelArticle,

                // Conserver l'UID de la ligne existante
                prol_uid: editingUid,

                // Normalisation
                prol_pri_id: Number(nouvelArticle.prol_pri_id || 0),
                prol_Quantite: Number(nouvelArticle.prol_Quantite || 0),
                prol_prixunit: Number(nouvelArticle.prol_prixunit || 0),
                prol_Tva: Number(nouvelArticle.prol_Tva || 0),
                prol_TotalHT: Number(nouvelArticle.prol_TotalHT || 0),
                prol_TotalTTC: Number(nouvelArticle.prol_TotalTTC || 0),

                prol_datePer: nouvelArticle.prol_datePer || "",
                prol_remise: nouvelArticle.prol_remise || 0,
                prol_montant_remise: nouvelArticle.prol_montant_remise || 0,
                prol_quantite_stock: nouvelArticle.prol_quantite_stock || 0,

                // Valeur par défaut du lot
                prol_lot: nouvelArticle.prol_lot || "",
              }
            : item,
        );
      }

      // =====================================================
      // 2. AJOUT D'UNE NOUVELLE LIGNE
      // =====================================================

      const newArticle: ProLigneArticle = {
        ...nouvelArticle,

        // Générer un nouvel UID
        prol_uid:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,

        // Normalisation
        prol_pri_id: Number(nouvelArticle.prol_pri_id || 0),
        prol_Quantite: Number(nouvelArticle.prol_Quantite || 0),
        prol_prixunit: Number(nouvelArticle.prol_prixunit || 0),
        prol_Tva: Number(nouvelArticle.prol_Tva || 0),
        prol_TotalHT: Number(nouvelArticle.prol_TotalHT || 0),
        prol_TotalTTC: Number(nouvelArticle.prol_TotalTTC || 0),

        prol_datePer: nouvelArticle.prol_datePer || "",
        prol_remise: nouvelArticle.prol_remise || 0,
        prol_montant_remise: nouvelArticle.prol_montant_remise || 0,
        prol_quantite_stock: nouvelArticle.prol_quantite_stock || 0,

        // Valeur par défaut
        prol_lot: nouvelArticle.prol_lot || "",
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

  // searchConfig
  const articleSearchConfig: ArticleSearchConfig<ProLigneArticle, ArticleApi> =
    {
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

        prol_id: article.id,

        prol_Art_Code: article.code,

        art_nom: article.nom_article,

        prol_prixunit: article.prix_vte ?? 0,

        prol_Tva: Number(article.pri_tva ?? 0),

        prol_montant_tva:
          (Number(article.pri_tva ?? 0) * Number(article.prix_vte ?? 0)) / 100,

        prol_TotalHT: 0,

        prol_lot: "",

        prol_datePer: "",
        prol_remise: 0,
        prol_montant_remise: 0,
        prol_quantite_stock: article.quantite_stock,
        prol_uid:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
      }),
    };

  const articleFields: ArticleField<ProLigneArticle>[] = [
    {
      name: "art_nom",
      label: "Désignation",
      type: "text",
      placeholder: "Désignation de l'article",
      className: "md:col-span-7",
    },

    {
      name: "prol_Quantite",
      label: "Quantité",
      type: "number",
      min: 0,
      parseValue: Number,
    },

    {
      name: "prol_prixunit",
      label: "Prix unitaire",
      type: "number",
      min: 0,
    },
    {
      name: "prol_montant_tva",
      label: "TVA (Ar)",
      type: "number",
      min: 0,
      step: 0.01,
      parseValue: Number,
    },
    {
      name: "prol_remise",
      label: "Remise (%)",
      type: "number",
      min: 0,
      step: 0.01,
      parseValue: Number,
    },
    {
      name: "prol_datePer",
      label: "Date de Péremption",
      type: "date",
      parseValue: String,
    },
    {
      name: "prol_TotalHT",
      label: "Total HT",
      type: "text",
      readOnly: true,
      getValue: (article: ProLigneArticle) =>
        `${Number(article.prol_TotalHT).toLocaleString("fr-FR")} Ar`,
    },
  ];

  const calculation: ArticleCalculation<ProLigneArticle> = {
    calculate: (form) => {
      const quantite = Number(form.prol_Quantite) || 0;

      const pua = Number(form.prol_prixunit) || 0;

      const remise = Number(form.prol_remise) || 0;

      const totalBrut = quantite * pua;

      const montantRemise = totalBrut * (remise / 100);

      const totalHT = totalBrut - montantRemise;

      const tva = totalHT * (Number(form.prol_Tva) / 100);

      const totalTTC = totalHT + tva;

      return {
        prol_TotalHT: totalHT,
        prol_montant_tva: tva,
        prol_TotalTTC: totalTTC,
        prol_montant_remise: montantRemise,
      };
    },
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
          pro_code: res.code,
        }));
      }
    } catch (error: any) {
      console.log(error);
    }
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

  // SearchableSelect end client
  const clear = () => {
    setSearchClt("");
    setClient(emptyClient);
    setLigneArticle([]);
    setForm(emptyForm);
    fetchCode("t_proforma", false);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const ligne_ok: boolean[] = [];
      if (ligneArticle.length == 0 || !form || !client) {
        throw Error("Vous avz laisser des champs vides");
      }
      const total_remise = ligneArticle.reduce(
        (total, article) => total + Number(article.prol_montant_remise || 0),
        0,
      );
      const ht =
        ligneArticle.reduce(
          (total, article) => total + Number(article.prol_TotalHT || 0),
          0,
        ) - total_remise || 0;
      const ttc = ligneArticle.reduce(
        (total, article) =>
          total +
          Number(article.prol_TotalHT || 0) +
          Number(article.prol_montant_tva || 0),
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
      const res = await postData("/api/insert-database/", "t_proforma", {
        pro_code: form.pro_code,
        pro_modecmd: form.pro_modecmd,
        pro_dateliv: form.pro_dateliv,
        pro_montant_ht: ht,
        pro_montant_ttc: ttc,
        pro_islivre: false,
        pro_cli_code: form.pro_cli_code,
        pro_date: today,
        pro_lettre: montantTTCEnLettres(ttc),
        pro_enabled: true,
      });
      if (res.status) {
        ligneArticle.map(async (value) => {
          const send = await postData(
            "/api/insert-database/",
            "t_ligne_proforma",
            {
              prol_quantite: value.prol_Quantite,
              prol_pri_id: value.prol_pri_id,
              prol_pro_code: value.prol_pro_code,
              prol_prixunit: value.prol_prixunit,
              prol_tva: value.prol_montant_tva,
              prol_totalht: value.prol_TotalHT,
              prol_art_code: value.prol_Art_Code,
              prol_cli_code: value.prol_cli_Code,
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
        fetchCode("t_proforma", true);
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

  const [article, setArticle] = useState<ProLigneArticle | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [ligneArticle, setLigneArticle] = useState<ProLigneArticle[]>([]);

  const openGenericModal = () => {
    setArticle(null);
    console.log(emptyArticle);
    setModalOpen(true);
    setEditingUid(null);
  };

  useEffect(() => {
    fetchPaye("MODE_COM");
    fetchCode("t_proforma", false);
  }, []);

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
  return (
    <>
      <div>
        <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14 flex justify-between">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Proforma
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
                  name="pro_code"
                  type="text"
                  value={form.pro_code}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      pro_code: e.target.value,
                    }))
                  }
                  readonly={true}
                />
              </div>
              <div>
                <Label>Date de livraison</Label>
                <Input
                  name="pro_dateliv"
                  type="date"
                  value={form.pro_dateliv}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      pro_dateliv: e.target.value,
                    }))
                  }
                  required={true}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mb-2">
              <div>
                <Label>Nom Client</Label>
                <div className="flex items-center w-full gap-2 flex-nowrap">
                  <div className="grid grid-cols-[1fr_auto] gap-2 w-full">
                    <div>
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
                    <Button
                      variant="outline"
                      title="Ajouter nouveau fournisseur"
                      onClick={() => setOpenMOdalClt(true)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <Label>Adrèsse</Label>
                <Input
                  name="cli_adresse"
                  type="text"
                  placeholder="L'adrèsse du client"
                  value={client.cli_adresse}
                  onChange={(e) =>
                    setClient((prev) => ({
                      ...prev,
                      cli_adresse: e.target.value,
                    }))
                  }
                  className="w-full bg-transparent placeholder-white/70 outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mb-4">
              <div>
                <Label>Contact 1</Label>
                <Input
                  name="cli_tel1"
                  type="text"
                  value={client.cli_tel1}
                  onChange={(e) =>
                    setClient((prev) => ({
                      ...prev,
                      cli_tel1: e.target.value,
                    }))
                  }
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
                  onChange={(e) =>
                    setClient((prev) => ({
                      ...prev,
                      cli_tel2: e.target.value,
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
                  name="cli_mail"
                  type="text"
                  value={client.cli_email}
                  onChange={(e) =>
                    setClient((prev) => ({
                      ...prev,
                      cli_email: e.target.value,
                    }))
                  }
                  placeholder="client@gmail.com"
                  className="w-full bg-transparent placeholder-white/70 outline-none"
                />
              </div>
              <div>
                <Label>Mode de commande</Label>
                <Select
                  options={enumerationPaye}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      pro_modecmd: value,
                    }))
                  }
                  defaultValue="16"
                />
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

              <ListItems<ProLigneArticle>
                items={ligneArticle}
                columns={articleColumns}

                getKey={(article: ProLigneArticle) => article.prol_Art_Code}

                onEdit={modifierArticle}

                onDelete={(item) => supprimerArticle(item.prol_uid!)}

                onItemsChange={setLigneArticle}

                totals={[
                  {
                    label: "TOTAL HT",
                    value: (items: ProLigneArticle[]) =>
                      items.reduce(
                        (total, article) =>
                          total + Number(article.prol_TotalHT || 0),
                        0,
                      ) -
                      items.reduce(
                        (total, article) =>
                          total + Number(article.prol_montant_remise || 0),
                        0,
                      ),
                    suffix: "Ar",
                  },
                  {
                    label: "TOTAL REMISE",
                    value: (items: ProLigneArticle[]) =>
                      items.reduce(
                        (total, article) =>
                          total + Number(article.prol_montant_remise || 0),
                        0,
                      ),
                    suffix: "Ar",
                  },
                  {
                    label: "TOTAL TVA",
                    value: (items: ProLigneArticle[]) =>
                      items.reduce(
                        (total, article) =>
                          total + Number(article.prol_montant_tva || 0),
                        0,
                      ),
                    suffix: "Ar",
                  },

                  {
                    label: "TOTAL TTC",
                    value: (items: ProLigneArticle[]) =>
                      items.reduce(
                        (total, article) =>
                          total +
                          Number(article.prol_TotalHT || 0) +
                          Number(article.prol_montant_tva || 0),
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
        <GenericArticleModal<ProLigneArticle, ArticleApi>
          open={modalOpen}
          article={article}
          emptyValue={emptyArticle}
          onClose={() => setModalOpen(false)}
          onSave={ajouterArticle}
          className="max-w-[900px] m-4 max-h-[700px]"

          searchConfig={articleSearchConfig}

          fields={articleFields}

          calculation={calculation}

          getArticleCode={(article) => article.prol_Art_Code}
          getStock={(article) => article.prol_quantite_stock ?? 0}
          validate={(form) => {
            if (!form.prol_Art_Code || !form.prol_uid) {
              return "Veuillez sélectionner un article dans la liste.";
            }

            if (Number(form.prol_Quantite) <= 0) {
              return "La quantité doit être supérieure à 0.";
            }

            if (Number(form.prol_prixunit) < 0) {
              return "Le prix unitaire est invalide.";
            }

            return null;
          }}

          renderFooter={(form) => (
            <div className="flex items-center">
              <span className="mr-2 dark:text-white">TTC :</span>

              <span className="text-green-600">
                <strong>
                  {Number(form.prol_TotalTTC).toLocaleString("fr-FR")} Ar
                </strong>
              </span>

              <span className="ml-2 dark:text-white">| Remise :</span>

              <span className="ml-2 text-red-600">
                <strong>
                  {Number(form.prol_montant_remise).toLocaleString("fr-FR")} Ar
                </strong>
              </span>
            </div>
          )}
        />
        <NewClts isOpen={openModalClt} onClose={() => setOpenMOdalClt(false)} />
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
