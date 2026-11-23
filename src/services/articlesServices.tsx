import { apiFetch } from "./api";
import { Article } from "../interfaces/interfaces";

export interface ArticleParams {
  page?: number;
  search?: string;
  art_enabled?: string;
  art_stockable?: string;
}

export interface ArticleResponse {
  status: boolean;
  message?: string;
  articles: Article[];
  count: number;
  total_pages: number;
  next: string | null;
  previous: string | null;
}

export const articleService = {
  async getArticles(params: ArticleParams = {}): Promise<ArticleResponse> {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, String(value));
      }
    });

    const res = await apiFetch(`/api/articles/?${query.toString()}`);

    if (!res.status) {
      throw new Error(res.message || "Impossible de récupérer les articles");
    }

    return res as ArticleResponse;
  },
};
