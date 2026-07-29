// shared/LineItemsTable.tsx
import { useState } from "react";

export interface LineColumn<T> {
    key: keyof T;
    label: string;
    placeholder?: string;
    type?: "text" | "number" | "date" | "select" | "custom";
    options?: { value: string | number; label: string }[];
    // rendu custom pour un champ (ex: input avec autocomplete)
    renderCell?: (props: {
        value: string;
        onChange: (value: string) => void;
        row: T;
        onPatch: (patch: Partial<T>) => void;
    }) => React.ReactNode;
}

interface LineItemsTableProps<T extends Record<string, any>> {
    columns: LineColumn<T>[];
    emptyLine: T;
    lines: T[];
    onLinesChange: (lines: T[]) => void;
    // permet de calculer des champs dérivés (ex: pri_pht = pu * quantite)
    computeDerived?: (line: T) => T;
    emptyMessage?: string;
}

export default function LineItemsTable<T extends Record<string, any>>({
    columns,
    emptyLine,
    lines,
    onLinesChange,
    computeDerived,
    emptyMessage = "Aucune ligne n'a encore été créée",
}: LineItemsTableProps<T>) {
    const [current, setCurrent] = useState<T>(emptyLine);

    const updateCurrent = (key: keyof T, value: string) => {
        setCurrent((prev) => {
            const next = { ...prev, [key]: value };
            return computeDerived ? computeDerived(next) : next;
        });
    };

    const addLine = () => {
        const isEmpty = Object.values(current).every((v) => v === "");
        if (isEmpty) return;
        onLinesChange([...lines, current]);
        setCurrent(emptyLine);
    };

    const updateLine = (index: number, key: keyof T, value: string) => {
        onLinesChange(
            lines.map((line, i) => {
                if (i !== index) return line;
                const next = { ...line, [key]: value };
                return computeDerived ? computeDerived(next) : next;
            })
        );
    };

    const removeLine = (index: number) => {
        onLinesChange(lines.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addLine();
        }
    };

    const renderInput = (
        col: LineColumn<T>,
        value: string,
        onChange: (v: string) => void,
        row: T,
        isHeaderRow: boolean
    ) => {
        if (col.renderCell) {
            return col.renderCell({ value, onChange, row });
        }
        if (col.type === "select") {
            return (
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={isHeaderRow
                        ? "w-full bg-transparent outline-none"
                        : "w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-2 py-1"}
                >
                    {col.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            );
        }
        return (
            <input
                type={col.type === "date" ? "date" : "text"}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={isHeaderRow ? handleKeyDown : undefined}
                placeholder={col.placeholder}
                className={isHeaderRow
                    ? "w-full bg-transparent placeholder-white/70 outline-none"
                    : "w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-2 py-1"}
                style={isHeaderRow ? { borderBottom: "1px solid gray" } : undefined}
            />
        );
    };

    return (
        <div className="overflow-x-auto h-100 rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-brand-500 text-white">
                        {columns.map((col) => (
                            <th key={String(col.key)} className="p-2 text-left font-medium relative">
                                {renderInput(col, String(current[col.key] ?? ""), (v) => updateCurrent(col.key, v), current, true)}
                            </th>
                        ))}
                        <th className="w-10 p-2 text-center">
                            <button type="button" onClick={addLine} className="text-white" title="Ajouter la ligne">
                                +
                            </button>
                        </th>
                    </tr>
                    <tr className="bg-brand-500 text-gray-200 text-xs">
                        {columns.map((col) => (
                            <th key={String(col.key)} className="p-2 text-left">{col.label}</th>
                        ))}
                        <th className="p-2"></th>
                    </tr>
                </thead>
                <tbody className="dark:bg-gray-900">
                    {lines.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length + 1} className="p-4 text-center text-gray-500 dark:text-gray-400">
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        lines.map((line, index) => (
                            <tr key={index} className="border-t border-gray-100 dark:border-gray-800 dark:text-white">
                                {columns.map((col) => (
                                    <td key={String(col.key)} className="p-2 relative">
                                        {renderInput(col, String(line[col.key] ?? ""), (v) => updateLine(index, col.key, v), line, false)}
                                    </td>
                                ))}
                                <td className="p-2 text-center">
                                    <button type="button" onClick={() => removeLine(index)} className="text-red-500" title="Supprimer la ligne">
                                        −
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
