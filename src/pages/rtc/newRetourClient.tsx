import { useCallback, useEffect, useRef, useState } from "react";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import {
  Client,
  Enumeration,
  EnumerationOption,
  FactureAutocomplete,
  ListeVente,
  VenteLigne,
} from "../../interfaces/interfaces";
import { apiFetch } from "../../services/api";
import SearchableSelect from "../Home/modal/utils/searchableSelect";
import { formatDate } from "../Home/modal/utils/utilsFucntions";
import Select from "../../components/form/Select";
import TextArea from "../../components/form/input/TextArea";
import Button from "../../components/ui/button/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import ListItems, { ListColumn } from "../Home/modal/utils/listItems";

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

  const choisirFacture = (a: FactureAutocomplete) => {
    skipSearch.current = true;
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
        vtel_montant_tva: Number(item.vtel_tva ?? 0),
        vtel_ht: Number(item.vtel_ht ?? 0),
        vtel_ttc: Number(item.vtel_ttc ?? 0),
        vtel_pri_id: Number(item.vtel_pri_id ?? 0),
        vtel_uid:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
        vtel_dateper: "",
        vtel_id: item.vtel_id,
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

  const openGenericModal = () => {
    setArticle(null);
    console.log(emptyFactureAutocomplete);
    setModalOpen(true);
    setEditingUid(null);
  };

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
        <form className="flex flex-col">
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
                items={rtc.ligne}
                columns={articleColumns}

                getKey={(article: VenteLigne) => article.vtel_uid || ""}

                onEdit={modifierArticle}

                onDelete={(item) => supprimerArticle(item.vtel_uid!)}

                onItemsChange={setArticles}

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
      </div>
    </>
  );
}
