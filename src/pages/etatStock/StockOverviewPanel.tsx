// import React, { useMemo, useState } from "react";
// import { Search } from "lucide-react";
// import { StockArticle, getNiveauStock } from "./types";
// import { ArticleStockCard } from "./ArticleStockCard";
// import Pagination from "../../components/ui/pagination/Pagination"; // adapte le chemin si nécessaire

// interface StockOverviewPanelProps {
//   articles: StockArticle[];
//   title?: string;

//   // Pagination
//   page: number;
//   totalPages: number;
//   totalCount: number;
//   hasPrevious: boolean;
//   hasNext: boolean;
//   onPageChange: (page: number) => void;
//   // Recherche
//   search: string;
//   onSearchChange: (search: string) => void;
// }

// const ORDRE_NIVEAU: Record<string, number> = {
//   critique: 0,
//   faible: 1,
//   normal: 2,
//   excedent: 3,
// };

// export function StockOverviewPanel({
//   articles,
//   title = "État du stock",

//   page,
//   totalPages,
//   totalCount,
//   hasPrevious,
//   hasNext,
//   onPageChange,
// }: StockOverviewPanelProps) {
//   const [recherche, setRecherche] = useState("");

//   const articlesFiltres = useMemo(() => {
//     const terme = recherche.trim().toLowerCase();

//     const filtres = terme
//       ? articles.filter(
//           (a) =>
//             a.article_table?.art_nom?.toLowerCase().includes(terme) ||
//             a.stk_art_code?.toLowerCase().includes(terme),
//         )
//       : articles;

//     return [...filtres].sort(
//       (a, b) =>
//         ORDRE_NIVEAU[getNiveauStock(a)] - ORDRE_NIVEAU[getNiveauStock(b)],
//     );
//   }, [articles, recherche]);

//   const nbASurveiller = useMemo(
//     () =>
//       articles.filter((a) => {
//         const niveau = getNiveauStock(a);

//         return niveau === "critique" || niveau === "faible";
//       }).length,
//     [articles],
//   );

//   return (
//     <div className="w-full">
//       {/* En-tête */}
//       <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
//             {title}
//           </h2>

//           <p className="text-sm text-gray-500 dark:text-gray-400">
//             {nbASurveiller} article
//             {nbASurveiller > 1 ? "s" : ""} à surveiller
//           </p>
//         </div>

//         {/* Recherche */}
//         <div className="relative w-full sm:w-64">
//           <Search
//             size={17}
//             className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
//           />

//           <input
//             type="text"
//             value={recherche}
//             onChange={(e) => setRecherche(e.target.value)}
//             placeholder="Rechercher un article..."
//             className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-slate-400 focus:outline-none dark:border-white/[0.05] dark:bg-white/[0.03]"
//           />
//         </div>
//       </div>

//       {/* Liste des articles */}
//       <div className="flex flex-col gap-2">
//         {articlesFiltres.length === 0 ? (
//           <p className="py-8 text-center text-sm text-slate-400">
//             Aucun article ne correspond à votre recherche.
//           </p>
//         ) : (
//           articlesFiltres.map((article) => (
//             <ArticleStockCard key={article.stk_id} article={article} />
//           ))
//         )}
//       </div>

//       {/* Pagination */}
//       <Pagination
//         page={page}
//         totalPages={totalPages}
//         totalCount={totalCount}
//         hasPrevious={hasPrevious}
//         hasNext={hasNext}
//         onPageChange={onPageChange}
//       />
//     </div>
//   );
// }
import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { StockArticle, getNiveauStock } from "./types";
import { ArticleStockCard } from "./ArticleStockCard";
import Pagination from "../../components/ui/pagination/Pagination";

interface StockOverviewPanelProps {
  articles: StockArticle[];
  title?: string;

  // Pagination
  page: number;
  totalPages: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPageChange: (page: number) => void;

  // Recherche
  search: string;
  onSearchChange: (search: string) => void;
}

const ORDRE_NIVEAU: Record<string, number> = {
  critique: 0,
  faible: 1,
  normal: 2,
  excedent: 3,
};

export function StockOverviewPanel({
  articles,
  title = "État du stock",

  page,
  totalPages,
  totalCount,
  hasPrevious,
  hasNext,
  onPageChange,

  search,
  onSearchChange,
}: StockOverviewPanelProps) {
  const articlesTries = useMemo(() => {
    return [...articles].sort(
      (a, b) =>
        ORDRE_NIVEAU[getNiveauStock(a)] - ORDRE_NIVEAU[getNiveauStock(b)],
    );
  }, [articles]);

  const nbASurveiller = useMemo(
    () =>
      articles.filter((a) => {
        const niveau = getNiveauStock(a);

        return niveau === "critique" || niveau === "faible";
      }).length,
    [articles],
  );

  return (
    <div className="w-full">
      {/* En-tête */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {title}
          </h2>
        </div>

        {/* Recherche */}
        <div className="relative w-full sm:w-64">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un article..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-slate-400 focus:outline-none dark:border-white/[0.05] dark:bg-white/[0.03]"
          />
        </div>
      </div>

      {/* Liste */}
      <div className="flex flex-col gap-2">
        {articlesTries.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            Aucun article ne correspond à votre recherche.
          </p>
        ) : (
          articlesTries.map((article) => (
            <ArticleStockCard key={article.stk_id} article={article} />
          ))
        )}
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        onPageChange={onPageChange}
      />
    </div>
  );
}
