/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useCallback, useEffect } from "react";
import SearchableSelect from "../Home/modal/utils/searchableSelect";
import { BCAutoComplete } from "../../interfaces/interfaces";
import { Fourniseur } from "../../interfaces/interfaces";
import { apiFetch } from "../../services/api";
import { formatDate } from "../Home/modal/utils/utilsFucntions";

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
      cmf_fou_code: a.cmf_fou_code,
      cmf_dateliv: a.cmf_dateliv,
      cmf_montant_ht: Number(a.cmf_montant_ht ?? 0),
      cmf_montant_ttc: Number(a.cmf_montant_ttc ?? 0),
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
          <form className="h-100">
            <div>
              <SearchableSelect<BCAutoComplete>
                value={search}
                onChange={handleSearchChange}
                suggestions={suggestions}
                loading={loading}
                onSelect={choisirArticle}
                placeholder="Code ou nom de l'article"
                noResultsText="Aucun article trouvé"
                getKey={(cmf: BCAutoComplete) => cmf.cmf_id}
                inputClassName={inputClass}
                renderItem={(cmf: BCAutoComplete) => (
                  <div className="px-3 py-2">
                    <div className="text-sm font-medium text-gray-800 dark:text-white">
                      {cmf.cmf_code}
                    </div>

                    <div className="truncate text-xs text-gray-500">
                      {cmf.cmf_fou_code}
                    </div>

                    <div className="text-xs text-gray-400">
                      Crée le: {formatDate(cmf.cmf_datecre)}
                    </div>
                  </div>
                )}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
