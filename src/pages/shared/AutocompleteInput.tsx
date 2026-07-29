// shared/AutocompleteInput.tsx
import { useCallback, useEffect, useRef, useState } from "react";

interface AutocompleteInputProps<T> {
    value: string;
    onChangeText: (value: string) => void;
    onSelect: (item: T) => void;
    /** Fonction qui interroge l'API et retourne la liste de résultats */
    fetchSuggestions: (query: string) => Promise<T[]>;
    /** Comment afficher chaque suggestion dans la liste */
    renderSuggestion: (item: T) => React.ReactNode;
    /** Comment extraire une clé unique par suggestion (pour la prop key) */
    getKey: (item: T) => string | number;
    placeholder?: string;
    minChars?: number;     // nombre min de caractères avant de rechercher (défaut: 1)
    debounceMs?: number;   // délai anti-rafale (défaut: 300ms)
    className?: string;
    dropdownPosition?: "top" | "bottom"; // défaut: "bottom"
}

export default function AutocompleteInput<T>({
    value,
    onChangeText,
    onSelect,
    fetchSuggestions,
    renderSuggestion,
    getKey,
    placeholder,
    minChars = 1,
    debounceMs = 300,
    className,
    dropdownPosition = "bottom",
}: AutocompleteInputProps<T>) {
    const [suggestions, setSuggestions] = useState<T[]>([]);
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // évite d'afficher une réponse "en retard" si l'utilisateur a retapé entre-temps
    const requestIdRef = useRef(0);

    const search = useCallback(
        (query: string) => {
            if (query.trim().length < minChars) {
                setSuggestions([]);
                setShow(false);
                return;
            }

            const currentRequestId = ++requestIdRef.current;
            setLoading(true);

            fetchSuggestions(query)
                .then((results) => {
                    if (currentRequestId !== requestIdRef.current) return; // réponse obsolète, on ignore
                    setSuggestions(results);
                    setShow(results.length > 0);
                })
                .catch((err) => {
                    console.error(err);
                    setSuggestions([]);
                    setShow(false);
                })
                .finally(() => {
                    if (currentRequestId === requestIdRef.current) setLoading(false);
                });
        },
        [fetchSuggestions, minChars]
    );

    const handleChange = (v: string) => {
        onChangeText(v);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => search(v), debounceMs);
    };

    const handleSelect = (item: T) => {
        onSelect(item);
        setSuggestions([]);
        setShow(false);
    };

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    return (
        <div className="relative">
            <input
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShow(true)}
                onBlur={() => setTimeout(() => setShow(false), 150)} // laisse le temps au onClick de se déclencher
                placeholder={placeholder}
                className={className ?? "w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-2 py-1"}
            />
            {show && (
                <div
                    className={`absolute z-100 w-full bg-white border rounded shadow max-h-60 overflow-y-auto dark:bg-gray-800 ${
                        dropdownPosition === "top" ? "bottom-full mb-1" : "mt-1"
                    }`}
                >
                    {loading ? (
                        <div className="px-3 py-2 text-xs text-gray-400">Recherche...</div>
                    ) : (
                        suggestions.map((item) => (
                            <div
                                key={getKey(item)}
                                onMouseDown={(e) => e.preventDefault()} // évite que le onBlur ferme avant le onClick
                                onClick={() => handleSelect(item)}
                                className="cursor-pointer px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                {renderSuggestion(item)}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
