import { useCallback, useEffect, useState } from "react";
import { Article } from "../interfaces/interfaces";
import { articleService } from "../services/articlesServices";}

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [filters, setFilters] = useState<Omit<ArticleParams, "page">>({});

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await articleService.getArticles({
        page,
        ...filters,
      });

      setArticles(response.articles);
      setTotalPages(response.total_pages);
      setTotalCount(response.count);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des articles",
      );
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Modifier les filtres et revenir à la première page
  const rechercher = (nouveauxFiltres: Omit<ArticleParams, "page">) => {
    setPage(1);
    setFilters(nouveauxFiltres);
  };

  // Pagination
  const pageSuivante = () => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  };

  const pagePrecedente = () => {
    setPage((prev) => Math.max(prev - 1, 1));
  };

  return {
    articles,
    loading,
    error,

    page,
    totalPages,
    totalCount,

    rechercher,
    setPage,
    pageSuivante,
    pagePrecedente,

    refresh: fetchArticles,
  };
}
