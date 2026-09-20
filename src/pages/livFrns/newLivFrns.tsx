/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useCallback, useEffect } from "react";
import SearchableSelect from "../Home/modal/utils/searchableSelect";
import {
  BCAutoComplete,
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
  });
  const [payementEnum, setpayementEnum] = useState<Enumeration[]>([]);
  const enumerationPaye: EnumerationOption[] = payementEnum.map(
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
      })),
    }));

    setSuggestions([]);
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

  useEffect(() => {
    fetchCode("t_entree", false);
    fetchPaye("MODE_PAY");
  }, []);

  useEffect(() => {
    if (!open) return;

    if (skipSearch.current) {
      skipSearch.current = false;
      return;
    }

    const timer = setTimeout(() => rechercherArticle(search), 300);
    return () => clearTimeout(timer);
  }, [search, open, rechercherArticle]);

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
          <form className="flex flex-col">
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
                        {cmf.cmf_code}
                      </div>

                      <div className="truncate text-xs text-gray-500">
                        {cmf.fournisseur.fou_nom}
                      </div>

                      <div className="text-xs text-gray-400">
                        Crée le: {formatDate(cmf.cmf_datecre)}
                      </div>
                    </div>
                  )}
                />
              </div>
              <div>
                <Label>N° Facture</Label>
                <Input
                  name="facture"
                  type="text"
                  value={values.facture}
                  onChange={handleChange}
                  placeholder="N° Facture"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mb-2">
              <div>
                <Label>Nom Fournisseur</Label>
                <Input
                  name="adresse"
                  type="text"
                  placeholder="L'adrèsse du fournisseur"
                  value={form.fournisseur.fou_nom}
                  onChange={(e) =>
                    handleFournisseurChange("fou_adresse", e.target.value)
                  }
                  className="w-full bg-transparent placeholder-white/70 outline-none"
                />
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
          </form>
        </div>
      </div>
    </div>
  );
}
