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
import { postData } from "../../../services/sendDataService";
import montantTTCEnLettres from "../../../utils/montantEnLettre";
import Alert from "../../../components/ui/alert/Alert";
import { Enumeration, EnumerationOption } from "../../../interfaces/interfaces";

interface cmdFrns {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const NewCommandFrns: React.FC<cmdFrns> = ({ isOpen, onClose, className }) => {
  const { values, reset, setField, handleChange } = useForm({
    pieces: "",
    fournisseur: "",
    contact1: "",
    contact2: "",
    adresse: "",
    mail: "",
    modeCmd: "",
    dateLiv: "",
    designation: "",
    code_frns: "",
  });

  const [suggestions, setSuggestions] = useState([]);
  const [suggestionFrns, setSuggestionsFrns] = useState([]);
  const [showSuggestionFrns, setShowSuggestionsFrns] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [rowSuggestions, setRowSuggestions] = useState([]);
  const [showRowSuggestions, setShowRowSuggestions] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [commandeEnum, setCommandEnum] = useState<Enumeration[]>([]);
  const enumerationCmd: EnumerationOption[] = commandeEnum.map(
    (item: Enumeration) => ({
      ...item,
      value: item.enu_id.toString(),
      label: item.enu_nom,
    }),
  );
  //ligne
  const articleRef = useRef<HTMLInputElement>(null);
  const [ligneArticle, setLigneArticle] = useState<any[]>([]);
  const prixArticle = {
    pri_id: "",
    pri_article: "",
    pri_designation: "",
    pri_quantite: "",
    pri_pua: "",
    pri_tva: "",
    pri_totalht: "",
  };
  const [ligneEnCours, setLigneEnCours] = useState(prixArticle);
  const open = () => {
    setOpenModal(true);
  };
  const dropdownRef = useRef<HTMLDivElement>(null);
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
    setField("adresse", frns.fou_adresse);
    setField("contact1", frns.fou_tel1);
    setField("contact2", frns.fou_tel2);
    setField("modeCmd", frns.fou_modepay);
    setField("code_frns", frns.fou_code);
    setField("mail", frns.fou_mail);
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
      nouvelleLigne.pri_totalht = pht.toFixed(2);

