import { useState } from "react";

export function useForm<T extends object>(initialValues: T) {
    const [values, setValues] = useState<T>(initialValues);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        setValues((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const setField = <K extends keyof T>(field: K, value: T[K]) => {
        setValues((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const reset = () => setValues(initialValues);

    return {
        values,
        handleChange,
        setField,
        reset,
    };
}