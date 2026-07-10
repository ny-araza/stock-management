/* eslint-disable @typescript-eslint/no-explicit-any */
import { CSSProperties, useEffect, useState, useRef, useMemo, useCallback } from "react";
import { apiFetch } from "../../../services/api";
import { Fourniseur } from "../../../interfaces/interfaces";
import Button from "../../ui/button/Button";
import { AgGridReact, CustomFilterProps, useGridFilter } from "ag-grid-react";
import {
  ColDef,
  FilterChangedEvent,
  colorSchemeDarkBlue,
  colorSchemeLight,
  themeQuartz,
} from "ag-grid-community";
import Pagination from "../../ui/pagination/Pagination";
import { PlusIcon } from "../../../icons";
import { useModal } from "../../../hooks/useModal";
import { Modal } from "../../ui/modal";
import { useForm } from "../../../hooks/useForm";
import { postData } from "../../../services/sendDataService";
import Input from "../../form/input/InputField";
import Label from "../../form/Label";
import Select, { Option } from "../../form/Select"
import { generateReference } from "../../../services/codeService";
import PhoneInput from "react-phone-number-input"

// Champs numeriques cote backend (django_filters.NumberFilter)
// -> on evite d'ajouter "icontains", on envoie la valeur brute.
const NUMBER_FIELDS = new Set(["fou_enabled"]);

