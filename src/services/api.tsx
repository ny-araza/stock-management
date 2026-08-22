const BASE_URL = import.meta.env.VITE_BASE_URL

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {},
  params?: Record<string, string>,
) => {
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const method = (options.method || "GET").toUpperCase();
  const isUnsafe = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
    
  };

  if (isUnsafe) {
    const csrfToken = getCookie("csrftoken");
    if (csrfToken) {
      (headers as Record<string, string>)["X-CSRFToken"] = csrfToken;
    }
  }

  const defaultOptions: RequestInit = {
    ...options,
    credentials: "include",
    headers,
  };
  const response = await fetch(url.toString(), defaultOptions);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.errors || "An error occured");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).response = { data: errorData };
    throw error;
  }
  return response.json();
};
