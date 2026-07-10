/* eslint-disable @typescript-eslint/no-explicit-any */
import { CSSProperties, useEffect, useState, useRef, useMemo, useCallback } from "react";
import { apiFetch } from "../../../services/api";
import { ListeVente } from "../../../interfaces/interfaces";
import Button from "../../ui/button/Button";
import { AgGridReact, CustomFilterProps, useGridFilter } from "ag-grid-react";
import {
  ColDef,
  ICellRendererParams,
  FilterChangedEvent,
  colorSchemeDarkBlue,
  colorSchemeLight,
  themeQuartz,
} from "ag-grid-community";
import Pagination from "../../ui/pagination/Pagination";

// Champs numeriques cote backend (django_filters.NumberFilter)
// -> on evite d'ajouter "icontains", on envoie la valeur brute.
const NUMBER_FIELDS = new Set(["vte_valide", "vte_paye"]);

// Champs date cote backend (DateFilter / DateTimeFilter)
const DATE_FIELDS = new Set([
  "vte_datecre",
  "vte_datemd",
  "vte_datevalide",
  "vte_datepay",
  "ve_dateecheance",
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


export default function VentesTable() {
  const gridRef = useRef<AgGridReact<ListeVente>>(null);
  const [ventes, setventes] = useState<ListeVente[]>([])
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [hasPrevious, setHasPrevious] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [search, setSearch] = useState("")
  const [totalPages, setTotalPages] = useState(1)
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

  // filtres agGrid envoyes au backend
  const [filterParams, setFilterParams] = useState<URLSearchParams>(new URLSearchParams());
  const filterDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const columnDefs = useMemo<ColDef<ListeVente>[]>(() => [
    {
      field: "vte_code",
      headerName: "Code",
      pinned: "left",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
      cellClass: (params) =>
        codeColor(params.data?.vte_valide, params.data?.vte_paye),
    },

    {
      field: "ve_code_bl",
      headerName: "Code BL",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "vte_cli_code",
      headerName: "Code Client",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "vte_cli_nom",
      headerName: "Client",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
      cellRenderer: (params: ICellRendererParams<ListeVente>) => (
        <div className="py-1">

          <div className="font-medium">
            {params.data?.vte_cli_nom}
          </div>

          <div className="text-xs text-gray-500">
            Code : {params.data?.vte_cli_code}
          </div>

          <div className="text-xs text-gray-500">
            {params.data?.vte_cli_contact}
          </div>

        </div>
      ),
    },

    {
      field: "ve_adresse_liv",
      headerName: "Adresse",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "vte_datecre",
      headerName: "Date de création",
      filter: DateGranularityFilter,
      floatingFilter: false,
      valueFormatter: (params) =>
        formatDate(params.value),
    },

    {
      field: "vte_datemd",
      headerName: "Modification",
      filter: DateGranularityFilter,
      floatingFilter: false,
      valueFormatter: (params) =>
        formatDate(params.value),
    },

    {
      field: "vte_usercre",
      headerName: "Créé par",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "vte_usermdf",
      headerName: "Modifié par",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "vte_valide",
      headerName: "Validé",
      filter: BooleanFilter,
      filterParams: { trueLabel: "Validé", falseLabel: "Non validé" },
      floatingFilter: false,
      valueFormatter: (params) => {
        if (params.value == 1) {
          return "Validé"
        } else return "Non validé"
      }
    },

    {
      field: "vte_datevalide",
      headerName: "Date validation",
      filter: DateGranularityFilter,
      floatingFilter: false,
      valueFormatter: (params) =>
        formatDate(params.value),
    },

    {
      field: "vte_paye",
      headerName: "Payé",
      filter: BooleanFilter,
      filterParams: { trueLabel: "Payé", falseLabel: "Non payé" },
      floatingFilter: false,
      valueFormatter: (params) => {
        if (params.value == 1) {
          return "Payé"
        } else return "Non payé"
      }
    },

    {
      field: "vte_datepay",
      headerName: "Date paiement",
      filter: DateGranularityFilter,
      floatingFilter: false,
      valueFormatter: (params) =>
        formatDate(params.value),
    },

    {
      field: "vte_modepaye",
      headerName: "Mode",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "vte_payeclient",
      headerName: "Montant payé",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "vte_montant_ht",
      headerName: "HT",
      filter: "agNumberColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "vte_montant_ttc",
      headerName: "TTC",
      filter: "agNumberColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "vte_livreur",
      headerName: "Livreur",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "vet_operateur",
      headerName: "Opérateur",
      filter: "agTextColumnFilter",
      suppressHeaderFilterButton: true,
    },

    {
      field: "ve_dateecheance",
      headerName: "Échéance",
      filter: DateGranularityFilter,
      floatingFilter: false,
      valueFormatter: (params) =>
        formatDate(params.value),
    },

    {
      field: "ve_remise",
      headerName: "Remise",
      filter: false,
      suppressHeaderFilterButton: true,
    },

    {
      field: "ve_proforma",
      headerName: "Proforma",
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

  // fetch avec search + filtres AgGrid (envoyes au backend)
  const fetchVentes = useCallback(async (
    pageNumber = page,
    keyword = search,
    filters = filterParams,
  ) => {
    try {
      const query = new URLSearchParams(filters);
      query.set("page", String(pageNumber));
      if (keyword) query.set("search", keyword);

      const res = await apiFetch(`/api/ventes/?${query.toString()}`);

      if (res.status) {
        setventes(res.ventes);
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
    fetchVentes(page, search, filterParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onGridFilterChanged = (_event: FilterChangedEvent<ListeVente>) => {
    const model = gridRef.current?.api.getFilterModel() ?? {};
    const params = buildFilterParams(model);
    console.log(params)
    if (filterDebounce.current) clearTimeout(filterDebounce.current);
    filterDebounce.current = setTimeout(() => {
      setFilterParams(params);
      setPage(1);
      fetchVentes(1, search, params);
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
    fetchVentes(1, "", new URLSearchParams());
  };

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

  const styleMenu: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    marginTop: "10px"
  }

  function codeColor(isValide: boolean | undefined, isPaye: boolean | undefined): string {
    const natifStyle = "px-5 py-3 text-start"
    if (!isValide && !isPaye) {
      return `bg-error-600 ${natifStyle} `
    }
    else if (isValide && !isPaye) {
      return `bg-warning-500 ${natifStyle}`
    }
    else {
      return `${natifStyle} `
    }
  }

  return (
    <>
      <div style={styleMenu}>
        <div style={{ alignItems: "center", justifyContent: "center", display: "flex", fontSize: 10 }}>
          <span className="bg-orange-300">Non payé</span>
          <span className="bg-red-500">Non validé</span>
        </div>
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
            <AgGridReact<ListeVente>
              rowData={ventes}
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
    </>
  );
}
