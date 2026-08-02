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
  RowClickedEvent,
  colorSchemeDarkBlue,
  colorSchemeLight,
  themeQuartz,
} from "ag-grid-community";
import { Modal } from "../../../components/ui/modal";
import { useModal } from "../../../hooks/useModal";

// ---- Types correspondant aux données reçues par ce composant ----
// (à déplacer dans interfaces/interfaces.ts si tu préfères centraliser)
export interface EntreeLigne {
  entl_id: number;
  entl_datecre: string;
  entl_datemdf: string | null;
  entl_usercre: string;
  entl_usermdf: string | null;
  entl_quantite: number;
  entl_prixunit: string;
  entl_ttc: string;
  entl_art_code: string;
  entl_pri_id: number;
  entl_tva: string;
  entl_ent_code: string;
  entl_ht: string;
  entl_fou_code: string;
  entl_lot: string;
  entl_dateper: string | null;
  entl_prix: string;
  entl_remise: string;
}

export interface Entree {
  ent_id: number;
  ent_code: string;
  ent_datecre: string;
  ent_datemdf: string | null;
  ent_usercre: string;
  ent_usermdf: string | null;
  ent_fou_code: string;
  ent_date: string;
  ent_facture: string;
  ent_datepay: string | null;
  ent_modepaye: string;
  ent_dateecheance: string | null;
  ent_montant_ht: string;
  ent_montant_ttc: string;
  ent_cmf_code: string;
  lignes: EntreeLigne[];
}

// Champs date côté backend (DateFilter / DateTimeFilter)
const DATE_FIELDS = new Set([
  "ent_datecre",
  "ent_datemdf",
  "ent_date",
  "ent_datepay",
  "ent_dateecheance",
]);

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

  const [granularity, setGranularity] = useState;
  DateGranularityModel["granularity"] > (model?.granularity ?? "day");
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

