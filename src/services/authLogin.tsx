const apiUrl = import.meta.env.VITE_API_URL;

export interface LoginPayload {
    use_login: string;
    use_pwd: string;
}

export const authApi = {
    login: async (credentials: LoginPayload) => {
        try {
            const res = await fetch(`${apiUrl}/login/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(credentials),
            })

            const data = await res.json();

            if (!res.ok) {
                throw data;
            }

            return data;
        } catch (error) {
            console.error("Erreur de connexion:", error)
            throw error;
        }
    },

}
