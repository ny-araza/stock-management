import Select, { SingleValue, ActionMeta } from "react-select";
import Button from "../../ui/button/Button";

export interface BaseOption {
  value: string | number;
  label: string;
}

interface SelectFieldProps<T extends BaseOption> {
  label?: string;
  options: T[];
  value: T | null;
  onChange: (value: T | null) => void;
  placeholder?: string;
  isSearchable?: boolean;
  isDisabled?: boolean;
  className?: string;

  // Callback pour ouvrir le modal du composant parent
  onAddClick?: () => void;
}

export function SelectField<T extends BaseOption>({
  label,
  options,
  value,
  onChange,
  placeholder = "Sélectionnez...",
  isSearchable = true,
  isDisabled = false,
  className,
  onAddClick,
}: SelectFieldProps<T>) {
  const handleSelectChange = (
    newValue: SingleValue<T>,
    _actionMeta: ActionMeta<T>,
  ) => {
    onChange(newValue);
  };

  return (
    <div
      className={`dark:bg-dark-900 ${className ?? ""}`}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        width: "100%",
      }}
    >
      {label && <label className="dark:text-gray-400">{label}</label>}

      <div className="flex gap-2">
        <div className="flex-1 min-w-0">
          <Select<T>
            options={options}
            value={value}
            onChange={handleSelectChange}
            placeholder={placeholder}
            isSearchable={isSearchable}
            isDisabled={isDisabled}
            className="w-full"
          />
        </div>

        {onAddClick && (
          <Button type="button" className="h-[40px]" onClick={onAddClick}>
            +
          </Button>
        )}
      </div>
    </div>
  );
}
