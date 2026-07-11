import { CSSProperties, useEffect, useState, useRef, useMemo, useCallback } from "react";
import { apiFetch } from "../../../services/api";
import { Articles, Famille, FamilleOption, SousFamille, SousFamilleOption } from "../../../interfaces/interfaces";
import Button from "../../ui/button/Button";
import { PlusIcon } from "../../../icons";
import Input from "../../form/input/InputField";
import Label from "../../form/Label";
import { Modal } from "../../ui/modal";
import { useModal } from "../../../hooks/useModal";
import Select, { Option } from "../../form/Select"
import Pagination from "../../ui/pagination/Pagination";
import { useForm } from "../../../hooks/useForm";
import "react-phone-number-input/style.css"
import { postData } from "../../../services/sendDataService";
import { AgGridReact, CustomFilterProps, useGridFilter } from "ag-grid-react";
import {
  ColDef,
  FilterChangedEvent,
  colorSchemeDarkBlue,
  colorSchemeLight,
  themeQuartz,
} from "ag-grid-community";
import { SelectField } from "../../form/form-elements/inputSearch";
import { Dropdown } from "../../ui/dropdown/Dropdown";

// export default function articlesTable()
// Champs numeriques cote backend (django_filters.NumberFilter)
// -> on evite d'ajouter "icontains", on envoie la valeur brute.
const NUMBER_FIELDS = new Set(["art_enabled", "art_stockable"]);

// Champs date cote backend (DateFilter / DateTimeFilter)
const DATE_FIELDS = new Set([
  "art_datecre",
  "art_datemdf",
]);


