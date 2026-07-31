const UNITS = [
  "",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
  "dix-sept",
  "dix-huit",
  "dix-neuf",
];

const TENS = [
  "",
  "",
  "vingt",
  "trente",
  "quarante",
  "cinquante",
  "soixante",
  "soixante",
  "quatre-vingt",
  "quatre-vingt",
];

function convertBelowHundred(n: number): string {
  if (n < 20) return UNITS[n];

  const ten = Math.floor(n / 10);
  const unit = n % 10;

  switch (ten) {
    case 7:
      return `soixante-${convertBelowHundred(10 + unit)}`;
    case 8:
      return unit === 0
        ? "quatre-vingts"
        : `quatre-vingt-${UNITS[unit]}`;
    case 9:
      return `quatre-vingt-${convertBelowHundred(10 + unit)}`;
    default:
      if (unit === 0) return TENS[ten];
      if (unit === 1) return `${TENS[ten]} et un`;
      return `${TENS[ten]}-${UNITS[unit]}`;
  }
}

function convertBelowThousand(n: number): string {
  if (n < 100) return convertBelowHundred(n);

  const hundred = Math.floor(n / 100);
  const rest = n % 100;

  let result = "";

  if (hundred === 1) {
    result = "cent";
  } else {
    result = `${UNITS[hundred]} cent`;
    if (rest === 0) result += "s";
  }

  if (rest > 0) {
    result += ` ${convertBelowHundred(rest)}`;
  }

  return result;
}

function numberToWords(n: number): string {
  if (n === 0) return "zéro";

  const scales = [
    { value: 1_000_000_000, label: "milliard" },
    { value: 1_000_000, label: "million" },
    { value: 1_000, label: "mille" },
  ];

  let result = "";
  let remainder = n;

  for (const scale of scales) {
    const count = Math.floor(remainder / scale.value);

    if (count > 0) {
      if (scale.label === "mille" && count === 1) {
        result += "mille ";
      } else {
        result +=
          convertBelowThousand(count) +
          " " +
          scale.label +
          (count > 1 && scale.label !== "mille" ? "s" : "") +
          " ";
      }

      remainder %= scale.value;
    }
  }

  if (remainder > 0) {
    result += convertBelowThousand(remainder);
  }

  return result.trim();
}

export function montantTTCEnLettres(ttc: number): string {
  const entier = Math.floor(ttc);
  const centimes = Math.round((ttc - entier) * 100);

  let resultat = `${numberToWords(entier)} ariary`;

  if (centimes > 0) {
    resultat += ` et ${numberToWords(centimes)} centime${centimes > 1 ? "s" : ""}`;
  }

  return resultat.charAt(0).toUpperCase() + resultat.slice(1);
}

export default montantTTCEnLettres;