export default function EntreeTable() {
  const gridRef = useRef<AgGridReact<Entree>>(null);
  const [entrees, setEntrees] = useState<Entree[]>([]);
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
  const { closeModal, isOpen, openModal } = useModal();
  // --- Modal : entrée sélectionnée pour afficher le détail des lignes ---
  const [selectedEntree, setSelectedEntree] = useState<Entree | null>(null);

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

  const columnDefs = useMemo<ColDef<Entree>[]>(
    () => [
      {
        field: "ent_code",
        headerName: "Code",
        pinned: "left",
        filter: "agTextColumnFilter",
        suppressHeaderFilterButton: true,
      },
      {
        field: "ent_fou_code",
        headerName: "Fournisseur",
        filter: "agTextColumnFilter",
        suppressHeaderFilterButton: true,
      },
      {
        field: "ent_date",
        headerName: "Date entrée",
        filter: DateGranularityFilter,
        floatingFilter: false,
      },
      {
        field: "ent_datepay",
        headerName: "Date paiement",
        filter: DateGranularityFilter,
        floatingFilter: false,
      },
      {
        field: "ent_modepaye",
        headerName: "Mode de paiement",
        filter: "agTextColumnFilter",
        suppressHeaderFilterButton: true,
      },
      {
        field: "ent_facture",
        headerName: "Facture",
        filter: "agTextColumnFilter",
        suppressHeaderFilterButton: true,
      },
      {
        field: "ent_montant_ht",
        headerName: "Montant HT",
        filter: "agTextColumnFilter",
        suppressHeaderFilterButton: true,
      },
      {
        field: "ent_montant_ttc",
        headerName: "Montant TTC",
        filter: "agTextColumnFilter",
        suppressHeaderFilterButton: true,
      },
      {
        field: "ent_datecre",
        headerName: "Créée le",
        filter: DateGranularityFilter,
        floatingFilter: false,
        valueFormatter: (params) => formatDate(params.value),
      },
      {
        field: "ent_usercre",
        headerName: "Créé par",
        filter: "agTextColumnFilter",
        suppressHeaderFilterButton: true,
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

  const fetchEntrees = useCallback(
    async (pageNumber = page, keyword = search, filters = filterParams) => {
      try {
        const query = new URLSearchParams(filters);
        query.set("page", String(pageNumber));
        if (keyword) query.set("search", keyword);

        const res = await apiFetch(`/api/entree_stock/?${query.toString()}`);

        if (res.status) {
          setEntrees(res.entree ?? res.articles); // adapte selon le nom de clé renvoyé par ton API
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
    fetchEntrees(page, search, filterParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onGridFilterChanged = (_event: FilterChangedEvent<Entree>) => {
    const model = gridRef.current?.api.getFilterModel() ?? {};
    const params = buildFilterParams(model);
    if (filterDebounce.current) clearTimeout(filterDebounce.current);
    filterDebounce.current = setTimeout(() => {
      setFilterParams(params);
      setPage(1);
      fetchEntrees(1, search, params);
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
    fetchEntrees(1, "", new URLSearchParams());
  };

  // --- Ouverture du modal au clic sur une ligne ---
  const onRowClicked = (event: RowClickedEvent<Entree>) => {
    if (event.data) setSelectedEntree(event.data);
    openModal();
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
            <AgGridReact<Entree>
              rowData={entrees}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              animateRows
              pagination={false}
              theme={myTheme}
              ref={gridRef}
              onFilterChanged={onGridFilterChanged}
              onRowClicked={onRowClicked}
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

      {/* Modal détail entrée */}
      <Modal
        showCloseButton={false}
        className="w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900"
        isOpen={selectedEntree ? true : false}
        onClose={() => setSelectedEntree(null)}
      >
        {selectedEntree && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setSelectedEntree(null)}
          >
            <div
              className="w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Entrée {selectedEntree.ent_code}
                </h2>
                <button
                  onClick={() => setSelectedEntree(null)}
                  className="text-gray-500 hover:text-gray-800 dark:hover:text-white text-2xl leading-none"
                  aria-label="Fermer"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-4 text-gray-600 dark:text-gray-300">
                <div>
                  <span className="font-medium">Fournisseur :</span>{" "}
                  {selectedEntree.ent_fou_code}
                </div>
                <div>
                  <span className="font-medium">Date :</span>{" "}
                  {selectedEntree.ent_date}
                </div>
                <div>
                  <span className="font-medium">Mode de paiement :</span>{" "}
                  {selectedEntree.ent_modepaye}
                </div>
                <div>
                  <span className="font-medium">Facture :</span>{" "}
                  {selectedEntree.ent_facture || "—"}
                </div>
                <div>
                  <span className="font-medium">Montant HT :</span>{" "}
                  {selectedEntree.ent_montant_ht}
                </div>
                <div>
                  <span className="font-medium">Montant TTC :</span>{" "}
                  {selectedEntree.ent_montant_ttc}
                </div>
              </div>

              <h3 className="font-medium mb-2 text-gray-800 dark:text-white">
                Lignes ({selectedEntree.lignes.length})
              </h3>
              <div className="overflow-x-auto border rounded-md dark:border-white/[0.05] dark:text-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-white/[0.03]">
                    <tr>
                      <th className="p-2 text-left">Article</th>
                      <th className="p-2 text-left">Quantité</th>
                      <th className="p-2 text-left">Prix unitaire</th>
                      <th className="p-2 text-left">Remise</th>
                      <th className="p-2 text-left">HT</th>
                      <th className="p-2 text-left">TTC</th>
                      <th className="p-2 text-left">Lot</th>
                      <th className="p-2 text-left">Péremption</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEntree.lignes.map((ligne) => (
                      <tr
                        key={ligne.entl_id}
                        className="border-t dark:border-white/[0.05]"
                      >
                        <td className="p-2">{ligne.entl_art_code}</td>
                        <td className="p-2">{ligne.entl_quantite}</td>
                        <td className="p-2">{ligne.entl_prixunit}</td>
                        <td className="p-2">{ligne.entl_remise}</td>
                        <td className="p-2">{ligne.entl_ht}</td>
                        <td className="p-2">{ligne.entl_ttc}</td>
                        <td className="p-2">{ligne.entl_lot || "—"}</td>
                        <td className="p-2">{ligne.entl_dateper ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
