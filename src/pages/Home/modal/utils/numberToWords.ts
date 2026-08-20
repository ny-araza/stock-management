const UNITES = [
  "", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
  "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
  "dix-sept", "dix-huit", "dix-neuf",
];
const DIZAINES = [
  "", "dix", "vingt", "trente", "quarante", "cinquante", "soixante",
  "soixante-dix", "quatre-vingt", "quatre-vingt-dix",
];

function convertGroupUnder1000(n: number): string {
  if (n === 0) return "";
  let mots = "";
  const centaines = Math.floor(n / 100);
  const reste = n % 100;

  if (centaines > 0) {
    mots += centaines > 1 ? `${UNITES[centaines]} cent` : "cent";
    if (reste === 0 && centaines > 1) mots += "s";
    if (reste > 0) mots += " ";
  }

  if (reste > 0) {
    if (reste < 20) {
      mots += UNITES[reste];
    } else {
      const d = Math.floor(reste / 10);
      const u = reste % 10;
      if (d === 7 || d === 9) {
        mots += DIZAINES[d - 1];
        mots += u === 1 ? " et onze".replace("onze", UNITES[10 + u]) : `-${UNITES[10 + u]}`;
      } else {
        mots += DIZAINES[d];
        if (u === 1 && d !== 8) mots += " et un";
        else if (u > 0) mots += `-${UNITES[u]}`;
        if (d === 8 && u === 0) mots += "s";
      }
    }
  }
  return mots;
}

/**
 * Convertit un montant numérique en toutes lettres françaises, suivi de "Ariary".
 * Ex: 304498 -> "trois cent quatre mille quatre cent quatre-vingt-dix-huit Ariary"
 */
export function montantEnLettres(montant: number): string {
  const n = Math.round(Math.abs(montant));
  if (n === 0) return "zéro Ariary";

  const milliards = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const milliers = Math.floor((n % 1_000_000) / 1_000);
  const unites = n % 1_000;

  const parts: string[] = [];

  if (milliards > 0) {
    parts.push(
      milliards > 1
        ? `${convertGroupUnder1000(milliards)} milliards`
        : "un milliard",
    );
  }
  if (millions > 0) {
    parts.push(
      millions > 1
        ? `${convertGroupUnder1000(millions)} millions`
        : "un million",
    );
  }
  if (milliers > 0) {
    parts.push(
      milliers > 1 ? `${convertGroupUnder1000(milliers)} mille` : "mille",
    );
  }
  if (unites > 0) {
    parts.push(convertGroupUnder1000(unites));
  }

  return `${parts.join(" ").trim()} Ariary`;
}