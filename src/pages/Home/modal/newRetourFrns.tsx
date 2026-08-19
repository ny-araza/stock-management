/* eslint-disable @typescript-eslint/no-explicit-any */
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import { useForm } from "../../../hooks/useForm";
import { apiFetch } from "../../../services/api";
import { useCallback, useState, useRef, useEffect } from "react";
import Button from "../../../components/ui/button/Button";
import NewFrns from "../../Fournisseurs/newFrns";
import Select from "../../../components/form/Select";
import { Option } from "../../../components/form/Select";
import TextArea from "../../../components/form/input/TextArea";
import { postData } from "../../../services/sendDataService";
import Alert from "../../../components/ui/alert/Alert";

interface livFrns {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const NewRetourFrns: React.FC<livFrns> = ({ isOpen, onClose, className }) => {
  const { values, reset, setField, handleChange } = useForm({
    pieces: "",
    codeCf: "",
    facture: "",
    fournisseur: "",
    motif: "",
    observation: "",
    designation: "",
    code_frns: "",
    codeBl: "",
  });

  const [suggestions, setSuggestions] = useState([]);
  const [suggestionFrns, setSuggestionsFrns] = useState([]);
  const [showSuggestionFrns, setShowSuggestionsFrns] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [rowSuggestions, setRowSuggestions] = useState([]);
  const [showRowSuggestions, setShowRowSuggestions] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [showBLSuggestions, setShowBLSuggestions] = useState(false);
  const [BLSuggestions, setBLSuggestions] = useState([]);
  //ligne
  const [motif, setMotif] = useState<Option[]>();
  const articleRef = useRef<HTMLInputElement>(null);
  const [ligneArticle, setLigneArticle] = useState<any[]>([]);
  const prixArticle = {
    pri_id: "",
    pri_article: "",
    pri_designation: "",
    pri_quantite: 0,
    pri_pua: "",
    pri_tva: 0.0,
    pri_totalht: 0.0,
    remise: 0,
    datePeremption: "",
  };
  const [ligneEnCours, setLigneEnCours] = useState(prixArticle);
  const open = () => {
    setOpenModal(true);
  };
  const [alert, setAlert] = useState({
    open: false,
    variant: "success" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
  });
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const close = () => {
    setOpenModal(false);
  };
  const [stockDisponible, setStockDisponible] = useState<{
    [code: string]: number;
  }>({});
  const [ligneErreurs, setLigneErreurs] = useState<{ [cle: string]: string }>(
    {},
  );