      return nouvelleLigne;
    });
  };

  const ajouterLigne = () => {
    // évite d'ajouter une ligne totalement vide
    const estVide = Object.values(ligneEnCours).every((v) => v === "");
    if (estVide) return;
    setLigneArticle([...ligneArticle, ligneEnCours]);
    setLigneEnCours(prixArticle);
    setTimeout(() => {
      articleRef.current?.focus();
    });
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

    setSuggestions([]);
    setShowSuggestions(false);
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

        return {
          ...ligne,
          [field]: value,
          pri_totalht: pua * qte,
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
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const ligne_ok: boolean[] = [];
      if (totalHT != 0 && totalTVA != 0) {
        const today = new Date().toISOString().split("T")[0];
        const res = await postData("/api/insert-database/", "t_cmd_fournis", {
          cmf_code: values.pieces,
          cmf_modecmd: parseFloat(values.modeCmd),
          cmf_dateliv: values.dateLiv,
          cmf_montant_ht: parseInt(totalHT),
          cmf_montant_ttc: parseInt(totalTTC),
          cmf_islivre: false,
          cmf_fou_code: values.code_frns,
          cmf_date: today,
          cmf_lettre: montantTTCEnLettres(totalTTC),
        });
        if (res.status) {
          ligneArticle.map(async (value) => {
            const send = await postData(
              "/api/insert-database/",
              "t_ligne_cmd_fournis",
              {
                cmfl_quantite: value.pri_quantite,
                cmfl_pri_id: value.pri_id,
                cmfl_cmf_code: values.pieces,
                cmfl_prixachat: value.pri_pua,
                cmfl_tva: value.pri_tva,
                cmfl_totalht: value.pri_totalht,
                cmfl_art_code: value.pri_article,
                cmfl_fou_code: values.code_frns,
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
    } catch (error) {
      console.error(error);
    }
  };

  const clear = () => {
    reset();
    fetchCode("t_cmd_fournis", false);
    setLigneArticle([]);
    setLigneEnCours({
      pri_article: "",
      pri_designation: "",
      pri_pua: "",
      pri_totalht: "",
      pri_tva: "",
      pri_id: "",
      pri_quantite: "",
    });
  };

  useEffect(() => {
    fetchCode("t_cmd_fournis", false);
    fetchCommande("MODE_COM");
  }, [isOpen]);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} className={className}>
        <NewFrns isOpen={openModal} onClose={close}></NewFrns>
        <div className="no-scrollbar relative w-full max-w-[900px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14 flex justify-between">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Ajout commande fournisseurs
            </h4>
            <span className="dark:text-white/90">
              {Date().split(" ")[2]}/{Date().split(" ")[1]}/
              {Date().split(" ")[3]}
            </span>
          </div>
          <form className="flex flex-col" onSubmit={handleSubmit}>
            <div className="custom-scrollbar h-[600px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mb-2">
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
                  <Label>Date de livraison</Label>
                  <Input
                    type="date"
                    value={values.dateLiv}
                    onChange={handleChange}
                    name="dateLiv"
                    required={true}
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
                            { frns.fou_code} - {frns.fou_nom}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Label>Adrèsse</Label>
                  <Input
                    name="adresse"
                    type="text"
                    placeholder="L'adrèsse du fournisseur"
                    value={values.adresse}
                    onChange={handleChange}
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
                    value={values.contact1}
                    onChange={handleChange}
                    placeholder="N° de tel 1"
                    className="w-full bg-transparent placeholder-white/70 outline-none"
                  />
                </div>
                <div>
                  <Label>Contact 2</Label>
                  <Input
                    name="contact2"
                    type="text"
                    value={values.contact2}
                    placeholder="N° de tel 2"
                    onChange={handleChange}
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
                    value={values.mail}
                    onChange={handleChange}
                    placeholder="fournisseurs@gmail.com"
                    className="w-full bg-transparent placeholder-white/70 outline-none"
                  />
                </div>
                <div>
                  <Label>Mode de commande</Label>
                  <Select
                    options={enumerationCmd}
                    onChange={(value) => setField("modeCmd", value)}
                    defaultValue="8"
                  ></Select>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 mt-5 h-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-brand-500 text-white">
                      <th
                        className="w-[120px] min-w-[120px] p-2 text-left font-medium relative"
                        ref={dropdownRef}
                      >
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
                          <div className="absolute z-100 w-min-[50px] bg-white border rounded shadow max-h-60 overflow-y-auto dark:bg-gray-800">
                            {suggestions.map((article: any) => (
                              <div
                                key={article.id}
                                onClick={() => choisirArticle(article)}
                                className="cursor-pointer px-3 py-2"
                              >
                                <div className="text-xs text-gray-500">
                                  {article.code} - {article.nom_article}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </th>
                      <th className="w-[220px] min-w-[220px] p-2 text-left font-medium">
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
                      <th className="w-[120px] min-w-[120px] p-2 text-left font-medium">
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
                      <th className="w-[120px] min-w-[120px] p-2 text-left font-medium">
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
                      <th className="w-[120px] min-w-[120px] p-2 text-left font-medium">
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
                      <th className="w-[120px] min-w-[120px] p-2 text-left font-medium">
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
                      <th className="p-2 text-left">TVA</th>
                      <th className="p-2 text-left">Prix HT</th>
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
                                        {article.code} - {article.nom_article}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                          </td>
                          <td className="p-2">
                            <input
                              required
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
                              required
                              value={ligne.pri_tva}
                              onChange={(e) =>
                                modifierLigne(index, "pri_tva", e.target.value)
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

                      <td className="p-2 text-right dark:text-gray-300">
                        Total HT
                      </td>
                      <td className="p-2 text-right dark:text-gray-300">
                        {totalHT.toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan={4}></td>

                      <td className="p-2 text-right dark:text-gray-300">
                        Total TVA
                      </td>
                      <td className="p-2 text-right dark:text-gray-300">
                        {totalTVA.toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td></td>
                    </tr>
                    <tr className="bg-brand-500 dark:text-gray-300">
                      <td colSpan={4}></td>
                      <td className="p-2 text-right">Total TTC</td>
                      <td className="p-2 text-right">
                        {totalTTC.toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td></td>
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

export default NewCommandFrns;
