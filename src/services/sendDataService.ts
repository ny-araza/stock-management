import { apiFetch } from "./api";


export const postData = async (
    endpoint: string,
    table: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, any>
) => {
    return apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({
            table,
            data
        }),
    });
};