/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArticleApi,
  CFLigneArticle,
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

  // searchConfig
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

  const [article, setArticle] = useState<CFLigneArticle | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [ligneArticle, setLigneArticle] = useState<CFLigneArticle[]>([]);

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
          <form className="flex flex-col">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mb-2">
              <div>
                <Label>Piece N°</Label>
                <Input
                  name="pieces"
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
                <Label>Date de vente</Label>
                <Input
                  name="date_vente"
                  type="date"
                  value={form.pro_date}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      pro_code: e.target.value,
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
                  name="adresse"
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
                  name="contact1"
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
                  name="contact2"
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
                  name="mail"
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
        <NewClts isOpen={openModalClt} onClose={() => setOpenMOdalClt(false)} />
      </div>
    </>
  );
}
