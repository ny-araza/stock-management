import Select, { SingleValue, ActionMeta } from 'react-select';

// 1. Définir une interface de base obligatoire pour les options
export interface BaseOption {
    value: string | number;
    label: string;
}

// 2. Définir les Props du composant en utilisant un type Générique <T>
interface SelectFieldProps<T extends BaseOption> {
    label?: string;
    options: T[];
    value: T | null;
    onChange: (value: T | null) => void;
    placeholder?: string;
    isSearchable?: boolean;
    isDisabled?: boolean;
    className?: string
}

// 3. Déclarer le composant avec le type générique <T extends BaseOption>
export function SelectField<T extends BaseOption>({
    label,
    options,
    value,
    onChange,
    placeholder = "Sélectionnez...",
    isSearchable = true,
    isDisabled = false,
    className
}: SelectFieldProps<T>) {

    // Gestionnaire de changement typé pour react-select
    const handleSelectChange = (
        newValue: SingleValue<T>,
        _actionMeta: ActionMeta<T>
    ) => {
        onChange(newValue);
    };

    return (
        <div className="dark:bg-dark-900" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            {label && <label className="dark:text-gray-400">{label}</label>}
            <Select<T>
                options={options}
                value={value}
                onChange={handleSelectChange}
                placeholder={placeholder}
                isSearchable={isSearchable}
                isDisabled={isDisabled}
            />
        </div>
    );
}
