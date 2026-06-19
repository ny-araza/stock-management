import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { apiFetch } from "./api";


export interface LoginPayload {
    use_login: string;
    use_pwd: string;
}

export interface User {
    user_id: number;
    use_login: string;
    use_acc_code: string;
    use_enabled: boolean;
}

interface AUthContextType {
    user: User | null
    loading: boolean;
    login: (use_login: string, use_pwd: string) => Promise<{ success: boolean; message: string }>
    logout: () => Promise<void>
}

interface AuthProviderProps {
    children: ReactNode
}

const AuthContext = createContext<AUthContextType | undefined>(undefined)


export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true)

    //verifier la session au demarage (f5)
    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const data = await apiFetch('/api/me/');
                if (data.status) {
                    setUser(data.user)
                }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                setUser(null)
                
            }
            finally {
                setLoading(false)
            }
        }
        checkAuthStatus();
    }, []);

    //connexion
    const login = async (use_login: string, use_pwd: string) => {
        try {
            const res = await apiFetch('/api/login/', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({use_login, use_pwd}),
            })

            if (res.status) {
                setUser(res.user)
                return { success: true , message: "Athentification réussie"}
            }

            return { success: false, message: "Erreur d'authentification" };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.detail|| error.message || "An error occured"
            }
        }
    };
    //deconnexion
    const logout = async () => {
        try {
            await apiFetch('/api/logout/', { method: 'POST' });
        } catch (error) {
            console.error("Erreur lors de la déconnexion", error);
        }
        finally {
            setUser(null);
        }
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

// 2. AJOUTER CE HOOK ICI pour récupérer facilement les données
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
    }
    return context;
};

