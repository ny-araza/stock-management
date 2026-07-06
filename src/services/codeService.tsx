import { apiFetch } from "./api";


export const generateReference = async (
    tableName: string,
    pkField: string
): Promise<string> => {
    const data = await apiFetch(
        "/api/generate-reference/",
        {method: "GET"},
        {
            table_name: tableName,
            pk_field: pkField
        }
    );

    return data.reference;
};