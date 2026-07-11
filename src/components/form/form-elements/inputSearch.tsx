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
    onAdd?: () => void,

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
    onAdd
}: SelectFieldProps<T>) {

    // Gestionnaire de changement typé pour react-select
    const handleSelectChange = (
        newValue: SingleValue<T>,
        _actionMeta: ActionMeta<T>
    ) => {
        onChange(newValue);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            {label && <label>{label}</label>}
            <Select<T>
                options={options}
                value={value}
                onChange={handleSelectChange}
                placeholder={placeholder}
                isSearchable={isSearchable}
                isDisabled={isDisabled}
                noOptionsMessage={() => (
                    <div style={{ padding: 8 }}>
                        <div>Aucun résultat</div>

                        {onAdd && (
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    // Empêche react-select de fermer avant le clic
                                    e.preventDefault();
                                    onAdd();
                                }}
                                style={{
                                    marginTop: 8,
                                    width: "100%",
                                    padding: "6px",
                                    cursor: "pointer",
                                }}
                            >
                                + Ajouter
                            </button>
                        )}
                    </div>
                )}
            />
        </div>
    );
}
