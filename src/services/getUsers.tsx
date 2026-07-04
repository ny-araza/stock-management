import type { User } from "../interfaces/interfaces";


const apiUrl: string = import.meta.env.VITE_API_URL

interface ApiUserResponse {
    status: boolean;
    message: string;
    users: User[];
}

export const api = {
    getUsers: async (): Promise<User[]> => {
        try {
            const res = await fetch(`${apiUrl}/users/`)

            if (!res.ok){
                throw new Error("An error occured while loading data")
            }

            const data: ApiUserResponse = await res.json();

            return data.users;
        } catch (error) {
            console.error("An erorr in getUsers : ", error);
            throw error;
        }
    }
}

export default api;