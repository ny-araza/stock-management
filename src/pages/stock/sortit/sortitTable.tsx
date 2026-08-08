/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CSSProperties,
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { apiFetch } from "../../../services/api";
import Button from "../../../components/ui/button/Button";
import Pagination from "../../../components/ui/pagination/Pagination";
import "react-phone-number-input/style.css";
import { AgGridReact, CustomFilterProps, useGridFilter } from "ag-grid-react";
import {
  ColDef,
  FilterChangedEvent,
  colorSchemeDarkBlue,
  colorSchemeLight,
  themeQuartz,
} from "ag-grid-community";

// ---- Types correspondant aux données reçues par ce composant ----
// (à déplacer dans interfaces/interfaces.ts si tu préfères centraliser)

export interface LotType {
  lot_id: number;
  lot_datecre: string;
  lot_datemdf: string | null;
  lot_usercre: string;
  lot_usermdf: string | null;
  lot_enabled: number;
  lot_code: string;
  lot_dateper: string;
  lot_datefin: string | null;
  lot_datedeb: string | null;
  lot_art_code: string;
}

export interface SortitType {
  out_id: number;
  out_code: string;
  out_datecre: string;
  out_usercre: string;
  out_quantite: string;
  out_pri_id: string;
  out_art_code: string;
  out_out_motif: string | null;
  out_motif: string;
  out_lot_id: string | null;
  out_date: string;
  out_date_per: string;
  lot: LotType[];
}

// Champs date côté backend (DateFilter / DateTimeFilter)
const DATE_FIELDS = new Set(["out_datecre"]);

interface DateGranularityModel {
  granularity: "year" | "month" | "day";
  value: string; // "2023" | "2023-03" | "2023-03-13"
}

