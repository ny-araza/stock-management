import { useMemo, useState } from "react";
import type { Menu } from "./types";

interface Props {
  menus: Menu[];
  value: Record<number, boolean>;
  onChange: (menuCode: number, acces: boolean) => void;
  onToggleAll: (acces: boolean) => void;
}

function Switch({
  checked,
  onClick,
}: {
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30 ${
        checked ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-600"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

export default function PermissionMatrix({
  menus,
  value,
  onChange,
  onToggleAll,
}: Props) {
  const [query, setQuery] = useState("");

  const granted = menus.filter((m) => value[m.men_code]).length;

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const map = new Map<string, Menu[]>();
    for (const m of menus) {
      if (q && !(m.men_desc ?? "").toLowerCase().includes(q)) continue;
      const key = m.men_vbox || "Général";
      map.set(key, [...(map.get(key) ?? []), m]);
    }
    return [...map.entries()];
  }, [menus, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrer les menus..."
          className="min-w-[200px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800 dark:bg-brand-500/15 dark:text-brand-300">
          {granted} / {menus.length} autorisés
        </span>
        <button
          type="button"
          onClick={() => onToggleAll(true)}
          className="rounded-md px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Tout autoriser
        </button>
        <button
          type="button"
          onClick={() => onToggleAll(false)}
          className="rounded-md px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Tout retirer
        </button>
      </div>

      {groups.map(([group, items]) => (
        <section key={group}>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            {group}
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {items.map((m) => {
              const on = !!value[m.men_code];
              return (
                <div
                  key={m.men_code}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition ${
                    on
                      ? "border-brand-300 bg-brand-50/60 dark:border-brand-500/30 dark:bg-brand-500/10"
                      : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {m.men_desc || `Menu ${m.men_code}`}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Code {m.men_code}
                    </p>
                  </div>
                  <Switch
                    checked={on}
                    onClick={() => onChange(m.men_code, !on)}
                  />
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {groups.length === 0 && (
        <p className="py-8 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
          Aucun menu trouvé
        </p>
      )}
    </div>
  );
}
