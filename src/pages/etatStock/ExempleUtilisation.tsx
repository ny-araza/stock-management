// import React, { useEffect, useState } from "react";
// import { StockOverviewPanel, StockArticle } from "./index";
// import { apiFetch } from "../../services/api";
// import { useCallback } from "react";

// export default function ExempleUtilisation() {
//   const [articles, setArticles] = useState<StockArticle[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [page, setPage] = useState(1);

//   const [totalPages, setTotalPages] = useState(0);
//   const [totalCount, setTotalCount] = useState(0);
//   const [hasNext, setHasNext] = useState(false);
//   const [hasPrevious, setHasPrevious] = useState(false);
//   const [search, setSearch] = useState("");

//   const fetchStockData = useCallback(
//     async (pageNumber = page, keyword = search) => {
//       try {
//         const query = new URLSearchParams();

//         query.set("page", String(pageNumber));

//         if (keyword) {
//           query.set("search", keyword);
//         }

//         const res = await apiFetch(`/api/stock/?${query.toString()}`);

//         if (!res.status) {
//           throw new Error(res.message || "Erreur lors du chargement du stock");
//         }

//         setArticles(res.stock);

//         setPage(res.current_page);
//         setTotalPages(res.total_pages);
//         setTotalCount(res.count);

//         setHasNext(res.next !== null);
//         setHasPrevious(res.previous !== null);
//       } catch (err: any) {
//         console.error(err);
//       }
//     },
//     [page, search],
//   );

//   useEffect(() => {
//     fetchStockData(page, search);
//   }, [page]);

//   return (
//     <div className="mx-auto p-1">
//       <StockOverviewPanel
//         articles={articles}
//         title="État du stock — Articles"
//         page={page}
//         totalPages={totalPages}
//         totalCount={totalCount}
//         hasPrevious={hasPrevious}
//         hasNext={hasNext}
//         onPageChange={setPage}
//       />
//     </div>
//   );
// }

import React, { useCallback, useEffect, useState } from "react";
import { StockOverviewPanel } from "./StockOverviewPanel";

import { StockArticle } from "./types";
import { apiFetch } from "../../services/api";

export default function ExempleUtilisation() {
  const [articles, setArticles] = useState<StockArticle[]>([]);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStock = useCallback(
    async (pageNumber: number, searchValue: string) => {
      try {
        setLoading(true);
        setError(null);

        const query = new URLSearchParams();

        query.set("page", String(pageNumber));

        if (searchValue.trim()) {
          query.set("search", searchValue.trim());
        }

        const res = await apiFetch(`/api/stock/?${query.toString()}`);

        if (!res.status) {
          throw new Error(res.message || "Impossible de récupérer le stock");
        }

        setArticles(res.stock);

        setPage(res.current_page);
        setTotalPages(res.total_pages);
        setTotalCount(res.count);

        setHasNext(res.next !== null);
        setHasPrevious(res.previous !== null);
      } catch (err: any) {
        setError(err.message || "Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Chargement initial + changement de page
  useEffect(() => {
    fetchStock(page, search);
  }, [page, search, fetchStock]);

  // Recherche
  const handleSearchChange = (value: string) => {
    setSearch(value);

    // Lorsqu'une recherche commence,
    // on revient à la première page.
    console.log(value);
    setPage(1);
  };

  // Changement de page
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="mx-auto p-1">
      <StockOverviewPanel
        articles={articles}
        title="État du stock — Articles"

        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        onPageChange={handlePageChange}

        search={search}
        onSearchChange={handleSearchChange}
      />

      {loading && (
        <div className="mt-2 text-center text-sm text-gray-500">
          Chargement...
        </div>
      )}
    </div>
  );
}
