import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { calculerPrix, PrixUnites } from "./articlesUtils";

export type UniteVente = "PIECE" | "GROS";

export interface PrixUnite {
  unite: UniteVente;
  actif: boolean;
  prix_achat: string;
  taux_marge: string; // en %
  tva: string; // en %
  colis: string; // facultatif
}

const LABELS: Record<UniteVente, string> = {
  PIECE: "Pièce",
  GROS: "Gros",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

interface Props {
  value: PrixUnites;
  onChange: (value: PrixUnites) => void;
}

export default function PrixUnitesSection({ value, onChange }: Props) {
  const nbActifs = Object.values(value).filter((u) => u.actif).length;

  const toggleUnite = (unite: UniteVente) => {
    // on garde au moins une unité de vente
    if (value[unite].actif && nbActifs === 1) return;
    onChange({
      ...value,
      [unite]: { ...value[unite], actif: !value[unite].actif },
    });
  };

  const updateField = (
    unite: UniteVente,
    field: keyof PrixUnite,
    val: string,
  ) => {
    onChange({ ...value, [unite]: { ...value[unite], [field]: val } });
  };

  return (
    <section className="mt-8 rounded-2xl border border-brand-200 p-4 dark:border-brand-500/30  sm:p-6">
      {/* En-tête + choix des unités */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h5 className="text-lg  dark:text-white">
            Unités de vente et tarifs
          </h5>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choisissez les unités proposées pour cet article, puis renseignez
            leurs prix.
          </p>
        </div>

        <div className="flex gap-2">
          {(Object.keys(LABELS) as UniteVente[]).map((unite) => {
            const actif = value[unite].actif;
            return (
              <button
                key={unite}
                type="button"
                onClick={() => toggleUnite(unite)}
                aria-pressed={actif}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  actif
                    ? "border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500"
                    : "border-brand-300 bg-white text-brand-700 hover:bg-brand-50 dark:border-brand-500/40 dark:bg-gray-900 dark:text-brand-300 dark:hover:bg-brand-500/10"
                }`}
              >
                {LABELS[unite]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Une carte par unité de vente active */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {(Object.keys(LABELS) as UniteVente[])
          .filter((unite) => value[unite].actif)
          .map((unite) => {
            const u = value[unite];
            const { marge, prixVente } = calculerPrix(u);
            return (
              <div
                key={unite}
                className="rounded-xl border bg-white p-4 shadow-sm dark:border-brand-500/30 dark:bg-gray-900"
              >
                <div className="mb-4 flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand-600 dark:bg-brand-400" />
                  <h6 className="font-semibold text-brand-700 dark:text-brand-300">
                    Unité de vente : {LABELS[unite]}
                  </h6>
                </div>

                <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div>
                    <Label>Prix d'achat</Label>
                    <Input
                      type="number"
                      name={`prix_achat_${unite}`}
                      value={u.prix_achat}
                      onChange={(e) =>
                        updateField(unite, "prix_achat", e.target.value)
                      }
                      placeholder="0.00"
                      min="0"
                      step={0.01}
                    />
                  </div>

                  <div>
                    <Label>Taux de marge (%)</Label>
                    <Input
                      type="number"
                      name={`taux_marge_${unite}`}
                      value={u.taux_marge}
                      onChange={(e) =>
                        updateField(unite, "taux_marge", e.target.value)
                      }
                      placeholder="ex : 20"
                      min="0"
                      step={0.01}
                    />
                  </div>

                  {/* Champs calculés automatiquement */}
                  <div>
                    <Label>Marge</Label>
                    <div className="flex h-11 items-center rounded-lg border border-brand-200 bg-brand-50 px-4 text-sm font-medium text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
                      {fmt(marge)}
                    </div>
                  </div>

                  <div>
                    <Label>Prix de vente</Label>
                    <div className="flex h-11 items-center rounded-lg border border-brand-300 bg-brand-100 px-4 text-sm font-semibold text-brand-800 dark:border-brand-500/40 dark:bg-brand-500/20 dark:text-brand-200">
                      {fmt(prixVente)}
                    </div>
                  </div>

                  <div>
                    <Label>TVA (%)</Label>
                    <Input
                      type="number"
                      name={`tva_${unite}`}
                      value={u.tva || "20"}
                      onChange={(e) => updateField(unite, "tva", e.target.value)}
                      placeholder="ex : 20"
                      min="0"
                      step={0.01}
                      
                    />
                  </div>

                  <div>
                    <Label>
                      Colis{" "}
                      <span className="text-xs font-normal text-gray-400 dark:text-gray-500">
                        (facultatif)
                      </span>
                    </Label>
                    <Input
                      type="number"
                      name={`colis_${unite}`}
                      value={u.colis}
                      onChange={(e) =>
                        updateField(unite, "colis", e.target.value)
                      }
                      placeholder="Quantité par colis"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}