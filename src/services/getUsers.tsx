import type { UserFull } from "../interfaces/interfaces";

const apiUrl: string = import.meta.env.VITE_API_URL;

interface ApiUserResponse {
  status: boolean;
  message: string;
  users: UserFull[];
}

export const api = {
  getUsers: async (): Promise<UserFull[]> => {
    try {
      const res = await fetch(`${apiUrl}/users/`);

      if (!res.ok) {
        throw new Error("An error occured while loading data");
      }

      const data: ApiUserResponse = await res.json();

      return data.users;
    } catch (error) {
      console.error("An erorr in getUsers : ", error);
      throw error;
    }
  },
};

export default api;
