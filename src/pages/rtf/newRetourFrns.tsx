import { useCallback, useEffect, useRef, useState } from "react";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import {
  EntreeAutocomplete,
  Enumeration,
  EnumerationOption,
  Fourniseur,
  VenteLigne,
} from "../../interfaces/interfaces";
import { apiFetch } from "../../services/api";
import SearchableSelect from "../Home/modal/utils/searchableSelect";
import { formatDate } from "../Home/modal/utils/utilsFucntions";
import Select from "../../components/form/Select";
import TextArea from "../../components/form/input/TextArea";
import ListItems, { ListColumn } from "../Home/modal/utils/listItems";
import { EntreeLigne } from "../livFrns/livFrnsTable";
import { postData } from "../../services/sendDataService";
import deduireQuantiteLot from "../../utils/updateLot";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";

interface TotauxProforma {
  ht: number;
  tva: number;
  ttc: number;
  remise: number;
}

export default function NewRtfPage() {
  const today = new Date().toISOString().split("T")[0];
  const [motif, setMotif] = useState<Enumeration[]>([]);
  const EnumerationOptions: EnumerationOption[] = motif.map(
    (item: Enumeration) => ({
      ...item,
      value: item.enu_id.toString(),
      label: item.enu_nom,
    }),
  );
  const inputClass = `
    h-10 w-full rounded-md border border-gray-300 px-3 text-sm
    outline-none focus:border-blue-500
    dark:border-gray-600 dark:bg-gray-800 dark:text-white
  `;
  const emptyFournisseur: Fourniseur = {
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

  const emptyEntreeAutocomplete: EntreeAutocomplete = {
    rtf_code: "",
    rtf_motif: "",
    rtf_observation: "",
    ent_id: "",
    ligne: [],
    fournisseur: emptyFournisseur,
    ent_code: "",
    ent_fou_code: "",
    ent_fou_nom: "",
    ent_date: today,
    ent_montant_ht: 0,
    ent_montant_ttc: 0,
    ent_tva: 0,
    ent_entl_code: "",
  };

  const [rtf, setRtf] = useState<EntreeAutocomplete>(emptyEntreeAutocomplete);

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
        setRtf((prev) => ({
          ...prev,
          rtf_code: res.code,
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

  // searchable BL
  const requestId = useRef(0);
  const [searchBl, setSearchBl] = useState("");
  const [showSuggestionsBl, setShowSuggestionsBl] = useState<boolean>(false);
  const [facture, setFacture] = useState<EntreeAutocomplete>(
    emptyEntreeAutocomplete,
  );
  const [suggestionsBl, setSuggestionsBl] = useState<EntreeAutocomplete[]>([]);
  const [highlight, setHighlight] = useState(-1);
  const [alert, setAlert] = useState({
    open: false,
    variant: "success" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
  });
  const handleSearchChangeBl = (value: string) => {
    setSearchBl(value);
    setShowSuggestionsBl(true);
    setFacture(emptyEntreeAutocomplete);
  };
  const [loading, setLoading] = useState(false);
  const skipSearch = useRef(false); // évite de relancer une recherche après sélection

  const choisirBl = (a: EntreeAutocomplete) => {
    skipSearch.current = true;
    console.log(a);
    setSearchBl(a.ent_code);
    // setSearchClt(a.client.cli_nom);
    setRtf((prev) => ({
      ...prev,
      ent_id: a.ent_id,
      fournisseur: a.fournisseur,
      ent_fou_code: a.ent_fou_code,
      ent_code: a.ent_code,
      ent_fou_nom: a.ent_fou_nom,
      ent_date: a.ent_date,
      ent_montant_ht: a.ent_montant_ht,
      ent_montant_ttc: a.ent_montant_ttc,
      ent_tva: a.ent_tva,
      ent_ent_code: a.ent_entl_code,
      ligne: a.ligne.map((item) => ({
        ...item,
        entl_quantite: Number(item.entl_quantite ?? 0),
        entl_prixunit: Number(item.entl_prixunit ?? 0),
        entl_montant_tva: Number(item.entl_montant_tva ?? 0),
        entl_ht: Number(item.entl_ht ?? 0),
        entl_ttc: Number(item.entl_ttc ?? 0),
        entl_pri_id: Number(item.entl_pri_id ?? 0),
        entl_uid:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
        entl_dateper: item.entl_dateper,
        entl_id: item.entl_id,
        entl_lot_code: item.entl_lot_id,
        entl_montant_remise: item.entl_montant_remise,
      })),
    }));
    setSuggestionsBl([]);
    setShowSuggestionsBl(false);
    setHighlight(-1);
  };

  const rechercherBl = useCallback(async (code: string) => {
    const currentId = ++requestId.current;

    if (!code.trim()) {
      setSuggestionsBl([]);
      setShowSuggestionsBl(false);
      return;
    }

    try {
      setLoading(true);
      const query = new URLSearchParams();
      query.set("search", code);

      const res = await apiFetch(`/api/bl-autocomplete/?${query.toString()}`);

      if (currentId !== requestId.current) return; // réponse obsolète

      if (res.status) {
        setSuggestionsBl(res.t_entree ?? []);
        setShowSuggestionsBl(true);
        setHighlight(-1);
      }
    } catch (err) {
      console.error(err);
      if (currentId === requestId.current) setSuggestionsBl([]);
    } finally {
      if (currentId === requestId.current) setLoading(false);
    }
  }, []);

  // en searchble BL

  // list Item
  const [article, setArticle] = useState<EntreeLigne | null>(null);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [articles, setArticles] = useState<EntreeLigne[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const articleColumns: ListColumn<EntreeLigne>[] = [
    {
      label: "Code Article",
      mobilePrimary: true,
      render: (article) => (
        <div>
          <strong>{article.entl_art_code}</strong>

          <div className="text-sm text-gray-500">{article.art_nom}</div>
        </div>
      ),
    },

    {
      label: "Quantité",
      render: (article) => article.entl_quantite,
    },

    {
      label: "TVA (Ar)",
      render: (article) =>
        Number(article.entl_montant_tva).toLocaleString("fr-FR"),
    },

    {
      label: "P.U",
      render: (article) => (
        <>{Number(article.entl_prixunit).toLocaleString("fr-FR")} Ar</>
      ),
    },

    {
      label: "Date Per",
      render: (article) => (article.entl_dateper ? article.entl_dateper : "-"),
    },

    {
      label: "HT",
      mobilePrimary: true,
      render: (article) => (
        <strong>{Number(article.entl_ht).toLocaleString("fr-FR")} Ar</strong>
      ),
    },
    {
      label: "Remise (Ar)",
      mobilePrimary: true,
      render: (article) => (
        <strong>
          {article.entl_montant_remise
            ? Number(article.entl_montant_remise).toLocaleString("fr-FR")
            : "0"}{" "}
          Ar
        </strong>
      ),
    },
  ];

  const modifierArticle = (articleSelectionne: EntreeLigne) => {
    setArticle({ ...articleSelectionne });
    setEditingUid(articleSelectionne.entl_uid ?? null);
    setModalOpen(true);
  };
  const supprimerArticle = (uid: string) => {
    setRtf((prev) => ({
      ...prev,
      ligne: prev.ligne.filter((item) => item.entl_uid !== uid),
    }));

    // Si on supprimait l'article actuellement en modification
    if (editingUid === uid) {
      setEditingUid(null);
      setArticle(null);
      setModalOpen(false);
    }
  };
  // end list ITem

  const calculerTotaux = (lignes: EntreeLigne[]): TotauxProforma => {
    const sum = (fn: (a: EntreeLigne) => number) =>
      lignes.reduce((t, a) => t + (Number(fn(a)) || 0), 0);

    const ht = sum((a) => a?.entl_ht); // déjà net de remise

    const remise = sum((a) => a.entl_montant_remise || 0);
    const tva = sum((a) => a.entl_montant_tva || 0);

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

  const clear = () => {
    setSearchBl("");
    setArticles([]);
    setRtf(emptyEntreeAutocomplete);
    fetchCode("t_retour_fournis", false);
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
      if (!rtf.ligne || rtf.ligne.length === 0) {
        setAlert({
          open: true,
          message: "Veuillez ajouter au moins un article.",
          title: "Aucune ligne",
          variant: "error",
        });
        return;
      }
      const totauxCalcules = calculerTotaux(rtf.ligne);
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
        rtf.ligne.map(async (value) => {
          console.log(value);

          try {
            if (!value.entl_dateper) {
              throw Error("Le datePer est vide");
            }
            const send = await postData(
              "/api/insert-database/",
              "t_ligne_rtf",
              {
                rtfl_quantite: value.entl_quantite,
                rtfl_pri_id: value.entl_pri_id,
                rtfl_ent_code: rtf.ent_code,
                rtfl_rtf_code: rtf.rtf_code,
                rtfl_prixunit: value.entl_prixunit,
                rtfl_tva: value.entl_tva,
                rtfl_ht: value.entl_ht,
                rtfl_art_code: value.entl_art_code,
                rtfl_fou_code: rtf.fournisseur.fou_code,
                rtfl_ttc: value.entl_ttc,
                rtfl_lot_dateper: value.entl_dateper,
                rtfl_lot_id: value.entl_lot_id,
                rtfl_remise: value.entl_montant_remise,
                rtfl_entl_id: value.entl_id,
              },
            );

            if (!send.status) {
              return false;
            }
            try {
              await handleStock({
                quantite: value.entl_quantite,
                pri_id: value.entl_pri_id,
                date: today,
                lot_code: value.entl_lot_id,
                article: value.entl_art_code,
                old_stock: value.entl_quantite ?? 0,
              });

              await stockLot({
                lot_id: value.entl_lot_id,
                lot_art_code: value.entl_art_code,
                lot_quantite: value.entl_quantite,
                operation: "sortie",
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

      const res = await postData("/api/insert-database/", "t_retour_fournis", {
        rtf_code: rtf.rtf_code,
        rtf_ent_code: rtf.ent_code,
        rtf_date: today,
        rtf_montant_ht: totauxCalcules.ht,
        rtf_montant_ttc: totauxCalcules.ttc,
        rtf_fou_code: rtf.fournisseur.fou_code,
        rtf_fou_nom: rtf.fournisseur.fou_nom,
        rtf_motif: rtf.rtf_motif,
        rtf_observation: rtf.rtf_observation,
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
        message: "Retour fournisseur enregistrée avec succès",
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
    if (!open) return;

    if (skipSearch.current) {
      skipSearch.current = false;
      return;
    }

    const timer = setTimeout(() => rechercherBl(searchBl), 300);
    return () => {
      clearTimeout(timer);
    };
  }, [searchBl, open, rechercherBl]);

  useEffect(() => {
    fetchMotif("RF_MOTIF");
    fetchCode("t_retour_fournis", false);
  }, []);

  return (
    <>
      <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14 flex justify-between">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Ajout retour Fournisseur
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
                  value={rtf.rtf_code}
                  onChange={(e) => {
                    setRtf((prev) => ({
                      ...prev,
                      rtf_code: e.target.value,
                    }));
                  }}
                  readonly={true}
                />
              </div>
              <div>
                <Label>Bon de livraison</Label>
                <SearchableSelect<EntreeAutocomplete>
                  value={searchBl}
                  onChange={handleSearchChangeBl}
                  suggestions={suggestionsBl}
                  loading={loading}
                  required={true}
                  onSelect={choisirBl}
                  placeholder="Rechercher un bon de livraison"
                  noResultsText="Aucun proforma trouvé"
                  getKey={(bl: EntreeAutocomplete) => bl.ent_id}
                  inputClassName={inputClass}
                  renderItem={(bl: EntreeAutocomplete) => (
                    <div className="px-3 py-2">
                      <div className="text-sm font-medium text-gray-800 dark:text-white">
                        {bl?.fournisseur.fou_nom || ""}
                      </div>

                      <div className="truncate text-xs text-gray-500">
                        {bl?.ent_code || ""}
                      </div>

                      <div className="text-xs text-gray-400">
                        Crée le: {formatDate(bl?.ent_date) || ""}
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mb-2">
              <div>
                <Label>Contact</Label>
                <Input
                  name="contact"
                  type="text"
                  value={rtf.fournisseur.fou_tel1}
                  onChange={(e) => {
                    setRtf((prev) => ({
                      ...prev,
                      fournisseur: {
                        ...prev.fournisseur,
                        fou_tel1: e.target.value,
                      },
                    }));
                  }}
                  placeholder="Contact fournisseur"
                />
              </div>
              <div>
                <Label>Motif</Label>
                <Select
                  options={EnumerationOptions}
                  onChange={(value) =>
                    setRtf((prev) => ({
                      ...prev,
                      rtf_motif: value,
                    }))
                  }
                  defaultValue="35"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mb-2">
              <div>
                <Label>Observation</Label>
                <TextArea
                  name="observation"
                  placeholder="Observation"
                  value={rtf.rtf_observation}
                  onChange={(value) =>
                    setRtf((prev) => ({
                      ...prev,
                      rtf_observation: value,
                    }))
                  }
                  className="w-full"
                ></TextArea>
              </div>
            </div>
            <Label>Articles</Label>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 mt-5">
              <ListItems<EntreeLigne>
                items={rtf.ligne}
                columns={articleColumns}

                getKey={(article: EntreeLigne) => article.entl_uid || ""}

                onEdit={modifierArticle}

                onDelete={(item) => supprimerArticle(item.entl_uid!)}

                onItemsChange={setArticles}
                showActions={false}
                totals={[
                  {
                    label: "TOTAL HT",
                    value: (items: EntreeLigne[]) =>
                      items.reduce(
                        (total, article) =>
                          total + Number(article.entl_ht || 0),
                        0,
                      ) -
                      items.reduce(
                        (total, article) =>
                          total + Number(article.entl_montant_remise || 0),
                        0,
                      ),
                    suffix: "Ar",
                  },
                  {
                    label: "TOTAL REMISE",
                    value: (items: EntreeLigne[]) =>
                      items.reduce(
                        (total, article) =>
                          total + Number(article.entl_montant_remise || 0),
                        0,
                      ),
                    suffix: "Ar",
                  },
                  {
                    label: "TOTAL TVA",
                    value: (items: EntreeLigne[]) =>
                      items.reduce(
                        (total, article) =>
                          total + Number(article.entl_montant_tva || 0),
                        0,
                      ),
                    suffix: "Ar",
                  },

                  {
                    label: "TOTAL TTC",
                    value: (items: EntreeLigne[]) =>
                      items.reduce(
                        (total, article) =>
                          total +
                          Number(article.entl_ht || 0) +
                          Number(article.entl_montant_tva || 0),
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