function DateGranularityFilter({
  model,
  onModelChange,
}: CustomFilterProps<any, any, DateGranularityModel>) {
  const doesFilterPass = () => true;
  useGridFilter({ doesFilterPass });

  const [granularity, setGranularity] = useState<
    DateGranularityModel["granularity"]
  >(model?.granularity ?? "day");
  const value = model?.value ?? "";

  const updateGranularity = (g: DateGranularityModel["granularity"]) => {
    setGranularity(g);
    onModelChange(null);
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
        onChange={(e) =>
          updateGranularity(
            e.target.value as DateGranularityModel["granularity"],
          )
        }
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

function buildFilterParams(filterModel: Record<string, any>): URLSearchParams {
  const params = new URLSearchParams();

  Object.entries(filterModel).forEach(([field, model]) => {
    if (!model) return;

    if (model.filterType === "text" && model.filter) {
      params.append(field, model.filter);
      return;
    }

    if (
      DATE_FIELDS.has(field) &&
      model &&
      typeof model === "object" &&
      "granularity" in model
    ) {
      const { granularity, value } = model as DateGranularityModel;
      if (!value) return;

      if (granularity === "year") {
        params.append(`${field}_year`, value);
      } else if (granularity === "month") {
        const [year, month] = value.split("-");
        params.append(`${field}_year`, year);
        params.append(`${field}_month`, String(Number(month)));
      } else if (granularity === "day") {
        params.append(field, value);
      }
      return;
    }
  });

  return params;
}

export default function SortitTable() {
  const gridRef = useRef<AgGridReact<SortitType>>(null);
  const [sortits, setSortits] = useState<SortitType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [hasPrevious, setHasPrevious] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark"),
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
    if (isDark) {
      return themeQuartz.withPart(colorSchemeDarkBlue).withParams({
        backgroundColor: "#101828",
        rowHoverColor: "#781d99",
      });
    } else {
      return themeQuartz.withPart(colorSchemeLight).withParams({
        rowHoverColor: "#cb92df",
      });
    }
  }, [isDark]);

  const [filterParams, setFilterParams] = useState<URLSearchParams>(
    new URLSearchParams(),
  );
  const filterDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const columnDefs = useMemo<ColDef<SortitType>[]>(
    () => [
      {
        field: "out_code",
        headerName: "Code",
        pinned: "left",
        filter: "agTextColumnFilter",
        suppressHeaderFilterButton: true,
      },
      {
        field: "out_quantite",
        headerName: "Quantité",
        filter: "agTextColumnFilter",
        suppressHeaderFilterButton: true,
      },
      {
        field: "out_pri_id",
        headerName: "PU",
        filter: "agTextColumnFilter",
        suppressHeaderFilterButton: true,
      },
      {
        field: "out_art_code",
        headerName: "Code Article",
        filter: "agTextColumnFilter",
        suppressHeaderFilterButton: true,
      },
      {
        field: "out_motif",
        headerName: "Motif",
        filter: "agTextColumnFilter",
        suppressHeaderFilterButton: true,
      },
      {
        field: "out_datecre",
        headerName: "Date de création",
        filter: DateGranularityFilter,
        floatingFilter: false,
        valueFormatter: (params) => formatDate(params.value),
      },
      {
        field: "out_usercre",
        headerName: "Creer par",
        filter: "agTextColumnFilter",
        suppressHeaderFilterButton: true,
      },
      {
        field: "out_date",
        headerName: "Date de création",
        filter: DateGranularityFilter,
        floatingFilter: false,
        valueFormatter: (params) => formatDate(params.value),
      },
      {
        headerName: "Date de péremption",
        valueGetter: (params) => {
          return params.data?.lot?.[0]?.lot_dateper ?? null;
        },
        floatingFilter: false,
        suppressHeaderFilterButton: true,
        valueFormatter: (params) => formatDate(params.value),
      },
    ],
    [],
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      floatingFilter: true,
      suppressFloatingFilterButton: true,
      resizable: true,
      minWidth: 150,
    }),
    [],
  );

  const fetchSortits = useCallback(
    async (pageNumber = page, keyword = search, filters = filterParams) => {
      try {
        const query = new URLSearchParams(filters);
        query.set("page", String(pageNumber));
        if (keyword) query.set("search", keyword);

        const res = await apiFetch(`/api/sortit_stock/?${query.toString()}`);

        if (res.status) {
          setSortits(res.sortie); // adapte selon le nom de clé renvoyé par ton API
          setHasNext(res.next !== null);
          setHasPrevious(res.previous !== null);
          setTotalCount(res.count);
          setTotalPages(res.total_pages);
        } else {
          throw new Error(res.message || "Une erreur est survenue");
        }
      } catch (err: any) {
        setError(err.message);
      }
    },
    [page, search, filterParams],
  );

  useEffect(() => {
    fetchSortits(page, search, filterParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onGridFilterChanged = (_event: FilterChangedEvent<SortitType>) => {
    const model = gridRef.current?.api.getFilterModel() ?? {};
    const params = buildFilterParams(model);
    if (filterDebounce.current) clearTimeout(filterDebounce.current);
    filterDebounce.current = setTimeout(() => {
      setFilterParams(params);
      setPage(1);
      fetchSortits(1, search, params);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (filterDebounce.current) clearTimeout(filterDebounce.current);
    };
  }, []);

  const handleResetFilters = () => {
    gridRef.current?.api.setFilterModel(null);
    setFilterParams(new URLSearchParams());
    setSearch("");
    setPage(1);
    fetchSortits(1, "", new URLSearchParams());
  };

  if (error) return <div className="p-5 text-red-500">Erreur : {error}</div>;

  function formatDate(date: string): string {
    if (!date) {
      return "";
    }
    const temp = date.split("T");
    if (temp[1]) {
      const heure = temp[1].replace("Z", "");
      return `${temp[0]} à ${heure}`;
    }
    return temp[0] ?? "Format invalide";
  }

  const styleMenu: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    marginTop: "10px",
  };

  return (
    <>
      <div style={styleMenu}>
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
            <AgGridReact<SortitType>
              rowData={sortits}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              animateRows
              pagination={false}
              theme={myTheme}
              ref={gridRef}
              onFilterChanged={onGridFilterChanged}
              rowStyle={{ cursor: "pointer" }}
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