// Champs date cote backend (DateFilter / DateTimeFilter)
const DATE_FIELDS = new Set([
  "fou_datecre",
  "fou_datemdf",
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

// Convertit le filterModel d'AgGrid en query params compris par VenteFilter
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


export default function FournisseurTable() {
  const gridRef = useRef<AgGridReact<Fourniseur>>(null);
  const [fournisseur, setFournisseur] = useState<Fourniseur[]>([])
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [hasPrevious, setHasPrevious] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [search, setSearch] = useState("")
  const [totalPages, setTotalPages] = useState(1)
  const { isOpen, openModal, closeModal } = useModal();
  const [sendError, setSendError] = useState<string | null>(null);
  const [reference, setReference] = useState("")
  //theme dark 
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );

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
    // return themeQuartz.withPart(isDark ? colorSchemeDarkBlue : colorSchemeLight).withParams({
    //   headerCellHoverBackgroundColor: "#781d99",
    //   rowHoverColor: "#781d99"
    // });
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

  const { values, handleChange, setField } = useForm({
    code: "",
    denomination: "",
    contact1: undefined as string | undefined,
    contact2: undefined as string | undefined,
    adresse: "",
    email: "",
    commercial: "",
    paiement: "",
  });
  const [onSubmitClick, setOnSubmutCliked] = useState(0)

  // filtres agGrid envoyes au backend
  const [filterParams, setFilterParams] = useState<URLSearchParams>(new URLSearchParams());
  const filterDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const columnDefs = useMemo<ColDef<Fourniseur>[]>(() => [
    {
      field: "fou_code",
      headerName: "Code",
      pinned: "left",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
    },
    {
      field: "fou_nom",
      headerName: "Nom",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
    },
    {
      field: "fou_datecre",
      headerName: "Date de création",
      filter: DateGranularityFilter,
      floatingFilter: false,
      valueFormatter: (params) =>
        formatDate(params.value),
    },

    {
      field: "fou_datemdf",
      headerName: "Modification",
      filter: DateGranularityFilter,
      floatingFilter: false,
      valueFormatter: (params) =>
        formatDate(params.value),
    },

    {
      field: "fou_usercre",
      headerName: "Créé par",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "fou_usermdf",
      headerName: "Modifié par",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "fou_tel1",
      headerName: "Contact1",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "fou_tel2",
      headerName: "Contact2",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "fou_adresse",
      headerName: "Adrèse",
      filter: "agNumberColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "fou_mail",
      headerName: "Mail",
      filter: "agNumberColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "fou_enabled",
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
      field: "fou_modepay",
      headerName: "Mode de paiement",
      filter: "agNumberColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "fou_commercial",
      headerName: "Commercial",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
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


  const paiementOption: Option[] = [
    { value: "mobile_money", label: "Mobile Money" },
    { value: "virements", label: "Virements" },
    { value: "espece", label: "Espèce" },
  ]

  // fetch avec search + filtres AgGrid (envoyes au backend)
  const fetchFourniseur = useCallback(async (
    pageNumber = page,
    keyword = search,
    filters = filterParams,
  ) => {
    try {
      const query = new URLSearchParams(filters);
      query.set("page", String(pageNumber));
      if (keyword) query.set("search", keyword);

      const res = await apiFetch(`/api/fournisseurs/?${query.toString()}`);

      if (res.status) {
        setFournisseur(res.fournisseur);
        setHasNext(res.next !== null);
        setHasPrevious(res.previous !== null);
        setTotalCount(res.count);
        setTotalPages(res.total_pages)
      } else {
        throw new Error(res.message || "Une erreur est survenue");
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [page, search, filterParams]);

  useEffect(() => {
    fetchFourniseur(page, search, filterParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onGridFilterChanged = (_event: FilterChangedEvent<Fourniseur>) => {
    const model = gridRef.current?.api.getFilterModel() ?? {};
    const params = buildFilterParams(model);
    console.log(params)
    if (filterDebounce.current) clearTimeout(filterDebounce.current);
    filterDebounce.current = setTimeout(() => {
      setFilterParams(params);
      setPage(1);
      fetchFourniseur(1, search, params);
    }, 1000); // laisse le temps de finir de taper avant d'interroger le backend
  };

  useEffect(() => {
    return () => {
      if (filterDebounce.current) clearTimeout(filterDebounce.current);
    };
  }, []);

  // get last codeCli
  const loadReference = async () => {
    try {
      const ref = await generateReference("t_fournis", "fou_code");
      setReference(ref);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadReference();
  }, [isOpen, onSubmitClick]);

  useEffect(() => {
    setField("code", reference)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference])

  const handleResetFilters = () => {
    gridRef.current?.api.setFilterModel(null); // vide les filtres AgGrid
    setFilterParams(new URLSearchParams());
    setSearch("");
    setPage(1);
    fetchFourniseur(1, "", new URLSearchParams());
  };

  if (error) return <div className="p-5 text-red-500">Erreur : {error}</div>;

  function formatDate(date: string): string {
    if (!date) {
      return ""
    }
    const temp = date.split('T')
    if (temp.length == 2) {
      const heure = temp[1].replace('Z', '')
      return `${temp[0]} à ${heure}`
    }
    return "Format invalide"
  }

  const styleMenu: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    marginTop: "10px"
  }

  const isFormEmpty = (
    data: Record<string, unknown>,
    ignoredFields: string[] = []
  ): boolean => {
    return Object.entries(data)
      .filter(([key]) => !ignoredFields.includes(key))
      .every(([, value]) =>
        value === "" ||
        value === null ||
        value === undefined
      );
  };


  // envoyer les donnee nouveau client
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnSubmutCliked(onSubmitClick + 1)
    try {
      if (!values.denomination && isFormEmpty(values, ["code", "denomination"])) {
        setSendError("Veuiller au moins remplir le champs denomination")
        return
      }
      const res = await postData(
        "/api/create-client-fournis/", "t_fournis", {
        fou_code: reference,
        fou_nom: values.denomination,
        fou_tel1: values.contact1,
        fou_tel2: values.contact2,
        fou_mail: values.email,
        fou_adresse: values.adresse,
        fou_modepay: values.paiement,
        fou_commercial: values.commercial
      }
      );
      if (res.status) {
        alert("Fournisseur enregistré");
      } else {
        setSendError(res.error)
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div style={styleMenu}>
        <Button title="Ajouter un forunisseur" onClick={openModal}>
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
            <AgGridReact<Fourniseur>
              rowData={fournisseur}
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
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Ajouter un nouveau fournisseur
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
                      disabled
                    />
                  </div>
                  <div>
                    <Label>Dénomination</Label>
                    <Input
                      name="denomination"
                      value={values.denomination}
                      type="text"
                      onChange={handleChange}
                      placeholder="Nom du fournisseur"
                    />
                  </div>
                  <div className="insert-num-client">
                    <div>
                      <Label>Contact 1</Label>
                      <PhoneInput
                        international
                        defaultCountry="MG"
                        value={values.contact1}
                        onChange={(value) => setField("contact1", value)}
                        className="rounded-lg text-gray-300 border border-gray-300 dark:border-gray-700 px-3 py-2"
                      />
                    </div>
                    <div>
                      <Label>Contact 2</Label>
                      <PhoneInput
                        international
                        defaultCountry="MG"
                        value={values.contact2}
                        onChange={(value) => setField("contact2", value)}
                        className="rounded-lg text-gray-300 border border-gray-300 dark:border-gray-700 px-3 py-2"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Adresse</Label>
                    <Input
                      name="adresse"
                      value={values.adresse}
                      onChange={handleChange}
                      placeholder="Adresse du fournisseur"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-7">
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email</Label>
                    <Input
                      name="email"
                      value={values.email}
                      onChange={handleChange}
                      placeholder="fournisseur@gmail.com"
                    />
                  </div>

                  <div className="lg:col-span-1">
                    <Label>Paiment</Label>
                    <Select
                      options={paiementOption}
                      onChange={(value) => setField("paiement", value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-between">
              <span className="text-red-600">{sendError}</span>
              <div>
                <Button size="sm" variant="outline" className="mr-5" onClick={closeModal}>
                  Fermer
                </Button>
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