// Filtre custom a 3 choix : Tous / Vrai / Faux (pour vte_valide, vte_paye)
interface BooleanFilterProps extends CustomFilterProps {
  trueLabel: string;
  falseLabel: string;
}
interface DateGranularityModel {
  granularity: "year" | "month" | "day";
  value: string; // "2023" | "2023-03" | "2023-03-13"
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DateGranularityFilter({ model, onModelChange }: CustomFilterProps<any, any, DateGranularityModel>) {
  const doesFilterPass = () => true;
  useGridFilter({ doesFilterPass });

  const [granularity, setGranularity] = useState<DateGranularityModel["granularity"]>(
    model?.granularity ?? "day"
  );
  const value = model?.value ?? "";

  const updateGranularity = (g: DateGranularityModel["granularity"]) => {
    setGranularity(g);
    onModelChange(null); // on vide la valeur precedente, sans revenir a "day"
  };

  const updateValue = (v: string) => {
    if (!v) {
      onModelChange(null);
      return;
    }
    onModelChange({ granularity, value: v });
  };


  return (
    <div className="p-2 flex flex-col gap-2 min-w-[180px]">
      <select
        className="border rounded p-1 text-sm"
        value={granularity}
        onChange={(e) => updateGranularity(e.target.value as DateGranularityModel["granularity"])}
      >
        <option value="year">Année</option>
        <option value="month">Mois</option>
        <option value="day">Jour</option>
      </select>

      {granularity === "year" && (
        <input
          type="number"
          placeholder="2023"
          className="border rounded p-1 text-sm"
          value={value}
          onChange={(e) => updateValue(e.target.value)}
        />
      )}

      {granularity === "month" && (
        <input
          type="month"
          placeholder="2023-12"
          className="border rounded p-1 text-sm"
          value={value}
          onChange={(e) => updateValue(e.target.value)}
        />
      )}

      {granularity === "day" && (
        <input
          type="date"
          className="border rounded p-1 text-sm"
          value={value}
          onChange={(e) => updateValue(e.target.value)}
        />
      )}
    </div>
  );
}


function BooleanFilter({ model, onModelChange, trueLabel, falseLabel }: BooleanFilterProps) {
  const doesFilterPass = () => true;
  useGridFilter({ doesFilterPass });

  const options: { value: string | null; label: string }[] = [
    { value: null, label: "Tous" },
    { value: "1", label: trueLabel },
    { value: "0", label: falseLabel },
  ];

  return (
    <div className="p-2 flex flex-col gap-2 min-w-[160px]">
      {options.map((opt) => (
        <label key={opt.label} className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="radio"
            name={`bool-filter-${trueLabel}`}
            checked={model === opt.value}
            onChange={() => onModelChange(opt.value)}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildFilterParams(filterModel: Record<string, any>): URLSearchParams {
  const params = new URLSearchParams();

  Object.entries(filterModel).forEach(([field, model]) => {
    if (!model) return;

    // filtre texte -> le backend applique deja icontains (filter_overrides)
    if (model.filterType === "text" && model.filter) {
      params.append(field, model.filter);
      return;
    }

    // filtre booleen custom (BooleanFilter) -> model est directement "1" ou "0"
    if (NUMBER_FIELDS.has(field)) {
      if (typeof model === "string" && model !== "") {
        params.append(field, model);
      } else if (model.filterType === "number" && model.filter !== undefined && model.filter !== null) {
        params.append(field, String(model.filter));
      }
      return;
    }

    if (DATE_FIELDS.has(field) && model && typeof model === "object" && "granularity" in model) {
      const { granularity, value } = model as DateGranularityModel;
      if (!value) return;

      if (granularity === "year") {
        params.append(`${field}_year`, value);
      } else if (granularity === "month") {
        const [year, month] = value.split("-");
        params.append(`${field}_year`, year);
        params.append(`${field}_month`, String(Number(month)));
      } else if (granularity === "day") {
        params.append(field, value); // utilise le lookup_expr="date" deja configure
      }
      return;
    }

  });

  return params;
}

export default function ArticleTable() {
  const gridRef = useRef<AgGridReact<Articles>>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const [articles, setArticles] = useState<Articles[]>([])
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [hasPrevious, setHasPrevious] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [search, setSearch] = useState("")
  const [totalPages, setTotalPages] = useState(1)
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );
  interface Enumeration {
    enu_id: number;
    enu_nom: string;
  }

  const [enumeration, setEnumeration] = useState<Enumeration[]>([]);
  const [famille, setFamille] = useState<Famille[]>([])
  const [selectedFamille, setSelectedFamille] = useState<Famille | null>(null);
  const [sousFamille, setSousFamille] = useState<SousFamille[]>([])
  const [selectedSousFamille, setSelectedSousFamille] = useState<SousFamille | null>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  function toggleDropdown() {
    setIsDropdownOpen(!isDropdownOpen);
  }

  function closeDropdown() {
    setIsDropdownOpen(false);
  }

  const [isDropdownOpen_1, setIsDropdownOpen_1] = useState(false);

  function toggleDropdown_1() {
    setIsDropdownOpen_1(!isDropdownOpen_1);
  }

  function closeDropdown_1() {
    setIsDropdownOpen_1(false);
  }

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const myTheme = useMemo(() => {
    if (isDark) {
      return themeQuartz
        .withPart(colorSchemeDarkBlue)
        .withParams({
          backgroundColor: "#101828",
          rowHoverColor: "#781d99"
        })
    }
    else {
      return themeQuartz
        .withPart(colorSchemeLight)
        .withParams({
          rowHoverColor: "#cb92df"
        })
    }
  }, [isDark]);

  // filtres agGrid envoyes au backend
  const [filterParams, setFilterParams] = useState<URLSearchParams>(new URLSearchParams());
  const filterDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { values, handleChange, setField, reset } = useForm({
    code: "",
    designation: "",
    marque: "",
    poids: "",
    taille: "",
    famille: "",
    sousFamille: "",
    lot: "",
    datePeremption: "",
    stockMini: "",
    codeBar: "",
    stockable: "1",
    enabled: "1"
  });
  const prixArticle = {
    pri_unitevente: "",
    pri_achat: "",
    pri_tauxmarge: "",
    pri_marge: "",
    pri_vte: "",
    pri_tva: "",
    pri_nbcolis: "",
  };
  const [ligneArticle, setLigneAticle] = useState([])
  const [ligneEnCours, setLigneEnCours] = useState(prixArticle);

  // const handleLigneChange = (e) => {
  //   const { name, value } = e.target;
  //   setLigneEnCours((prev) => ({ ...prev, [name]: value }));
  // };
  const handleLigneChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setLigneEnCours((prev) => {
      const nouvelleLigne = {
        ...prev,
        [name]: value,
      };

      const prixAchat = Number(nouvelleLigne.pri_achat) || 0;
      const tauxMarge = Number(nouvelleLigne.pri_tauxmarge) || 0;

      const marge = prixAchat * (tauxMarge / 100);
      const prixVente = prixAchat + marge;

      nouvelleLigne.pri_marge = marge.toFixed(2);
      nouvelleLigne.pri_vte = prixVente.toFixed(2);

      return nouvelleLigne;
    });
  };

  const ajouterLigne = () => {
    // évite d'ajouter une ligne totalement vide
    const estVide = Object.values(ligneEnCours).every((v) => v === "");
    if (estVide) return;
    setLigneAticle([...ligneArticle, ligneEnCours])
    setLigneEnCours(prixArticle);
  };

  const handleLigneKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      ajouterLigne();
    }
  };

  const supprimerLigne = (index) => {
    const nouvelleListe = ligneArticle.filter((_, i) => i !== index);
    // setField("ligneArticles", nouvelleListe);
    setLigneAticle(nouvelleListe)
  };

  const [onSubmitClick, setOnSubmutCliked] = useState(0)

  const columnDefs = useMemo<ColDef<Articles>[]>(() => [
    {
      field: "art_code",
      headerName: "Code",
      pinned: "left",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "art_nom",
      headerName: "Nom ",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
    },
    {
      field: "art_datecre",
      headerName: "Date de création",
      filter: DateGranularityFilter,
      floatingFilter: false,
      valueFormatter: (params) =>
        formatDate(params.value),
    },

    {
      field: "art_datemdf",
      headerName: "Modification",
      filter: DateGranularityFilter,
      floatingFilter: false,
      valueFormatter: (params) =>
        formatDate(params.value),
    },

    {
      field: "art_usercre",
      headerName: "Créé par",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "art_usermdf",
      headerName: "Modifié par",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "art_poids",
      headerName: "Poids",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "art_taille",
      headerName: "Taille",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "art_stockmini",
      headerName: "Stock Minimal",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
    },


    {
      field: "art_enabled",
      headerName: "Status",
      filter: BooleanFilter,
      filterParams: { trueLabel: "Actif", falseLabel: "Non actif" },
      floatingFilter: false,
      valueFormatter: (params) => {
        if (params.value == 1) {
          return "Actif"
        } else return "Non actif"
      }
    },
    {
      field: "art_fam_id",
      headerName: "Famille",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "art_sof_id",
      headerName: "Sous famille",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "art_codebarre",
      headerName: "Code Barre",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "art_lot_id",
      headerName: "Lot",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "art_stockable",
      headerName: "Type",
      filter: BooleanFilter,
      filterParams: { trueLabel: "Stockable", falseLabel: "Non stockable" },
      floatingFilter: false,
      valueFormatter: (params) => {
        if (params.value == 1) {
          return "Stockable"
        } else return "Non stockable"
      }
    },

    {
      field: "art_marque",
      headerName: "Marque",
      filter: false,
    },
  ], []);

  // configuration par defaut
  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    filter: true,
    floatingFilter: true,
    suppressFloatingFilterButton: true,
    resizable: true,
    flex: 1,
    minWidth: 150,
  }), []);

  const typeOptions: Option[] = [
    { value: 1, label: "Stockable" },
    { value: 0, label: "Non stockable" },
  ]

  const StatusOptions: Option[] = [
    { value: 1, label: "Actif" },
    { value: 0, label: "Non actif" },
  ]

  // fetch avec search + filtres AgGrid (envoyes au backend)
  const fetcharticles = useCallback(async (
    pageNumber = page,
    keyword = search,
    filters = filterParams,
  ) => {
    try {
      console.log(filters)
      const query = new URLSearchParams(filters);
      query.set("page", String(pageNumber));
      if (keyword) query.set("search", keyword);

      const res = await apiFetch(`/api/articles/?${query.toString()}`);

      if (res.status) {
        setArticles(res.articles);
        setHasNext(res.next !== null);
        setHasPrevious(res.previous !== null);
        setTotalCount(res.count);
        setTotalPages(res.total_pages)
      } else {
        throw new Error(res.message || "Une erreur est survenue");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    }
  }, [page, search, filterParams]);

  // fetch enumeration nom
  const fetchEnumeration = async (enu_code: string) => {
    try {
      const query = new URLSearchParams()
      query.set("enu_code", enu_code)
      const res = await apiFetch(`/api/generate-enumeration/?${query.toString()}`)

      if (res.success) {
        setEnumeration(res.nom_enumeration)
      }
    } catch (error: any) {
      setError(error.error)
    }
  }

  //fetch famille
  const fetchFamille = async () => {
    try {
      const res = await apiFetch(`/api/familles/`)
      if (res.status) {
        setFamille(res.famille)
      }
    } catch (error) {
      console.error(error)
    }
  }

  //fetch famille
  const fetchSousFamille = async (id_famille: number | null) => {
    try {
      const query = new URLSearchParams()
      if (id_famille)
        query.set("search", id_famille.toString())
      const res = await apiFetch(`/api/sous-familles/?${query.toString()}`)
      if (res.status) {
        setSousFamille(res.sous_famille)
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetcharticles(page, search, filterParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    fetchFamille()
    fetchSousFamille(selectedFamille?.fam_id)
    fetchEnumeration("UNITE_VENTE")
  }, [isOpen, selectedFamille])

  const familleOptions: FamilleOption[] = famille.map((item: Famille) => ({
    ...item,
    value: item.fam_id,       // Requis par react-select (ID unique informatique)
    label: item.fam_nom,      // Requis par react-select (Le texte affiché à l'écran)
  }));

  const sousFamilleOptions: SousFamilleOption[] = sousFamille.map((item: SousFamille) => ({
    ...item,
    value: item.sof_id,       // Requis par react-select (ID unique informatique)
    label: item.sof_nom,      // Requis par react-select (Le texte affiché à l'écran)
  }));

  //ajouter une nouvelle famille
  const [newFamille, setnewFamille] = useState({
    code: "",
    nom: "",
  });
  const [newSousFamille, setnewSousFamille] = useState({
    code: "",
    nom: "",
  });


  // modifier une ligne
  const modifierLigne = (
    index: number,
    field: keyof typeof ligneArticle[number],
    value: string
  ) => {
    setLigneAticle((prev) =>
      prev.map((ligne, i) =>
        i === index
          ? {
            ...ligne,
            [field]: value,
          }
          : ligne
      )
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onGridFilterChanged = (_event: FilterChangedEvent<Articles>) => {
    const model = gridRef.current?.api.getFilterModel() ?? {};
    const params = buildFilterParams(model);
    console.log(params)
    if (filterDebounce.current) clearTimeout(filterDebounce.current);
    filterDebounce.current = setTimeout(() => {
      setFilterParams(params);
      setPage(1);
      fetcharticles(1, search, params);
    }, 1000); // laisse le temps de finir de taper avant d'interroger le backend
  };

  useEffect(() => {
    return () => {
      if (filterDebounce.current) clearTimeout(filterDebounce.current);
    };
  }, []);

  const handleResetFilters = () => {
    gridRef.current?.api.setFilterModel(null); // vide les filtres AgGrid
    setFilterParams(new URLSearchParams());
    setSearch("");
    setPage(1);
    fetcharticles(1, "", new URLSearchParams());
  };


  // envoyer les donnee nouveau client
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnSubmutCliked(onSubmitClick + 1)
    try {
      console.log(ligneArticle)
      if (!values.code ||
        !values.designation ||
        !selectedFamille || !selectedSousFamille ||
        !values.stockMini) {
        setSendError("Les champs suivant sont requis: Code, designation, famille/sousfamille, stockmini")
        return
      }

      const res = await postData(
        "/api/create-client-fournis/", "t_article", {
        art_code: values.code,
        art_nom: values.designation,
        art_poids: parseFloat(values.poids),
        art_taille: parseFloat(values.taille),
        art_stockmini: parseInt(values.stockMini),
        art_enabled: values.enabled,
        art_fam_id: selectedFamille.fam_id,
        art_sof_id: selectedSousFamille.sof_id,
        art_codebarre: values.codeBar,
        art_lot_id: 1,
        art_stockable: values.stockable,
        art_marque: values.marque,
      }
      );

      ligneArticle.map((value) => {
        postData("/api/create-client-fournis/", "t_prix", {
          pri_enabled: 1,
          pri_vte: value.pri_vte,
          pri_achat: value.pri_achat,
          pri_art_code: values.code,
          pri_marge: value.pri_marge,
          pri_tauxmarge: value.pri_tauxmarge,
          pri_tva: value.pri_tva,
          pri_unitevente: value.pri_unitevente,
          pri_nbcolis: value.pri_nbcolis
        })
      })

      if (res.status) {
        alert("Client enregistré");
        reset()
        setSelectedFamille(null)
        setSelectedSousFamille(null)
        ligneArticle.map((values, key) => {
          supprimerLigne(key)
        })
      } else {
        setSendError(res.error)
      }
    } catch (err) {
      console.error(err);
    }
  };

  //send new famille
  const handleSubmitFamilly = async () => {
    try {
      if (!newFamille) return
      const res = await postData("/api/create-client-fournis/", "t_famille", {
        fam_code: newFamille.code,
        fam_nom: newFamille.nom,
        fam_enabled: 1
      })
      if (res.status) {
        alert("Famille enregistré");
      } else {
        setSendError(res.error)
      }
    } catch (error) {
      console.error(error)
    }
  }

  //send new sous famille
  const handleSubmitSousFamilly = async () => {
    try {
      if (!selectedSousFamille) {
        setSendError("Veuillez selectionner la famille du sous famille")
      }
      if (!newSousFamille) return
      const res = await postData("/api/create-client-fournis/", "t_sous_famille", {
        sof_code: newSousFamille.code,
        sof_nom: newSousFamille.nom,
        sof_fam_id: selectedFamille.fam_id,
        sof_enabled: 1
      })
      if (res.status) {
        alert("SousFamille enregistré");
      } else {
        setSendError(res.error)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const closeAndResetModal = () => {
    closeModal()
    reset()
    setSelectedFamille(null)
    setSelectedSousFamille(null)
    ligneArticle.map((values, key) => {
      supprimerLigne(key)
    })
  }

  if (error) return <div className="p-5 text-red-500">Erreur : {error}</div>;

  function formatDate(date: string): string {
    if (!date) {
      return ""
    }
    const temp = date.split('T')
    if (temp) {

      const heure = temp[1].replace('Z', '')
      return `${temp[0]} à ${heure}`
    }
    return "Format invalide"
  }

  const styleForm: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    width: "100%",
  }

  const styleMenu: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    marginTop: "10px"
  }


  return (
    <>
      <div style={styleMenu}>
        <Button onClick={openModal}>
          <PlusIcon></PlusIcon>
        </Button>
        <form method="POST">
          <div className="flex relative">
            <Button onClick={handleResetFilters}>
              <span>Réinitialiser</span>
            </Button>
          </div>
        </form>
      </div>
      <div className="overflow-hidden border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <div
            className="ag-theme-quartz dark:ag-theme-quartz-dark"
            style={{
              height: "800px",
              width: "100%",
            }}
          >
            <AgGridReact<Articles>
              rowData={articles}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              animateRows
              pagination={false}
              theme={myTheme}
              ref={gridRef}
              onFilterChanged={onGridFilterChanged}
            />
          </div>
        </div>
        <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-white/[0.05]">
          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
            onPageChange={setPage}
          />
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={closeAndResetModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Ajouter un article
            </h4>

          </div>
          <form className="flex flex-col" onSubmit={handleSubmit}>
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">

                  <div>
                    <Label>Code</Label>
                    <Input
                      name="code"
                      value={values.code}
                      type="text"
                      onChange={handleChange}
                      placeholder="Code de l'article"
                    />
                  </div>
                  <div>
                    <Label>Désignation</Label>
                    <Input
                      name="designation"
                      value={values.designation}
                      type="text"
                      onChange={handleChange}
                      placeholder="Nom de l'article"
                    />
                  </div>
                  <div>
                    <Label>Marque</Label>
                    <Input
                      name="marque"
                      value={values.marque}
                      onChange={handleChange}
                      placeholder="Marque de l'article"
                    />
                  </div>
                  <div>
                    <Label>Stock minimum</Label>
                    <Input
                      name="stockMini"
                      type="number"
                      value={values.stockMini}
                      onChange={handleChange}
                      placeholder="Stock minimum"
                      min="0"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-7">
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Poids</Label>
                    <Input
                      type="number"
                      name="poids"
                      value={values.poids}
                      onChange={handleChange}
                      placeholder="en gramme"
                      min="0"
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Taille</Label>
                    <Input
                      name="taille"
                      type="number"
                      value={values.taille}
                      onChange={handleChange}
                      placeholder="taille"
                      min="0.00"
                    />
                  </div>
                  <div className="col-span-2 lg:col-span-1 flex">
                    <SelectField<FamilleOption>
                      label="Famille"
                      options={familleOptions}
                      value={selectedFamille}
                      onChange={setSelectedFamille}
                      placeholder="Rechercher une famille..."
                    />
                    <div className="relative inline-block">
                      <button className="dropdown-toggle" type="button" onClick={toggleDropdown_1}>
                        +
                      </button>
                      <Dropdown
                        isOpen={isDropdownOpen_1}
                        onClose={closeDropdown_1}
                        className="w-40 p-2"

                      >
                        <Label>Ajouter famille</Label>
                        <input
                          type="text"
                          placeholder="Code"
                          value={newFamille.code}
                          onChange={(e) =>
                            setnewFamille((prev) => ({
                              ...prev,
                              code: e.target.value,
                            }))
                          }
                          className="mb-3 w-full rounded border px-3 py-2 dark:bg-gray-800"
                        />
                        <input
                          type="text"
                          placeholder="Nom"
                          value={newFamille.nom}
                          onChange={(e) =>
                            setnewFamille((prev) => ({
                              ...prev,
                              nom: e.target.value,
                            }))
                          }
                          className="mb-3 w-full rounded border px-3 py-2 dark:bg-gray-800"
                        />
                        <Button title="ajouter nouveau famille" onClick={handleSubmitFamilly}>+</Button>
                      </Dropdown>
                    </div>
                  </div>
                  <div className="col-span-2 lg:col-span-1 flex">
                    <SelectField<SousFamilleOption>
                      label="Sous-famille"
                      options={sousFamilleOptions}
                      value={selectedSousFamille}
                      onChange={setSelectedSousFamille}
                      placeholder="Rechercher une sous-famille..."
                    />
                    <div className="relative inline-block">
                      <button className="dropdown-toggle" type="button" onClick={toggleDropdown}>
                        +
                      </button>
                      <Dropdown
                        isOpen={isDropdownOpen}
                        onClose={closeDropdown}
                        className="w-40 p-2"

                      >
                        <Label>Ajouter sous famille</Label>
                        <Label>{selectedFamille ? `pour ${selectedFamille.fam_nom}` : ""}</Label>
                        <input
                          type="text"
                          placeholder="Code"
                          value={newSousFamille.code}
                          onChange={(e) =>
                            setnewSousFamille((prev) => ({
                              ...prev,
                              code: e.target.value,
                            }))
                          }
                          className="mb-3 w-full rounded border px-3 py-2 dark:bg-gray-800"
                        />
                        <input
                          type="text"
                          placeholder="Nom"
                          value={newSousFamille.nom}
                          onChange={(e) =>
                            setnewSousFamille((prev) => ({
                              ...prev,
                              nom: e.target.value,
                            }))
                          }
                          className="mb-3 w-full rounded border px-3 py-2 dark:bg-gray-800"
                        />
                        <Button title="ajouter nouveau sous famille" onClick={handleSubmitSousFamilly}>+</Button>
                      </Dropdown>
                    </div>
                  </div>
                  <div style={styleForm}>
                    <div className="col-span-2 w-100">
                      <Label>Type stockage</Label>
                      <Select
                        options={typeOptions}
                        onChange={(value) => setField("stockable", value)}
                        defaultValue={typeOptions[0].label}
                      />
                    </div>
                    <div className="col-span-2 w-100">
                      <Label>Status</Label>
                      <Select
                        options={StatusOptions}
                        onChange={(value) => setField("enabled", value)}
                        defaultValue={StatusOptions[0].label}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-7">
                  <Label>Lignes d'articles</Label>

                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-brand-500 text-white">
                          <th className="p-2 text-left font-medium">
                            <select name="pri_unitevente"
                              value={ligneEnCours.pri_unitevente}
                              onChange={handleLigneChange}
                              onKeyDown={handleLigneKeyDown}
                            >
                              {enumeration.map((value) => (
                                <option key={value.enu_id} value={value.enu_nom}>{value.enu_nom}</option>
                              ))}
                            </select>
                          </th>
                          <th className="p-2 text-left font-medium">
                            <input
                              name="pri_achat"

                              value={ligneEnCours.pri_achat}
                              onChange={handleLigneChange}
                              onKeyDown={handleLigneKeyDown}
                              placeholder="Prix Achat"
                              className="w-full bg-transparent placeholder-white/70 outline-none"
                            />
                          </th>
                          <th className="p-2 text-left font-medium">
                            <input
                              name="pri_tauxmarge"

                              value={ligneEnCours.pri_tauxmarge}
                              onChange={handleLigneChange}
                              onKeyDown={handleLigneKeyDown}
                              placeholder="Taux Marge"
                              className="w-full bg-transparent placeholder-white/70 outline-none"
                            />
                          </th>
                          <th className="p-2 text-left font-medium">
                            <input
                              name="pri_marge"

                              value={ligneEnCours.pri_marge}
                              onChange={handleLigneChange}
                              onKeyDown={handleLigneKeyDown}
                              placeholder="Marge"
                              className="w-full bg-transparent placeholder-white/70 outline-none"
                            />
                          </th>
                          <th className="p-2 text-left font-medium">
                            <input
                              name="pri_vte"

                              value={ligneEnCours.pri_vte}
                              onChange={handleLigneChange}
                              onKeyDown={handleLigneKeyDown}
                              placeholder="Prix Vente"
                              className="w-full bg-transparent placeholder-white/70 outline-none"
                            />
                          </th>
                          <th className="p-2 text-left font-medium">
                            <input
                              name="pri_tva"
                              placeholder="TVA"
                              value={ligneEnCours.pri_tva}
                              onChange={handleLigneChange}
                              onKeyDown={handleLigneKeyDown}
                              className="w-full bg-transparent placeholder-white/70 outline-none"
                            />
                          </th>
                          <th className="p-2 text-left font-medium">
                            <input
                              name="pri_nbcolis"

                              value={ligneEnCours.pri_nbcolis}
                              onChange={handleLigneChange}
                              onKeyDown={handleLigneKeyDown}
                              placeholder="Colis"
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
                        <tr className="bg-brand-500 text-white text-xs">
                          <th className="p-2 text-left">Unité Vente</th>
                          <th className="p-2 text-left">Prix Achat</th>
                          <th className="p-2 text-left">Taux Marge</th>
                          <th className="p-2 text-left">Marge</th>
                          <th className="p-2 text-left">Prix Vente</th>
                          <th className="p-2 text-left">Tva(%)</th>
                          <th className="p-2 text-left">Colis</th>
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
                              Aucun contenu dans la table
                            </td>
                          </tr>
                        ) : (
                          ligneArticle.map((ligne, index) => (
                            <tr
                              key={index}
                              className="border-t border-gray-100 dark:border-gray-800"
                            >
                              <td className="p-2">
                                <select
                                  value={ligne.pri_unitevente}
                                  onChange={(e) =>
                                    modifierLigne(index, "pri_unitevente", e.target.value)
                                  }
                                  className="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-2 py-1"
                                >
                                  {enumeration.map((item) => (
                                    <option key={item.enu_id} value={item.enu_nom}>
                                      {item.enu_nom}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              <td className="p-2">
                                <input

                                  value={ligne.pri_achat}
                                  onChange={(e) =>
                                    modifierLigne(index, "pri_achat", e.target.value)
                                  }
                                  className="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-2 py-1"
                                />
                              </td>

                              <td className="p-2">
                                <input

                                  value={ligne.pri_tauxmarge}
                                  onChange={(e) =>
                                    modifierLigne(index, "pri_tauxmarge", e.target.value)
                                  }
                                  className="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-2 py-1"
                                />
                              </td>

                              <td className="p-2">
                                <input

                                  value={ligne.pri_marge}
                                  onChange={(e) =>
                                    modifierLigne(index, "pri_marge", e.target.value)
                                  }
                                  className="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-2 py-1"
                                />
                              </td>

                              <td className="p-2">
                                <input

                                  value={ligne.pri_vte}
                                  onChange={(e) =>
                                    modifierLigne(index, "pri_vte", e.target.value)
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

                                  value={ligne.pri_nbcolis}
                                  onChange={(e) =>
                                    modifierLigne(index, "pri_nbcolis", e.target.value)
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
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-between">
              <span className="text-red-600">{sendError}</span>
              <div>
                <Button size="sm" type="submit" >
                  Sauvegarder
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
