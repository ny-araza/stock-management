const BASE_URL = import.meta.env.VITE_BASE_URL

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${BASE_URL}${endpoint}`

    const defaultOptions: RequestInit = {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
    }

    const response = await fetch(url, defaultOptions);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.detail || 'An error occured');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any).response = { data: errorData }
        throw error;
    }
    return response.json();
}