  const rechercherFrns = useCallback(async (code: string) => {
    if (!code.trim()) {
      setSuggestionsFrns([]);
      setShowSuggestionsFrns(false);
      return;
    }

    try {
      const query = new URLSearchParams();
      query.set("search", code);
      const res = await apiFetch(`/api/fournisseurs/?${query.toString()}`);
      if (res.status) {
        setSuggestionsFrns(res.fournisseur);
        setShowSuggestionsFrns(true);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleFrnsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "fournisseur") {
      rechercherFrns(value);
      setField("fournisseur", value);
    }
  };

  const frnsChoisit = (frns: any) => {
    setField("fournisseur", frns.fou_nom);
    setField("code_frns", frns.fou_code);
    setShowSuggestionsFrns(false);
  };

  //function ligne
  const handleLigneChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setLigneEnCours((prev: any) => {
      const nouvelleLigne = {
        ...prev,
        [name]: value,
      };

      if (name === "pri_article") {
        rechercherArticle(value);
      }

      const quantite = Number(nouvelleLigne.pri_quantite) || 0;
      const pht = Number(nouvelleLigne.pri_pua) * quantite;
      const remise = pht * (Number(nouvelleLigne.remise) / 100);
      const pht_with_remise = pht - remise;
      nouvelleLigne.pri_totalht = pht_with_remise.toFixed(2);
      return nouvelleLigne;
    });
  };

  const ajouterLigne = () => {
    // évite d'ajouter une ligne totalement vide
    const estVide = Object.values(ligneEnCours).every((v) => v === "");
    if (estVide) return;

    if (ligneErreurs["nouvelle"]) {
      setAlert({
        open: true,
        variant: "error",
        title: `Quantité invalide ${ligneEnCours.pri_article}`,
        message: ligneErreurs["nouvelle"],
      });
      return;
    }

    setLigneArticle([...ligneArticle, ligneEnCours]);
    setLigneEnCours(prixArticle);
    setTimeout(() => {
      articleRef.current?.focus();
    });
  };

  const getOldStock = async (codeArticle: string) => {
    try {
      const res = await apiFetch(`/api/stock/article/${codeArticle}/`);
      console.log(res.stock);
      const quantiteStock = res?.stock?.stk_quantite ?? 0;
      setStockDisponible((prev) => ({ ...prev, [codeArticle]: quantiteStock }));
      return quantiteStock;
    } catch (error: any) {
      setStockDisponible((prev) => ({ ...prev, [codeArticle]: 0 }));
      return 0;
    }
  };

  const handleStock = async (stk: any) => {
    try {
      const quantity = stockDisponible[stk.article] - parseInt(stk.quantite);
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

  const handleLigneKeyDown = (e: any) => {
    if (e.key === "Enter") {
      e.preventDefault();
      ajouterLigne();
    }
  };

  const choisirArticle = (article: any) => {
    setLigneEnCours((prev: any) => ({
      ...prev,
      pri_article: article.code,
      pri_id: article.id,
      pri_pua: article.prix_ht,
      pri_designation: article.nom_article,
    }));
    getOldStock(article.code);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const rechercherArticle = useCallback(
    async (code: string, cible: "nouvelle" | "existante" = "nouvelle") => {
      if (!code.trim()) {
        if (cible === "nouvelle") {
          setSuggestions([]);
          setShowSuggestions(false);
        } else {
          setRowSuggestions([]);
          setShowRowSuggestions(false);
        }
        return;
      }

      try {
        const query = new URLSearchParams();
        query.set("search", code);
        const res = await apiFetch(
          `/api/articles-autocomplete/?${query.toString()}`,
        );
        if (res.status) {
          if (cible === "nouvelle") {
            setSuggestions(res.articles);
            setShowSuggestions(true);
          } else {
            setRowSuggestions(res.articles);
            setShowRowSuggestions(true);
          }
        }
      } catch (err) {
        console.error(err);
      }
    },
    [],
  );

  const rechercherBL = useCallback(async (code: string) => {
    if (!code.trim()) {
      setBLSuggestions([]);
      setShowBLSuggestions(false);
      return;
    }

    try {
      const query = new URLSearchParams();
      query.set("search", code);
      const res = await apiFetch(`/api/bl-autocomplete/?${query.toString()}`);
      if (res.status) {
        console.log(res.t_entree);
        setBLSuggestions(res.t_entree);
        setShowBLSuggestions(true);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleBlChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "codeBl") {
      rechercherBL(value);
      setField("codeBl", value);
    }
  };

  const modifierLigne = (
    index: number,
    field: keyof (typeof ligneArticle)[number],
    value: string,
  ) => {
    setLigneArticle((prev: any) =>
      prev.map((ligne: any, i: any) => {
        if (i !== index) return ligne;

        const pua = field === "pri_pua" ? Number(value) : Number(ligne.pri_pua);
        const qte =
          field === "pri_quantite" ? Number(value) : Number(ligne.pri_quantite);
        const remise =
          field === "remise" ? Number(value) : Number(ligne.remise);
        return {
          ...ligne,
          [field]: value,
          pri_totalht: pua * qte - pua * qte * (remise / 100),
        };
      }),
    );

    if (field === "pri_article") {
      setEditingRow(index);
      rechercherArticle(value, "existante");
    }
  };

  const choisirArticleLigne = (index: number, article: any) => {
    setLigneArticle((prev: any) =>
      prev.map((ligne: any, i: any) =>
        i === index
          ? {
              ...ligne,
              pri_article: article.code,
              pri_id: article.id,
              pri_pua: article.prix_ht,
              pri_designation: article.nom_article,
            }
          : ligne,
      ),
    );
    getOldStock(article.code);
    setRowSuggestions([]);
    setShowRowSuggestions(false);
    setEditingRow(null);
  };

  const supprimerLigne = (index: number) => {
    const nouvelleListe = ligneArticle.filter((_, i) => i !== index);
    // setField("ligneArticles", nouvelleListe);
    setLigneArticle(nouvelleListe);
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
        setField("pieces", res.code);
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
        const typeOptions: Option[] = res.nom_enumeration.map((item: any) => ({
          ...item,
          value: item.enu_id,
          label: item.enu_nom,
        }));
        if (typeOptions) setMotif(typeOptions);
      }
    } catch (error: any) {
      console.error(error);
    }
  };

  const totalHT = ligneArticle.reduce(
    (total, ligne) => total + Number(ligne.pri_totalht || 0),
    0,
  );

  const totalTVA = ligneArticle.reduce(
    (total, ligne) =>
      total +
      (Number(ligne.pri_totalht || 0) * Number(ligne.pri_tva || 0)) / 100,
    0,
  );

  const totalTTC = totalHT + totalTVA;

  useEffect(() => {
    const nouvellesErreurs: { [cle: string]: string } = {};

    // ligne en cours de saisie
    if (ligneEnCours.pri_article && ligneEnCours.pri_quantite) {
      const stock = stockDisponible[ligneEnCours.pri_article];
      const qte = Number(ligneEnCours.pri_quantite);
      if (stock !== undefined && qte > stock) {
        nouvellesErreurs["nouvelle"] =
          `Stock insuffisant (disponible : ${stock})`;
      }
    }

    // lignes déjà ajoutées dans le tableau
    ligneArticle.forEach((ligne, index) => {
      const stock = stockDisponible[ligne.pri_article];
      const qte = Number(ligne.pri_quantite);
      if (stock !== undefined && qte > stock) {
        nouvellesErreurs[index] = `Stock insuffisant (disponible : ${stock})`;
      }
    });

    setLigneErreurs(nouvellesErreurs);
  }, [
    ligneEnCours.pri_article,
    ligneEnCours.pri_quantite,
    ligneArticle,
    stockDisponible,
  ]);

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

  const BLChoisit = (bl: any) => {
    setField("codeBl", bl.ent_code);

    const lignes = (bl.ligne || []).map((ligne: any) => ({
      pri_article: ligne.entl_Art_Code || "",
      pri_designation: ligne.art_nom || "",
      pri_quantite: ligne.entl_Quantite || 0,
      pri_pua: ligne.entl_PrixAchat ?? "",
      pri_tva: ligne.entl_Tva ?? 0.0,
      pri_totalht: ligne.entl_TotalHT ?? 0.0,
      pri_id: ligne.entl_pri_id,
      remise: 0,
      datePeremption: ligne.entl_dateper || "",
    }));
    setField("fournisseur", bl.fournisseur.fou_nom);
    setField("code_frns", bl.fournisseur.fou_code);
    setField("codeCf", bl.ent_cmf_code);
    setLigneArticle(lignes);

    setShowBLSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const ligne_ok: boolean[] = [];
      if (totalHT != 0) {
        const today = new Date().toISOString().split("T")[0];
        const res = await postData(
          "/api/insert-database/",
          "t_retour_fournis",
          {
            rtf_code: values.pieces,
            rtf_date: today,
            rtf_ent_code: values.codeBl,
            rtf_facture: values.facture,
            rtf_montant_ht: parseInt(totalHT),
            rtf_montant_ttc: parseInt(totalTTC),
            rtf_fou_code: values.code_frns,
            rtf_motif: values.motif,
            rtf_observation: values.observation,
          },
        );
        if (res.status) {
          ligneArticle.map(async (value) => {
            const send = await postData(
              "/api/insert-database/",
              "t_ligne_rtf",
              {
                rtfl_quantite: value.pri_quantite,
                rtfl_pri_id: value.pri_id,
                rtfl_rtf_code: values.pieces,
                rtfl_prixunit: value.pri_pua,
                rtfl_tva: value.pri_tva,
                rtfl_ht: value.pri_totalht,
                rtfl_art_code: value.pri_article,
                rtfl_fou_code: values.code_frns,
                rtfl_ttc: (
                  parseInt(value.pri_totalht) +
                  (parseInt(value.pri_totalht) * parseInt(value.pri_tva)) / 100
                ).toFixed(2),
                rtfl_lot_code: value.datePeremption,
                rtfl_lot_dateper: value.datePeremption,
                rtfl_remise: value.remise ? value.remise : "0",
              },
            );

            handleCreateMvtStock({
              code_org: values.pieces,
              date: today,
              lot_code: value.datePeremption,
              origine: "t_retour_fournis",
              pri_id: value.pri_id,
              qte: value.pri_quantite,
              art_code: value.pri_article,
            });
            handleStock({
              quantite: value.pri_quantite,
              pri_id: value.pri_id,
              date: today,
              lot_code: value.datePeremption,
              article: value.pri_article,
            });
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
          fetchCode("t_retour_fournis", true);
          setAlert({
            open: true,
            variant: "success",
            title: "Opération réussie",
            message: "Livraison fournisseur enregistrer avec succès",
          });
          reset();
          setLigneArticle([]);
          return;
        } else {
          setAlert({
            open: true,
            variant: "error",
            title: "Une erreur est survenue",
            message: "Erreur lors de l'enregistrement dans la base de donnée",
          });
        }
      }

      setAlert({
        open: true,
        message: "Vous avez laisser un (des) champ(s) vide(s)",
        title: "Une erreur survenue",
        variant: "error",
      });
    } catch (error: any) {
      setAlert({
        open: true,
        message: `${error.error}`,
        title: "Une erreur survenue",
        variant: "error",
      });
    }
  };

  const clear = () => {
    reset();
    fetchCode("t_retour_fournis", false);
    setLigneArticle([]);
    setLigneEnCours({
      pri_article: "",
      pri_designation: "",
      pri_pua: "",
      pri_id: "",
      datePeremption: "",
      pri_quantite: 0,
      pri_totalht: 0,
      pri_tva: 0.0,
      remise: 0,
    });
  };

  useEffect(() => {
    fetchCode("t_retour_fournis", false);
    fetchMotif("RF_MOTIF");
    setField("motif", "42");
  }, [isOpen]);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} className={className}>
        <NewFrns isOpen={openModal} onClose={close}></NewFrns>
        <div className="no-scrollbar relative w-full max-w-[900px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14 flex justify-between">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Ajout retour fournisseur
            </h4>
            <span className="dark:text-white/90">
              {Date().split(" ")[2]}/{Date().split(" ")[1]}/
              {Date().split(" ")[3]}
            </span>
          </div>
          <form className="flex flex-col" onSubmit={handleSubmit}>
            <div className="custom-scrollbar h-[600px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-3 mb-2">
                <div>
                  <Label>Piece N°</Label>
                  <Input
                    name="pieces"
                    type="text"
                    value={values.pieces}
                    onChange={handleChange}
                    readonly={true}
                  />
                </div>
                <div>
                  <div>
                    <Label>Code BL</Label>
                    <div className="flex items-center w-full gap-2 flex-nowrap">
                      <div className="grid grid-cols-[1fr_auto] gap-2 w-full">
                        <Input
                          name="codeBl"
                          type="text"
                          value={values.codeBl}
                          onChange={handleBlChange}
                          required={true}
                          placeholder="Code Bon de livraison"
                          className="w-full bg-transparent placeholder-white/70 outline-none"
                        />
                      </div>
                    </div>
                    {showBLSuggestions && BLSuggestions.length > 0 && (
                      <div className="absolute z-100 w-70  bg-white border rounded shadow max-h-60 overflow-y-auto dark:bg-gray-800">
                        {BLSuggestions.map((bl: any) => (
                          <div
                            key={bl.ent_id}
                            onClick={() => BLChoisit(bl)}
                            className="cursor-pointer px-3 py-2"
                          >
                            <div className="text-xs text-gray-500">
                              {bl.ent_code}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Code CF</Label>
                  <Input
                    type="text"
                    value={values.codeCf}
                    onChange={handleChange}
                    name="codeCf"
                    placeholder="Code commande fournisseur"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mb-2">
                <div>
                  <Label>Fournisseur</Label>
                  <div className="flex items-center w-full gap-2 flex-nowrap">
                    <div className="grid grid-cols-[1fr_auto] gap-2 w-full">
                      <Input
                        name="fournisseur"
                        type="text"
                        value={values.fournisseur}
                        onChange={handleFrnsChange}
                        required={true}
                        placeholder="Nom du fournisseurs"
                        className="w-full bg-transparent placeholder-white/70 outline-none"
                      />
                      <Button
                        variant="outline"
                        title="Ajouter nouveau fournisseur"
                        onClick={() => open()}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  {showSuggestionFrns && suggestionFrns.length > 0 && (
                    <div className="absolute z-100 w-70  bg-white border rounded shadow max-h-60 overflow-y-auto dark:bg-gray-800">
                      {suggestionFrns.map((frns: any) => (
                        <div
                          key={frns.fou_id}
                          onClick={() => frnsChoisit(frns)}
                          className="cursor-pointer px-3 py-2"
                        >
                          <div className="text-xs text-gray-500">
                            {frns.fou_nom}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mb-2">
                <div>
                  <Label>Code facture</Label>
                  <Input
                    name="facture"
                    type="text"
                    value={values.facture}
                    onChange={handleChange}
                    placeholder="N° facture"
                  />
                </div>
                <div>
                  <Label>Motif</Label>
                  <Select
                    options={motif}
                    onChange={(value) => setField("motif", value)}
                    defaultValue="16"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 mb-4">
                <div>
                  <Label>Observation</Label>
                  <TextArea
                    name="observation"
                    placeholder="Observation"
                    value={values.observation}
                    onChange={(value) => setField("observation", value)}
                    className="w-full"
                  ></TextArea>
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 mt-5 h-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-brand-500 text-white">
                      <th className="p-2 text-left font-medium relative">
                        <input
                          style={{ borderBottom: "1px solid gray" }}
                          name="pri_article"
                          ref={articleRef}
                          value={ligneEnCours.pri_article}
                          onChange={handleLigneChange}
                          onKeyDown={handleLigneKeyDown}
                          placeholder="code article"
                          className="w-full bg-transparent placeholder-white/70 outline-none"
                        />
                        {showSuggestions && suggestions.length > 0 && (
                          <div className="absolute z-100 w-full bg-white border rounded shadow max-h-60 overflow-y-auto dark:bg-gray-800">
                            {suggestions.map((article: any) => (
                              <div
                                key={article.id}
                                onClick={() => choisirArticle(article)}
                                className="cursor-pointer px-3 py-2"
                              >
                                <div className="text-xs text-gray-500">
                                  {article.code}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </th>
                      <th className="p-2 text-left font-medium">
                        <input
                          style={{ borderBottom: "1px solid gray" }}
                          name="pri_designation"
                          value={ligneEnCours.pri_designation}
                          onChange={handleLigneChange}
                          onKeyDown={handleLigneKeyDown}
                          placeholder="designation"
                          className="w-full bg-transparent placeholder-white/70 outline-none"
                        />
                      </th>
                      <th className="p-2 text-left font-medium">
                        <input
                          style={{ borderBottom: "1px solid gray" }}
                          name="pri_quantite"
                          value={ligneEnCours.pri_quantite}
                          onChange={handleLigneChange}
                          onKeyDown={handleLigneKeyDown}
                          placeholder="quantite"
                          className="w-full bg-transparent placeholder-white/70 outline-none"
                        />
                      </th>
                      <th className="p-2 text-left font-medium">
                        <input
                          style={{ borderBottom: "1px solid gray" }}
                          name="pri_pua"
                          value={ligneEnCours.pri_pua}
                          onChange={handleLigneChange}
                          onKeyDown={handleLigneKeyDown}
                          placeholder="P.U"
                          className="w-full bg-transparent placeholder-white/70 outline-none"
                        />
                      </th>
                      <th className="p-2 text-left font-medium">
                        <input
                          style={{ borderBottom: "1px solid gray" }}
                          name="pri_tva"
                          value={ligneEnCours.pri_tva}
                          onChange={handleLigneChange}
                          onKeyDown={handleLigneKeyDown}
                          placeholder="TVA"
                          className="w-full bg-transparent placeholder-white/70 outline-none"
                        />
                      </th>
                      <th className="p-2 text-left font-medium">
                        <input
                          style={{ borderBottom: "1px solid gray" }}
                          name="remise"
                          value={ligneEnCours.remise}
                          onChange={handleLigneChange}
                          onKeyDown={handleLigneKeyDown}
                          placeholder="Remise %"
                          className="w-full bg-transparent placeholder-white/70 outline-none"
                        />
                      </th>
                      <th className="p-2 text-left font-medium">
                        <input
                          style={{ borderBottom: "1px solid gray" }}
                          name="pri_pht"
                          value={ligneEnCours.pri_totalht}
                          onChange={handleLigneChange}
                          onKeyDown={handleLigneKeyDown}
                          placeholder="Prix HT"
                          className="w-full bg-transparent placeholder-white/70 outline-none"
                        />
                      </th>
                      <th className="p-2 text-left font-medium">
                        <input
                          style={{ borderBottom: "1px solid gray" }}
                          name="datePeremption"
                          type="date"
                          value={ligneEnCours.datePeremption}
                          onChange={handleLigneChange}
                          onKeyDown={handleLigneKeyDown}
                          placeholder="Date péremption"
                          className="w-full bg-transparent placeholder-white/70 outline-none"
                        />
                      </th>
                      <th className="w-10 p-2 text-center">
                        <button
                          type="button"
                          onClick={ajouterLigne}
                          className="text-white"
                          title="Ajouter la ligne"
                        >
                          +
                        </button>
                      </th>
                    </tr>
                    <tr className="bg-brand-500 text-gray-400 text-xs">
                      <th className="p-2 text-left">Article</th>
                      <th className="p-2 w-30 text-left">Désignation</th>
                      <th className="p-2 text-left">Quantité</th>
                      <th className="p-2 text-left">P.U</th>
                      <th className="p-2 text-left">TVA (%)</th>
                      <th className="p-2 text-left">Remise (%)</th>
                      <th className="p-2 text-left">Prix HT</th>
                      <th className="p-2 text-left">Date Péremption</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody className="dark:bg-gray-900">
                    {ligneArticle.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-4 text-center text-gray-500 dark:text-gray-400"
                        >
                          Aucune ligne n'a encore été crée
                        </td>
                      </tr>
                    ) : (
                      ligneArticle.map((ligne, index) => (
                        <tr
                          key={index}
                          className="border-t border-gray-100 dark:border-gray-800 dark:text-white"
                        >
                          <td className="p-2 relative">
                            <input
                              required
                              value={ligne.pri_article}
                              onChange={(e) =>
                                modifierLigne(
                                  index,
                                  "pri_article",
                                  e.target.value,
                                )
                              }
                              onFocus={() => setEditingRow(index)}
                              className="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-2 py-1"
                            />
                            {editingRow === index &&
                              showRowSuggestions &&
                              rowSuggestions.length > 0 && (
                                <div className="absolute z-100  w-full bg-white border rounded shadow max-h-60 overflow-y-auto dark:bg-gray-800">
                                  {rowSuggestions.map((article: any) => (
                                    <div
                                      key={article.id}
                                      onClick={() =>
                                        choisirArticleLigne(index, article)
                                      }
                                      className="cursor-pointer px-3 py-2"
                                    >
                                      <div className="text-xs text-gray-500">
                                        {article.code}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                          </td>
                          <td className="p-2">
                            <input
                              value={ligne.pri_designation}
                              onChange={(e) =>
                                modifierLigne(
                                  index,
                                  "pri_designation",
                                  e.target.value,
                                )
                              }
                              className="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-2 py-1"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              required
                              value={ligne.pri_quantite}
                              onChange={(e) =>
                                modifierLigne(
                                  index,
                                  "pri_quantite",
                                  e.target.value,
                                )
                              }
                              className="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-2 py-1"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              required
                              value={ligne.pri_pua}
                              onChange={(e) =>
                                modifierLigne(index, "pri_pua", e.target.value)
                              }
                              className="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-2 py-1"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              value={ligne.pri_tva}
                              onChange={(e) =>
                                modifierLigne(index, "pri_tva", e.target.value)
                              }
                              className="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-2 py-1"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              value={ligne.remise}
                              onChange={(e) =>
                                modifierLigne(index, "remise", e.target.value)
                              }
                              className="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-2 py-1"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              required
                              readOnly
                              value={ligne.pri_totalht}
                              onChange={(e) =>
                                modifierLigne(
                                  index,
                                  "pri_totalht",
                                  e.target.value,
                                )
                              }
                              className="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-2 py-1"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              required
                              type="date"
                              value={ligne.datePeremption}
                              onChange={(e) =>
                                modifierLigne(
                                  index,
                                  "datePeremption",
                                  e.target.value,
                                )
                              }
                              className="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-2 py-1"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => supprimerLigne(index)}
                              className="text-red-500"
                              title="Supprimer la ligne"
                            >
                              −
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-gray-100 dark:bg-gray-800 font-semibold">
                    <tr>
                      <td colSpan={4}></td>

                      <td></td>
                      <td></td>
                      <td className="p-2 text-right dark:text-gray-300">
                        Total HT
                      </td>
                      <td></td>
                      <td className="p-2 text-right dark:text-gray-300">
                        {totalHT.toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={4}></td>

                      <td></td>
                      <td></td>
                      <td className="p-2 text-right dark:text-gray-300">
                        Total TVA
                      </td>
                      <td></td>
                      <td className="p-2 text-right dark:text-gray-300">
                        {totalTVA.toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                    <tr className="bg-brand-500 dark:text-gray-300">
                      <td colSpan={4}></td>
                      <td></td>
                      <td></td>
                      <td className="p-2 text-right">Total TTC</td>
                      <td></td>
                      <td className="p-2 text-right">
                        {totalTTC.toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
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
      </Modal>
    </>
  );
};

export default NewRetourFrns;
